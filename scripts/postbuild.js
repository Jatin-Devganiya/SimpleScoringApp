import fs from 'fs';
import path from 'path';

const distIndexPath = path.resolve('dist', 'index.html');
const docsDir = path.resolve('docs');

if (fs.existsSync(distIndexPath)) {
  let html = fs.readFileSync(distIndexPath, 'utf8');
  // Strip out the development-only GitHub Pages redirect script so dist/docs are clean
  html = html.replace(/<!-- GITHUB_PAGES_REDIRECT_START -->[\s\S]*?<!-- GITHUB_PAGES_REDIRECT_END -->\s*/, '');
  fs.writeFileSync(distIndexPath, html);
}

// Copy dist into docs
fs.cpSync('dist', docsDir, { recursive: true });
console.log('Postbuild: Copied clean dist to docs/');
