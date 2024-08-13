use anyhow::Result;
use base64;
use calamine::{open_workbook_auto, DataType, Reader};
use docx_rs::*;
use image::imageops::FilterType;
use image::io::Reader as ImageReader;
use image::GenericImageView;
use lopdf;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::Cursor;
use std::io::Read;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tauri::command;
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    path: String,
    name: String,
    extension: Option<String>,
    size: u64,
    mime_type: String,
    content: Option<FileContent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FileContent {
    Image(String),                 // Base64 encoded image
    Text(String),                  // Extracted text content
    Spreadsheet(Vec<Vec<String>>), // Simplified spreadsheet data
    StructuredData(String),        // JSON representation of structured data
}

#[derive(Debug, Serialize)]
pub struct AddFilesResult {
    successful: Vec<FileInfo>,
    failed: Vec<FailedFile>,
}

#[derive(Debug, Serialize)]
pub struct FailedFile {
    path: String,
    error: String,
}

#[derive(Error, Debug)]
pub enum FileProcessingError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Image processing error: {0}")]
    Image(#[from] image::error::ImageError),
    #[error("PDF processing error: {0}")]
    Pdf(String),
    #[error("DOCX processing error: {0}")]
    Docx(String),
    #[error("Excel processing error: {0}")]
    Excel(String),
    #[error("JSON processing error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Unsupported file type")]
    UnsupportedFileType,
    #[error("Other error: {0}")]
    Other(String),
}

#[command]
pub async fn add_files(paths: Vec<String>) -> AddFilesResult {
    let results: Vec<_> = paths
        .par_iter()
        .map(|path| {
            process_file(path).map_err(|error| FailedFile {
                path: path.clone(),
                error: error.to_string(),
            })
        })
        .collect();

    let (successful, failed): (Vec<_>, Vec<_>) = results.into_iter().partition(Result::is_ok);
    AddFilesResult {
        successful: successful.into_iter().map(Result::unwrap).collect(),
        failed: failed.into_iter().map(Result::unwrap_err).collect(),
    }
}

fn process_image(path: &Path) -> Result<FileContent, FileProcessingError> {
    let img = ImageReader::open(path)?.decode()?;

    let (width, height) = img.dimensions();
    let max_dimension = 1024.0;
    let scale = if width > height {
        max_dimension / width as f32
    } else {
        max_dimension / height as f32
    };

    let resized = if scale < 1.0 {
        img.resize(
            (width as f32 * scale) as u32,
            (height as f32 * scale) as u32,
            FilterType::Lanczos3,
        )
    } else {
        img
    };

    let mut buffer = Vec::new();
    resized.write_to(
        &mut std::io::Cursor::new(&mut buffer),
        image::ImageOutputFormat::Jpeg(80),
    )?;
    let base64 = base64::encode(&buffer);
    Ok(FileContent::Image(base64))
}

fn process_file(path: &str) -> Result<FileInfo, FileProcessingError> {
    let path = Path::new(path);
    let metadata = fs::metadata(path)?;

    let name = path
        .file_name()
        .ok_or_else(|| FileProcessingError::Other("Invalid file name".to_string()))?
        .to_str()
        .ok_or_else(|| FileProcessingError::Other("File name is not valid UTF-8".to_string()))?
        .to_string();

    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(String::from);

    let mime_type = mime_guess::from_path(path)
        .first_or_octet_stream()
        .to_string();

    let content = process_content(path, &mime_type)?;

    Ok(FileInfo {
        path: path
            .to_str()
            .ok_or_else(|| FileProcessingError::Other("Path is not valid UTF-8".to_string()))?
            .to_string(),
        name,
        extension,
        size: metadata.len(),
        mime_type,
        content: Some(content),
    })
}

fn process_content(path: &Path, mime_type: &str) -> Result<FileContent, FileProcessingError> {
    match mime_type {
        m if m.starts_with("image/") => process_image(path),
        "application/pdf" => process_pdf(path),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => {
            process_docx(path)
        }
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => process_xlsx(path),
        "application/json" => process_json(path),
        m if m.starts_with("text/") => process_text(path),
        _ => process_text(path),
    }
}

fn process_docx(path: &Path) -> Result<FileContent, FileProcessingError> {
    let mut file = File::open(path)?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;

    let docx = read_docx(&buf).map_err(|e| FileProcessingError::Docx(e.to_string()))?;
    let mut content = String::new();

    // 遍历文档的所有元素
    for child in docx.document.children.iter() {
        if let DocumentChild::Paragraph(paragraph) = child {
            for child in paragraph.children.iter() {
                if let ParagraphChild::Run(run) = child {
                    for child in run.children.iter() {
                        if let RunChild::Text(text) = child {
                            content.push_str(&text.text);
                            content.push(' ');
                        }
                    }
                }
            }
            content.push('\n');
        }
    }

    let summary = summarize_text(&content, None);
    Ok(FileContent::Text(summary))
}

fn process_pdf(path: &Path) -> Result<FileContent, FileProcessingError> {
    let content = pdf_extract::extract_text(path)
        .map_err(|e| FileProcessingError::Pdf(format!("Failed to extract PDF text: {}", e)))?;
    let summary = summarize_text(&content, None);
    Ok(FileContent::Text(summary))
}

fn process_xlsx(path: &Path) -> Result<FileContent, FileProcessingError> {
    let mut workbook =
        open_workbook_auto(path).map_err(|e| FileProcessingError::Excel(e.to_string()))?;
    let sheet_names = workbook.sheet_names().to_owned();
    let mut data = Vec::new();

    if let Some(Ok(range)) = workbook.worksheet_range(&sheet_names[0]) {
        for row in range.rows().take(50) {
            let row_data: Vec<String> = row
                .iter()
                .map(|cell| match cell {
                    DataType::Empty => String::new(),
                    DataType::String(s) => s.to_string(),
                    DataType::Float(f) => f.to_string(),
                    DataType::Int(i) => i.to_string(),
                    DataType::Bool(b) => b.to_string(),
                    _ => String::from("[Unsupported data type]"),
                })
                .collect();
            data.push(row_data);
        }
    }

    Ok(FileContent::Spreadsheet(data))
}

fn process_json(path: &Path) -> Result<FileContent, FileProcessingError> {
    let content = fs::read_to_string(path)?;
    let value: serde_json::Value = serde_json::from_str(&content)?;
    Ok(FileContent::StructuredData(value.to_string()))
}

fn process_text(path: &Path) -> Result<FileContent, FileProcessingError> {
    let content = fs::read_to_string(path)?;
    let summary = summarize_text(&content, None);
    Ok(FileContent::Text(summary))
}

fn summarize_text(text: &str, max_length: Option<usize>) -> String {
    match max_length {
        Some(max_len) => {
            let words: Vec<&str> = text.split_whitespace().collect();
            let summary: String = words
                .iter()
                .take(max_len / 5)
                .cloned()
                .collect::<Vec<&str>>()
                .join(" ");
            summary.chars().take(max_len).collect()
        }
        None => text.to_string(),
    }
}
