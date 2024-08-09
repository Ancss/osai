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
  StopCircle,
  Send,
} from "lucide-react";
import SettingsModal from "./SettingsModal";
import BottomInputContainer from "./BottomInputContainer";
import { AIResponse, ChatMessage, Message } from "@/type";
import i18n from "@/utils/i18n";

const OsaiApp = ({
  setIsExpanded,
}: {
  setIsExpanded: (b: boolean) => void;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const latestMessagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { sendMessage, isLoading, abortRequest, executeCode } = useAI();
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    latestMessagesRef.current = messages;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const toggleExpansion = () => setIsExpanded(false);

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage: ChatMessage = {
        role: "user",
        content: [{ type: "text", text: input }],
      };
      setMessages((prev) => [
        ...prev,
        newMessage,
        {
          role: "assistant",
          content: [{ type: "text", text: "..." }],
          status: "loading",
        },
      ]);
      setInput("");
      setError("");
      try {
        const aiResponse: AIResponse = await sendMessage([
          ...messages,
          newMessage,
        ]);
        const newAssistantMessage: ChatMessage = {
          role: "assistant",
          content: [{ type: "text", text: aiResponse.response }],
          aiResponse,
          status: "complete",
          executionStatus: aiResponse.user_confirmation_required
            ? "pending"
            : "executing",
        };
        setMessages((prev) => {
          const updatedMessages = [...prev.slice(0, -1), newAssistantMessage];
          latestMessagesRef.current = updatedMessages;
          if (!aiResponse.user_confirmation_required) {
            executeAIResponse(updatedMessages.length - 1);
          }
          return updatedMessages;
        });
      } catch (error: any) {
        setMessages((prev) => prev.slice(0, -2));
        setInput(newMessage.content[0].text);
        setError(
          error.message.includes("Open settings and set the API key")
            ? t("lackApiKey")!
            : t("aiResponseError")!
        );
        console.error("Error getting AI response:", error);
      }
    }
  };

  const executeAIResponse = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message.aiResponse && message.aiResponse.should_execute_code) {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[messageIndex] = {
          ...message,
          executionStatus: "executing",
        };
        return newMessages;
      });

      for (const step of message.aiResponse.execution) {
        if (!step.code) continue;
        const result = await executeCode(step.code);
        setMessages((prev) => {
          const newMessages = [...prev];
          const executionSteps =
            newMessages[messageIndex].aiResponse!.execution;
          const stepIndex = executionSteps.findIndex(
            (s) => s.step === step.step
          );
          executionSteps[stepIndex] = {
            ...step,
            status: result.success ? "success" : "failure",
            result: result.output,
          };
          return newMessages;
        });
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[messageIndex] = {
          ...message,
          executionStatus: "complete",
        };
        return newMessages;
      });
    }
  };

  const handleConfirmation = async (
    messageIndex: number,
    confirmed: boolean
  ) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex] = {
        ...newMessages[messageIndex],
        executionStatus: confirmed ? "executing" : "rejected",
      };
      return newMessages;
    });

    if (confirmed) {
      await executeAIResponse(messageIndex);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 transition-all duration-300 ease-in-out w-96 h-[32rem]">
        <Card className="w-full h-full overflow-hidden shadow-lg">
          <CardContent className="flex flex-col h-full p-0">
            <div className="flex justify-between items-center p-2 border-b bg-gray-50 dark:bg-gray-800">
              <h2 className="text-lg font-bold">Osai</h2>
              <div className="flex space-x-2">
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
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                      }`}
                    >
                      {msg.status === "loading" ? "..." : msg.content[0].text}
                    </div>
                  </div>
                  {msg.aiResponse?.user_confirmation_required &&
                    msg.executionStatus === "pending" && (
                      <div className="flex justify-center space-x-2 mt-2">
                        <Button onClick={() => handleConfirmation(index, true)}>
                          {t("approve")}
                        </Button>
                        <Button
                          onClick={() => handleConfirmation(index, false)}
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    )}
                  {/* {msg.aiResponse?.execution && (
                    <div className="mt-2">
                      {msg.aiResponse.execution
                        .filter((step) => !!step.code)
                        .map((step, stepIndex) => (
                          <ExecutionStepComponent key={stepIndex} step={step} />
                        ))}
                    </div>
                  )} */}
                </div>
              ))}
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
    </>
  );
};

export default OsaiApp;
