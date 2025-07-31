import React, { useEffect, useState } from 'react';
import './popup.css';

const API_BASE = 'http://localhost:3000/api/contests'; // Change if deployed

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

export default function Popup() {
  const [contests, setContests] = useState([]);
  const [filter, setFilter] = useState('');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  // Set initial theme
  useEffect(() => {
    // Check if user prefers light mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDarkMode ? 'dark' : 'light';
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    let url = API_BASE;
    if (filter === 'live') url += '/live';
    else if (filter === 'month') url += '/upcoming?range=month';
    else if (filter === 'week') url += '/upcoming?range=week';
    
    // Handle query parameters correctly
    const hasQueryParam = url.includes('?');
    if (platform !== 'all') {
      url += `${hasQueryParam ? '&' : '?'}platform=${platform}`;
    }

    setLoading(true);
    setError(null);
    
    // After constructing the URL
    console.log('Fetching contests from URL:', url);
    console.log('Current platform filter:', platform);
    
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        console.log('Response data:', response.data);
        // Sort contests by end time (contests ending sooner appear first)
        const sortedContests = (response.data || []).sort((a, b) => {
          // If both have end times, sort by end time
          if (a.endTime && b.endTime) {
            return new Date(a.endTime) - new Date(b.endTime);
          }
          // If only one has end time, prioritize the one with end time
          else if (a.endTime) return -1;
          else if (b.endTime) return 1;
          // Fall back to start time if no end times
          return new Date(a.startTime) - new Date(b.startTime);
        });
        
        setContests(sortedContests);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching contests:', error);
        setError('Failed to load contests. Please try again.');
        setLoading(false);
      });
  }, [filter, platform]);

  // Format date for better readability
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

  // Calculate time remaining for upcoming contests
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
      {/* Header with title and icons */}
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
      
      {/* Time filter tabs */}
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
      
      {/* Platform filter */}
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
      
      {/* Contest list */}
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
        ) : (
          contests.length === 0 ? (
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
                  
                  <a 
                    href={contest.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contest-link"
                  >
                    Open Contest
                  </a>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}