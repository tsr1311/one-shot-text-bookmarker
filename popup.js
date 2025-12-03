// Load saved checkbox state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await chrome.storage.local.get(['autoDownloadEnabled']);
        const checkbox = document.getElementById('autoDownloadCheckbox');
        checkbox.checked = result.autoDownloadEnabled === true;
    } catch (error) {
        console.error('Failed to load auto-download setting:', error);
    }
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
    await saveWindows(allWindows);
});

document.getElementById('saveCurrentWindowButton').addEventListener('click', async () => {
    const currentWindow = await chrome.windows.getCurrent({ populate: true });
    await saveWindows([currentWindow]);
});

async function saveWindows(windows) {
    const statusDiv = document.getElementById('status');
    const autoDownloadEnabled = document.getElementById('autoDownloadCheckbox').checked;
    
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
        await chrome.downloads.download({
            url: url,
            filename: `${envDescriptor}_${mainFolderName}_OneShotBookmarked.htm`,
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
                const windowFolderPath = `${mainFolderName}/${windowFolderName}`;
                await downloadWindowTabsContent(window, windowFolderPath, timestamps, windowIndex);
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