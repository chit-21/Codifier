document.addEventListener('DOMContentLoaded', () => {
  // Fetch contest info from storage
  chrome.storage.local.get(['lastAlarm', 'lastAlarmURL'], (data) => {
    const messageElem = document.getElementById('contest-message');
    if (data.lastAlarm) {
      messageElem.textContent = `"${data.lastAlarm}" starts in 10 minutes!`;
    } else {
      messageElem.textContent = 'Your contest starts in 10 minutes!';
    }
  });

  // Open contest URL in a new tab when user clicks 'Open Contest'

});
