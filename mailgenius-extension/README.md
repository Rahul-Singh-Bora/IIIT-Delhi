# MailGenius - AI Email Assistant Chrome Extension

![MailGenius Banner](https://img.shields.io/badge/MailGenius-AI_Email_Assistant-blueviolet)

An intelligent Chrome extension that brings AI-powered email analysis and reply generation directly to your Gmail inbox. Analyze email priority, sender importance, get summaries, and generate context-aware replies with multiple AI providers.

## ✨ Features

Based on the user flow diagram, MailGenius provides:

### 📧 Email Analysis
- **Priority Detection**: Automatically categorizes emails as High/Medium/Low priority
- **Sender Importance**: Evaluates sender significance based on email history and content
- **Smart Summaries**: Generates concise 2-3 sentence summaries of email content
- **Action Items**: Extracts and lists actionable tasks from emails
- **Category Tags**: Automatically tags emails with relevant categories

### 🤖 AI Reply Generation
Generate contextually appropriate replies in multiple styles:
- **Professional**: Formal and business-appropriate responses
- **Friendly**: Warm and conversational tone
- **Brief**: Short and to-the-point replies
- **Detailed**: Comprehensive and thorough responses
- **Decline**: Polite rejection or decline messages

### 🔌 Multi-LLM Support
Choose from three leading AI providers:
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku) ⭐ **Recommended**
- **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash)

## 🚀 Installation

### Step 1: Clone or Download
```bash
cd ~/Desktop/IIITD
# The extension files are already in: mailgenius-extension/
```

### Step 2: Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `mailgenius-extension` folder
5. The MailGenius icon should appear in your extensions toolbar

### Step 3: Configure API Key
1. Click the MailGenius extension icon
2. Click the settings gear icon (⚙️)
3. Choose your AI provider:
   - **OpenAI**: Get key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Anthropic**: Get key at [console.anthropic.com](https://console.anthropic.com/)
   - **Google Gemini**: Get key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Paste your API key
5. (Optional) Specify a custom model name
6. Click "Save Settings"

## 🎯 Usage

### Analyzing an Email
1. Open Gmail (mail.google.com)
2. Select and open any email
3. Look for the "Analyze with AI" button in the email toolbar
4. Click the button to analyze the email
5. The extension popup will show:
   - Priority level with reasoning
   - Sender importance assessment
   - Email summary
   - Action items (if any)
   - Category tags

### Generating Replies
1. After analyzing an email, scroll to the "Generate Reply" section
2. Click one of the reply style buttons:
   - Professional
   - Friendly
   - Brief
   - Detailed
   - Decline
3. The AI will generate a context-aware reply
4. Click the copy icon to copy the reply to your clipboard
5. Paste into Gmail's compose window and edit as needed

## 🔧 Recommended LLM Setup

### Best Overall: **Anthropic Claude**
```
Provider: Anthropic Claude
Model: claude-3-5-sonnet-20241022
Reasoning: Best balance of quality, context understanding, and cost
```

### Most Affordable: **OpenAI**
```
Provider: OpenAI
Model: gpt-4o-mini
Reasoning: Fast, cost-effective, great for high-volume use
```

### Free Tier Available: **Google Gemini**
```
Provider: Google Gemini
Model: gemini-1.5-flash
Reasoning: Free tier with generous limits, good for testing
```

## 📁 Project Structure

```
mailgenius-extension/
├── manifest.json              # Extension configuration
├── background/
│   └── background.js         # Service worker for AI API calls
├── content/
│   ├── content.js            # Gmail page injection script
│   └── content.css           # Styles for injected elements
├── popup/
│   ├── popup.html            # Analysis results interface
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── options/
│   ├── options.html          # Settings page
│   ├── options.js            # Settings logic
│   └── options.css           # Settings styles
├── icons/
│   ├── icon16.png           # 16x16 icon
│   ├── icon48.png           # 48x48 icon
│   ├── icon128.png          # 128x128 icon
│   └── icon.svg             # Source SVG icon
└── README.md                # This file
```

## 🔐 Privacy & Security

- **Local Storage**: API keys are stored locally using Chrome's secure storage API
- **No Data Collection**: MailGenius does not collect or store any email content
- **Direct API Calls**: All AI requests go directly from your browser to the chosen AI provider
- **Open Source**: Full source code available for audit

## 🛠️ Development

### Prerequisites
- Chrome/Chromium browser
- Text editor (VS Code recommended)
- API key from at least one AI provider

### Testing
1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the MailGenius extension
4. Test in Gmail

### Debugging
- **Content Script**: Right-click on Gmail page → Inspect → Console tab
- **Popup**: Right-click extension icon → Inspect popup
- **Background**: Go to `chrome://extensions/` → Click "service worker" link under MailGenius
- **Options**: Right-click on options page → Inspect

## 🐛 Troubleshooting

### "API key not configured" Error
- Go to extension settings and ensure API key is saved
- Check that you selected the correct AI provider

### Analyze Button Not Appearing
- Refresh the Gmail page
- Ensure you're on mail.google.com (not gmail app)
- Check browser console for errors

### AI Request Failures
- Verify API key is valid and has sufficient credits
- Check internet connection
- Try a different AI provider
- Check model name is spelled correctly

### Extension Not Loading
- Ensure all files are present in the extension folder
- Check `chrome://extensions/` for error messages
- Try removing and re-adding the extension

## 📝 API Cost Estimates

### OpenAI (GPT-4o-mini)
- Analysis: ~$0.0001-0.0003 per email
- Reply: ~$0.0002-0.0005 per reply
- ~1000-3000 emails per $1

### Anthropic (Claude 3.5 Sonnet)
- Analysis: ~$0.001-0.003 per email
- Reply: ~$0.002-0.006 per reply
- ~150-500 emails per $1

### Google Gemini (1.5 Flash)
- Free tier: 15 requests/minute, 1500 requests/day
- Paid: $0.075 per 1M tokens input, $0.30 per 1M tokens output

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use and modify for personal or commercial use.

## 🙏 Acknowledgments

- Built with Chrome Extensions Manifest V3
- UI inspired by modern email clients
- Icon design using gradient purple theme

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the extension console logs

---

**Made with 💜 by the MailGenius Team**

*Analyze smarter, reply faster, focus on what matters.*
