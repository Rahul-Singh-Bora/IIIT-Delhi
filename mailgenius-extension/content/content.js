// MailGenius Content Script - Auto-analyzes latest emails
console.log('MailGenius: Content script loaded');

let currentEmailData = null;
let analyzeButton = null;
let isAnalyzing = false;

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
  console.log('MailGenius: Initialization started');
  
  // Auto-analyze latest 20 emails when Gmail loads
  setTimeout(() => {
    console.log('MailGenius: Starting auto-analysis timer...');
    autoAnalyzeEmails();
  }, 5000); // Wait 5 seconds for Gmail to fully load
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getEmailContent') {
      const emailData = extractEmailContent();
      sendResponse({ emailData });
    }
    return true;
  });
  
  console.log('MailGenius: Initialization complete');
}

// Auto-analyze latest 20 emails
async function autoAnalyzeEmails() {
  if (isAnalyzing) {
    console.log('MailGenius: Already analyzing, skipping...');
    return;
  }
  isAnalyzing = true;
  
  console.log('MailGenius: Starting auto-analysis of latest 20 emails...');
  
  // Find all email rows in inbox - try multiple selectors
  let emailRows = document.querySelectorAll('tr.zA');
  
  if (emailRows.length === 0) {
    console.log('MailGenius: No emails found with tr.zA, trying alternative selectors...');
    emailRows = document.querySelectorAll('table.F.cf.zt tr');
  }
  
  const emailsToAnalyze = Array.from(emailRows).slice(0, 20);
  
  console.log(`MailGenius: Found ${emailsToAnalyze.length} emails to analyze`);
  
  if (emailsToAnalyze.length === 0) {
    console.log('MailGenius: No emails found! Check if you are in inbox view.');
    isAnalyzing = false;
    return;
  }
  
  const analyses = [];
  
  for (let i = 0; i < emailsToAnalyze.length; i++) {
    const row = emailsToAnalyze[i];
    const emailData = extractEmailFromRow(row, i);
    
    if (emailData) {
      console.log(`Analyzing email ${i + 1}/${emailsToAnalyze.length}:`, emailData.subject);
      
      try {
        // Send to background for analysis
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'analyzeEmail',
            emailData: emailData
          }, resolve);
        });
        
        if (response && response.success) {
          analyses.push(response.analysis);
        }
      } catch (error) {
        console.error('Error analyzing email:', error);
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Store all analyses
  chrome.storage.local.set({ 
    allEmailAnalyses: analyses,
    lastAnalysisTime: Date.now()
  });
  
  console.log(`MailGenius: Completed analysis of ${analyses.length} emails`);
  isAnalyzing = false;
}

// Extract email data from inbox row
function extractEmailFromRow(row, index) {
  try {
    // Get sender name
    const senderElement = row.querySelector('.yW span[email]') || row.querySelector('.yX.xY span');
    const sender = senderElement ? senderElement.getAttribute('email') || senderElement.textContent : 'Unknown';
    const senderName = row.querySelector('.yW span[name]')?.getAttribute('name') || 
                       row.querySelector('.yX.xY')?.textContent || 'Unknown';
    
    // Get subject
    const subjectElement = row.querySelector('.y6 span') || row.querySelector('.bog span');
    const subject = subjectElement ? subjectElement.textContent.trim() : 'No Subject';
    
    // Get preview/snippet
    const snippetElement = row.querySelector('.y2');
    const body = snippetElement ? snippetElement.textContent.trim() : '';
    
    // Get date
    const dateElement = row.querySelector('.xW.xY span');
    const date = dateElement ? dateElement.getAttribute('title') || dateElement.textContent : new Date().toISOString();
    
    return {
      sender,
      senderName,
      subject,
      body,
      date,
      timestamp: Date.now(),
      rowIndex: index
    };
  } catch (error) {
    console.error('Error extracting email from row:', error);
    return null;
  }
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
