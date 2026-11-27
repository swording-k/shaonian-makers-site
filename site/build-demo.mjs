import { readFile, writeFile } from 'node:fs/promises';
const src = new URL('./public/', import.meta.url);
const read = (name) => readFile(new URL(name, src));
const text = async (name) => (await read(name)).toString();
const inlineScript = (source) => '<script>\n' + source.replace(/<\/script/gi, '<\\/script') + '\n</script>';

async function inlineAssets(value) {
  let output = value;
  for (const match of [...output.matchAll(/\.\/assets\/[\w./-]+/g)]) {
    const path = match[0].slice(2);
    try {
      const bytes = await read(path);
      const mime = path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.png') ? 'image/png' : path.endsWith('.ttf') ? 'font/ttf' : 'image/jpeg';
      output = output.replaceAll(match[0], `data:${mime};base64,${bytes.toString('base64')}`);
    } catch {
      console.error('MISSING ASSET: ' + path);
    }
  }
  return output;
}

async function buildPage(sourceName, scriptPaths, outputs) {
  const stylesheet = await inlineAssets(await text('site.css'));
  const scripts = (await Promise.all(scriptPaths.map(async (path) => inlineScript(await inlineAssets(await text(path)))))).join('\n');
  let html = (await text(sourceName))
    .replace('<html lang="zh-CN">', '<html lang="zh-CN" data-standalone-demo>')
    .replace('<link rel="stylesheet" href="./site.css">', () => '<style>\n' + stylesheet + '\n</style>')
    .replace('</body>', () => scripts + '\n</body>');

  for (const path of scriptPaths) {
    html = html.replace(`<script defer src="./${path}"></script>`, '');
  }

  if (sourceName === 'index.html') {
    const intro = inlineScript(await text('components/blue-glass/bundle.js'));
    html = html.replace('<body>', () => '<body>\n' + intro);
    const bundle = (await text('components/deep-agent/bundle.js')).replace(/<\/script/gi, '<\\/script');
    html = html.replace('</body>', () => '<script type="text/plain" id="offline-deep-agent">\n' + bundle + '\n</script>\n</body>');
  }
  html = await inlineAssets(html);
  if (sourceName === 'index.html') html = html.replaceAll('href="./event.html', 'href="./event-demo.html');

  await Promise.all(outputs.map((path) => writeFile(new URL(path, src), html)));
}

await buildPage(
  'index.html',
  ['assets/gsap.min.js', 'assets/ScrollTrigger.min.js', 'components/card-swap/card-swap.min.js', 'components/ascii-sharks/bundle.js', 'site.js'],
  ['../../preview/index.html', '../../site-demo.html'],
);
await buildPage(
  'event.html',
  ['event.js'],
  ['../../preview/event-demo.html', '../../event-demo.html'],
);
console.log('standalone pages built with all assets inlined');
