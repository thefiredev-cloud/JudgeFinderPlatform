const fs = require('fs');
const path = require('path');

// SVG template for the icon (scales of justice)
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Scales of Justice -->
    <g transform="scale(${size/256})">
      <!-- Base -->
      <rect x="-60" y="90" width="120" height="10" fill="white"/>
      <rect x="-10" y="80" width="20" height="10" fill="white"/>
      
      <!-- Vertical pole -->
      <rect x="-3" y="-80" width="6" height="160" fill="white"/>
      
      <!-- Horizontal beam -->
      <rect x="-80" y="-80" width="160" height="6" fill="white"/>
      
      <!-- Left scale -->
      <rect x="-78" y="-80" width="3" height="40" fill="white"/>
      <path d="M -90 -40 L -66 -40 L -70 -20 L -86 -20 Z" fill="white"/>
      
      <!-- Right scale -->
      <rect x="75" y="-80" width="3" height="40" fill="white"/>
      <path d="M 66 -40 L 90 -40 L 86 -20 L 70 -20 Z" fill="white"/>
      
      <!-- JF text -->
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">JF</text>
    </g>
  </g>
</svg>
`;

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate each icon size
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Also create a favicon.svg
const faviconSvg = createSVG(32);
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSvg);
console.log(`Created ${faviconPath}`);

console.log('\nPWA icons generated successfully!');
console.log('Note: These are SVG files. For better compatibility, you may want to convert them to PNG.');