import React, { useEffect } from "react";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import SideDrawer from "./components/SideDrawer ";
import { appWindow } from "@tauri-apps/api/window";

function App() {
  useEffect(() => {
    appWindow.show();
  }, []);
  return (
    <ThemeProvider storageKey="vite-ui-theme">
      <div className="App bg-transparent min-h-screen dark:bg-gray-900 dark:text-white">
        <SideDrawer />
      </div>
    </ThemeProvider>
  );
}

export default App;
