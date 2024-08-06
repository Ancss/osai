import { invoke } from "@tauri-apps/api/tauri";

export async function executeCommand(command: string): Promise<string> {
  return await invoke("execute_command", { command });
}
