// Logs a message when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Trusted Domain login Restriction Extension Installed");
});

// You can add other background functionalities here, such as listening for events or handling domains
chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName === 'sync' && changes.trustedDomains) {
    console.log('Trusted domains have been updated:', changes.trustedDomains.newValue);
  }
});
