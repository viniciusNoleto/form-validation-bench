import { describe, it } from 'vitest';
import { complexFormOptions, complexSchema } from '../../../src/schemas/complexSchema';
import { validatedForm } from '../../../src/angular/validatedForm';
import { runComplexScenario } from './scenario';

describe('esquema de alta complexidade: Angular (validatedForm, signals)', () => {
  it('roteiro completo', async () => {
    const form = validatedForm(complexSchema, complexFormOptions);
    await runComplexScenario({
      // como o formField: setValue grava o signal de forma síncrona, depois o campo valida
      async change(path, value) { form.field(path).setValue(value); form.field(path).validate(); },
      async blur(path) { form.field(path).validate(); },
      async add(path, item) { form.addItem(path, item); },
      async remove(path, index) { form.removeItem(path, index); },
      async submit() { return form.validateForm(); },
      error: (path) => form.field(path).error(),
      state: () => form.form(),
    }, () => form.errors());
  });
});
