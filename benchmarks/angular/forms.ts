import { computed, effect, Injector, signal, untracked } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';
import { produce } from 'immer';
import { validatedForm, type FieldRef } from '../../src/angular/validatedForm';
import { readError, validateAtSync } from '../../src/core/formCore';
import { changedPaths } from '../shared/changedPaths';
import { stats } from './stats';
import type { FormGroup } from '@angular/forms';
import type { FieldTree } from '@angular/forms/signals';
import { formlyConfig, reactiveGroup, signalTree } from './libs';

/** kind: estrutura do campo no BenchForm (padrão: o wrapper BenchField, que valida no evento). */
export type BenchForm = {
  field: (path: string) => FieldRef;
  kind?: 'observed' | 'frame' | 'effect' | 'reactive' | 'signal' | 'formly';
  destroy?: () => void;
  /** variantes de biblioteca (benchmarks/angular/libs.ts) */
  group?: FormGroup;
  tree?: FieldTree<any>;
  formly?: ReturnType<typeof formlyConfig>;
};

const noField = (): FieldRef => { throw new Error('variante de biblioteca: o campo vem da própria biblioteca'); };
export const reactiveForm = (schema: yup.ObjectSchema<any>): BenchForm => ({ kind: 'reactive', field: noField, group: reactiveGroup(schema) });
export const signalForms = (schema: yup.ObjectSchema<any>): BenchForm => { const { tree, destroy } = signalTree(schema); return { kind: 'signal', field: noField, tree, destroy }; };
export const formlyForm = (schema: yup.ObjectSchema<any>): BenchForm => ({ kind: 'formly', field: noField, formly: formlyConfig(schema) });

/** A forma adotada com outra estrutura de campo: frame (F) ou wrapper que observa o próprio valor (WN). */
export const withKind = (kind: BenchForm['kind']) => (schema: yup.ObjectSchema<any>): BenchForm => ({ ...finalForm(schema), kind });

/** Final: o validatedForm de src/angular (validateSyncAt + gravação única), contando validações. */
export function finalForm(schema: yup.ObjectSchema<any>): BenchForm {
  const form = validatedForm(schema);
  const counted = new Map<string, FieldRef>();
  return {
    field(path) {
      let ref = counted.get(path);
      if (!ref) {
        const inner = form.field(path);
        ref = { ...inner, validate: () => { stats.validations++; inner.validate(); } };
        counted.set(path, ref);
      }
      return ref;
    },
  };
}

/**
 * Variante O: observador do formulário. O campo não pede a validação na digitação (o componente
 * BenchFieldObserved só grava o valor); um effect sobre o signal do formulário calcula os caminhos que
 * mudaram e valida cada um. O campo continua validando no blur.
 */
export function observerForm(schema: yup.ObjectSchema<any>): BenchForm {
  const form = validatedForm(schema);
  let previous = untracked(form.form);
  const observer = effect(() => {
    const next = form.form();
    untracked(() => {
      const changed = changedPaths(previous, next);
      previous = next;
      for (const path of changed) { stats.validations++; form.validate(path); }
    });
  }, { injector: TestBed.inject(Injector) });
  const refs = new Map<string, FieldRef>();
  return {
    kind: 'observed',
    destroy: () => observer.destroy(), // o effect vive no injetor raiz: destruído junto com o formulário
    field(path) {
      let ref = refs.get(path);
      if (!ref) {
        const inner = form.field(path);
        ref = { ...inner, validate: () => { stats.validations++; inner.validate(); } };
        refs.set(path, ref);
      }
      return ref;
    },
  };
}

/** Linha de base do harness: o validatedForm de src/angular, mas o campo nunca valida. */
export function noValidationForm(schema: yup.ObjectSchema<any>): BenchForm {
  const form = validatedForm(schema);
  const refs = new Map<string, FieldRef>();
  return {
    field(path) {
      let ref = refs.get(path);
      if (!ref) { ref = { ...form.field(path), validate: () => {} }; refs.set(path, ref); }
      return ref;
    },
  };
}

/** Alternativa síncrona: limpar e regravar no mesmo tique, com validateSyncAt (separa o fator "assíncrono"). */
export function clearThenSetSyncForm(schema: yup.ObjectSchema<any>): BenchForm {
  return clearThenSet(schema, true);
}

/** Alternativa: limpar o erro e regravá-lo quando a Promise do validateAt resolver. */
export function clearThenSetForm(schema: yup.ObjectSchema<any>): BenchForm {
  return clearThenSet(schema, false);
}

function clearThenSet(schema: yup.ObjectSchema<any>, sync: boolean): BenchForm {
  const form = signal(schema.getDefault());
  const errors = signal<Record<string, any>>({});
  const write = (path: string, message?: string) => errors.update((prev) => produce(prev, (draft) => { _set(draft, path, message); }));
  const refs = new Map<string, FieldRef>();
  return {
    field(path) {
      let ref = refs.get(path);
      if (!ref) {
        ref = {
          name: path,
          value: computed(() => _get(form(), path)),
          error: computed(() => readError(schema, errors(), path)),
          setValue: (value) => form.update((prev) => produce(prev, (draft: any) => { _set(draft, path, value); })),
          validate: () => {
            stats.validations++;
            write(path, undefined);
            if (sync) write(path, validateAtSync(schema, path, form()));
            else schema.validateAt(path, form()).catch((error: yup.ValidationError) => write(path, error.errors[0]));
          },
        };
        refs.set(path, ref);
      }
      return ref;
    },
  };
}
