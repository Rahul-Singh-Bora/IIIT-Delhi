// SortIQ Analytics Dashboard Script
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Check if Chart.js loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js failed to load from CDN');
    document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>Error: Chart.js library failed to load</h2><p>Please check your internet connection or disable ad blockers.</p></div>';
    return;
  }
  
  console.log('Chart.js loaded successfully');
  
  // Load analytics
  await loadAnalytics();
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadAnalytics);
});

async function loadAnalytics() {
  try {
    // Get data from chrome.storage.local
    const result = await chrome.storage.local.get([
      'senderProfiles',
      'priorityHistory',
      'actionPatterns',
      'allEmailAnalyses'
    ]);
    
    console.log('📊 Loaded data from storage:', result);
    console.log('Sender Profiles:', Object.keys(result.senderProfiles || {}).length);
    console.log('Priority History:', (result.priorityHistory || []).length);
    console.log('All Analyses:', (result.allEmailAnalyses || []).length);
    
    let senderProfiles = result.senderProfiles || {};
    let priorityHistory = result.priorityHistory || [];
    const actionPatterns = result.actionPatterns || [];
    let allAnalyses = result.allEmailAnalyses || [];
    
    // Migrate existing analyses to new storage format if needed
    if (allAnalyses.length > 0 && Object.keys(senderProfiles).length === 0) {
      console.log('🔄 Migrating existing analyses to new storage format...');
      
      allAnalyses.forEach(analysis => {
        const { emailData, priority, senderImportance, summary, categories } = analysis;
        const senderKey = emailData.sender;
        
        // Build sender profile
        if (!senderProfiles[senderKey]) {
          senderProfiles[senderKey] = {
            email: emailData.sender,
            name: emailData.senderName,
            importance: senderImportance,
            interactionCount: 0,
            lastInteraction: Date.now(),
            categories: categories || []
          };
        }
        senderProfiles[senderKey].interactionCount++;
        
        // Build priority history
        priorityHistory.push({
          emailId: Date.now() + '-' + Math.random(),
          senderEmail: emailData.sender,
          predictedPriority: priority,
          categories: categories || [],
          timestamp: Date.now()
        });
      });
      
      // Save migrated data
      await chrome.storage.local.set({ senderProfiles, priorityHistory });
      console.log('✅ Migration complete!');
    }
    
    // Build analytics from storage data
    const analytics = buildAnalytics(senderProfiles, priorityHistory, actionPatterns, allAnalyses);
    
    // Update stats
    document.getElementById('totalSenders').textContent = analytics.totalSenders;
    document.getElementById('totalEmails').textContent = analytics.totalEmails;
    document.getElementById('totalActions').textContent = analytics.totalActions;
    document.getElementById('avgPriority').textContent = analytics.avgPriority;
    
    // Render charts
    renderPriorityChart(analytics.priorityDistribution);
    renderActionChart(analytics.actionDistribution);
    renderSendersChart(analytics.topSenders);
    
    // Render tables
    renderSendersTable(analytics.topSenders);
    renderHistoryTable(analytics.recentActivity);
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('totalSenders').textContent = 'Error';
  }
}

function buildAnalytics(senderProfiles, priorityHistory, actionPatterns, allAnalyses) {
  // Convert senderProfiles object to array
  const senders = Object.values(senderProfiles);
  
  // Calculate priority distribution from allEmailAnalyses
  const priorityDistribution = { High: 0, Medium: 0, Low: 0 };
  allAnalyses.forEach(analysis => {
    const priority = analysis.priority || 'Medium';
    priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
  });
  
  // Calculate action distribution
  const actionDistribution = {};
  actionPatterns.forEach(action => {
    actionDistribution[action.actionType] = (actionDistribution[action.actionType] || 0) + 1;
  });
  
  // Get top senders
  const topSenders = senders
    .sort((a, b) => b.interactionCount - a.interactionCount)
    .slice(0, 10);
  
  // Calculate stats
  const totalSenders = senders.length;
  const totalEmails = allAnalyses.length;
  const totalActions = Object.values(actionDistribution).reduce((a, b) => a + b, 0);
  
  // Calculate average priority
  const priorityValues = { High: 3, Medium: 2, Low: 1 };
  const totalPriority = Object.entries(priorityDistribution)
    .reduce((sum, [priority, count]) => sum + (priorityValues[priority] || 0) * count, 0);
  const totalCount = Object.values(priorityDistribution).reduce((a, b) => a + b, 0);
  const avgPriority = totalCount > 0 ? (totalPriority / totalCount).toFixed(1) : '-';
  
  return {
    totalSenders,
    totalEmails,
    totalActions,
    avgPriority,
    priorityDistribution,
    actionDistribution,
    topSenders,
    recentActivity: priorityHistory.slice(0, 10)
  };
}

function renderPriorityChart(distribution) {
  const ctx = document.getElementById('priorityChart');
  
  if (charts.priority) {
    charts.priority.destroy();
  }
  
  const high = distribution.High || 0;
  const medium = distribution.Medium || 0;
  const low = distribution.Low || 0;
  const hasData = high + medium + low > 0;
  
  charts.priority = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: hasData ? ['High Priority', 'Medium Priority', 'Low Priority'] : ['No Data'],
      datasets: [{
        data: hasData ? [high, medium, low] : [1],
        backgroundColor: hasData ? ['#ef4444', '#f59e0b', '#10b981'] : ['#e5e7eb'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          enabled: hasData
        }
      }
    }
  });
}

function renderActionChart(distribution) {
  const ctx = document.getElementById('actionChart');
  
  if (charts.action) {
    charts.action.destroy();
  }
  
  const labels = Object.keys(distribution);
  const data = Object.values(distribution);
  const hasData = data.length > 0;
  
  charts.action = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hasData ? labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)) : ['No Actions'],
      datasets: [{
        label: 'Actions',
        data: hasData ? data : [0],
        backgroundColor: hasData ? '#667eea' : '#e5e7eb',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: hasData
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderSendersChart(senders) {
  const ctx = document.getElementById('sendersChart');
  
  if (charts.senders) {
    charts.senders.destroy();
  }
  
  const top10 = senders.slice(0, 10);
  const hasData = top10.length > 0;
  
  charts.senders = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hasData ? top10.map(s => s.name || s.email.split('@')[0]) : ['No Senders'],
      datasets: [{
        label: 'Interactions',
        data: hasData ? top10.map(s => s.interactionCount) : [0],
        backgroundColor: hasData ? '#764ba2' : '#e5e7eb',
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: hasData
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderSendersTable(senders) {
  const tbody = document.getElementById('sendersTableBody');
  tbody.innerHTML = '';
  
  if (senders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">No sender data available</td></tr>';
    return;
  }
  
  senders.forEach(sender => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="sender-info">
          <div class="sender-name">${sender.name || sender.email}</div>
          <div class="sender-email">${sender.email}</div>
        </div>
      </td>
      <td><span class="badge badge-${sender.importance.toLowerCase()}">${sender.importance}</span></td>
      <td>${sender.interactionCount}</td>
      <td>${formatDate(sender.lastInteraction)}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderHistoryTable(history) {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';
  
  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">No history available</td></tr>';
    return;
  }
  
  history.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.senderEmail}</td>
      <td><span class="badge badge-${item.predictedPriority.toLowerCase()}">${item.predictedPriority}</span></td>
      <td>
        <div class="tags">
          ${(item.categories || []).slice(0, 3).map(cat => `<span class="tag">${cat}</span>`).join('')}
        </div>
      </td>
      <td>${formatDate(item.timestamp)}</td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
