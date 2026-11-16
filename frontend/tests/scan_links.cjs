const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') walk(p, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(p);
    }
  });
  return fileList;
}

const links = new Set();
const navs = new Set();

walk('frontend/src').forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const linkMatches = content.matchAll(/to=["']([^"']+)["']/g);
  for (const m of linkMatches) links.add(m[1] + ' (in ' + path.basename(file) + ')');
  const navMatches = content.matchAll(/navigate\(["']([^"']+)["']/g);
  for (const m of navMatches) navs.add(m[1] + ' (in ' + path.basename(file) + ')');
});

console.log('--- LINKS ---');
Array.from(links).sort().forEach(l => console.log(l));
console.log('--- NAVIGATES ---');
Array.from(navs).sort().forEach(n => console.log(n));

