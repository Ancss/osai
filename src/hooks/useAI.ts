import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useTranslation } from "react-i18next";

interface OsaiError {
  type: string;
  message: string;
}

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const sendMessage = async (input: string) => {
    setIsLoading(true);
    try {
      const response = await invoke("process_user_input", {
        input,
        modelType: "claude",
      });
      console.log("Response from Claude:", response);
      return response as string;
    } catch (error) {
      console.error("Error sending message to Claude:", error);
      const osaiError = error as OsaiError;
      switch (osaiError.type) {
        case "Request":
          throw new Error(t("networkError")!);
        case "EnvVar":
          throw new Error(t("configurationError")!);
        case "UnexpectedAIResponse":
          throw new Error(t("aiResponseError")!);
        default:
          throw new Error(t("unknownError")!);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
