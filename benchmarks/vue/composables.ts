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

/**
 * Alternativa assíncrona SEM limpar: validateAt (Promise) e uma única gravação, só se a mensagem
 * mudou. Separa o fator "assíncrono" do fator "limpar e regravar" (WC = os dois juntos).
 */
export function useAsyncOnce(schema: yup.ObjectSchema<any>) {
  const form = ref(schema.getDefault()) as Ref<any>;
  const errors = ref<Record<string, any>>({});
  function write(path: string, message: string | undefined) {
    const at = errorPath(schema, path);
    if (_get(errors.value, at) !== message) _set(errors.value, at, message);
  }
  function validate(path: string) {
    stats.validations++;
    schema.validateAt(path, form.value)
      .then(() => write(path, undefined))
      .catch((e: any) => { if (e?.name !== 'ValidationError') throw e; write(path, e.path === path ? e.errors[0] : undefined); });
  }
  return { form, validate, error: (p: string) => readError(schema, errors.value, p) };
}

/**
 * Variante OP: observador do formulário com um watch por caminho, sem cópia nem comparação.
 * Cada watch depende só do próprio campo; quando ele muda, o formulário valida aquele caminho.
 * O campo continua validando no blur.
 */
export function usePathObserver(schema: yup.ObjectSchema<any>) {
  const { form, validate, error } = useFinal(schema);
  // flush padrão ('pre'), como o watch profundo da variante O: roda antes do render
  for (const key of Object.keys(schema.fields)) watch(() => form.value[key], () => validate(key));
  return { form, validate, error };
}
