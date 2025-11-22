// MailGenius Background Service Worker
console.log('MailGenius: Background service worker initialized');

let currentEmailAnalysis = null;

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    handleEmailAnalysis(request.emailData).then(analysis => {
      currentEmailAnalysis = analysis;
      
      // Open popup to show analysis
      chrome.action.openPopup();
      
      sendResponse({ success: true, analysis });
    }).catch(error => {
      console.error('Analysis error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getAnalysis') {
    sendResponse({ analysis: currentEmailAnalysis });
    return true;
  }
  
  if (request.action === 'generateReply') {
    handleReplyGeneration(request.emailData, request.replyType).then(reply => {
      sendResponse({ success: true, reply });
    }).catch(error => {
      console.error('Reply generation error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Analyze email using AI
async function handleEmailAnalysis(emailData) {
  const settings = await chrome.storage.sync.get(['apiKey', 'apiProvider', 'modelName']);
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set it in the options page.');
  }

  const provider = settings.apiProvider || 'openai';
  const model = settings.modelName || 'gpt-4o-mini';

  const analysisPrompt = `Analyze this email and provide:
1. Priority level (High/Medium/Low) with reasoning
2. Sender importance assessment
3. Brief summary (2-3 sentences)
4. Suggested action items (if any)
5. Key topics/categories

Email Details:
From: ${emailData.senderName} <${emailData.sender}>
Subject: ${emailData.subject}
Date: ${emailData.date}

Body:
${emailData.body}

Respond in JSON format:
{
  "priority": "High/Medium/Low",
  "priorityReason": "explanation",
  "senderImportance": "High/Medium/Low",
  "importanceReason": "explanation",
  "summary": "brief summary",
  "actionItems": ["item1", "item2"],
  "categories": ["category1", "category2"]
}`;

  const analysis = await callAI(analysisPrompt, provider, settings.apiKey, model);
  
  // Parse JSON response
  let parsedAnalysis;
  try {
    parsedAnalysis = JSON.parse(analysis);
  } catch (e) {
    // If not valid JSON, extract JSON from markdown code blocks
    const jsonMatch = analysis.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      parsedAnalysis = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse AI response');
    }
  }

  return {
    ...parsedAnalysis,
    emailData
  };
}

// Generate reply using AI
async function handleReplyGeneration(emailData, replyType) {
  const settings = await chrome.storage.sync.get(['apiKey', 'apiProvider', 'modelName']);
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set it in the options page.');
  }

  const provider = settings.apiProvider || 'openai';
  const model = settings.modelName || 'gpt-4o-mini';

  const replyPrompts = {
    professional: 'Write a professional and formal reply',
    friendly: 'Write a warm and friendly reply',
    brief: 'Write a brief and concise reply',
    detailed: 'Write a detailed and comprehensive reply',
    decline: 'Write a polite decline/rejection reply'
  };

  const prompt = `${replyPrompts[replyType] || replyPrompts.professional} to this email:

From: ${emailData.senderName} <${emailData.sender}>
Subject: ${emailData.subject}

Body:
${emailData.body}

Generate ONLY the reply body text, no subject line or signatures. Be natural and context-appropriate.`;

  const reply = await callAI(prompt, provider, settings.apiKey, model);
  
  return reply.trim();
}

// Generic AI API call function
async function callAI(prompt, provider, apiKey, model) {
  if (provider === 'openai') {
    return await callOpenAI(prompt, apiKey, model);
  } else if (provider === 'anthropic') {
    return await callAnthropic(prompt, apiKey, model);
  } else if (provider === 'gemini') {
    return await callGemini(prompt, apiKey, model);
  } else {
    throw new Error('Unsupported AI provider');
  }
}

// OpenAI API
async function callOpenAI(prompt, apiKey, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert email assistant. Provide accurate, helpful analysis and responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Anthropic Claude API
async function callAnthropic(prompt, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Google Gemini API
async function callGemini(prompt, apiKey, model) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
