import { it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BasicForm } from '../../src/angular/BasicForm';

// Item c do roteiro (seção 10.6) no Angular: corrigir um campo atualiza só a view daquele campo.
// As atualizações são contadas pelo profiler de depuração do Angular (ng.ɵsetProfiler, o mesmo que o
// Angular DevTools usa): cada evento TemplateUpdateStart é uma atualização da view de um componente.
// Contam-se só os wrappers de campo (componentes com a entrada label), pelo rótulo.
const TEMPLATE_UPDATE_START = 2;

it('digitar num campo atualiza só aquele campo; corrigir o erro atualiza só ele', async () => {
  const updates: Record<string, number> = {};
  const removeProfiler = (globalThis as any).ng.ɵsetProfiler((event: number, instance: any) => {
    if (event !== TEMPLATE_UPDATE_START || typeof instance?.label !== 'function' || !instance?.field) return;
    const label = instance.label();
    updates[label] = (updates[label] ?? 0) + 1;
  });

  const fixture = TestBed.createComponent(BasicForm);
  const root: HTMLElement = fixture.nativeElement;
  document.body.appendChild(root);
  await fixture.whenStable();
  const stable = () => fixture.whenStable();
  const field = (label: string) => root.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
  const type = async (label: string, value: string) => { const el = field(label); el.value = value; el.dispatchEvent(new Event('input')); await stable(); };
  const snapshot = () => ({ ...updates });
  const diff = (before: Record<string, number>) =>
    Object.fromEntries(Object.entries(updates).filter(([k, n]) => n !== (before[k] ?? 0)).map(([k, n]) => [k, n - (before[k] ?? 0)]));

  expect(Object.keys(updates)).toEqual(expect.arrayContaining(['Nome', 'E-mail', 'Senha', 'Confirmação', 'Capacidade', 'CEP', 'Cidade']));

  // tecla sem mudança de mensagem: uma atualização, só do campo editado
  let before = snapshot();
  await type('Cidade', 'R');
  expect(diff(before)).toEqual({ Cidade: 1 });

  // submissão com erros: os campos com mensagem nova atualizam (esperado)
  root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  await stable();

  // corrigir um campo com erro: o valor novo e a mensagem retirada entram numa única atualização
  before = snapshot();
  await type('Nome', 'Exemplo');
  expect(diff(before)).toEqual({ Nome: 1 });
  expect(field('Nome').getAttribute('aria-invalid')).toBeNull();

  removeProfiler();
  fixture.destroy();
  root.remove();
});
