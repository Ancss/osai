export interface MessageContent {
  type: "text";
  text: string;
}

export interface Message {
  role: "user" | "assistant";
  content: MessageContent[];
}

export interface AIResponse {
  thought_process: string;
  plan: string[];
  user_confirmation_required: boolean;
  should_execute_code: boolean;
  execution: ExecutionStep[];
  response: string;
}

export interface ExecutionStep {
  step: string;
  code: string;
  result: string;
  status?: "pending" | "success" | "failure";
}

export interface ChatMessage extends Message {
  status?: "loading" | "complete";
  aiResponse?: AIResponse;
  executionStatus?: "pending" | "executing" | "complete" | "rejected";
}
