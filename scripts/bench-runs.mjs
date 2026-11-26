// Executa todos os benchmarks em RUNS sessões independentes (padrão 5), arquiva cada execução em
// results/runs/ e gera results/summary.{json,md}. Cada passo é um processo novo (npm run), e a ordem
// dos blocos gira a cada sessão: o bloco que roda primeiro numa sessão roda por último em outra.
// Depois das sessões, roda as duas medições no navegador real e gera o resumo.
//
// Uso: npm run bench:runs
//   RUNS=3              número de sessões (padrão 5)
//   FROM_RUN=3          retoma a partir desta sessão, com a mesma rotação de ordem (padrão 1)
//   SKIP_BROWSER=1      não roda as medições no navegador
//   STEP_TIMEOUT_MIN=30 tempo máximo de cada passo, em minutos (padrão 30; o mais longo leva ~11 min)
//
// Proteção contra travamento: cada passo roda no seu próprio grupo de processos. Se passar do limite,
// o grupo inteiro (npm, vitest e workers, Chromium) é encerrado e a rodada para com erro, em vez de
// esperar para sempre. Ctrl+C ou o encerramento do orquestrador também derruba o passo em andamento.
import { spawn } from 'node:child_process';

const RUNS = Number(process.env.RUNS ?? 5);
const FROM_RUN = Number(process.env.FROM_RUN ?? 1);
const STEP_TIMEOUT_MS = Number(process.env.STEP_TIMEOUT_MIN ?? 30) * 60_000;
const STEPS = ['bench:schema', 'bench:types', 'bench:react', 'bench:vue', 'bench:angular'];

if (!(Number.isInteger(RUNS) && RUNS >= 1 && Number.isInteger(FROM_RUN) && FROM_RUN >= 1 && FROM_RUN <= RUNS && STEP_TIMEOUT_MS > 0)) {
  console.error(`parâmetros inválidos: RUNS=${process.env.RUNS} FROM_RUN=${process.env.FROM_RUN} STEP_TIMEOUT_MIN=${process.env.STEP_TIMEOUT_MIN}`);
  process.exit(2);
}

let current = null; // processo do passo em andamento
const killGroup = (child, signal) => { try { process.kill(-child.pid, signal); } catch { /* grupo já terminou */ } };

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    if (current) { killGroup(current, 'SIGTERM'); setTimeout(() => killGroup(current, 'SIGKILL'), 5_000).unref(); }
    console.error(`\nrodada interrompida (${sig})`);
    process.exitCode = 130;
  });
}

/** Roda `npm run <step>` num grupo de processos próprio, com limite de tempo. Rejeita em erro ou estouro. */
function run(step, env = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn('npm', ['run', step], { stdio: 'inherit', detached: true, env: { ...process.env, ...env } });
    current = child;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(`\n!!! ${step} passou de ${STEP_TIMEOUT_MS / 60_000} min; encerrando o grupo de processos`);
      killGroup(child, 'SIGTERM');
      setTimeout(() => killGroup(child, 'SIGKILL'), 10_000).unref();
    }, STEP_TIMEOUT_MS);
    child.on('error', (err) => { clearTimeout(timer); current = null; reject(err); });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      current = null;
      killGroup(child, 'SIGKILL'); // não deixa órfãos (workers, navegador) depois que o npm sai
      const min = ((Date.now() - started) / 60_000).toFixed(1);
      if (timedOut) reject(new Error(`${step}: tempo esgotado após ${min} min`));
      else if (code !== 0) reject(new Error(`${step}: saiu com ${signal ?? `código ${code}`} após ${min} min`));
      else { console.log(`--- ${step}: ${min} min`); resolve(); }
    });
  });
}

try {
  for (let r = FROM_RUN; r <= RUNS; r++) {
    const k = (r - 1) % STEPS.length;
    const order = [...STEPS.slice(k), ...STEPS.slice(0, k)];
    for (const step of order) {
      console.log(`\n=== sessão ${r}/${RUNS}: ${step} (ordem: ${order.join(' → ')}) ===`);
      await run(step, { RUN: String(r), BENCH_ORDER: order.join(',') });
    }
  }
  // Navegador real: a verificação de quadros pintados (seção 8.4) e o tempo por tecla no Chromium
  // (seção 8.8), uma vez, depois das sessões, com o mesmo código.
  if (!process.env.SKIP_BROWSER) {
    for (const step of ['browser', 'browser:time']) {
      console.log(`\n=== navegador: ${step} ===`);
      await run(step, { RUN: '1' });
    }
  }
  await run('bench:summary');
  console.log('\n=== FIM OK ===');
} catch (err) {
  console.error(`\nrodada abortada: ${err.message}`);
  console.error(`para retomar: FROM_RUN=<sessão> npm run bench:runs (as sessões completas já estão em results/runs/)`);
  process.exitCode ||= 1; // mantém 130 se foi interrompido
}
