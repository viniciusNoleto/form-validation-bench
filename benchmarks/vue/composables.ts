import { ref, type Ref } from 'vue';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { errorPath, readError, validateAtSync } from '../../src/core/formCore';
import { stats } from './stats';

/** Final: validateSyncAt + gravação única. */
export function useFinal(schema: yup.ObjectSchema<any>) {
  const form = ref(schema.getDefault()) as Ref<any>;
  const errors = ref<Record<string, any>>({});
  function validate(path: string) {
    stats.validations++;
    const message = validateAtSync(schema, path, form.value);
    const at = errorPath(schema, path);
    if (_get(errors.value, at) !== message) _set(errors.value, at, message);
  }
  return { form, validate, error: (p: string) => readError(schema, errors.value, p) };
}

/** Alternativa: limpar e regravar com validateAt assíncrono. */
export function useClearThenSet(schema: yup.ObjectSchema<any>) {
  const form = ref(schema.getDefault()) as Ref<any>;
  const errors = ref<Record<string, any>>({});
  function validate(path: string) {
    stats.validations++;
    const at = errorPath(schema, path);
    _set(errors.value, at, undefined);
    schema.validateAt(path, form.value).catch((e: any) => { if (e.path === path) _set(errors.value, at, e.errors[0]); });
  }
  return { form, validate, error: (p: string) => readError(schema, errors.value, p) };
}
