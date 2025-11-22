// MailGenius Content Script - Injects AI analysis into Gmail
console.log('MailGenius: Content script loaded');

let currentEmailData = null;
let analyzeButton = null;

// Wait for Gmail to load
function waitForGmail() {
  const checkInterval = setInterval(() => {
    const emailView = document.querySelector('[role="main"]');
    if (emailView) {
      clearInterval(checkInterval);
      console.log('MailGenius: Gmail loaded, initializing...');
      initialize();
    }
  }, 1000);
}

function initialize() {
  // Monitor for email opens
  observeEmailChanges();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getEmailContent') {
      const emailData = extractEmailContent();
      sendResponse({ emailData });
    }
    return true;
  });
}

// Observe DOM changes to detect when user opens an email
function observeEmailChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check if an email is currently open
    const emailContainer = document.querySelector('[role="main"] [data-message-id]');
    if (emailContainer && !analyzeButton) {
      injectAnalyzeButton();
    }
  });

  const mainView = document.querySelector('[role="main"]');
  if (mainView) {
    observer.observe(mainView, {
      childList: true,
      subtree: true
    });
  }
}

// Inject "Analyze Email" button into Gmail sidebar
function injectAnalyzeButton() {
  // Find the email toolbar area
  const toolbar = document.querySelector('[role="main"] [role="toolbar"]');
  
  if (!toolbar || analyzeButton) return;

  // Create analyze button
  analyzeButton = document.createElement('button');
  analyzeButton.id = 'mailgenius-analyze-btn';
  analyzeButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 11.5v-7h2v7H7zm0 2v-1h2v1H7z"/>
    </svg>
    <span>Analyze with AI</span>
  `;
  analyzeButton.className = 'mailgenius-btn';
  
  analyzeButton.addEventListener('click', async () => {
    analyzeButton.disabled = true;
    analyzeButton.innerHTML = '<span>Analyzing...</span>';
    
    const emailData = extractEmailContent();
    
    // Send to background script for AI processing
    chrome.runtime.sendMessage({
      action: 'analyzeEmail',
      emailData: emailData
    }, (response) => {
      analyzeButton.disabled = false;
      analyzeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 11.5v-7h2v7H7zm0 2v-1h2v1H7z"/>
        </svg>
        <span>Analyze with AI</span>
      `;
    });
  });

  // Insert button into toolbar
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mailgenius-btn-container';
  buttonContainer.appendChild(analyzeButton);
  
  toolbar.appendChild(buttonContainer);
}

// Extract email content from Gmail DOM
function extractEmailContent() {
  const emailContainer = document.querySelector('[role="main"] [data-message-id]');
  
  if (!emailContainer) {
    return null;
  }

  // Extract sender
  const senderElement = emailContainer.querySelector('[email]');
  const sender = senderElement ? senderElement.getAttribute('email') : 'Unknown';
  const senderName = senderElement ? senderElement.getAttribute('name') : 'Unknown';

  // Extract subject
  const subjectElement = document.querySelector('h2[data-thread-perm-id]');
  const subject = subjectElement ? subjectElement.textContent.trim() : 'No Subject';

  // Extract email body
  const bodyElement = emailContainer.querySelector('[data-message-id] div[dir="ltr"]');
  const body = bodyElement ? bodyElement.innerText.trim() : '';

  // Extract date
  const dateElement = emailContainer.querySelector('[data-tooltip]');
  const date = dateElement ? dateElement.getAttribute('title') : new Date().toISOString();

  return {
    sender,
    senderName,
    subject,
    body,
    date,
    timestamp: Date.now()
  };
}

// Start the extension
waitForGmail();
