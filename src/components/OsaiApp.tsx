import React, { useState, useEffect, useRef } from "react";
import { useAI } from "../hooks/useAI";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  AlertTriangle,
  ChevronRightIcon,
  FolderPlus,
  FileIcon,
} from "lucide-react";
import SettingsModal from "./SettingsModal";
import BottomInputContainer from "./BottomInputContainer";
import FileUploadModal from "./FileUploadModal";
import { AIResponse, ChatMessage, FileInfo } from "@/type";
import i18n from "@/utils/i18n";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

const OsaiApp = ({
  setIsExpanded,
}: {
  setIsExpanded: (b: boolean) => void;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();
  const { sendMessage, isLoading, abortRequest, executeCode } = useAI();
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const setupListeners = async () => {
      const unlistenFileDrop = await listen<string[]>(
        "tauri://file-drop",
        (event) => {
          addFiles(event.payload);
          setIsDragging(false);
        }
      );

      const unlistenFileHover = await listen<null>(
        "tauri://file-drop-hover",
        () => {
          setIsDragging(true);
        }
      );

      const unlistenFileCancel = await listen<null>(
        "tauri://file-drop-cancelled",
        () => {
          setIsDragging(false);
        }
      );

      return () => {
        unlistenFileDrop();
        unlistenFileHover();
        unlistenFileCancel();
      };
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then((unlistenAll) => unlistenAll());
    };
  }, []);

  const toggleExpansion = () => setIsExpanded(false);

  const addFiles = async (paths: string[]) => {
    setError("");
    try {
      const result: { successful: FileInfo[]; failed: string[] } = await invoke(
        "add_files",
        { paths }
      );

      setSelectedFiles((prevFiles) => {
        const newFiles = result.successful.filter(
          (file) => !prevFiles.some((prevFile) => prevFile.path === file.path)
        );
        console.log("New files:", newFiles);
        console.log("Previous files:", prevFiles);
        return [...prevFiles, ...newFiles];
      });

      if (result.failed.length > 0) {
        console.warn("Failed to add some files:", result.failed);
        setError(
          `Warning: ${result.failed.length} file(s) couldn't be added. They might be corrupted or in an unsupported format.`
        );
      }

      if (result.successful.length > 0) {
        setIsFileUploadOpen(true);
      }
    } catch (error) {
      console.error("Error adding files:", error);
      setError(
        `Failed to add files: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleFileSelection = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: "All Files", extensions: ["*"] }],
      });
      console.log("Selected files:", selected);
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        await addFiles(paths);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
      setError("Failed to select files. Please try again.");
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage: ChatMessage = {
        role: "user",
        content: [{ type: "text", text: input }],
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      setError(null);

      try {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: [{ type: "text", text: "..." }],
            status: "loading",
          },
        ]);

        const aiResponse: AIResponse = await sendMessage([
          ...messages,
          newMessage,
        ]);

        let executionResult = null;
        if (!aiResponse.user_confirmation_required && aiResponse.execution) {
          executionResult = await executeCode(aiResponse.execution);
        }

        const newAssistantMessage: ChatMessage = {
          role: "assistant",
          content: [{ type: "text", text: aiResponse.response }],
          aiResponse,
          executionStatus: aiResponse.user_confirmation_required
            ? "pending"
            : "complete",
          executionResult,
        };

        setMessages((prev) => [...prev.slice(0, -1), newAssistantMessage]);
      } catch (error: any) {
        setMessages((prev) => prev.slice(0, -1));
        setInput(input);
        setError(
          error.message.includes("Open settings and set the API key")
            ? t("missingApiKey")!
            : t("aiResponseError")!
        );
        console.error("Error getting AI response:", error);
      }
    }
  };

  const handleConfirmation = async (
    messageIndex: number,
    confirmed: boolean
  ) => {
    if (confirmed) {
      const message = messages[messageIndex];
      if (message.aiResponse?.execution) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...message,
            executionStatus: "executing",
          };
          return newMessages;
        });

        const result = await executeCode(message.aiResponse.execution);

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...message,
            executionStatus: "complete",
            executionResult: result,
          };
          return newMessages;
        });
      }
    } else {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          executionStatus: "rejected",
        };
        return newMessages;
      });
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 transition-all duration-300 ease-in-out w-96 h-full">
        <Card className="w-full h-full overflow-hidden shadow-lg">
          <CardContent className="flex flex-col h-full p-0">
            <div className="flex justify-between items-center mt-4 p-2 border-b bg-gray-50 dark:bg-gray-800">
              <h2 className="text-lg font-bold">Osai</h2>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleFileSelection}>
                  <FolderPlus size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFileUploadOpen(true)}
                >
                  <FileIcon size={16} />
                  {selectedFiles.length > 0 && (
                    <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-2">
                      {selectedFiles.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en")
                  }
                >
                  {i18n.language === "en" ? "EN" : "中文"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleExpansion}>
                  <ChevronRightIcon size={16} />
                </Button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 relative">
              {isDragging && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center z-50">
                  <div className="text-2xl font-bold text-blue-500">
                    {t("DropFilesHere")}
                  </div>
                </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    } items-end space-x-2 w-full`}
                  >
                    <Avatar
                      className={`w-8 h-8 ${
                        msg.role === "user" ? "ml-2" : "mr-2"
                      }`}
                    >
                      <AvatarFallback>
                        {msg.role === "user" ? "U" : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[74%]">
                      <div
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                        } ${
                          msg.executionStatus === "rejected" ? "opacity-80" : ""
                        }`}
                      >
                        {msg.status === "loading" ? "..." : msg.content[0].text}
                      </div>
                      {msg.aiResponse?.user_confirmation_required &&
                        msg.executionStatus === "pending" && (
                          <div className="flex justify-center space-x-2 mt-2">
                            <Button
                              className="w-full"
                              onClick={() => handleConfirmation(index, true)}
                            >
                              {t("approve")}
                            </Button>
                            <Button
                              className="w-full"
                              onClick={() => handleConfirmation(index, false)}
                            >
                              {t("reject")}
                            </Button>
                          </div>
                        )}
                      {msg.executionResult && (
                        <div className="p-2 bg-gray-100 rounded flex text-sm text-gray-600 mt-2">
                          {t("ExecutionResult")}:
                          {msg.executionResult.success
                            ? t("success")
                            : t("failure")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div ref={messageEndRef} />
            </div>
            <BottomInputContainer
              input={input}
              isLoading={isLoading}
              handleSend={handleSend}
              setInput={setInput}
              abortRequest={abortRequest}
            />
          </CardContent>
        </Card>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <FileUploadModal
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        files={selectedFiles}
        setFiles={setSelectedFiles}
      />
    </>
  );
};

export default OsaiApp;
