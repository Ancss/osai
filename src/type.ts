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

export interface ChatMessage extends AISendMessage {
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
  mime_type: string;
  content: FileContent | null;
}
type FileContent =
  | { Image: string }
  | { Text: string }
  | { Spreadsheet: string[][] }
  | { StructuredData: string };
export interface ProcessedFileInfo extends FileInfo {
  summary?: string;
}
type ImageSource = {
  type: "base64";
  media_type: string;
  data: string;
};

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "image"; source: ImageSource };

export interface AISendMessage {
  role: "user" | "assistant";
  content: MessageContent[];
}
