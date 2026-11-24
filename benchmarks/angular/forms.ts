import { computed, signal } from '@angular/core';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { validatedForm, type FieldRef } from '../../src/angular/validatedForm';
import { readError } from '../../src/core/formCore';
import { stats } from './stats';

export type BenchForm = { field: (path: string) => FieldRef };

/** Final: o validatedForm de src/angular (validateSyncAt + gravação única), contando validações. */
export function finalForm(schema: yup.ObjectSchema<any>): BenchForm {
  const form = validatedForm(schema);
  const counted = new Map<string, FieldRef>();
  return {
    field(path) {
      let ref = counted.get(path);
      if (!ref) {
        const inner = form.field(path);
        ref = { ...inner, validate: () => { stats.validations++; inner.validate(); } };
        counted.set(path, ref);
      }
      return ref;
    },
  };
}

/** Alternativa: limpar o erro e regravá-lo quando a Promise do validateAt resolver. */
export function clearThenSetForm(schema: yup.ObjectSchema<any>): BenchForm {
  const form = signal(schema.getDefault());
  const errors = signal<Record<string, any>>({});
  const write = (path: string, message?: string) => errors.update((prev) => produce(prev, (draft) => { _set(draft, path, message); }));
  const refs = new Map<string, FieldRef>();
  return {
    field(path) {
      let ref = refs.get(path);
      if (!ref) {
        ref = {
          name: path,
          value: computed(() => _get(form(), path)),
          error: computed(() => readError(schema, errors(), path)),
          setValue: (value) => form.update((prev) => produce(prev, (draft: any) => { _set(draft, path, value); })),
          validate: () => {
            stats.validations++;
            write(path, undefined);
            schema.validateAt(path, form()).catch((error: yup.ValidationError) => write(path, error.errors[0]));
          },
        };
        refs.set(path, ref);
      }
      return ref;
    },
  };
}
