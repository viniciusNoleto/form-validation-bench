import { it, expect } from 'vitest';
import * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { validateAllSync, readError } from '../../src/core/formCore';

const schema = yup.object({
  items: yup.array().of(yup.object({ name: yup.string().required('nome obrigatório').default('') })).default([]),
});

// 3 itens; só o item 1 (o segundo) está inválido
const form = { items: [{ name: 'Ana' }, { name: '' }, { name: 'Caio' }] };

it('mapa plano: remover o item 1 faz o antigo item 2 herdar o erro', () => {
  const flat: Record<string, string> = {};
  try { schema.validateSync(form, { abortEarly: false }); } catch (e: any) { e.inner.forEach((i: any) => { flat[i.path] = i.errors[0]; }); }
  const after = { items: form.items.filter((_, i) => i !== 1) }; // [Ana, Caio]
  const shown = after.items.map((item, i) => `${item.name}: ${flat[`items[${i}].name`] ?? '—'}`);
  console.log('PLANO  antes:', JSON.stringify(flat), '| depois de remover o item 1:', shown);
  expect(flat['items[1].name']).toBe('nome obrigatório'); // agora aponta para "Caio", que é válido
});

it('árvore: splice paralelo mantém a paridade', () => {
  let errors = validateAllSync(schema, form)!;
  const formAfter = produce(form, d => { d.items.splice(1, 1); });
  errors = produce(errors, d => { _get(d, 'items')?.splice(1, 1); });
  const shown = formAfter.items.map((item, i) => `${item.name}: ${readError(schema, errors, `items[${i}].name`) ?? '—'}`);
  console.log('ÁRVORE depois de remover o item 1:', shown, JSON.stringify(errors));
  expect(readError(schema, errors, 'items[1].name')).toBeUndefined();
});

it('árvore ingênua (sem :root): o erro do array apaga os erros dos itens', () => {
  const s2 = yup.object({ items: yup.array().of(yup.object({ name: yup.string().required('nome obrigatório') })).min(4, 'mínimo 4') });
  const tree: any = {};
  try { s2.validateSync(form, { abortEarly: false }); } catch (e: any) { e.inner.forEach((i: any) => _set(tree, i.path, i.errors[0])); }
  console.log('INGÊNUA:', JSON.stringify(tree), '| com :root:', JSON.stringify(validateAllSync(s2, form)));
  expect(tree.items).toBe('mínimo 4');
});

// Alternativa mais forte ao mapa plano não mantido: o mapa plano COM renumeração (experiments/pitfalls/flatMap.mjs).
// Ele também mantém a paridade; o custo é renumerar as chaves por prefixo, em todos os níveis.
it('mapa plano com renumeração: remoção e inserção mantêm a paridade, inclusive em sublistas', async () => {
  const { removeFlat, insertFlat } = await import('../../experiments/pitfalls/flatMap.mjs');
  const flat = {
    'items[0].name': 'a', 'items[1].name': 'b', 'items[1].tags[0]': 'b0', 'items[2].name': 'c', 'items[2].tags[1]': 'c1', 'items': 'mínimo 4',
  };
  expect(removeFlat(flat, 'items', 1)).toEqual({ 'items[0].name': 'a', 'items[1].name': 'c', 'items[1].tags[1]': 'c1', 'items': 'mínimo 4' });
  expect(insertFlat(flat, 'items', 1)).toEqual({
    'items[0].name': 'a', 'items[2].name': 'b', 'items[2].tags[0]': 'b0', 'items[3].name': 'c', 'items[3].tags[1]': 'c1', 'items': 'mínimo 4',
  });
  // remover numa sublista renumera só aquela sublista
  expect(removeFlat({ 'items[2].tags[0]': 'x', 'items[2].tags[1]': 'y', 'items[3].tags[1]': 'z' }, 'items[2].tags', 0))
    .toEqual({ 'items[2].tags[0]': 'y', 'items[3].tags[1]': 'z' });
});
