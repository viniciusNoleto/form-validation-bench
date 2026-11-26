import { it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import * as yup from 'yup';
import { stats } from './baseline-hooks.jsx';
// Formulários das variantes (A = reconstrução do hook anterior de produção; ver forms.tsx)
import { FORMS } from './forms';
import { RUN, shuffled, writeRun } from '../shared/runs.mjs';
afterEach(() => cleanup());

// Mesmo roteiro dos benchmarks Vue e Angular: e-mail inválido até o último caractere, depois blur.
const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const SCHEMAS: Record<number, yup.ObjectSchema<any>> = { 20: make(20), 100: make(100), 500: make(500) };
const TEXT = 'fulano.de.tal@exemplo.com'; // 25 teclas (contagens)
const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br'; // 54 teclas (tempo por tecla)

type Variant = { key: string; name: string; Form: any; debounce: boolean; validates: boolean };
const V = (key: string, name: string, Form: any, opts: Partial<Variant> = {}): Variant => ({ key, name, Form, debounce: false, validates: true, ...opts });
const VARIANTS: Variant[] = [
  V('H', 'H · input sem validação (linha de base do harness), memo', FORMS.H, { validates: false }),
  V('A', 'A · forma anterior de produção: assíncrono, limpar e regravar, sem memo', FORMS.A),
  V('A2', 'A2 · hook atual, assíncrono, limpar e regravar, sem memo', FORMS.A2),
  V('A3', 'A3 · hook atual, síncrono, limpar e regravar, sem memo', FORMS.A3),
  V('B0', 'B0 · gravação única dentro do updater do setErrors, sem memo', FORMS.B0),
  V('B', 'B · gravação única antecipada, sem memo', FORMS.B),
  V('C0', 'C0 · gravação única dentro do updater do setErrors (versão anterior) + memo', FORMS.C0),
  V('C', 'C · gravação única antecipada, sem setErrors quando nada muda, + memo (forma adotada)', FORMS.C),
  V('D', 'D · gravação única + memo + debounce 200 ms', FORMS.D, { debounce: true }),
  V('F', 'F · frame genérico + contexto, gravação antecipada + memo', FORMS.F),
  V('O', 'O · observador do formulário (useEffect sobre o estado) + gravação antecipada + memo; o campo só valida no blur', FORMS.O),
  // Bibliotecas (benchmarks/react/libs.tsx): o mesmo esquema Yup, do jeito que cada documentação recomenda.
  V('RHF', 'RHF · React Hook Form 7 (mode onChange, yupResolver, register + useFormState por campo)', FORMS.RHF),
  V('TSF', 'TSF · TanStack Form 1 (validadores do formulário com o esquema, Standard Schema, na mudança e no blur)', FORMS.TSF),
  V('FMK', 'FMK · Formik 2 (validationSchema, validateOnChange e validateOnBlur, <Field>)', FORMS.FMK),
].filter((v) => !process.env.BENCH_ONLY || process.env.BENCH_ONLY.split(',').includes(v.key));
const byKey = Object.fromEntries(VARIANTS.map((v) => [v.key, v]));

const flickers = (t: any[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

/**
 * Digita `text` no campo f0 de um formulário de `n` campos, uma tecla a cada `intervalMs`, e sai do campo.
 * Janela medida: cada tecla (change + act) e o avanço do relógio até a próxima, mais os 300 ms finais
 * em que um debounce pendente dispara; ficam fora as asserções e o blur.
 */
async function type(variant: Variant, text: string, intervalMs: number, n = 20) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  const { getByLabelText, container } = render(<variant.Form schema={SCHEMAS[n]} />);
  stats.reset();
  const input = getByLabelText('f0');
  const alert = () => container.querySelector('[role=alert]');
  let ms = 0;
  let keyMs = 0; // só a tecla (change + act); o resto da janela é o avanço do relógio falso
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    await act(async () => { fireEvent.change(input, { target: { value: text.slice(0, i) } }); });
    keyMs += performance.now() - t0;
    await advance(intervalMs);
    ms += performance.now() - t0;
    // com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && variant.validates && (!variant.debounce || intervalMs > 200)) expect(alert()?.textContent).toBe('e-mail inválido');
    if (!variant.validates) expect(alert()).toBeNull();
  }
  const t1 = performance.now();
  await advance(300);
  ms += performance.now() - t1;
  await act(async () => { fireEvent.blur(input); });
  await advance(300);
  expect(alert()).toBeNull();
  const out = {
    renders: stats.renders, formRenders: stats.formRenders, validations: stats.validations,
    whole: stats.whole, flickers: flickers(stats.errorTrail), usPerKey: (ms * 1000) / text.length, keyUsPerKey: (keyMs * 1000) / text.length,
  };
  await act(async () => { fireEvent.change(input, { target: { value: '' } }); });
  await advance(300);
  if (variant.validates) expect(alert()?.textContent).toBe('obrigatório');
  cleanup();
  // validações assíncronas pendentes (bibliotecas) terminam aqui, antes da próxima tarefa zerar as contagens
  await vi.advanceTimersByTimeAsync(1000);
  vi.useRealTimers();
  return out;
}
type Run = Awaited<ReturnType<typeof type>>;

async function mountMs(variant: Variant) {
  const t0 = performance.now();
  const { container } = render(<variant.Form schema={SCHEMAS[500]} />);
  const ms = performance.now() - t0;
  expect(container.querySelectorAll('input')).toHaveLength(500);
  cleanup();
  // validações que a biblioteca agendou na montagem (relógio real) terminam aqui, fora da próxima tarefa
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  return ms;
}

const REPS = Number(process.env.BENCH_REPS ?? 15);
const round = (x: number) => +x.toFixed(1);
/** Contagens das 15 repetições precisam ser idênticas: o roteiro é determinístico. */
function counts(xs: Run[]) {
  for (const k of ['renders', 'formRenders', 'validations', 'whole', 'flickers'] as const) expect(new Set(xs.map((x) => x[k])).size, k).toBe(1);
  const { renders, formRenders, validations, whole, flickers } = xs[0];
  return { renders, formRenders, validations, whole, flickers, samples_us: xs.map((x) => round(x.usPerKey)), samples_key_us: xs.map((x) => round(x.keyUsPerKey)) };
}

it('React: gravação do erro, memo, debounce, montagem e escala', async () => {
  const variants: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3).
  for (const v of VARIANTS) {
    const [slow, fast] = [await type(v, TEXT, 250), await type(v, TEXT, 60)];
    const c = ({ renders, formRenders, validations, whole, flickers }: Run) => ({ renders, formRenders, validations, whole, flickers });
    variants[v.key] = { name: v.name, counts25: { '250ms': c(slow), '60ms': c(fast) } };
  }

  // Escala: as células com 100 e 500 campos entram no MESMO sorteio das variantes (um bloco só);
  // a célula com 20 campos é a própria medição da variante (54 teclas, 250 ms).
  const SCALE = ['H', 'C', 'C0', 'B', 'O', 'RHF', 'TSF', 'FMK'].filter((k) => byKey[k]);
  const cells = SCALE.flatMap((key) => [100, 500].map((n) => ({ key, n })));

  // Aquecimento da digitação, da montagem e das células de escala.
  for (const v of VARIANTS) { await type(v, LONG, 60); await mountMs(v); }
  for (const { key, n } of cells) await type(byKey[key], LONG, 250, n);

  // 54 teclas (seções 8.4 e 8.5), montagem de 500 campos e escala: REPS repetições, ordem sorteada a cada repetição.
  type Task = { v: Variant; n?: number };
  const tasks: Task[] = [...VARIANTS.map((v) => ({ v })), ...cells.map(({ key, n }) => ({ v: byKey[key], n }))];
  const runs: Record<string, { slow: Run[]; fast: Run[]; mount: number[] }> = {};
  const scaling: Record<string, Run[]> = {};
  for (let r = 0; r < REPS; r++) for (const { v, n } of shuffled(tasks, RUN * 1000 + r)) {
    if (n) { (scaling[`${v.key}@${n}`] ??= []).push(await type(v, LONG, 250, n)); continue; }
    const run = (runs[v.key] ??= { slow: [], fast: [], mount: [] });
    run.slow.push(await type(v, LONG, 250));
    run.fast.push(await type(v, LONG, 60));
    run.mount.push(await mountMs(v));
  }
  for (const v of VARIANTS) {
    const { slow, fast, mount } = runs[v.key];
    Object.assign(variants[v.key], { keys54: { '250ms': counts(slow), '60ms': counts(fast) }, mount500_ms: mount.map(round) });
  }
  for (const key of SCALE) scaling[`${key}@20`] = runs[key].slow;

  const file = writeRun('react', {
    method: 'jsdom + @testing-library/react, inputs HTML; renders = renders do componente de campo; formRenders = renders do formulário pai; variantes e escala no mesmo sorteio',
    variants,
    scaling: Object.fromEntries(Object.entries(scaling).map(([k, xs]) => [k, { key: k.split('@')[0], n: +k.split('@')[1], ...counts(xs) }])),
  });
  console.log('gravado em', file);
}, 3_600_000);
