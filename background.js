// Background service worker for handling CORS-restricted requests

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchGrokipedia') {
    // Instead of fetching HTML, open the page in a hidden tab, let JS execute, then scrape
    fetchGrokipediaViaTab(request.url, request.query)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

async function fetchGrokipediaViaTab(url, originalQuery) {
  return new Promise((resolve, reject) => {
    let tabId = null;
    let isComplete = false;
    let timeoutId = null;

    const cleanup = () => {
      isComplete = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (tabId) {
        chrome.tabs.remove(tabId).catch(() => {
          // Tab might already be closed, ignore error
        });
      }
      chrome.tabs.onUpdated.removeListener(listener);
    };

    // Listen for the tab to finish loading
    const listener = (changedTabId, changeInfo) => {
      if (isComplete) return;

      if (changedTabId === tabId && changeInfo.status === 'complete') {

        // Inject immediately - the script will poll internally for content
        (async () => {
          if (isComplete) return;

          try {
            // Check if tab still exists
            const tabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
            const tabExists = tabs.some(t => t.id === tabId);

            if (!tabExists) {
              cleanup();
              reject(new Error('Tab was closed unexpectedly'));
              return;
            }

            let clickResults;
            try {
              // First, inject script to find the title and click the article
              clickResults = await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                // Poll for content to load - wait for spans with article data
                return new Promise((resolve) => {
                  let attempts = 0;
                  const maxAttempts = 12; // 6 seconds max (500ms * 12) - reduced to avoid timeout

                  const checkForContent = () => {
                    const main = document.querySelector('main');
                    if (!main) {
                      if (++attempts < maxAttempts) {
                        setTimeout(checkForContent, 500);
                        return;
                      }
                      resolve({ found: false, error: 'No main element found' });
                      return;
                    }

                    // Get direct div children of main
                    const divChildren = Array.from(main.children).filter(el => el.tagName === 'DIV');

                    if (divChildren.length < 3) {
                      if (++attempts < maxAttempts) {
                        setTimeout(checkForContent, 500);
                        return;
                      }
                      resolve({ found: false, error: `Only ${divChildren.length} div children in main` });
                      return;
                    }

                    const thirdDiv = divChildren[2];

                    // CRITICAL: Look for article title spans - this selector works!
                    // Format: <span class="line-clamp-1 min-w-0 flex-1 truncate font-normal text-sm">
                    //           <span class="">Title Text</span>
                    //         </span>
                    const titleSpans = thirdDiv.querySelectorAll('span.font-normal.text-sm');

                    if (titleSpans.length === 0) {
                      if (++attempts < maxAttempts) {
                        setTimeout(checkForContent, 500);
                        return;
                      }
                      resolve({
                        found: false,
                        error: 'No article title spans found after 10 seconds'
                      });
                      return;
                    }

                    // SUCCESS - found article title spans
                    const firstTitleSpan = titleSpans[0];
                    const title = firstTitleSpan.textContent.trim();

                    if (!title || title.length === 0) {
                      if (++attempts < maxAttempts) {
                        setTimeout(checkForContent, 500);
                        return;
                      }
                      resolve({ found: false, error: 'Title is empty' });
                      return;
                    }

                    // Return the title - we'll extract description from the article page
                    resolve({
                      found: true,
                      title: title,
                      clicked: false,
                      articleUrl: null // Will use title-based URL as fallback
                    });
                  };

                  // Start polling
                  checkForContent();
                });
              }
              });
            } catch (scriptError) {
              cleanup();
              resolve({
                title: null,
                description: null,
                articleUrl: null,
                found: false
              });
              return;
            }

            const clickResult = clickResults[0]?.result;

            if (!clickResult?.found) {
              cleanup();
              resolve({
                title: null,
                description: null,
                articleUrl: null,
                found: false
              });
              return;
            }

            // Construct URL from title
            const urlSlug = clickResult.title.replace(/\s+/g, '_');
            const constructedUrl = `https://grokipedia.com/page/${urlSlug}`;

            // Close the search results tab to avoid frame removal errors
            chrome.tabs.remove(tabId).catch(() => {});
            chrome.tabs.onUpdated.removeListener(listener);

            // Create a NEW tab for the article page
            chrome.tabs.create({ url: constructedUrl, active: false }, (articleTab) => {
              const articleTabId = articleTab.id;
              // Wait for navigation and check if it redirects to page-not-found
              const verifyListener = async (changedTabId, changeInfo, tab) => {
                if (changedTabId !== articleTabId || changeInfo.status !== 'complete') return;

                chrome.tabs.onUpdated.removeListener(verifyListener);

                if (tab.url && tab.url.includes('/page-not-found/')) {
                  // Page doesn't exist, fall back to search page
                  chrome.tabs.remove(articleTabId).catch(() => {});
                  const searchUrl = `https://grokipedia.com/search?q=${encodeURIComponent(originalQuery || clickResult.title)}`;
                  resolve({
                    title: originalQuery || clickResult.title,
                    description: 'Search results on Grokipedia',
                    articleUrl: searchUrl,
                    found: true
                  });
                } else {
                  // Page exists! Extract description from the article page
                  try {
                    // Wait for the page to fully render
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const descriptionResults = await chrome.scripting.executeScript({
                      target: { tabId: articleTabId },
                      func: () => {
                        // Find the h1 title
                        const h1 = document.querySelector('h1');
                        if (!h1) return null;

                        // Find the first h2 or h3 after the h1
                        const allElements = Array.from(document.querySelectorAll('h1, h2, h3'));
                        const h1Index = allElements.indexOf(h1);
                        const nextHeading = allElements.slice(h1Index + 1).find(el => el.tagName === 'H2' || el.tagName === 'H3');

                        if (!nextHeading) return null;

                        // Get all text between h1 and the next heading
                        const textParts = [];
                        let currentElement = h1.nextElementSibling;

                        while (currentElement && currentElement !== nextHeading) {
                          const text = currentElement.textContent.trim();
                          if (text && text.length > 30) {
                            textParts.push(text);
                          }
                          currentElement = currentElement.nextElementSibling;
                        }

                        return textParts.join('\n\n') || null;
                      }
                    });

                    const articleDescription = descriptionResults[0]?.result;
                    chrome.tabs.remove(articleTabId).catch(() => {});

                    resolve({
                      title: clickResult.title,
                      description: articleDescription || 'Click to read more on Grokipedia',
                      articleUrl: tab.url,
                      found: true
                    });
                  } catch (error) {
                    chrome.tabs.remove(articleTabId).catch(() => {});
                    resolve({
                      title: clickResult.title,
                      description: 'Click to read more on Grokipedia',
                      articleUrl: tab.url,
                      found: true
                    });
                  }
                }
              };

              chrome.tabs.onUpdated.addListener(verifyListener);

              // Timeout after 10 seconds if navigation doesn't complete
              setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(verifyListener);
                chrome.tabs.remove(articleTabId).catch(() => {});
                resolve({
                  title: clickResult.title,
                  description: 'Click to read more on Grokipedia',
                  articleUrl: constructedUrl,
                  found: true
                });
              }, 10000);
            });
          } catch (error) {
            cleanup();
            reject(error);
          }
        })();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Create a background tab to load the Grokipedia search page
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      if (isComplete) {
        chrome.tabs.remove(tab.id).catch(() => {});
        return;
      }

      tabId = tab.id;

      // Timeout after 20 seconds
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for page to load'));
      }, 20000);
    });
  });
}
