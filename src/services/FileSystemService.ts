import { invoke } from "@tauri-apps/api/tauri";

export async function openFile(path: string): Promise<void> {
  await invoke("open_file", { path });
}

export async function getFilePreview(path: string): Promise<string> {
  return await invoke("get_file_preview", { path });
}
