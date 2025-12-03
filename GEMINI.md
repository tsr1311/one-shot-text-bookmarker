# GEMINI.md

## Project Overview

This is a Chrome extension called "One-Shot Bookmarker". Its purpose is to help users organize and archive their browser windows and tabs by saving them into a structured bookmark hierarchy with timestamp-based naming. The extension also generates an HTML overview file that summarizes all the saved tabs and windows.

### Main Technologies

*   **JavaScript:** The core logic of the extension is written in JavaScript.
*   **HTML/CSS:** Used for the popup interface and the generated overview file.
*   **Chrome Extension APIs:** The extension utilizes various Chrome APIs, including `chrome.bookmarks`, `chrome.tabs`, `chrome.storage`, `chrome.history`, `chrome.downloads`, `chrome.runtime`, `chrome.scripting`, `chrome.system.cpu`, `chrome.system.memory`, and `chrome.system.display`.

### Architecture

The extension is composed of the following main components:

*   **`manifest.json`:** Defines the extension's metadata, permissions, and entry points.
*   **`popup.html` and `popup.js`:** The user interface of the extension. It consists of a button to trigger the bookmarking process and a checkbox to enable/disable auto-downloading of tab content.
*   **`background.js`:** The service worker of the extension. It runs in the background and is responsible for tracking window and tab creation times, and fetching URL visit history.
*   **`utils.js`:** Contains helper functions for formatting timestamps, creating bookmark folders, generating the HTML overview, and downloading tab content.

## Building and Running

This is a Chrome extension, so there is no build process required. To run the extension, follow these steps:

1.  Clone or download this repository.
2.  Open Chrome/Brave browser and go to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right.
4.  Click "Load unpacked" and select the extension's directory.

## Development Conventions

*   **Code Style:** The JavaScript code follows a consistent style with 4-space indentation.
*   **Asynchronous Operations:** The code makes extensive use of `async/await` to handle asynchronous operations.
*   **Error Handling:** `try/catch` blocks are used to handle potential errors.
*   **Modularity:** The code is organized into separate files based on functionality (`popup.js`, `background.js`, `utils.js`).
