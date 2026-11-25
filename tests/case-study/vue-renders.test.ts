import { it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import BasicForm from '../../src/vue/BasicForm.vue';

// Item c do roteiro (seção 10.6) no Vue: corrigir um campo atualiza só aquele campo.
// Um mixin global conta o beforeUpdate dos wrappers de campo de src/vue (componentes Form*), pelo rótulo.
it('digitar num campo atualiza só aquele campo; corrigir o erro atualiza só ele', async () => {
  const updates: Record<string, number> = {};
  const counter = {
    beforeUpdate(this: any) {
      const name: string | undefined = this.$options.__name;
      const label: string | undefined = this.$props?.label;
      if (name?.startsWith('Form') && label) updates[label] = (updates[label] ?? 0) + 1;
    },
  };
  const w = mount(BasicForm, { attachTo: document.body, global: { plugins: [[PrimeVue, { unstyled: true }]], mixins: [counter] } });
  const field = (label: string) => w.find(`[aria-label="${label}"]`);
  const type = async (label: string, value: string) => { await field(label).setValue(value); await flushPromises(); };
  const snapshot = () => ({ ...updates });
  const diff = (before: Record<string, number>) =>
    Object.fromEntries(Object.entries(updates).filter(([k, n]) => n !== (before[k] ?? 0)).map(([k, n]) => [k, n - (before[k] ?? 0)]));

  // tecla sem mudança de mensagem: uma atualização, só do campo editado
  let before = snapshot();
  await type('Cidade', 'R');
  expect(diff(before)).toEqual({ Cidade: 1 });

  // submissão com erros: os campos com mensagem nova atualizam (esperado)
  await w.find('form').trigger('submit'); await flushPromises();

  // corrigir um campo com erro: o valor novo e a mensagem retirada entram numa única atualização
  before = snapshot();
  await type('Nome', 'Exemplo');
  expect(diff(before)).toEqual({ Nome: 1 });
  w.unmount();
});
