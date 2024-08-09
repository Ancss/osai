import { useState, useEffect } from "react";

export const useSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load settings from localStorage on component mount
    const storedSettings = localStorage.getItem("app_settings");
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const setSetting = (key: string, value: string) => {
    setSettings((prevSettings) => {
      const newSettings = { ...prevSettings, [key]: value };
      localStorage.setItem("app_settings", JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const getSetting = (key: string): string => {
    const storedSettings = localStorage.getItem("app_settings");
    const parsedSettings = storedSettings ? JSON.parse(storedSettings) : {};
    return parsedSettings[key] || "";
  };
  return { settings, setSetting, getSetting };
};
