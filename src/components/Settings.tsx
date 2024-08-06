import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface Settings {
  search_paths: string[];
  hotkey: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    search_paths: [],
    hotkey: "CommandOrControl+Space",
  });

  useEffect(() => {
    // 加载设置
    invoke<Settings>("get_settings").then(setSettings);
  }, []);

  const handleSearchPathChange = (index: number, value: string) => {
    const newPaths = [...settings.search_paths];
    newPaths[index] = value;
    setSettings({ ...settings, search_paths: newPaths });
  };

  const handleAddSearchPath = () => {
    setSettings({ ...settings, search_paths: [...settings.search_paths, ""] });
  };

  const handleRemoveSearchPath = (index: number) => {
    const newPaths = settings.search_paths.filter((_, i) => i !== index);
    setSettings({ ...settings, search_paths: newPaths });
  };

  const handleHotkeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, hotkey: e.target.value });
  };

  const handleSave = async () => {
    try {
      await invoke("update_settings", { settings });
      alert("Settings saved successfully");
    } catch (error) {
      alert("Failed to save settings");
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <div className="mt-2">
        <h3 className="font-bold">Search Paths</h3>
        {settings.search_paths.map((path, index) => (
          <div key={index} className="flex mt-1">
            <input
              type="text"
              value={path}
              onChange={(e) => handleSearchPathChange(index, e.target.value)}
              className="flex-grow p-1 border rounded"
            />
            <button
              onClick={() => handleRemoveSearchPath(index)}
              className="ml-2 p-1 bg-red-500 text-white rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={handleAddSearchPath}
          className="mt-2 p-1 bg-green-500 text-white rounded"
        >
          Add Search Path
        </button>
      </div>
      <div className="mt-4">
        <h3 className="font-bold">Hotkey</h3>
        <input
          type="text"
          value={settings.hotkey}
          onChange={handleHotkeyChange}
          className="mt-1 p-1 border rounded"
        />
      </div>
      <button
        onClick={handleSave}
        className="mt-4 p-2 bg-blue-500 text-white rounded"
      >
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
