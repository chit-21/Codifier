import React, { useEffect, useState } from 'react';
import './popup.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Removed API_BASE - now using background script for data

const TIME_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Live', value: 'live' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' }
];

const PLATFORMS = [
  'all', 'codeforces', 'leetcode', 'atcoder', 'codechef', 'gfg', 'codingninjas'
];

// Platform colors for visual identification
const PLATFORM_COLORS = {
  codeforces: '#1890ff',
  leetcode: '#ffa116',
  atcoder: '#222222',
  codechef: '#5b4638',
  gfg: '#2f8d46',
  codingninjas: '#f78d1e',
};

// Platform icon paths
const PLATFORM_ICONS = {
  codeforces: 'platforms/codeforces.png',
  leetcode: 'platforms/leetcode.png',
  atcoder: 'platforms/atcoder.png',
  codechef: 'platforms/codechef.jpeg',
  gfg: 'platforms/geeksforgeeks.png',
  codingninjas: 'platforms/codingninja.jpg',
};

// Set alarm 10 minutes before contest
// const setContestAlarm = (contest) => {
//   const contestTime = new Date(contest.startTime).getTime();
//   const triggerTime = contestTime - 10 * 60 * 1000;
//   // const delayInMinutes = (triggerTime - Date.now()) / (1000 * 60);
//   const delayInMinutes = 1;

//   if (delayInMinutes <= 0) {
//     alert("Contest is starting soon or already started!");
//     return;
//   }

//   // Chrome enforces 1-minute minimum for packed extensions
//   const actualDelay = Math.max(1, Math.ceil(delayInMinutes));
//   const alarmName = `contest_${contest.name.replace(/\s/g, "_")}`;

//   chrome.runtime.sendMessage({
//     action: 'setContestAlarm',
//     name: contest.name,
//     alarmName,
//     delayInMinutes: actualDelay
//   }, (response) => {
//     if (response && response.success) {
//       alert(`✅ Reminder set for "${contest.name}" in ${actualDelay} minutes.`);
//     } else {
//       alert(`❌ Failed to set reminder: ${response?.error || 'Unknown error'}`);
//     }
//   });
// };

const setContestAlarm = (contest) => {
  const contestTime = new Date(contest.startTime).getTime();
  const now = Date.now();
  const timeUntilContest = (contestTime - now) / (1000 * 60); // minutes until contest starts
  const triggerTime = contestTime - 10 * 60 * 1000; // 10 minutes before contest
  const delayInMinutes = (triggerTime - now) / (1000 * 60);
  
  // Check if contest starts within 10 minutes
  if (timeUntilContest <= 10) {
    if (timeUntilContest <= 0) {
      toast.info(`⏰ "${contest.name}" has already started! Check it out now.`);
    } else {
      const minutesLeft = Math.ceil(timeUntilContest);
      toast.info(`⏰ "${contest.name}" starts in less than ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}! No reminder needed.`);
    }
    return;
  }
  
  // Check if delay is too small (less than 1 minute)
  if (delayInMinutes < 1) {
    toast.info(`⏰ "${contest.name}" starts very soon! No reminder needed.`);
    return;
  }
  
  const alarmName = `contest_${contest.name.replace(/\s/g, "_")}`;
  
  // Get platform icon for this contest
  const platformIcon = PLATFORM_ICONS[contest.platform] || 'platforms/codeforces.png';

  chrome.runtime.sendMessage({
    action: 'setContestAlarm',
    name: contest.name,
    alarmName,
    delayInMinutes: Math.ceil(delayInMinutes), // Round up to ensure positive integer
    contestURL: contest.url,
    platformIcon: platformIcon
  }, (response) => {
    if (response && response.success) {
      const reminderTime = Math.ceil(delayInMinutes);
      const hours = Math.floor(reminderTime / 60);
      const minutes = reminderTime % 60;
      
      let timeText;
      if (hours > 0) {
        timeText = `${hours}h ${minutes}m`;
      } else {
        timeText = `${minutes} minute${minutes === 1 ? '' : 's'}`;
      }
      
      toast.success(`✅ Reminder set for "${contest.name}" in ${timeText}!`);
    } else {
      toast.error(`❌ Failed to set reminder: ${response?.error || 'Unknown error'}`);
    }
  });
};



export default function Popup() {
  const [contests, setContests] = useState([]);
  const [filter, setFilter] = useState('');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDarkMode ? 'dark' : 'light';
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    console.log('Fetching contests from background script...');

    // Send message to background script to get contests
    chrome.runtime.sendMessage({
      action: 'getContests',
      platform: platform,
      timeFilter: filter
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        setError('Failed to communicate with background script.');
        setLoading(false);
        return;
      }

      if (response && response.success) {
        const sortedContests = (response.contests || []).sort((a, b) => {
          if (a.endTime && b.endTime) return new Date(a.endTime) - new Date(b.endTime);
          else if (a.endTime) return -1;
          else if (b.endTime) return 1;
          return new Date(a.startTime) - new Date(b.startTime);
        });

        setContests(sortedContests);
        setLoading(false);
      } else {
        console.error('Error fetching contests:', response?.error || 'Unknown error');
        setError(response?.error || 'Failed to load contests. Please try again.');
        setLoading(false);
      }
    });
  }, [filter, platform]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (startTime) => {
    const now = new Date();
    const contestStart = new Date(startTime);
    const diff = contestStart - now;

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleRefresh = () => {
    console.log('Manual refresh requested');
    setLoading(true);
    setError(null);

    chrome.runtime.sendMessage({
      action: 'refreshContests'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        setError('Failed to refresh contests.');
        setLoading(false);
        return;
      }

      if (response && response.success) {
        toast.success('Contests refreshed successfully!');
        // Trigger a re-fetch of contests with current filters
        chrome.runtime.sendMessage({
          action: 'getContests',
          platform: platform,
          timeFilter: filter
        }, (contestResponse) => {
          if (contestResponse && contestResponse.success) {
            const sortedContests = (contestResponse.contests || []).sort((a, b) => {
              if (a.endTime && b.endTime) return new Date(a.endTime) - new Date(b.endTime);
              else if (a.endTime) return -1;
              else if (b.endTime) return 1;
              return new Date(a.startTime) - new Date(b.startTime);
            });
            setContests(sortedContests);
          }
          setLoading(false);
        });
      } else {
        console.error('Error refreshing contests:', response?.error || 'Unknown error');
        setError(response?.error || 'Failed to refresh contests.');
        setLoading(false);
        toast.error('Failed to refresh contests');
      }
    });
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1 className="title">Codifier</h1>
        <div className="header-icons">
          <button 
            className="icon-button refresh-button" 
            onClick={handleRefresh}
            title="Refresh contests"
            disabled={loading}
          >
            🔄
          </button>
          <button 
            className="icon-button theme-button" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="tabs">
        {TIME_FILTERS.map(f => (
          <button 
            key={f.value} 
            className={`tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="platform-filter">
        <select 
          value={platform} 
          onChange={e => setPlatform(e.target.value)} 
          className="platform-select"
        >
          {PLATFORMS.map(p => (
            <option key={p} value={p}>
              {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="contest-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading contests...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Retry
            </button>
          </div>
        ) : contests.length === 0 ? (
          <div className="no-contests">
            <p>No contests found.</p>
            <p className="no-contests-sub">Try changing filters or check back later.</p>
          </div>
        ) : (
          contests.map(contest => {
            const platformColor = PLATFORM_COLORS[contest.platform] || '#646cff';
            const platformIconPath = PLATFORM_ICONS[contest.platform] || '';
            const timeRemaining = getTimeRemaining(contest.startTime);

            return (
              <div key={contest._id || contest.url} className="contest-card">
                <div className="contest-header">
                  <div 
                    className="platform-indicator" 
                    style={{ backgroundColor: platformColor }}
                    title={contest.platform}
                  ></div>
                  <h3 className="contest-name">{contest.name}</h3>
                </div>

                <div className="contest-details">
                  <div className="platform-name">
                    {platformIconPath ? (
                      <img 
                        src={platformIconPath} 
                        alt={contest.platform} 
                        className="platform-icon-img" 
                      />
                    ) : (
                      <span className="platform-icon-fallback">🏆</span>
                    )}
                    {contest.platform}
                  </div>
                  <div className="contest-time-info">
                    <div className="contest-time">{formatDate(contest.startTime)}</div>
                    <div className="time-remaining">{timeRemaining}</div>
                  </div>
                </div>

                <div className="contest-actions">
                  <a 
                    href={contest.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contest-link"
                  >
                    Open Contest
                  </a>
                  <button 
                    onClick={() => setContestAlarm(contest)} 
                    className="set-reminder-button"
                  >
                    ⏰ Set Reminder
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <ToastContainer
  position="bottom-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme={theme}
/>
    </div>
  );
}
