// Executa todos os benchmarks três vezes (RUN=1..3), arquiva cada execução em results/runs/
// e gera results/summary.{json,md}. Uso: npm run bench:runs  (ou RUNS=5 npm run bench:runs)
import { execSync } from 'node:child_process';

const RUNS = Number(process.env.RUNS ?? 3);
const STEPS = ['bench:schema', 'bench:types', 'bench:react', 'bench:vue', 'bench:angular'];
for (let run = 1; run <= RUNS; run++) {
  for (const step of STEPS) {
    console.log(`\n=== execução ${run}/${RUNS}: ${step} ===`);
    execSync(`npm run ${step}`, { stdio: 'inherit', env: { ...process.env, RUN: String(run) } });
  }
}
execSync('npm run bench:summary', { stdio: 'inherit' });
