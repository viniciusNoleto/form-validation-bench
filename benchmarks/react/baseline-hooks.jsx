import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import _debounce from 'lodash-es/debounce';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { normalizePath, validateAtLocal, flatErrors, getDefaults } from '../../experiments/zod/zodPartial.mjs';

export const stats = { renders: 0, formRenders: 0, validations: 0, errorTrail: [], reset() { this.renders = 0; this.formRenders = 0; this.validations = 0; this.errorTrail = []; } };

function setStateDeepValue(setState, path, value) {
  setState(prev => produce(prev, draft => { _set(draft, path, value); }));
}
function getValidError(errors, path) { const e = _get(errors, path); return typeof e === 'string' ? e : undefined; }

export function useNotFirstEffect(effect, deps) {
  const prev = useRef(null);
  useEffect(() => {
    const p = prev.current; prev.current = deps;
    if (p === null || (p.length === deps.length && p.every((d, i) => Object.is(d, deps[i])))) return;
    effect();
  }, deps); // eslint-disable-line
}

// ===== A: cópia fiel da implementação atual (Yup) =====
export function useValidatedFormStateA(schema) {
  const [state, setState] = useState(schema.getDefault());
  const latestState = useRef(state);
  useLayoutEffect(() => { latestState.current = state; }, [state]);
  const [errors, setErrors] = useState({});
  const field = useCallback((path) => ({
    error: getValidError(errors, path),
    value: _get(state, path),
    onChange: (value) => setStateDeepValue(setState, path, value),
    onValidate: () => {
      stats.validations++;
      setStateDeepValue(setErrors, path, undefined);
      schema.validateAt(path, latestState.current).catch((error) => path === error.path && setStateDeepValue(setErrors, error.path, error.errors[0]));
    },
  }), [state, errors, schema]);
  const validate = async () => schema.validate(state, { abortEarly: false }).then(() => true).catch((ve) => {
    const n = {}; ve.inner.forEach((e) => { if (e.path) n[e.path] = e.errors[0]; }); setErrors(n); return false;
  });
  return { state, errors, field, validate, setState };
}

// ===== B: proposta (Zod) — validação síncrona, mapa plano, set único com bail-out, handlers estáveis =====
export function useValidatedFormStateB(schema) {
  const [state, setState] = useState(() => getDefaults(schema));
  const stateRef = useRef(state);
  stateRef.current = state; // lido apenas em handlers/effects, após o commit
  const [errors, setErrors] = useState({});

  const setError = useCallback((key, message) => {
    setErrors(prev => {
      if (prev[key] === message) return prev; // bail-out: nenhum re-render
      const next = { ...prev };
      if (message === undefined) delete next[key]; else next[key] = message;
      return next;
    });
  }, []);

  const handlers = useRef(new Map());
  const getHandlers = (path) => {
    let h = handlers.current.get(path);
    if (!h) {
      const key = normalizePath(path);
      h = {
        onChange: (value) => setState(prev => produce(prev, d => { _set(d, key, value); })),
        onValidate: () => { stats.validations++; setError(key, validateAtLocal(schema, key, stateRef.current)); },
      };
      handlers.current.set(path, h);
    }
    return h;
  };

  const field = (path) => {
    const key = normalizePath(path);
    const error = errors[key];
    return { value: _get(state, key), error: typeof error === 'string' ? error : undefined, ...getHandlers(path) };
  };

  const validate = () => { const e = flatErrors(schema, stateRef.current); setErrors(e); return Object.keys(e).length === 0; };
  return { state, errors, field, validate, setState };
}

// Frame do input: detecta a alteração do valor e pede a validação do próprio campo.
export function TextField({ value, onChange, onValidate, error, name }) {
  stats.renders++;
  if (name === 'f0') stats.errorTrail.push(error ?? null);
  useNotFirstEffect(() => { onValidate?.(); }, [value]);
  return (
    <label>
      <input aria-label={name} value={value ?? ''} onChange={e => onChange?.(e.currentTarget.value)} onBlur={onValidate} />
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
}
export const MemoTextField = memo(TextField);

// Mesmo campo com debounce de 200 ms na digitação; o blur cancela o pendente e valida na hora.
export const MemoDebouncedTextField = memo(function DebouncedTextField({ value, onChange, onValidate, error, name }) {
  stats.renders++;
  if (name === 'f0') stats.errorTrail.push(error ?? null);
  const latest = useRef(onValidate);
  latest.current = onValidate;
  const validateLater = useMemo(() => _debounce(() => latest.current?.(), 200), []);
  useEffect(() => () => validateLater.cancel(), [validateLater]);
  useNotFirstEffect(() => { validateLater(); }, [value]);
  return (
    <label>
      <input aria-label={name} value={value ?? ''} onChange={e => onChange?.(e.currentTarget.value)} onBlur={() => { validateLater.cancel(); onValidate?.(); }} />
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
});
