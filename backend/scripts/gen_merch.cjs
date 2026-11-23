const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.resolve(__dirname, '../../frontend/public/images/merch');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const items = [
  {
    filename: 'tee.png',
    accent: '#24C6F5',
    svgIcon: '<path d="M260 280 L350 200 L450 200 L540 280 L500 340 L450 300 L450 720 L350 720 L350 300 L300 340 Z" fill="none" stroke="#24C6F5" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/><path d="M350 200 Q400 250 450 200" fill="none" stroke="#24C6F5" stroke-width="16" stroke-linecap="round" opacity="0.85"/>'
  },
  {
    filename: 'hoodie.png',
    accent: '#9D26FF',
    svgIcon: '<path d="M260 310 L340 220 Q400 170 460 220 L540 310 L490 360 L450 330 L450 730 L350 730 L350 330 L310 360 Z" fill="none" stroke="#9D26FF" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/><path d="M360 230 Q400 300 440 230" fill="none" stroke="#9D26FF" stroke-width="14" stroke-linecap="round" opacity="0.85"/><rect x="350" y="500" width="100" height="100" rx="12" fill="none" stroke="#9D26FF" stroke-width="12" stroke-linejoin="round" opacity="0.6"/>'
  },
  {
    filename: 'tote.png',
    accent: '#24C6F5',
    svgIcon: '<path d="M340 360 L340 230 Q400 170 460 230 L460 360" fill="none" stroke="#24C6F5" stroke-width="16" stroke-linecap="round" opacity="0.85"/><rect x="270" y="360" width="260" height="360" rx="24" fill="none" stroke="#24C6F5" stroke-width="16" stroke-linejoin="round" opacity="0.85"/><line x1="270" y1="440" x2="530" y2="440" stroke="#24C6F5" stroke-width="12" opacity="0.5"/>'
  },
  {
    filename: 'keychain.png',
    accent: '#9D26FF',
    svgIcon: '<circle cx="400" cy="270" r="60" fill="none" stroke="#9D26FF" stroke-width="16" opacity="0.85"/><circle cx="400" cy="370" r="18" fill="none" stroke="#9D26FF" stroke-width="12" opacity="0.85"/><rect x="330" y="420" width="140" height="260" rx="20" fill="none" stroke="#9D26FF" stroke-width="16" stroke-linejoin="round" opacity="0.85"/><polygon points="400,480 415,515 450,520 425,545 432,580 400,560 368,580 375,545 350,520 385,515" fill="none" stroke="#9D26FF" stroke-width="10" opacity="0.7"/>'
  }
];

(async () => {
  for (const item of items) {
    const svg = `<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="${item.accent}" stop-opacity="0.14"/>
          <stop offset="65%" stop-color="#090D18" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#05070E" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#glow)"/>
      <g>
        ${item.svgIcon}
      </g>
    </svg>`;

    const outPath = path.join(outputDir, item.filename);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log('Successfully generated clean placeholder:', item.filename);
  }
})();
