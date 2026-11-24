import { z } from 'zod';

export const descriptionSchema = z.object({
  uid: z.string().default(() => Math.random().toString(36).slice(2)),
  title: z.string().trim().min(1, 'Informe o título').default(''),
  content: z.string().trim().min(10, 'Mínimo de 10 caracteres').default(''),
});

export const eventSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do evento').default(''),
  email: z.string().trim().min(1, 'Informe o e-mail').pipe(z.email('E-mail inválido')).default(''),
  password: z.string().min(8, 'Mínimo de 8 caracteres').default(''),
  password_confirmation: z.string().min(1, 'Confirme a senha').default(''),
  capacity: z.number({ error: 'Informe a capacidade' }).int().min(1, 'Capacidade mínima de 1').nullable()
    .refine((v): boolean => v !== null, 'Informe a capacidade').default(null),
  address: z.object({
    zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').default(''),
    city: z.string().trim().min(1, 'Informe a cidade').default(''),
  }).prefault({}),
  categories: z.array(z.string()).min(1, 'Escolha ao menos uma categoria').default([]),
  descriptions: z.array(descriptionSchema).min(1, 'Adicione ao menos uma descrição').max(5, 'No máximo 5 descrições').default([]),
}).refine((v) => v.password === v.password_confirmation, {
  message: 'As senhas não conferem',
  path: ['password_confirmation'],
});

export type EventForm = z.output<typeof eventSchema>;

export const eventFormOptions = {
  crossFields: ['password_confirmation'],
  dependents: { password: ['password_confirmation'] },
};
