# One-Shot Bookmarker
Helps you organize and archive your browser windows and tabs 
by bookmarking into a structured bookmark hierarchy with timestamp-based naming.

## Core Functionality

The extension saves all your open windows and tabs as bookmarks, organizing them into a hierarchical folder structure:
```
YYYYMMDD-HHMM___(n)win-(m)tab/              # Main folder with current date/time
├── YYYYMMDD___(k)tab_win1___FirstTabTitle/ # Window 1 folder with oldest tab's date
│   ├── YYYYMMDD_HHMMSS Tab1Title          # Individual tab bookmarks with their dates
│   └── YYYYMMDD_HHMMSS Tab2Title
├── YYYYMMDD___(j)tab_win2___FirstTabTitle/ # Window 2 folder
│   └── ...
└── bookmarks-overview.htm                  # HTML summary of all saved tabs
```

## Features

### Smart Timestamp System
The extension uses a sophisticated system to determine the most accurate dates for both folders and bookmarks:

#### Main Folder Names
- Uses the current date and time when saving
- Includes total count of windows and tabs
- Format: `YYYYMMDD-HHMM___(n)win-(m)tab`
  - Example: `20250918-1430___3win-12tab`

#### Window Folder Names
- Uses the date of the OLDEST tab in that window
- Includes number of tabs in the window
- Includes window number (win1, win2, etc.)
- Uses the title of the first tab in the window
- Format: `YYYYMMDD___(k)tab_winN___FirstTabTitle`
  - Example: `20250915___4tab_win1___GitHub`

#### Individual Tab Bookmarks
The extension determines tab timestamps in this priority order:
1. **URL Visit Time** (most accurate)
   - Fetched from browser history
   - Represents the first time you ever visited this URL
2. **Tab Creation Time** (fallback)
   - When the tab was created in the current session
   - Used if no history data is available
3. **Current Time** (last resort)
   - Only used if no other timestamp is available

Format: `YYYYMMDD_HHMMSS TabTitle`
Example: `20250915_143022 GitHub - My Repository`

### Advanced Features
- **Timestamp Tracking**: Maintains URL first visits, tab creation times, and window creation times
- **HTML Overview**: Generates a detailed summary file with:
  - Complete list of all saved windows and tabs
  - Original URLs and titles
  - Timestamp information and sources
  - Visual organization matching bookmark structure
- **Historical Context**: Window folders reflect when that group of tabs was first accessed
- **Organized Structure**: Clear hierarchy with window numbering and chronological ordering

## Installation

1. Clone or download this repository
2. Open Chrome/Brave browser and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this extension's directory

## Usage

1. Click the extension icon in your browser toolbar
2. Click the "Save All Windows and Tabs" button
3. All your open windows and tabs will be saved as bookmarks in a new folder named with today's date (YYYYMMDD)
4. Each window's tabs will be in a subfolder named with its creation date
5. Each bookmark will be prefixed with its tab's creation timestamp

