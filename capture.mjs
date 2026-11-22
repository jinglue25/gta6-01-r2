import { chromium } from '/home/hatch/workspace/makefun/tools/pw/node_modules/playwright-core/index.mjs';
import { createServer } from 'node:http';
import { readFile, readdir, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const game = await realpath(join(root, 'game'));
const shots = JSON.parse(await readFile(join(root, 'shots.json'), 'utf8'));
const screenshots = join(root, 'screenshots');
const browserRoot = '/home/hatch/workspace/makefun/tools/pw/browsers';
async function findChrome(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isFile() && entry.name === 'chrome-headless-shell') return path;
    if (entry.isDirectory()) {
      const found = await findChrome(path);
      if (found) return found;
    }
  }
}
const executablePath = await findChrome(browserRoot);
if (!executablePath) throw new Error(`chrome-headless-shell not found in ${browserRoot}`);
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const path = await realpath(resolve(game, '.' + pathname));
    if (!path.startsWith(game + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!(await stat(path)).isFile()) throw new Error('Not a file');
    const body = await readFile(path);
    response.writeHead(200, {
      'content-type': mime[extname(path)] || 'application/octet-stream',
      'content-length': body.length, 'cache-control': 'no-store',
    }).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  await mkdir(screenshots, { recursive: true });
  for (const { name, query } of shots) {
    if (typeof name !== 'string' || basename(name) !== name || !name.endsWith('.jpg')) {
      throw new Error(`Invalid screenshot name: ${name}`);
    }
    const url = new URL(query, origin + '/');
    if (url.origin !== origin || url.pathname !== '/') throw new Error(`Invalid shot query: ${query}`);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, serviceWorkers: 'block',
    });
    try {
      await context.route('**/*', route => {
        const target = new URL(route.request().url());
        return target.origin === origin ? route.continue() : route.abort('blockedbyclient');
      });
      const page = await context.newPage();
      page.on('pageerror', error => console.error(`[${name}] ${error.message}`));
      await page.goto(url.href, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => window.__shotReady === true, { }, { timeout: 30000 });
      let captured = false;
      for (const quality of [82, 79, 76, 73, 70]) {
        const jpeg = await page.screenshot({ type: 'jpeg', quality });
        if (jpeg.length > 256 * 1024) continue;
        const destination = join(screenshots, name);
        await writeFile(destination, jpeg);
        console.log(`${name}: ${(await stat(destination)).size} bytes (quality ${quality})`);
        captured = true;
        break;
      }
      if (!captured) throw new Error(`${name} exceeds 256 KiB even at JPEG quality 70`);
    } finally {
      await context.close();
    }
  }
} finally {
  try { await browser?.close(); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
