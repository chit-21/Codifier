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
      document.getElementById('timer').textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        window.close();
      }
    }, 1000);
  }

  // Open contest button handler
  document.getElementById('open-contest').addEventListener('click', () => {
    chrome.tabs.create({ url: contestURL });
    clearInterval(countdownInterval);
    window.close();
  });

  // Dismiss button handler
  document.getElementById('dismiss').addEventListener('click', () => {
    clearInterval(countdownInterval);
    window.close();
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearInterval(countdownInterval);
      window.close();
    }
  });

  // Start the countdown
  startCountdown();

  // Add some nice hover effects
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
    });
  });
}); 