import { it } from 'vitest';
import fs from 'node:fs';
import { LONG, TEXT, W, WC, WD, median, mountMs, type } from './harness';

const REPS = 15;
type Run = Awaited<ReturnType<typeof type>>;

it('Angular: gravação do erro, debounce e montagem', async () => {
  const variants = [W, WC, WD];
  const out: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3): exatas, uma execução basta.
  for (const variant of variants) {
    const [slow, fast] = [await type(variant, TEXT, 250), await type(variant, TEXT, 60)];
    out[variant.name] = {
      '25 teclas · 250ms': { updates: slow.updates, validations: slow.validations, flickers: slow.flickers },
      '25 teclas · 60ms': { updates: fast.updates, validations: fast.validations, flickers: fast.flickers },
    };
  }

  // 54 teclas (seções 8.4 e 8.5) e montagem de 500 campos: intercalado, REPS repetições, mediana dos tempos.
  for (const variant of variants) await mountMs(variant); // aquecimento
  const runs: Record<string, { slow: Run[]; fast: Run[]; mount: number[] }> = {};
  for (let r = 0; r < REPS; r++) for (const variant of variants) {
    const run = (runs[variant.name] ??= { slow: [], fast: [], mount: [] });
    run.slow.push(await type(variant, LONG, 250));
    run.fast.push(await type(variant, LONG, 60));
    run.mount.push(await mountMs(variant));
  }
  const summary = (xs: Run[]) => ({ updates: xs[0].updates, validations: xs[0].validations, usPerKey: Math.round(median(xs.map((x) => x.usPerKey))) });
  for (const variant of variants) {
    const { slow, fast, mount } = runs[variant.name];
    Object.assign(out[variant.name], {
      '54 teclas · 250ms': summary(slow),
      '54 teclas · 60ms': summary(fast),
      'montagem 500 campos ms': +median(mount).toFixed(1),
    });
  }

  fs.writeFileSync('results/angular-structure.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
}, 600000);
