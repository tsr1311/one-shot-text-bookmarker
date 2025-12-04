// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    const checkbox = document.getElementById('autoDownloadCheckbox');
    const selectorDiv = document.getElementById('selectorDiv');
    const downloadPathInput = document.getElementById('downloadPathInput');
    const selectorInput = document.getElementById('selectorInput');

    try {
        const result = await chrome.storage.local.get(['autoDownloadEnabled', 'downloadPath', 'cssSelector']);
        
        // Handle auto-download checkbox
        checkbox.checked = result.autoDownloadEnabled === true;
        if (checkbox.checked) {
            selectorDiv.style.display = 'block';
        }

        // Handle download path input
        if (result.downloadPath) {
            downloadPathInput.value = result.downloadPath;
        }

        // Handle CSS selector input
        if (result.cssSelector) {
            selectorInput.value = result.cssSelector;
        }

    } catch (error) {
        console.error('Failed to load settings:', error);
    }

    checkbox.addEventListener('change', () => {
        selectorDiv.style.display = checkbox.checked ? 'block' : 'none';
    });

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

    // Save CSS selector when it changes
    selectorInput.addEventListener('change', async (e) => {
        try {
            await chrome.storage.local.set({ cssSelector: e.target.value });
            showSavedIndicator('selectorSavedIndicator');
        } catch (error) {
            console.error('Failed to save CSS selector:', error);
        }
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
                filename: 'one-shot-bookmarker-location.txt',
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
    const selector = document.getElementById('selectorInput').value;

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

        // Calculate total tabs
        const totalTabs = windows.reduce((sum, win) => sum + win.tabs.length, 0);

        // Create main folder with window and tab counts
        const today = new Date();
        const mainFolderName = formatMainFolderName(today, windows.length, totalTabs);
        const mainFolder = await createBookmarkFolder(mainFolderName, null, envDescriptor);

        // Generate and save overview HTML
        const overviewHtml = generateOverviewHtml(windows, timestamps, mainFolderName, envDescriptor);
        const blob = new Blob([overviewHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const overviewFilename = sanitizedPath 
            ? `${sanitizedPath}/${envDescriptor}_${mainFolderName}_OneShotBookmarked.htm`
            : `${envDescriptor}_${mainFolderName}_OneShotBookmarked.htm`;

        await chrome.downloads.download({
            url: url,
            filename: overviewFilename,
            saveAs: false
        });

        // Process each window with index for win# suffix
        for (let windowIndex = 0; windowIndex < windows.length; windowIndex++) {
            const window = windows[windowIndex];

            // Update status for current window
            if (autoDownloadEnabled) {
                statusDiv.textContent = `Processing window ${windowIndex + 1}/${windows.length}...`;
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

            // Get first tab title and create window folder name with window number
            const firstTabTitle = window.tabs[0]?.title || '';
            const windowNumber = windowIndex + 1; // Convert 0-based index to 1-based window number
            const windowFolderName = formatWindowFolder(oldestTabTime, window.tabs.length, firstTabTitle, windowNumber);

            // Create folder for this window under today's folder
            const windowFolder = await createBookmarkFolder(windowFolderName, mainFolder.id);

            // Save all tabs in this window as bookmarks
            for (let tabIndex = 0; tabIndex < window.tabs.length; tabIndex++) {
                const tab = window.tabs[tabIndex];

                // Get tab creation timestamp
                const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, today);
                const tabCreationTime = new Date(tabTimestamp);
                const prefix = formatTimestamp(tabCreationTime);

                // Create bookmark for the tab
                await chrome.bookmarks.create({
                    parentId: windowFolder.id,
                    title: `${prefix} ${tab.title}`,
                    url: tab.url
                });
            }

            // Download tab contents if auto-download is enabled
            if (autoDownloadEnabled) {
                const baseFolderPath = sanitizedPath ? `${sanitizedPath}/${mainFolderName}` : mainFolderName;
                const windowFolderPath = `${baseFolderPath}/${windowFolderName}`;
                await downloadWindowTabsContent(window, windowFolderPath, timestamps, windowIndex, selector);
            }
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