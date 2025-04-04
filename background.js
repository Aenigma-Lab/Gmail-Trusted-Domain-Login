// ✅ Ensure extension is installed properly
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Gmail Trusted Domain Login Restriction Installed");
  checkAndLogout();
});

// ✅ Detect when a Gmail tab updates and enforce rules
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
      if (tab.url.includes("mail.google.com") || tab.url.includes("accounts.google.com")) {
          chrome.storage.sync.get("trustedDomains", (data) => {
              chrome.tabs.sendMessage(tabId, {
                  action: "verifyGmailUser",
                  trustedDomains: data.trustedDomains || []
              });
          });
      }
  }
});

// ✅ Listen for storage updates (trusted domains change)
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync" && changes.trustedDomains) {
      console.log("🔄 Trusted domains updated. Rechecking Gmail sessions...");
      await checkAndLogout();
  }
});

// ✅ Handle messages from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "checkAndLogout") {
      await checkAndLogout();
  }
});

// ✅ Check and logout users if no trusted domain exists
async function checkAndLogout() {
  try {
      const data = await chrome.storage.sync.get("trustedDomains");
      const trustedDomains = data.trustedDomains || [];

      // ✅ If no trusted domains, log out immediately
      if (trustedDomains.length === 0) {
          console.log("❌ No trusted domains found. Logging out...");
          await logoutGmail();
          return;
      }

      // ✅ Query all open tabs
      const tabs = await chrome.tabs.query({});

      // ✅ Filter Gmail-related tabs
      const gmailTabs = tabs.filter(tab =>
          tab.url && (tab.url.includes("mail.google.com") || tab.url.includes("accounts.google.com"))
      );

      // ✅ Verify each Gmail tab
      for (let tab of gmailTabs) {
          try {
              const response = await chrome.tabs.sendMessage(tab.id, {
                  action: "verifyGmailUser",
                  trustedDomains
              });

              if (!response) {
                  throw new Error("No response from content script");
              }
          } catch (error) {
              console.warn(`⚠️ Content script inactive in tab ${tab.id}. Injecting script...`);

              try {
                  await chrome.scripting.executeScript({
                      target: { tabId: tab.id },
                      files: ["content.js"]
                  });

                  // Retry sending the message after injecting
                  await chrome.tabs.sendMessage(tab.id, {
                      action: "verifyGmailUser",
                      trustedDomains
                  });
              } catch (scriptError) {
                  console.error(`❌ Failed to inject script in tab ${tab.id}:`, scriptError.message);
              }
          }
      }
  } catch (error) {
      console.error("❌ Error in checkAndLogout():", error.message);
  }
}

// ✅ Force Gmail logout
async function logoutGmail() {
  try {
      const tabs = await chrome.tabs.query({});

      for (let tab of tabs) {
          if (tab.url && (tab.url.includes("mail.google.com") || tab.url.includes("accounts.google.com"))) {
              await chrome.tabs.update(tab.id, { url: "https://accounts.google.com/Logout" });
          }
      }
  } catch (error) {
      console.error("❌ Error in logoutGmail():", error.message);
  }
}

// ✅ Initial check when extension starts
checkAndLogout();
