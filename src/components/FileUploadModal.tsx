import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileInfo } from "@/type";
import {
  X,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FileAudioIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "i18next";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileInfo[];
  setFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  files,
  setFiles,
}) => {
  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: FileInfo) => {
    const mimeType = file.mime_type.split("/")[0];
    const extension = file.extension?.toLowerCase();

    switch (mimeType) {
      case "image":
        return <ImageIcon size={20} className="text-blue-500" />;
      case "video":
        return <FileVideoIcon size={20} className="text-green-500" />;
      case "audio":
        return <FileAudioIcon size={20} className="text-purple-500" />;
      default:
        switch (extension) {
          case "pdf":
            return <FileTextIcon size={20} className="text-red-500" />;
          case "doc":
          case "docx":
            return <FileTextIcon size={20} className="text-blue-700" />;
          case "xls":
          case "xlsx":
            return <FileTextIcon size={20} className="text-green-700" />;
          case "ppt":
          case "pptx":
            return <FileTextIcon size={20} className="text-orange-500" />;
          default:
            return <FileIcon size={20} className="text-gray-500" />;
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] w-[90%]">
        <DialogHeader>
          <DialogTitle>
            {t("uploadedFiles")} ({files.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full ">
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  {getFileIcon(file)}
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
