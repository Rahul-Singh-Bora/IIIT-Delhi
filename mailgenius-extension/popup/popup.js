// MailGenius Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const replyButtons = document.querySelectorAll('.reply-btn');
  const copyReplyBtn = document.getElementById('copyReplyBtn');
  const retryBtn = document.getElementById('retryBtn');

  // Get current analysis
  chrome.runtime.sendMessage({ action: 'getAnalysis' }, (response) => {
    if (response.analysis) {
      displayAnalysis(response.analysis);
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

function displayAnalysis(analysis) {
  hideAllStates();
  document.getElementById('analysisView').style.display = 'block';

  const { emailData, priority, priorityReason, senderImportance, importanceReason, summary, actionItems, categories } = analysis;

  // Email info
  document.getElementById('senderName').textContent = emailData.senderName;
  document.getElementById('emailDate').textContent = formatDate(emailData.date);
  document.getElementById('emailSubject').textContent = emailData.subject;

  // Priority badge
  const priorityBadge = document.getElementById('priorityBadge');
  priorityBadge.textContent = `${priority} Priority`;
  priorityBadge.className = `badge badge-${priority.toLowerCase()}`;

  // Importance badge
  const importanceBadge = document.getElementById('importanceBadge');
  importanceBadge.textContent = `${senderImportance} Importance`;
  importanceBadge.className = `badge badge-${senderImportance.toLowerCase()}`;

  // Reasons
  document.getElementById('priorityReason').textContent = `${priorityReason} ${importanceReason}`;

  // Summary
  document.getElementById('emailSummary').textContent = summary;

  // Action items
  if (actionItems && actionItems.length > 0) {
    const actionItemsSection = document.getElementById('actionItemsSection');
    const actionItemsList = document.getElementById('actionItemsList');
    actionItemsSection.style.display = 'block';
    actionItemsList.innerHTML = '';
    
    actionItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      actionItemsList.appendChild(li);
    });
  }

  // Categories
  if (categories && categories.length > 0) {
    const categoriesSection = document.getElementById('categoriesSection');
    const categoriesList = document.getElementById('categoriesList');
    categoriesSection.style.display = 'block';
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = category;
      categoriesList.appendChild(tag);
    });
  }

  // Store email data for reply generation
  window.currentEmailData = emailData;
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
