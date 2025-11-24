# SortIQ Database & Analytics

## Features

### 1. **IndexedDB Storage** (Chrome Local Storage)
SortIQ stores all analysis data locally in your browser using Chrome's storage API.

#### Tables:
- **Sender Profiles**: Tracks sender importance and interaction history
- **Priority History**: Stores past email priority predictions
- **Action Patterns**: Records your common actions (reply, archive, etc.)
- **Email Context**: Maintains conversation context for better AI analysis

### 2. **Context Memory**
The AI improves over time by learning from:
- Previous emails from the same sender
- Your interaction patterns
- Priority history
- Categories and topics

### 3. **Visual Analytics Dashboard**
Access via the 📊 icon in the popup.

#### Charts & Graphs:
- **Priority Distribution**: Pie chart showing High/Medium/Low email breakdown
- **Action Patterns**: Bar chart of your most common actions
- **Top Senders**: Ranked by interaction count
- **Recent Activity**: Timeline of analyzed emails

#### Statistics:
- Total unique senders
- Total emails analyzed
- Average priority level
- Action count

### 4. **How Context Memory Works**

When analyzing an email, SortIQ:
1. Checks if you've interacted with this sender before
2. Retrieves past email summaries and priorities
3. Includes this context in the AI prompt
4. Provides more accurate and personalized analysis

Example:
```
First email from sender@example.com → Generic analysis
After 5 emails → AI knows sender importance, typical topics, your response patterns
```

### 5. **Privacy**
- All data stored **locally** in your browser
- No external database or cloud storage
- Data never leaves your computer
- Clear data anytime by removing the extension

### 6. **Accessing Analytics**

**Method 1**: Click the 📊 icon in the popup
**Method 2**: Right-click extension icon → Inspect → Go to `chrome-extension://<id>/analytics/analytics.html`

### 7. **Data Structure**

```javascript
// Sender Profile
{
  email: "sender@example.com",
  name: "John Doe",
  importance: "High",
  interactionCount: 15,
  lastInteraction: 1234567890,
  categories: ["Work", "Important"]
}

// Priority History
{
  emailId: "unique-id",
  senderEmail: "sender@example.com",
  predictedPriority: "High",
  categories: ["Security", "Urgent"],
  timestamp: 1234567890
}

// Action Pattern
{
  actionType: "replied",
  category: "Work",
  senderEmail: "sender@example.com",
  timestamp: 1234567890
}

// Email Context
{
  subject: "Meeting tomorrow",
  summary: "Brief summary of email",
  timestamp: 1234567890
}
```

### 8. **Future Enhancements**
- Export analytics as CSV/PDF
- Set custom importance rules
- Email response time tracking
- Category auto-suggestions
- Smart folder recommendations
