# 🏆 Codifier - Chrome Extension

A powerful Chrome extension that helps competitive programmers stay updated with upcoming coding contests from multiple platforms and never miss important competitions.

## ✨ Features

### 🔔 Smart Notifications
- **Real-time Reminders**: Get notified 10 minutes before contests start
- **Multiple Notification Types**: Sliding popup windows, Chrome notifications, and badge alerts
- **Customizable Alerts**: Set personalized reminders for your favorite contests

### 🌐 Multi-Platform Support
- **Codeforces** - Stay updated with CF rounds and competitions
- **LeetCode** - Track weekly and biweekly contests
- **AtCoder** - Never miss ABC, ARC, and AGC contests
- **CodeChef** - Get notified about long and short contests
- **GeeksforGeeks** - Track GFG coding competitions
- **CodingNinjas** - Stay informed about CN contests

### 🎯 Advanced Filtering & Smart Reminders
- **Time-based Filters**: View live, upcoming, weekly, or monthly contests
- **Platform Filtering**: Focus on specific platforms you care about
- **Smart Categorization**: Contests organized by status (live, upcoming, ended)
- **Intelligent Reminders**: Prevents negative timings, handles edge cases gracefully
- **Context-Aware Messages**: Clear feedback for all reminder scenarios

### 💾 Database-Free Architecture
- **No Database Required**: All data stored locally in Chrome storage
- **Offline Capability**: View previously loaded contests without internet
- **Fast Loading**: Cached data for instant popup opening
- **Privacy First**: No external servers, all data stays local
- **Self-Contained**: Works independently without backend dependencies

## 🚀 Installation

### Method 1: Load from Dist Folder (Recommended)
1. **Download/Clone** this repository
2. **Build the extension**:
   ```bash
   cd client
   npm install
   npm run build
   ```
3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `client/dist` folder
4. **Pin the extension** to your toolbar for easy access

### Method 2: Development Mode
```bash
# Clone the repository
git clone <repository-url>
cd Codifier

# Install client dependencies
cd client
npm install

# Build the extension
npm run build

# The extension files will be in client/dist/
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Local Development
```bash
# Install dependencies
cd client
npm install

# Start development server (for React components)
npm run dev

# Build for production
npm run build

# The built extension will be in client/dist/
```

### Project Structure
```
Codifier/
├── client/                 # Chrome extension frontend
│   ├── src/               # React source files
│   ├── public/            # Static assets and extension files
│   │   ├── background.js  # Service worker with contest scraping
│   │   ├── contest-scraper.js # Database-free contest scrapers
│   │   └── platforms/     # Platform icons and assets
│   ├── dist/              # Built extension (load this in Chrome)
│   └── package.json
├── server/                # Standalone scrapers (optional)
│   ├── standalone-scrapers.js # Database-free scrapers
│   ├── test-scrapers.js   # Testing utilities
│   └── backup-db-version/ # Original database version (backup)
├── MIGRATION-GUIDE.md     # Database removal guide
├── TROUBLESHOOTING.md     # Common issues and solutions
└── README.md
```

## 🎮 Usage

### Setting Up Reminders
1. **Open the extension** by clicking the icon in your toolbar
2. **Browse contests** from different platforms
3. **Click "Set Reminder"** on any contest you want to be notified about
4. **Get notified** 10 minutes before the contest starts

### Filtering Contests
- **Platform Filter**: Select specific platforms from the dropdown
- **Time Filter**: Choose from All, Live, This Week, or This Month
- **Search**: Use the search bar to find specific contests

### Managing Notifications
- **Notification Types**: The extension uses sliding popups as primary notifications
- **Fallback System**: If popups fail, it falls back to Chrome notifications
- **Badge Alerts**: Extension badge shows "!" for active reminders

## 🔧 Configuration

### Permissions Required
- `storage` - For saving contest data and user preferences
- `alarms` - For scheduling contest reminders
- `notifications` - For showing contest alerts
- `tabs` - For opening contest pages
- `windows` - For creating notification popups

### Storage Usage
- **Chrome Storage Local**: Contest data, user preferences, and reminder settings
- **Automatic Cleanup**: Old contest data cleaned up periodically
- **No External Database**: All data is stored locally for privacy and speed
- **Background Scraping**: Contests updated every 30 minutes automatically
- **Persistent Data**: Data survives browser restarts and extension updates

## 🎨 Customization

### Adding New Platforms
1. Add scraper method to `client/public/contest-scraper.js`
2. Add platform to `PLATFORMS` array in popup component
3. Add platform colors to `PLATFORM_COLORS` object
4. Add platform icon to `client/public/platforms/`
5. Update host permissions in `manifest.json`
6. Test the integration

### Modifying Notification Timing
```javascript
// In background.js, change the reminder timing
const REMINDER_MINUTES = 10; // Change this value
```

### Styling
- Modify `client/src/popup.css` for popup styling
- Update `client/public/popup.css` for extension-specific styles
- Platform colors are defined in `PLATFORM_COLORS` object

## 🐛 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure you're loading the `client/dist` folder, not `client/public`
- Check that all files are built properly with `npm run build`
- Verify Chrome Developer Mode is enabled

**Notifications not working:**
- Check Chrome notification permissions
- Ensure the extension has alarm permissions
- Verify system notifications are enabled

**Contests not loading:**
- Wait 1-2 minutes for initial background scraping
- Check internet connection
- Verify API endpoints are accessible
- Check background script console for scraping errors

**Reminders not triggering:**
- Ensure Chrome is running (extensions work in background)
- Check that alarms permission is granted
- Verify system time is correct
- Check if reminder was set for contest starting within 10 minutes (shows info message instead)

**Platform-specific issues:**
- Some platforms may temporarily return HTML instead of JSON (handled gracefully)
- CodingNinjas API sometimes blocked (extension continues with other platforms)
- AtCoder requires web scraping (not implemented yet)

### Debug Mode
1. **Popup Console**: Right-click the extension icon → "Inspect popup"
2. **Background Script**: Go to `chrome://extensions/` → Click "service worker" for background logs
3. **Storage Inspection**: In background console, run `chrome.storage.local.get(console.log)`
4. **Manual Scraping**: In background console, run `contestScraper.scrapeAllPlatforms()`

### Additional Resources
- **Troubleshooting Guide**: See `TROUBLESHOOTING.md` for detailed solutions
- **Migration Guide**: See `MIGRATION-GUIDE.md` for database removal details
- **Reminder Behavior**: See `REMINDER-BEHAVIOR.md` for reminder logic explanation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to the branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Areas for Contribution
- 🌟 Add support for new contest platforms (AtCoder web scraping)
- 🎨 Improve UI/UX design and themes
- 🔧 Optimize performance and reduce memory usage
- 🛡️ Enhance error handling and resilience
- 🌍 Add internationalization support
- 🧪 Write comprehensive tests
- 📱 Add mobile-responsive design
- 🔔 Improve notification system

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all competitive programming platforms for providing contest data
- Chrome Extension APIs for powerful browser integration
- React community for excellent development tools
- All contributors who help improve this extension

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/codifier/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/codifier/discussions)
- **Documentation**: Check `TROUBLESHOOTING.md` for common issues
- **Email**: your-email@example.com

## 🆕 What's New in Latest Version

### ✅ Database-Free Architecture
- **Removed MongoDB dependency** - Extension now works completely offline
- **Faster performance** - No server round trips, 5x faster popup loading
- **Better reliability** - No server downtime issues
- **Enhanced privacy** - All data stays local to your browser

### ✅ Smart Reminder System
- **Intelligent timing** - Prevents negative timings and handles edge cases
- **Context-aware messages** - Clear feedback for all reminder scenarios
- **Better error handling** - Graceful degradation when APIs fail

### ✅ Improved Scraping
- **Background automation** - Contests updated every 30 minutes automatically
- **Robust error handling** - Continues working even if some platforms fail
- **Better API validation** - Handles HTML responses and API changes gracefully

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for the competitive programming community

</div>