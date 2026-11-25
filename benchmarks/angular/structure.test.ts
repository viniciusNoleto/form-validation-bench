import { it, expect } from 'vitest';
import { LONG, TEXT, VARIANTS, mountMs, type } from './harness';
import { RUN, shuffled, writeRun } from '../shared/runs.mjs';

const REPS = Number(process.env.BENCH_REPS ?? 15);
type Run = Awaited<ReturnType<typeof type>>;
const round = (x: number) => +x.toFixed(1);
const byKey = Object.fromEntries(VARIANTS.map((v) => [v.key, v]));

/** Contagens das repetições precisam ser idênticas: o roteiro é determinístico. */
function counts(xs: Run[]) {
  for (const k of ['updates', 'formUpdates', 'validations', 'flickers'] as const) expect(new Set(xs.map((x) => x[k])).size, k).toBe(1);
  const { updates, formUpdates, validations, flickers } = xs[0];
  return { updates, formUpdates, validations, flickers, samples_us: xs.map((x) => round(x.usPerKey)) };
}

it('Angular: gravação do erro, debounce, montagem e escala', async () => {
  const variants: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3).
  for (const v of VARIANTS) {
    const [slow, fast] = [await type(v, TEXT, 250), await type(v, TEXT, 60)];
    const c = ({ updates, formUpdates, validations, flickers }: Run) => ({ updates, formUpdates, validations, flickers });
    variants[v.key] = { name: v.name, counts25: { '250ms': c(slow), '60ms': c(fast) } };
  }

  // Aquecimento da digitação e da montagem.
  for (const v of VARIANTS) { await type(v, LONG, 60); await mountMs(v); }

  // 54 teclas (seções 8.4 e 8.5) e montagem de 500 campos: REPS repetições, ordem sorteada a cada repetição.
  const runs: Record<string, { slow: Run[]; fast: Run[]; mount: number[] }> = {};
  for (let r = 0; r < REPS; r++) for (const v of shuffled(VARIANTS, RUN * 1000 + r)) {
    const run = (runs[v.key] ??= { slow: [], fast: [], mount: [] });
    run.slow.push(await type(v, LONG, 250));
    run.fast.push(await type(v, LONG, 60));
    run.mount.push(await mountMs(v));
  }
  for (const v of VARIANTS) {
    const { slow, fast, mount } = runs[v.key];
    Object.assign(variants[v.key], { keys54: { '250ms': counts(slow), '60ms': counts(fast) }, mount500_ms: mount.map(round) });
  }

  // Escala: forma adotada (W) e linha de base (H) com 20, 100 e 500 campos.
  const cells = ['H', 'W'].flatMap((key) => [20, 100, 500].map((n) => ({ key, n })));
  const scaling: Record<string, Run[]> = {};
  for (const { key, n } of cells) await type(byKey[key], LONG, 250, n); // aquecimento
  for (let r = 0; r < REPS; r++) for (const { key, n } of shuffled(cells, RUN * 2000 + r)) {
    (scaling[`${key}@${n}`] ??= []).push(await type(byKey[key], LONG, 250, n));
  }

  const file = writeRun('angular', {
    method: 'jsdom + TestBed sem zone.js, hlmInput do spartan-ng; updates = atualizações da view dos campos; formUpdates = da view do formulário pai',
    variants,
    scaling: Object.fromEntries(Object.entries(scaling).map(([k, xs]) => [k, { key: k.split('@')[0], n: +k.split('@')[1], ...counts(xs) }])),
  });
  console.log('gravado em', file);
}, 3_600_000);
