

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Baseline Checker extension installed');
  
  // Create context menu
  try {
    chrome.contextMenus.create({
      id: 'checkBaseline',
      title: 'Check "%s" in Baseline',
      contexts: ['selection']
    });
  } catch (error) {
    console.log('Context menu creation failed:', error);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FEATURES_DETECTED') {
    // Update badge with number of detected features
    updateBadge(sender.tab?.id, message.features);
    
    // Store detected features for the tab
    if (sender.tab?.id) {
      chrome.storage.session.set({
        [`features_${sender.tab.id}`]: {
          features: message.features,
          url: message.url,
          title: message.title,
          timestamp: Date.now()
        }
      }).catch(error => {
        console.log('Storage error:', error);
      });
    }
  }
});

// Update extension badge based on detected features
function updateBadge(tabId, features) {
  if (!tabId || !features || features.length === 0) {
    chrome.action.setBadgeText({text: '', tabId}).catch(() => {});
    return;
  }

  // Count features with limited support
  const limitedFeatures = features.filter(f => f.baseline?.status === 'limited');
  
  if (limitedFeatures.length > 0) {
    chrome.action.setBadgeText({
      text: limitedFeatures.length.toString(),
      tabId
    }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({color: '#dc3545', tabId}).catch(() => {}); // Red
  } else {
    // Show total feature count in green
    const count = Math.min(features.length, 99); // Limit display to 2 digits
    chrome.action.setBadgeText({
      text: count.toString(),
      tabId
    }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({color: '#28a745', tabId}).catch(() => {}); // Green
  }
}

// Clean up stored data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`features_${tabId}`).catch(() => {});
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'checkBaseline' && info.selectionText) {
    // Store the selected text for the popup to use
    chrome.storage.session.set({
      pendingSearch: info.selectionText.trim()
    }).catch(() => {});
  }
});