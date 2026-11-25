import { ref, type Ref } from 'vue';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { type ErrorTree, type FormOptions, dependentsOf, errorPath, readError, validateAllSync, validateAtSync } from '../core/formCore';

export function useValidatedForm<T extends object>(schema: yup.ObjectSchema<T>, options: FormOptions = {}) {
  const form = ref(schema.getDefault()) as Ref<T>;
  const errors = ref<ErrorTree>({});

  /** Uma escrita só, e só se a mensagem mudou: sem escrita reativa, sem render. */
  function writeError(path: string, message?: string) {
    const at = errorPath(schema, path, options.rootSuffix);
    if (_get(errors.value, at) !== message) _set(errors.value, at, message);
  }

  /** Passada a cada campo junto com o `name`; o campo chama no update:modelValue e no blur. */
  function validate(path: string) {
    writeError(path, validateAtSync(schema, path, form.value));

    for (const dependent of dependentsOf(options.dependents, path)) {
      if (readError(schema, errors.value, dependent, options.rootSuffix)) writeError(dependent, validateAtSync(schema, dependent, form.value));
    }
  }

  function validateForm() {
    const tree = validateAllSync(schema, form.value, options.rootSuffix);
    errors.value = tree ?? {}; // substitui a árvore inteira
    return tree === null;
  }

  const error = (path: string) => readError(schema, errors.value, path, options.rootSuffix);

  /** Remove o item e o nó de erros dele: a árvore continua paralela à lista. */
  function removeItem(path: string, index: number) {
    (_get(form.value, path) as unknown[]).splice(index, 1);
    const items = _get(errors.value, path);
    if (Array.isArray(items)) items.splice(index, 1);
    validate(path);
  }

  function addItem(path: string, item: unknown) {
    (_get(form.value, path) as unknown[]).push(item);
    validate(path);
  }

  function clearForm() {
    form.value = schema.getDefault() as T;
    errors.value = {};
  }

  return { form, errors, error, validate, validateForm, removeItem, addItem, clearForm };
}
