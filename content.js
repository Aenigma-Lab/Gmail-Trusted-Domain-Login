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

  // Set the message and show the alert
  document.getElementById("alert-message").innerText = message;
  alertContainer.style.display = "flex"; // Show the alert
}

// Function to block unauthorized login based on trusted domains
function blockUnauthorizedLogin(trustedDomains) {
  let emailInput = document.querySelector("input[type='email']");
  
  if (!emailInput) return; // Exit if email field is not found
  
  // Check if no domains are added
  if (trustedDomains.length === 0) {
    showCustomAlert("Please add at least one trusted domain before logging in.");
    emailInput.setAttribute("disabled", "true"); // Disable the email input field
    return;
  }

  emailInput.addEventListener("blur", function () {
    let enteredEmail = emailInput.value.trim();
    const domain = enteredEmail.split('@')[1];

    if (enteredEmail && trustedDomains.length > 0 && !trustedDomains.includes(domain)) {
      showCustomAlert("Unauthorized email domain!");
      emailInput.value = ""; // Clear the input field
    }
  });

  let nextButton = document.querySelector("button[type='button']");
  
  if (nextButton) {
    nextButton.addEventListener("click", function (event) {
      let enteredEmail = emailInput.value.trim();
      const domain = enteredEmail.split('@')[1];

      if (enteredEmail && trustedDomains.length > 0 && !trustedDomains.includes(domain)) {
        event.preventDefault(); // Block login attempt
        showCustomAlert("Unauthorized email domain!");
      }
    });
  }
}

// Fetch trusted domains from chrome storage and apply the login block
chrome.storage.sync.get('trustedDomains', function(data) {
  const trustedDomains = data.trustedDomains || [];

  // Run function when login page is loaded
  if (window.location.href.includes("accounts.google.com")) {
    blockUnauthorizedLogin(trustedDomains);
  }

  // Observe URL changes to detect when login page appears
  let observer = new MutationObserver(() => {
    if (window.location.href.includes("accounts.google.com")) {
      blockUnauthorizedLogin(trustedDomains);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

// Function to get the logged-in user's email domain
function getLoggedInUserDomain() {
  const userAvatar = document.querySelector('.gb_ya'); // User's avatar element
  if (userAvatar) {
    const userInfo = userAvatar.getAttribute('aria-label'); // The email or name of the logged-in user
    if (userInfo) {
      const email = userInfo.split(' ')[0]; // Get email from aria-label
      const domain = email.split('@')[1]; // Extract domain from email
      return domain;
    }
  }
  return null;
}

// Function to sign out by redirecting to the logout URL
function signOutFromAllAccounts() {
  window.location.href = "https://accounts.google.com/Logout"; // Redirect to the Google logout page
}

// Function to continuously check if the logged-in account domain is valid
function checkLoggedInAccount(domainToCheck) {
  const currentDomain = getLoggedInUserDomain();
  
  // If no domain is defined in chrome storage, log the user out immediately
  if (!domainToCheck) {
    showCustomAlert("No trusted domain set. Logging out...");
    signOutFromAllAccounts();
    return;
  }

  // If the current logged-in domain does not match the trusted domain
  if (currentDomain && currentDomain !== domainToCheck) {
    console.log('Domain mismatch detected. Redirecting to sign-out...');
    signOutFromAllAccounts();
  } else {
    console.log('Logged-in account domain matches. Continuing...');
  }
}

// Continuously monitor the Gmail login page and perform checks
function monitorLogin() {
  // Periodically check the account status
  setInterval(() => {
    chrome.storage.sync.get('trustedDomains', function(data) {
      const trustedDomains = data.trustedDomains || [];
      
      // If no trusted domains are set, sign out immediately
      if (trustedDomains.length === 0) {
        showCustomAlert("No trusted domain set. Logging out...");
        signOutFromAllAccounts();
      } else {
        // Otherwise, check if the logged-in account matches the user-defined domain
        checkLoggedInAccount(trustedDomains[0]); // Check the first trusted domain
      }
    });
  }, 5000); // Check every 5 seconds or adjust as needed
}

// Run this when the Gmail page is loaded
if (window.location.href.includes("mail.google.com") || window.location.href.includes("accounts.google.com")) {
  monitorLogin();
}
