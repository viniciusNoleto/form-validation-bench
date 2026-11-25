import { describe, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { complexFormOptions, complexSchema } from '../../../src/schemas/complexSchema';
import { useValidatedFormState } from '../../../src/react/useValidatedFormState';
import { runComplexScenario } from './scenario';

describe('esquema de alta complexidade: React (useValidatedFormState)', () => {
  it('roteiro completo', async () => {
    const { result } = renderHook(() => useValidatedFormState(complexSchema, complexFormOptions));
    const form = () => result.current;
    // como o wrapper: o valor é gravado num evento e a validação lê o estado já atualizado
    const validate = async (path: string) => { await act(async () => { form().validateField(path); }); };
    await runComplexScenario({
      async change(path, value) { await act(async () => { form().setValue(path, value); }); await validate(path); },
      blur: validate,
      // como o FormList: a lista é validada quando o número de itens muda
      async add(path, item) { await act(async () => { form().addItem(path, item); }); await validate(path); },
      async remove(path, index) { await act(async () => { form().removeItem(path, index); }); await validate(path); },
      async submit() { let ok = false; await act(async () => { ok = form().validate(); }); return ok; },
      error: (path) => form().field(path).error,
      state: () => form().state,
    }, () => form().errors);
  });
});
