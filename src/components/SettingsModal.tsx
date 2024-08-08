import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import { aiProviders } from "../config/aiProviders";
import { Eye, EyeOff } from "lucide-react";
import { useTheme } from "./theme-provider";

const SettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { settings, setSetting } = useSettings();
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!settings.AI_PROVIDER) {
      setSetting("AI_PROVIDER", aiProviders[0].name);
    }
    if (!settings.AI_MODEL) {
      setSetting("AI_MODEL", aiProviders[0].models[0]);
    }
  }, []);

  useEffect(() => {
    console.log("Theme in SettingsModal:", theme);
  }, [theme]);
  const toggleTheme = () => {
    console.log("toggleTheme");
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleApiKeyVisibility = (providerName: string) => {
    setShowApiKey((prev) => ({ ...prev, [providerName]: !prev[providerName] }));
  };

  const handleProviderChange = (providerName: string) => {
    setSetting("AI_PROVIDER", providerName);
    const newProvider = aiProviders.find((p) => p.name === providerName);
    if (newProvider) {
      setSetting("AI_MODEL", newProvider.models[0]);
    }
  };

  const currentProvider = aiProviders.find(
    (p) => p.name === settings.AI_PROVIDER
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-start">{t("autoStart")}</Label>
            <Switch
              id="auto-start"
              checked={settings.autoStart === "true"}
              onCheckedChange={(checked) =>
                setSetting("autoStart", checked.toString())
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">{t("darkMode")}</Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-provider">{t("aiProvider")}</Label>
            <Select
              value={settings.AI_PROVIDER || ""}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger id="ai-provider">
                <SelectValue placeholder={t("selectProvider")} />
              </SelectTrigger>
              <SelectContent>
                {aiProviders.map((provider) => (
                  <SelectItem key={provider.name} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentProvider && (
            <div className="space-y-2">
              <Label htmlFor="ai-model">{t("aiModel")}</Label>
              <Select
                value={settings.AI_MODEL || ""}
                onValueChange={(value) => setSetting("AI_MODEL", value)}
              >
                <SelectTrigger id="ai-model">
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {currentProvider && (
            <div className="space-y-2">
              <Label htmlFor="api-key">{t("apiKey")}</Label>
              <div className="flex">
                <Input
                  id="api-key"
                  type={showApiKey[settings.AI_PROVIDER] ? "text" : "password"}
                  value={settings[`${settings.AI_PROVIDER}_API_KEY`] || ""}
                  onChange={(e) =>
                    setSetting(
                      `${settings.AI_PROVIDER}_API_KEY`,
                      e.target.value
                    )
                  }
                  placeholder={t("enterApiKey")}
                  className="flex-grow"
                />
                <button
                  onClick={() => toggleApiKeyVisibility(settings.AI_PROVIDER)}
                  className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {showApiKey[settings.AI_PROVIDER] ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <p>{t("apiKeyLocalStorage")}</p>
                <p>
                  {t("getApiKeyFrom")}{" "}
                  <a
                    href={currentProvider.apiKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {currentProvider.name} {t("website")}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
