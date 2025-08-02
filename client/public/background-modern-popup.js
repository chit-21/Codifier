console.log('Background service worker loaded and running.');

// Alarm handler function
function handleAlarm(alarm) {
  console.log('⏰ Alarm triggered:', alarm.name);

  const contestName = alarm.name.replace("contest_", "").replace(/_/g, " ");
  const urlKey = 'url_' + alarm.name;
  const platformKey = 'platform_' + alarm.name;

  chrome.storage.local.get([urlKey, platformKey], (result) => {
    const contestURL = result[urlKey] || 'https://codeforces.com/contests';
    const platformIcon = result[platformKey] || 'platforms/codeforces.png';

    chrome.storage.local.set({
      lastAlarm: contestName,
      lastAlarmURL: contestURL,
      lastAlarmPlatform: platformIcon,
      alarmTime: new Date().toLocaleString()
    });

    // Create modern popup window
    chrome.windows.create({
      url: chrome.runtime.getURL('modern-reminder.html'),
      type: 'popup',
      width: 450,
      height: 350,
      top: 50,
      left: 50,
      focused: true
    }, (win) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to create modern popup window:', chrome.runtime.lastError);
        
        // Fallback to notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: platformIcon,
          title: '⏰ Contest Reminder!',
          message: `"${contestName}" starts in 10 minutes!`,
          requireInteraction: true,
          buttons: [
            { title: 'Open Contest' },
            { title: 'Dismiss' }
          ]
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Failed to create notification:', chrome.runtime.lastError);
            // Final fallback to badge
            chrome.action.setBadgeText({ text: '⏰' });
            chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
            chrome.action.setTitle({ title: `REMINDER: ${contestName} starts in 10 minutes!` });
          } else {
            console.log('✅ Fallback notification created with ID:', notificationId);
            chrome.storage.local.set({
              currentNotification: {
                id: notificationId,
                contestName: contestName,
                contestURL: contestURL
              }
            });
          }
        });
      } else {
        console.log('✅ Modern popup window created with ID:', win.id);
        
        // Auto-close popup after 15 seconds if not manually closed
        setTimeout(() => {
          chrome.windows.get(win.id, (window) => {
            if (window && !chrome.runtime.lastError) {
              chrome.windows.remove(win.id, () => {
                console.log('🔕 Modern popup window auto-closed');
              });
            }
          });
        }, 15000);
      }
    });
  });
}

// Notification click handler (for fallback)
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.storage.local.get(['currentNotification'], (result) => {
    if (result.currentNotification && result.currentNotification.id === notificationId) {
      chrome.tabs.create({ url: result.currentNotification.contestURL });
      chrome.notifications.clear(notificationId);
      chrome.storage.local.remove(['currentNotification']);
    }
  });
});

// Notification button click handler (for fallback)
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.storage.local.get(['currentNotification'], (result) => {
    if (result.currentNotification && result.currentNotification.id === notificationId) {
      if (buttonIndex === 0) {
        chrome.tabs.create({ url: result.currentNotification.contestURL });
      }
      chrome.notifications.clear(notificationId);
      chrome.storage.local.remove(['currentNotification']);
    }
  });
});

// Message handler function
function handleMessage(request, sender, sendResponse) {
  console.log('📨 Message received:', request);

  if (request.action === 'setContestAlarm') {
    const urlKey = 'url_' + request.alarmName;
    const platformKey = 'platform_' + request.alarmName;
    
    // Store contest URL and platform info
    const storageData = {};
    if (request.contestURL) {
      storageData[urlKey] = request.contestURL;
    }
    if (request.platformIcon) {
      storageData[platformKey] = request.platformIcon;
    }
    
    if (Object.keys(storageData).length > 0) {
      chrome.storage.local.set(storageData);
    }
    
    chrome.alarms.create(request.alarmName, { delayInMinutes: request.delayInMinutes }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Alarm creation failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Alarm created:', request.alarmName);
        sendResponse({ success: true });
      }
    });
    return true; // Must return true for async response
  }
}

// Register the listeners
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.runtime.onMessage.addListener(handleMessage);

// Badge clear on icon click
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'Contest Notifier' });
  console.log('🧹 Badge cleared by user click');
});

// Startup logs
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Extension started or browser restarted.');
});
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Extension installed or updated.');
}); 