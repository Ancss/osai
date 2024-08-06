import { invoke } from "@tauri-apps/api/tauri";

export interface SearchResult {
  id: string;
  name: string;
  type: "file" | "app" | "web" | "command";
}

export async function search(query: string): Promise<SearchResult[]> {
  return await invoke("search", { query });
}
