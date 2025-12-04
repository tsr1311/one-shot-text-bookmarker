# Data Model: Tab Groups Integration

**Feature**: Tab Groups Integration  
**Phase**: 1 - Design  
**Date**: 2025-12-04

## Core Entities

### 1. TabGroup

Represents a Chrome browser tab group with its associated metadata.

**Properties**:

- `id` (number): Unique identifier for the tab group (provided by Chrome)
- `title` (string): User-defined name for the group (may be empty string for unnamed groups)
- `color` (string): Group color theme (e.g., "grey", "blue", "red")
- `collapsed` (boolean): Whether the group is currently collapsed in the UI
- `windowId` (number): ID of the window containing this group

**Validation Rules**:

- `id` must be a positive integer
- `title` may be empty but never null/undefined
- `color` must be one of Chrome's predefined color values
- `windowId` must reference an existing window

**State Transitions**:

- Created when user creates a tab group in browser
- Updated when user renames group or changes color
- Deleted when all tabs removed from group or group ungrouped

**Relationships**:

- One TabGroup belongs to one Window
- One TabGroup contains zero or more Tabs

### 2. GroupedTab

Extends the existing Tab concept with group membership information.

**Properties** (in addition to existing Tab properties):

- `groupId` (number): Reference to TabGroup.id (-1 for ungrouped tabs)
- `groupName` (string, computed): Sanitized group name for folder/file naming
- `groupContext` (string, computed): Group context metadata for HTML comments

**Validation Rules**:

- `groupId` of -1 indicates tab is not in any group
- `groupId` must reference an existing TabGroup if not -1
- `groupName` must be filesystem-safe (sanitized)

**Computed Properties**:

```javascript
groupName = sanitizeGroupName(group.title, group.id);
groupContext =
  groupId !== -1 ? `tab-context: ${groupName}` : `tab-context: ungrouped`;
```

### 3. BookmarkPathStructure

Configuration entity defining bookmark folder hierarchy.

**Properties**:

- `pattern` (string): Path pattern template (e.g., "window-group")
- `template` (string): Resolved path template (e.g., "{window-name}/{group-name}")

**Supported Patterns**:

- `"window-group"`: {root}/{window-name}/{group-name}/{tab-bookmark} (default)
- Future: Could extend with "group-window", "flat", etc.

**Validation Rules**:

- `pattern` must be a recognized pattern name
- `template` must contain valid placeholder tokens

**Example Resolution**:

```
Pattern: "window-group"
Window: "20251204_5tab_win1_GitHub"
Group: "Work_Projects"
Tab: "20251204_143022 Repository"

Result: "1SBM/20251204_5tab_win1_GitHub/Work_Projects/20251204_143022 Repository"
```

### 4. GroupFilter

Configuration entity for "Save Groups" feature.

**Properties**:

- `enabled` (boolean): Whether to filter for grouped tabs only
- `includeUngrouped` (boolean): Whether to include ungrouped tabs (inverse of enabled)

**Validation Rules**:

- Both properties must be boolean
- `includeUngrouped` should be !enabled

**Application**:

- Applied during tab collection phase before bookmark creation
- When enabled: `tabs.filter(tab => tab.groupId !== -1)`

### 5. EnhancedOverviewData

Extended data structure for overview HTML generation with group information.

**Properties**:

- `windows` (array of WindowData): Window information with groups
- `timestamps` (object): Existing timestamp data
- `mainFolderName` (string): Root folder name
- `envDescriptor` (string): Environment descriptor

**WindowData Structure**:

```javascript
{
    windowId: number,
    windowName: string,
    groups: [
        {
            groupId: number,
            groupName: string,
            groupColor: string,
            tabs: [
                {
                    title: string,
                    url: string,
                    timestamp: string,
                    timestampSource: string
                }
            ]
        }
    ],
    ungroupedTabs: [
        {
            title: string,
            url: string,
            timestamp: string,
            timestampSource: string
        }
    ]
}
```

## Data Flow

### Bookmark Creation Flow

```
1. User clicks "Save All Windows and Tabs"
   ↓
2. Load settings: saveGroupsOnly, bookmarkPathStructure
   ↓
3. Query all windows and tabs (chrome.tabs.query)
   ↓
4. Query all tab groups (chrome.tabGroups.query)
   ↓
5. Enrich tabs with group information
   ↓
6. Apply group filter if saveGroupsOnly enabled
   ↓
7. Group tabs by window and group
   ↓
8. Create bookmark folder hierarchy:
   - Root folder (existing timestamp-based)
   - Window folders (existing)
   - Group folders (NEW)
   - Tab bookmarks (existing)
   ↓
9. Generate enhanced overview HTML with group sections
   ↓
10. Download individual tab HTML with group context comments (if enabled)
```

### Settings Persistence Flow

```
1. Popup opens
   ↓
2. Load settings from chrome.storage.local:
   - saveGroupsOnly (default: false)
   - bookmarkPathStructure (default: "window-group")
   ↓
3. Populate UI controls with loaded values
   ↓
4. User changes setting
   ↓
5. Save immediately to chrome.storage.local
   ↓
6. Show visual feedback (✓ Saved indicator)
```

### Group Data Retrieval Flow

```
1. Collect all tab objects from chrome.tabs.query
   ↓
2. Extract unique groupIds from tabs (excluding -1)
   ↓
3. Batch query groups using chrome.tabGroups.query
   ↓
4. Create groupId → group data map
   ↓
5. Enrich each tab with its group information
   ↓
6. Return enriched tab collection
```

## Data Transformation Functions

### sanitizeGroupName(groupTitle, groupId)

**Input**:

- groupTitle: string (may be empty)
- groupId: number

**Output**: string (filesystem-safe group name)

**Logic**:

```javascript
function sanitizeGroupName(groupTitle, groupId) {
  if (!groupTitle || groupTitle.trim() === "") {
    return `Group-${groupId}`;
  }
  return groupTitle
    .replace(/[/\\:*?"<>|`]/g, "_")
    .trim()
    .slice(0, 50);
}
```

### buildBookmarkPath(window, group, tab, pathStructure)

**Input**:

- window: Window object
- group: TabGroup object or null
- tab: Tab object
- pathStructure: BookmarkPathStructure

**Output**: string (full bookmark folder path)

**Logic**:

```javascript
function buildBookmarkPath(window, group, tab, pathStructure) {
  const windowName = formatWindowFolder(/* existing params */);

  if (pathStructure.pattern === "window-group" && group) {
    const groupName = sanitizeGroupName(group.title, group.id);
    return `${windowName}/${groupName}`;
  }

  return windowName; // Ungrouped tabs
}
```

### enrichTabWithGroupData(tab, groupsMap)

**Input**:

- tab: Tab object
- groupsMap: Map<groupId, TabGroup>

**Output**: GroupedTab object

**Logic**:

```javascript
function enrichTabWithGroupData(tab, groupsMap) {
  const group = tab.groupId !== -1 ? groupsMap.get(tab.groupId) : null;
  return {
    ...tab,
    groupName: group ? sanitizeGroupName(group.title, group.id) : null,
    groupContext: group
      ? `tab-context: ${group.title}`
      : "tab-context: ungrouped",
    group: group,
  };
}
```

## Storage Schema

### chrome.storage.local Keys

| Key                     | Type    | Default        | Description                                  |
| ----------------------- | ------- | -------------- | -------------------------------------------- |
| `saveGroupsOnly`        | boolean | false          | Filter for grouped tabs only                 |
| `bookmarkPathStructure` | string  | "window-group" | Bookmark hierarchy pattern                   |
| `autoDownloadEnabled`   | boolean | false          | Existing: Enable HTML downloads              |
| `downloadOverview`      | boolean | true           | Existing: Download overview HTML             |
| `downloadPath`          | string  | ""             | Existing: Download folder path               |
| `cssSelector`           | string  | ""             | Existing: CSS selector for partial downloads |
| `useParentFolders`      | boolean | true           | Existing: Organize into parent folders       |
| `excludeElements`       | string  | ""             | Existing: Elements to exclude from HTML      |

## Constraints & Invariants

### Invariants

1. **Group Membership**: A tab's groupId must either be -1 or reference a valid TabGroup
2. **Unique Group IDs**: Group IDs within a window must be unique
3. **Folder Naming**: All folder names (window, group) must be filesystem-safe
4. **Path Consistency**: All bookmarks within a save operation use the same pathStructure
5. **Timestamp Preservation**: Existing timestamp logic must remain unchanged

### Constraints

1. **Group Name Length**: Maximum 50 characters after sanitization
2. **Bookmark Depth**: Maximum folder depth of 4 levels (root/window/group/tab)
3. **API Rate Limits**: Chrome API calls should be batched to avoid rate limiting
4. **Storage Limits**: chrome.storage.local has 5MB limit (settings are well below this)
5. **Performance**: Group data retrieval must complete in <1 second for typical use cases

## Migration Considerations

**Backward Compatibility**:

- Feature is additive only; existing functionality remains unchanged
- Users without tab groups see no difference in behavior
- Existing bookmarks are not modified
- New settings have sensible defaults that preserve current behavior

**No Data Migration Required**:

- No existing data structures are modified
- New settings are optional and have defaults
- Feature gracefully degrades if groups not available
