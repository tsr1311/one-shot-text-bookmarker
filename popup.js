// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    const checkbox = document.getElementById('autoDownloadCheckbox');
    const downloadOverviewCheckbox = document.getElementById('downloadOverviewCheckbox');
    const selectorDiv = document.getElementById('selectorDiv');
    const excludeElementsDiv = document.getElementById('excludeElementsDiv');
    const divExtractionDiv = document.getElementById('divExtractionDiv');
    const downloadPathOptionsDiv = document.getElementById('downloadPathOptionsDiv');
    const folderStructureDiv = document.getElementById('folderStructureDiv');
    const useParentFoldersCheckbox = document.getElementById('useParentFoldersCheckbox');
    const includeYYYYMMDDCheckbox = document.getElementById('includeYYYYMMDDCheckbox');
    const includeGroupNameCheckbox = document.getElementById('includeGroupNameCheckbox');
    const includeTabDomainCheckbox = document.getElementById('includeTabDomainCheckbox');
    const includeTabNameCheckbox = document.getElementById('includeTabNameCheckbox');
    const downloadPathInput = document.getElementById('downloadPathInput');
    const mainFolderTemplateInput = document.getElementById('mainFolderTemplateInput');
    const mainFolderPreview = document.getElementById('mainFolderPreview');
    const selectorInput = document.getElementById('selectorInput');
    const excludeElementsInput = document.getElementById('excludeElementsInput');
    const divExtractionInput = document.getElementById('divExtractionInput');

    try {
        const result = await chrome.storage.local.get(['autoDownloadEnabled', 'downloadOverview', 'downloadPath', 'cssSelector', 'useParentFolders', 'excludeElements', 'bookmarkPathStructure', 'saveGroupsOnly', 'mainFolderTemplate', 'divExtractionPairs', 'includeYYYYMMDD', 'includeGroupName', 'includeTabDomain', 'includeTabName']);
        
        // Handle auto-download checkbox
        checkbox.checked = result.autoDownloadEnabled === true;
        if (checkbox.checked) {
            selectorDiv.style.display = 'block';
            excludeElementsDiv.style.display = 'block';
            divExtractionDiv.style.display = 'block';
            downloadPathOptionsDiv.style.display = 'block';
            folderStructureDiv.style.display = 'block';
        }

        // Handle path options checkboxes (all default to true for backward compatibility)
        includeYYYYMMDDCheckbox.checked = result.includeYYYYMMDD !== false;
        includeGroupNameCheckbox.checked = result.includeGroupName !== false;
        includeTabDomainCheckbox.checked = result.includeTabDomain !== false;
        includeTabNameCheckbox.checked = result.includeTabName !== false;

        // Handle download overview checkbox (default to true)
        downloadOverviewCheckbox.checked = result.downloadOverview !== false;

        // Handle use parent folders checkbox (default to true)
        useParentFoldersCheckbox.checked = result.useParentFolders !== false;

        // Handle main folder template input (default: {OS-environment}/{YYYYMMDD}/)
        const mainTemplate = result.mainFolderTemplate || '{OS-environment}/{YYYYMMDD}/';
        mainFolderTemplateInput.value = mainTemplate;
        updateMainFolderPreview(mainTemplate, mainFolderPreview);
        
        // Handle download path input
        if (result.downloadPath) {
            downloadPathInput.value = result.downloadPath;
        }

        // Handle CSS selector input
        if (result.cssSelector) {
            selectorInput.value = result.cssSelector;
        }

        // Handle exclude elements input
        if (result.excludeElements) {
            excludeElementsInput.value = result.excludeElements;
        }

        // Handle DIV extraction pairs input
        if (result.divExtractionPairs) {
            divExtractionInput.value = result.divExtractionPairs;
        }

        // Handle bookmark path structure (default to 'window-group')
        const pathStructure = result.bookmarkPathStructure || 'window-group';
        const pathStructureRadios = document.querySelectorAll('input[name="bookmarkPathStructure"]');
        pathStructureRadios.forEach(radio => {
            if (radio.value === pathStructure) {
                radio.checked = true;
            }
        });

        // Handle save groups only checkbox (default to false)
        const saveGroupsOnlyCheckbox = document.getElementById('saveGroupsOnlyCheckbox');
        saveGroupsOnlyCheckbox.checked = result.saveGroupsOnly === true;

    } catch (error) {
        console.error('Failed to load settings:', error);
    }

    checkbox.addEventListener('change', () => {
        const isChecked = checkbox.checked;
        selectorDiv.style.display = isChecked ? 'block' : 'none';
        excludeElementsDiv.style.display = isChecked ? 'block' : 'none';
        divExtractionDiv.style.display = isChecked ? 'block' : 'none';
        downloadPathOptionsDiv.style.display = isChecked ? 'block' : 'none';
        folderStructureDiv.style.display = isChecked ? 'block' : 'none';
    });

    // Save path option checkboxes
    const savePathOption = async (key, checkbox, indicatorId) => {
        try {
            await chrome.storage.local.set({ [key]: checkbox.checked });
            showSavedIndicator(indicatorId);
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
        }
    };

    includeYYYYMMDDCheckbox.addEventListener('change', () => 
        savePathOption('includeYYYYMMDD', includeYYYYMMDDCheckbox, 'pathOptionsSavedIndicator'));
    includeGroupNameCheckbox.addEventListener('change', () => 
        savePathOption('includeGroupName', includeGroupNameCheckbox, 'pathOptionsSavedIndicator'));
    includeTabDomainCheckbox.addEventListener('change', () => 
        savePathOption('includeTabDomain', includeTabDomainCheckbox, 'pathOptionsSavedIndicator'));
    includeTabNameCheckbox.addEventListener('change', () => 
        savePathOption('includeTabName', includeTabNameCheckbox, 'pathOptionsSavedIndicator'));


    // Update main folder preview with resolved variables
    function updateMainFolderPreview(template, previewElement) {
        if (!template) {
            previewElement.textContent = 'Preview: OSBed-Mac/20241204/';
            return;
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Get OS environment descriptor
        const platform = navigator.platform || 'Unknown';
        const envDescriptor = platform.includes('Mac') ? 'Mac' :
                              platform.includes('Win') ? 'Win' :
                              platform.includes('Linux') ? 'Linux' : 'Unknown';
        
        // Replace variables with sample values
        let preview = template
            .replace(/\{YYYYMMDD\}/g, `${year}${month}${day}`)
            .replace(/\{HHMM\}/g, `${hours}${minutes}`)
            .replace(/\{OS-environment\}/g, `OSBed-${envDescriptor}`)
            .replace(/\{Window-Name\}/g, '[Window Name]')
            .replace(/\{Group-Name\}/g, '[Group Name]');
        
        // Add trailing slash if not present
        if (!preview.endsWith('/')) {
            preview += '/';
        }
        
        previewElement.textContent = `Preview: ${preview}`;
    }

    // Show visual feedback when settings are saved
    function showSavedIndicator(indicatorId) {
        const indicator = document.getElementById(indicatorId);
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    downloadPathInput.addEventListener('change', async (e) => {
        try {
            await chrome.storage.local.set({ downloadPath: e.target.value });
            showSavedIndicator('pathSavedIndicator');
        } catch (error) {
            console.error('Failed to save download path:', error);
        }
    });

    // Save and preview main folder template when it changes
    mainFolderTemplateInput.addEventListener('change', async (e) => {
        try {
            const template = e.target.value || '{OS-environment}/{YYYYMMDD}/';
            await chrome.storage.local.set({ mainFolderTemplate: template });
            updateMainFolderPreview(template, mainFolderPreview);
            showSavedIndicator('mainTemplateSavedIndicator');
        } catch (error) {
            console.error('Failed to save main folder template:', error);
        }
    });

    // Save CSS selector when it changes
    selectorInput.addEventListener('change', async (e) => {
        try {
            await chrome.storage.local.set({ cssSelector: e.target.value });
            showSavedIndicator('selectorSavedIndicator');
        } catch (error) {
            console.error('Failed to save CSS selector:', error);
        }
    });

    // Save exclude elements when it changes
    excludeElementsInput.addEventListener('change', async (e) => {
        try {
            await chrome.storage.local.set({ excludeElements: e.target.value });
            showSavedIndicator('excludeSavedIndicator');
        } catch (error) {
            console.error('Failed to save exclude elements:', error);
        }
    });

    // Save DIV extraction pairs when it changes
    divExtractionInput.addEventListener('change', async (e) => {
        try {
            await chrome.storage.local.set({ divExtractionPairs: e.target.value });
            showSavedIndicator('divExtractionSavedIndicator');
        } catch (error) {
            console.error('Failed to save DIV extraction pairs:', error);
        }
    });

    // Save bookmark path structure when it changes
    const pathStructureRadios = document.querySelectorAll('input[name="bookmarkPathStructure"]');
    pathStructureRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            try {
                await chrome.storage.local.set({ bookmarkPathStructure: e.target.value });
                showSavedIndicator('pathStructureSavedIndicator');
            } catch (error) {
                console.error('Failed to save bookmark path structure:', error);
            }
        });
    });

    // Folder picker using download dialog
    document.getElementById('browseFolderButton').addEventListener('click', async () => {
        try {
            // Create a dummy file to trigger the save dialog
            const blob = new Blob([''], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Use download API with saveAs to let user choose location
            const downloadId = await chrome.downloads.download({
                url: url,
                filename: 'OSBM-location.txt',
                saveAs: true
            });

            // Listen for the download to complete or be cancelled
            const listener = (delta) => {
                if (delta.id === downloadId) {
                    if (delta.state && delta.state.current === 'complete') {
                        // Get the download item to extract the path
                        chrome.downloads.search({ id: downloadId }, (items) => {
                            if (items && items[0]) {
                                const fullPath = items[0].filename;
                                // Extract folder path (remove the filename)
                                // This will be relative to Downloads folder
                                const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
                                
                                // Store the relative path (will be relative to Downloads)
                                if (folderPath) {
                                    downloadPathInput.value = folderPath;
                                    chrome.storage.local.set({ downloadPath: folderPath });
                                    showSavedIndicator('pathSavedIndicator');
                                }
                                
                                // Clean up: remove the dummy file
                                chrome.downloads.removeFile(downloadId);
                                chrome.downloads.erase({ id: downloadId });
                            }
                        });
                        chrome.downloads.onChanged.removeListener(listener);
                    } else if (delta.state && delta.state.current === 'interrupted') {
                        // User cancelled
                        chrome.downloads.erase({ id: downloadId });
                        chrome.downloads.onChanged.removeListener(listener);
                    }
                }
            };
            
            chrome.downloads.onChanged.addListener(listener);
            
            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            console.error('Failed to open folder picker:', error);
            alert('Failed to open folder picker. You can manually enter a folder path.');
        }
    });
});

// Save checkbox state when it changes
document.getElementById('autoDownloadCheckbox').addEventListener('change', async (e) => {
    try {
        await chrome.storage.local.set({ autoDownloadEnabled: e.target.checked });
    } catch (error) {
        console.error('Failed to save auto-download setting:', error);
    }
});

// Save download overview checkbox state when it changes
document.getElementById('downloadOverviewCheckbox').addEventListener('change', async (e) => {
    try {
        await chrome.storage.local.set({ downloadOverview: e.target.checked });
    } catch (error) {
        console.error('Failed to save download overview setting:', error);
    }
});

// Save use parent folders checkbox state when it changes
document.getElementById('useParentFoldersCheckbox').addEventListener('change', async (e) => {
    try {
        await chrome.storage.local.set({ useParentFolders: e.target.checked });
    } catch (error) {
        console.error('Failed to save parent folders setting:', error);
    }
});

// Save groups only checkbox state when it changes
document.getElementById('saveGroupsOnlyCheckbox').addEventListener('change', async (e) => {
    try {
        await chrome.storage.local.set({ saveGroupsOnly: e.target.checked });
        // Show saved indicator
        const indicator = document.getElementById('groupsSavedIndicator');
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    } catch (error) {
        console.error('Failed to save groups only setting:', error);
    }
});

document.getElementById('saveButton').addEventListener('click', async () => {
    const allWindows = await chrome.windows.getAll({ populate: true });
    const downloadPath = document.getElementById('downloadPathInput').value;
    await saveWindows(allWindows, downloadPath);
});

document.getElementById('saveCurrentWindowButton').addEventListener('click', async () => {
    const currentWindow = await chrome.windows.getCurrent({ populate: true });
    const downloadPath = document.getElementById('downloadPathInput').value;
    await saveWindows([currentWindow], downloadPath);
});

async function saveWindows(windows, downloadPath) {
    const statusDiv = document.getElementById('status');
    const autoDownloadEnabled = document.getElementById('autoDownloadCheckbox').checked;
    const downloadOverviewEnabled = document.getElementById('downloadOverviewCheckbox').checked;
    const useParentFolders = document.getElementById('useParentFoldersCheckbox').checked;
    const selector = document.getElementById('selectorInput').value;
    const excludeElements = document.getElementById('excludeElementsInput').value;
    const divExtractionPairs = document.getElementById('divExtractionInput').value;
    const pathOptions = {
        includeYYYYMMDD: document.getElementById('includeYYYYMMDDCheckbox').checked,
        includeGroupName: document.getElementById('includeGroupNameCheckbox').checked,
        includeTabDomain: document.getElementById('includeTabDomainCheckbox').checked,
        includeTabName: document.getElementById('includeTabNameCheckbox').checked
    };

    // Load settings
    const settings = await chrome.storage.local.get(['bookmarkPathStructure', 'saveGroupsOnly', 'mainFolderTemplate']);
    const bookmarkPathStructure = settings.bookmarkPathStructure || 'window-group';
    const saveGroupsOnly = settings.saveGroupsOnly === true;
    const mainFolderTemplate = settings.mainFolderTemplate || '{OS-environment}/{YYYYMMDD}/';

    // Sanitize the download path - allow absolute paths or subfolder names
    const sanitizedPath = sanitizePath(downloadPath);
    
    statusDiv.textContent = autoDownloadEnabled ? 'Saving bookmarks and downloading content...' : 'Saving...';

    try {
        // Get timestamps and environment info from background script
        const response = await chrome.runtime.sendMessage({ action: 'getTimestamps' });
        const timestamps = {
            windows: response.windows,
            tabs: response.tabs,
            urlVisits: response.urlVisits
        };
        const envDescriptor = response.environment?.descriptor || 'unknown';

        // Get tab groups data (gracefully handle if API not available)
        let groupsMap = new Map();
        try {
            if (chrome.tabGroups && chrome.tabGroups.query) {
                const groups = await chrome.tabGroups.query({});
                groupsMap = new Map(groups.map(g => [g.id, g]));
            }
        } catch (error) {
            console.warn('Tab groups API not available:', error);
            // Continue without group data - tabs will be saved without groups
        }

        // Calculate total tabs
        const totalTabs = windows.reduce((sum, win) => sum + win.tabs.length, 0);

        // If "Save Groups Only" is enabled, check if there are any grouped tabs across all windows
        if (saveGroupsOnly) {
            let hasGroupedTabs = false;
            for (const window of windows) {
                for (const tab of window.tabs) {
                    if (tab.groupId !== undefined && tab.groupId !== -1) {
                        hasGroupedTabs = true;
                        break;
                    }
                }
                if (hasGroupedTabs) break;
            }

            if (!hasGroupedTabs) {
                statusDiv.textContent = 'No grouped tabs found. Disable "Save Groups Only" to save all tabs.';
                return; // Exit early
            }
        }

        // Create main folder using template
        const today = new Date();
        
        // Initialize bookmark logging
        const bookmarkLog = [];
        
        // Check if template includes placeholders (case-insensitive)
        const includeTabFolders = /\{tab-name\}/i.test(mainFolderTemplate);
        const templateHasGroupName = /\{group-name\}/i.test(mainFolderTemplate);
        const templateHasWindowName = /\{window-name\}/i.test(mainFolderTemplate);
        
        // For backward compatibility, also create the old-style folder name for overview file naming
        const mainFolderName = formatMainFolderName(today, windows.length, totalTabs);

        // Generate and save overview HTML if enabled
        if (downloadOverviewEnabled) {
            const overviewHtml = generateOverviewHtml(windows, timestamps, mainFolderName, envDescriptor, groupsMap);
            const blob = new Blob([overviewHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            // Use base download path for overview
            const overviewFilename = sanitizedPath 
                ? `${sanitizedPath}/${envDescriptor}_${mainFolderName}_OneShotBookmarked.htm`
                : `${envDescriptor}_${mainFolderName}_OneShotBookmarked.htm`;

            await chrome.downloads.download({
                url: url,
                filename: overviewFilename,
                saveAs: false
            });
        }

        // Process each window with index for win# suffix
        for (let windowIndex = 0; windowIndex < windows.length; windowIndex++) {
            const window = windows[windowIndex];

            // Update status for current window
            if (autoDownloadEnabled) {
                statusDiv.textContent = `Processing window ${windowIndex + 1}/${windows.length}...`;
            }

            // Resolve template for THIS window specifically
            const windowName = window.title || '';
            
            // If template doesn't have {Group-Name}, resolve at window level
            // Otherwise, will resolve per-group below
            let windowFolderPath, windowFolder;
            
            if (!templateHasGroupName) {
                // Resolve template at window level (no group-specific path)
                windowFolderPath = resolveMainFolderTemplate(mainFolderTemplate, today, windowName, '', envDescriptor);
                
                // Create bookmark folder structure for this window
                let currentParentId = null;
                const pathParts = windowFolderPath.split('/').filter(p => p);
                
                if (pathParts.length === 0) {
                    // Empty template: use Bookmarks Bar root
                    currentParentId = '1';
                } else {
                    for (let i = 0; i < pathParts.length; i++) {
                        const part = pathParts[i];
                        const isRootFolder = (i === 0 && currentParentId === null);
                        const folder = await createBookmarkFolder(part, currentParentId, isRootFolder);
                        currentParentId = folder.id;
                    }
                }
                
                windowFolder = { id: currentParentId };
            } else {
                // Template has {Group-Name}, will resolve per-group
                // For now, just set placeholder values
                windowFolderPath = '';
                windowFolder = { id: '1' }; // Bookmarks Bar root as placeholder
            }

            // Find oldest tab timestamp in this window
            let oldestTabTime = today;
            for (const tab of window.tabs) {
                const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, today);
                const tabTime = new Date(tabTimestamp);
                if (tabTime < oldestTabTime) {
                    oldestTabTime = tabTime;
                }
            }

            // Group tabs by groupId
            const tabsByGroup = new Map();
            const ungroupedTabs = [];
            
            for (const tab of window.tabs) {
                if (tab.groupId !== undefined && tab.groupId !== -1) {
                    if (!tabsByGroup.has(tab.groupId)) {
                        tabsByGroup.set(tab.groupId, []);
                    }
                    tabsByGroup.get(tab.groupId).push(tab);
                } else {
                    ungroupedTabs.push(tab);
                }
            }

            // Apply "Save Groups Only" filter if enabled
            if (saveGroupsOnly) {
                // Check if there are any grouped tabs
                if (tabsByGroup.size === 0) {
                    console.warn(`Window ${windowIndex + 1}: No grouped tabs found with "Save Groups Only" enabled. Skipping window.`);
                    continue; // Skip this window
                }
                // Clear ungrouped tabs array when filter is enabled
                ungroupedTabs.length = 0;
            }

            // Save grouped tabs with group folders
            for (const [groupId, groupTabs] of tabsByGroup) {
                let groupFolder;
                let groupFolderPath;
                
                if (templateHasGroupName) {
                    // Resolve template for THIS group specifically
                    const group = groupsMap.get(groupId);
                    const groupName = group?.title || '';
                    groupFolderPath = resolveMainFolderTemplate(mainFolderTemplate, today, windowName, groupName, envDescriptor);
                    
                    // Create bookmark folder structure for this group
                    let currentParentId = null;
                    const pathParts = groupFolderPath.split('/').filter(p => p);
                    
                    if (pathParts.length === 0) {
                        currentParentId = '1';
                    } else {
                        for (let i = 0; i < pathParts.length; i++) {
                            const part = pathParts[i];
                            const isRootFolder = (i === 0 && currentParentId === null);
                            const folder = await createBookmarkFolder(part, currentParentId, isRootFolder);
                            currentParentId = folder.id;
                        }
                    }
                    
                    groupFolder = { id: currentParentId };
                } else {
                    // Use window-level folder
                    groupFolder = windowFolder;
                    groupFolderPath = windowFolderPath;
                }
                
                // Save tabs in this group with tab-level folders
                for (const tab of groupTabs) {
                    const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, today);
                    const tabCreationTime = new Date(tabTimestamp);
                    const prefix = formatTimestamp(tabCreationTime);
                    
                    let bookmarkParentId;
                    let bookmarkPath;
                    
                    if (includeTabFolders) {
                        // Create tab folder
                        const tabFolderName = formatTabFolder(tab.title, tab.id);
                        const tabFolder = await createBookmarkFolder(tabFolderName, groupFolder.id);
                        bookmarkParentId = tabFolder.id;
                        bookmarkPath = groupFolderPath ? `${groupFolderPath}/${tabFolderName}` : tabFolderName;
                    } else {
                        // Create bookmark directly
                        bookmarkParentId = groupFolder.id;
                        bookmarkPath = groupFolderPath || 'Bookmarks Bar';
                    }
                    
                    // Create bookmark
                    await chrome.bookmarks.create({
                        parentId: bookmarkParentId,
                        title: `${prefix} ${tab.title}`,
                        url: tab.url
                    });
                    
                    // Log bookmark creation
                    bookmarkLog.push(`${bookmarkPath} ${tab.url}`);
                }
            }

            // Save ungrouped tabs with tab-level folders under window folder
            for (const tab of ungroupedTabs) {
                const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, today);
                const tabCreationTime = new Date(tabTimestamp);
                const prefix = formatTimestamp(tabCreationTime);

                let bookmarkParentId;
                let bookmarkPath;
                
                if (includeTabFolders) {
                    // Create tab folder
                    const tabFolderName = formatTabFolder(tab.title, tab.id);
                    const tabFolder = await createBookmarkFolder(tabFolderName, windowFolder.id);
                    bookmarkParentId = tabFolder.id;
                    bookmarkPath = windowFolderPath ? `${windowFolderPath}/${tabFolderName}` : tabFolderName;
                } else {
                    // Create bookmark directly
                    bookmarkParentId = windowFolder.id;
                    bookmarkPath = windowFolderPath || 'Bookmarks Bar';
                }
                
                // Create bookmark
                await chrome.bookmarks.create({
                    parentId: bookmarkParentId,
                    title: `${prefix} ${tab.title}`,
                    url: tab.url
                });
                
                // Log bookmark creation
                bookmarkLog.push(`${bookmarkPath} ${tab.url}`);
            }

            // Download tab contents if auto-download is enabled
            if (autoDownloadEnabled) {
                let downloadFolderPath;
                if (useParentFolders) {
                    // Use parent folder structure matching bookmarks
                    downloadFolderPath = sanitizedPath ? `${sanitizedPath}/${windowFolderPath}` : windowFolderPath;
                } else {
                    // Flat structure: just use base path (or Downloads root if empty)
                    downloadFolderPath = sanitizedPath || 'OneShot-Bookmarks';
                }
                await downloadWindowTabsContent(window, downloadFolderPath, timestamps, windowIndex, selector, excludeElements, groupsMap, divExtractionPairs, pathOptions);
            }
        }

        // Create and download log file
        if (bookmarkLog.length > 0) {
            const logContent = bookmarkLog.join('\n');
            const logBlob = new Blob([logContent], { type: 'text/plain' });
            const logUrl = URL.createObjectURL(logBlob);
            
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const hours = String(today.getHours()).padStart(2, '0');
            const minutes = String(today.getMinutes()).padStart(2, '0');
            const logFilename = sanitizedPath 
                ? `${sanitizedPath}/${year}${month}${day}${hours}${minutes}_logging.txt`
                : `${year}${month}${day}${hours}${minutes}_logging.txt`;
            
            await chrome.downloads.download({
                url: logUrl,
                filename: logFilename,
                saveAs: false
            });
            
            setTimeout(() => URL.revokeObjectURL(logUrl), 1000);
        }
        
        const successMessage = autoDownloadEnabled 
            ? 'All tabs saved and downloaded successfully!' 
            : 'All tabs saved successfully!';
        statusDiv.textContent = successMessage;
        setTimeout(() => { window.close(); }, 3000);
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        console.error('Extension error:', error);
    }
}