document.getElementById('saveButton').addEventListener('click', function() {
    const input = document.getElementById('trustedDomains').value.trim();
  
    if (input) {
      // Split input into domains and remove any extra spaces around each domain
      const domains = input.split(',').map(domain => domain.trim()).filter(domain => domain !== "");
  
      // If the array isn't empty, save the trusted domains
      if (domains.length > 0) {
        chrome.storage.sync.set({ trustedDomains: domains }, function() {
          alert('Trusted domains saved!');
        });
      } else {
        alert('Please enter at least one valid domain.');
      }
    } else {
      alert('Please enter at least one domain.');
    }
  });
  