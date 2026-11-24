import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  type ErrorMap, type SchemaFormOptions,
  getDefaults, getIn, normalizePath, setIn, validateAll, validateAt,
} from './schemaForm';

export type FieldProps<V = any> = {
  value: V;
  error: string | undefined;
  onChange: (value: V) => void;
  onValidate: () => void;
};

export function useSchemaForm<S extends z.ZodObject>(schema: S, options: SchemaFormOptions = {}) {
  type State = z.output<S>;

  const [state, setState] = useState<State>(() => getDefaults(schema));
  const [errors, setErrors] = useState<ErrorMap>({});

  // Estado e erros mais recentes para callbacks estáveis (atualizados antes dos efeitos dos filhos).
  const stateRef = useRef(state);
  const errorsRef = useRef(errors);
  useLayoutEffect(() => {
    stateRef.current = state;
    errorsRef.current = errors;
  }, [state, errors]);

  const setError = useCallback((key: string, message?: string) => {
    setErrors((prev) => {
      if (prev[key] === message) return prev;
      const next = { ...prev };
      if (message === undefined) delete next[key];
      else next[key] = message;
      return next;
    });
  }, []);

  const validateField = useCallback((path: string) => {
    const key = normalizePath(path);
    setError(key, validateAt(schema, key, stateRef.current, options.crossFields));

    for (const dependent of options.dependents?.[key] ?? []) {
      if (errorsRef.current[dependent]) setError(dependent, validateAt(schema, dependent, stateRef.current, options.crossFields));
    }
  }, [schema, setError, options.crossFields, options.dependents]);

  const setValue = useCallback((path: string, value: unknown) => {
    setState((prev) => setIn(prev, path, value));
  }, []);

  // Um par de callbacks por caminho, criado uma vez: permite React.memo nos inputs.
  const handlers = useRef(new Map<string, Pick<FieldProps, 'onChange' | 'onValidate'>>());

  const field = (path: string): FieldProps => {
    const key = normalizePath(path);
    let handler = handlers.current.get(key);
    if (!handler) {
      handler = { onChange: (value) => setValue(key, value), onValidate: () => validateField(key) };
      handlers.current.set(key, handler);
    }
    const error = errors[key];
    return { value: getIn(state, key), error: typeof error === 'string' ? error : undefined, ...handler };
  };

  const validate = useCallback(() => {
    const map = validateAll(schema, stateRef.current);
    setErrors(map); // substitui: nada de erro antigo sobrevivendo
    return Object.keys(map).length === 0;
  }, [schema]);

  const clearErrorsUnder = useCallback((prefix: string) => {
    const key = normalizePath(prefix);
    setErrors((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${key}.`)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(getDefaults(schema));
    setErrors({});
  }, [schema]);

  return { state, setState, setValue, errors, setErrors, field, validate, validateField, clearErrorsUnder, reset };
}
