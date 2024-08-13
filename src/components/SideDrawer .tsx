import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronLeftIcon, ChevronRight } from "lucide-react";
import {
  LogicalPosition,
  LogicalSize,
  appWindow,
} from "@tauri-apps/api/window";
import {
  availableMonitors,
  primaryMonitor,
  PhysicalPosition,
} from "@tauri-apps/api/window";
import OsaiApp from "./OsaiApp";

const SideDrawer = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const updateSizeAndPosition = async () => {
      // 获取所有可用的显示器
      const monitors = await availableMonitors();
      // 获取主显示器
      const primary = await primaryMonitor();

      // 如果没有找到显示器，使用默认值
      const currentMonitor = monitors[0] ||
        primary || { size: { width: 1920, height: 1080 }, scaleFactor: 1 };

      const { scaleFactor } = currentMonitor;
      const { width: screenWidth, height: screenHeight } = currentMonitor.size;

      if (isExpanded) {
        await appWindow.setSize(
          new LogicalSize(
            screenWidth / scaleFactor - (screenWidth / scaleFactor) * 0.79,
            (screenHeight / scaleFactor) * 0.7
          )
        );
        await appWindow.setPosition(
          new LogicalPosition(
            screenWidth / scaleFactor - (screenWidth / scaleFactor) * 0.2,
            (screenHeight / scaleFactor) * 0.2
          )
        );
      } else {
        await appWindow.setSize(new LogicalSize(40, 24));
        await appWindow.setPosition(
          new LogicalPosition(
            screenWidth / scaleFactor - 40,
            (screenHeight / scaleFactor) * 0.6
          )
        );
      }
    };
    updateSizeAndPosition();
  }, [isExpanded]);

  useEffect(() => {
    const initPosition = async () => {
      const screenWidth = window.screen.width;
      await appWindow.setPosition(new PhysicalPosition(screenWidth - 40, 0));
    };
    initPosition();
  }, []);

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`h-full flex ${
        isExpanded ? "w-[300px]" : "w-[40px]"
      } transition-all duration-300 ease-in-out`}
    >
      <button
        onClick={toggleDrawer}
        className={`w-[40px] h-full  flex items-center justify-center  hover:bg-blue-100 transition-colors  ${
          !isExpanded ? "" : "hidden"
        }`}
      >
        {<ChevronLeftIcon size={24} />}
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
