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
  execution: string;
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
  executionResult?: any;
}

export interface FileInfo {
  path: string;
  name: string;
  extension: string | null;
  size: number;
  content: string;
  mime_type: string;
  metadata?: {
    image_dimensions?: [number, number];
    audio_duration?: number;
  };
}

export interface ProcessedFileInfo extends FileInfo {
  summary?: string;
}
