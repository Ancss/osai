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
      unknownError: "An unknown error occurred",
      fileNotFound: "File not found",
      permissionDenied: "Permission denied",
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
      unknownError: "发生未知错误",
      fileNotFound: "文件未找到",
      permissionDenied: "权限被拒绝",
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
