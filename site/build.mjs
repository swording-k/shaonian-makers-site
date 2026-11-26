import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const source = new URL('./public/', import.meta.url);
const output = new URL('../dist/server/', import.meta.url);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

const assets = {};
async function include(folder, prefix = '') {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    const key = prefix + '/' + entry.name;
    if (entry.isDirectory()) {
      await include(path, key);
      continue;
    }
    const type = types[extname(path)];
    if (!type) throw new Error('Unknown asset type: ' + path);
    const binary = type.startsWith('image/') && !type.includes('svg');
    const bytes = await readFile(path);
    assets[key] = { type, binary, contents: bytes.toString(binary ? 'base64' : 'utf8') };
  }
}

await include(decodeURIComponent(source.pathname));
await mkdir(output, { recursive: true });
const worker = await readFile(new URL('./src/worker.mjs', import.meta.url), 'utf8');
const compiled = worker.replace("import { assets } from './assets.mjs';", 'const assets = ' + JSON.stringify(assets) + ';');
await writeFile(new URL('index.js', output), compiled);
