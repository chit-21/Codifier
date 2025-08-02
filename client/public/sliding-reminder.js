document.addEventListener('DOMContentLoaded', () => {
  let countdown = 15;
  let countdownInterval;
  let contestURL = 'https://codeforces.com/contests';
  let platformIcon = 'platforms/codeforces.png';

  // Fetch contest info from storage
  chrome.storage.local.get(['lastAlarm', 'lastAlarmURL', 'lastAlarmPlatform'], (data) => {
    const messageElem = document.getElementById('contest-message');
    const platformIconElem = document.getElementById('platform-icon');
    
    if (data.lastAlarm) {
      messageElem.textContent = `"${data.lastAlarm}" starts in 10 minutes!`;
      contestURL = data.lastAlarmURL || contestURL;
      
      // Set platform icon if available
      if (data.lastAlarmPlatform) {
        platformIcon = data.lastAlarmPlatform;
        platformIconElem.src = platformIcon;
      }
    } else {
      messageElem.textContent = 'Your contest starts in 10 minutes!';
    }
  });

  // Start countdown timer
  function startCountdown() {
    countdownInterval = setInterval(() => {
      countdown--;
      document.getElementById('timer').textContent = `${countdown}s`;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        closeNotification();
      }
    }, 1000);
  }

  // Close notification with slide out animation
  function closeNotification() {
    const notification = document.querySelector('.sliding-notification');
    notification.style.animation = 'slideOut 0.3s ease-in forwards';
    
    setTimeout(() => {
      window.close();
    }, 300);
  }

  // Add slide out animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Open contest button handler
  document.getElementById('open-contest').addEventListener('click', () => {
    chrome.tabs.create({ url: contestURL });
    clearInterval(countdownInterval);
    closeNotification();
  });

  // Dismiss button handler
  document.getElementById('dismiss').addEventListener('click', () => {
    clearInterval(countdownInterval);
    closeNotification();
  });

  // Close button handler
  document.getElementById('close-btn').addEventListener('click', () => {
    clearInterval(countdownInterval);
    closeNotification();
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearInterval(countdownInterval);
      closeNotification();
    }
  });

  // Start the countdown
  startCountdown();

  // Add hover effects
  const buttons = document.querySelectorAll('.action-btn');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
    });
  });
}); 