const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.test.jsx') || file.endsWith('.test.js')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./src');
let count = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Handle vi.mock('@phosphor-icons/react', () => ({ ... }));
  const regex = /vi\.mock\(['"]@phosphor-icons\/react['"],\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);/g;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(f, content);
    count++;
  }
});

console.log('Fixed ' + count + ' test files.');
