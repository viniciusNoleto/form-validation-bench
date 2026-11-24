import { expect, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import * as yup from 'yup';
import { BenchForm } from './BenchForm';
import { clearThenSetForm, finalForm, type BenchForm as BenchFormApi } from './forms';
import { stats } from './stats';

// Mesmo roteiro dos benchmarks React e Vue: e-mail inválido até o último caractere, depois blur.
const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const s20 = make(20), s500 = make(500);
const keys20 = Object.keys(s20.fields), keys500 = Object.keys(s500.fields);
export const TEXT = 'fulano.de.tal@exemplo.com'; // 25 teclas (contagens)
export const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br'; // 54 teclas (tempo por tecla, debounce)

export type Variant = { name: string; form: (schema: yup.ObjectSchema<any>) => BenchFormApi; debounce: boolean };
export const W: Variant = { name: 'W · wrapper por tipo, evento', form: finalForm, debounce: false };
export const WC: Variant = { name: 'WC · wrapper por tipo, limpar e regravar', form: clearThenSetForm, debounce: false };
export const WD: Variant = { name: 'WD · wrapper por tipo, evento + debounce 200ms', form: finalForm, debounce: true };

const flickers = (t: (string | null)[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };
export const median = (xs: number[]) => [...xs].sort((a, b) => a - b).at(Math.floor(xs.length / 2))!;

function create(variant: Variant, schema: yup.ObjectSchema<any>, keys: string[]) {
  const fixture = TestBed.createComponent(BenchForm);
  fixture.componentRef.setInput('form', variant.form(schema));
  fixture.componentRef.setInput('keys', keys);
  fixture.componentRef.setInput('debounce', variant.debounce);
  return fixture;
}

/** Avança o relógio falso (dispara o agendador do Angular e o debounce) e espera a view estabilizar. */
async function tick(fixture: ComponentFixture<unknown>, ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await fixture.whenStable();
}

/** Digita `text` no campo f0, uma tecla a cada `intervalMs`, e sai do campo. */
export async function type(variant: Variant, text: string, intervalMs: number) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  const fixture = create(variant, s20, keys20);
  const root: HTMLElement = fixture.nativeElement;
  await tick(fixture, 0);
  stats.reset();
  const input = root.querySelector<HTMLInputElement>('input[aria-label="f0"]')!;
  let ms = 0;
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    input.value = text.slice(0, i);
    input.dispatchEvent(new Event('input'));
    await tick(fixture, intervalMs);
    ms += performance.now() - t0;
    // como no React e no Vue; com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && (!variant.debounce || intervalMs > 200)) {
      expect(root.querySelector('[role=alert]')?.textContent).toBe('e-mail inválido');
    }
  }
  await tick(fixture, 300);
  input.dispatchEvent(new Event('blur'));
  await tick(fixture, 300);
  expect(root.querySelector('[role=alert]')).toBeNull();
  const out = { keys: text.length, updates: stats.updates, validations: stats.validations, flickers: flickers(stats.trail), usPerKey: (ms * 1000) / text.length };
  input.value = '';
  input.dispatchEvent(new Event('input'));
  await tick(fixture, 300);
  expect(root.querySelector('[role=alert]')?.textContent).toBe('obrigatório');
  fixture.destroy();
  vi.useRealTimers();
  return out;
}

export async function mountMs(variant: Variant) {
  const t0 = performance.now();
  const fixture = create(variant, s500, keys500);
  await fixture.whenStable();
  const ms = performance.now() - t0;
  fixture.destroy();
  return ms;
}
