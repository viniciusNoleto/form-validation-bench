import { describe, it, expect } from 'vitest';
import { CASES, build, yupErrorAt, zodErrorAt } from '../../benchmarks/types/cases';
import { validateAtSync } from '../../src/core/formCore';

// Cada cadeia de regras, em cada tipo de dado, precisa dar a MESMA resposta no Yup e no Zod
// antes de o seu custo valer (benchmarks/types/bench.mjs). O valor válido não tem erro; cada
// valor inválido reprova exatamente a regra esperada.
describe.each(CASES.map((c) => [c.id, c] as const))('%s', (_id, c) => {
  const built = build(c);
  const { yupForm, data, path } = built;

  it('valor válido: nenhum erro (Yup, núcleo do padrão e Zod)', () => {
    expect(yupErrorAt(yupForm, path, data(c.valid))).toBeUndefined();
    expect(validateAtSync(yupForm, path, data(c.valid))).toBeUndefined();
    expect(zodErrorAt(c, built, data(c.valid))).toBeUndefined();
  });

  it.each(c.invalid.map((inv) => [inv.at, inv.message, inv] as const))('inválido (%s): "%s"', (_at, message, inv) => {
    // divergências documentadas no catálogo: o Yup responde outra coisa (ou aceita)
    const yupExpected = 'yupMessage' in inv ? (inv.yupMessage ?? undefined) : message;
    expect(yupErrorAt(yupForm, path, data(inv.value))).toBe(yupExpected);
    expect(validateAtSync(yupForm, path, data(inv.value))).toBe(yupExpected);
    expect(zodErrorAt(c, built, data(inv.value))).toBe(message);
  });

  it('a validação do caminho não depende de irmãos inválidos sem relação', () => {
    const noisy = { ...data(c.valid), unrelated: 'qualquer coisa' };
    expect(yupErrorAt(yupForm, path, noisy)).toBeUndefined();
  });
});

it('o catálogo cobre os sete tipos de dado e cadeias de 1 a 5 regras', () => {
  expect(new Set(CASES.map((c) => c.type))).toEqual(new Set(['string', 'number', 'boolean', 'date', 'array', 'object', 'mixed']));
  expect(Math.min(...CASES.map((c) => c.rules))).toBe(1);
  expect(Math.max(...CASES.map((c) => c.rules))).toBe(5);
  expect(CASES.filter((c) => c.crossField).length).toBeGreaterThanOrEqual(4);
});
