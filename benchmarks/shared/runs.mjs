// Arquivo de cada execução de benchmark: results/runs/<nome>-<RUN>.json.
// RUN vem da variável de ambiente RUN (padrão 1). `npm run bench:runs` executa tudo três vezes.
import fs from 'node:fs';
import os from 'node:os';

export const RUN = Number(process.env.RUN ?? 1);

export function meta() {
  return {
    run: RUN,
    date: new Date().toISOString(),
    node: process.version,
    cpu: os.cpus()[0]?.model ?? 'desconhecida',
    platform: `${os.platform()} ${os.release()}`,
    order: process.env.BENCH_ORDER ?? null, // ordem dos blocos na sessão (scripts/bench-runs.mjs)
  };
}

export function writeRun(name, data) {
  fs.mkdirSync('results/runs', { recursive: true });
  const file = `results/runs/${name}-${RUN}.json`;
  fs.writeFileSync(file, JSON.stringify({ meta: meta(), ...data }, null, 2));
  return file;
}

/** Embaralhamento determinístico por semente (ordem das variantes a cada repetição). */
export function shuffled(xs, seed) {
  const out = [...xs];
  let s = seed * 2654435761 % 2 ** 32 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
export const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
