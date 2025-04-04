console.log("Gmail Login Restriction Activated");

// Function to show the custom alert
function showCustomAlert(message) {
  let alertContainer = document.getElementById("custom-alert");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "custom-alert";
    alertContainer.classList.add("alert-container");
    document.body.appendChild(alertContainer);

    let alertBox = document.createElement("div");
    alertBox.classList.add("alert-box");
    alertContainer.appendChild(alertBox);

    let messageElement = document.createElement("p");
    messageElement.id = "alert-message";
    alertBox.appendChild(messageElement);

    let closeButton = document.createElement("button");
    closeButton.id = "close-alert";
    closeButton.classList.add("close-btn");
    closeButton.innerText = "Close";
    alertBox.appendChild(closeButton);

    closeButton.addEventListener("click", function () {
      alertContainer.style.display = "none";
    });
  }

  document.getElementById("alert-message").innerText = message;
  alertContainer.style.display = "flex";
}

// Utility: Extract domain from email
function getDomain(email) {
  return email.split("@")[1] || "";
}

// Utility: Check if email matches trusted domain list
function isTrustedDomain(email, trustedDomains) {
  return trustedDomains.includes(getDomain(email));
}

// Sign out
function signOutFromAllAccounts() {
  console.log("🚨 Unauthorized login detected! Logging out...");
  showCustomAlert("Unauthorized domain detected! Logging out...");
  setTimeout(() => {
    window.location.href = "https://accounts.google.com/Logout";
  }, 3000);
}

// Block email input manually
function blockUnauthorizedLogin(trustedDomains) {
  let emailInput = document.querySelector("input[type='email']");
  if (!emailInput) return;

  emailInput.addEventListener("blur", function () {
    let enteredEmail = emailInput.value.trim();
    if (enteredEmail && !isTrustedDomain(enteredEmail, trustedDomains)) {
      showCustomAlert("Only trusted domains are allowed for login.");
      emailInput.value = "";
    }
  });

  let nextButton = document.querySelector("button[type='button']");
  if (nextButton) {
    nextButton.addEventListener("click", function (event) {
      let enteredEmail = emailInput.value.trim();
      if (enteredEmail && !isTrustedDomain(enteredEmail, trustedDomains)) {
        event.preventDefault();
        showCustomAlert("Only trusted domains are allowed for login.");
      }
    });
  }
}

// ❗️ New: Block or remove non-trusted accounts from chooser screen
function filterAccountChooser(trustedDomains) {
  const emailElements = document.querySelectorAll("div.IxcUte");
  emailElements.forEach((el) => {
    const email = el.textContent.trim();
    const parent = el.closest("[role='link']"); // the clickable account row

    if (!isTrustedDomain(email, trustedDomains)) {
      console.log(`❌ Hiding unauthorized account: ${email}`);
      showCustomAlert(`Blocked: ${email} is not allowed to login.`);

      if (parent) {
        parent.style.pointerEvents = "none";
        parent.style.opacity = "0.5";
        parent.title = "Blocked by Gmail Trusted Domain Login Extension";
      }

      // Optional: remove instead of hiding
      // if (parent) parent.remove();
    }
  });
}

// Monitor and enforce on page load + mutations
chrome.storage.sync.get("trustedDomains", function (data) {
  const trustedDomains = data.trustedDomains || [];

  function runAllBlocks() {
    if (window.location.href.includes("accounts.google.com")) {
      blockUnauthorizedLogin(trustedDomains);
      filterAccountChooser(trustedDomains);
    }
  }

  runAllBlocks();

  const observer = new MutationObserver(() => {
    runAllBlocks();
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
