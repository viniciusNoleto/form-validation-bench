// Executa todos os benchmarks em RUNS sessões independentes (padrão 5), arquiva cada execução em
// results/runs/ e gera results/summary.{json,md}. Cada passo é um processo novo (npm run), e a ordem
// dos blocos gira a cada sessão: o bloco que roda primeiro numa sessão roda por último em outra.
// Uso: npm run bench:runs  (ou RUNS=3 npm run bench:runs)
import { execSync } from 'node:child_process';

const RUNS = Number(process.env.RUNS ?? 5);
const STEPS = ['bench:schema', 'bench:types', 'bench:react', 'bench:vue', 'bench:angular'];
for (let run = 1; run <= RUNS; run++) {
  const k = (run - 1) % STEPS.length;
  const order = [...STEPS.slice(k), ...STEPS.slice(0, k)];
  for (const step of order) {
    console.log(`\n=== sessão ${run}/${RUNS}: ${step} (ordem: ${order.join(' → ')}) ===`);
    execSync(`npm run ${step}`, { stdio: 'inherit', env: { ...process.env, RUN: String(run), BENCH_ORDER: order.join(',') } });
  }
}
execSync('npm run bench:summary', { stdio: 'inherit' });
