import { Bench } from 'tinybench';
import * as yup from 'yup';
import { yupEvent, zodEvent, makeData } from './schemas.mjs';
import { validateAtFull, validateAtLocal } from '../../experiments/zod/zodPartial.mjs';

const results = [];
for (const n of [3, 30, 300]) {
  const invalid = makeData(n, false);
  const valid = makeData(n, true);
  const bench = new Bench({ time: 400, warmupTime: 100 });
  const yupAt = (p, d) => { try { yupEvent.validateSyncAt(p, d); return undefined; } catch (e) { return e.errors[0]; } };
  bench
    .add('Yup validateSyncAt · campo raiz válido', () => yupAt('name', valid))
    .add('Yup validateSyncAt · campo raiz inválido', () => yupAt('name', invalid))
    .add('Yup validateSyncAt · item de array inválido', () => yupAt('descriptions[0].title', invalid))
    .add('Yup validateAt (Promise) · campo raiz inválido', async () => { await yupEvent.validateAt('name', invalid).catch(() => {}); })
    .add('Zod local · campo raiz válido', () => validateAtLocal(zodEvent, 'name', valid))
    .add('Zod local · campo raiz inválido', () => validateAtLocal(zodEvent, 'name', invalid))
    .add('Zod local · item de array inválido', () => validateAtLocal(zodEvent, 'descriptions.0.title', invalid))
    .add('Zod full+filtro · campo raiz inválido', () => validateAtFull(zodEvent, 'name', invalid))
    .add('Yup validateSync · formulário inteiro inválido', () => { try { yupEvent.validateSync(invalid, { abortEarly: false }); } catch {} })
    .add('Yup validateSync · formulário inteiro válido', () => { yupEvent.validateSync(valid, { abortEarly: false }); })
    .add('Zod safeParse · formulário inteiro inválido', () => { zodEvent.safeParse(invalid); })
    .add('Zod safeParse · formulário inteiro válido', () => { zodEvent.safeParse(valid); });
  await bench.run();
  for (const t of bench.tasks) {
    const r = t.result;
    results.push({ n, task: t.name, mean_us: +((r.latency?.mean ?? r.mean) * 1000).toFixed(2), p99_us: +((r.latency?.p99 ?? r.p99) * 1000).toFixed(2) });
  }
}
console.table(results);
const fs = await import('node:fs');
fs.writeFileSync('results/schema.json', JSON.stringify(results, null, 2));
// quantos issues cada lib devolve no formulário inválido (sanidade)
const inv = makeData(30, false);
try { yupEvent.validateSync(inv, { abortEarly: false }); } catch (e) { console.log('yup issues', e.inner.length); }
console.log('zod issues', zodEvent.safeParse(inv).error.issues.length);
// cross-field
console.log('yup confirm via ref:', (() => { try { yupEvent.validateSyncAt('password_confirmation', inv); } catch (e) { return e.errors[0]; } })());
console.log('zod local confirm (não vê refine):', validateAtLocal(zodEvent, 'password_confirmation', inv));
console.log('zod full confirm:', validateAtFull(zodEvent, 'password_confirmation', inv));
