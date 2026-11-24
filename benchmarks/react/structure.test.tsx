import { it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import * as yup from 'yup';
import fs from 'node:fs';
// A = cópia fiel do hook anterior (limpar e regravar); TextField = campo com useNotFirstEffect + onBlur
import { stats, useValidatedFormStateA, TextField, MemoTextField, MemoDebouncedTextField } from './baseline-hooks.jsx';
import { useValidatedFormState } from '../../src/react/useValidatedFormState';
afterEach(() => cleanup());

// Mesmo roteiro dos benchmarks Vue e Angular: e-mail inválido até o último caractere, depois blur.
const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const s20 = make(20), s500 = make(500);
const TEXT = 'fulano.de.tal@exemplo.com'; // 25 teclas (contagens)
const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br'; // 54 teclas (tempo por tecla)

// conta validações sem quebrar a estabilidade dos callbacks
const wrapped = new Map<Function, Function>();
function countValidate(fn: () => void) {
  let w = wrapped.get(fn);
  if (!w) { w = () => { stats.validations++; fn(); }; wrapped.set(fn, w); }
  return w as () => void;
}
function useB(s: any) {
  const form = useValidatedFormState(s);
  return { ...form, field: (p: string) => { const f = form.field(p); return { ...f, onValidate: countValidate(f.onValidate) }; } };
}

function makeForm(useHook: any, Field: any) {
  return function Form({ schema }: { schema: yup.ObjectSchema<any> }) {
    const { field } = useHook(schema);
    return <form>{Object.keys(schema.fields).map((k) => <Field key={k} name={k} {...field(k)} />)}</form>;
  };
}

type Variant = { name: string; Form: any; debounce: boolean };
const VARIANTS: Variant[] = [
  { name: 'A · limpar e regravar, sem memo', Form: makeForm(useValidatedFormStateA, TextField), debounce: false },
  { name: 'B · gravação única, sem memo', Form: makeForm(useB, TextField), debounce: false },
  { name: 'C · gravação única + memo', Form: makeForm(useB, MemoTextField), debounce: false },
  { name: 'D · gravação única + memo + debounce 200ms', Form: makeForm(useB, MemoDebouncedTextField), debounce: true },
];

const flickers = (t: any[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };
const median = (xs: number[]) => [...xs].sort((a, b) => a - b).at(Math.floor(xs.length / 2))!;
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

async function type(variant: Variant, text: string, intervalMs: number) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  const { getByLabelText, container } = render(<variant.Form schema={s20} />);
  stats.reset();
  const input = getByLabelText('f0');
  const alert = () => container.querySelector('[role=alert]');
  let ms = 0;
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    await act(async () => { fireEvent.change(input, { target: { value: text.slice(0, i) } }); });
    await advance(intervalMs);
    ms += performance.now() - t0;
    // com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && (!variant.debounce || intervalMs > 200)) expect(alert()?.textContent).toBe('e-mail inválido');
  }
  await advance(300);
  await act(async () => { fireEvent.blur(input); });
  await advance(300);
  expect(alert()).toBeNull();
  const out = { keys: text.length, renders: stats.renders, validations: stats.validations, flickers: flickers(stats.errorTrail), usPerKey: (ms * 1000) / text.length };
  await act(async () => { fireEvent.change(input, { target: { value: '' } }); });
  await advance(300);
  expect(alert()?.textContent).toBe('obrigatório');
  cleanup();
  vi.useRealTimers();
  return out;
}

type Run = Awaited<ReturnType<typeof type>>;

async function mountMs(variant: Variant) {
  const t0 = performance.now();
  const { container } = render(<variant.Form schema={s500} />);
  const ms = performance.now() - t0;
  expect(container.querySelectorAll('input')).toHaveLength(500);
  cleanup();
  return ms;
}

const REPS = 15;

it('React: gravação do erro, memo, debounce e montagem', async () => {
  const out: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3): exatas, uma execução basta.
  for (const variant of VARIANTS) {
    const [slow, fast] = [await type(variant, TEXT, 250), await type(variant, TEXT, 60)];
    out[variant.name] = {
      '25 teclas · 250ms': { renders: slow.renders, validations: slow.validations, flickers: slow.flickers },
      '25 teclas · 60ms': { renders: fast.renders, validations: fast.validations, flickers: fast.flickers },
    };
  }

  // 54 teclas (seções 8.4 e 8.5) e montagem de 500 campos: intercalado, REPS repetições, mediana dos tempos.
  for (const variant of VARIANTS) await mountMs(variant); // aquecimento
  const runs: Record<string, { slow: Run[]; fast: Run[]; mount: number[] }> = {};
  for (let r = 0; r < REPS; r++) for (const variant of VARIANTS) {
    const run = (runs[variant.name] ??= { slow: [], fast: [], mount: [] });
    run.slow.push(await type(variant, LONG, 250));
    run.fast.push(await type(variant, LONG, 60));
    run.mount.push(await mountMs(variant));
  }
  const summary = (xs: Run[]) => ({ renders: xs[0].renders, validations: xs[0].validations, usPerKey: Math.round(median(xs.map((x) => x.usPerKey))) });
  for (const variant of VARIANTS) {
    const { slow, fast, mount } = runs[variant.name];
    Object.assign(out[variant.name], {
      '54 teclas · 250ms': summary(slow),
      '54 teclas · 60ms': summary(fast),
      'montagem 500 campos ms': +median(mount).toFixed(1),
    });
  }

  fs.writeFileSync('results/react-structure.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
}, 600000);
