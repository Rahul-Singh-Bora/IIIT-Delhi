// SortIQ Background Service Worker
console.log('SortIQ: Background service worker initialized');

let currentEmailAnalysis = null;

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    handleEmailAnalysis(request.emailData).then(analysis => {
      currentEmailAnalysis = analysis;
      
      // Store analysis and notify content script
      chrome.storage.local.set({ lastAnalysis: analysis });
      
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
  // Hardcoded Gemini API configuration
  const settings = {
    apiKey: 'AIzaSyBcG45cxR7TId8tf5-C86I1dYohFLQH_ME',
    apiProvider: 'gemini',
    modelName: 'gemini-2.5-flash'
  };
  
  const provider = settings.apiProvider;
  const model = settings.modelName;

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
  
  // Parse JSON response with better error handling
  let parsedAnalysis;
  try {
    parsedAnalysis = JSON.parse(analysis);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = analysis.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        parsedAnalysis = JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.error('Failed to parse JSON from code block:', jsonMatch[1]);
        throw new Error('Failed to parse AI response from code block');
      }
    } else {
      // Try to find JSON object in the text
      const objectMatch = analysis.match(/\{[\s\S]*"priority"[\s\S]*\}/);
      if (objectMatch) {
        try {
          parsedAnalysis = JSON.parse(objectMatch[0]);
        } catch (e3) {
          console.error('Failed to parse JSON object:', objectMatch[0]);
          // Create default structure from text
          parsedAnalysis = {
            priority: "Medium",
            priorityReason: "Unable to analyze",
            senderImportance: "Medium",
            importanceReason: "Unable to determine",
            summary: analysis.substring(0, 200),
            actionItems: [],
            categories: ["Email"]
          };
        }
      } else {
        console.error('No JSON found in response:', analysis);
        // Create default structure
        parsedAnalysis = {
          priority: "Medium",
          priorityReason: "AI response format error",
          senderImportance: "Medium",
          importanceReason: "Could not parse response",
          summary: "Error processing email analysis",
          actionItems: [],
          categories: ["Email"]
        };
      }
    }
  }

  return {
    ...parsedAnalysis,
    emailData
  };
}

// Generate reply using AI
async function handleReplyGeneration(emailData, replyType) {
  // Hardcoded Gemini API configuration
  const settings = {
    apiKey: 'AIzaSyBcG45cxR7TId8tf5-C86I1dYohFLQH_ME',
    apiProvider: 'gemini',
    modelName: 'gemini-2.5-flash'
  };
  
  const provider = settings.apiProvider;
  const model = settings.modelName;

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

// Google Gemini API with retry logic
async function callGemini(prompt, apiKey, model, retryCount = 0) {
  // Ensure model has the correct format
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`, {
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
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Check if it's a rate limit error
      if (response.status === 429 && retryCount < 2) {
        console.log(`Rate limited, retrying in 10 seconds... (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        return callGemini(prompt, apiKey, model, retryCount + 1);
      }
      
      throw new Error(`Gemini API request failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Log full response to Gmail console for debugging
    console.log('%c🔍 Gemini API Response:', 'color: blue; font-weight: bold');
    console.log(JSON.stringify(data, null, 2));
    
    // Try multiple ways to extract text
    try {
      // Method 1: Standard structure
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;
        
        // Strip markdown code blocks if present
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          text = codeBlockMatch[1].trim();
          console.log('%c✅ Extracted JSON from code block', 'color: green');
        } else {
          console.log('%c✅ Text extracted successfully', 'color: green');
        }
        
        return text;
      }
      
      // Method 2: Check for blocking
      if (data.candidates && data.candidates[0]) {
        const candidate = data.candidates[0];
        console.log('Finish reason:', candidate.finishReason);
        
        if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
          console.error('❌ Blocked by safety filters:', candidate.finishReason);
          throw new Error(`Response blocked by Gemini: ${candidate.finishReason}`);
        }
      }
      
      // Method 3: Direct text field
      if (data.text) {
        return data.text;
      }
      
      // Method 4: Check for error in response
      if (data.error) {
        console.error('❌ Gemini API returned error:', data.error);
        throw new Error(`Gemini error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
    } catch (extractError) {
      console.error('Error extracting text:', extractError);
      throw extractError;
    }
    
    // If nothing worked, log and throw
    console.error('❌ Could not find text in any expected location');
    console.error('Available keys:', Object.keys(data));
    throw new Error('No text content in Gemini response');
    
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}
