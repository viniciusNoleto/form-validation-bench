/**
 * Catálogo de cadeias de validação por tipo de dado, a mesma regra em Yup e em Zod 4.
 *
 * Cada caso descreve um formulário mínimo com o campo `x` (e, quando a regra depende de
 * irmãos, os campos de que ela depende), um valor válido e um ou mais valores inválidos,
 * cada um reprovando UMA regra conhecida. O mesmo catálogo alimenta:
 *  - tests/types/chains.test.ts: confere a mensagem de cada regra nas duas bibliotecas;
 *  - benchmarks/types/bench.mjs: custo por chamada, por tipo e por comprimento da cadeia.
 *
 * Yup: validateSyncAt(path, form), como no padrão (seção 4).
 * Zod: sem validateAt. Para regras locais, safeParse do sub-esquema do campo (o "Zod local",
 * que é o caminho mais barato); para regras entre campos, safeParse do objeto inteiro e
 * filtro do issue do caminho ("Zod full+filtro"), único jeito de a regra rodar (seção 9.2).
 */
import * as yup from 'yup';
import { z } from 'zod';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'mixed';

export type Invalid = {
  /** valor de `x` (ou do caminho) que reprova uma regra */
  value: unknown;
  /** mensagem esperada */
  message: string;
  /** posição da regra reprovada na cadeia: 'first' | 'last' | 'only' | 'middle' */
  at: 'first' | 'middle' | 'last' | 'only';
  /**
   * Quando as bibliotecas divergem, a resposta do Yup (null = o Yup aceita o valor).
   * As divergências são achados, documentados no teste e no artigo; o benchmark não as usa.
   */
  yupMessage?: string | null;
};

export type Case = {
  id: string;
  type: DataType;
  /** descrição curta da cadeia, como aparece nas tabelas */
  chain: string;
  /** número de regras na cadeia (transformações como trim não contam) */
  rules: number;
  /** regra entre campos: Zod precisa validar o objeto inteiro */
  crossField?: boolean;
  /** caminho validado (padrão: 'x') */
  path?: string;
  yupField: () => yup.Schema;
  zodField: () => z.ZodType;
  /** esquema Zod de `x` no formulário, quando o caminho validado é mais fundo que `x` */
  zodX?: () => z.ZodType;
  /** irmãos de que a regra depende (esquemas e valores) */
  siblings?: { yup: Record<string, yup.Schema>; zod: Record<string, z.ZodType>; value: Record<string, unknown> };
  /** refinamento no objeto pai, só no Zod (regras entre campos) */
  zodRefine?: (schema: z.ZodObject<any>) => z.ZodType;
  valid: unknown;
  invalid: Invalid[];
};

const D = (iso: string) => new Date(`${iso}T00:00:00Z`);
const NAME = /^[A-Za-zÀ-ú ]+$/;

export const CASES: Case[] = [
  // ───────────── string ─────────────
  {
    id: 'string/required', type: 'string', chain: 'required', rules: 1,
    yupField: () => yup.string().required('obrigatório'),
    zodField: () => z.string().min(1, 'obrigatório'),
    valid: 'Ana',
    invalid: [{ value: '', message: 'obrigatório', at: 'only' }],
  },
  {
    id: 'string/trim-required-min-max', type: 'string', chain: 'trim · required · min(3) · max(40)', rules: 3,
    yupField: () => yup.string().trim().required('obrigatório').min(3, 'mínimo 3').max(40, 'máximo 40'),
    zodField: () => z.string().trim().min(1, 'obrigatório').min(3, 'mínimo 3').max(40, 'máximo 40'),
    valid: '  Festival de Inverno  ',
    invalid: [
      { value: '   ', message: 'obrigatório', at: 'first' },
      { value: 'Ab', message: 'mínimo 3', at: 'middle' },
      { value: 'x'.repeat(41), message: 'máximo 40', at: 'last' },
    ],
  },
  {
    id: 'string/name-5', type: 'string', chain: 'trim · required · min(3) · max(40) · matches(letras) · test(2 palavras)', rules: 5,
    yupField: () => yup.string().trim().required('obrigatório').min(3, 'mínimo 3').max(40, 'máximo 40')
      .matches(NAME, 'só letras').test('words', 'nome e sobrenome', (v) => !v || v.split(/\s+/).length >= 2),
    zodField: () => z.string().trim().min(1, 'obrigatório').min(3, 'mínimo 3').max(40, 'máximo 40')
      .regex(NAME, 'só letras').refine((v) => v.split(/\s+/).length >= 2, 'nome e sobrenome'),
    valid: 'Ana Souza',
    invalid: [
      { value: '', message: 'obrigatório', at: 'first' },
      { value: 'Ana 3', message: 'só letras', at: 'middle' },
      { value: 'Ana', message: 'nome e sobrenome', at: 'last' },
    ],
  },
  {
    id: 'string/email', type: 'string', chain: 'trim · required · email', rules: 2,
    yupField: () => yup.string().trim().required('obrigatório').email('e-mail inválido'),
    zodField: () => z.string().trim().min(1, 'obrigatório').pipe(z.email('e-mail inválido')),
    valid: 'ana@exemplo.com',
    invalid: [
      { value: '', message: 'obrigatório', at: 'first' },
      { value: 'ana.exemplo.com', message: 'e-mail inválido', at: 'last' },
      // divergência: a regex de e-mail do Yup aceita domínio sem ponto; a do Zod, não
      { value: 'ana@exemplo', message: 'e-mail inválido', at: 'last', yupMessage: null },
    ],
  },
  {
    id: 'string/url', type: 'string', chain: 'url', rules: 1,
    yupField: () => yup.string().url('URL inválida'),
    zodField: () => z.url('URL inválida'),
    valid: 'https://exemplo.com/evento',
    invalid: [{ value: 'exemplo', message: 'URL inválida', at: 'only' }],
  },
  {
    id: 'string/uuid', type: 'string', chain: 'uuid', rules: 1,
    yupField: () => yup.string().uuid('UUID inválido'),
    zodField: () => z.uuid('UUID inválido'),
    valid: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
    invalid: [{ value: '3f2a9c1e', message: 'UUID inválido', at: 'only' }],
  },
  {
    id: 'string/oneOf', type: 'string', chain: 'required · oneOf(3)', rules: 2,
    yupField: () => yup.string().required('obrigatório').oneOf(['pf', 'pj', 'estrangeiro'], 'tipo inválido'),
    zodField: () => z.enum(['pf', 'pj', 'estrangeiro'], { error: 'tipo inválido' }),
    valid: 'pj',
    invalid: [{ value: 'ong', message: 'tipo inválido', at: 'last' }],
  },
  {
    id: 'string/cep-mask', type: 'string', chain: 'transform(dígitos) · matches(CEP)', rules: 1,
    yupField: () => yup.string().transform((v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v)).matches(/^\d{8}$/, 'CEP inválido'),
    zodField: () => z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().regex(/^\d{8}$/, 'CEP inválido')),
    valid: '50000-000',
    invalid: [{ value: '5000-000', message: 'CEP inválido', at: 'only' }],
  },
  {
    id: 'string/confirm-ref', type: 'string', chain: 'required · oneOf(ref(password))', rules: 2, crossField: true,
    yupField: () => yup.string().required('obrigatório').oneOf([yup.ref('password')], 'as senhas não conferem'),
    zodField: () => z.string().min(1, 'obrigatório'),
    siblings: { yup: { password: yup.string() }, zod: { password: z.string() }, value: { password: '12345678' } },
    zodRefine: (s) => s.refine((v: any) => !v.x || v.x === v.password, { message: 'as senhas não conferem', path: ['x'] }),
    valid: '12345678',
    invalid: [
      // divergência: no Yup, oneOf é um teste "inicial" e roda antes de required; com a senha
      // preenchida, a confirmação vazia acusa "não conferem". No Zod, o refine do pai nem roda.
      { value: '', message: 'obrigatório', at: 'first', yupMessage: 'as senhas não conferem' },
      { value: '1234567', message: 'as senhas não conferem', at: 'last' },
    ],
  },
  {
    id: 'string/when', type: 'string', chain: 'when(type = pj, required · matches(CNPJ))', rules: 2, crossField: true,
    yupField: () => yup.string().when('type', {
      is: 'pj',
      then: (s) => s.required('CNPJ obrigatório').matches(/^\d{14}$/, 'CNPJ inválido'),
    }),
    zodField: () => z.string(),
    siblings: { yup: { type: yup.string() }, zod: { type: z.string() }, value: { type: 'pj' } },
    zodRefine: (s) => s.superRefine((v: any, ctx) => {
      if (v.type !== 'pj') return;
      if (!v.x) ctx.addIssue({ code: 'custom', message: 'CNPJ obrigatório', path: ['x'] });
      else if (!/^\d{14}$/.test(v.x)) ctx.addIssue({ code: 'custom', message: 'CNPJ inválido', path: ['x'] });
    }),
    valid: '12345678000199',
    invalid: [
      { value: '', message: 'CNPJ obrigatório', at: 'first' },
      { value: '123', message: 'CNPJ inválido', at: 'last' },
    ],
  },

  // ───────────── number ─────────────
  {
    id: 'number/nullable-required', type: 'number', chain: 'nullable · required', rules: 1,
    yupField: () => yup.number().nullable().required('obrigatório'),
    zodField: () => z.number().nullable().refine((v): boolean => v !== null, 'obrigatório'),
    valid: 10,
    invalid: [{ value: null, message: 'obrigatório', at: 'only' }],
  },
  {
    id: 'number/min-max', type: 'number', chain: 'required · min(1) · max(1000)', rules: 3,
    yupField: () => yup.number().required('obrigatório').min(1, 'mínimo 1').max(1000, 'máximo 1000'),
    zodField: () => z.number({ error: 'obrigatório' }).min(1, 'mínimo 1').max(1000, 'máximo 1000'),
    valid: 250,
    invalid: [
      { value: 0, message: 'mínimo 1', at: 'middle' },
      { value: 1001, message: 'máximo 1000', at: 'last' },
    ],
  },
  {
    id: 'number/int-positive-5', type: 'number', chain: 'typeError · required · integer · positive · min(1) · max(1000)', rules: 5,
    yupField: () => yup.number().typeError('número').required('obrigatório').integer('inteiro').positive('positivo')
      .min(1, 'mínimo 1').max(1000, 'máximo 1000'),
    zodField: () => z.number({ error: 'número' }).int('inteiro').positive('positivo').min(1, 'mínimo 1').max(1000, 'máximo 1000'),
    valid: 42,
    invalid: [
      { value: 'abc', message: 'número', at: 'first' },
      { value: 4.5, message: 'inteiro', at: 'middle' },
      { value: 5000, message: 'máximo 1000', at: 'last' },
    ],
  },
  {
    id: 'number/moreThan-ref', type: 'number', chain: 'required · moreThan(ref(min))', rules: 2, crossField: true,
    yupField: () => yup.number().required('obrigatório').moreThan(yup.ref('min'), 'deve ser maior que o mínimo'),
    zodField: () => z.number({ error: 'obrigatório' }),
    siblings: { yup: { min: yup.number() }, zod: { min: z.number() }, value: { min: 10 } },
    zodRefine: (s) => s.refine((v: any) => v.x > v.min, { message: 'deve ser maior que o mínimo', path: ['x'] }),
    valid: 20,
    invalid: [{ value: 5, message: 'deve ser maior que o mínimo', at: 'last' }],
  },

  // ───────────── boolean ─────────────
  {
    id: 'boolean/required', type: 'boolean', chain: 'required', rules: 1,
    yupField: () => yup.boolean().required('obrigatório'),
    zodField: () => z.boolean({ error: 'obrigatório' }),
    valid: false,
    invalid: [{ value: undefined, message: 'obrigatório', at: 'only' }],
  },
  {
    id: 'boolean/accept', type: 'boolean', chain: 'required · oneOf([true])', rules: 2,
    yupField: () => yup.boolean().required('obrigatório').oneOf([true], 'aceite os termos'),
    zodField: () => z.boolean({ error: 'obrigatório' }).refine((v) => v === true, 'aceite os termos'),
    valid: true,
    invalid: [{ value: false, message: 'aceite os termos', at: 'last' }],
  },

  // ───────────── date ─────────────
  {
    id: 'date/required', type: 'date', chain: 'nullable · required', rules: 1,
    yupField: () => yup.date().nullable().required('obrigatório'),
    zodField: () => z.date().nullable().refine((v): boolean => v !== null, 'obrigatório'),
    valid: D('2026-12-01'),
    invalid: [{ value: null, message: 'obrigatório', at: 'only' }],
  },
  {
    id: 'date/min-max', type: 'date', chain: 'typeError · required · min · max', rules: 3,
    yupField: () => yup.date().typeError('data inválida').required('obrigatório')
      .min(D('2026-01-01'), 'antes de 2026').max(D('2027-12-31'), 'depois de 2027'),
    zodField: () => z.date({ error: 'data inválida' }).min(D('2026-01-01'), 'antes de 2026').max(D('2027-12-31'), 'depois de 2027'),
    valid: D('2026-12-01'),
    invalid: [
      { value: D('2025-06-01'), message: 'antes de 2026', at: 'middle' },
      { value: D('2028-06-01'), message: 'depois de 2027', at: 'last' },
    ],
  },
  {
    id: 'date/min-ref', type: 'date', chain: 'required · min(ref(start))', rules: 2, crossField: true,
    yupField: () => yup.date().required('obrigatório').min(yup.ref('start'), 'termina antes de começar'),
    zodField: () => z.date({ error: 'obrigatório' }),
    siblings: { yup: { start: yup.date() }, zod: { start: z.date() }, value: { start: D('2026-12-01') } },
    zodRefine: (s) => s.refine((v: any) => v.x >= v.start, { message: 'termina antes de começar', path: ['x'] }),
    valid: D('2026-12-03'),
    invalid: [{ value: D('2026-11-30'), message: 'termina antes de começar', at: 'last' }],
  },

  // ───────────── array ─────────────
  {
    id: 'array/min', type: 'array', chain: 'min(1)', rules: 1,
    yupField: () => yup.array().of(yup.string()).min(1, 'escolha ao menos um'),
    zodField: () => z.array(z.string()).min(1, 'escolha ao menos um'),
    valid: ['music'],
    invalid: [{ value: [], message: 'escolha ao menos um', at: 'only' }],
  },
  {
    id: 'array/min-max-unique', type: 'array', chain: 'of(string · required) · min(1) · max(5) · test(únicos)', rules: 3,
    yupField: () => yup.array().of(yup.string().required('item vazio')).min(1, 'escolha ao menos um').max(5, 'no máximo 5')
      .test('unique', 'itens repetidos', (v) => !v || new Set(v).size === v.length),
    zodField: () => z.array(z.string().min(1, 'item vazio')).min(1, 'escolha ao menos um').max(5, 'no máximo 5')
      .refine((v) => new Set(v).size === v.length, 'itens repetidos'),
    valid: ['music', 'tech', 'arts'],
    invalid: [
      { value: [], message: 'escolha ao menos um', at: 'first' },
      { value: ['a', 'b', 'c', 'd', 'e', 'f'], message: 'no máximo 5', at: 'middle' },
      { value: ['a', 'a'], message: 'itens repetidos', at: 'last' },
    ],
  },
  {
    id: 'array/item', type: 'array', chain: 'item de of(object) · title required · min(3)', rules: 2, path: 'x[1].title',
    yupField: () => yup.array().of(yup.object({ title: yup.string().trim().required('título obrigatório').min(3, 'mínimo 3') })),
    zodField: () => z.string().trim().min(1, 'título obrigatório').min(3, 'mínimo 3'),
    zodX: () => z.array(z.object({ title: z.string().trim().min(1, 'título obrigatório').min(3, 'mínimo 3') })),
    valid: [{ title: 'Line-up' }, { title: 'Local' }, { title: 'Ingressos' }],
    invalid: [
      { value: [{ title: 'Line-up' }, { title: '' }, { title: 'Ingressos' }], message: 'título obrigatório', at: 'first' },
      { value: [{ title: 'Line-up' }, { title: 'Lo' }, { title: 'Ingressos' }], message: 'mínimo 3', at: 'last' },
    ],
  },

  // ───────────── object ─────────────
  {
    id: 'object/nested-leaf', type: 'object', chain: 'folha de objeto aninhado · required · matches', rules: 2, path: 'x.zip',
    yupField: () => yup.object({ zip: yup.string().required('obrigatório').matches(/^\d{5}-?\d{3}$/, 'CEP inválido'), city: yup.string() }),
    zodField: () => z.string().min(1, 'obrigatório').regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    zodX: () => z.object({ zip: z.string().min(1, 'obrigatório').regex(/^\d{5}-?\d{3}$/, 'CEP inválido'), city: z.string() }),
    valid: { zip: '50000-000', city: 'Recife' },
    invalid: [
      { value: { zip: '', city: 'Recife' }, message: 'obrigatório', at: 'first' },
      { value: { zip: '5000', city: 'Recife' }, message: 'CEP inválido', at: 'last' },
    ],
  },
  {
    id: 'object/test', type: 'object', chain: 'objeto inteiro · test(início < fim)', rules: 1,
    yupField: () => yup.object({ from: yup.number(), to: yup.number() })
      .test('range', 'intervalo invertido', (v) => !v || v.from === undefined || v.to === undefined || v.from < v.to),
    zodField: () => z.object({ from: z.number(), to: z.number() }).refine((v) => v.from < v.to, 'intervalo invertido'),
    valid: { from: 1, to: 5 },
    invalid: [{ value: { from: 5, to: 1 }, message: 'intervalo invertido', at: 'only' }],
  },

  // ───────────── mixed ─────────────
  {
    id: 'mixed/oneOf', type: 'mixed', chain: 'mixed · oneOf(3)', rules: 1,
    yupField: () => yup.mixed().oneOf(['a', 1, true], 'valor fora da lista'),
    zodField: () => z.union([z.literal('a'), z.literal(1), z.literal(true)], { error: 'valor fora da lista' }),
    valid: 1,
    invalid: [{ value: 'b', message: 'valor fora da lista', at: 'only' }],
  },
  {
    id: 'mixed/test', type: 'mixed', chain: 'mixed · test(arquivo ≤ 1 MB)', rules: 1,
    yupField: () => yup.mixed().test('size', 'arquivo grande demais', (v: any) => !v || v.size <= 1_000_000),
    zodField: () => z.any().refine((v) => !v || v.size <= 1_000_000, 'arquivo grande demais'),
    valid: { name: 'a.pdf', size: 1000 },
    invalid: [{ value: { name: 'a.pdf', size: 2_000_000 }, message: 'arquivo grande demais', at: 'only' }],
  },
];

/** Monta o formulário do caso nas duas bibliotecas. */
export function build(c: Case) {
  const yupForm = yup.object({ ...(c.siblings?.yup ?? {}), x: c.yupField() });
  const zodObject = z.object({ ...(c.siblings?.zod ?? {}), x: (c.zodX ?? c.zodField)() as any });
  const zodForm = c.zodRefine ? c.zodRefine(zodObject) : zodObject;
  const zodLocal = c.zodField();
  const data = (x: unknown): Record<string, any> => ({ ...(c.siblings?.value ?? {}), x });
  return { yupForm, zodForm, zodLocal, data, path: c.path ?? 'x' };
}

/** Valor que o "Zod local" valida: o do caminho, lido do formulário. */
export function valueAt(data: Record<string, any>, path: string): unknown {
  return path.split(/[.[\]]+/).filter(Boolean).reduce<any>((acc, key) => acc?.[key], data);
}

/** Erro de um caminho no Yup (como validateAtSync em src/core). */
export function yupErrorAt(form: yup.Schema, path: string, data: unknown): string | undefined {
  try {
    form.validateSyncAt(path, data);
    return undefined;
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;
    return error.path === path ? error.errors[0] : undefined;
  }
}

const pathKey = (path: PropertyKey[]) => path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`)).join('').replace(/^\./, '');

/** Erro de um caminho no Zod: local (sub-esquema) ou objeto inteiro + filtro (regras entre campos). */
export function zodErrorAt(c: Case, built: ReturnType<typeof build>, data: Record<string, any>): string | undefined {
  const { zodForm, zodLocal, path } = built;
  if (!c.crossField) {
    const r = zodLocal.safeParse(valueAt(data, path));
    return r.success ? undefined : r.error.issues[0].message;
  }
  const r = zodForm.safeParse(data);
  return r.success ? undefined : r.error.issues.find((i) => pathKey(i.path) === path)?.message;
}
