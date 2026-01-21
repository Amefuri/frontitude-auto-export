let forceStopRequested = false;
// --- Logging utility ---
function logAction(message) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour12: false });
  chrome.runtime.sendMessage({ type: 'log', message: `[${time}] ${message}` });
}

// Handle extension icon click to toggle side panel
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startExport') {
    forceStopRequested = false;
    processNextProject();
  }
  if (message.action === 'forceStopExport') {
    forceStopRequested = true;
    logAction('Force Stop received. Stopping export process.');
  }
});

async function processNextProject() {
  const data = await chrome.storage.local.get(['projectLinks', 'currentIndex', 'totalLinks']);
  let { projectLinks, currentIndex, totalLinks } = data;

  if (forceStopRequested) {
    logAction('Export process was force stopped.');
    chrome.runtime.sendMessage({ action: 'complete' });
    return;
  }
  if (!projectLinks || currentIndex >= projectLinks.length) {
    logAction('All exports completed!');
    chrome.runtime.sendMessage({ action: 'complete' });
    return;
  }

  // Concat '?design=true&list=true' to each link if not already present
  projectLinks = projectLinks.map(link => {
    if (!link) return link;
    const hasParams = link.includes('?');
    const paramString = 'design=true&list=true';
    if (hasParams) {
      // Avoid duplicate params
      if (link.includes('design=true') && link.includes('list=true')) return link;
      return link + (link.endsWith('?') ? '' : '&') + paramString;
    } else {
      return link + '?' + paramString;
    }
  });

  // Save updated links back to storage for next iterations
  await chrome.storage.local.set({ projectLinks });

  const currentLink = projectLinks[currentIndex];
  logAction(`Navigating to url: ${currentLink}`);

  // Send progress update
  chrome.runtime.sendMessage({ 
    action: 'progress', 
    current: currentIndex + 1, 
    total: totalLinks 
  });

  try {
    // Create or update tab with the project link
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let targetTab;

    if (tabs.length > 0) {
      targetTab = tabs[0];
      await chrome.tabs.update(targetTab.id, { url: currentLink });
    } else {
      targetTab = await chrome.tabs.create({ url: currentLink });
    }
    logAction('Wait for timer (2s before export)');

    // Wait for tab to load and then execute the export process
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (forceStopRequested) {
        chrome.tabs.onUpdated.removeListener(listener);
        logAction('Export process was force stopped (during tab update).');
        chrome.runtime.sendMessage({ action: 'complete' });
        return;
      }
      if (tabId === targetTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        logAction('Tab loaded, preparing to click export');
        // Execute content script to perform export
        setTimeout(() => {
          if (forceStopRequested) {
            logAction('Export process was force stopped (before export click).');
            chrome.runtime.sendMessage({ action: 'complete' });
            return;
          }
          logAction('Click export');
          chrome.tabs.sendMessage(targetTab.id, { action: 'performExport' }, async (response) => {
            if (forceStopRequested) {
              logAction('Export process was force stopped (after export click).');
              chrome.runtime.sendMessage({ action: 'complete' });
              return;
            }
            if (chrome.runtime.lastError) {
              logAction('Error: ' + chrome.runtime.lastError.message);
              // Retry the same project
              setTimeout(() => processNextProject(), 2000);
              return;
            }

            if (response && response.success) {
              logAction('Click download file');
              // Move to next project
              await chrome.storage.local.set({ currentIndex: currentIndex + 1 });
              // Wait a bit before processing next to ensure download completes
              setTimeout(() => processNextProject(), 4000);
            } else {
              logAction('Export failed, retrying...');
              // Retry on failure
              setTimeout(() => processNextProject(), 2000);
            }
          });
        }, 2000); // wait 2s after load
      }
    });

  } catch (error) {
    logAction('Error processing project: ' + error.message);
    chrome.runtime.sendMessage({ action: 'error', error: error.message });
    // Retry after error
    setTimeout(() => processNextProject(), 3000);
  }
}