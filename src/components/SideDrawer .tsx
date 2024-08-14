import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronLeftIcon, ChevronRight } from "lucide-react";
import {
  LogicalPosition,
  LogicalSize,
  PhysicalSize,
  appWindow,
} from "@tauri-apps/api/window";
import {
  availableMonitors,
  primaryMonitor,
  PhysicalPosition,
} from "@tauri-apps/api/window";
import OsaiApp from "./OsaiApp";
import osaiLogo from "@/assets/osai-logo.svg";

const SideDrawer = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const updateSizeAndPosition = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      const currentMonitor = monitors[0] ||
        primary || { size: { width: 1920, height: 1080 }, scaleFactor: 1 };
      console.log("Current monitor:", currentMonitor);
      const { scaleFactor } = currentMonitor;
      const { width: screenWidth, height: screenHeight } = currentMonitor.size;

      // 使用物理像素
      if (isExpanded) {
        const expandedWidth = Math.max(
          Math.round((screenWidth / 1920) * 375 * scaleFactor),
          375
        );
        console.log("Expanded width:", expandedWidth);
        // const expandedWidth = Math.round(screenWidth * 0.2) - 16;
        const expandedHeight = Math.round((screenHeight * 0.7) / scaleFactor);
        await appWindow.setSize(
          new PhysicalSize(expandedWidth, expandedHeight)
        );

        const posX = screenWidth - expandedWidth - 8;
        const posY = Math.round((screenHeight * 0.2) / scaleFactor);
        await appWindow.setPosition(new PhysicalPosition(posX, posY));
      } else {
        const collapsedWidth = 40 * scaleFactor;
        const collapsedHeight = 32 * scaleFactor;
        await appWindow.setSize(
          new PhysicalSize(collapsedWidth, collapsedHeight)
        );

        const posX = screenWidth - collapsedWidth;
        const posY = Math.round(screenHeight * 0.6);
        await appWindow.setPosition(new PhysicalPosition(posX, posY));
      }
    };

    updateSizeAndPosition();
  }, [isExpanded]);

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`h-full flex ${
        isExpanded ? "w-full" : "w-10 h-10"
      } transition-all duration-300 ease-in-out`}
    >
      <button
        onClick={toggleDrawer}
        className={`w-10 h-full flex items-center justify-center  hover:bg-blue-100 transition-colors  ${
          !isExpanded ? "" : "hidden"
        }`}
      >
        {/* {<ChevronLeftIcon size={24} />} */}
        <img src={osaiLogo} alt="OSAI Logo" width="32" height="32" />
      </button>
      <div
        className={`flex-1 p-4 overflow-y-auto ${isExpanded ? "" : "hidden"}`}
      >
        <OsaiApp isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>
    </div>
  );
};

export default SideDrawer;
