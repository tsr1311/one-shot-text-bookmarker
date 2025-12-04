const MAX_TITLE_LENGTH = 24;

// Sanitize download path - handles subfolder names relative to Downloads
function sanitizePath(path) {
    if (!path) return '';
    
    const trimmedPath = path.trim();
    
    // Remove parent directory traversal and dangerous characters
    // Keep forward slashes for nested subfolders
    return trimmedPath
        .replace(/\.\.\.\./g, '')  // Remove ..
        .replace(/[<>:"|?*]/g, '')   // Remove invalid chars (keep forward slashes)
        .replace(/\\\\/g, '/')        // Convert backslashes to forward slashes
        .replace(/^\/+/, '');        // Remove leading slashes (must be relative)
}

// Sanitize group name for use in bookmark folder names
function sanitizeGroupName(groupTitle, groupId) {
    if (!groupTitle || groupTitle.trim() === '') {
        return `Group-${groupId}`;
    }
    return groupTitle
        .replace(/[/\\:*?"<>|`]/g, '_')
        .trim()
        .slice(0, 50);
}

// Get or create the main OSB folder for all saved windows
async function getOrCreateMainFolder(envDescriptor) {
    const mainFolderName = `OSBed-${envDescriptor}`;
    const existing = await chrome.bookmarks.search({ title: mainFolderName });
    const existingFolder = existing.find(b => b.parentId === '1' && !b.url);

    if (existingFolder) {
        return existingFolder;
    }

    return await chrome.bookmarks.create({
        parentId: '1',
        title: mainFolderName
    });
}

// Format snapshot folder name with counts - YYYYMMDD-HHMM___(n)win-(m)tab
function formatMainFolderName(date, windowCount, totalTabs) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}___(${windowCount})win-(${totalTabs})tab`;
}

// Format window folder name with date, tab count, first tab title, and window number
function formatWindowFolder(date, tabCount, firstTabTitle = '', windowNumber = 1) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Sanitize and trim the first tab title
    const sanitizedTitle = (firstTabTitle || '')
        .replace(/[/\\:*?"<>|`]/g, '_')
        .trim()
        .slice(0, MAX_TITLE_LENGTH);

    return `${year}${month}${day}___(${tabCount})tab_win${windowNumber}___${sanitizedTitle}`;
}

// Format timestamp for tab names
function formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Generate HTML overview of all windows and tabs
function generateOverviewHtml(windows, timestamps, mainFolderName, envDescriptor) {
    const today = new Date();


    const style = `
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            h1, h2 { color: #333; }
            .tab { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
            .tab a { color: #1a73e8; text-decoration: none; }
            .tab a:hover { text-decoration: underline; }
            .meta { color: #666; font-size: 0.9em; margin-top: 5px; }
        </style>
`;

    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Windows and Tabs Overview - ${mainFolderName}</title>
    ${style}
</head>
<body>
    <div class="container">
        <h1>One-Shot Bookmarked Windows and Tabs</h1>
        <h2>${envDescriptor}_${mainFolderName}</h2
        <div class="timestamp">Generated on: ${formatTimestamp(today)}</div>`;

    windows.forEach((window, windowIndex) => {
        // Find oldest tab timestamp in this window
        let oldestTabTime = today;
        const tabTimestamps = window.tabs.map(tab => {
            // Use the same timestamp logic as the main bookmarking code
            const urlVisitTime = timestamps.urlVisits.find(([url]) => url === tab.url)?.[1];
            if (urlVisitTime) {
                const tabTime = new Date(urlVisitTime);
                if (tabTime < oldestTabTime) {
                    oldestTabTime = tabTime;
                }
                return { tab, time: tabTime, source: 'url-history' };
            }

            const tabCreationTime = timestamps.tabs.find(([id]) => id === tab.id)?.[1];
            if (tabCreationTime) {
                const tabTime = new Date(tabCreationTime);
                if (tabTime < oldestTabTime) {
                    oldestTabTime = tabTime;
                }
                return { tab, time: tabTime, source: 'tab-creation' };
            }

            const tabTime = new Date();
            if (tabTime < oldestTabTime) {
                oldestTabTime = tabTime;
            }
            return { tab, time: tabTime, source: 'current-time' };
        });

        const windowFolderName = formatWindowFolder(oldestTabTime, window.tabs.length, window.tabs[0]?.title || '', windowIndex + 1);

        html += `
        <div class="window">
            <h2>Window ${windowIndex + 1}</h2>
            <div class="timestamp">Oldest tab: ${formatTimestamp(oldestTabTime)}</div>
            <div class="timestamp">Folder: ${windowFolderName}</div>
            <div class="tabs">`;

        tabTimestamps.forEach(({ tab, time, source }) => {
            const prefix = formatTimestamp(time);  // Use the time we already computed

            const timeSource = {
                'url-history': 'Using URL visit time',
                'tab-creation': 'Using tab creation time',
                'current-time': 'Using current time (no history available)'
            }[source];

            html += `
                <div class="tab">
                    <a href="${escapeHtml(tab.url)}" target="_blank">${escapeHtml(tab.title || tab.url)}</a>
                    <div class="meta">
                        Created: ${prefix}<br>
                        Bookmark name: ${prefix} ${escapeHtml(tab.title || tab.url)}
                        <br>${timeSource}
                    </div>
                </div>`;
        });

        html += `
            </div>
        </div>`;
    });

    html += `
    </div>
</body>
</html>`;

    return html;
}

// Create a bookmark folder and return it
async function createBookmarkFolder(name, parentId = null, envDescriptor = null) {
    // If no parent ID is provided, create/get the main folder
    if (!parentId) {
        const mainFolder = await getOrCreateMainFolder(envDescriptor);
        parentId = mainFolder.id;
    }

    // Check if folder already exists under the parent
    const existing = await chrome.bookmarks.search({ title: name });
    const existingFolder = existing.find(b => b.parentId === parentId && !b.url);

    if (existingFolder) {
        return existingFolder;
    }

    return await chrome.bookmarks.create({
        parentId: parentId,
        title: name
    });
}

// Escape HTML special characters
function escapeHtml(unsafe) {
    if (unsafe == null) {
        unsafe = '';
    }
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get tab timestamp (moved from popup.js for reuse)
function getTabTimestamp(tabId, url, timestamps, fallbackDate) {
    // First try URL visit time as it's the most accurate
    const urlVisitTime = timestamps.urlVisits.find(([visitUrl]) => visitUrl === url)?.[1];
    if (urlVisitTime) {
        return urlVisitTime;
    }

    // Fall back to tab creation time if available
    const tabCreationTime = timestamps.tabs.find(([id]) => id === tabId)?.[1];
    if (tabCreationTime) {
        return tabCreationTime;
    }

    // Use fallback date as last resort
    return fallbackDate.toISOString();
}

// Create a placeholder file in the specified folder using chrome.downloads API
async function createPlaceholderFile(folderPath) {
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: 'data:text/plain;charset=utf-8,',
            filename: folderPath + '/.placeholder',
            saveAs: false
        }, function (id) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

// Download tab content as HTML file
async function downloadTabContent(tab, folderPath, filePrefix, selector, excludeElements) {
    try {
        // Create a safe filename from the tab title
        const safeTitle = (tab.title || 'untitled')
            .replace(/[/\\:*?"<>|`]/g, '_')
            .trim()
            .slice(0, 90); // Limit filename length
        
        // Skip non-http(s) URLs that can't be accessed
        if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
            console.log(`Skipping tab: ${tab.title} - URL not accessible: ${tab.url}`);
            return;
        }

        // Execute script to get page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (selector, excludeElements) => {
                let content = '';
                if (selector) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        content += el.outerHTML + '\n';
                    });
                } else {
                    const doctype = document.doctype ? 
                        `<!DOCTYPE ${document.doctype.name}${document.doctype.publicId ? ` PUBLIC "${document.doctype.publicId}"` : ''}${document.doctype.systemId ? ` "${document.doctype.systemId}"` : ''}>` : 
                        '<!DOCTYPE html>';
                    content = doctype + '\n' + document.documentElement.outerHTML;
                }
                
                // Remove excluded elements if specified
                if (excludeElements) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    
                    // Parse comma-separated list of tags
                    const tagsToExclude = excludeElements.split(',').map(tag => tag.trim()).filter(tag => tag);
                    
                    tagsToExclude.forEach(tag => {
                        const elements = doc.querySelectorAll(tag);
                        elements.forEach(el => el.remove());
                    });
                    
                    // Rebuild content from cleaned document
                    const doctype = document.doctype ? 
                        `<!DOCTYPE ${document.doctype.name}${document.doctype.publicId ? ` PUBLIC "${document.doctype.publicId}"` : ''}${document.doctype.systemId ? ` "${document.doctype.systemId}"` : ''}>` : 
                        '<!DOCTYPE html>';
                    content = doctype + '\n' + doc.documentElement.outerHTML;
                }
                
                // Extract domain from URL
                let domain = '';
                try {
                    const urlObj = new URL(window.location.href);
                    domain = urlObj.hostname;
                } catch (e) {
                    domain = 'unknown';
                }
                
                return {
                    html: content,
                    title: document.title,
                    url: window.location.href,
                    domain: domain
                };
            },
            args: [selector, excludeElements]
        });

        if (results && results[0] && results[0].result) {
            const pageData = results[0].result;
            
            // Create HTML content with metadata
            const htmlContent = `<!-- url: ${pageData.url} -->
<!-- url-domain: ${pageData.domain} -->
<!-- url-ts-saved: ${new Date().toISOString()} -->
<!-- page-title: ${escapeHtml(pageData.title)} -->
${pageData.html}`;

            // Create blob and download
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const filename = `${folderPath}/${safeTitle}.html`;
            
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: false
            });

            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log(`Downloaded: ${filename}`);
        }
    } catch (error) {
        console.error(`Failed to download tab content for ${tab.title}:`, error);
        // Don't throw error to prevent stopping the entire process
    }
}

// Download all tabs content in a window
async function downloadWindowTabsContent(window, windowFolderPath, timestamps, windowIndex, selector, excludeElements) {
    const downloadPromises = window.tabs.map(async (tab, tabIndex) => {
        try {
            // Get tab timestamp for filename prefix
            const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, new Date());
            const tabTime = new Date(tabTimestamp);
            const prefix = formatTimestamp(tabTime);
            
            await downloadTabContent(tab, windowFolderPath, prefix, selector, excludeElements);
        } catch (error) {
            console.error(`Error downloading tab ${tabIndex + 1} in window ${windowIndex + 1}:`, error);
        }
    });

    // Process downloads with some delay to avoid overwhelming the browser
    for (let i = 0; i < downloadPromises.length; i += 3) {
        const batch = downloadPromises.slice(i, i + 3);
        await Promise.all(batch);
        
        // Small delay between batches
        if (i + 3 < downloadPromises.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}