import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EventForm } from '../../src/case-study/angular/EventForm';

describe('formulário complexo Angular (Yup + wrappers por tipo + spartan-ng, signals, sem zone.js)', () => {
  it('roda sem zone.js', () => {
    expect((globalThis as { Zone?: unknown }).Zone).toBeUndefined();
  });

  it('ciclo completo', async () => {
    const fixture = TestBed.createComponent(EventForm);
    const submitted: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((data) => submitted.push(data));
    const root: HTMLElement = fixture.nativeElement;
    document.body.appendChild(root);
    await fixture.whenStable();

    const stable = () => fixture.whenStable();
    const alerts = () => Object.fromEntries([...root.querySelectorAll('[role=alert]')].map((a) => [a.getAttribute('data-field'), a.textContent!.trim()]));
    const field = (label: string) => root.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
    const type = async (label: string, value: string) => { const el = field(label); el.value = value; el.dispatchEvent(new Event('input')); await stable(); };
    const click = async (text: string) => { [...root.querySelectorAll('button')].find((b) => b.textContent!.trim() === text)!.click(); await stable(); };
    const submit = async () => { root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })); await stable(); };

    expect(alerts()).toEqual({});
    field('Nome').dispatchEvent(new Event('blur')); await stable();
    expect(alerts().Nome).toBe('Informe o nome do evento'); // blur sem digitar
    await submit();
    expect(alerts()).toEqual({
      Nome: 'Informe o nome do evento', 'E-mail': 'Informe o e-mail', Senha: 'Mínimo de 8 caracteres',
      'Confirmação': 'Confirme a senha', Capacidade: 'Informe a capacidade', CEP: 'CEP inválido', Cidade: 'Informe a cidade',
      Categorias: 'Escolha ao menos uma categoria', 'Descrições': 'Adicione ao menos uma descrição',
    });
    expect(field('Nome').getAttribute('aria-invalid')).toBe('true'); // o spartan recebe o estado de erro

    await type('Nome', 'Festival');
    expect(alerts().Nome).toBeUndefined();
    expect(field('Nome').getAttribute('aria-invalid')).toBeNull();
    await type('Cidade', 'Recife');

    await click('Adicionar descrição');
    expect(alerts()['Descrições']).toBeUndefined();
    expect(alerts()['Título 1']).toBeUndefined();
    await click('Adicionar descrição');
    await click('Adicionar descrição');
    await type('Título 1', 'Line-up'); await type('Conteúdo 1', 'Bandas confirmadas');
    await type('Título 3', 'Local'); await type('Conteúdo 3', 'Marco Zero, Recife');
    await submit();
    expect(alerts()['Título 2']).toBe('Informe o título');
    expect(alerts()['Conteúdo 2']).toBe('Mínimo de 10 caracteres');

    await click('Remover 2');
    expect(alerts()['Título 2']).toBeUndefined();
    expect(alerts()['Conteúdo 2']).toBeUndefined();
    expect(field('Título 2').value).toBe('Local');

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
    root.querySelector<HTMLButtonElement>('#categories-music')!.click(); await stable();
    expect(alerts().Categorias).toBeUndefined();
    await click('Adicionar descrição');
    await type('Título 1', 'Line-up');
    await type('Conteúdo 1', 'Bandas confirmadas');
    await submit();
    expect(alerts()).toEqual({});
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({ name: 'Festival', capacity: 100, address: { city: 'Recife' }, categories: ['music'] });
    fixture.destroy();
    root.remove();
  });
});
