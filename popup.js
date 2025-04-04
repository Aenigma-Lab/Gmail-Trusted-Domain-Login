document.addEventListener("DOMContentLoaded", function () {
  const domainInput = document.getElementById("domain-input");
  const addButton = document.getElementById("add-domain");
  const domainList = document.getElementById("domain-list");
  const saveButton = document.getElementById("saveButton");

  // 🚀 Load Trusted Domains from Storage
  function loadDomains() {
      chrome.storage.sync.get("trustedDomains", function (data) {
          const domains = data.trustedDomains || [];
          domainList.innerHTML = ""; // Clear existing list

          domains.forEach((domain, index) => {
              const li = document.createElement("li");
              li.innerHTML = `${domain} <button class="remove-btn" data-index="${index}">❌</button>`;
              domainList.appendChild(li);
          });

          attachRemoveListeners();
      });
  }

  // 🚀 Attach event listeners to remove buttons
  function attachRemoveListeners() {
      document.querySelectorAll(".remove-btn").forEach(button => {
          button.addEventListener("click", function () {
              removeDomain(parseInt(this.getAttribute("data-index")));
          });
      });
  }

  // 🚀 Add a new domain
  addButton.addEventListener("click", function () {
      const newDomain = domainInput.value.trim().toLowerCase();
      if (!validateDomain(newDomain)) return;

      chrome.storage.sync.get("trustedDomains", function (data) {
          let domains = data.trustedDomains || [];
          if (!domains.includes(newDomain)) {
              domains.push(newDomain);
              chrome.storage.sync.set({ trustedDomains: domains }, function () {
                  domainInput.value = "";
                  loadDomains();
              });
          } else {
              alert("⚠️ This domain is already in the list.");
          }
      });
  });

  // 🚀 Save multiple domains (comma-separated input)
  if (saveButton) {
      saveButton.addEventListener("click", function () {
          const input = domainInput.value.trim();
          const newDomains = input.split(',')
              .map(domain => domain.trim().toLowerCase())
              .filter(domain => validateDomain(domain));

          if (newDomains.length === 0) {
              alert("⚠️ Please enter valid domain(s).");
              return;
          }

          // ✅ Merge new domains without replacing old ones
          chrome.storage.sync.get("trustedDomains", function (data) {
              let existingDomains = data.trustedDomains || [];
              newDomains.forEach(domain => {
                  if (!existingDomains.includes(domain)) {
                      existingDomains.push(domain);
                  }
              });

              chrome.storage.sync.set({ trustedDomains: existingDomains }, function () {
                  alert("✅ Trusted domains updated!");
                  loadDomains();
              });
          });
      });
  }

  // 🚀 Validate Domain Input
  function validateDomain(domain) {
      if (!domain) {
          alert("⚠️ Please enter a valid domain.");
          return false;
      }
      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
          alert("⚠️ Invalid domain format! Example: example.com");
          return false;
      }
      return true;
  }

  // 🚀 Remove a domain and log out users if necessary
  function removeDomain(index) {
      chrome.storage.sync.get("trustedDomains", function (data) {
          let domains = data.trustedDomains || [];
          if (index >= 0 && index < domains.length) {
              domains.splice(index, 1); // Remove domain by index
              chrome.storage.sync.set({ trustedDomains: domains }, function () {
                  loadDomains();
                  checkAndLogout();
              });
          }
      });
  }

  // 🚀 Check if user needs to be logged out
  function checkAndLogout() {
      chrome.storage.sync.get("trustedDomains", function (data) {
          const trustedDomains = data.trustedDomains || [];

          chrome.tabs.query({}, function (tabs) {
              tabs.forEach(tab => {
                  if (/accounts\.google\.com|mail\.google\.com/.test(tab.url)) {
                      chrome.tabs.sendMessage(tab.id, { action: "verifyGmailUser", trustedDomains }, response => {
                          if (chrome.runtime.lastError || response === undefined) {
                              console.warn(`⚠️ Content script inactive in tab ${tab.id}. Injecting script...`);

                              chrome.scripting.executeScript({
                                  target: { tabId: tab.id },
                                  files: ["content.js"]
                              }, () => {
                                  chrome.tabs.sendMessage(tab.id, { action: "verifyGmailUser", trustedDomains });
                              });
                          }
                      });
                  }
              });
          });
      });
  }

  // 🚀 Listen for storage updates (auto enforcement)
  chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === "sync" && changes.trustedDomains) {
          checkAndLogout();
      }
  });

  // 🚀 Initial Load
  loadDomains();
});
