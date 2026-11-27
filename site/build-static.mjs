import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const source = new URL('./public/', import.meta.url);
const output = new URL('../dist/static/', import.meta.url);
const files = [
  'site.css', 'site.js', 'event.js', 'course.js',
  'assets/gsap.min.js', 'assets/ScrollTrigger.min.js',
  'assets/fonts/InstrumentSerif-Italic.ttf',
  'assets/brand-wave.png', 'assets/event-2026-11-22.jpg',
  'assets/work-racer.jpg', 'assets/work-solar-system.jpg',
  'assets/work-word-cards.jpg', 'assets/work-soon.svg',
  'assets/wecom-card.jpg', 'assets/shipinhao-card.jpg',
  'components/card-swap/card-swap.min.js',
  'components/ascii-sharks/bundle.js', 'components/deep-agent/bundle.js',
  'components/blue-glass/bundle.js',
];

const scriptVersions = new Map();
for (const path of files) {
  const from = new URL(path, source);
  const to = new URL(path, output);
  await mkdir(new URL('.', to), { recursive: true });
  await copyFile(from, to);
  if (/\.(css|js)$/.test(path)) {
    const version = createHash('sha256').update(await readFile(from)).digest('hex').slice(0, 12);
    scriptVersions.set(path, version);
  }
}

for (const path of ['index.html', 'event.html']) {
  const html = (await readFile(new URL(path, source), 'utf8'))
    .replace('<html lang="zh-CN">', '<html lang="zh-CN" data-static-hosting>')
    .replace(/"\.\/([\w./-]+\.(?:css|js))"/g, (_, asset) => '"./' + asset + '?v=' + scriptVersions.get(asset) + '"');
  await writeFile(new URL(path, output), html);
}
await writeFile(new URL('.nojekyll', output), '');
