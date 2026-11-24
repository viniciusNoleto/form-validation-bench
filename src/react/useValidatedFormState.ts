import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { type ErrorTree, type FormOptions, errorPath, readError, validateAllSync, validateAtSync } from '../core/formCore';

export type FieldProps<V = any> = {
  value: V;
  error: string | undefined;
  onChange: (value: V) => void;
  onValidate: () => void;
};

export function useValidatedFormState<T extends object>(schema: yup.ObjectSchema<T>, options: FormOptions = {}) {
  const [state, setState] = useState<T>(() => schema.getDefault() as T);
  const [errors, setErrors] = useState<ErrorTree>({});

  // Estado e erros mais recentes para callbacks estáveis; atualizados antes dos efeitos dos inputs.
  const latestState = useRef(state);
  const latestErrors = useRef(errors);
  useLayoutEffect(() => {
    latestState.current = state;
    latestErrors.current = errors;
  }, [state, errors]);

  /** Uma escrita só, e só se a mensagem mudou (Immer devolve a mesma referência se nada mudar). */
  const writeError = useCallback((path: string, message?: string) => {
    setErrors((prev) => produce(prev, (draft) => {
      const at = errorPath(schema, path, options.rootSuffix);
      if (_get(draft, at) !== message) _set(draft, at, message);
    }));
  }, [schema, options.rootSuffix]);

  const validateField = useCallback((path: string) => {
    writeError(path, validateAtSync(schema, path, latestState.current));

    for (const dependent of options.dependents?.[path] ?? []) {
      if (readError(schema, latestErrors.current, dependent, options.rootSuffix)) {
        writeError(dependent, validateAtSync(schema, dependent, latestState.current));
      }
    }
  }, [schema, writeError, options.dependents]);

  const setValue = useCallback((path: string, value: unknown) => {
    setState((prev) => produce(prev, (draft) => {
      _set(draft as object, path, value);
    }));
  }, []);

  // Um par de callbacks por caminho, criado uma vez: permite React.memo nos inputs.
  const handlers = useRef(new Map<string, Pick<FieldProps, 'onChange' | 'onValidate'>>());

  const field = (path: string): FieldProps => {
    let handler = handlers.current.get(path);
    if (!handler) {
      handler = { onChange: (value) => setValue(path, value), onValidate: () => validateField(path) };
      handlers.current.set(path, handler);
    }
    return { value: _get(state, path), error: readError(schema, errors, path, options.rootSuffix), ...handler };
  };

  const validate = useCallback(() => {
    const tree = validateAllSync(schema, latestState.current, options.rootSuffix);
    setErrors(tree ?? {}); // substitui a árvore inteira
    return tree === null;
  }, [schema, options.rootSuffix]);

  /** Remove o item do array E o nó de erros correspondente: a árvore continua paralela à lista. */
  const removeItem = useCallback((path: string, index: number) => {
    setState((prev) => produce(prev, (draft) => {
      (_get(draft, path) as unknown[]).splice(index, 1);
    }));
    setErrors((prev) => produce(prev, (draft) => {
      const items = _get(draft, path);
      if (Array.isArray(items)) items.splice(index, 1);
    }));
  }, []);

  const addItem = useCallback((path: string, item: unknown) => {
    setState((prev) => produce(prev, (draft) => {
      (_get(draft, path) as unknown[]).push(item);
    }));
  }, []);

  const clearForm = useCallback(() => {
    setState(schema.getDefault() as T);
    setErrors({});
  }, [schema]);

  return { state, setState, setValue, errors, setErrors, field, validate, validateField, removeItem, addItem, clearForm };
}
