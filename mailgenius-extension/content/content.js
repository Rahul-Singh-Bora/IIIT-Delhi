// SortIQ Content Script - Auto-analyzes latest emails
console.log('SortIQ: Content script loaded');

let currentEmailData = null;
let analyzeButton = null;
let isAnalyzing = false;

// Wait for Gmail to load
function waitForGmail() {
  const checkInterval = setInterval(() => {
    const emailView = document.querySelector('[role="main"]');
    if (emailView) {
      clearInterval(checkInterval);
      console.log('SortIQ: Gmail loaded, initializing...');
      initialize();
    }
  }, 1000);
}

function initialize() {
  console.log('SortIQ: Initialization started');
  
  // Auto-analyze latest 20 emails when Gmail loads
  setTimeout(() => {
    console.log('SortIQ: Starting auto-analysis timer...');
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
  
  console.log('SortIQ: Initialization complete');
}

// Auto-analyze latest 20 emails
async function autoAnalyzeEmails() {
  if (isAnalyzing) {
    console.log('SortIQ: Already analyzing, skipping...');
    return;
  }
  isAnalyzing = true;
  
  console.log('SortIQ: Starting auto-analysis of latest 10 emails...');
  
  // Find all email rows in inbox - try multiple selectors
  let emailRows = document.querySelectorAll('tr.zA');
  
  if (emailRows.length === 0) {
    console.log('SortIQ: No emails found with tr.zA, trying alternative selectors...');
    emailRows = document.querySelectorAll('table.F.cf.zt tr');
  }
  
  const emailsToAnalyze = Array.from(emailRows).slice(0, 10);
  
  console.log(`SortIQ: Found ${emailsToAnalyze.length} emails to analyze`);
  
  if (emailsToAnalyze.length === 0) {
    console.log('SortIQ: No emails found! Check if you are in inbox view.');
    isAnalyzing = false;
    return;
  }
  
  // Analyze emails with rate limit: max 5 at a time to stay under 10/min limit
  const BATCH_SIZE = 5;
  const analyses = [];
  
  for (let i = 0; i < emailsToAnalyze.length; i += BATCH_SIZE) {
    const batch = emailsToAnalyze.slice(i, i + BATCH_SIZE);
    console.log(`📧 Analyzing emails ${i + 1}-${Math.min(i + BATCH_SIZE, emailsToAnalyze.length)} of ${emailsToAnalyze.length}...`);
    
    const batchPromises = batch.map((row, batchIndex) => {
      const emailData = extractEmailFromRow(row, i + batchIndex);
      
      if (emailData) {
        console.log(`  • ${emailData.subject.substring(0, 50)}...`);
        
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'analyzeEmail',
            emailData: emailData
          }, (response) => {
            if (response && response.success) {
              resolve(response.analysis);
            } else {
              console.error('❌ Analysis failed:', response?.error);
              console.error('Full response:', response);
              console.error('Email subject:', emailData?.subject);
              if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
              }
              // Log background console tip
              console.log('%c💡 TIP: Check service worker console at brave://extensions/ → "Inspect views: service worker"', 'color: orange; font-weight: bold');
              resolve(null);
            }
          });
        });
      }
      return Promise.resolve(null);
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    analyses.push(...batchResults.filter(a => a !== null));
    
    // Delay to respect rate limits - shorter delay for 10 emails
    console.log('⏳ Waiting to respect API rate limits...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Store all analyses
  chrome.storage.local.set({ 
    allEmailAnalyses: analyses,
    lastAnalysisTime: Date.now()
  });
  
  console.log(`✓ SortIQ: Completed analysis of ${analyses.length} emails!`);
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
