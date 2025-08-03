# Contest Notifier: Chrome Extension & Backend

Stay ahead in competitive programming! Contest Notifier scrapes upcoming coding contests from all major platforms and sets reminders so you never miss a challenge.

---

## 🚀 Features
- **Aggregates contests** from platforms like Codeforces, CodeChef, AtCoder, LeetCode, GeeksforGeeks, and Coding Ninjas
- **Smart reminders**: Get notified before contests start
- **Modern popup UI** for quick access
- **Works offline** after initial load
- **Backend server** for scraping and scheduling reminders

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Codifier
```

### 2. Setup the Server (Backend)
- Go to the `server` directory:
  ```bash
  cd server
  npm install
  ```
- Configure your `.env` file as needed
- Start the backend server (choose one):
  ```bash
  npm start         # for production
  npm run dev       # for development with auto-reload (nodemon)
  ```

### 3. Setup the Client (Chrome Extension)
- Go to the `client` directory:
  ```bash
  cd ../client
  npm install
  ```
- Build the extension:
  ```bash
  npm run build
  ```
  This will generate a `dist` folder with the production build.
- **Load the extension in Chrome:**
  - Open `chrome://extensions/` in your browser
  - Enable **Developer mode** (top right)
  - Click **Load unpacked**
  - Select the `dist` folder inside the `client` directory

---

## 🧑‍💻 Usage
- Click the extension icon to view upcoming contests
- Set reminders for your favorite contests
- Get notified before contests start

---

## 📅 Supported Platforms
- Codeforces
- CodeChef
- AtCoder
- LeetCode
- GeeksforGeeks
- Coding Ninjas

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

> Made with ❤️ for competitive programmers
