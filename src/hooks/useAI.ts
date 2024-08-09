import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { AIResponse, OsaiError, aiProviders } from "../config/aiProviders";
import { useSettings } from "./useSettings";
import { invoke } from "@tauri-apps/api";
import { Message } from "@/type";

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { settings } = useSettings();
  const cancelFlagRef = useRef<any>(null);

  const sendMessage = useCallback(
    async (messages: Message[]): Promise<AIResponse> => {
      setIsLoading(true);

      try {
        const provider = aiProviders.find(
          (p) => p.name === settings.AI_PROVIDER
        );
        if (!provider) {
          throw new Error(`AI provider ${settings.AI_PROVIDER} not found`);
        }
        const apiKey = settings[`${settings.AI_PROVIDER}_API_KEY`];
        if (!apiKey) {
          throw new Error(
            `API key for ${settings.AI_PROVIDER} not set, Open settings and set the API key`
          );
        }
        cancelFlagRef.current = await invoke("create_cancel_flag");

        const response = await provider.sendMessage({
          model: settings.AI_MODEL,
          apiKey,
          flagId: cancelFlagRef.current,
          messages: messages,
        });
        return response;
      } catch (error) {
        console.error(
          `Error sending message to ${settings.AI_PROVIDER}:`,
          error
        );
        const osaiError = error as OsaiError;
        if (
          osaiError.message?.includes("API key for") ||
          osaiError.response?.status === 401
        ) {
          throw new Error("Open settings and set the API key");
        }
        switch (osaiError.response?.status) {
          case 400:
            throw new Error(t("badRequestError")!);
          case 429:
            throw new Error(t("rateLimitError")!);
          case 500:
            throw new Error(t("serverError")!);
          default:
            throw new Error(t("unknownError")!);
        }
      } finally {
        setIsLoading(false);
        cancelFlagRef.current = null;
      }
    },
    [settings, t]
  );
  const executeCode = useCallback(
    async (code: string): Promise<{ success: boolean; output: string }> => {
      try {
        const result: string = await invoke("execute_code", { code });
        return { success: true, output: result };
      } catch (error: any) {
        console.error("Error executing code:", error);
        return { success: false, output: error.toString() };
      }
    },
    []
  );
  const abortRequest = useCallback(async () => {
    if (cancelFlagRef.current) {
      await invoke("cancel_request", { flagId: cancelFlagRef.current });
      cancelFlagRef.current = null;
      setIsLoading(false);
    }
  }, []);
  return { sendMessage, isLoading, abortRequest, executeCode };
};
