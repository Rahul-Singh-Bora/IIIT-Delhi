# Icon Generation Script

This script converts the SVG icon to PNG format at different sizes.

## Using ImageMagick (if installed):
```bash
cd icons
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

## Using Online Converter:
1. Open icon.svg in a browser
2. Take screenshots or use online tools like:
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
3. Generate 16x16, 48x48, and 128x128 PNG versions

## Manual Creation:
For now, you can use the SVG file directly or create simple colored squares:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)  
- icon128.png (128x128 pixels)

The extension will work with placeholder icons until you generate proper ones.
