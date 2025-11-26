// scripts/inject-build-id.js
// This script injects a unique build ID into the service worker

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
const swPath = path.join(buildDir, 'service-worker.js');

// Generate build ID from timestamp
const buildId = `v${Date.now()}`;

// Read service worker file
if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Replace placeholder with actual build ID
  content = content.replace(
    /self\.__BUILD_ID__\s*\|\|\s*['"]v3\.0\.0['"]/g,
    `"${buildId}"`
  );
  
  // Write back
  fs.writeFileSync(swPath, content, 'utf8');
  console.log(`✅ Service worker updated with build ID: ${buildId}`);
} else {
  console.log('⚠️ Service worker not found, skipping build ID injection');
}