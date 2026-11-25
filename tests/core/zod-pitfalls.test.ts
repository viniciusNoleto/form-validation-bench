import { it, expect } from 'vitest';
import { z } from 'zod';

// As armadilhas do estado inicial no Zod 4 citadas na seção 9.2, verificadas por execução.

it('parse({}) executa os refinamentos do objeto e lança se eles reprovam os próprios defaults', () => {
  const s = z.object({
    start: z.number().default(10),
    end: z.number().default(5),
  }).refine((v) => v.start < v.end, { message: 'intervalo invertido', path: ['end'] });
  expect(() => s.parse({})).toThrow(/intervalo invertido/);
  expect(s.safeParse({}).success).toBe(false);
});

it('objeto aninhado com .default({}) nasce {} sem os defaults internos; com .prefault({}), com eles', () => {
  const inner = z.object({ city: z.string().default(''), zip: z.string().default('') });
  expect(z.object({ address: inner.default({} as any) }).parse({})).toEqual({ address: {} });
  expect(z.object({ address: inner.prefault({}) }).parse({})).toEqual({ address: { city: '', zip: '' } });
});

it('no Zod 4 o default não passa pela validação; o prefault passa', () => {
  expect(z.string().min(1, 'obrigatório').default('').safeParse(undefined)).toEqual({ success: true, data: '' });
  expect(z.string().min(1, 'obrigatório').prefault('').safeParse(undefined).success).toBe(false);
});

it('"começa nulo, mas é obrigatório": o refine precisa declarar retorno boolean para aceitar .default(null)', () => {
  const capacity = z.number().min(1).nullable().refine((v): boolean => v !== null, 'Informe a capacidade').default(null);
  expect(capacity.parse(undefined)).toBeNull();
  expect(capacity.safeParse(null).success).toBe(false);
  expect(capacity.safeParse(10).success).toBe(true);
});
