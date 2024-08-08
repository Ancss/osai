import Anthropic from "@anthropic-ai/sdk";
import { invoke, os } from "@tauri-apps/api";
import axios from "axios";
import { fetch, Body, ResponseType } from "@tauri-apps/api/http";

export interface OsaiError {
  type: string;
  message: string;
}
interface sendMessageParams {
  model: string;
  apiKey: string;
  flagId?: string;
  messages: Anthropic.Messages.MessageParam[];
}
export interface AIProvider {
  name: string;
  sendMessage: (params: sendMessageParams) => Promise<AIResponse>;
  models: string[];
  apiKeyLink: string;
}

export interface AIResponse {
  thought_process: string;
  plan: string[];
  user_confirmation_required: boolean;
  // confirmation_message: string;
  execution: Array<{
    step: string;
    code: string;
    result: string;
  }>;
  response: string;
}

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "format_response",
    description:
      "Format the AI's response into a specific JSON structure. This structure includes the AI's thought process, action plan, execution details, and final response. It also indicates whether user confirmation is required and provides a confirmation message if needed. This formatted response ensures consistent and structured communication between the AI system and the user interface.",
    input_schema: {
      type: "object",
      properties: {
        thought_process: { type: "string" },
        plan: { type: "array", items: { type: "string" } },
        user_confirmation_required: { type: "boolean" },
        // confirmation_message: { type: "string" },
        execution: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "string" },
              code: { type: "string" },
              result: { type: "string" },
            },
          },
        },
        response: { type: "string" },
      },
      required: [
        "thought_process",
        "plan",
        "user_confirmation_required",
        "execution",
        "response",
      ],
    },
  },
];
const sendMessageToAnthropic = async ({
  apiKey,
  messages,
  model,
  flagId,
}: sendMessageParams): Promise<AIResponse> => {
  // const anthropic = new Anthropic({ apiKey });
  // const response = await anthropic.messages.create(
  //   {
  //     model: "claude-3-5-sonnet-20240620", // https://docs.anthropic.com/en/docs/about-claude/models
  //     max_tokens: 8192,
  //     messages: messages,
  //     system: SYSTEM_PROMPT,
  //     tools: tools,
  //     tool_choice: { type: "tool", name: "format_response" },
  //   },
  //   {
  //     // https://github.com/anthropics/anthropic-sdk-typescript?tab=readme-ov-file#default-headers
  //     headers: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" },
  //     signal: signal,
  //   }
  // );
  const invokeParams = {
    apiKey,
    model: model || "claude-3-5-sonnet-20240620",
    tools,
    messages: messages,
    maxTokens: 8192,
    flagId: flagId,
  };
  console.log(`Sending message to Claude:`, invokeParams);
  const response = await invoke("send_message_to_anthropic", invokeParams);
  console.log(`Response from Claude:`, response);
  return response.data as AIResponse;

  // return JSON.parse(response.content[0].text) as AIResponse;
};

export const aiProviders: AIProvider[] = [
  {
    name: "Claude",
    sendMessage: sendMessageToAnthropic,
    models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229"],
    apiKeyLink: "https://console.anthropic.com/settings/keys",
  },
  {
    name: "GPT",
    sendMessage: sendMessageToAnthropic,
    models: ["gpt-4", "gpt-3.5-turbo"],
    apiKeyLink: "https://platform.openai.com/account/api-keys",
  },
];
