// Variantes de biblioteca no roteiro React (seção 8.3 do artigo): React Hook Form, TanStack Form e
// Formik, as três bibliotecas de formulário React mais baixadas do npm (26/10 a 24/11/2026).
// Cada uma usa o MESMO esquema Yup, do jeito que a documentação dela recomenda:
// - RHF: useForm({ mode: 'onChange', resolver: yupResolver(schema) }), inputs com register() e um
//   componente por campo que assina só o próprio estado (useFormState({ name })).
// - TanStack Form: validadores do formulário com o esquema (Standard Schema), na mudança e no blur;
//   o Yup implementa o Standard Schema de forma assíncrona, então entram como onChangeAsync/onBlurAsync.
// - Formik: <Formik validationSchema> com validateOnChange/validateOnBlur (padrão) e <Field>.
// Exibição igual em todas, e igual à do padrão: o erro do campo aparece depois que o usuário o
// alterou ou saiu dele (a flag `touched` local do campo), nunca na montagem.
import { memo, useMemo, useRef } from 'react';
import * as yup from 'yup';
import { useForm, useFormState, type Control, type UseFormRegister } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { Formik, Form as FormikForm, Field as FormikField, getIn, type FieldProps as FormikFieldProps } from 'formik';
import { stats } from './baseline-hooks.jsx';
import { countedSchema } from '../shared/countedSchema';

const counted = (schema: yup.ObjectSchema<any>) => countedSchema(schema, (kind) => {
  stats.validations++;
  if (kind === 'whole') stats.whole++;
});

/** Campo comum às três: conta renders, registra a mensagem de f0 e só exibe o erro depois de tocado. */
function useTouched() {
  const touched = useRef(false);
  return { touched, touch: () => { touched.current = true; } };
}
function show(name: string, error: string | undefined, touched: boolean) {
  stats.renders++;
  const shown = touched ? error : undefined;
  if (name === 'f0') stats.errorTrail.push(shown ?? null);
  return shown;
}

// ===== React Hook Form =====
const RhfField = memo(function RhfField({ name, control, register }: { name: string; control: Control<any>; register: UseFormRegister<any> }) {
  const { errors } = useFormState({ control, name });
  const { touched, touch } = useTouched();
  const error = show(name, errors[name]?.message as string | undefined, touched.current);
  const reg = register(name);
  return (
    <label>
      <input aria-label={name} {...reg} onChange={(e) => { touch(); return reg.onChange(e); }} onBlur={(e) => { touch(); return reg.onBlur(e); }} />
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
});

export function FormRHF({ schema }: { schema: yup.ObjectSchema<any> }) {
  stats.formRenders++;
  const resolver = useMemo(() => yupResolver(counted(schema)), [schema]);
  const { control, register } = useForm({ mode: 'onChange', reValidateMode: 'onChange', resolver, defaultValues: schema.getDefault() });
  return <form>{Object.keys(schema.fields).map((k) => <RhfField key={k} name={k} control={control} register={register} />)}</form>;
}

// ===== TanStack Form =====
const TanStackField = memo(function TanStackField({ name, value, error, onChange, onBlur }: { name: string; value: string; error?: string; onChange: (v: string) => void; onBlur: () => void }) {
  const { touched, touch } = useTouched();
  const shown = show(name, error, touched.current);
  return (
    <label>
      <input aria-label={name} value={value ?? ''} onChange={(e) => { touch(); onChange(e.currentTarget.value); }} onBlur={() => { touch(); onBlur(); }} />
      {shown ? <span role="alert">{shown}</span> : null}
    </label>
  );
});

export function FormTanStack({ schema }: { schema: yup.ObjectSchema<any> }) {
  stats.formRenders++;
  const validator = useMemo(() => counted(schema), [schema]);
  const form = useTanStackForm({ defaultValues: schema.getDefault(), validators: { onChangeAsync: validator, onBlurAsync: validator } });
  return (
    <form>
      {Object.keys(schema.fields).map((k) => (
        <form.Field key={k} name={k}>
          {(field) => {
            const first = field.state.meta.errors[0] as { message?: string } | string | undefined;
            const error = typeof first === 'string' ? first : first?.message;
            return <TanStackField name={k} value={field.state.value} error={error} onChange={field.handleChange} onBlur={field.handleBlur} />;
          }}
        </form.Field>
      ))}
    </form>
  );
}

// ===== Formik =====
function FormikInput({ field, form }: FormikFieldProps) {
  const { touched, touch } = useTouched();
  const error = show(field.name, getIn(form.errors, field.name), touched.current);
  return (
    <label>
      <input aria-label={field.name} name={field.name} value={field.value ?? ''} onChange={(e) => { touch(); field.onChange(e); }} onBlur={(e) => { touch(); field.onBlur(e); }} />
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
}

export function FormFormik({ schema }: { schema: yup.ObjectSchema<any> }) {
  const validationSchema = useMemo(() => counted(schema), [schema]);
  // o estado vive dentro do <Formik>: o "render do formulário" é o da função filha, que roda a cada mudança
  return (
    <Formik initialValues={schema.getDefault()} validationSchema={validationSchema} onSubmit={() => {}}>
      {() => {
        stats.formRenders++;
        return <FormikForm>{Object.keys(schema.fields).map((k) => <FormikField key={k} name={k} component={FormikInput} />)}</FormikForm>;
      }}
    </Formik>
  );
}
