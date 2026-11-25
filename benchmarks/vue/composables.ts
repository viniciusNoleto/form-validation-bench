import { ref, toRaw, watch, type Ref } from 'vue';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { errorPath, readError, validateAtSync } from '../../src/core/formCore';
import { useValidatedForm } from '../../src/vue/useValidatedForm';
import { changedPaths } from '../shared/changedPaths';
import { stats } from './stats';

/** Forma adotada: o composable de src/vue (validateSyncAt + gravação única), contando validações. */
export function useFinal(schema: yup.ObjectSchema<any>) {
  const { form, validate: inner, error } = useValidatedForm(schema);
  function validate(path: string) {
    stats.validations++;
    inner(path);
  }
  return { form, validate, error };
}

/**
 * Variante O: observador do formulário. O campo não pede a validação na digitação; um watch profundo
 * sobre o formulário compara o estado com uma cópia anterior (o Vue muta no lugar), valida cada
 * caminho que mudou e guarda uma cópia nova. O campo continua validando no blur.
 */
export function useObserver(schema: yup.ObjectSchema<any>) {
  const { form, validate, error } = useFinal(schema);
  let snapshot = structuredClone(toRaw(form.value));
  watch(form, () => {
    const now = toRaw(form.value);
    const changed = changedPaths(snapshot, now);
    snapshot = structuredClone(now);
    for (const path of changed) validate(path);
  }, { deep: true });
  return { form, validate, error };
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

/** Alternativa síncrona: limpar e regravar no mesmo tique, com validateSyncAt (separa o fator "assíncrono"). */
export function useClearThenSetSync(schema: yup.ObjectSchema<any>) {
  const form = ref(schema.getDefault()) as Ref<any>;
  const errors = ref<Record<string, any>>({});
  function validate(path: string) {
    stats.validations++;
    const at = errorPath(schema, path);
    _set(errors.value, at, undefined);
    _set(errors.value, at, validateAtSync(schema, path, form.value));
  }
  return { form, validate, error: (p: string) => readError(schema, errors.value, p) };
}
