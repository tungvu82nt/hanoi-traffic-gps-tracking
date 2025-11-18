#!/usr/bin/env node

// Build script cho Netlify
console.log('🚀 Building for Netlify...');

// Copy static files to dist folder
const fs = require('fs');
const path = require('path');

// Tạo thư mục dist nếu chưa có
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy public folder to dist
const publicDir = path.join(__dirname, 'public');
const distPublicDir = path.join(distDir, 'public');

if (fs.existsSync(publicDir)) {
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  
  // Copy all files from public to dist/public
  fs.readdirSync(publicDir).forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distPublicDir, file);
    fs.copyFileSync(srcPath, destPath);
  });
  
  console.log('✅ Static files copied to dist/public');
}

console.log('✅ Build completed successfully!');