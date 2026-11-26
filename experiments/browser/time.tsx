// Monta, num navegador real, um formulário do benchmark React ou Vue (os mesmos componentes do
// roteiro em jsdom) para medir o tempo da thread principal por tecla (experiments/browser/time.mjs).
// ?fw=react|vue&variant=<sigla>&n=<campos>
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createApp, h } from 'vue';
import PrimeVue from 'primevue/config';
import * as yup from 'yup';
import { FORMS } from '../../benchmarks/react/forms';

const VUE = import.meta.glob('../../benchmarks/vue/components/Form{H,W,WC,WCS,WA,O,OP}{20,500}.vue', { eager: true, import: 'default' }) as Record<string, any>;

const q = new URLSearchParams(location.search);
const fw = q.get('fw') ?? 'react';
const variant = q.get('variant') ?? 'C';
const n = Number(q.get('n') ?? 20);
const schema = yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));

const el = document.getElementById('app')!;
if (fw === 'react') {
  const Form = (FORMS as Record<string, any>)[variant];
  if (!Form) throw new Error(`variante React desconhecida: ${variant}`);
  flushSync(() => createRoot(el).render(createElement(Form, { schema })));
} else {
  const Form = VUE[`../../benchmarks/vue/components/Form${variant}${n}.vue`];
  if (!Form) throw new Error(`formulário Vue não gerado: Form${variant}${n}.vue`);
  createApp({ render: () => h(Form, { schema }) }).use(PrimeVue, { unstyled: true }).mount(el);
}
(window as any).__ready = true;
(window as any).__alert = () => document.querySelector('input[aria-label="f0"]')?.closest('label')?.querySelector('[role=alert]')?.textContent ?? null;
