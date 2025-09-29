

class BaselinePopup {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    this.results = document.getElementById('results');
    this.loadingState = document.getElementById('loadingState');
    this.noResults = document.getElementById('noResults');
    this.detectedFeatures = document.getElementById('detectedFeatures');
    this.detectedCount = document.getElementById('detectedCount');
    
    this.init();
  }

  init() {
    // Set up event listeners
    this.searchButton.addEventListener('click', () => this.handleSearch());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });

    // Check for pending search from context menu
    this.checkPendingSearch();

    // Load detected features from current page
    this.loadDetectedFeatures();
    
    // Load some default features
    this.searchFeatures('baseline_status:newly', false);
  }

  async checkPendingSearch() {
    try {
      const result = await chrome.storage.session.get('pendingSearch');
      if (result.pendingSearch) {
        this.searchInput.value = result.pendingSearch;
        this.handleSearch();
        // Clear the pending search
        chrome.storage.session.remove('pendingSearch');
      }
    } catch (error) {
      console.log('Error checking pending search:', error);
    }
  }

  async loadDetectedFeatures() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      chrome.tabs.sendMessage(tab.id, {type: 'GET_DETECTED_FEATURES'}, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not ready:', chrome.runtime.lastError);
          this.detectedFeatures.style.display = 'none';
          return;
        }
        
        if (response && response.features && response.features.length > 0) {
          this.displayDetectedFeatures(response.features);
        } else {
          this.detectedFeatures.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error loading detected features:', error);
      this.detectedFeatures.style.display = 'none';
    }
  }

  displayDetectedFeatures(features) {
    this.detectedFeatures.style.display = 'block';
    
    const uniqueFeatures = [...new Map(features.map(f => [f.id, f])).values()];
    this.detectedCount.innerHTML = `
      <strong>${uniqueFeatures.length}</strong> unique features found:
      <div style="margin-top: 4px;">
        ${uniqueFeatures.slice(0, 3).map(f => 
          `<span style="background: #fff; padding: 2px 6px; border-radius: 3px; margin: 0 2px; font-size: 11px;">${f.name || f.id}</span>`
        ).join('')}
        ${uniqueFeatures.length > 3 ? `<span style="color: #0056b3;">+${uniqueFeatures.length - 3} more</span>` : ''}
      </div>
    `;
  }

  handleSearch() {
    const query = this.searchInput.value.trim();
    if (query) {
      this.searchFeatures(`name:${query} OR id:${query}`, true);
    }
  }

  async searchFeatures(query, isUserSearch = false) {
    this.showLoading();
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://api.webstatus.dev/v1/features?q=${encodedQuery}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      this.displayResults(result.data || [], isUserSearch);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to search features. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    this.loadingState.style.display = 'block';
    this.results.style.display = 'none';
    this.noResults.style.display = 'none';
  }

  hideLoading() {
    this.loadingState.style.display = 'none';
  }

  displayResults(features, isUserSearch) {
    if (features.length === 0) {
      this.showNoResults();
      return;
    }

    this.results.style.display = 'block';
    this.noResults.style.display = 'none';
    
    // Limit results to prevent popup from being too long
    const limitedFeatures = features.slice(0, 8);
    
    this.results.innerHTML = limitedFeatures.map(feature => this.createFeatureCard(feature)).join('');
    
    // Add "showing X of Y" message if there are more results
    if (features.length > 8) {
      const moreMessage = document.createElement('div');
      moreMessage.style.textAlign = 'center';
      moreMessage.style.padding = '12px';
      moreMessage.style.color = '#6c757d';
      moreMessage.style.fontSize = '12px';
      moreMessage.innerHTML = `Showing ${limitedFeatures.length} of ${features.length} results`;
      this.results.appendChild(moreMessage);
    }
  }

  createFeatureCard(feature) {
    const status = feature.baseline?.status || 'limited';
    const statusClass = `status-${status}`;
    
    const statusLabels = {
      'widely': 'Widely Available',
      'newly': 'Newly Available', 
      'limited': 'Limited Support'
    };

    const descriptions = {
      'widely': 'Safe to use across all modern browsers',
      'newly': 'Available in latest browsers, consider polyfills',
      'limited': 'Limited browser support - use with caution'
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const specLinks = feature.spec?.links?.slice(0, 2).map(link => {
      try {
        const hostname = new URL(link).hostname;
        return `<a href="${link}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 11px;">📋 ${hostname}</a>`;
      } catch {
        return '';
      }
    }).filter(Boolean).join(' ');

    return `
      <div class="feature-card">
        <div class="feature-header">
          <div style="flex: 1;">
            <h3 class="feature-name">${feature.name || 'Unknown Feature'}</h3>
            <div class="feature-id">${feature.feature_id || 'unknown'}</div>
            <div class="status-badge ${statusClass}">
              ${statusLabels[status]}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 12px; font-size: 12px; color: #6c757d;">
          ${descriptions[status]}
        </div>
        
        ${feature.baseline?.low_date ? `
          <div style="margin-top: 8px; font-size: 11px; color: #6c757d;">
            📅 Baseline Newly: ${formatDate(feature.baseline.low_date)}
          </div>
        ` : ''}
        
        ${feature.baseline?.high_date ? `
          <div style="margin-top: 4px; font-size: 11px; color: #6c757d;">
            📅 Baseline Widely: ${formatDate(feature.baseline.high_date)}
          </div>
        ` : ''}
        
        ${specLinks ? `
          <div style="margin-top: 8px;">
            ${specLinks}
          </div>
        ` : ''}
      </div>
    `;
  }

  showNoResults() {
    this.results.style.display = 'none';
    this.noResults.style.display = 'block';
  }

  showError(message) {
    this.results.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #dc3545;">
        <div>⚠️ Error</div>
        <div style="font-size: 12px; margin-top: 8px;">${message}</div>
      </div>
    `;
    this.results.style.display = 'block';
    this.noResults.style.display = 'none';
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BaselinePopup();
});