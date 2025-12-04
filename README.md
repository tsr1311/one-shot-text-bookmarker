# One-Shot Bookmarker
Helps you organize and archive your browser windows and tabs 
by bookmarking into a structured bookmark hierarchy with timestamp-based naming and tab group support.

## Core Functionality

The extension saves all your open windows and tabs as bookmarks, organizing them into a fully customizable hierarchical folder structure:

```
OSBed-Mac/20241204/                         # Customizable main folder (see template system below)
├── 20241204___(4)tab_win1___Window-Name/   # Window folder (uses window name or first tab title)
│   ├── Shopping/                           # Tab group folder (if tab belongs to a group)
│   │   └── Amazon-Electronics/             # Tab folder (based on tab title)
│   │       └── 20241204_143022 Amazon...   # Individual bookmark with timestamp
│   └── tab-123/                            # Ungrouped tab folder (using tab ID as fallback)
│       └── 20241204_150000 Gmail...
└── bookmarks-overview.htm                  # HTML summary with group information
```

## Features

### Configurable Main Folder Template (NEW)
Customize how your main bookmark folder is structured using template variables:

**Available Variables:**
- `{YYYYMMDD}` - Current date (e.g., 20241204)
- `{HHMM}` - Current time (e.g., 1430)
- `{OS-environment}` - OS descriptor (OSBed-Mac, OSBed-Win, OSBed-Linux)
- `{Window-Name}` - First window's name
- `{Group-Name}` - First tab group's name
- Custom text - Any text you type

**Default Template:** `{OS-environment}/{YYYYMMDD}/`
**Examples:**
- `Work/{YYYYMMDD}/{HHMM}/` → `Work/20241204/1430/`
- `{OS-environment}/Projects/{Window-Name}/` → `OSBed-Mac/Projects/My-Project/`
- `Archive/{YYYYMMDD}-{Group-Name}/` → `Archive/20241204-Research/`

The UI shows a live preview of your template with current values.

### Tab Groups Support (NEW)
Organize bookmarks and downloads by tab groups:

**Group-Aware Bookmarks:**
- Tabs in groups are organized under group folders
- Group names are used for folder names (or "Group-{id}" if unnamed)
- Ungrouped tabs are saved separately
- Structure: `MainFolder/WindowFolder/GroupFolder/TabFolder/Bookmark`

**Save Groups Only Filter:**
- Enable to save only tabs that belong to tab groups
- Ignores ungrouped tabs when enabled
- Shows warning if no grouped tabs are found
- Useful for focused archiving of organized work

**Group Context in Downloads:**
- Downloaded HTML files include `<!-- tab-context: GroupName -->` comments
- Matches bookmark folder structure for consistency
- Same hierarchy: downloads mirror bookmark organization

**Enhanced Overview HTML:**
- Groups tabs by their tab groups
- Shows group names with visual styling
- Displays member count for each group
- Highlights ungrouped tabs separately

### Tab-Level Folders (NEW)
Each tab now gets its own folder for better organization:

**Structure:**
- **Grouped tabs:** `MainFolder/WindowFolder/GroupFolder/TabFolder/Bookmark`
- **Ungrouped tabs:** `MainFolder/WindowFolder/TabFolder/Bookmark`

**Tab Folder Naming:**
- Uses tab title (sanitized and truncated to 24 chars)
- Falls back to `tab-{id}` if title is empty
- Same structure for both bookmarks and downloads

### Window Folder Naming (UPDATED)
**Priority order:**
1. Window name (if set via browser extensions or custom naming)
2. First tab's title
3. `win-{id}` (fallback using window ID)

Format: `YYYYMMDD___(k)tab_winN___WindowName`
Example: `20241204___(4)tab_win1___My-Project`

### Smart Timestamp System
The extension uses a sophisticated system to determine the most accurate dates for both folders and bookmarks:

#### Main Folder Names
- Uses template system (configurable)
- Default: Current date with OS environment descriptor
- Can include: date, time, OS, window names, group names, custom text
- Example: `OSBed-Mac/20241204/`

#### Window Folder Names
- Uses the date of the OLDEST tab in that window
- Includes number of tabs in the window
- Includes window number (win1, win2, etc.)
- Uses window name (if available), first tab title, or win-{id}
- Format: `YYYYMMDD___(k)tab_winN___WindowName`
  - Example: `20241204___(4)tab_win1___My-Project`

#### Tab Folder Names (NEW)
- Uses sanitized tab title (max 24 characters)
- Falls back to `tab-{id}` if title is empty
- Contains the actual bookmark
- Example: `Amazon-Electronics/` or `tab-123/`

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
Example: `20241204_143022 GitHub - My Repository`

### Advanced Features
- **Configurable Folder Structure**: Template-based main folder with live preview
- **Tab Groups Integration**: Organize by tab groups with filter option
- **Tab-Level Organization**: Each tab in its own folder
- **Timestamp Tracking**: Maintains URL first visits, tab creation times, and window creation times
- **HTML Overview**: Generates a detailed summary file with:
  - Complete list of all saved windows and tabs
  - Tab groups with member counts and visual styling
  - Original URLs and titles
  - Timestamp information and sources
  - Visual organization matching bookmark structure
- **Auto-Download Tab Contents**: Save full HTML of each tab with group context metadata
- **Synchronized Paths**: Downloads use same folder structure as bookmarks
- **Historical Context**: Window folders reflect when that group of tabs was first accessed
- **Organized Structure**: Clear hierarchy with window numbering, groups, and chronological ordering

## Settings

### Main Folder Template
Configure the path structure for your bookmarks and downloads:
- **Input**: Text field with template variables
- **Variables**: {YYYYMMDD}, {HHMM}, {OS-environment}, {Window-Name}, {Group-Name}
- **Preview**: Live preview showing resolved path
- **Default**: `{OS-environment}/{YYYYMMDD}/`

### Download Folder
Base path for downloaded HTML files (relative to Downloads folder):
- **Input**: Text field with optional Browse button
- **Example**: `Bookmarks` or `Work/Projects`
- **Result**: Files saved to `~/Downloads/[your-path]/[main-template]/[window]/[group]/[tab]/file.html`

### Download Options
- **Download bookmarks.html**: Save overview HTML file with all tabs (default: enabled)
- **Auto-download tab contents**: Save each tab as HTML file (default: disabled)
- **Save Groups Only**: Only save tabs in tab groups, ignore ungrouped tabs (default: disabled)

### Advanced Options
- **Organize in parent folders**: Create subfolder hierarchy (default: enabled)
  - Enabled: `basePath/mainFolder/windowFolder/groupFolder/tabFolder/file.html`
  - Disabled: Flat structure in base path only
- **CSS Selector**: Optional selector to save only specific page elements
- **Exclude Elements**: Comma-separated HTML tags to remove (e.g., `img, svg, script`)
- **Bookmark folder structure**: Choose organization pattern (default: Window → Group)

## Folder Structure Examples

### Full Hierarchy (with groups and tab folders)
```
~/Downloads/Bookmarks/OSBed-Mac/20241204/
└── 20241204___(8)tab_win1___Research-Project/
    ├── Research/                           # Tab group
    │   ├── Wikipedia-Article/              # Tab folder
    │   │   └── 20241204_140000 Wikipedia.html
    │   └── Scholar-Paper/
    │       └── 20241204_141000 Google Scholar.html
    └── Shopping/                           # Tab group
        └── Amazon-Product/                 # Tab folder
            └── 20241204_142000 Amazon.html
```

### Bookmarks Hierarchy
```
Bookmarks Bar/
└── OSBed-Mac/
    └── 20241204/
        └── 20241204___(8)tab_win1___Research-Project/
            ├── Research/                   # Tab group
            │   ├── Wikipedia-Article/      # Tab folder
            │   │   └── 20241204_140000 Wikipedia - Article Title
            │   └── Scholar-Paper/
            │       └── 20241204_141000 Google Scholar - Paper Name
            └── Shopping/
                └── Amazon-Product/
                    └── 20241204_142000 Amazon - Product Name
```

### With Save Groups Only (filters out ungrouped tabs)
Only tabs in "Research" and "Shopping" groups are saved; ungrouped tabs are ignored.

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

