// SortIQ IndexedDB Manager
class SortIQDatabase {
  constructor() {
    this.dbName = 'SortIQDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Sender Profile Table
        if (!db.objectStoreNames.contains('senderProfiles')) {
          const senderStore = db.createObjectStore('senderProfiles', { keyPath: 'email' });
          senderStore.createIndex('importance', 'importance', { unique: false });
          senderStore.createIndex('interactionCount', 'interactionCount', { unique: false });
          senderStore.createIndex('lastInteraction', 'lastInteraction', { unique: false });
        }

        // 2. Priority History Table
        if (!db.objectStoreNames.contains('priorityHistory')) {
          const priorityStore = db.createObjectStore('priorityHistory', { keyPath: 'id', autoIncrement: true });
          priorityStore.createIndex('emailId', 'emailId', { unique: false });
          priorityStore.createIndex('senderEmail', 'senderEmail', { unique: false });
          priorityStore.createIndex('predictedPriority', 'predictedPriority', { unique: false });
          priorityStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 3. Action Pattern Table
        if (!db.objectStoreNames.contains('actionPatterns')) {
          const actionStore = db.createObjectStore('actionPatterns', { keyPath: 'id', autoIncrement: true });
          actionStore.createIndex('actionType', 'actionType', { unique: false });
          actionStore.createIndex('category', 'category', { unique: false });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 4. Email Context Table (for context memory)
        if (!db.objectStoreNames.contains('emailContext')) {
          const contextStore = db.createObjectStore('emailContext', { keyPath: 'emailId' });
          contextStore.createIndex('senderEmail', 'senderEmail', { unique: false });
          contextStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Sender Profile Methods
  async updateSenderProfile(email, name, importance, interactionType) {
    const transaction = this.db.transaction(['senderProfiles'], 'readwrite');
    const store = transaction.objectStore('senderProfiles');
    
    const existing = await this.getSenderProfile(email);
    
    const profile = {
      email: email,
      name: name,
      importance: importance,
      interactionCount: (existing?.interactionCount || 0) + 1,
      lastInteraction: Date.now(),
      lastInteractionType: interactionType,
      avgResponseTime: existing?.avgResponseTime || 0,
      categories: existing?.categories || []
    };

    return new Promise((resolve, reject) => {
      const request = store.put(profile);
      request.onsuccess = () => resolve(profile);
      request.onerror = () => reject(request.error);
    });
  }

  async getSenderProfile(email) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['senderProfiles'], 'readonly');
      const store = transaction.objectStore('senderProfiles');
      const request = store.get(email);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSenderProfiles() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['senderProfiles'], 'readonly');
      const store = transaction.objectStore('senderProfiles');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Priority History Methods
  async addPriorityHistory(emailId, senderEmail, predictedPriority, actualPriority, categories) {
    const transaction = this.db.transaction(['priorityHistory'], 'readwrite');
    const store = transaction.objectStore('priorityHistory');
    
    const history = {
      emailId: emailId,
      senderEmail: senderEmail,
      predictedPriority: predictedPriority,
      actualPriority: actualPriority,
      categories: categories,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(history);
      request.onsuccess = () => resolve(history);
      request.onerror = () => reject(request.error);
    });
  }

  async getPriorityHistoryBySender(senderEmail, limit = 10) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['priorityHistory'], 'readonly');
      const store = transaction.objectStore('priorityHistory');
      const index = store.index('senderEmail');
      const request = index.getAll(senderEmail);
      
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPriorityHistory(limit = 100) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['priorityHistory'], 'readonly');
      const store = transaction.objectStore('priorityHistory');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Action Pattern Methods
  async recordAction(actionType, category, senderEmail, metadata = {}) {
    const transaction = this.db.transaction(['actionPatterns'], 'readwrite');
    const store = transaction.objectStore('actionPatterns');
    
    const action = {
      actionType: actionType, // 'replied', 'archived', 'deleted', 'starred', 'read', 'ignored'
      category: category,
      senderEmail: senderEmail,
      timestamp: Date.now(),
      metadata: metadata
    };

    return new Promise((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve(action);
      request.onerror = () => reject(request.error);
    });
  }

  async getActionPatterns(limit = 100) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionPatterns'], 'readonly');
      const store = transaction.objectStore('actionPatterns');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getActionPatternsByCategory(category) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionPatterns'], 'readonly');
      const store = transaction.objectStore('actionPatterns');
      const index = store.index('category');
      const request = index.getAll(category);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Email Context Methods (for context memory)
  async saveEmailContext(emailId, senderEmail, subject, summary, analysis, fullContent) {
    const transaction = this.db.transaction(['emailContext'], 'readwrite');
    const store = transaction.objectStore('emailContext');
    
    const context = {
      emailId: emailId,
      senderEmail: senderEmail,
      subject: subject,
      summary: summary,
      analysis: analysis,
      fullContent: fullContent,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(context);
      request.onsuccess = () => resolve(context);
      request.onerror = () => reject(request.error);
    });
  }

  async getEmailContextBySender(senderEmail, limit = 5) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['emailContext'], 'readonly');
      const store = transaction.objectStore('emailContext');
      const index = store.index('senderEmail');
      const request = index.getAll(senderEmail);
      
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Analytics Methods
  async getAnalytics() {
    const [senders, priorities, actions] = await Promise.all([
      this.getAllSenderProfiles(),
      this.getAllPriorityHistory(50),
      this.getActionPatterns(50)
    ]);

    // Calculate statistics
    const analytics = {
      totalSenders: senders.length,
      totalInteractions: senders.reduce((sum, s) => sum + s.interactionCount, 0),
      topSenders: senders.sort((a, b) => b.interactionCount - a.interactionCount).slice(0, 10),
      priorityDistribution: this.calculatePriorityDistribution(priorities),
      actionDistribution: this.calculateActionDistribution(actions),
      recentActivity: priorities.slice(0, 10)
    };

    return analytics;
  }

  calculatePriorityDistribution(priorities) {
    const distribution = { High: 0, Medium: 0, Low: 0 };
    priorities.forEach(p => {
      distribution[p.predictedPriority] = (distribution[p.predictedPriority] || 0) + 1;
    });
    return distribution;
  }

  calculateActionDistribution(actions) {
    const distribution = {};
    actions.forEach(a => {
      distribution[a.actionType] = (distribution[a.actionType] || 0) + 1;
    });
    return distribution;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SortIQDatabase;
}
