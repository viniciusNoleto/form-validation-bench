import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, fireEvent, act, cleanup, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BasicForm } from '../../src/react/BasicForm';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: (q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }) });
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => cleanup());

// erro de cada campo: o texto do elemento de erro que o Mantine liga ao input por aria-describedby
function alerts() {
  const out: Record<string, string> = {};
  document.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    const label = document.querySelector(`label[for="${input.id}"]`)?.textContent?.replace('*', '').trim() ?? input.id;
    const msg = ids.map((id) => document.getElementById(id)).find((el) => el?.className.includes('error'))?.textContent;
    if (msg) out[label] = msg;
  });
  document.querySelectorAll('[role=alert]').forEach((el) => { out[el.getAttribute('data-field')!] = el.textContent!; });
  // erro do Checkbox.Group (sem input próprio com aria-invalid)
  document.querySelectorAll('[class*="mantine-InputWrapper-root"]').forEach((root) => {
    const label = root.querySelector(':scope > [class*="InputWrapper-label"]')?.textContent?.replace('*', '').trim();
    const err = root.querySelector(':scope > [class*="InputWrapper-error"]')?.textContent;
    if (label && err && !(label in out)) out[label] = err;
  });
  return out;
}
const input = (label: string) => screen.getByLabelText(label, { selector: 'input, textarea' }) as HTMLInputElement;
const type = async (label: string, value: string) => { await act(async () => { fireEvent.change(input(label), { target: { value } }); }); };
const click = async (name: string) => { await act(async () => { fireEvent.click(screen.getByText(name)); }); };

describe('formulário complexo React (Yup + wrappers por tipo + Mantine)', () => {
  it('ciclo completo', async () => {
    const onSubmit = vi.fn();
    render(<MantineProvider><BasicForm onSubmit={onSubmit} /></MantineProvider>);
    expect(alerts()).toEqual({});

    await act(async () => { fireEvent.blur(input('Nome')); });
    expect(alerts().Nome).toBe('Informe o nome');

    await click('Salvar');
    expect(alerts()).toEqual({
      Nome: 'Informe o nome', 'E-mail': 'Informe o e-mail', Senha: 'Mínimo de 8 caracteres',
      'Confirmação': 'Confirme a senha', Capacidade: 'Informe a capacidade', CEP: 'CEP inválido', Cidade: 'Informe a cidade',
      Categorias: 'Escolha ao menos uma categoria', 'Descrições': 'Adicione ao menos uma descrição',
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await type('Nome', 'Exemplo');
    expect(alerts().Nome).toBeUndefined();
    await type('Cidade', 'Recife');

    await click('Adicionar descrição');
    expect(alerts()['Descrições']).toBeUndefined();
    expect(alerts()['Título 1']).toBeUndefined();
    await click('Adicionar descrição');
    await click('Adicionar descrição');
    await type('Título 1', 'Item A'); await type('Conteúdo 1', 'Conteúdo do item A');
    await type('Título 3', 'Item C'); await type('Conteúdo 3', 'Conteúdo do item C');
    await click('Salvar');
    expect(alerts()['Título 2']).toBe('Informe o título');
    expect(alerts()['Conteúdo 2']).toBe('Mínimo de 10 caracteres');
    expect(alerts()['Título 3']).toBeUndefined();

    await click('Remover 2');
    expect(alerts()['Título 2']).toBeUndefined();
    expect(alerts()['Conteúdo 2']).toBeUndefined();
    expect(input('Título 2').value).toBe('Item C');

    await type('Senha', '12345678');
    await type('Confirmação', '1234567');
    expect(alerts()['Confirmação']).toBe('As senhas não conferem');
    await type('Senha', '1234567');
    expect(alerts().Senha).toBe('Mínimo de 8 caracteres');
    expect(alerts()['Confirmação']).toBeUndefined();

    await click('Remover 2'); await click('Remover 1');
    expect(alerts()['Descrições']).toBe('Adicione ao menos uma descrição');

    await type('E-mail', 'a@b.com');
    await type('Senha', '12345678');
    await type('Confirmação', '12345678');
    await type('Capacidade', '100');
    await type('CEP', '50000-000');
    await act(async () => { fireEvent.click(screen.getByLabelText('Música')); });
    expect(alerts().Categorias).toBeUndefined();
    await click('Adicionar descrição');
    await type('Título 1', 'Item A');
    await type('Conteúdo 1', 'Conteúdo do item A');
    await click('Salvar');
    expect(alerts()).toEqual({});
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Exemplo', capacity: 100, address: { city: 'Recife' }, categories: ['music'] });
  });
});
