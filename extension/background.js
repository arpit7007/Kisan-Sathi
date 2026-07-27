// background.js for KisanSaathi Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("KisanSaathi AI Autofill Agent Extension installed successfully.");
});

// Listener for background actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_PORTAL') {
    chrome.tabs.create({ url: message.url });
    sendResponse({ status: 'opened' });
  }
  return true;
});
