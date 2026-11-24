import { it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import PrimeVue from 'primevue/config';
import * as yup from 'yup';
import fs from 'node:fs';
import { stats } from './stats';
import FormW20 from './components/FormW20.vue';
import FormF20 from './components/FormF20.vue';
import FormFW20 from './components/FormFW20.vue';
import FormWC20 from './components/FormWC20.vue';
import FormW500 from './components/FormW500.vue';
import FormF500 from './components/FormF500.vue';
import FormFW500 from './components/FormFW500.vue';
import FormWC500 from './components/FormWC500.vue';
import FormWD20 from './components/FormWD20.vue';
import FormWD500 from './components/FormWD500.vue';

const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const s20 = make(20), s500 = make(500);
const global = { plugins: [[PrimeVue, { unstyled: true }]] as any };
const TEXT = 'fulano.de.tal@exemplo.com';
const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br';
const flush = async () => { await flushPromises(); await nextTick(); };
const flickers = (t: (string | null)[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };
const fake = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });

/** Digita `text` no campo f0, uma tecla a cada `intervalMs`, e sai do campo. */
async function type(Comp: any, text: string, intervalMs: number, debounce: boolean) {
  fake();
  const w = mount({ render: () => h(Comp, { schema: s20 }) }, { attachTo: document.body, global });
  await flush(); stats.reset();
  const input = w.find('input[aria-label="f0"]');
  let ms = 0;
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    await input.setValue(text.slice(0, i));
    await vi.advanceTimersByTimeAsync(intervalMs); await flush();
    ms += performance.now() - t0;
    // como no React e no Angular; com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && (!debounce || intervalMs > 200)) expect(w.find('[role=alert]').text()).toBe('e-mail inválido');
  }
  await vi.advanceTimersByTimeAsync(300); await flush();
  await input.trigger('blur'); await vi.advanceTimersByTimeAsync(300); await flush();
  expect(w.find('[role=alert]').exists()).toBe(false);
  const out = { keys: text.length, updates: stats.updates, validations: stats.validations, flickers: flickers(stats.trail), usPerKey: (ms * 1000) / text.length };
  await input.setValue(''); await vi.advanceTimersByTimeAsync(300); await flush();
  expect(w.find('[role=alert]').text()).toBe('obrigatório');
  w.unmount(); vi.useRealTimers();
  return out;
}
type Run = Awaited<ReturnType<typeof type>>;

async function mountMs(Comp: any) {
  const t0 = performance.now();
  const w = mount({ render: () => h(Comp, { schema: s500 }) }, { global });
  await nextTick();
  const ms = performance.now() - t0;
  w.unmount();
  return ms;
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b).at(Math.floor(xs.length / 2))!;
const REPS = 15;

it('Vue: estrutura do campo, gravação do erro, debounce e montagem', async () => {
  const variants: [string, any, any, boolean][] = [
    ['W · wrapper por tipo, evento', FormW20, FormW500, false],
    ['F · frame + provide/inject, evento', FormF20, FormF500, false],
    ['FW · frame + provide/inject, watch + debounce', FormFW20, FormFW500, true],
    ['WC · wrapper por tipo, limpar e regravar', FormWC20, FormWC500, false],
    ['WD · wrapper por tipo, evento + debounce 200ms', FormWD20, FormWD500, true],
  ];
  const out: Record<string, any> = {};

  // Contagens com 25 teclas (seção 8.3): exatas, uma execução basta.
  for (const [name, C20, , debounce] of variants) {
    const [slow, fast] = [await type(C20, TEXT, 250, debounce), await type(C20, TEXT, 60, debounce)];
    out[name] = {
      '25 teclas · 250ms': { updates: slow.updates, validations: slow.validations, flickers: slow.flickers },
      '25 teclas · 60ms': { updates: fast.updates, validations: fast.validations, flickers: fast.flickers },
    };
  }

  // 54 teclas (seções 8.4 e 8.5) e montagem de 500 campos: intercalado, REPS repetições, mediana dos tempos.
  for (const [, , C500] of variants) await mountMs(C500); // aquecimento
  const runs: Record<string, { slow: Run[]; fast: Run[]; mount: number[] }> = {};
  for (let r = 0; r < REPS; r++) for (const [name, C20, C500, debounce] of variants) {
    const run = (runs[name] ??= { slow: [], fast: [], mount: [] });
    run.slow.push(await type(C20, LONG, 250, debounce));
    run.fast.push(await type(C20, LONG, 60, debounce));
    run.mount.push(await mountMs(C500));
  }
  const summary = (xs: Run[]) => ({ updates: xs[0].updates, validations: xs[0].validations, usPerKey: Math.round(median(xs.map((x) => x.usPerKey))) });
  for (const [name] of variants) {
    const { slow, fast, mount } = runs[name];
    Object.assign(out[name], {
      '54 teclas · 250ms': summary(slow),
      '54 teclas · 60ms': summary(fast),
      'montagem 500 campos ms': +median(mount).toFixed(1),
    });
  }

  fs.writeFileSync('results/vue-structure.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
}, 600000);
