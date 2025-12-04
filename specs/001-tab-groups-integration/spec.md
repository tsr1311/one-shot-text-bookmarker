# Feature Specification: Tab Groups Integration

**Feature Branch**: `001-tab-groups-integration`  
**Created**: 2025-12-04  
**Status**: Draft  
**Input**: User description: "add tab group data (chrome.tabGroups) and have bookmarks be saved in the following (to be configurable bookmark path: 1SBM/{window-name}/{group-name (if in group)}/. Add to downloaded [...]OneShotBookmarked.htm: window name, group name and group members. Add the option to \"Save Groups\" to only bookmark/save tabs that are in a group. Put the group name as HTML <!-- tab-context: {groupname} --> in the (if saved) saved {page}.html. Add the option to follow window or tab-group path logic, i.e. {window-name}/{group-name}"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Group-aware bookmark organization (Priority: P1)

Users with browser tab groups want their bookmarks to reflect the same group organization, making it easier to restore and understand the context of saved tabs.

**Why this priority**: This is the core functionality that enables all other features. Without group data collection and bookmark organization, the other features cannot function.

**Independent Test**: Can be fully tested by creating tab groups in the browser, saving bookmarks, and verifying the bookmark folder structure matches the group organization.

**Acceptance Scenarios**:

1. **Given** a browser window with tabs organized into named groups (e.g., "Work", "Research"), **When** user saves bookmarks, **Then** the bookmark structure includes group names as folder levels (e.g., 1SBM/{window-name}/{group-name}/)
2. **Given** a browser window with both grouped and ungrouped tabs, **When** user saves bookmarks, **Then** grouped tabs are organized under their group name folders while ungrouped tabs are saved directly under the window folder
3. **Given** multiple windows each with different tab groups, **When** user saves bookmarks, **Then** each window's groups are preserved independently in the bookmark hierarchy

---

### User Story 2 - Configurable bookmark path structure (Priority: P2)

Users want flexibility in how their bookmarks are organized, choosing between window-first or group-first hierarchy based on their workflow.

**Why this priority**: This enhances usability by accommodating different organizational preferences, but the basic functionality works without it.

**Independent Test**: Can be fully tested by toggling the path structure setting in the extension popup and verifying the resulting bookmark folder hierarchy changes accordingly.

**Acceptance Scenarios**:

1. **Given** a configurable bookmark path setting in the extension popup, **When** user selects "Window/Group" structure, **Then** bookmarks are organized as {window-name}/{group-name}/
2. **Given** the same tab groups in multiple windows, **When** user changes the path structure setting, **Then** future saves use the new structure without affecting previously saved bookmarks
3. **Given** tabs without groups, **When** using any path structure setting, **Then** ungrouped tabs are still saved correctly without creating empty group folders

---

### User Story 3 - Group context in downloaded HTML files (Priority: P2)

Users who download individual page HTML files want to see which tab group each page belonged to, preserving organizational context.

**Why this priority**: This adds valuable metadata to downloaded files but doesn't affect the core bookmarking functionality.

**Independent Test**: Can be fully tested by downloading HTML files with the feature enabled and inspecting the HTML source for the group context comment.

**Acceptance Scenarios**:

1. **Given** a tab that belongs to a named group (e.g., "Research"), **When** user downloads the page HTML, **Then** the file contains `<!-- tab-context: Research -->` comment
2. **Given** a tab that is not in any group, **When** user downloads the page HTML, **Then** the file contains `<!-- tab-context: ungrouped -->` or no tab-context comment
3. **Given** downloading is enabled for grouped tabs, **When** saving all tabs, **Then** each downloaded HTML file includes the correct group name in its metadata

---

### User Story 4 - Group information in overview HTML (Priority: P3)

Users want the overview HTML file to display window names, group names, and group membership information for better documentation of their saved sessions.

**Why this priority**: This enhances the overview file's usefulness but is not essential for core bookmarking and downloading functionality.

**Independent Test**: Can be fully tested by saving tabs with groups and examining the generated overview HTML file for group information.

**Acceptance Scenarios**:

1. **Given** tabs organized in named groups across windows, **When** overview HTML is generated, **Then** it displays window names, group names, and lists which tabs belong to each group
2. **Given** a mix of grouped and ungrouped tabs, **When** overview HTML is generated, **Then** it clearly distinguishes between grouped tabs (showing their group) and ungrouped tabs
3. **Given** the same group name in different windows, **When** overview HTML is generated, **Then** it correctly shows which window each group instance belongs to

---

### User Story 5 - "Save Groups" filter option (Priority: P3)

Users who primarily work with tab groups want the ability to save only grouped tabs, ignoring loose ungrouped tabs to reduce clutter.

**Why this priority**: This is a convenience feature for power users but not necessary for the core group integration functionality.

**Independent Test**: Can be fully tested by enabling the "Save Groups" checkbox, saving tabs, and verifying that only tabs within groups are bookmarked/downloaded.

**Acceptance Scenarios**:

1. **Given** "Save Groups" option is enabled, **When** user saves tabs from a window with both grouped and ungrouped tabs, **Then** only tabs that belong to a group are bookmarked/downloaded
2. **Given** "Save Groups" option is disabled, **When** user saves tabs, **Then** all tabs are saved regardless of group membership
3. **Given** "Save Groups" option is enabled and a window has only ungrouped tabs, **When** user saves tabs, **Then** no bookmarks are created for that window (or a notification is shown)

---

### Edge Cases

- What happens when a tab group has no name (default empty name)?
  - System should use a default label like "Unnamed Group" or "Group-{id}" to ensure folder creation doesn't fail
- How does the system handle tab groups with special characters in names (/, \, :, etc.)?
  - System should sanitize group names similar to how tab titles are currently sanitized for filenames
- What happens when "Save Groups" is enabled but no tabs are in any groups?
  - System should display a message to the user indicating no groups were found and no bookmarks will be created
- How does the system handle very long group names?
  - Group names should be truncated to a reasonable length (e.g., 50 characters) to prevent filesystem path issues
- What happens when the configurable bookmark path setting is changed between saves?
  - Each save operation uses the current setting; previously saved bookmarks remain unchanged

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve tab group data using chrome.tabGroups API for all tabs being saved
- **FR-002**: System MUST create bookmark folders following the configured path structure (default: 1SBM/{window-name}/{group-name}/)
- **FR-003**: System MUST allow users to configure the bookmark path structure via a settings interface
- **FR-004**: System MUST sanitize group names to ensure valid folder names (removing or replacing special characters)
- **FR-005**: System MUST handle tabs without group membership by saving them under the window folder without a group subfolder
- **FR-006**: System MUST insert HTML comment `<!-- tab-context: {groupname} -->` into downloaded page HTML files when tabs belong to a group
- **FR-007**: System MUST provide a "Save Groups" checkbox option in the extension popup
- **FR-008**: When "Save Groups" is enabled, system MUST filter out tabs that are not members of any group before bookmarking/downloading
- **FR-009**: System MUST include window name, group name, and group member list in the generated overview HTML file
- **FR-010**: System MUST persist the bookmark path structure setting and "Save Groups" preference across browser sessions
- **FR-011**: System MUST handle unnamed tab groups by assigning a default identifier
- **FR-012**: System MUST maintain the existing timestamp-based naming conventions while adding group folder hierarchy

### Key Entities *(include if feature involves data)*

- **Tab Group**: Browser tab organization feature with properties including group ID, group name, group color, and member tabs
- **Bookmark Path Structure**: Configuration setting defining the folder hierarchy pattern (window-first vs group-first)
- **Group Context Metadata**: HTML comment inserted into downloaded files containing the tab's group name
- **Overview HTML Data**: Enhanced data structure including window names, group names, and group membership relationships

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with tab groups can save bookmarks and see their group organization reflected in the bookmark folder hierarchy within 5 seconds of clicking save
- **SC-002**: Users can toggle between different bookmark path structures and see the change applied to subsequent saves without requiring browser restart
- **SC-003**: 100% of downloaded HTML files for grouped tabs contain the correct group name in the tab-context comment
- **SC-004**: The overview HTML file displays complete group information including all window names, group names, and member lists for all saved tabs
- **SC-005**: When "Save Groups" is enabled, 0% of ungrouped tabs are included in the saved bookmarks
- **SC-006**: Users with special characters in group names can successfully save bookmarks without errors or invalid folder names
- **SC-007**: The feature preserves all existing functionality (timestamp-based naming, folder structure, HTML downloads) while adding group support

## Assumptions

- Users are familiar with Chrome's native tab groups feature and actively use it for organization
- The default bookmark root folder "1SBM" is acceptable; if users need customization of this root path, it will be addressed in a future feature
- Group colors are metadata available via chrome.tabGroups API but are not required for the initial implementation (may be added later)
- The term "window-name" refers to a human-readable identifier for the window, likely derived from the first tab's title or a custom naming scheme
- Downloaded HTML files are the full page content saved locally, not just bookmarks
- Users understand that changing path structure settings only affects future saves, not existing bookmarks
