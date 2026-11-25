import { it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, fireEvent, act, cleanup, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EventForm } from '../../src/case-study/react/EventForm';

// Item 3 do roteiro (seção 10.6): "corrigir um campo remove só a sua mensagem; no React, só aquele campo renderiza".
// Os inputs do Mantine são envolvidos por um contador de renders por rótulo.
const renders: Record<string, number> = {};
vi.mock('@mantine/core', async (importOriginal) => {
  const mantine: any = await importOriginal();
  const counted = (Inner: any) => (props: any) => {
    renders[props.label] = (renders[props.label] ?? 0) + 1;
    return createElement(Inner, props);
  };
  return {
    ...mantine,
    TextInput: counted(mantine.TextInput),
    PasswordInput: counted(mantine.PasswordInput),
    Textarea: counted(mantine.Textarea),
    NumberInput: counted(mantine.NumberInput),
  };
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: (q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }) });
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => cleanup());

const input = (label: string) => screen.getByLabelText(label, { selector: 'input, textarea' }) as HTMLInputElement;
const snapshot = () => ({ ...renders });
const diff = (before: Record<string, number>) =>
  Object.fromEntries(Object.entries(renders).filter(([k, n]) => n !== (before[k] ?? 0)).map(([k, n]) => [k, n - (before[k] ?? 0)]));

it('digitar num campo renderiza só aquele campo; corrigir o erro renderiza só ele de novo', async () => {
  render(<MantineProvider><EventForm onSubmit={() => {}} /></MantineProvider>);
  expect(Object.keys(renders)).toEqual(expect.arrayContaining(['Nome', 'E-mail', 'Senha', 'Confirmação', 'Capacidade', 'CEP', 'Cidade']));

  // tecla sem mudança de mensagem: um render, só do campo editado
  let before = snapshot();
  await act(async () => { fireEvent.change(input('Cidade'), { target: { value: 'R' } }); });
  expect(diff(before)).toEqual({ Cidade: 1 });

  // submissão com erros: todos os campos com mensagem nova renderizam (esperado)
  await act(async () => { fireEvent.click(screen.getByText('Salvar')); });

  // corrigir um campo com erro: o campo renderiza com o valor novo e de novo sem a mensagem; nenhum outro
  before = snapshot();
  await act(async () => { fireEvent.change(input('Nome'), { target: { value: 'Festival' } }); });
  expect(diff(before)).toEqual({ Nome: 2 });
  expect(input('Nome').getAttribute('aria-invalid')).not.toBe('true');
});
