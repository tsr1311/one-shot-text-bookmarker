// Store window and tab creation times
const windowCreationTimes = new Map();
const tabCreationTimes = new Map();
const urlFirstVisits = new Map(); // Cache for URL first visit times
const tabGroups = new Map(); // Cache for tab group data

// Store system environment info
let environmentInfo = null;

// Get system environment information
async function getEnvironmentInfo() {
    const [platformInfo, cpuInfo, memoryInfo, displayInfo] = await Promise.all([
        chrome.runtime.getPlatformInfo(),
        chrome.system.cpu.getInfo(),
        chrome.system.memory.getInfo(),
        chrome.system.display.getInfo()
    ]);

    // Format memory size to GB
    const ramGB = Math.round(memoryInfo.capacity / (1024 * 1024 * 1024));

    // Get primary display
    const primaryDisplay = displayInfo.find(d => d.isPrimary) || displayInfo[0];
    const screenRes = primaryDisplay ?
        `${primaryDisplay.bounds.width}x${primaryDisplay.bounds.height}` :
        'unknown';

    // Create composite descriptor
    const descriptor = `${platformInfo.os}-${cpuInfo.archName}-${ramGB}GB`;

    return {
        descriptor,
        details: {
            platform: platformInfo,
            cpu: cpuInfo,
            memory: memoryInfo,
            display: displayInfo
        }
    };
}

// Get the earliest history visits for multiple URLs efficiently
async function getFirstVisitTimes(urls) {
    const uniqueUrls = [...new Set(urls)]; // Remove duplicates
    const visitPromises = uniqueUrls.map(url =>
        chrome.history.getVisits({ url })
            .then(visits => {
                if (visits.length > 0) {
                    // Find earliest visit
                    const earliestVisit = visits.reduce((earliest, visit) =>
                        visit.visitTime < earliest.visitTime ? visit : earliest
                    );
                    return [url, new Date(earliestVisit.visitTime).toISOString()];
                }
                return [url, new Date().toISOString()];
            })
            .catch(() => [url, new Date().toISOString()])
    );

    const results = await Promise.all(visitPromises);
    return new Map(results);
}

// Initialize timestamps for existing windows and tabs
async function initializeExistingTimestamps() {
    // Initialize existing windows with current time
    const windows = await chrome.windows.getAll();
    windows.forEach(window => {
        if (!windowCreationTimes.has(window.id)) {
            windowCreationTimes.set(window.id, new Date().toISOString());
        }
    });

    // Get all tabs and their URLs
    const tabs = await chrome.tabs.query({});
    const urlsToCheck = tabs.map(tab => tab.url).filter(url => url && !urlFirstVisits.has(url));

    if (urlsToCheck.length > 0) {
        // Batch fetch history data for all URLs
        const newVisitTimes = await getFirstVisitTimes(urlsToCheck);

        // Update our URL cache
        for (const [url, timestamp] of newVisitTimes) {
            urlFirstVisits.set(url, timestamp);
        }

        // Set tab creation times based on URL first visits
        tabs.forEach(tab => {
            if (tab.url && !tabCreationTimes.has(tab.id)) {
                const timestamp = urlFirstVisits.get(tab.url) || new Date().toISOString();
                tabCreationTimes.set(tab.id, timestamp);
            }
        });
    }
}

// Update tab groups cache
async function updateGroupData() {
    try {
        const groups = await chrome.tabGroups.query({});
        tabGroups.clear();
        groups.forEach(group => {
            tabGroups.set(group.id, group);
        });
    } catch (error) {
        console.error('Failed to update group data:', error);
    }
}

// Initialize timestamps and environment info when extension loads
Promise.all([
    initializeExistingTimestamps(),
    getEnvironmentInfo().then(info => {
        environmentInfo = info;
    }),
    updateGroupData()
]);

// Track window creation
chrome.windows.onCreated.addListener((window) => {
    const timestamp = new Date().toISOString();
    windowCreationTimes.set(window.id, timestamp);
});

// Track tab creation and update with history data
chrome.tabs.onCreated.addListener(async (tab) => {
    if (tab.url) {
        // Check URL cache first
        if (urlFirstVisits.has(tab.url)) {
            tabCreationTimes.set(tab.id, urlFirstVisits.get(tab.url));
            return;
        }

        // Fetch history data for new URL
        const visitTimes = await getFirstVisitTimes([tab.url]);
        const timestamp = visitTimes.get(tab.url) || new Date().toISOString();

        // Update caches
        urlFirstVisits.set(tab.url, timestamp);
        tabCreationTimes.set(tab.id, timestamp);
    } else {
        // For new tabs without URLs yet
        tabCreationTimes.set(tab.id, new Date().toISOString());
    }
});

// Track tab group changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.groupId !== undefined) {
        updateGroupData();
    }
});

// Clean up when windows/tabs are removed
chrome.windows.onRemoved.addListener((windowId) => {
    windowCreationTimes.delete(windowId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
    tabCreationTimes.delete(tabId);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimestamps") {
        // Return timestamps, URL cache, environment info, and group data
        sendResponse({
            windows: Array.from(windowCreationTimes.entries()),
            tabs: Array.from(tabCreationTimes.entries()),
            urlVisits: Array.from(urlFirstVisits.entries()),
            environment: environmentInfo,
            groups: Array.from(tabGroups.entries())
        });
    }
    return true; // Keep the message channel open for async response
});