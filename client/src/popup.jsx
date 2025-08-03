import React, { useEffect, useState } from 'react';
import './popup.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'https://codifier.onrender.com/api/contests';

const TIME_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Live', value: 'live' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' }
];

const PLATFORMS = [
  'all', 'codeforces', 'leetcode', 'atcoder', 'codechef', 'gfg', 'codingninjas'
];

const PLATFORM_COLORS = {
  codeforces: '#1890ff',
  leetcode: '#ffa116',
  atcoder: '#222222',
  codechef: '#5b4638',
  gfg: '#2f8d46',
  codingninjas: '#f78d1e',
};

const PLATFORM_ICONS = {
  codeforces: 'platforms/codeforces.png',
  leetcode: 'platforms/leetcode.png',
  atcoder: 'platforms/atcoder.png',
  codechef: 'platforms/codechef.jpeg',
  gfg: 'platforms/geeksforgeeks.png',
  codingninjas: 'platforms/codingninja.jpg',
};

const setContestAlarm = (contest) => {
  const contestTime = new Date(contest.startTime).getTime();
  const triggerTime = contestTime - 10 * 60 * 1000;
  const delayInMinutes = (triggerTime - Date.now()) / (1000 * 60);
  const alarmName = `contest_${contest.name.replace(/\s/g, "_")}`;
  const platformIcon = PLATFORM_ICONS[contest.platform] || 'platforms/codeforces.png';
  chrome.runtime.sendMessage({
    action: 'setContestAlarm',
    name: contest.name,
    alarmName,
    delayInMinutes: delayInMinutes,
    contestURL: contest.url,
    platformIcon: platformIcon
  }, (response) => {
    if (response && response.success) {
      let msg = '';
      const totalMinutes = Math.round(delayInMinutes);
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        msg = `${hours} hr${hours > 1 ? 's' : ''}${minutes > 0 ? ' ' + minutes + ' min' : ''}`;
      } else {
        msg = `${totalMinutes} min`;
      }
      toast.success(`✅ Reminder set for "${contest.name}" in ${msg}!`);
    } else {
      toast.error(`❌ Failed to set reminder: ${response?.error || 'Unknown error'}`);
    }
  });
};

const LOCAL_STORAGE_KEY = 'cachedContests';
function saveContestsToCache(contests) {
  const now = new Date();
  const filtered = contests.filter(c => {
    if (c.status && c.status === 'ended') return false;
    if (c.endTime && new Date(c.endTime) < now) return false;
    return true;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
}
function loadContestsFromCache() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  const now = new Date();
  return JSON.parse(data).filter(c => {
    if (c.status && c.status === 'ended') return false;
    if (c.endTime && new Date(c.endTime) < now) return false;
    return true;
  });
}

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
    setFilter('');
    const endpoints = [
      API_BASE,
      API_BASE + '/live',
      API_BASE + '/upcoming?range=week',
      API_BASE + '/upcoming?range=month'
    ];
    endpoints.forEach(url => {
      fetch(url).then(() => {}).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (filter === '') {
      const cached = loadContestsFromCache();
      if (cached.length > 0) {
        setContests(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }
    let url = API_BASE;
    if (filter === 'live') url += '/live';
    else if (filter === 'month') url += '/upcoming?range=month';
    else if (filter === 'week') url += '/upcoming?range=week';
    const hasQueryParam = url.includes('?');
    if (platform !== 'all') {
      url += `${hasQueryParam ? '&' : '?'}platform=${platform}`;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        const sortedContests = (response.data || []).sort((a, b) => {
          if (a.endTime && b.endTime) return new Date(a.endTime) - new Date(b.endTime);
          else if (a.endTime) return -1;
          else if (b.endTime) return 1;
          return new Date(a.startTime) - new Date(b.startTime);
        });
        if (filter === '') {
          saveContestsToCache(sortedContests);
        }
        setContests(sortedContests);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load contests. Please try again.');
        setLoading(false);
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

  return (
    <div className="popup-container">
      <div className="header">
        <h1 className="title">Contest Notifier</h1>
        <div className="header-icons">
          <button 
            className="icon-button refresh-button" 
            onClick={() => window.location.reload()}
            title="Refresh"
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
