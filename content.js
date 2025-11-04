// Content script that runs on Google search result pages

(function() {
  'use strict';

  // Extract the search query from the Google search page
  function getSearchQuery() {
    // Try to get query from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (query) {
      return query.trim();
    }

    // Fallback: try to get from search input field
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput && searchInput.value) {
      return searchInput.value.trim();
    }

    return null;
  }

  // Build Grokipedia URL for the search query
  function buildGrokipediaUrl(query) {
    // Grokipedia search URL format: https://grokipedia.com/search?q=query
    const encodedQuery = encodeURIComponent(query);
    return `https://grokipedia.com/search?q=${encodedQuery}`;
  }

  // Fetch the first result from Grokipedia via background script
  async function fetchGrokipediaResult(query) {
    try {
      const url = buildGrokipediaUrl(query);

      // Send message to background script to fetch (bypasses CORS)
      const response = await chrome.runtime.sendMessage({
        action: 'fetchGrokipedia',
        url: url,
        query: query
      });

      if (response.success && response.data) {
        const data = response.data;

        // Use the article URL if found, otherwise use search URL
        const finalUrl = data.articleUrl || url;

        // Use extracted data or fallback to query
        return {
          title: data.title || query,
          description: data.description || 'Click to view the full article on Grokipedia',
          url: finalUrl,
          found: data.found
        };
      } else {
        // If fetch failed, return basic info
        return {
          title: query,
          description: 'Search this topic on Grokipedia, powered by Grok AI',
          url,
          found: false
        };
      }

    } catch (error) {
      return {
        title: query,
        description: 'Search this topic on Grokipedia, powered by Grok AI',
        url: buildGrokipediaUrl(query),
        found: false
      };
    }
  }

  // Create and inject the Grokipedia link element
  async function injectGrokipediaLink(query) {
    // Check if already injected
    if (document.getElementById('grokipedia-search-link')) {
      return;
    }

    // Find the container where Google shows search results
    // Google's search results are typically in #search or #rso
    const searchContainer = document.querySelector('#search') || document.querySelector('#rso');

    if (!searchContainer) return;

    // Create the Grokipedia link container with loading state
    const grokipediaContainer = document.createElement('div');
    grokipediaContainer.id = 'grokipedia-search-link';
    grokipediaContainer.className = 'grokipedia-container';

    // Show loading state initially
    grokipediaContainer.innerHTML = `
      <div class="grokipedia-card">
        <div class="grokipedia-header">
          <svg class="grokipedia-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="grokipedia-title">Grokipedia</span>
        </div>
        <div class="grokipedia-content">
          <div class="grokipedia-loading">
            <span class="grokipedia-loading-text">Loading result...</span>
          </div>
        </div>
      </div>
    `;

    // Insert at the top of search results
    searchContainer.parentNode.insertBefore(grokipediaContainer, searchContainer);

    // Fetch the Grokipedia result
    const result = await fetchGrokipediaResult(query);

    // Update with the actual result
    const contentDiv = grokipediaContainer.querySelector('.grokipedia-content');

    // Create description HTML with expand functionality
    const descriptionId = 'grokipedia-desc-' + Date.now();
    const expandBtnId = 'grokipedia-expand-' + Date.now();

    // Check if this is a search results fallback (no real description)
    const isSearchFallback = result.description === 'Search results on Grokipedia';

    if (isSearchFallback) {
      // Simple compact layout for search results
      contentDiv.innerHTML = `
        <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="grokipedia-link">
          <div class="grokipedia-link-content">
            <span class="grokipedia-link-title">${escapeHtml(result.title)}</span>
            <span class="grokipedia-link-description">${escapeHtml(result.description)}</span>
          </div>
          <svg class="grokipedia-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      `;
    } else {
      // Full layout with expandable description for article pages
      // Split on any line breaks and wrap each paragraph
      const paragraphs = result.description.split(/\n+/).filter(p => p.trim().length > 0);
      const descriptionHtml = paragraphs.map(p => {
        const escapedText = escapeHtml(p.trim());
        return `<p>${escapedText}</p>`;
      }).join('');

      contentDiv.innerHTML = `
        <div class="grokipedia-result">
          <div class="grokipedia-result-header">
            <span class="grokipedia-link-title">${escapeHtml(result.title)}</span>
          </div>
          <div class="grokipedia-description-container">
            <div id="${descriptionId}" class="grokipedia-description collapsed">
              ${descriptionHtml}
            </div>
            <button id="${expandBtnId}" class="grokipedia-expand-btn">
              <span class="expand-text">Show more</span>
              <svg class="expand-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9L12 16L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="grokipedia-read-more">
            Read full article on Grokipedia
            <svg class="grokipedia-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      `;

      // Add expand/collapse functionality
      const expandBtn = document.getElementById(expandBtnId);
      const descriptionDiv = document.getElementById(descriptionId);

      expandBtn.addEventListener('click', () => {
        const isCollapsed = descriptionDiv.classList.contains('collapsed');

        if (isCollapsed) {
          descriptionDiv.classList.remove('collapsed');
          descriptionDiv.classList.add('expanded');
          expandBtn.querySelector('.expand-text').textContent = 'Show less';
          expandBtn.classList.add('expanded');
        } else {
          descriptionDiv.classList.remove('expanded');
          descriptionDiv.classList.add('collapsed');
          expandBtn.querySelector('.expand-text').textContent = 'Show more';
          expandBtn.classList.remove('expanded');
        }
      });
    }
  }

  // Helper function to escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Main function to initialize the extension
  function init() {
    const query = getSearchQuery();
    if (!query) return;
    injectGrokipediaLink(query);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Watch for dynamic content changes (Google uses SPA navigation)
  const observer = new MutationObserver((mutations) => {
    // Check if URL changed (for SPA navigation)
    const query = getSearchQuery();
    if (query && !document.getElementById('grokipedia-search-link')) {
      setTimeout(init, 100); // Small delay to ensure DOM is ready
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
