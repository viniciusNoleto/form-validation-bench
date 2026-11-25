import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { type ErrorTree, errorPath, readError, validateAtSync } from '../../src/core/formCore';
import type { FieldProps } from '../../src/react/useValidatedFormState';
import { changedPaths } from '../shared/changedPaths';

/**
 * O hook de src/react/useValidatedFormState reduzido ao que o benchmark usa, com o modo de
 * gravação do erro como parâmetro. Só a gravação muda entre os modos; o resto é idêntico.
 *
 * - 'once'        : validateSyncAt + uma escrita, só se a mensagem mudou (a forma adotada)
 * - 'clear-sync'  : validateSyncAt + limpar e regravar no mesmo tique (duas escritas)
 * - 'clear-async' : limpar já e regravar quando a Promise do validateAt rejeitar
 * - 'once-eager'  : como 'once', mas compara com a árvore mais recente ANTES de chamar setErrors;
 *                   sem mudança, nem agenda render (o pai não renderiza de novo)
 * - 'observer'    : o campo não pede a validação na digitação; um useEffect sobre o estado do
 *                   formulário calcula os caminhos que mudaram e valida cada um (gravação como
 *                   'once-eager'); o campo continua validando no blur
 * - 'none'        : nunca valida (linha de base do harness: só o custo de digitar e renderizar)
 */
export type WriteMode = 'once' | 'once-eager' | 'clear-sync' | 'clear-async' | 'observer' | 'none';

export function useFormVariant<T extends object>(schema: yup.ObjectSchema<T>, mode: WriteMode, onValidateCall?: () => void) {
  const [state, setState] = useState<T>(() => schema.getDefault() as T);
  const [errors, setErrors] = useState<ErrorTree>({});
  const latestState = useRef(state);
  useLayoutEffect(() => {
    latestState.current = state;
  }, [state]);

  // árvore mais recente, atualizada na hora em cada escrita (não espera o commit)
  const errorsNow = useRef(errors);
  const writeEager = useCallback((path: string, message: string | undefined) => {
    const next = produce(errorsNow.current, (draft) => {
      const at = errorPath(schema, path);
      if (_get(draft, at) !== message) _set(draft, at, message);
    });
    if (next === errorsNow.current) return; // nada mudou: nenhum setState, nenhum render
    errorsNow.current = next;
    setErrors(next);
  }, [schema]);

  const write = useCallback((path: string, message: string | undefined, onlyIfChanged: boolean) => {
    setErrors((prev) => produce(prev, (draft) => {
      const at = errorPath(schema, path);
      if (!onlyIfChanged || _get(draft, at) !== message) _set(draft, at, message);
    }));
  }, [schema]);

  const validateField = useCallback((path: string) => {
    if (mode === 'none') return;
    onValidateCall?.();
    if (mode === 'once-eager' || mode === 'observer') {
      writeEager(path, validateAtSync(schema, path, latestState.current));
    } else if (mode === 'once') {
      write(path, validateAtSync(schema, path, latestState.current), true);
    } else if (mode === 'clear-sync') {
      write(path, undefined, false);
      write(path, validateAtSync(schema, path, latestState.current), false);
    } else {
      write(path, undefined, false);
      schema.validateAt(path, latestState.current).catch((error: yup.ValidationError) => {
        if (error.path === path) write(path, error.errors[0], false);
      });
    }
  }, [schema, mode, write, writeEager, onValidateCall]);

  // Variante O: observador do formulário. Roda depois do commit de cada mudança de estado.
  const observed = useRef(state);
  useEffect(() => {
    if (mode !== 'observer') return;
    const changed = changedPaths(observed.current, state);
    observed.current = state;
    for (const path of changed) validateField(path);
  }, [mode, state, validateField]);

  const handlers = useRef(new Map<string, Pick<FieldProps, 'onChange' | 'onValidate'>>());
  const field = (path: string): FieldProps => {
    let handler = handlers.current.get(path);
    if (!handler) {
      handler = {
        onChange: (value) => setState((prev) => produce(prev, (draft) => { _set(draft as object, path, value); })),
        onValidate: () => validateField(path),
      };
      handlers.current.set(path, handler);
    }
    return { value: _get(state, path), error: readError(schema, errors, path), ...handler };
  };

  return { state, errors, field };
}
