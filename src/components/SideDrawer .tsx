import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronLeftIcon, ChevronRight } from "lucide-react";
import { appWindow } from "@tauri-apps/api/window";
import { PhysicalSize, PhysicalPosition } from "@tauri-apps/api/window";
import OsaiApp from "./OsaiApp";

const SideDrawer = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateSizeAndPosition = async () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      if (isExpanded) {
        await appWindow.setSize(new PhysicalSize(400, 528));
        await appWindow.setPosition(
          new PhysicalPosition(screenWidth - 400, screenHeight * 0.4)
        );
      } else {
        await appWindow.setSize(new PhysicalSize(40, 24));
        await appWindow.setPosition(
          new PhysicalPosition(screenWidth - 40, screenHeight * 0.6)
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
        <OsaiApp setIsExpanded={setIsExpanded} />
      </div>
    </div>
  );
};

export default SideDrawer;
