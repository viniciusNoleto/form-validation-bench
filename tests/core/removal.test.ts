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
