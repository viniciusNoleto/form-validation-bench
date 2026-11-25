import { computed, signal, untracked, type Signal } from '@angular/core';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { type ErrorTree, type FormOptions, dependentsOf, errorPath, readError, validateAllSync, validateAtSync } from '../core/formCore';

/**
 * O que um wrapper de campo recebe: o mesmo contrato do `field(p)` do React e das props do Vue
 * (caminho, valor, erro e a função de validação), empacotado num objeto estável por caminho.
 */
export type FieldRef<V = any> = {
  readonly name: string;
  /** valor atual do caminho */
  readonly value: Signal<V>;
  /** erro do caminho; só string é erro (objeto/array são erros dos filhos) */
  readonly error: Signal<string | undefined>;
  setValue(value: V): void;
  /** valida este caminho (e os dependentes que já exibem erro) */
  validate(): void;
};

export function validatedForm<T extends object>(schema: yup.ObjectSchema<T>, options: FormOptions = {}) {
  const form = signal<T>(schema.getDefault() as T);
  const errors = signal<ErrorTree>({});

  /**
   * Uma escrita só, e só se a mensagem mudou. O Immer devolve a mesma referência quando nada muda,
   * e o signal não notifica ninguém (igualdade por Object.is).
   */
  function writeError(path: string, message?: string) {
    errors.update((prev) => produce(prev, (draft) => {
      const at = errorPath(schema, path, options.rootSuffix);
      if (_get(draft, at) !== message) _set(draft, at, message);
    }));
  }

  /** Chamada pelo próprio campo, no evento de input e no blur. Não rastreia signals: pode rodar dentro de um effect. */
  function validate(path: string) {
    untracked(() => {
      writeError(path, validateAtSync(schema, path, form()));

      for (const dependent of dependentsOf(options.dependents, path)) {
        if (readError(schema, errors(), dependent, options.rootSuffix)) writeError(dependent, validateAtSync(schema, dependent, form()));
      }
    });
  }

  function setValue(path: string, value: unknown) {
    form.update((prev) => produce(prev, (draft) => {
      _set(draft as object, path, value);
    }));
  }

  const error = (path: string) => readError(schema, errors(), path, options.rootSuffix);

  // Um FieldRef por caminho, criado uma vez: a referência estável faz o input do wrapper nunca mudar,
  // e o `computed` só propaga quando o valor ou a mensagem DAQUELE caminho mudam.
  const fields = new Map<string, FieldRef>();

  function field<V = any>(path: string): FieldRef<V> {
    let ref = fields.get(path);
    if (!ref) {
      ref = {
        name: path,
        value: computed(() => _get(form(), path)),
        error: computed(() => error(path)),
        setValue: (value) => setValue(path, value),
        validate: () => validate(path),
      };
      fields.set(path, ref);
    }
    return ref as FieldRef<V>;
  }

  function validateForm() {
    const tree = validateAllSync(schema, untracked(form), options.rootSuffix);
    errors.set(tree ?? {}); // substitui a árvore inteira
    return tree === null;
  }

  /** Remove o item e o nó de erros dele: a árvore continua paralela à lista. */
  function removeItem(path: string, index: number) {
    form.update((prev) => produce(prev, (draft) => {
      (_get(draft, path) as unknown[]).splice(index, 1);
    }));
    errors.update((prev) => produce(prev, (draft) => {
      const items = _get(draft, path);
      if (Array.isArray(items)) items.splice(index, 1);
    }));
    validate(path);
  }

  function addItem(path: string, item: unknown) {
    form.update((prev) => produce(prev, (draft) => {
      (_get(draft, path) as unknown[]).push(item);
    }));
    validate(path);
  }

  function clearForm() {
    form.set(schema.getDefault() as T);
    errors.set({});
  }

  return {
    form: form.asReadonly(),
    errors: errors.asReadonly(),
    error,
    field,
    setValue,
    validate,
    validateForm,
    removeItem,
    addItem,
    clearForm,
  };
}

export type ValidatedForm<T extends object> = ReturnType<typeof validatedForm<T>>;
