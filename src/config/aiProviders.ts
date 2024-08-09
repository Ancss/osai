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
  should_execute_code: boolean;
  // confirmation_message: string;
  execution: string;
  response: string;
}

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "os_ai_assistant",
    description:
      "An AI assistant for executing PowerShell tasks and answering queries",
    input_schema: {
      type: "object",
      properties: {
        thought_process: {
          type: "string",
          description: "The AI's reasoning process for the given input",
        },
        plan: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "A list of steps planned to complete the task, even if execution is in one line",
        },
        user_confirmation_required: {
          type: "boolean",
          description:
            "True only if the task involves system modifications or accessing sensitive data",
        },
        should_execute_code: {
          type: "boolean",
          description:
            "True if the task requires executing PowerShell commands",
        },
        execution: {
          type: "string",
          description:
            "A single line of PowerShell code that executes all required actions for the task, or an empty string if not applicable",
        },
        response: {
          type: "string",
          description:
            "The final response to the user, including potential results or next steps, without inventing information",
        },
      },
      required: [
        "thought_process",
        "plan",
        "user_confirmation_required",
        "should_execute_code",
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
  const res = JSON.parse(response);
  console.log(`Response from Claude:`, res);
  return res.content[res.content.length - 1].input as AIResponse;

  // return JSON.parse(response.content[0].text) as AIResponse;
};

export const aiProviders: AIProvider[] = [
  {
    name: "Claude",
    sendMessage: sendMessageToAnthropic,
    models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229"],
    apiKeyLink: "https://console.anthropic.com/settings/keys",
  },
  // {
  //   name: "GPT",
  //   sendMessage: sendMessageToAnthropic,
  //   models: ["gpt-4", "gpt-3.5-turbo"],
  //   apiKeyLink: "https://platform.openai.com/account/api-keys",
  // },
];
