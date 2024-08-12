use anyhow::Result;
use base64;
use calamine::{open_workbook_auto, DataType, Reader};
use docx_rs::read_docx;
use image::io::Reader as ImageReader;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::Cursor;
use std::io::Read;
use std::path::Path;
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
pub fn add_files(paths: Vec<String>) -> AddFilesResult {
    let mut result = AddFilesResult {
        successful: Vec::new(),
        failed: Vec::new(),
    };

    for path in paths {
        match process_file(&path) {
            Ok(file_info) => result.successful.push(file_info),
            Err(e) => {
                eprintln!("Error processing file {}: {}", path, e);
                result.failed.push(FailedFile {
                    path,
                    error: e.to_string(),
                });
            }
        }
    }

    result
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
        _ => Err(FileProcessingError::UnsupportedFileType),
    }
}

fn process_image(path: &Path) -> Result<FileContent, FileProcessingError> {
    let img = ImageReader::open(path)?.decode()?;
    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, image::ImageOutputFormat::Png)?;
    let base64 = base64::encode(buffer.into_inner());
    Ok(FileContent::Image(base64))
}

fn process_pdf(path: &Path) -> Result<FileContent, FileProcessingError> {
    // 注意：这里我们只读取PDF的内容，不进行实际的文本提取
    // 如果需要提取文本，您可能需要使用如 pdf-extract 这样的库
    let content = fs::read_to_string(path).map_err(|e| FileProcessingError::Pdf(e.to_string()))?;
    let summary = summarize_text(&content, 1000);
    Ok(FileContent::Text(summary))
}

fn process_docx(path: &Path) -> Result<FileContent, FileProcessingError> {
    let mut file = File::open(path)?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;

    let doc = read_docx(&buf).map_err(|e| FileProcessingError::Docx(e.to_string()))?;
    // let content = doc
    //     .paragraphs()
    //     .iter()
    //     .map(|p| p.text())
    //     .collect::<Vec<String>>()
    //     .join("\n");
    let content = doc.json().to_string();
    let summary = summarize_text(&content, 1000);
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
    let summary = summarize_text(&content, 1000);
    Ok(FileContent::Text(summary))
}

fn summarize_text(text: &str, max_length: usize) -> String {
    let words: Vec<&str> = text.split_whitespace().collect();
    let summary: String = words
        .iter()
        .take(max_length / 5)
        .cloned()
        .collect::<Vec<&str>>()
        .join(" ");
    summary.chars().take(max_length).collect()
}
