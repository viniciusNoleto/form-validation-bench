import { it, expect } from 'vitest';
import * as yup from 'yup';

// Comportamentos do Yup que o artigo afirma ter "verificado por execução" (seções 3, 4.1, 4.2 e 7.2).

const schema = yup.object({
  password: yup.string().default(''),
  password_confirmation: yup.string().required('Confirme a senha').oneOf([yup.ref('password')], 'As senhas não conferem').default(''),
  type: yup.string().default('pf'),
  cnpj: yup.string().when('type', { is: 'pj', then: (s) => s.required('CNPJ obrigatório') }).default(''),
  tags: yup.array().of(yup.string()).default([]),
  address: yup.object({ city: yup.string().default('') }),
  descriptions: yup.array().of(yup.object({ title: yup.string().required('título obrigatório').default('') }))
    .min(2, 'mínimo 2').default([]),
});

it('§3: duas chamadas a getDefault() devolvem arrays e objetos com referências distintas', () => {
  const a = schema.getDefault();
  const b = schema.getDefault();
  expect(a).toEqual(b);
  expect(a.tags).not.toBe(b.tags);
  expect(a.address).not.toBe(b.address);
  expect(a.descriptions).not.toBe(b.descriptions);
});

it('§4.1: error.path repete a notação recebida (colchetes ou ponto)', () => {
  const data = { ...schema.getDefault(), descriptions: [{ title: '' }, { title: 'ok' }] };
  const pathOf = (p: string) => { try { schema.validateSyncAt(p, data); } catch (e) { return (e as yup.ValidationError).path; } };
  expect(pathOf('descriptions[0].title')).toBe('descriptions[0].title');
  expect(pathOf('descriptions.0.title')).toBe('descriptions.0.title');
});

it('§4.2: validateSyncAt resolve yup.ref e .when com o objeto inteiro', () => {
  const base = schema.getDefault();
  const at = (p: string, d: object) => { try { schema.validateSyncAt(p, d); return undefined; } catch (e) { return (e as yup.ValidationError).errors[0]; } };
  expect(at('password_confirmation', { ...base, password: '12345678', password_confirmation: '1234' })).toBe('As senhas não conferem');
  expect(at('password_confirmation', { ...base, password: '12345678', password_confirmation: '12345678' })).toBeUndefined();
  expect(at('cnpj', { ...base, type: 'pj' })).toBe('CNPJ obrigatório');
  expect(at('cnpj', { ...base, type: 'pf' })).toBeUndefined();
});

it('§4.2: oneOf é um teste inicial do Yup e roda antes de required', () => {
  // com a senha preenchida, a confirmação vazia acusa "não conferem", e não "Confirme a senha"
  const at = (d: object) => { try { schema.validateSyncAt('password_confirmation', d); } catch (e) { return (e as yup.ValidationError).errors[0]; } };
  expect(at({ ...schema.getDefault(), password: '12345678', password_confirmation: '' })).toBe('As senhas não conferem');
  expect(at({ ...schema.getDefault(), password: '', password_confirmation: '' })).toBe('Confirme a senha');
});

it('§7.2: o Yup emite o erro do item antes do erro do array', () => {
  try { schema.validateSync({ ...schema.getDefault(), descriptions: [{ title: '' }] }, { abortEarly: false }); } catch (e) {
    expect((e as yup.ValidationError).inner.map((i) => i.path).filter((p) => p?.startsWith('descriptions')))
      .toEqual(['descriptions[0].title', 'descriptions']);
  }
});
