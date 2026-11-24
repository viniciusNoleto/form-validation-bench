import { ref, type Ref } from 'vue';
import { z } from 'zod';
import { type ErrorMap, type SchemaFormOptions, getDefaults, normalizePath, validateAll, validateAt } from './schemaForm';

export function useSchemaFormVue<S extends z.ZodObject>(schema: S, options: SchemaFormOptions = {}) {
  const form = ref(getDefaults(schema)) as Ref<z.output<S>>;
  const errors = ref<ErrorMap>({});

  function setError(key: string, message?: string) {
    if (errors.value[key] === message) return; // nenhuma escrita reativa, nenhum render
    if (message === undefined) delete errors.value[key];
    else errors.value[key] = message;
  }

  /** Passado ao frame como `:rules`; o frame chama com o próprio `name`. */
  function rules(path: string) {
    const key = normalizePath(path);
    setError(key, validateAt(schema, key, form.value, options.crossFields));

    for (const dependent of options.dependents?.[key] ?? []) {
      if (errors.value[dependent]) setError(dependent, validateAt(schema, dependent, form.value, options.crossFields));
    }
  }

  function validate() {
    errors.value = validateAll(schema, form.value); // substitui o mapa inteiro
    return Object.keys(errors.value).length === 0;
  }

  function clearErrorsUnder(prefix: string) {
    const key = `${normalizePath(prefix)}.`;
    for (const k of Object.keys(errors.value)) if (k.startsWith(key)) delete errors.value[k];
  }

  function reset() {
    form.value = getDefaults(schema);
    errors.value = {};
  }

  return { form, errors, rules, validate, clearErrorsUnder, reset };
}
