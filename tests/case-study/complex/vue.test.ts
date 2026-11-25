import { describe, it } from 'vitest';
import { nextTick } from 'vue';
import _set from 'lodash-es/set';
import { complexFormOptions, complexSchema } from '../../../src/schemas/complexSchema';
import { useValidatedForm } from '../../../src/vue/useValidatedForm';
import { runComplexScenario } from './scenario';

describe('esquema de alta complexidade: Vue (useValidatedForm)', () => {
  it('roteiro completo', async () => {
    const form = useValidatedForm(complexSchema, complexFormOptions);
    await runComplexScenario({
      // como o v-model + useFormField: o emit grava o valor de forma síncrona, depois o campo valida
      async change(path, value) { _set(form.form.value, path, value); form.validate(path); await nextTick(); },
      async blur(path) { form.validate(path); await nextTick(); },
      async add(path, item) { form.addItem(path, item); await nextTick(); },
      async remove(path, index) { form.removeItem(path, index); await nextTick(); },
      async submit() { const ok = form.validateForm(); await nextTick(); return ok; },
      error: (path) => form.error(path),
      state: () => form.form.value,
    }, () => form.errors.value);
  });
});
