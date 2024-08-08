import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      typeMessage: "Type a message...",
      settings: "Settings",
      autoStart: "Auto-start on system boot",
      darkMode: "Dark mode",
      errorOccurred: "An error occurred",
      retry: "Retry",
      fileOperationFailed: "File operation failed",
      aiResponseError: "Failed to get AI response",
      networkError: "Network error occurred",
      configurationError: "Configuration error",
      lackApiKey: "open settings and provide an API key",
      unknownError: "An unknown error occurred",
      fileNotFound: "File not found",
      permissionDenied: "Permission denied",
      aiProvider: "AI Provider",
      selectProvider: "Select an AI provider",
      aiModel: "AI Model",
      selectModel: "Select a model",
      apiKey: "API Key",
      enterApiKey: "Enter API key",
      apiKeyLocalStorage:
        "API key is stored locally and never sent to our servers.",
      getApiKeyFrom: "Get your API key from the",
      website: "website",
      requestAborted: "Request was aborted",
      approve: "Approve",
      reject: "Reject",
    },
  },
  zh: {
    translation: {
      typeMessage: "输入消息...",
      settings: "设置",
      autoStart: "系统启动时自动启动",
      darkMode: "深色模式",
      errorOccurred: "发生错误",
      retry: "重试",
      fileOperationFailed: "文件操作失败",
      aiResponseError: "获取 AI 响应失败",
      networkError: "发生网络错误",
      configurationError: "配置错误",
      lackApiKey: "打开设置并提供 API 密钥",
      unknownError: "发生未知错误",
      fileNotFound: "文件未找到",
      permissionDenied: "权限被拒绝",
      aiProvider: "AI 提供商",
      selectProvider: "选择 AI 提供商",
      aiModel: "AI 模型",
      selectModel: "选择一个模型",
      apiKey: "API 密钥",
      enterApiKey: "输入 API 密钥",
      apiKeyLocalStorage: "API 密钥存储在本地，绝不会发送到我们的服务器。",
      getApiKeyFrom: "获取您的 API 密钥来自",
      website: "网站",
      requestAborted: "请求被中止",
      approve: "批准",
      reject: "拒绝",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
