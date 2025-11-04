# Quick Icon Creation Guide

## Option 1: Use the HTML Generator (Easiest)

1. Open `generate-icons.html` in your web browser
2. Click "Download All Icons" button
3. Move the downloaded PNG files to the `icons/` folder
4. Reload the extension in Chrome

## Option 2: Use Online Tool (Fast)

1. Go to https://favicon.io/favicon-generator/
2. Settings:
   - Text: G
   - Background: Rounded
   - Font Family: Arial
   - Font Size: 50
   - Background Color: #667eea
   - Font Color: #ffffff
3. Click "Download"
4. Extract the ZIP file
5. Rename and copy:
   - `favicon-16x16.png` → `icons/icon16.png`
   - `favicon-32x32.png` → can be used for icon48.png (rename and resize)
   - Create a 128x128 version using any image editor

## Option 3: PowerShell Script

Run this PowerShell command to download placeholder icons:

```powershell
# This will create simple colored square PNGs as placeholders
# You should replace these with proper icons later
```

## Option 4: Use Paint (Windows)

1. Open Paint
2. Resize canvas to 128x128 pixels
3. Fill with purple color (#667eea)
4. Add white text "G" in the center
5. Save as `icon128.png` in the `icons/` folder
6. Resize to 48x48 and save as `icon48.png`
7. Resize to 16x16 and save as `icon16.png`

## Temporary Solution

For testing purposes, you can temporarily remove the icons from manifest.json:
- Comment out or remove the "icons" and "action.default_icon" sections
