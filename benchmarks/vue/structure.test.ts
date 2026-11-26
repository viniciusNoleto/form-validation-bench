import { it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import PrimeVue from 'primevue/config';
import * as yup from 'yup';
import { plugin as formKit, defaultConfig as formKitConfig } from '@formkit/vue';
import { stats } from './stats';
import { RUN, shuffled, writeRun } from '../shared/runs.mjs';

// Formulários gerados por benchmarks/vue/generate.mjs: Form<variante><campos>.vue
const COMPONENTS = import.meta.glob('./components/Form*.vue', { eager: true, import: 'default' }) as Record<string, any>;
const form = (key: string, n: number) => {
  const c = COMPONENTS[`./components/Form${key}${n}.vue`];
  if (!c) throw new Error(`Form${key}${n}.vue não gerado`);
  return c;
};

const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const SCHEMAS: Record<number, yup.ObjectSchema<any>> = { 20: make(20), 100: make(100), 500: make(500) };
const global = { plugins: [[PrimeVue, { unstyled: true }]] as any };
// O FormKit precisa do próprio plugin; só os formulários FormKit o recebem.
const globalFor = (v: Variant) => (v.key === 'FK' ? { plugins: [...global.plugins, [formKit, formKitConfig()]] as any } : global);
const TEXT = 'fulano.de.tal@exemplo.com';
const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br';
const flush = async () => { await flushPromises(); await nextTick(); };
const flickers = (t: (string | null)[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };
const fake = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });

type Variant = { key: string; name: string; debounce: boolean; validates: boolean };
const V = (key: string, name: string, opts: Partial<Variant> = {}): Variant => ({ key, name, debounce: false, validates: true, ...opts });
const VARIANTS: Variant[] = [
  V('H', 'H · wrapper sem validação (linha de base do harness)', { validates: false }),
  V('W', 'W · wrapper por tipo, validação no evento (forma adotada)'),
  V('F', 'F · frame + provide/inject, validação no evento'),
  V('FWN', 'FWN · frame + provide/inject, watch sem debounce'),
  V('FW', 'FW · frame + provide/inject, watch + debounce 200 ms', { debounce: true }),
  V('WC', 'WC · wrapper, assíncrono, limpar e regravar (forma anterior)'),
  V('WCS', 'WCS · wrapper, síncrono, limpar e regravar'),
  V('WD', 'WD · wrapper, evento + debounce 200 ms', { debounce: true }),
  V('O', 'O · observador do formulário (watch profundo + cópia anterior); o campo só valida no blur'),
  V('WV', 'WV · wrapper por tipo declarado num v-for'),
  V('FV', 'FV · frame num v-for, o slot usa a variável do laço'),
  V('FVN', 'FVN · frame num v-for, o slot não usa a variável do laço'),
  V('WA', 'WA · wrapper, assíncrono, gravação única (sem limpar)'),
  V('OP', 'OP · observador do formulário com um watch por caminho (sem cópia); o campo só valida no blur'),
  // Bibliotecas (benchmarks/vue/libs.ts): o mesmo esquema Yup, do jeito que cada documentação recomenda.
  V('VV', 'VV · VeeValidate 4 (useForm com validationSchema, useField por campo)'),
  V('VLD', 'VLD · Vuelidate 2 ($autoDirty, regra por campo que valida o caminho no esquema)'),
  V('FK', 'FK · FormKit 2 (inputs FormKit, regra por campo que valida o caminho no esquema, atraso padrão de 20 ms)'),
].filter((v) => !process.env.BENCH_ONLY || process.env.BENCH_ONLY.split(',').includes(v.key));
const byKey = Object.fromEntries(VARIANTS.map((v) => [v.key, v]));

/**
 * Digita `text` no campo f0, uma tecla a cada `intervalMs`, e sai do campo.
 * Janela medida: cada tecla e o avanço do relógio até a próxima, mais os 300 ms finais em que
 * um debounce pendente dispara; ficam fora as asserções e o blur.
 */
async function type(v: Variant, text: string, intervalMs: number, n = 20) {
  fake();
  const w = mount({ render: () => h(form(v.key, n), { schema: SCHEMAS[n] }) }, { attachTo: document.body, global: globalFor(v) });
  await flush(); stats.reset();
  const input = w.find('input[aria-label="f0"]');
  let ms = 0;
  let keyMs = 0; // só a tecla (setValue, que já espera o nextTick); o resto é o avanço do relógio falso
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    await input.setValue(text.slice(0, i));
    keyMs += performance.now() - t0;
    await vi.advanceTimersByTimeAsync(intervalMs); await flush();
    ms += performance.now() - t0;
    // como no React e no Angular; com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && v.validates && (!v.debounce || intervalMs > 200)) expect(w.find('[role=alert]').text()).toBe('e-mail inválido');
    if (!v.validates) expect(w.find('[role=alert]').exists()).toBe(false);
  }
  const t1 = performance.now();
  await vi.advanceTimersByTimeAsync(300); await flush();
  ms += performance.now() - t1;
  await input.trigger('blur'); await vi.advanceTimersByTimeAsync(300); await flush();
  expect(w.find('[role=alert]').exists()).toBe(false);
  const out = { updates: stats.updates, formUpdates: stats.formUpdates, validations: stats.validations, whole: stats.whole, flickers: flickers(stats.trail), usPerKey: (ms * 1000) / text.length, keyUsPerKey: (keyMs * 1000) / text.length };
  await input.setValue(''); await vi.advanceTimersByTimeAsync(300); await flush();
  if (v.validates) expect(w.find('[role=alert]').text()).toBe('obrigatório');
  w.unmount();
  // validações assíncronas pendentes (bibliotecas) terminam aqui, antes da próxima tarefa zerar as contagens
  await vi.advanceTimersByTimeAsync(1000); await flush();
  vi.useRealTimers();
  return out;
}
type Run = Awaited<ReturnType<typeof type>>;

async function mountMs(v: Variant) {
  const t0 = performance.now();
  const w = mount({ render: () => h(form(v.key, 500), { schema: SCHEMAS[500] }) }, { global: globalFor(v) });
  await nextTick();
  const ms = performance.now() - t0;
  expect(w.findAll('input')).toHaveLength(500);
  w.unmount();
  // validações que a biblioteca agendou na montagem (relógio real) terminam aqui, fora da próxima tarefa
  await new Promise((r) => setTimeout(r, 100)); await flushPromises();
  return ms;
}

const REPS = Number(process.env.BENCH_REPS ?? 15);
const round = (x: number) => +x.toFixed(1);
/** Contagens das repetições precisam ser idênticas: o roteiro é determinístico. */
function counts(xs: Run[]) {
  for (const k of ['updates', 'formUpdates', 'validations', 'whole', 'flickers'] as const) expect(new Set(xs.map((x) => x[k])).size, k).toBe(1);
  const { updates, formUpdates, validations, whole, flickers } = xs[0];
  return { updates, formUpdates, validations, whole, flickers, samples_us: xs.map((x) => round(x.usPerKey)), samples_key_us: xs.map((x) => round(x.keyUsPerKey)) };
}

it('Vue: estrutura do campo, gravação do erro, debounce, montagem e escala', async () => {
  const variants: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3).
  for (const v of VARIANTS) {
    const [slow, fast] = [await type(v, TEXT, 250), await type(v, TEXT, 60)];
    const c = ({ updates, formUpdates, validations, whole, flickers }: Run) => ({ updates, formUpdates, validations, whole, flickers });
    variants[v.key] = { name: v.name, counts25: { '250ms': c(slow), '60ms': c(fast) } };
  }

  // Escala: as células com 100 e 500 campos entram no MESMO sorteio das variantes (um bloco só);
  // a célula com 20 campos é a própria medição da variante (54 teclas, 250 ms).
  const SCALE = ['H', 'W', 'O', 'OP', 'VV', 'VLD', 'FK'].filter((k) => byKey[k]);
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

  const file = writeRun('vue', {
    method: 'jsdom + @vue/test-utils, InputText do PrimeVue; updates = onBeforeUpdate dos componentes de campo; formUpdates = do formulário pai; variantes e escala no mesmo sorteio',
    variants,
    scaling: Object.fromEntries(Object.entries(scaling).map(([k, xs]) => [k, { key: k.split('@')[0], n: +k.split('@')[1], ...counts(xs) }])),
  });
  console.log('gravado em', file);
}, 3_600_000);
