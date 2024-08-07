import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Mic,
  Send,
  ChevronDown,
  Settings,
  AlertTriangle,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAI } from "../hooks/useAI";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useTranslation } from "react-i18next";
import SettingsModal from "./SettingsModal";
import { readFile, writeFile, listFiles } from "../utils/fileUtils";
import i18n from "i18next";
import { Textarea } from "./ui/textarea";
import {
  MAX_CHARS,
  MAX_TEXTAREA_HEIGHT,
  MIN_TEXTAREA_HEIGHT,
} from "@/utils/constants";
import { cn } from "@/lib/utils";

const OsaiApp = ({
  setIsExpanded,
}: {
  setIsExpanded: (b: boolean) => void;
}) => {
  // const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ type: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { sendMessage, isLoading } = useAI();
  const { startListening, stopListening, transcript } = useSpeechRecognition();
  const messageEndRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    document.documentElement.classList.toggle("dark", mediaQuery.matches);

    const handler = () =>
      document.documentElement.classList.toggle("dark", mediaQuery.matches);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  useEffect(() => {
    setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleExpansion = () => setIsExpanded(false);

  const handleSend = async () => {
    console.log("handleSend", input);
    if (input.trim()) {
      const userMessage = { type: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      try {
        const aiResponse = await sendMessage(input);
        setMessages((prev) => [...prev, { type: "ai", content: aiResponse }]);
      } catch (error) {
        setError(t("aiResponseError")!);
        console.error("Error getting AI response:", error);
      }
    }
  };

  const handleFileOperation = async (operation, ...args) => {
    try {
      let result;
      switch (operation) {
        case "read":
          result = await readFile(...args);
          break;
        case "write":
          await writeFile(...args);
          break;
        case "list":
          result = await listFiles(...args);
          break;
        default:
          throw new Error("Invalid operation");
      }
      return result;
    } catch (error) {
      setError(t("fileOperationFailed")!);
      console.error("File operation failed:", error);
    }
  };

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 transition-all duration-300 ease-in-out ${"w-96 h-[32rem]"}`}
      >
        <Card className="w-full h-full overflow-hidden shadow-lg">
          <CardContent className="flex flex-col h-full p-0">
            {
              <>
                <div className="flex justify-between items-center p-2 border-b bg-gray-50 dark:bg-gray-800">
                  <h2 className="text-lg font-bold">Osai</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        i18n.changeLanguage(
                          i18n.language === "en" ? "zh" : "en"
                        )
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

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex ${
                          msg.type === "user" ? "flex-row-reverse" : "flex-row"
                        } items-end space-x-2 w-full`}
                      >
                        <Avatar
                          className={`w-8 h-8 ${
                            msg.type === "user" ? "ml-2" : "mr-2"
                          }`}
                        >
                          <AvatarFallback>
                            {msg.type === "user" ? "U" : "AI"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.type === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>

                <BottomInputContainer
                  input={input}
                  isLoading={isLoading}
                  startListening={startListening}
                  stopListening={stopListening}
                  handleSend={handleSend}
                  setInput={setInput}
                ></BottomInputContainer>
              </>
            }
          </CardContent>
        </Card>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

const BottomInputContainer = ({
  isLoading,
  input,
  stopListening,
  startListening,
  handleSend,
  setInput,
}: {
  input: string;
  isLoading: boolean;
  stopListening: () => void;
  startListening: () => void;
  handleSend: () => void;
  setInput: (s: string) => void;
}) => {
  const { t } = useTranslation();
  const { transcript } = useSpeechRecognition();
  const { sendMessage } = useAI();
  const [error, setError] = useState(null);
  const handleVoiceInput = () => {
    if (transcript) {
      stopListening();
    } else {
      startListening();
    }
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setInput(value);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = input === "" ? 45 : textarea.scrollHeight;
    const lines = scrollHeight / 45;
    const newRows = Math.max(1, Math.min(10, Math.floor(lines)));

    textarea.style.height = `${newRows * 45}px`;
  };
  useEffect(adjustHeight, [input]);
  return (
    <div className=" bg-gray-50 dark:bg-gray-800">
      <div className="flex p-2 items-end space-x-2 bg-white dark:bg-gray-700 rounded-2 overflow-hidden shadow-inner">
        <Button
          variant="ghost"
          className="rounded-full min-w-10 p-2"
          onClick={handleVoiceInput}
        >
          <Mic size={16} className={transcript ? "text-red-500" : ""} />
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          placeholder={t("typeMessage")!}
          className={cn(
            "flex-grow border-none bg-transparent focus:ring-0 focus:outline-none resize-none",
            "min-h-[2.5rem] py-2 px-3 text-base leading-relaxed",
            "scrollbar scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
            "scrollbar-track-transparent scrollbar-thin hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500",
            "!border-none focus-visible:ring-0 focus-visible:outline-none"
          )}
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          className="rounded-full min-w-10 p-2"
          onClick={handleSend}
          disabled={isLoading}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
export default OsaiApp;
