// Custo por chamada do esquema de evento (seções 8.2 e 9), Yup e Zod 4, com 3, 30 e 300 itens.
// Relata média, mediana, p99 e desvio-padrão de cada tarefa (tinybench).
import { Bench } from 'tinybench';
import { produce } from 'immer';
import { yupEvent, zodEvent, makeData } from './schemas.mjs';
import { validateAtFull, validateAtLocal } from '../../experiments/zod/zodPartial.mjs';
import { removeFlat } from '../../experiments/pitfalls/flatMap.mjs';
import { writeRun } from '../shared/runs.mjs';

const yupAt = (p, d) => { try { yupEvent.validateSyncAt(p, d); return undefined; } catch (e) { return e.errors[0]; } };

/** Erros da submissão em dois formatos: mapa plano (chave = caminho) e árvore. */
function errorsOf(data) {
  const flat = {}, tree = { descriptions: [] };
  try { yupEvent.validateSync(data, { abortEarly: false }); } catch (e) {
    for (const inner of e.inner) {
      if (!inner.path || inner.path in flat) continue;
      flat[inner.path] = inner.errors[0];
      const m = /^descriptions\[(\d+)\]\.(\w+)$/.exec(inner.path);
      if (m) (tree.descriptions[+m[1]] ??= {})[m[2]] = inner.errors[0];
    }
  }
  return { flat, tree };
}

const results = [];
const sanity = {};
for (const n of [3, 30, 300]) {
  const invalid = makeData(n, false);
  const valid = makeData(n, true);
  const last = `descriptions[${n - 1}].title`;
  const lastItemInvalid = produce(invalid, (d) => { d.descriptions[n - 1].title = ''; });
  const { flat, tree } = errorsOf(invalid);
  const middle = Math.floor(n / 2);
  const bench = new Bench({ time: 400, warmupTime: 100 });
  bench
    .add('Yup validateSyncAt · campo raiz válido', () => yupAt('name', valid))
    .add('Yup validateSyncAt · campo raiz inválido', () => yupAt('name', invalid))
    .add('Yup validateSyncAt · primeiro item inválido', () => yupAt('descriptions[0].title', invalid))
    .add('Yup validateSyncAt · último item inválido', () => yupAt(last, lastItemInvalid))
    .add('Yup validateSyncAt · regra entre campos inválida', () => yupAt('password_confirmation', invalid))
    .add('Yup validateSyncAt · contêiner (array inteiro) válido', () => yupAt('descriptions', valid))
    .add('Yup validateSyncAt · contêiner (array inteiro) inválido', () => yupAt('descriptions', invalid))
    .add('Yup validateAt (Promise) · campo raiz inválido', async () => { await yupEvent.validateAt('name', invalid).catch(() => {}); })
    .add('Zod local · campo raiz válido', () => validateAtLocal(zodEvent, 'name', valid))
    .add('Zod local · campo raiz inválido', () => validateAtLocal(zodEvent, 'name', invalid))
    .add('Zod local · primeiro item inválido', () => validateAtLocal(zodEvent, 'descriptions.0.title', invalid))
    .add('Zod full+filtro · campo raiz inválido', () => validateAtFull(zodEvent, 'name', invalid))
    .add('Zod full+filtro · primeiro item inválido', () => validateAtFull(zodEvent, 'descriptions.0.title', invalid))
    .add('Zod full+filtro · regra entre campos inválida', () => validateAtFull(zodEvent, 'password_confirmation', invalid))
    .add('Yup validateSync · formulário inteiro inválido', () => { try { yupEvent.validateSync(invalid, { abortEarly: false }); } catch {} })
    .add('Yup validateSync · formulário inteiro válido', () => { yupEvent.validateSync(valid, { abortEarly: false }); })
    .add('Zod safeParse · formulário inteiro inválido', () => { zodEvent.safeParse(invalid); })
    .add('Zod safeParse · formulário inteiro válido', () => { zodEvent.safeParse(valid); })
    .add('Remoção do item do meio · árvore + splice (Immer)', () => produce(tree, (d) => { d.descriptions.splice(middle, 1); }))
    .add('Remoção do item do meio · mapa plano + renumeração', () => removeFlat(flat, 'descriptions', middle));
  await bench.run();
  const us = (ms) => +(ms * 1000).toFixed(2);
  for (const t of bench.tasks) {
    const l = t.result.latency;
    results.push({ n, task: t.name, mean_us: us(l.mean), p50_us: us(l.p50), p99_us: us(l.p99), sd_us: us(l.sd) });
  }
  let yupIssues = 0;
  try { yupEvent.validateSync(invalid, { abortEarly: false }); } catch (e) { yupIssues = e.inner.length; }
  sanity[n] = {
    'Yup: erros no formulário inválido': yupIssues,
    'Zod: issues no formulário inválido': zodEvent.safeParse(invalid).error.issues.length,
    'itens com erro (árvore)': tree.descriptions.filter(Boolean).length,
  };
}
console.table(results);

const inv = makeData(30, false);
sanity.crossField = {
  'Yup validateSyncAt(password_confirmation)': yupAt('password_confirmation', inv),
  'Zod local (não vê o refine do pai)': validateAtLocal(zodEvent, 'password_confirmation', inv) ?? null,
  'Zod full+filtro': validateAtFull(zodEvent, 'password_confirmation', inv),
};
console.log(sanity);
console.log('gravado em', writeRun('schema', { method: 'tinybench, 400 ms por tarefa, 100 ms de aquecimento; latência por chamada', results, sanity }));
