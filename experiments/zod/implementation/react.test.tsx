import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup, screen } from '@testing-library/react';
import { BasicFormReact, renderLog } from './BasicFormReact';
afterEach(() => cleanup());

const alerts = () => Object.fromEntries(screen.queryAllByRole('alert').map((a) => [a.getAttribute('data-field'), a.textContent]));
const type = async (label: string, value: string) => { await act(async () => { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }); };
const click = async (name: string) => { await act(async () => { fireEvent.click(screen.getByText(name)); }); };

describe('formulário complexo React', () => {
  it('ciclo completo', async () => {
    const onSubmit = vi.fn();
    render(<BasicFormReact onSubmit={onSubmit} />);
    expect(alerts()).toEqual({});

    await click('Salvar');
    expect(alerts()).toEqual({
      Nome: 'Informe o nome', 'E-mail': 'Informe o e-mail', Senha: 'Mínimo de 8 caracteres',
      'Confirmação': 'Confirme a senha', Capacidade: 'Informe a capacidade', CEP: 'CEP inválido', Cidade: 'Informe a cidade',
      Categorias: 'Escolha ao menos uma categoria', 'Descrições': 'Adicione ao menos uma descrição',
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await type('Nome', 'Exemplo');
    expect(alerts().Nome).toBeUndefined();

    // só o campo editado renderiza
    renderLog.length = 0;
    await type('Cidade', 'Recife');
    expect(new Set(renderLog)).toEqual(new Set(['Cidade']));

    await click('Adicionar descrição');
    expect(alerts()['Descrições']).toBeUndefined();     // contêiner revalidado pelo ListFrame
    expect(alerts()['Título 1']).toBeUndefined();        // item novo não tocado: sem erro

    await click('Salvar');
    expect(alerts()['Título 1']).toBe('Informe o título');
    expect(alerts()['Conteúdo 1']).toBe('Mínimo de 10 caracteres');

    await type('Título 1', 'Item A');
    expect(alerts()['Título 1']).toBeUndefined();

    await type('Senha', '12345678');
    await type('Confirmação', '1234567');
    expect(alerts()['Confirmação']).toBe('As senhas não conferem');
    await type('Senha', '1234567');                       // dependents: confirmação revalidada
    expect(alerts()['Senha']).toBe('Mínimo de 8 caracteres');
    expect(alerts()['Confirmação']).toBeUndefined();

    await click('Remover 1');
    expect(alerts()['Título 1']).toBeUndefined();
    expect(alerts()['Conteúdo 1']).toBeUndefined();
    expect(alerts()['Descrições']).toBe('Adicione ao menos uma descrição');

    await type('E-mail', 'a@b.com');
    await type('Senha', '12345678');
    await type('Confirmação', '12345678');
    await type('Capacidade', '100');
    await type('CEP', '50000-000');
    await act(async () => { fireEvent.click(screen.getByLabelText('music')); });
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
