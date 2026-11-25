import { computed, signal, untracked } from '@angular/core';
import { z } from 'zod';
import type { FieldRef } from '../../../src/angular/validatedForm';
import { type ErrorMap, type SchemaFormOptions, getDefaults, getIn, normalizePath, setIn, validateAll, validateAt } from './schemaForm';

/**
 * A mesma estratégia com Zod em Angular (signals, sem zone.js), como useSchemaForm (React) e
 * useSchemaFormVue (Vue): mapa plano de erros, validação local por caminho e objeto inteiro só nos
 * caminhos com regra entre campos. Devolve FieldRef, o mesmo contrato do validatedForm de src/angular:
 * os wrappers de src/angular funcionam sem mudança, o que mostra que eles não dependem do validador.
 */
export function schemaFormAngular<S extends z.ZodObject>(schema: S, options: SchemaFormOptions = {}) {
  type State = z.output<S>;
  const form = signal<State>(getDefaults(schema));
  const errors = signal<ErrorMap>({});

  /** Uma escrita só, e só se a mensagem mudou: sem mudança, o signal não notifica. */
  function setError(key: string, message?: string) {
    errors.update((prev) => {
      if (prev[key] === message) return prev;
      const next = { ...prev };
      if (message === undefined) delete next[key];
      else next[key] = message;
      return next;
    });
  }

  function validate(path: string) {
    untracked(() => {
      const key = normalizePath(path);
      setError(key, validateAt(schema, key, form(), options.crossFields));
      for (const dependent of options.dependents?.[key] ?? []) {
        if (errors()[dependent]) setError(dependent, validateAt(schema, dependent, form(), options.crossFields));
      }
    });
  }

  function setValue(path: string, value: unknown) {
    form.update((prev) => setIn(prev, path, value));
  }

  const fields = new Map<string, FieldRef>();
  function field<V = any>(path: string): FieldRef<V> {
    const key = normalizePath(path);
    let ref = fields.get(key);
    if (!ref) {
      ref = {
        name: key,
        value: computed(() => getIn(form(), key)),
        error: computed(() => errors()[key]),
        setValue: (value) => setValue(key, value),
        validate: () => validate(key),
      };
      fields.set(key, ref);
    }
    return ref as FieldRef<V>;
  }

  function validateForm() {
    const map = validateAll(schema, untracked(form));
    errors.set(map); // substitui o mapa inteiro
    return Object.keys(map).length === 0;
  }

  /** Mapa plano: os índices vão deslocar, então os erros dos itens saem todos (como no React e no Vue). */
  function clearErrorsUnder(prefix: string) {
    const start = `${normalizePath(prefix)}.`;
    errors.update((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(start)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }

  function addItem(path: string, item: unknown) {
    setValue(path, [...(getIn(untracked(form), path) as unknown[]), item]);
    validate(path);
  }

  function removeItem(path: string, index: number) {
    clearErrorsUnder(path);
    setValue(path, (getIn(untracked(form), path) as unknown[]).filter((_, i) => i !== index));
    validate(path);
  }

  return { form: form.asReadonly(), errors: errors.asReadonly(), field, validate, validateForm, addItem, removeItem };
}
