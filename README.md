# Grokipedia Lens for Google Search

A Chrome extension that automatically displays Grokipedia article summaries at the top of Google search results.

## Features

- **Automatic Integration** - Seamlessly appears above Google search results
- **Article Summaries** - Shows full article descriptions with expandable text
- **Smart Extraction** - Fetches article content from Grokipedia dynamically
- **Beautiful UI** - Modern blue gradient design matching Grok's branding
- **Responsive Layout** - Works across desktop and mobile views
- **Multi-Domain Support** - Works on Google.com, Google.co.uk, Google.ca, and more
- **Dynamic Content** - Handles Google's SPA navigation

## Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `grokipediagoogle` folder
5. The extension is now installed and will automatically work on Google search pages

### From Chrome Web Store

Coming soon!

## How It Works

1. The extension detects when you perform a Google search
2. It opens Grokipedia in a background tab to find matching articles
3. It extracts the article title and description
4. It displays a beautiful card above your Google results with:
   - Article title
   - Full description (expandable if long)
   - Link to read more on Grokipedia

## Technical Architecture

### Three-Part System

1. **Content Script** ([content.js](content.js))

   - Runs on Google search pages
   - Extracts search query from URL or input field
   - Injects the Grokipedia card into the page
   - Handles expand/collapse functionality

2. **Background Service Worker** ([background.js](background.js))

   - Creates hidden tabs to load Grokipedia pages
   - Extracts article titles from search results
   - Navigates to article pages and extracts descriptions
   - Handles all text between h1 heading and first h2/h3
   - Cleans up background tabs automatically

3. **Styling** ([styles.css](styles.css))
   - Blue/orange gradient matching Grok branding
   - Smooth animations and transitions
   - Responsive design for mobile and desktop
   - Expandable text with fade effect

### Key Technical Details

- Uses background tabs to bypass CORS restrictions
- Injects scripts into tabs to extract dynamic content
- Polls for content to handle client-side rendering
- Constructs article URLs from titles
- Fallback to search page if article doesn't exist
- Handles frame removal errors by proper tab management
- Escapes HTML to prevent XSS vulnerabilities

## Files Structure

```
grokipediagoogle/
├── manifest.json      # Extension configuration (Manifest V3)
├── content.js         # Content script for Google pages
├── background.js      # Service worker for fetching Grokipedia
├── styles.css         # UI styling
├── icons/             # Extension icons
│   ├── icon16.png     # 16x16 toolbar icon
│   ├── icon48.png     # 48x48 management icon
│   └── icon128.png    # 128x128 store icon
└── README.md          # This file
```

## Permissions Explained

- **activeTab** - Access the current Google search page
- **scripting** - Inject content into pages to extract article data
- **tabs** - Create background tabs to fetch Grokipedia content

## Privacy

This extension:

- Does NOT collect or store any user data
- Does NOT track your searches
- Opens temporary background tabs to Grokipedia (closed automatically)
- Only communicates with Grokipedia.com and Google search pages

## Version

Current version: **0.0.2**

## License

Google Search is a trademark of Google LLC.
xAI and Grok are trademarks of xAI Corp.
This Extension is an independent project and is not affiliated with or endorsed by Google LLC, xAI Corp., or any of their products or services.

## Donation

https://paypal.me/WHartman86
