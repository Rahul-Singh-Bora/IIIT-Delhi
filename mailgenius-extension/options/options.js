// SortIQ Options Script
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const apiProviderRadios = document.querySelectorAll('input[name="apiProvider"]');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const saveBtn = document.getElementById('saveBtn');
  const saveStatus = document.getElementById('saveStatus');

  // Load saved settings
  const settings = await chrome.storage.sync.get(['apiKey', 'apiProvider', 'modelName']);
  
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }
  
  if (settings.apiProvider) {
    const radio = document.querySelector(`input[value="${settings.apiProvider}"]`);
    if (radio) radio.checked = true;
    updateProviderInfo(settings.apiProvider);
  } else {
    updateProviderInfo('openai');
  }
  
  if (settings.modelName) {
    modelNameInput.value = settings.modelName;
  } else {
    modelNameInput.placeholder = 'gpt-4o-mini';
  }

  // Provider change handler
  apiProviderRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateProviderInfo(e.target.value);
      updateModelPlaceholder(e.target.value);
    });
  });

  // Toggle API key visibility
  if (toggleApiKeyBtn) {
    toggleApiKeyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleApiKeyBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          </svg>
        `;
        toggleApiKeyBtn.title = 'Hide API key';
      } else {
        apiKeyInput.type = 'password';
        toggleApiKeyBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        `;
        toggleApiKeyBtn.title = 'Show API key';
      }
    });
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const apiProvider = document.querySelector('input[name="apiProvider"]:checked').value;
    const apiKey = apiKeyInput.value.trim();
    const modelName = modelNameInput.value.trim() || getDefaultModel(apiProvider);

    try {
      await chrome.storage.sync.set({
        apiProvider,
        apiKey,
        modelName
      });

      showSaveStatus('Settings saved successfully!', 'success');
      
      // Reset button after delay
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Settings';
      }, 1500);
    } catch (error) {
      showSaveStatus('Error saving settings: ' + error.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  });
});

function updateProviderInfo(provider) {
  // Hide all info cards
  document.getElementById('openaiInfo').style.display = 'none';
  document.getElementById('anthropicInfo').style.display = 'none';
  document.getElementById('geminiInfo').style.display = 'none';

  // Show selected provider info
  document.getElementById(`${provider}Info`).style.display = 'block';
}

function updateModelPlaceholder(provider) {
  const modelInput = document.getElementById('modelName');
  const modelHelp = document.getElementById('modelHelp');
  
  const placeholders = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-1.5-flash'
  };

  const helpTexts = {
    openai: 'Available: gpt-4o, gpt-4o-mini, gpt-3.5-turbo',
    anthropic: 'Available: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307',
    gemini: 'Available: gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro'
  };

  modelInput.placeholder = placeholders[provider];
  modelHelp.textContent = helpTexts[provider];
}

function getDefaultModel(provider) {
  const defaults = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-1.5-flash'
  };
  return defaults[provider];
}

function showSaveStatus(message, type) {
  const saveStatus = document.getElementById('saveStatus');
  saveStatus.textContent = message;
  saveStatus.className = `save-status save-status-${type}`;
  saveStatus.style.display = 'block';

  setTimeout(() => {
    saveStatus.style.display = 'none';
  }, 3000);
}
