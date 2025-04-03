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

// Function to check email and prevent login if unauthorized
function blockUnauthorizedLogin() {
  let emailInput = document.querySelector("input[type='email']");
  
  if (!emailInput) return; // Exit if email field is not found
  
  emailInput.addEventListener("blur", function () {
    let enteredEmail = emailInput.value.trim();
    if (enteredEmail && !enteredEmail.endsWith("@precihole.in")) {
      showCustomAlert("Only Precihole emails are allowed for login.");
      emailInput.value = ""; // Clear the input field
    }
  });
  
  let nextButton = document.querySelector("button[type='button']");
  
  if (nextButton) {
    nextButton.addEventListener("click", function (event) {
      let enteredEmail = emailInput.value.trim();
      if (enteredEmail && !enteredEmail.endsWith("@precihole.in")) {
        event.preventDefault(); // Block login attempt
        showCustomAlert("Only Precihole emails are allowed for login.");
      }
    });
  }
}

// Run function when login page is loaded
if (window.location.href.includes("accounts.google.com")) {
  blockUnauthorizedLogin();
}

// Observe URL changes to detect when login page appears
let observer = new MutationObserver(() => {
  if (window.location.href.includes("accounts.google.com")) {
    blockUnauthorizedLogin();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
