# Research: Tab Groups Integration

**Feature**: Tab Groups Integration  
**Phase**: 0 - Research & Discovery  
**Date**: 2025-12-04

## Research Tasks Completed

### 1. Chrome Tab Groups API Investigation

**Decision**: Use chrome.tabGroups API for retrieving group data

**Rationale**:

- Chrome Manifest V3 provides native chrome.tabGroups API
- API returns groupId, title, color, collapsed state for each group
- Tab objects already contain groupId property (-1 for ungrouped tabs)
- No additional permissions required (already covered by "tabs" permission)

**Key API Methods**:

- `chrome.tabGroups.get(groupId)` - Get group details by ID
- `chrome.tabGroups.query({})` - Query all tab groups
- Tab objects contain `groupId` property for group membership

**Alternatives Considered**:

- Manual tracking via tab updates: More complex, less reliable
- External library: Unnecessary given native API availability

### 2. Bookmark Path Structure Options

**Decision**: Support configurable window/group hierarchy with default "1SBM/{window-name}/{group-name}/"

**Rationale**:

- Chrome bookmarks API supports nested folder creation
- Existing code already creates window folders with timestamps
- Group folders can be inserted between window and tab levels
- Configuration allows flexibility for different user workflows

**Implementation Approach**:

- Add radio buttons or dropdown in popup for path structure selection
- Store preference in chrome.storage.local as "bookmarkPathStructure"
- Options: "window-group" (default) or custom patterns if needed

**Alternatives Considered**:

- Flat structure: Loses organizational benefits of groups
- Group-only structure: Loses window context
- Hardcoded structure: Less flexible for user preferences

### 3. Group Name Sanitization Strategy

**Decision**: Apply same sanitization as existing tab title sanitization with additional group-specific rules

**Rationale**:

- Existing codebase has `formatWindowFolder()` that sanitizes titles
- Bookmark folder names have same restrictions as filesystem paths
- Special characters like `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` must be removed or replaced

**Sanitization Rules**:

1. Replace invalid characters with underscores: `/\:*?"<>|`
2. Trim whitespace from beginning and end
3. Truncate to 50 characters maximum for group names
4. Handle empty group names (default groups) with fallback: "Unnamed Group" or "Group-{groupId}"
5. Handle duplicate group names by appending window context

**Code Pattern**:

```javascript
function sanitizeGroupName(groupTitle, groupId) {
  if (!groupTitle || groupTitle.trim() === "") {
    return `Group-${groupId}`;
  }
  return groupTitle
    .replace(/[/\\:*?"<>|]/g, "_")
    .trim()
    .slice(0, 50);
}
```

### 4. HTML Metadata Insertion for Group Context

**Decision**: Insert HTML comment at the beginning of downloaded HTML files using existing content script injection

**Rationale**:

- Existing code already injects content scripts to capture page HTML
- Comment insertion is non-invasive and doesn't affect page rendering
- Comments are standard HTML and work across all browsers
- Easy to parse later if needed for restoration or analysis

**Implementation Pattern**:

- In `downloadTabContent()` function in utils.js
- After obtaining HTML content, prepend comment before creating Blob
- Format: `<!-- tab-context: {groupname} -->` for grouped tabs
- Format: `<!-- tab-context: ungrouped -->` for non-grouped tabs

**Code Pattern**:

```javascript
// In downloadTabContent function
const groupComment =
  tab.groupId !== -1
    ? `<!-- tab-context: ${groupName} -->\n`
    : `<!-- tab-context: ungrouped -->\n`;
const modifiedHtml = groupComment + htmlContent;
```

### 5. Overview HTML Enhancement for Groups

**Decision**: Extend existing `generateOverviewHtml()` function to include group sections

**Rationale**:

- Existing overview HTML already shows windows and tabs hierarchically
- Group information fits naturally as an intermediate level
- Current HTML structure uses divs with classes for styling
- Adding group sections requires minimal changes to existing structure

**Enhanced Structure**:

```html
<h2>Window 1: {window-name}</h2>
<h3>Group: {group-name}</h3>
<div class="tab">
  <!-- tab info -->
</div>
<h3>Ungrouped Tabs</h3>
<div class="tab">
  <!-- ungrouped tab info -->
</div>
```

**Data Requirements**:

- Window name (derived from first tab title - already available)
- Group name (from chrome.tabGroups API)
- Group membership list (from tab.groupId matching)

### 6. "Save Groups" Filter Implementation

**Decision**: Add checkbox in popup.html that filters tabs before bookmarking/downloading

**Rationale**:

- Filtering at the beginning of save operation is simplest approach
- Existing code already iterates through tabs for processing
- Filter can be applied early in the pipeline before any API calls
- Preserves existing functionality when checkbox is disabled

**Filter Logic**:

```javascript
// In popup.js or utils.js before processing tabs
if (saveGroupsOnly) {
  tabs = tabs.filter((tab) => tab.groupId !== -1);
}
```

**User Feedback**:

- Show count of filtered tabs in status message
- Display warning if no grouped tabs found

### 7. Settings Persistence Strategy

**Decision**: Use existing chrome.storage.local pattern with two new keys

**Rationale**:

- Existing code already uses chrome.storage.local for settings
- Pattern established: load on popup open, save on change
- Two new settings: "bookmarkPathStructure" and "saveGroupsOnly"
- Visual feedback pattern already exists (✓ Saved indicator)

**Storage Keys**:

- `saveGroupsOnly`: boolean (default: false)
- `bookmarkPathStructure`: string (default: "window-group")

### 8. Window Naming Strategy

**Decision**: Continue using first tab title for window naming, no changes needed

**Rationale**:

- Existing `formatWindowFolder()` function works well
- Uses oldest tab's date and first tab's title
- No user request for custom window naming
- Keeps implementation simple

**Future Enhancement**:

- Could add custom window naming in future feature
- Would require additional UI for window name input
- Not part of current scope

## Technology Stack Confirmation

**Language**: JavaScript ES6+  
**APIs**: Chrome Extensions Manifest V3 APIs

- chrome.tabGroups (new)
- chrome.bookmarks (existing)
- chrome.storage.local (existing)
- chrome.downloads (existing)
- chrome.scripting (existing)

**No External Dependencies**: All functionality uses native Chrome APIs

## Implementation Risks & Mitigations

| Risk                                                        | Likelihood | Impact | Mitigation                                            |
| ----------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------- |
| Tab groups API not available in older Chrome versions       | Low        | High   | Check API availability before use, gracefully degrade |
| Group names with special characters break bookmark creation | Medium     | Medium | Robust sanitization function with extensive testing   |
| Performance impact with many groups/tabs                    | Low        | Medium | Use batch API calls, avoid N+1 queries                |
| User confusion with new settings                            | Medium     | Low    | Clear labels, help text, sensible defaults            |

## Open Questions Resolved

All technical clarifications have been addressed:

- ✅ Chrome.tabGroups API confirmed available and sufficient
- ✅ Bookmark path structure approach defined
- ✅ Group name sanitization strategy established
- ✅ HTML metadata insertion approach confirmed
- ✅ Overview HTML enhancement approach defined
- ✅ Filter implementation strategy clarified
- ✅ Settings persistence approach confirmed
- ✅ Window naming strategy resolved (no changes needed)

## Next Steps

Proceed to Phase 1: Design & Contracts

- Create data model for tab group entities
- Define API contracts for group data retrieval
- Generate quickstart guide for implementation
- Update agent context files
