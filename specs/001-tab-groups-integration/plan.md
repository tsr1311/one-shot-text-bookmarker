# Implementation Plan: Tab Groups Integration

**Branch**: `001-tab-groups-integration` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tab-groups-integration/spec.md`

## Summary

Enable tab groups integration in the One-Shot Bookmarker Chrome extension by retrieving tab group data via chrome.tabGroups API and organizing bookmarks according to group membership. Add configurable bookmark path structure (window/group hierarchy), "Save Groups" filter option, group context metadata in downloaded HTML files, and enhanced overview HTML with group information. This feature maintains existing timestamp-based functionality while adding group-aware organization.

## Technical Context

**Language/Version**: JavaScript ES6+ (Chrome Extensions Manifest V3)  
**Primary Dependencies**: Chrome Extensions API (chrome.tabGroups, chrome.bookmarks, chrome.storage, chrome.downloads, chrome.scripting)  
**Storage**: chrome.storage.local for settings persistence  
**Testing**: Manual testing with Chrome browser (automated testing not currently implemented)  
**Target Platform**: Chrome/Chromium browsers (Manifest V3 compatible)  
**Project Type**: Single project (Chrome extension)  
**Performance Goals**: <5 seconds for full bookmark save operation with groups  
**Constraints**: Chrome Extension API limitations (sandboxed environment, no direct filesystem access)  
**Scale/Scope**: Single-user extension, typically <100 tabs per save operation, <10 windows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Simplicity**: ✅ Solution adds minimal complexity. Uses existing Chrome API (chrome.tabGroups) without external dependencies. Scope limited to tab groups integration only.
- **Transparency**: ✅ No new permissions required (tabGroups permission already implicitly available with tabs permission in Manifest V3). User controls group filtering via explicit checkbox.
- **Modularity**: ✅ Design maintains separation of concerns: popup.js handles UI/settings, utils.js contains business logic for bookmarking and HTML generation, background.js manages tab/group data caching. No monolithic components created.

## Project Structure

### Documentation (this feature)

```text
specs/001-tab-groups-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── group-data.schema.json
└── checklists/
    └── requirements.md  # Already created
```

### Source Code (repository root)

```text
/
├── manifest.json        # Extension manifest (no changes needed - permissions already sufficient)
├── popup.html           # Extension popup UI (add "Save Groups" checkbox, bookmark path config)
├── popup.js             # UI logic (add settings handlers for new options)
├── background.js        # Background service (add tab groups data caching)
├── utils.js             # Business logic (modify bookmark/download functions for group support)
├── icons/               # Extension icons (no changes)
├── .specify/            # SpecKit framework files
└── specs/               # Feature specifications
    └── 001-tab-groups-integration/
```

**Structure Decision**: This is a single-project Chrome extension with a flat file structure. All JavaScript files are at the root level following Chrome extension conventions. The existing separation of concerns (popup.js for UI, utils.js for business logic, background.js for services) will be maintained and extended to support tab groups functionality.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitutional violations. All checkpoints passed.
