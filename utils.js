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

// Resolve main folder path template with variables
// Variables: {YYYYMMDD}, {HHMM}, {OS-environment}, {Window-Name}, {Group-Name}, or custom text
function resolveMainFolderTemplate(template, date = new Date(), windowName = '', groupName = '', envDescriptor = '') {
    if (!template) {
        // Default template
        template = '{OS-environment}/{YYYYMMDD}/';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Resolve variables
    let resolved = template
        .replace(/\{YYYYMMDD\}/g, `${year}${month}${day}`)
        .replace(/\{HHMM\}/g, `${hours}${minutes}`)
        .replace(/\{OS-environment\}/g, envDescriptor || 'OSBed-Unknown')
        .replace(/\{Window-Name\}/g, windowName || 'Window')
        .replace(/\{Group-Name\}/g, groupName || 'NoGroup');
    
    // Sanitize the resolved path
    resolved = resolved
        .replace(/[<>:"|?*]/g, '_')
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')  // Replace multiple slashes with single
        .replace(/^\/+/, '')   // Remove leading slashes
        .replace(/\/+$/, '');  // Remove trailing slashes
    
    return resolved;
}

// Build bookmark folder structure based on path structure setting
// Returns object with parentId and folder hierarchy info
function buildBookmarkPath(windowFolder, groupName, pathStructure = 'window-group') {
    // For 'window-group' (default): bookmarks go under window/group/
    // For 'group-window': would need group at top level, then window
    // Since we create window folders in the main loop, we handle this at bookmark creation time
    // For now, this function prepares the structure info
    return {
        structure: pathStructure,
        windowFolder: windowFolder,
        groupName: groupName
    };
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
function formatWindowFolder(date, tabCount, firstTabTitle = '', windowNumber = 1, windowName = '', windowId = null) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Priority: window name > first tab title > win-{id}
    let displayName = '';
    if (windowName) {
        displayName = windowName;
    } else if (firstTabTitle) {
        displayName = firstTabTitle;
    } else if (windowId !== null) {
        displayName = `win-${windowId}`;
    } else {
        displayName = `Window ${windowNumber}`;
    }
    
    const sanitizedTitle = displayName
        .replace(/[/\\:*?"<>|`]/g, '_')
        .trim()
        .slice(0, MAX_TITLE_LENGTH);

    return `${year}${month}${day}___(${tabCount})tab_win${windowNumber}___${sanitizedTitle}`;
}

// Format tab folder name based on tab title
function formatTabFolder(tabTitle, tabId) {
    if (!tabTitle || tabTitle.trim() === '') {
        return `tab-${tabId}`;
    }
    
    return tabTitle
        .replace(/[/\\:*?"<>|`]/g, '_')
        .trim()
        .slice(0, MAX_TITLE_LENGTH);
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
function generateOverviewHtml(windows, timestamps, mainFolderName, envDescriptor, groupsMap = null) {
    const today = new Date();


    const style = `
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            h1, h2, h3 { color: #333; }
            h3 { margin-top: 20px; margin-bottom: 10px; padding: 8px 12px; background: #e8f0fe; border-left: 4px solid #1a73e8; }
            .group { margin: 15px 0; padding: 10px; background: #fff; border-radius: 4px; border: 1px solid #ddd; }
            .ungrouped { margin: 15px 0; padding: 10px; background: #fafafa; border-radius: 4px; border: 1px solid #e0e0e0; }
            .tab { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
            .tab a { color: #1a73e8; text-decoration: none; }
            .tab a:hover { text-decoration: underline; }
            .meta { color: #666; font-size: 0.9em; margin-top: 5px; }
            .window-name { color: #1a73e8; font-weight: bold; }
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

        const windowName = window.title || '';
        const windowFolderName = formatWindowFolder(oldestTabTime, window.tabs.length, window.tabs[0]?.title || '', windowIndex + 1, windowName);

        html += `
        <div class="window">
            <h2>Window ${windowIndex + 1}${ windowName ? ` - <span class="window-name">${escapeHtml(windowName)}</span>` : ''}</h2>
            <div class="timestamp">Oldest tab: ${formatTimestamp(oldestTabTime)}</div>
            <div class="timestamp">Folder: ${windowFolderName}</div>`;

        // Group tabs by groupId if groupsMap is available
        if (groupsMap && groupsMap.size > 0) {
            const tabsByGroup = new Map();
            const ungroupedTabs = [];

            tabTimestamps.forEach(({ tab, time, source }) => {
                if (tab.groupId !== undefined && tab.groupId !== -1) {
                    if (!tabsByGroup.has(tab.groupId)) {
                        tabsByGroup.set(tab.groupId, []);
                    }
                    tabsByGroup.get(tab.groupId).push({ tab, time, source });
                } else {
                    ungroupedTabs.push({ tab, time, source });
                }
            });

            // Render grouped tabs
            for (const [groupId, groupTabs] of tabsByGroup) {
                const group = groupsMap.get(groupId);
                const groupName = group?.title || `Group-${groupId}`;
                const groupColor = group?.color || 'grey';

                html += `
            <div class="group">
                <h3>📁 Group: ${escapeHtml(groupName)} <span style="color: ${groupColor};">●</span> (${groupTabs.length} tabs)</h3>
                <div class="tabs">`;

                groupTabs.forEach(({ tab, time, source }) => {
                    const prefix = formatTimestamp(time);
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
            }

            // Render ungrouped tabs
            if (ungroupedTabs.length > 0) {
                html += `
            <div class="ungrouped">
                <h3>📄 Ungrouped Tabs (${ungroupedTabs.length})</h3>
                <div class="tabs">`;

                ungroupedTabs.forEach(({ tab, time, source }) => {
                    const prefix = formatTimestamp(time);
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
            }
        } else {
            // No groups available, render all tabs flat
            html += `
            <div class="tabs">`;

            tabTimestamps.forEach(({ tab, time, source }) => {
                const prefix = formatTimestamp(time);
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
            </div>`;
        }

        html += `
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
// Note: Some pages (like chrome://, chrome-extension://, Google Drive, etc.) cannot be accessed
// due to browser security restrictions. These will be skipped gracefully.
async function downloadTabContent(tab, folderPath, filePrefix, selector, excludeElements, groupName = null, divExtractionPairs = '') {
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
            func: (selector, excludeElements, divExtractionPairs) => {
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
                
                // Extract DIV content based on key:value pairs
                const extractedData = {};
                if (divExtractionPairs) {
                    const lines = divExtractionPairs.split('\\n').map(line => line.trim()).filter(line => line);
                    
                    for (const line of lines) {
                        // Split on " : " (space-colon-space) to separate selector from comment name
                        const separatorIndex = line.indexOf(' : ');
                        if (separatorIndex === -1) continue;
                        
                        let attributeSelector = line.substring(0, separatorIndex).trim();
                        const commentName = line.substring(separatorIndex + 3).trim();
                        
                        if (!attributeSelector || !commentName) continue;
                        
                        // Check if selector specifies element type (e.g., "meta:property='og:description'")
                        let elementType = 'div'; // default
                        let jsonPath = null; // for JSON extraction from script tags
                        
                        if (attributeSelector.includes(':')) {
                            const parts = attributeSelector.split(':');
                            if (parts[0].match(/^(meta|div|span|a|article|section|header|script)$/i)) {
                                elementType = parts[0].toLowerCase();
                                attributeSelector = parts.slice(1).join(':');
                            }
                        }
                        
                        // Check for JSON path extraction (e.g., "script[type="application/ld+json"]::title")
                        if (elementType === 'script' && attributeSelector.includes('::')) {
                            const pathSeparatorIndex = attributeSelector.indexOf('::');
                            jsonPath = attributeSelector.substring(pathSeparatorIndex + 2).trim();
                            attributeSelector = attributeSelector.substring(0, pathSeparatorIndex).trim();
                        }
                        
                        // Find all elements of specified type that match the attribute selector
                        const elements = document.querySelectorAll(elementType);
                        
                        for (const element of elements) {
                            // Check if the element's outerHTML contains all the attributes specified
                            const outerHTML = element.outerHTML;
                            const attributes = attributeSelector.split(/\\s+/);
                            let allMatch = true;
                            
                            for (const attr of attributes) {
                                if (!outerHTML.includes(attr)) {
                                    allMatch = false;
                                    break;
                                }
                            }
                            
                            if (allMatch) {
                                let extractedText = '';
                                
                                // For script tags with JSON, extract and parse
                                if (elementType === 'script' && jsonPath) {
                                    try {
                                        const jsonContent = element.textContent || element.innerText || '';
                                        const jsonData = JSON.parse(jsonContent);
                                        
                                        // Navigate the JSON path (e.g., "title" or "hiringOrganization.name")
                                        const pathParts = jsonPath.split('.');
                                        let value = jsonData;
                                        
                                        for (const part of pathParts) {
                                            if (value && typeof value === 'object' && part in value) {
                                                value = value[part];
                                            } else {
                                                value = null;
                                                break;
                                            }
                                        }
                                        
                                        if (value !== null && value !== undefined) {
                                            extractedText = typeof value === 'string' ? value : JSON.stringify(value);
                                        }
                                    } catch (e) {
                                        console.error('JSON extraction error:', e);
                                    }
                                } else if (elementType === 'meta') {
                                    // For meta tags, extract the content attribute
                                    extractedText = element.getAttribute('content') || '';
                                } else {
                                    // For other elements, extract visible text content
                                    extractedText = element.textContent || element.innerText || '';
                                }
                                
                                const cleanedText = extractedText.trim();
                                
                                if (cleanedText) {
                                    // Store first match for this comment name
                                    if (!extractedData[commentName]) {
                                        extractedData[commentName] = cleanedText;
                                    }
                                }
                            }
                        }
                    }
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
                    domain: domain,
                    extractedData: extractedData
                };
            },
            args: [selector, excludeElements, divExtractionPairs]
        });

        if (results && results[0] && results[0].result) {
            const pageData = results[0].result;
            
            // Generate group context comment
            const groupContext = groupName ? groupName : 'ungrouped';
            const tabContextComment = `<!-- tab-context: ${escapeHtml(groupContext)} -->`;
            
            // Generate extracted data comments
            let extractedComments = '';
            if (pageData.extractedData && Object.keys(pageData.extractedData).length > 0) {
                for (const [name, value] of Object.entries(pageData.extractedData)) {
                    extractedComments += `<!-- ${escapeHtml(name)}: ${escapeHtml(value)} -->\n`;
                }
            }
            
            // Create HTML content with metadata
            const htmlContent = `<!-- url: ${pageData.url} -->
<!-- url-domain: ${pageData.domain} -->
<!-- url-ts-saved: ${new Date().toISOString()} -->
<!-- page-title: ${escapeHtml(pageData.title)} -->
${tabContextComment}
${extractedComments}${pageData.html}`;

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
        // Check if this is a permissions error (expected for some sites)
        if (error.message && error.message.includes('Cannot access contents')) {
            console.log(`Skipping tab: ${tab.title} - Extension doesn't have permission to access this page (${tab.url})`);
        } else {
            console.error(`Failed to download tab content for ${tab.title}:`, error);
        }
        // Don't throw error to prevent stopping the entire process
    }
}

// Download all tabs content in a window with group and tab folder structure
async function downloadWindowTabsContent(window, windowFolderPath, timestamps, windowIndex, selector, excludeElements, groupsMap = null, divExtractionPairs = '', pathOptions = {}) {
    // Default path options (all enabled for backward compatibility)
    const {
        includeYYYYMMDD = true,
        includeGroupName = true,
        includeTabDomain = true,
        includeTabName = true
    } = pathOptions;
    // Group tabs by groupId (matching bookmark structure)
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
    
    const downloadPromises = [];
    
    // Process grouped tabs with folder structure: windowFolder/groupFolder/tabFolder/file.html
    for (const [groupId, groupTabs] of tabsByGroup) {
        const group = groupsMap?.get(groupId);
        const groupName = group?.title ? sanitizeGroupName(group.title, groupId) : `Group-${groupId}`;
        
        for (const tab of groupTabs) {
            const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, new Date());
            const tabTime = new Date(tabTimestamp);
            const prefix = formatTimestamp(tabTime);
            
            // Build path dynamically based on options
            let pathComponents = [windowFolderPath];
            
            // Add YYYYMMDD folder if enabled
            if (includeYYYYMMDD) {
                const year = tabTime.getFullYear();
                const month = String(tabTime.getMonth() + 1).padStart(2, '0');
                const day = String(tabTime.getDate()).padStart(2, '0');
                pathComponents.push(`${year}${month}${day}`);
            }
            
            // Add group name if enabled
            if (includeGroupName) {
                pathComponents.push(groupName);
            }
            
            // Add tab domain if enabled
            if (includeTabDomain) {
                const domain = new URL(tab.url).hostname;
                pathComponents.push(domain);
            }
            
            // Add tab name folder if enabled
            if (includeTabName) {
                const tabFolderName = formatTabFolder(tab.title, tab.id);
                pathComponents.push(tabFolderName);
            }
            
            const tabFolderPath = pathComponents.join('/');
            
            downloadPromises.push(
                downloadTabContent(tab, tabFolderPath, prefix, selector, excludeElements, groupName, divExtractionPairs)
                    .catch(error => console.error(`Error downloading grouped tab ${tab.title}:`, error))
            );
        }
    }
    
    // Process ungrouped tabs with folder structure
    for (const tab of ungroupedTabs) {
        const tabTimestamp = getTabTimestamp(tab.id, tab.url, timestamps, new Date());
        const tabTime = new Date(tabTimestamp);
        const prefix = formatTimestamp(tabTime);
        
        // Build path dynamically based on options (skip group name for ungrouped)
        let pathComponents = [windowFolderPath];
        
        // Add YYYYMMDD folder if enabled
        if (includeYYYYMMDD) {
            const year = tabTime.getFullYear();
            const month = String(tabTime.getMonth() + 1).padStart(2, '0');
            const day = String(tabTime.getDate()).padStart(2, '0');
            pathComponents.push(`${year}${month}${day}`);
        }
        
        // Add tab domain if enabled
        if (includeTabDomain) {
            const domain = new URL(tab.url).hostname;
            pathComponents.push(domain);
        }
        
        // Add tab name folder if enabled
        if (includeTabName) {
            const tabFolderName = formatTabFolder(tab.title, tab.id);
            pathComponents.push(tabFolderName);
        }
        
        const tabFolderPath = pathComponents.join('/');
        
        downloadPromises.push(
            downloadTabContent(tab, tabFolderPath, prefix, selector, excludeElements, null, divExtractionPairs)
                .catch(error => console.error(`Error downloading ungrouped tab ${tab.title}:`, error))
        );
    }

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