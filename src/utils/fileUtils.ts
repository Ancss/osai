import { invoke } from "@tauri-apps/api/tauri";

export const readFile = async (path: string): Promise<string> => {
  try {
    return await invoke("read_file", { path });
  } catch (error: any) {
    console.error("Error reading file:", error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

export const writeFile = async (
  path: string,
  content: string
): Promise<void> => {
  try {
    await invoke("write_file", { path, content });
  } catch (error: any) {
    console.error("Error writing file:", error);
    throw new Error(`Failed to write file: ${error.message}`);
  }
};

export const listFiles = async (path: string): Promise<string[]> => {
  try {
    return await invoke("list_files", { path });
  } catch (error: any) {
    console.error("Error listing files:", error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};
