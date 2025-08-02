console.log('Background service worker loaded and running.');

// Import contest scraper
try {
  importScripts('contest-scraper.js');
  console.log('Contest scraper imported successfully');
} catch (error) {
  console.error('Failed to import contest scraper:', error);
}

// Initialize contest scraper
let contestScraper;
try {
  contestScraper = new ContestScraper();
  console.log('Contest scraper initialized successfully');
} catch (error) {
  console.error('Failed to initialize contest scraper:', error);
}

// Schedule contest scraping every 30 minutes
chrome.alarms.create('scrapeContests', { 
  delayInMinutes: 1, // Start immediately
  periodInMinutes: 30 
});

// Schedule cleanup every 24 hours
chrome.alarms.create('cleanupContests', {
  delayInMinutes: 60, // Start after 1 hour
  periodInMinutes: 24 * 60 // Every 24 hours
});

// Handle scheduled alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!contestScraper) {
    console.error('Contest scraper not initialized, skipping alarm:', alarm.name);
    return;
  }
  
  if (alarm.name === 'scrapeContests') {
    console.log('Running scheduled contest scraping...');
    try {
      await contestScraper.scrapeAllPlatforms();
      console.log('Scheduled contest scraping completed');
    } catch (error) {
      console.error('Error in scheduled scraping:', error);
    }
  } else if (alarm.name === 'cleanupContests') {
    console.log('Running contest cleanup...');
    await cleanupOldContests();
  } else {
    // Handle contest reminder alarms
    handleContestAlarm(alarm);
  }
});

// Cleanup old contests
async function cleanupOldContests() {
  try {
    const stored = await contestScraper.getStoredContests();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let cleaned = false;
    Object.keys(stored.contests).forEach(platform => {
      if (stored.contests[platform].contests) {
        const originalCount = stored.contests[platform].contests.length;
        stored.contests[platform].contests = stored.contests[platform].contests.filter(contest => {
          const endTime = new Date(contest.endTime);
          return endTime > oneDayAgo; // Keep contests that ended less than 24 hours ago
        });
        
        if (stored.contests[platform].contests.length !== originalCount) {
          cleaned = true;
          console.log(`Cleaned ${originalCount - stored.contests[platform].contests.length} old contests from ${platform}`);
        }
      }
    });
    
    if (cleaned) {
      await contestScraper.storeContests(stored.contests);
      console.log('Contest cleanup completed');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Alarm handler function for contest reminders
function handleContestAlarm(alarm) {
  console.log('Alarm triggered:', alarm.name);

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

    // Create sliding notification at bottom right
    chrome.windows.create({
      url: chrome.runtime.getURL('sliding-reminder.html'),
      type: 'popup',
      width: 335,
      height: 200,
      top: 650,
      left: 1200,
      focused: true
    }, (win) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create sliding notification:', chrome.runtime.lastError);
        
        // Fallback to notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: platformIcon,
          title: 'Contest Reminder!',
          message: `"${contestName}" starts in 10 minutes!`,
          requireInteraction: true,
          buttons: [
            { title: 'Open Contest' },
            { title: 'Dismiss' }
          ]
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to create notification:', chrome.runtime.lastError);
            // Final fallback to badge
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
            chrome.action.setTitle({ title: `REMINDER: ${contestName} starts in 10 minutes!` });
          } else {
            console.log('Fallback notification created with ID:', notificationId);
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
        console.log('Sliding notification created with ID:', win.id);
        
        // Auto-close notification after 15 seconds if not manually closed
        setTimeout(() => {
          chrome.windows.get(win.id, (window) => {
            if (window && !chrome.runtime.lastError) {
              chrome.windows.remove(win.id, () => {
                console.log('Sliding notification auto-closed');
              });
            }
          });
        }, 15000);
      }
    });
  });
}
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
  console.log('Message received:', request);

  if (request.action === 'getContests') {
    // Handle contest fetching
    handleGetContests(request, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'refreshContests') {
    // Handle manual refresh
    handleRefreshContests(sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'setContestAlarm') {
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
        console.error('Alarm creation failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Alarm created:', request.alarmName);
        sendResponse({ success: true });
      }
    });
    return true; // Must return true for async response
  }
}

// Handle getting contests from storage
async function handleGetContests(request, sendResponse) {
  if (!contestScraper) {
    console.error('Contest scraper not initialized');
    sendResponse({
      success: false,
      error: 'Contest scraper not initialized',
      contests: [],
      count: 0
    });
    return;
  }
  
  try {
    const filters = {
      platform: request.platform,
      status: request.status,
      timeFilter: request.timeFilter
    };
    
    const result = await contestScraper.getContests(filters);
    sendResponse(result);
  } catch (error) {
    console.error('Error getting contests:', error);
    sendResponse({
      success: false,
      error: error.message,
      contests: [],
      count: 0
    });
  }
}

// Handle manual refresh of contests
async function handleRefreshContests(sendResponse) {
  if (!contestScraper) {
    console.error('Contest scraper not initialized');
    sendResponse({
      success: false,
      error: 'Contest scraper not initialized',
      message: 'Failed to refresh contests'
    });
    return;
  }
  
  try {
    console.log('Manual refresh requested');
    const result = await contestScraper.scrapeAllPlatforms();
    sendResponse({
      success: true,
      message: 'Contests refreshed successfully',
      platforms: Object.keys(result),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing contests:', error);
    sendResponse({
      success: false,
      error: error.message,
      message: 'Failed to refresh contests'
    });
  }
}
// Register the listeners
chrome.runtime.onMessage.addListener(handleMessage);

// Badge clear on icon click
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'Codifier - Contest Tracker' });
  console.log('Badge cleared by user click');
});

// Startup logs
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started or browser restarted.');
});
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated.');
});
