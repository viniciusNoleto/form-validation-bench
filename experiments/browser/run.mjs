// Verificação em navegador real (seção 8.4): a variante assíncrona do Vue (WC) produz, em jsdom,
// atualizações do campo sem a mensagem. Aqui se conta se esse estado chega a um quadro pintado.
// Uso: npm run browser  (gera experiments/browser/dist, serve e abre no Chromium do Playwright)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { chromium } from 'playwright';
import { writeRun } from '../../benchmarks/shared/runs.mjs';

const root = path.dirname(new URL(import.meta.url).pathname);
await build({ configFile: path.join(root, 'vite.config.mjs'), logLevel: 'warn' });
const dist = path.join(root, 'dist');
const server = http.createServer((req, res) => {
  const file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(dist) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const port = server.address().port;

const TEXT = 'fulano.de.tal@exemplo.com'; // 25 teclas, as mesmas das contagens da seção 8
const REPS = Number(process.env.BROWSER_REPS ?? 5);
// channel 'chromium': o Chromium completo no modo headless novo, e não o chromium-headless-shell
const browser = await chromium.launch({ channel: 'chromium' });
const version = browser.version();
const results = [];
for (let r = 0; r < REPS; r++) for (const variant of ['W', 'WC']) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/?variant=${variant}`);
  const input = page.locator('input[aria-label="f0"]');
  await input.click();
  await page.evaluate(() => window.__probe.start());
  for (const ch of TEXT) { await page.keyboard.type(ch); await page.waitForTimeout(250); }
  results.push({ rep: r + 1, ...(await page.evaluate(() => window.__probe.stop())) });
  await page.close();
}
await browser.close();
server.close();
console.table(results);
console.log('gravado em', writeRun('browser', { browser: version, method: `Chromium ${version} via Playwright, channel chromium (headless novo); 25 teclas a cada 250 ms no campo f0; domFlickers = MutationObserver; paintedFlickers = amostra por requestAnimationFrame (indicador do quadro, não a pintura em si)`, results }));
