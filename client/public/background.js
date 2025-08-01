console.log('Background service worker loaded and running.');

// Alarm handler function
function handleAlarm(alarm) {
  console.log('⏰ Alarm triggered:', alarm.name);

  const contestName = alarm.name.replace("contest_", "").replace(/_/g, " ");
  const urlKey = 'url_' + alarm.name;

  chrome.storage.local.get([urlKey], (result) => {
    const contestURL = result[urlKey] || 'https://codeforces.com/contests';

    chrome.storage.local.set({
      lastAlarm: contestName,
      lastAlarmURL: contestURL,
      alarmTime: new Date().toLocaleString()
    });

    // Popup window at a static position -- NO "screen" usage!
    chrome.windows.create({
      url: chrome.runtime.getURL('reminder.html'),
      type: 'popup',
      width: 350,
      height: 200,
      top: 100,
      left: 100,
      focused: true
    }, (win) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to create popup window:', chrome.runtime.lastError);

        // Fallback badge
        chrome.action.setBadgeText({ text: '⏰' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
        chrome.action.setTitle({ title: `REMINDER: ${contestName} starts in 10 minutes!` });
      } else {
        console.log('✅ Reminder popup window created with ID:', win.id);

        setTimeout(() => {
          chrome.windows.remove(win.id, () => {
            if (chrome.runtime.lastError) {
              console.log('🔔 Popup window already closed');
            } else {
              console.log('🔕 Popup window auto-closed');
            }
          });
        }, 15000);
      }
    });
  });
}

// Message handler function
function handleMessage(request, sender, sendResponse) {
  console.log('📨 Message received:', request);

  if (request.action === 'setContestAlarm') {
    const urlKey = 'url_' + request.alarmName;
    if (request.contestURL) {
      chrome.storage.local.set({ [urlKey]: request.contestURL });
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
