# Grokipedia for Google Search

A Chrome extension that displays Grokipedia article links at the top of Google search results.

## Features

- Automatically detects your Google search query
- Displays a prominent Grokipedia link at the top of search results
- Beautiful, modern UI with smooth animations
- Works across Google domains (.com, .co.uk, .ca, etc.)
- Supports Google's dynamic content loading

## Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `grokipediagoogle` folder
5. The extension should now be installed and active

### For Chrome Web Store Publishing

Before publishing to the Chrome Web Store, you need to:

1. **Create proper icons** - Replace the placeholder text files in the `icons/` folder with actual PNG images:

   - `icons/icon16.png` - 16x16 pixels
   - `icons/icon48.png` - 48x48 pixels
   - `icons/icon128.png` - 128x128 pixels

   Recommended: Use a purple/blue gradient design matching the extension's color scheme.

2. **Prepare store assets**:

   - Create promotional images (screenshots, promotional tiles)
   - Write a detailed description
   - Add privacy policy if collecting any data

3. **Test thoroughly**:
   - Test on different Google domains
   - Test with various search queries
   - Ensure it doesn't interfere with Google's functionality

## How It Works

1. The extension runs a content script on Google search pages
2. It extracts the search query from the URL or search input
3. It constructs a Grokipedia URL based on the query
4. It injects a styled card at the top of the search results
5. Users can click the link to view the topic on Grokipedia

## Files Structure

```
grokipediagoogle/
├── manifest.json       # Extension configuration
├── content.js         # Main script that runs on Google pages
├── styles.css         # Styling for the Grokipedia card
├── popup.html         # Extension popup UI
├── icons/             # Extension icons (you need to add PNG files)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## How It Works

The extension uses a three-part architecture:

1. **Content Script** ([content.js](content.js)) - Runs on Google search pages, extracts the search query, and displays the Grokipedia card
2. **Background Service Worker** ([background.js](background.js)) - Fetches Grokipedia pages (bypasses CORS restrictions) and extracts title/description using regex
3. **Styling** ([styles.css](styles.css)) - Beautiful purple gradient UI with animations

### Technical Details

- The content script injects a card at the top of Google search results
- It communicates with the background worker via `chrome.runtime.sendMessage()`
- The background worker fetches the Grokipedia search page and extracts content
- Uses regex parsing (not DOM) since service workers don't have DOM APIs
- Displays loading state while fetching, then updates with actual content

## TODO Before Publishing

- [ ] Create proper PNG icons (16x16, 48x48, 128x128) - See [icons/ICONS_NEEDED.txt](icons/ICONS_NEEDED.txt)
- [x] Verify the actual Grokipedia URL format is correct (uses `https://grokipedia.com/search?q=query`)
- [ ] Test on multiple Google domains (.com, .co.uk, .ca)
- [ ] Fine-tune regex patterns in background.js if needed for better content extraction
- [ ] Create Chrome Web Store screenshots
- [ ] Write privacy policy (if needed)
- [ ] Create promotional images for the store listing

## Version

Current version: 0.0.1

## License

[Add your license here]
