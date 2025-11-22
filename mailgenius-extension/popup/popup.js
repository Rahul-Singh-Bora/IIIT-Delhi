// SortIQ Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const replyButtons = document.querySelectorAll('.reply-btn');
  const copyReplyBtn = document.getElementById('copyReplyBtn');
  const retryBtn = document.getElementById('retryBtn');

  // Get all analyzed emails from storage
  chrome.storage.local.get(['allEmailAnalyses', 'lastAnalysisTime'], (result) => {
    if (result.allEmailAnalyses && result.allEmailAnalyses.length > 0) {
      displayAllAnalyses(result.allEmailAnalyses, result.lastAnalysisTime);
    } else {
      showNoEmailState();
    }
  });

  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Reply generation buttons
  replyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const replyType = btn.dataset.type;
      await generateReply(replyType);
    });
  });

  // Copy reply button
  copyReplyBtn.addEventListener('click', () => {
    const replyText = document.getElementById('replyText');
    replyText.select();
    document.execCommand('copy');
    
    // Show feedback
    const originalHTML = copyReplyBtn.innerHTML;
    copyReplyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    setTimeout(() => {
      copyReplyBtn.innerHTML = originalHTML;
    }, 2000);
  });

  // Retry button
  retryBtn.addEventListener('click', () => {
    location.reload();
  });
});

function displayAllAnalyses(analyses, lastAnalysisTime) {
  hideAllStates();
  document.getElementById('analysisView').style.display = 'block';
  document.getElementById('analysisView').innerHTML = `
    <div class="analysis-header">
      <h2>📧 Latest ${analyses.length} Emails Analyzed</h2>
      <p class="last-updated">Last updated: ${formatDate(new Date(lastAnalysisTime))}</p>
    </div>
    <div class="email-list" id="emailList"></div>
  `;
  
  const emailList = document.getElementById('emailList');
  
  analyses.forEach((analysis, index) => {
    const { emailData, priority, senderImportance, summary } = analysis;
    
    const emailCard = document.createElement('div');
    emailCard.className = 'email-card';
    emailCard.innerHTML = `
      <div class="email-card-header">
        <div class="email-sender">${emailData.senderName}</div>
        <div class="badge-group">
          <span class="badge badge-${priority.toLowerCase()}">${priority}</span>
          <span class="badge badge-${senderImportance.toLowerCase()}">${senderImportance}</span>
        </div>
      </div>
      <div class="email-subject">${emailData.subject}</div>
      <div class="email-summary">${summary}</div>
      <div class="email-date">${formatDate(emailData.date)}</div>
    `;
    
    emailCard.addEventListener('click', () => {
      displaySingleAnalysis(analysis);
    });
    
    emailList.appendChild(emailCard);
  });
}

function displaySingleAnalysis(analysis) {
  hideAllStates();
  document.getElementById('analysisView').style.display = 'block';
  
  const { emailData, priority, priorityReason, senderImportance, importanceReason, summary, actionItems, categories } = analysis;
  
  document.getElementById('analysisView').innerHTML = `
    <button class="back-btn" id="backBtn">← Back to List</button>
    <div class="email-info">
      <div class="email-header">
        <span class="sender-name">${emailData.senderName}</span>
        <span class="email-date">${formatDate(emailData.date)}</span>
      </div>
      <div class="email-subject">${emailData.subject}</div>
    </div>
    
    <div class="analysis-section">
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
        </svg>
        Priority Analysis
      </h3>
      <div class="badge-container">
        <span class="badge badge-${priority.toLowerCase()}">${priority} Priority</span>
        <span class="badge badge-${senderImportance.toLowerCase()}">${senderImportance} Importance</span>
      </div>
      <p class="reason">${priorityReason} ${importanceReason}</p>
    </div>
    
    <div class="analysis-section">
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
        </svg>
        Summary
      </h3>
      <p>${summary}</p>
    </div>
    
    ${actionItems && actionItems.length > 0 ? `
      <div class="analysis-section">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Action Items
        </h3>
        <ul id="actionItemsList">${actionItems.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
    ` : ''}
    
    ${categories && categories.length > 0 ? `
      <div class="analysis-section" id="categoriesSection">
        <h3>Categories</h3>
        <div class="tag-container" id="categoriesList">
          ${categories.map(cat => `<span class="tag">${cat}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    
    <div class="reply-section">
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
        </svg>
        Generate Reply
      </h3>
      <div class="button-group">
        <button class="reply-btn" data-type="professional">Professional</button>
        <button class="reply-btn" data-type="friendly">Friendly</button>
        <button class="reply-btn" data-type="brief">Brief</button>
        <button class="reply-btn" data-type="detailed">Detailed</button>
        <button class="reply-btn" data-type="decline">Decline</button>
      </div>
      
      <div id="replyOutput" class="reply-output" style="display: none;">
        <div class="reply-header">
          <span>Generated Reply</span>
          <button id="copyReplyBtn" class="icon-btn-inline" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>
        <textarea id="replyText" rows="8"></textarea>
      </div>
    </div>
  `;
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    chrome.storage.local.get(['allEmailAnalyses', 'lastAnalysisTime'], (result) => {
      displayAllAnalyses(result.allEmailAnalyses, result.lastAnalysisTime);
    });
  });
  
  // Reply buttons
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const replyType = btn.dataset.type;
      await generateReply(replyType, emailData);
    });
  });
  
  // Copy reply button
  const copyBtn = document.getElementById('copyReplyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const replyText = document.getElementById('replyText');
      replyText.select();
      document.execCommand('copy');
      
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    });
  }
  
  window.currentEmailData = emailData;
}

async function generateReply(replyType, emailData) {
  const replyButtons = document.querySelectorAll('.reply-btn');
  const activeBtn = document.querySelector(`.reply-btn[data-type="${replyType}"]`);
  
  // Disable all buttons
  replyButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.type === replyType) {
      btn.textContent = 'Generating...';
    }
  });

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'generateReply',
        emailData: emailData,
        replyType: replyType
      }, resolve);
    });

    // Re-enable buttons
    replyButtons.forEach(btn => {
      btn.disabled = false;
      if (btn.dataset.type === replyType) {
        btn.textContent = replyType.charAt(0).toUpperCase() + replyType.slice(1);
      }
    });

    if (response && response.success) {
      const replyOutput = document.getElementById('replyOutput');
      const replyText = document.getElementById('replyText');
      
      replyOutput.style.display = 'block';
      replyText.value = response.reply;
      
      // Scroll to reply
      replyOutput.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('Error generating reply: ' + (response?.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error generating reply:', error);
    alert('Error: ' + error.message);
    
    // Re-enable buttons
    replyButtons.forEach(btn => {
      btn.disabled = false;
      if (btn.dataset.type === replyType) {
        btn.textContent = replyType.charAt(0).toUpperCase() + replyType.slice(1);
      }
    });
  }
}

async function generateReply(replyType) {
  if (!window.currentEmailData) return;

  // Disable all reply buttons
  const replyButtons = document.querySelectorAll('.reply-btn');
  replyButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.type === replyType) {
      btn.textContent = 'Generating...';
    }
  });

  chrome.runtime.sendMessage({
    action: 'generateReply',
    emailData: window.currentEmailData,
    replyType: replyType
  }, (response) => {
    // Re-enable buttons
    replyButtons.forEach(btn => {
      btn.disabled = false;
      if (btn.dataset.type === replyType) {
        btn.textContent = btn.dataset.type.charAt(0).toUpperCase() + btn.dataset.type.slice(1);
      }
    });

    if (response.success) {
      const replyOutput = document.getElementById('replyOutput');
      const replyText = document.getElementById('replyText');
      
      replyOutput.style.display = 'block';
      replyText.value = response.reply;
      
      // Scroll to reply
      replyOutput.scrollIntoView({ behavior: 'smooth' });
    } else {
      showError(response.error);
    }
  });
}

function showNoEmailState() {
  hideAllStates();
  document.getElementById('noEmailState').style.display = 'flex';
}

function showError(message) {
  hideAllStates();
  document.getElementById('errorState').style.display = 'flex';
  document.getElementById('errorMessage').textContent = message;
}

function hideAllStates() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('noEmailState').style.display = 'none';
  document.getElementById('analysisView').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
