import {
  register,
  unregister,
  isRegistered,
} from "@tauri-apps/api/globalShortcut";
import { useEffect } from "react";

export default function useHotkey(shortcut: string, callback: () => void) {
  useEffect(() => {
    const registerHotkey = async () => {
      try {
        if (await isRegistered(shortcut)) {
          await unregister(shortcut);
        }
        await register(shortcut, callback);
      } catch (error) {
        console.error(`Failed to register hotkey ${shortcut}:`, error);
      }
    };

    registerHotkey();

    return () => {
      unregister(shortcut).catch((error) => {
        console.error(`Failed to unregister hotkey ${shortcut}:`, error);
      });
    };
  }, [shortcut, callback]);
}
