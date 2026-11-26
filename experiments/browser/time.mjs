// Tempo por tecla num navegador real (seção 8.8 do artigo): os contrastes citados no Resumo, medidos
// no Chromium em vez do jsdom. Cada tarefa abre a página de uma variante, digita as mesmas 54 teclas
// do roteiro em jsdom no campo f0 (uma a cada 250 ms) e lê, pelo protocolo de depuração do Chromium
// (Performance.getMetrics), o tempo de CPU da thread principal da página (TaskDuration: script,
// estilo, layout e pintura) gasto durante a digitação, dividido pelo número de teclas.
// Cinco repetições; em cada uma, todas as tarefas em ordem sorteada; uma rodada de aquecimento antes.
// Uso: npm run browser:time
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { chromium } from 'playwright';
import { RUN, shuffled, writeRun } from '../../benchmarks/shared/runs.mjs';

const root = path.dirname(new URL(import.meta.url).pathname);
await build({ configFile: path.join(root, 'vite.config.mjs'), logLevel: 'warn' });
const dist = path.join(root, 'dist');
const server = http.createServer((req, res) => {
  const file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(dist) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const port = server.address().port;

const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br'; // 54 teclas, as do roteiro em jsdom
const INTERVAL = 250;
const REPS = Number(process.env.BROWSER_REPS ?? 5);
const TASKS = [
  ...['H', 'B0', 'B', 'C0', 'C'].map((variant) => ({ fw: 'react', variant, n: 20 })),
  ...['H', 'W', 'WC', 'WCS', 'WA'].map((variant) => ({ fw: 'vue', variant, n: 20 })),
  ...['H', 'W', 'O', 'OP'].map((variant) => ({ fw: 'vue', variant, n: 500 })),
].filter((t) => !process.env.BROWSER_ONLY || process.env.BROWSER_ONLY.split(',').includes(`${t.fw}/${t.variant}@${t.n}`));
const id = (t) => `${t.fw}/${t.variant}@${t.n}`;

// channel 'chromium': o Chromium completo no modo headless novo (o mesmo navegador, sem janela),
// e não o chromium-headless-shell
const browser = await chromium.launch({ channel: 'chromium' });
async function measure(t) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  await page.goto(`http://localhost:${port}/time.html?fw=${t.fw}&variant=${t.variant}&n=${t.n}`);
  await page.waitForFunction(() => window.__ready === true);
  const input = page.locator('input[aria-label="f0"]');
  await input.click();
  await page.waitForTimeout(500);
  const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const before = await metric();
  for (const ch of LONG) { await page.keyboard.type(ch); await page.waitForTimeout(INTERVAL); }
  await page.waitForTimeout(300);
  const after = await metric();
  const alert = await page.evaluate(() => window.__alert());
  await page.close();
  if (t.variant !== 'H' && alert !== null) throw new Error(`${id(t)}: o e-mail final é válido, mas o campo exibe "${alert}"`);
  const per = (k) => +((after[k] - before[k]) * 1e6 / LONG.length).toFixed(1);
  return { task: id(t), ...t, usPerKey: per('TaskDuration'), scriptUsPerKey: per('ScriptDuration'), layoutUsPerKey: per('LayoutDuration'), styleUsPerKey: per('RecalcStyleDuration') };
}

for (const t of TASKS) await measure(t); // aquecimento
const results = [];
for (let r = 0; r < REPS; r++) for (const t of shuffled(TASKS, RUN * 1000 + r)) {
  const m = await measure(t);
  results.push({ rep: r + 1, ...m });
  console.log(r + 1, m.task, m.usPerKey);
}
const version = browser.version();
await browser.close();
server.close();
console.log('gravado em', writeRun('browser-time', {
  method: `Chromium ${version} via Playwright, channel chromium (headless novo); 54 teclas a cada ${INTERVAL} ms no campo f0; usPerKey = TaskDuration da thread principal (CDP Performance.getMetrics) durante a digitação ÷ 54; build de produção`,
  browser: version, results,
}));
