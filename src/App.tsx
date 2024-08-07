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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="App bg-transparent">
        <SideDrawer />
      </div>
    </ThemeProvider>
  );
}

export default App;
