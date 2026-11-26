import { expect, vi } from 'vitest';
import { TestBed, getTestBed, type ComponentFixture } from '@angular/core/testing';
import * as yup from 'yup';
import { BenchForm } from './BenchForm';
import { clearThenSetForm, clearThenSetSyncForm, finalForm, formlyForm, noValidationForm, observerForm, reactiveForm, signalForms, withKind, type BenchForm as BenchFormApi } from './forms';
import { stats } from './stats';

// Mesmo roteiro dos benchmarks React e Vue: e-mail inválido até o último caractere, depois blur.
const make = (n: number) => yup.object(Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const SCHEMAS: Record<number, yup.ObjectSchema<any>> = { 20: make(20), 100: make(100), 500: make(500) };
export const TEXT = 'fulano.de.tal@exemplo.com'; // 25 teclas (contagens)
export const LONG = 'fulano.de.tal.da.silva.sauro@exemplo-de-dominio.com.br'; // 54 teclas (tempo por tecla, debounce)

export type Variant = { key: string; name: string; form: (schema: yup.ObjectSchema<any>) => BenchFormApi; debounce: boolean; validates: boolean };
const V = (key: string, name: string, form: Variant['form'], opts: Partial<Variant> = {}): Variant => ({ key, name, form, debounce: false, validates: true, ...opts });
export const VARIANTS: Variant[] = [
  V('H', 'H · wrapper sem validação (linha de base do harness)', noValidationForm, { validates: false }),
  V('W', 'W · wrapper por tipo, validação no evento (forma adotada)', finalForm),
  V('WC', 'WC · wrapper, assíncrono, limpar e regravar', clearThenSetForm),
  V('WCS', 'WCS · wrapper, síncrono, limpar e regravar', clearThenSetSyncForm),
  V('WD', 'WD · wrapper, evento + debounce 200 ms', finalForm, { debounce: true }),
  V('F', 'F · frame genérico + injeção de dependência, validação no evento', withKind('frame')),
  V('WN', 'WN · wrapper que observa o próprio valor (effect), em vez de validar no evento', withKind('effect')),
  V('O', 'O · observador do formulário (effect sobre o signal); o campo só valida no blur', observerForm),
  // Bibliotecas (benchmarks/angular/libs.ts): o mesmo esquema Yup, do jeito que cada documentação recomenda.
  V('RF', 'RF · Reactive Forms (FormControl por campo, validador que valida o caminho no esquema)', reactiveForm),
  V('SF', 'SF · Signal Forms (validateStandardSchema com o esquema do formulário, [formField])', signalForms),
  V('FLY', 'FLY · ngx-formly 11 (tipo de campo próprio, validador por campo que valida o caminho no esquema)', formlyForm),
].filter((v) => { const only = (globalThis as any).process?.env?.BENCH_ONLY as string | undefined; return !only || only.split(',').includes(v.key); });

const flickers = (t: (string | null)[]) => { let n = 0; for (let i = 2; i < t.length; i++) if (t[i - 2] && t[i - 1] === null && t[i] === t[i - 2]) n++; return n; };

/**
 * Destrói a fixture e a tira da lista de fixtures ativas do TestBed. O TestBed guarda toda fixture
 * criada até o fim do teste, mesmo destruída; com centenas de formulários por sessão, isso retém
 * memória até esgotar o heap (o ngx-formly com 500 campos, por exemplo). A lista é interna
 * (_activeFixtures), daí o acesso direto.
 */
function release(fixture: ComponentFixture<unknown>) {
  fixture.destroy();
  const active: ComponentFixture<unknown>[] = (getTestBed() as any)._activeFixtures ?? [];
  const i = active.indexOf(fixture);
  if (i >= 0) active.splice(i, 1);
}

function create(variant: Variant, n: number) {
  const schema = SCHEMAS[n];
  const keys = Object.keys(schema.fields);
  const form = variant.form(schema);
  const fixture = TestBed.createComponent(BenchForm);
  fixture.componentRef.setInput('form', form);
  fixture.componentRef.setInput('keys', keys);
  fixture.componentRef.setInput('debounce', variant.debounce);
  fixture.componentRef.onDestroy(() => form.destroy?.());
  return fixture;
}

/** Avança o relógio falso (dispara o agendador do Angular e o debounce) e espera a view estabilizar. */
async function tick(fixture: ComponentFixture<unknown>, ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await fixture.whenStable();
}

/**
 * Digita `text` no campo f0 de um formulário de `n` campos, uma tecla a cada `intervalMs`, e sai do campo.
 * Janela medida: cada tecla e o avanço do relógio até a próxima, mais os 300 ms finais em que um
 * debounce pendente dispara; ficam fora as asserções e o blur.
 */
export async function type(variant: Variant, text: string, intervalMs: number, n = 20) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  const fixture = create(variant, n);
  const root: HTMLElement = fixture.nativeElement;
  await tick(fixture, 0);
  stats.reset();
  const input = root.querySelector<HTMLInputElement>('input[aria-label="f0"]')!;
  let ms = 0;
  let keyMs = 0; // só o evento de input; o render vem no tick do agendador, dentro do avanço do relógio
  for (let i = 1; i <= text.length; i++) {
    const t0 = performance.now();
    input.value = text.slice(0, i);
    input.dispatchEvent(new Event('input'));
    keyMs += performance.now() - t0;
    await tick(fixture, intervalMs);
    ms += performance.now() - t0;
    // como no React e no Vue; com debounce, a mensagem só aparece quando a pausa passa dos 200 ms
    if (i === 5 && variant.validates && (!variant.debounce || intervalMs > 200)) {
      expect(root.querySelector('[role=alert]')?.textContent).toBe('e-mail inválido');
    }
    if (!variant.validates) expect(root.querySelector('[role=alert]')).toBeNull();
  }
  const t1 = performance.now();
  await tick(fixture, 300);
  ms += performance.now() - t1;
  input.dispatchEvent(new Event('blur'));
  await tick(fixture, 300);
  expect(root.querySelector('[role=alert]')).toBeNull();
  const out = { updates: stats.updates, formUpdates: stats.formUpdates, validations: stats.validations, whole: stats.whole, flickers: flickers(stats.trail), usPerKey: (ms * 1000) / text.length, keyUsPerKey: (keyMs * 1000) / text.length };
  input.value = '';
  input.dispatchEvent(new Event('input'));
  await tick(fixture, 300);
  if (variant.validates) expect(root.querySelector('[role=alert]')?.textContent).toBe('obrigatório');
  release(fixture);
  // validações assíncronas pendentes (bibliotecas) terminam aqui, antes da próxima tarefa zerar as contagens
  await vi.advanceTimersByTimeAsync(1000);
  vi.useRealTimers();
  return out;
}

export async function mountMs(variant: Variant) {
  const t0 = performance.now();
  const fixture = create(variant, 500);
  await fixture.whenStable();
  const ms = performance.now() - t0;
  expect((fixture.nativeElement as HTMLElement).querySelectorAll('input')).toHaveLength(500);
  release(fixture);
  // validações que a biblioteca agendou na montagem (relógio real) terminam aqui, fora da próxima tarefa
  await new Promise((r) => setTimeout(r, 100));
  return ms;
}
