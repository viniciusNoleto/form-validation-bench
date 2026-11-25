import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import * as yup from 'yup';
import { z } from 'zod';
import fs from 'node:fs';
import { astats, useRulesA, useRulesB, Form, type UseRules } from './frame';

const K = 20;
const keys = Array.from({ length: K }, (_, i) => `f${i}`);
const yupSchema = yup.object(Object.fromEntries(keys.map((k) => [k, k === 'f0'
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const zodSchema = z.object(Object.fromEntries(keys.map((k) => [k, k === 'f0'
  ? z.string().min(1, 'obrigatório').pipe(z.email('e-mail inválido')).default('')
  : z.string().min(1, 'obrigatório').default('')])));

const TEXT = 'fulano.de.tal@exemplo.com';

async function tick(fixture: ComponentFixture<unknown>, ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await fixture.whenStable();
}

async function typeInto(useRules: UseRules, schema: unknown, defaults: Record<string, string>, debounce: number, intervalMs: number) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  const fixture = TestBed.createComponent(Form);
  fixture.componentRef.setInput('useRules', useRules);
  fixture.componentRef.setInput('schema', schema);
  fixture.componentRef.setInput('defaults', defaults);
  fixture.componentRef.setInput('keys', keys);
  fixture.componentRef.setInput('debounce', debounce);
  const root: HTMLElement = fixture.nativeElement;
  await tick(fixture, 0);
  astats.reset();
  const input = root.querySelector<HTMLInputElement>('input[aria-label="f0"]')!;
  for (let i = 1; i <= TEXT.length; i++) {
    input.value = TEXT.slice(0, i);
    input.dispatchEvent(new Event('input'));
    await tick(fixture, intervalMs);
  }
  await tick(fixture, 300);
  input.dispatchEvent(new Event('blur'));
  await tick(fixture, 300);
  expect(root.querySelector('[role=alert]')).toBeNull();
  const t = astats.trail;
  let flickers = 0;
  for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) flickers++;
  const res = { keystrokes: TEXT.length, intervalMs, frameRenders: astats.frameRenders, validations: astats.validations, flickers };
  input.value = '';
  input.dispatchEvent(new Event('input'));
  await tick(fixture, 300);
  expect(root.querySelector('[role=alert]')?.textContent).toBe('obrigatório');
  fixture.destroy();
  vi.useRealTimers();
  return res;
}

const yupDefaults = yupSchema.getDefault() as Record<string, string>;
const zodDefaults = zodSchema.parse({}) as Record<string, string>;

describe('ciclo Angular — 25 teclas num campo de e-mail + blur, 20 campos (signals, sem zone.js)', () => {
  const out: Record<string, unknown> = {};
  afterEach(() => vi.useRealTimers());
  it('A debounce 250ms', async () => { out['A · debounce 200 · tecla a cada 250ms'] = await typeInto(useRulesA, yupSchema, yupDefaults, 200, 250); });
  it('A debounce 60ms', async () => { out['A · debounce 200 · tecla a cada 60ms'] = await typeInto(useRulesA, yupSchema, yupDefaults, 200, 60); });
  it('A sem debounce, 60ms', async () => { out['A · sem debounce · tecla a cada 60ms'] = await typeInto(useRulesA, yupSchema, yupDefaults, 0, 60); });
  it('B debounce 250ms', async () => { out['B · debounce 200 · tecla a cada 250ms'] = await typeInto(useRulesB, zodSchema, zodDefaults, 200, 250); });
  it('B debounce 60ms', async () => { out['B · debounce 200 · tecla a cada 60ms'] = await typeInto(useRulesB, zodSchema, zodDefaults, 200, 60); });
  it('B sem debounce, 60ms', async () => { out['B · sem debounce · tecla a cada 60ms'] = await typeInto(useRulesB, zodSchema, zodDefaults, 0, 60); });
  it('relatório', () => { console.table(out); fs.writeFileSync('experiments/initial/results/angular.json', JSON.stringify(out, null, 2)); });
});
