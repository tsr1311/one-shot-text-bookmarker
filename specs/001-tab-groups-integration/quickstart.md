# Quickstart: Tab Groups Integration Implementation

**Feature**: Tab Groups Integration  
**Branch**: `001-tab-groups-integration`  
**Date**: 2025-12-04

## Overview

This guide provides step-by-step instructions for implementing tab groups integration in the One-Shot Bookmarker Chrome extension. The implementation follows the constitution principles of Simplicity, Modularity, and Transparency.

## Prerequisites

- Feature specification reviewed and understood ([spec.md](./spec.md))
- Research completed ([research.md](./research.md))
- Data model understood ([data-model.md](./data-model.md))
- Working branch `001-tab-groups-integration` checked out

## Implementation Order (5 User Stories, P1 → P3)

### Phase 1: P1 - Group-aware bookmark organization (Core)

**Priority**: Critical - Enables all other features

**Files Modified**:
- `background.js` - Add group data caching
- `utils.js` - Modify bookmark creation functions
- `manifest.json` - Verify permissions (no changes needed)

**Steps**:

1. **Add group data caching to background.js**:
   ```javascript
   // Add to background.js
   const tabGroups = new Map(); // Store group data
   
   async function updateGroupData() {
       const groups = await chrome.tabGroups.query({});
       groups.forEach(group => {
           tabGroups.set(group.id, group);
       });
   }
   
   // Call on tab group updates
   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
       if (changeInfo.groupId !== undefined) {
           updateGroupData();
       }
   });
   ```

2. **Add group name sanitization to utils.js**:
   ```javascript
   // Add to utils.js
   function sanitizeGroupName(groupTitle, groupId) {
       if (!groupTitle || groupTitle.trim() === '') {
           return `Group-${groupId}`;
       }
       return groupTitle
           .replace(/[/\\:*?"<>|`]/g, '_')
           .trim()
           .slice(0, 50);
   }
   ```

3. **Modify bookmark folder creation in utils.js**:
   - Find the bookmark creation loop in `saveWindows()` or similar function
   - Query tab groups: `const groups = await chrome.tabGroups.query({})`
   - Create Map: `const groupsMap = new Map(groups.map(g => [g.id, g]))`
   - For each tab, check `tab.groupId`
   - If grouped, create group folder before creating tab bookmark
   - Handle ungrouped tabs (groupId === -1) by creating directly under window folder

4. **Test P1**:
   - Create multiple tab groups in browser with different names
   - Save bookmarks
   - Verify bookmark folder structure: `1SBM/window-name/group-name/tab-bookmarks`
   - Verify ungrouped tabs saved directly under window folder
   - Verify special characters in group names are sanitized

### Phase 2: P2 - Configurable bookmark path structure

**Priority**: High - Enhances usability

**Files Modified**:
- `popup.html` - Add path structure UI control
- `popup.js` - Add settings handler
- `utils.js` - Modify bookmark path building logic

**Steps**:

1. **Add UI control to popup.html**:
   ```html
   <div id="bookmarkStructureDiv" style="display: none;">
       <label>
           <input type="radio" name="bookmarkStructure" value="window-group" checked>
           Window/Group Structure
       </label>
       <label>
           <input type="radio" name="bookmarkStructure" value="custom">
           Custom (future)
       </label>
       <span id="structureSavedIndicator" class="saved-indicator">✓ Saved</span>
   </div>
   ```

2. **Add settings persistence to popup.js**:
   ```javascript
   // Load setting
   const result = await chrome.storage.local.get(['bookmarkPathStructure']);
   const structure = result.bookmarkPathStructure || 'window-group';
   document.querySelector(`input[value="${structure}"]`).checked = true;
   
   // Save on change
   document.querySelectorAll('input[name="bookmarkStructure"]').forEach(radio => {
       radio.addEventListener('change', async (e) => {
           await chrome.storage.local.set({ bookmarkPathStructure: e.target.value });
           showSavedIndicator('structureSavedIndicator');
       });
   });
   ```

3. **Update bookmark path building in utils.js**:
   ```javascript
   async function buildBookmarkPath(window, group, pathStructure) {
       const windowName = formatWindowFolder(/* params */);
       
       if (pathStructure === 'window-group' && group) {
           const groupName = sanitizeGroupName(group.title, group.id);
           return `${windowName}/${groupName}`;
       }
       
       return windowName;
   }
   ```

4. **Test P2**:
   - Toggle path structure setting in popup
   - Verify setting persists after closing/reopening popup
   - Save bookmarks with different structures
   - Verify folder hierarchy matches selected structure

### Phase 3: P2 - Group context in downloaded HTML files

**Priority**: High - Adds valuable metadata

**Files Modified**:
- `utils.js` - Modify `downloadTabContent()` function

**Steps**:

1. **Add group context to HTML downloads**:
   ```javascript
   // In downloadTabContent function
   async function downloadTabContent(tab, folderPath, filePrefix, selector, excludeElements) {
       // ... existing code to get HTML content ...
       
       // Get group data
       let groupComment = '<!-- tab-context: ungrouped -->\n';
       if (tab.groupId !== -1) {
           const group = await chrome.tabGroups.get(tab.groupId);
           const groupName = sanitizeGroupName(group.title, group.id);
           groupComment = `<!-- tab-context: ${groupName} -->\n`;
       }
       
       // Prepend comment to HTML
       const modifiedHtml = groupComment + htmlContent;
       
       // ... existing code to create blob and download ...
   }
   ```

2. **Test P3**:
   - Enable HTML downloads
   - Save tabs from grouped and ungrouped tabs
   - Open downloaded HTML files in text editor
   - Verify `<!-- tab-context: {groupname} -->` comment at top of file
   - Verify ungrouped tabs have `<!-- tab-context: ungrouped -->`

### Phase 4: P3 - Group information in overview HTML

**Priority**: Medium - Enhances documentation

**Files Modified**:
- `utils.js` - Modify `generateOverviewHtml()` function

**Steps**:

1. **Enhance generateOverviewHtml function**:
   ```javascript
   function generateOverviewHtml(windows, timestamps, mainFolderName, envDescriptor) {
       // ... existing header code ...
       
       windows.forEach((window, windowIndex) => {
           html += `<h2>Window ${windowIndex + 1}</h2>`;
           
           // Group tabs by groupId
           const groupedTabs = new Map();
           const ungroupedTabs = [];
           
           window.tabs.forEach(tab => {
               if (tab.groupId !== -1) {
                   if (!groupedTabs.has(tab.groupId)) {
                       groupedTabs.set(tab.groupId, []);
                   }
                   groupedTabs.get(tab.groupId).push(tab);
               } else {
                   ungroupedTabs.push(tab);
               }
           });
           
           // Render groups
           groupedTabs.forEach((tabs, groupId) => {
               const group = tabs[0].group; // Group data attached during processing
               html += `<h3>Group: ${group.title || 'Unnamed'}</h3>`;
               tabs.forEach(tab => {
                   html += `<div class="tab">...tab content...</div>`;
               });
           });
           
           // Render ungrouped tabs
           if (ungroupedTabs.length > 0) {
               html += `<h3>Ungrouped Tabs</h3>`;
               ungroupedTabs.forEach(tab => {
                   html += `<div class="tab">...tab content...</div>`;
               });
           }
       });
       
       // ... existing footer code ...
   }
   ```

2. **Test P4**:
   - Save tabs with groups
   - Open overview HTML file
   - Verify groups are shown as sections with group names
   - Verify ungrouped tabs have separate section
   - Verify window names are displayed

### Phase 5: P3 - "Save Groups" filter option

**Priority**: Medium - Convenience feature

**Files Modified**:
- `popup.html` - Add checkbox
- `popup.js` - Add settings handler
- `utils.js` - Add filtering logic

**Steps**:

1. **Add checkbox to popup.html**:
   ```html
   <label>
       <input type="checkbox" id="saveGroupsOnlyCheckbox">
       Save Groups Only (exclude ungrouped tabs)
   </label>
   <span id="saveGroupsSavedIndicator" class="saved-indicator">✓ Saved</span>
   ```

2. **Add settings handler to popup.js**:
   ```javascript
   // Load setting
   const result = await chrome.storage.local.get(['saveGroupsOnly']);
   saveGroupsOnlyCheckbox.checked = result.saveGroupsOnly === true;
   
   // Save on change
   saveGroupsOnlyCheckbox.addEventListener('change', async (e) => {
       await chrome.storage.local.set({ saveGroupsOnly: e.target.checked });
       showSavedIndicator('saveGroupsSavedIndicator');
   });
   ```

3. **Add filtering in utils.js**:
   ```javascript
   // In saveWindows or similar function
   async function saveWindows() {
       const settings = await chrome.storage.local.get(['saveGroupsOnly']);
       let allTabs = await chrome.tabs.query({});
       
       // Apply filter if enabled
       if (settings.saveGroupsOnly) {
           allTabs = allTabs.filter(tab => tab.groupId !== -1);
           
           if (allTabs.length === 0) {
               // Show message to user
               console.warn('No grouped tabs found');
               return;
           }
       }
       
       // ... continue with bookmark creation ...
   }
   ```

4. **Test P5**:
   - Enable "Save Groups Only" checkbox
   - Save tabs with mix of grouped and ungrouped
   - Verify only grouped tabs are bookmarked
   - Disable checkbox and verify all tabs are saved
   - Test with no grouped tabs and verify appropriate behavior

## Testing Checklist

### Functional Testing

- [ ] Tab groups are correctly identified and cached
- [ ] Group names are properly sanitized (special characters removed)
- [ ] Unnamed groups get default names (Group-{id})
- [ ] Bookmark folders created with correct hierarchy
- [ ] Ungrouped tabs saved without group folder
- [ ] Path structure setting persists across sessions
- [ ] "Save Groups" filter works correctly
- [ ] HTML downloads include group context comment
- [ ] Overview HTML shows group sections
- [ ] All existing functionality still works

### Edge Cases

- [ ] Empty group names handled correctly
- [ ] Very long group names truncated to 50 chars
- [ ] Special characters in group names sanitized
- [ ] Tabs with no group (groupId === -1) handled
- [ ] Multiple windows with same group names
- [ ] Windows with no groups
- [ ] "Save Groups" with no grouped tabs

### Constitution Compliance

- [ ] **Simplicity**: No unnecessary complexity added
- [ ] **Transparency**: No new permissions requested without justification
- [ ] **Modularity**: Separation of concerns maintained (UI/logic/services)
- [ ] **Data Integrity**: Timestamps preserved, naming consistent
- [ ] **User Experience**: Settings persist, visual feedback provided

## Common Issues & Solutions

### Issue: Group data not available

**Solution**: Ensure chrome.tabGroups.query() is called before processing tabs. Check Chrome version supports Manifest V3.

### Issue: Bookmark creation fails with invalid folder name

**Solution**: Verify sanitizeGroupName() is applied to all group names before folder creation.

### Issue: Settings don't persist

**Solution**: Check chrome.storage.local.set() is awaited and completes successfully. Verify storage key names match between save and load.

### Issue: HTML comment not appearing in downloads

**Solution**: Ensure comment is prepended before creating Blob. Check content script injection is successful.

## Deployment

1. **Test thoroughly in development**:
   - Load extension unpacked in Chrome
   - Test all user stories with acceptance scenarios
   - Verify edge cases handled

2. **Update version number in manifest.json**:
   - Increment minor version (e.g., 1.0 → 1.1)

3. **Update README.md**:
   - Document new features
   - Add usage instructions for tab groups
   - Note new settings options

4. **Create pull request**:
   - Reference feature spec
   - Include testing checklist results
   - Add screenshots if applicable

5. **Merge and tag release**:
   - Merge to main branch
   - Tag with version number
   - Create GitHub release with changelog

## Next Steps After Implementation

- Create tasks.md using `/speckit.tasks` command
- Break down implementation into granular tasks
- Track progress through task completion
- Address any issues discovered during implementation
