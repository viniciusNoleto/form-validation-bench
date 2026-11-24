import * as yup from 'yup';
import { z } from 'zod';

export const yupEvent = yup.object({
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

export const zodEvent = z.object({
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
    name: valid ? 'Evento' : '',
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
