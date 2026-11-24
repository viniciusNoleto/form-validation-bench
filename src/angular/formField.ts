import { computed, type Signal } from '@angular/core';
import type { FieldRef } from './validatedForm';

/**
 * Liga um wrapper de campo à validação, como o `useFormField` do Vue. Sem effect sobre o valor:
 * a validação é chamada no próprio evento. `setValue` grava o signal de forma síncrona, então
 * quando `validate` roda o formulário já tem o valor novo.
 */
export function formField<V>(field: Signal<FieldRef<V>>) {
  const validate = () => field().validate();

  function update(value: V) {
    field().setValue(value);
    validate();
  }

  const value = computed(() => field().value());
  const message = computed(() => field().error());

  return { value, message, update, validate };
}
