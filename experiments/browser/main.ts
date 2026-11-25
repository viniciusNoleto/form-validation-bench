// Monta um formulário do benchmark Vue (W ou WC, 20 campos) num navegador real e expõe uma sonda:
// - domFlickers: o elemento de erro do campo f0 é removido do DOM e volta, igual, depois (o que o
//   jsdom conta como atualização intermediária sem a mensagem);
// - paintedFlickers: num quadro (requestAnimationFrame, antes da pintura) a mensagem está ausente,
//   entre dois quadros em que está presente com o mesmo texto: o estado que o usuário veria.
import { createApp, h } from 'vue';
import PrimeVue from 'primevue/config';
import * as yup from 'yup';
import FormW20 from '../../benchmarks/vue/components/FormW20.vue';
import FormWC20 from '../../benchmarks/vue/components/FormWC20.vue';

const FORMS: Record<string, any> = { W: FormW20, WC: FormWC20 };
const variant = new URLSearchParams(location.search).get('variant') ?? 'W';
const schema = yup.object(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));

createApp({ render: () => h(FORMS[variant], { schema }) }).use(PrimeVue, { unstyled: true }).mount('#app');

const alertText = () => document.querySelector('input[aria-label="f0"]')?.closest('label')?.querySelector('[role=alert]')?.textContent ?? null;
const flickers = (t: (string | null)[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };

const probe = { domTrail: [] as (string | null)[], frameTrail: [] as (string | null)[], frames: 0, running: false };
(window as any).__probe = {
  start() {
    probe.running = true;
    const label = document.querySelector('input[aria-label="f0"]')!.closest('label')!;
    new MutationObserver(() => { if (probe.running) probe.domTrail.push(alertText()); })
      .observe(label, { childList: true, subtree: true, characterData: true });
    const frame = () => {
      if (!probe.running) return;
      probe.frames++;
      const t = alertText();
      if (probe.frameTrail[probe.frameTrail.length - 1] !== t) probe.frameTrail.push(t); // só mudanças entre quadros
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },
  stop() {
    probe.running = false;
    return { variant, frames: probe.frames, domFlickers: flickers(probe.domTrail), paintedFlickers: flickers(probe.frameTrail), domChanges: probe.domTrail.length, frameChanges: probe.frameTrail.length };
  },
};
