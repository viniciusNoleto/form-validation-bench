import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BasicFormVue from './BasicFormVue.vue';

describe('formulário complexo Vue', () => {
  it('ciclo completo', async () => {
    const w = mount(BasicFormVue, { attachTo: document.body });
    const alerts = () => Object.fromEntries(w.findAll('[role=alert]').map((a) => [a.attributes('data-field'), a.text()]));
    const type = async (label: string, value: string) => { await w.find(`input[aria-label="${label}"]`).setValue(value); await flushPromises(); };
    const click = async (text: string) => { await w.findAll('button').find((b) => b.text() === text)!.trigger('click'); await flushPromises(); };
    const submit = async () => { await w.find('form').trigger('submit'); await flushPromises(); };

    expect(alerts()).toEqual({});
    await submit();
    expect(alerts()).toEqual({
      Nome: 'Informe o nome', 'E-mail': 'Informe o e-mail', Senha: 'Mínimo de 8 caracteres',
      'Confirmação': 'Confirme a senha', Capacidade: 'Informe a capacidade', CEP: 'CEP inválido', Cidade: 'Informe a cidade',
      Categorias: 'Escolha ao menos uma categoria', 'Descrições': 'Adicione ao menos uma descrição',
    });

    await type('Nome', 'Exemplo');
    expect(alerts().Nome).toBeUndefined();
    await type('Cidade', 'Recife');

    await click('Adicionar descrição');
    expect(alerts()['Descrições']).toBeUndefined();
    expect(alerts()['Título 1']).toBeUndefined();

    await submit();
    expect(alerts()['Título 1']).toBe('Informe o título');
    expect(alerts()['Conteúdo 1']).toBe('Mínimo de 10 caracteres');
    await type('Título 1', 'Item A');
    expect(alerts()['Título 1']).toBeUndefined();

    await type('Senha', '12345678');
    await type('Confirmação', '1234567');
    expect(alerts()['Confirmação']).toBe('As senhas não conferem');
    await type('Senha', '1234567');
    expect(alerts().Senha).toBe('Mínimo de 8 caracteres');
    expect(alerts()['Confirmação']).toBeUndefined();

    await click('Remover 1');
    expect(alerts()['Título 1']).toBeUndefined();
    expect(alerts()['Descrições']).toBe('Adicione ao menos uma descrição');

    await type('E-mail', 'a@b.com');
    await type('Senha', '12345678');
    await type('Confirmação', '12345678');
    await type('Capacidade', '100');
    await type('CEP', '50000-000');
    await w.find('input[aria-label="music"]').trigger('change'); await flushPromises();
    expect(alerts().Categorias).toBeUndefined();
    await click('Adicionar descrição');
    await type('Título 1', 'Item A');
    await type('Conteúdo 1', 'Conteúdo do item A');
    await submit();
    expect(alerts()).toEqual({});
    expect(w.emitted('submit')).toHaveLength(1);
    expect(w.emitted('submit')![0][0]).toMatchObject({ name: 'Exemplo', capacity: 100, address: { city: 'Recife' }, categories: ['music'] });
    w.unmount();
  });
});
