import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  MAX_CHARS,
  MIN_TEXTAREA_HEIGHT,
  MAX_TEXTAREA_HEIGHT,
} from "@/utils/constants";
import { Textarea } from "@chakra-ui/react";
import { cn } from "@/lib/utils";
import { Send, StopCircle } from "lucide-react";

const BottomInputContainer = ({
  isLoading,
  input,
  // stopListening,
  // startListening,
  handleSend,
  setInput,
  abortRequest,
}: {
  input: string;
  isLoading: boolean;
  // stopListening: () => void;
  // startListening: () => void;
  handleSend: () => void;
  setInput: (s: string) => void;
  abortRequest: () => void;
}) => {
  const { t } = useTranslation();
  const { transcript } = useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // const handleVoiceInput = () => {
  //   if (transcript) {
  //     stopListening();
  //   } else {
  //     startListening();
  //   }
  // };

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
    console.log("textarea.scrollHeight", textarea.scrollHeight);
    const scrollHeight = input === "" ? 45 : textarea.scrollHeight;
    const lines = scrollHeight / 45;
    const newRows = Math.max(1, Math.min(10, Math.floor(lines)));

    textarea.style.height = `${newRows * 45}px`;
  };

  useEffect(adjustHeight, [input]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800">
      <div className="flex p-2 items-end space-x-2 bg-white dark:bg-gray-700 rounded-2 overflow-hidden shadow-inner">
        {/* <Button
          variant="ghost"
          className="rounded-full min-w-10 p-2"
          onClick={handleVoiceInput}
        >
          <Mic size={16} className={transcript ? "text-red-500" : ""} />
        </Button>     */}
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
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          className="rounded-full min-w-10 p-2"
          onClick={isLoading ? abortRequest : handleSend}
        >
          {isLoading ? (
            <StopCircle size={16} className="text-red-500" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default BottomInputContainer;
