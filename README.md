# OSAI: Intelligent Operating System Assistant

OSAI is an innovative AI assistant for operating systems, designed to enhance the user experience through natural language interaction. It integrates powerful AI capabilities to understand and execute various system-level tasks, providing users with an intelligent solution for operating system management and control.

[中文文档](./README.zh.md)

## Feature Showcase

### 1. Open YouTube and Search for AI

![open youtube](./public/openYoutube.gif)

### 2. Add System Notifications

![reminderstart](./public/reminderstart.gif)

#### Open System Notifications

![openreminder](./public/openreminder.gif)

### 3. Add, View, and Delete Environment Variables

![environmentvariable](./public/environmentvariable.gif)

## Upcoming Features

- **AI-Powered Multi-File Renaming**: Automatically generate meaningful names for batch files by analyzing their content using AI.
- **AI-Driven File Classification**: Intelligently identify file types and content for automatic organization and classification.
- **Voice Control Integration**: Support voice commands for a hands-free system control experience.

## Basic Usage Guide

To use OSAI, you need a Claude API key. Please [click here to obtain one](https://console.anthropic.com/settings/keys), then open the application and add it in the settings.

## Technical Requirements

- Node.js
- Rust
- Tauri CLI

## Installation Guide

1. Clone the project repository:
   ```
   git clone https://github.com/Ancss/osai.git
   ```
2. Navigate to the project directory:
   ```
   cd osai
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage Instructions

1. Start development mode:
   ```
   npm run tauri dev
   ```
2. Build for production:
   ```
   npm run tauri build
   ```
