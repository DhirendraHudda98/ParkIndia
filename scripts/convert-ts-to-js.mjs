import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';

const ROOT = process.cwd();
const IGNORES = ['node_modules', 'vendor', 'dist', 'public', '.git', 'parkhub-web/node_modules', 'parkhub-web/dist'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (IGNORES.some((i) => full.includes(path.join(ROOT, i)))) continue;
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      files.push(full);
    }
  }
  return files;
}

function transpile(source, fileName) {
  const isTsx = fileName.endsWith('.tsx');
  const res = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowJs: true,
    },
    fileName,
  });
  return res.outputText;
}

(async () => {
  try {
    const files = await walk(ROOT);
    if (files.length === 0) {
      console.log('No .ts/.tsx files found to convert.');
      return;
    }
    const skipped = [];
    for (const f of files) {
      try {
        const src = await fs.readFile(f, 'utf8');
        const out = transpile(src, f);
        const ext = f.endsWith('.tsx') ? '.jsx' : '.js';
        const outPath = f.slice(0, -path.extname(f).length) + ext;
        await fs.writeFile(outPath, out, 'utf8');
        await fs.unlink(f);
        console.log('Converted', f, '→', outPath);
      } catch (err) {
        console.error('Skipping', f, 'due to transpile error:', err && err.message ? err.message : err);
        skipped.push(f);
      }
    }
    console.log('Conversion complete.');
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
})();
