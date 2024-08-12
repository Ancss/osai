import React from "react";
import { Button } from "@/components/ui/button";

interface ProcessedFileInfo {
  path: string;
  name: string;
  extension: string | null;
  size: number;
  mime_type: string;
  summary?: string;
}

interface FileListDisplayProps {
  files: ProcessedFileInfo[];
  onRename: (file: ProcessedFileInfo) => void;
}

const FileListDisplay: React.FC<FileListDisplayProps> = ({
  files,
  onRename,
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mb-2">
      <h2 className="text-lg font-semibold mb-2">
        {files.length} file(s) selected
      </h2>
      {files.map((file, index) => (
        <div key={index} className="mb-4 p-2 bg-white dark:bg-gray-700 rounded">
          <h3 className="font-medium">{file.name}</h3>
          <p className="text-sm text-gray-500">Type: {file.mime_type}</p>
          <p className="text-sm text-gray-500">Size: {file.size} bytes</p>
          {file.summary && <p className="text-sm mt-2">{file.summary}</p>}
          <Button onClick={() => onRename(file)} className="mt-2">
            Rename
          </Button>
        </div>
      ))}
    </div>
  );
};

export default FileListDisplay;
