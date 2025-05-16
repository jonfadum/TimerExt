chrome.action.onClicked.addListener((tab) => {
  // Inject script.js only when the user clicks the extension icon
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["script.js"]
  });
});


