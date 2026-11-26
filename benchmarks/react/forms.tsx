// Formulários do benchmark React: o hook de src/react e as variantes, montados num formulário de
// campos de texto. Usados pelo roteiro em jsdom (structure.test.tsx) e pela medição no Chromium
// (experiments/browser), para que os dois meçam os mesmos componentes.
import type * as yup from 'yup';
// A = reconstrução do hook anterior de produção (assíncrono, limpar e regravar); TextField = campo com useNotFirstEffect + onBlur
import { stats, useValidatedFormStateA, TextField, MemoTextField, MemoDebouncedTextField, MemoBlurTextField, MemoFrameField } from './baseline-hooks.jsx';
import { useFormVariant, type WriteMode } from './variantHooks';
import { useValidatedFormState } from '../../src/react/useValidatedFormState';
import { FormRHF, FormTanStack, FormFormik } from './libs';

// conta validações sem quebrar a estabilidade dos callbacks
const wrapped = new Map<Function, Function>();
function countValidate(fn: () => void) {
  let w = wrapped.get(fn);
  if (!w) { w = () => { stats.validations++; fn(); }; wrapped.set(fn, w); }
  return w as () => void;
}
/** O hook de src/react, contando validações. */
function useB(s: any) {
  const form = useValidatedFormState(s);
  return { ...form, field: (p: string) => { const f = form.field(p); return { ...f, onValidate: countValidate(f.onValidate) }; } };
}
const countCall = () => { stats.validations++; };
const useMode = (mode: WriteMode) => (s: any) => useFormVariant(s, mode, countCall);

export function makeForm(useHook: any, Field: any) {
  return function Form({ schema }: { schema: yup.ObjectSchema<any> }) {
    stats.formRenders++;
    const { field } = useHook(schema);
    return <form>{Object.keys(schema.fields).map((k) => <Field key={k} name={k} {...field(k)} />)}</form>;
  };
}

export const FORMS = {
  H: makeForm(useMode('none'), MemoTextField),
  A: makeForm(useValidatedFormStateA, TextField),
  A2: makeForm(useMode('clear-async'), TextField),
  A3: makeForm(useMode('clear-sync'), TextField),
  B0: makeForm(useMode('once'), TextField),
  B: makeForm(useB, TextField),
  C0: makeForm(useMode('once'), MemoTextField),
  C: makeForm(useB, MemoTextField),
  D: makeForm(useB, MemoDebouncedTextField),
  F: makeForm(useB, MemoFrameField),
  O: makeForm(useMode('observer'), MemoBlurTextField),
  RHF: FormRHF,
  TSF: FormTanStack,
  FMK: FormFormik,
};
