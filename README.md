# 🏆 Contest Notifier - Chrome Extension

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

### 🎯 Advanced Filtering
- **Time-based Filters**: View live, upcoming, weekly, or monthly contests
- **Platform Filtering**: Focus on specific platforms you care about
- **Smart Categorization**: Contests organized by status (live, upcoming, ended)

### 💾 Local Storage
- **Offline Capability**: View previously loaded contests without internet
- **Fast Loading**: Cached data for instant popup opening
- **Persistent Settings**: Your preferences are saved locally

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
│   ├── dist/              # Built extension (load this in Chrome)
│   └── package.json
├── server/                # Backend services (optional)
│   ├── scrapers/          # Contest data scrapers
│   ├── routes/            # API routes
│   └── services/          # Utility services
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
- **Local Storage**: Contest data, user preferences, and reminder settings
- **Chrome Storage**: Persistent data across browser sessions
- **No External Database**: All data is stored locally for privacy

## 🎨 Customization

### Adding New Platforms
1. Create a new scraper in `server/scrapers/`
2. Add platform configuration in the popup component
3. Update the platform icons and colors
4. Test the integration

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
- Check internet connection
- Verify API endpoints are accessible
- Check browser console for errors

**Reminders not triggering:**
- Ensure Chrome is running (extensions work in background)
- Check that alarms permission is granted
- Verify system time is correct

### Debug Mode
1. Right-click the extension icon → "Inspect popup"
2. Check the Console tab for errors
3. Go to `chrome://extensions/` → Click "background page" for background script logs

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
- 🌟 Add support for new contest platforms
- 🎨 Improve UI/UX design
- 🔧 Optimize performance

- 🌍 Add internationalization
- 🧪 Write tests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all competitive programming platforms for providing contest data
- Chrome Extension APIs for powerful browser integration
- React community for excellent development tools
- All contributors who help improve this extension

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/contest-notifier/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/contest-notifier/discussions)
- **Email**: your-email@example.com

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for the competitive programming community

</div>