# Tasks: Tab Groups Integration

**Input**: Design documents from `/specs/001-tab-groups-integration/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested - implementation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- All file paths are at repository root (Chrome extension flat structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification

- [x] T001 Verify manifest.json permissions (tabs, bookmarks, storage already present - no changes needed)
- [x] T002 Review existing code structure (popup.js, popup.html, utils.js, background.js)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add sanitizeGroupName(groupTitle, groupId) function to utils.js (handles empty names, special chars, 50 char limit)
- [x] T004 Add group data caching to background.js (create tabGroups Map, implement updateGroupData() function)
- [x] T005 Add tab group update listener to background.js (listen to chrome.tabs.onUpdated for groupId changes)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Group-aware bookmark organization (Priority: P1) 🎯 MVP

**Goal**: Enable bookmarks to be organized by tab groups with folder hierarchy window/group/tab

**Independent Test**: Create tab groups in browser, save bookmarks, verify folder structure matches group organization

### Implementation for User Story 1

- [x] T006 [US1] Modify bookmark creation logic in utils.js to query tab groups (add chrome.tabGroups.query() call)
- [x] T007 [US1] Create groupsMap in bookmark creation function in utils.js (Map groupId → group object)
- [x] T008 [US1] Enrich tabs with group data in utils.js (add groupId, groupName, group object to each tab)
- [x] T009 [US1] Implement group folder creation logic in utils.js (create group folder under window folder for grouped tabs)
- [x] T010 [US1] Handle ungrouped tabs in utils.js (groupId === -1 saved directly under window folder)
- [x] T011 [US1] Apply sanitizeGroupName to all group folder names in utils.js
- [ ] T012 [US1] Test with multiple windows with different tab groups (manual testing)
- [ ] T013 [US1] Test special characters in group names are sanitized correctly (manual testing)
- [ ] T014 [US1] Test unnamed groups get default "Group-{id}" name (manual testing)

**Checkpoint**: At this point, User Story 1 should be fully functional - bookmarks organized by groups

---

## Phase 4: User Story 2 - Configurable bookmark path structure (Priority: P2)

**Goal**: Allow users to configure bookmark folder hierarchy via popup settings

**Independent Test**: Toggle path structure in popup, verify setting persists and affects bookmark folder hierarchy

### Implementation for User Story 2

- [x] T015 [P] [US2] Add bookmark path structure UI to popup.html (radio buttons for "window-group", hidden by default)
- [x] T016 [P] [US2] Add CSS styles for path structure section in popup.html (match existing progressive disclosure pattern)
- [x] T017 [US2] Add bookmarkPathStructure setting loader to popup.js DOMContentLoaded (load from chrome.storage.local)
- [x] T018 [US2] Add bookmarkPathStructure setting saver to popup.js (save on radio change, show ✓ Saved indicator)
- [x] T019 [US2] Show/hide path structure UI based on autoDownloadCheckbox or other trigger in popup.js
- [x] T020 [US2] Create buildBookmarkPath(window, group, pathStructure) function in utils.js
- [x] T021 [US2] Modify bookmark creation in utils.js to use buildBookmarkPath() with loaded pathStructure setting
- [ ] T022 [US2] Test path structure persistence across browser sessions (manual testing)
- [ ] T023 [US2] Test changing path structure affects future saves only (manual testing)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - bookmarks organized by groups with configurable paths

---

## Phase 5: User Story 3 - Group context in downloaded HTML files (Priority: P2)

**Goal**: Add group name as HTML comment metadata to downloaded page files

**Independent Test**: Enable downloads, save tabs, inspect HTML source for `<!-- tab-context: {groupname} -->` comment

### Implementation for User Story 3

- [ ] T024 [US3] Modify downloadTabContent() function in utils.js to retrieve group data for tab
- [ ] T025 [US3] Generate group comment in downloadTabContent() in utils.js (format: `<!-- tab-context: {groupname} -->`)
- [ ] T026 [US3] Handle ungrouped tabs in downloadTabContent() in utils.js (comment: `<!-- tab-context: ungrouped -->`)
- [ ] T027 [US3] Prepend group comment to HTML content before creating Blob in utils.js
- [ ] T028 [US3] Test grouped tab downloads contain correct group name comment (manual testing)
- [ ] T029 [US3] Test ungrouped tab downloads contain "ungrouped" comment (manual testing)

**Checkpoint**: All three user stories (1, 2, 3) should now work independently - bookmarks + downloads with group metadata

---

## Phase 6: User Story 4 - Group information in overview HTML (Priority: P3)

**Goal**: Display group sections with member tabs in the overview HTML file

**Independent Test**: Save tabs with groups, open overview HTML, verify group sections and member lists are shown

### Implementation for User Story 4

- [ ] T030 [US4] Modify generateOverviewHtml() function signature in utils.js to accept groups data
- [ ] T031 [US4] Group tabs by groupId within each window in generateOverviewHtml() in utils.js
- [ ] T032 [US4] Create groupedTabs Map and ungroupedTabs array in generateOverviewHtml() in utils.js
- [ ] T033 [US4] Render group sections with `<h3>Group: {name}</h3>` in generateOverviewHtml() in utils.js
- [ ] T034 [US4] Render ungrouped tabs section separately in generateOverviewHtml() in utils.js
- [ ] T035 [US4] Add window name display to overview HTML in generateOverviewHtml() in utils.js
- [ ] T036 [US4] Pass groups data to generateOverviewHtml() from bookmark save function in utils.js
- [ ] T037 [US4] Test overview HTML shows all groups and their members (manual testing)
- [ ] T038 [US4] Test overview HTML distinguishes ungrouped tabs (manual testing)

**Checkpoint**: Four user stories complete - full group visualization in overview HTML

---

## Phase 7: User Story 5 - "Save Groups" filter option (Priority: P3)

**Goal**: Add checkbox to filter bookmarking/downloading to only grouped tabs

**Independent Test**: Enable "Save Groups" checkbox, save tabs, verify only grouped tabs are bookmarked

### Implementation for User Story 5

- [ ] T039 [P] [US5] Add "Save Groups Only" checkbox to popup.html (with label and saved indicator)
- [ ] T040 [P] [US5] Add CSS styles for Save Groups checkbox in popup.html
- [ ] T041 [US5] Add saveGroupsOnly setting loader to popup.js DOMContentLoaded (load from chrome.storage.local)
- [ ] T042 [US5] Add saveGroupsOnly setting saver to popup.js (save on checkbox change, show ✓ Saved indicator)
- [ ] T043 [US5] Load saveGroupsOnly setting in bookmark save function in utils.js or popup.js
- [ ] T044 [US5] Apply filter to tabs array in utils.js (tabs.filter(tab => tab.groupId !== -1) when enabled)
- [ ] T045 [US5] Add warning message when no grouped tabs found and filter enabled in utils.js
- [ ] T046 [US5] Test filter includes only grouped tabs when enabled (manual testing)
- [ ] T047 [US5] Test all tabs saved when filter disabled (manual testing)
- [ ] T048 [US5] Test behavior with no grouped tabs and filter enabled (manual testing)

**Checkpoint**: All five user stories complete - full tab groups integration feature functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T049 [P] Update README.md with tab groups feature documentation
- [ ] T050 [P] Add usage instructions for group-related settings to README.md
- [ ] T051 Test all edge cases from spec.md (empty group names, special characters, long names, no groups)
- [ ] T052 Verify all existing functionality still works (timestamps, folder structure, CSS selectors, element exclusion)
- [ ] T053 Run quickstart.md validation steps
- [ ] T054 Update manifest.json version number (increment minor version)
- [ ] T055 [P] Create screenshots of new UI features for documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2 → P3 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational - Builds on US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2 (different feature: downloads)
- **User Story 4 (P3)**: Can start after Foundational - Uses group data from US1 but independently testable
- **User Story 5 (P3)**: Can start after Foundational - Filters data used by US1 but independently testable

### Within Each User Story

- UI tasks (popup.html) before handler tasks (popup.js)
- Settings loading before settings application
- Core logic before integration
- Implementation before testing

### Parallel Opportunities

#### Within Foundational Phase (T003-T005):

- T003 (sanitizeGroupName) and T004 (group caching) can run in parallel [P]
- T005 depends on T004 completion (needs tabGroups Map)

#### Within User Story 2 (T015-T023):

- T015 (HTML) and T016 (CSS) can run in parallel [P]
- T017 (loader) and T018 (saver) can run in parallel [P] after T015-T016
- T020 (buildBookmarkPath) can run in parallel with T015-T019 [P]

#### Within User Story 5 (T039-T048):

- T039 (HTML) and T040 (CSS) can run in parallel [P]
- T041 (loader) and T042 (saver) can run in parallel [P] after T039-T040

#### Across User Stories:

Once Foundational is complete, all five user stories can be worked on in parallel:

- Developer A: User Story 1 (T006-T014) - Core functionality
- Developer B: User Story 2 (T015-T023) - Settings UI
- Developer C: User Story 3 (T024-T029) - Downloads
- Developer D: User Story 4 (T030-T038) - Overview HTML
- Developer E: User Story 5 (T039-T048) - Filter option

#### Within Polish Phase:

- T049 (README update) and T050 (usage instructions) can run in parallel [P]
- T055 (screenshots) can run in parallel with documentation [P]

---

## Parallel Example: User Story 2

```bash
# Step 1: Launch UI and CSS together
Task T015: "Add bookmark path structure UI to popup.html"
Task T016: "Add CSS styles for path structure section in popup.html"

# Step 2: After T015-T016 complete, launch settings handlers together
Task T017: "Add bookmarkPathStructure setting loader to popup.js"
Task T018: "Add bookmarkPathStructure setting saver to popup.js"

# Step 3: In parallel with T015-T018, work on logic
Task T020: "Create buildBookmarkPath() function in utils.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005) - CRITICAL
3. Complete Phase 3: User Story 1 (T006-T014)
4. **STOP and VALIDATE**: Test with multiple tab groups
5. If working, User Story 1 is MVP ✅

### Incremental Delivery

1. Setup + Foundational → T001-T005 done
2. Add User Story 1 → T006-T014 done → Test → Commit (MVP! Basic groups working)
3. Add User Story 2 → T015-T023 done → Test → Commit (Configurable paths)
4. Add User Story 3 → T024-T029 done → Test → Commit (Download metadata)
5. Add User Story 4 → T030-T038 done → Test → Commit (Overview enhancement)
6. Add User Story 5 → T039-T048 done → Test → Commit (Filter option)
7. Polish → T049-T055 done → Final testing → Release

### Parallel Team Strategy

With 2-3 developers:

1. All complete Setup + Foundational together (T001-T005)
2. Once T005 done:
   - Developer A: User Story 1 (P1 - critical path)
   - Developer B: User Story 2 & 5 (both are UI/settings)
   - Developer C: User Story 3 & 4 (both enhance output)
3. Stories complete independently, merge sequentially

---

## Notes

- Chrome extension uses flat file structure (no src/ directory)
- All JavaScript files at repository root: popup.js, utils.js, background.js
- popup.html is the extension popup UI file
- Progressive disclosure pattern: Advanced options appear when relevant
- Settings use chrome.storage.local with immediate save pattern
- Visual feedback with "✓ Saved" indicators (existing pattern)
- All tasks include manual testing as automated testing not currently implemented
- Commit after each user story phase completion (T014, T023, T029, T038, T048)
- Verify existing features don't break after each phase
