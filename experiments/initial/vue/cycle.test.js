import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, ref, defineComponent, nextTick } from 'vue';
import * as yup from 'yup';
import { z } from 'zod';
import fs from 'node:fs';
import { vstats, useRulesA, useRulesB } from './frame.js';
import FormSfc from './Form.vue';

const K = 20;
const keys = Array.from({ length: K }, (_, i) => `f${i}`);
const yupSchema = yup.object(Object.fromEntries(keys.map(k => [k, k === 'f0'
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const zodSchema = z.object(Object.fromEntries(keys.map(k => [k, k === 'f0'
  ? z.string().min(1, 'obrigatório').pipe(z.email('e-mail inválido')).default('')
  : z.string().min(1, 'obrigatório').default('')])));

function makeForm(useRules, schema, defaults, debounce) {
  return { render: () => h(FormSfc, { useRules, schema, defaults, keys, debounce }) };
}

const flush = async () => { for (let i = 0; i < 10; i++) { await Promise.resolve(); } await nextTick(); };
const TEXT = 'fulano.de.tal@exemplo.com';

async function typeInto(Form, intervalMs) {
  vi.useFakeTimers();
  const w = mount(Form, { attachTo: document.body });
  await flush();
  vstats.reset();
  const input = w.find('input[aria-label="f0"]');
  for (let i = 1; i <= TEXT.length; i++) {
    await input.setValue(TEXT.slice(0, i));
    await vi.advanceTimersByTimeAsync(intervalMs);
    await flush();
  }
  await vi.advanceTimersByTimeAsync(300); await flush();
  await input.trigger('blur');
  await vi.advanceTimersByTimeAsync(300); await flush();
  expect(w.find('[role=alert]').exists()).toBe(false);
  const res = { keystrokes: TEXT.length, intervalMs, frameRenders: vstats.frameRenders, validations: vstats.validations, flickers: (() => { let n = 0; const t = vstats.trail; for (let i = 2; i < t.length; i++) if (t[i-2] && t[i-1] === null && t[i] === t[i-2]) n++; return n; })() };
  await input.setValue('');
  await vi.advanceTimersByTimeAsync(300); await flush();
  expect(w.find('[role=alert]').text()).toBe('obrigatório');
  w.unmount(); vi.useRealTimers();
  return res;
}

const yupDefaults = yupSchema.getDefault();
const zodDefaults = zodSchema.parse({});

describe('ciclo Vue — 25 teclas num campo de e-mail + blur, 20 campos', () => {
  const out = {};
  afterEach(() => vi.useRealTimers());
  it('A sem debounce (digitação lenta, 250ms)', async () => { out['A · debounce 200 · tecla a cada 250ms'] = await typeInto(makeForm(useRulesA, yupSchema, yupDefaults, 200), 250); });
  it('A com debounce (digitação rápida, 60ms)', async () => { out['A · debounce 200 · tecla a cada 60ms'] = await typeInto(makeForm(useRulesA, yupSchema, yupDefaults, 200), 60); });
  it('A sem debounce, 60ms', async () => { out['A · sem debounce · tecla a cada 60ms'] = await typeInto(makeForm(useRulesA, yupSchema, yupDefaults, 0), 60); });
  it('B debounce 250ms', async () => { out['B · debounce 200 · tecla a cada 250ms'] = await typeInto(makeForm(useRulesB, zodSchema, zodDefaults, 200), 250); });
  it('B debounce 60ms', async () => { out['B · debounce 200 · tecla a cada 60ms'] = await typeInto(makeForm(useRulesB, zodSchema, zodDefaults, 200), 60); });
  it('B sem debounce, 60ms', async () => { out['B · sem debounce · tecla a cada 60ms'] = await typeInto(makeForm(useRulesB, zodSchema, zodDefaults, 0), 60); });
  it('relatório', () => { console.table(out); fs.writeFileSync('experiments/initial/results/vue.json', JSON.stringify(out, null, 2)); });
});
