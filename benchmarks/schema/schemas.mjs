import * as yup from 'yup';
import { z } from 'zod';

export const yupBasic = yup.object({
  name: yup.string().trim().required().default(''),
  email: yup.string().trim().email().required().default(''),
  password: yup.string().min(8).required().default(''),
  password_confirmation: yup.string().required().oneOf([yup.ref('password')], 'Senhas diferentes').default(''),
  organizer_slug: yup.string().required().default(''),
  capacity: yup.number().min(0).required().nullable().default(null),
  categories: yup.array().of(yup.string().required()).min(1).default([]),
  descriptions: yup.array().of(yup.object({
    title: yup.string().trim().required().default(''),
    content: yup.string().trim().min(10).required().default(''),
  })).min(1).default([]),
});

export const zodBasic = z.object({
  name: z.string().trim().min(1, 'Obrigatório').default(''),
  email: z.string().trim().pipe(z.email('E-mail inválido')).default(''),
  password: z.string().min(8).default(''),
  password_confirmation: z.string().min(1).default(''),
  organizer_slug: z.string().min(1).default(''),
  capacity: z.number().min(0).nullable().default(null),
  categories: z.array(z.string().min(1)).min(1).default([]),
  descriptions: z.array(z.object({
    title: z.string().trim().min(1).default(''),
    content: z.string().trim().min(10).default(''),
  })).min(1).default([]),
}).refine(v => v.password === v.password_confirmation, { message: 'Senhas diferentes', path: ['password_confirmation'] });

export function makeData(n, valid) {
  return {
    name: valid ? 'Fulano' : '',
    email: valid ? 'a@b.com' : 'x',
    password: '12345678',
    password_confirmation: valid ? '12345678' : '1234',
    organizer_slug: 'org',
    capacity: 10,
    categories: ['music'],
    descriptions: Array.from({ length: n }, (_, i) => ({
      title: valid || i % 2 ? 'Título ' + i : '',
      content: valid || i % 3 ? 'Conteúdo longo ' + i : 'curto',
    })),
  };
}

// Esquema de alta complexidade (src/schemas/complexSchema.ts), pessoa jurídica com n sócios.
// Só Yup: o esquema usa when, yup.ref, testes de lista e uma regra da raiz, sem versão em Zod.
export { complexSchema } from '../../src/schemas/complexSchema.ts';

const phone = (number) => ({ uid: 'p', type: 'celular', number, whatsapp: false });
const address = { zip: '50000-000', street: 'Rua A', number: '10', complement: '', district: 'Centro', city: 'Recife', state: 'PE' };

/** Formulário de pessoa jurídica com n sócios; inválido = nome e telefone de cada sócio vazios. */
export function makeComplex(n, valid) {
  const share = +(100 / n).toFixed(4);
  return {
    person_type: 'juridica', name: 'Empresa Exemplo', trade_name: 'Exemplo', document: '11222333000181',
    birth_date: null, foundation_date: new Date(2010, 0, 1),
    contact: { email: 'a@exemplo.com', email_confirmation: 'a@exemplo.com', phones: [phone('81988887777')] },
    addresses: [{ uid: 'a', type: 'comercial', ...address, is_primary: true }],
    partners: Array.from({ length: n }, (_, i) => ({
      uid: `s${i}`, name: valid ? `Sócio ${i}` : '', cpf: '52998224725',
      share: i === n - 1 ? +(100 - share * (n - 1)).toFixed(4) : share, is_administrator: i === 0,
      address, phones: [phone(valid ? '81988887777' : '')],
    })),
    dependents: [],
    bank_account: { bank_code: '001', branch: '1234', account: '12345-6', account_type: 'corrente', pix_key_type: null, pix_key: '' },
    period: { start_date: new Date(2026, 0, 1), end_date: null },
    credentials: { password: 'Abcdefg1', password_confirmation: 'Abcdefg1' },
    preferences: { channels: ['email'], language: 'pt-BR', newsletter: false },
    notes: '', terms_accepted: true,
  };
}
