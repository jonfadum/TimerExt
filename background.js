chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["script.js"]
  });

});

chrome.tabs.onCreated.addListener((tab) => {
  // Close the timer dialog on the newly created tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (window.activeTimerDialog) {
        window.activeTimerDialog.remove();
        window.activeTimerDialog = null;
      }
    }
  });
});