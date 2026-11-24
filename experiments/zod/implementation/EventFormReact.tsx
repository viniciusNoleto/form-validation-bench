import { memo, useEffect, useRef, type DependencyList } from 'react';
import { useSchemaForm, type FieldProps } from './useSchemaForm';
import { descriptionSchema, eventFormOptions, eventSchema } from './eventSchema';
import { getDefaults } from './schemaForm';

export const renderLog: string[] = [];

function useNotFirstEffect(effect: () => void, deps: DependencyList) {
  const previous = useRef<DependencyList | null>(null);
  useEffect(() => {
    const last = previous.current;
    previous.current = deps;
    if (last === null || (last.length === deps.length && last.every((d, i) => Object.is(d, deps[i])))) return;
    effect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Frame de input: dono da detecção de mudança e do blur. */
const TextField = memo(function TextField({ label, value, error, onChange, onValidate, type = 'text' }: FieldProps & { label: string; type?: string }) {
  renderLog.push(label);
  useNotFirstEffect(() => onValidate(), [value]);

  return (
    <label>
      {label}
      <input
        aria-label={label}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? (e.currentTarget.value === '' ? null : Number(e.currentTarget.value)) : e.currentTarget.value)}
        onBlur={onValidate}
      />
      {typeof error === 'string' ? <span role="alert" data-field={label}>{error}</span> : null}
    </label>
  );
});

/** Frame de contêiner: sem input, valida quando o array muda (item adicionado/removido). */
function ListFrame({ label, value, error, onValidate, children }: FieldProps<unknown[]> & { label: string; children: React.ReactNode }) {
  useNotFirstEffect(() => onValidate(), [value?.length]);

  return (
    <fieldset>
      <legend>{label}</legend>
      {children}
      {typeof error === 'string' ? <span role="alert" data-field={label}>{error}</span> : null}
    </fieldset>
  );
}

export function EventFormReact({ onSubmit }: { onSubmit: (data: unknown) => void }) {
  const form = useSchemaForm(eventSchema, eventFormOptions);
  const { state, field, setValue, validate, clearErrorsUnder } = form;

  function addDescription() {
    setValue('descriptions', [...state.descriptions, getDefaults(descriptionSchema)]);
  }

  function removeDescription(index: number) {
    clearErrorsUnder('descriptions'); // índices vão deslocar
    setValue('descriptions', state.descriptions.filter((_, i) => i !== index));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(eventSchema.parse(state));
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField label="Nome" {...field('name')} />
      <TextField label="E-mail" {...field('email')} />
      <TextField label="Senha" type="password" {...field('password')} />
      <TextField label="Confirmação" type="password" {...field('password_confirmation')} />
      <TextField label="Capacidade" type="number" {...field('capacity')} />
      <TextField label="CEP" {...field('address.zip')} />
      <TextField label="Cidade" {...field('address.city')} />

      <ListFrame label="Categorias" {...field('categories')}>
        {['music', 'tech'].map((c) => (
          <label key={c}>
            <input
              type="checkbox"
              aria-label={c}
              checked={state.categories.includes(c)}
              onChange={(e) => setValue('categories', e.currentTarget.checked ? [...state.categories, c] : state.categories.filter((x) => x !== c))}
            />
            {c}
          </label>
        ))}
      </ListFrame>

      <ListFrame label="Descrições" {...field('descriptions')}>
        {state.descriptions.map((item, index) => (
          <div key={item.uid}>
            <TextField label={`Título ${index + 1}`} {...field(`descriptions.${index}.title`)} />
            <TextField label={`Conteúdo ${index + 1}`} {...field(`descriptions.${index}.content`)} />
            <button type="button" onClick={() => removeDescription(index)}>{`Remover ${index + 1}`}</button>
          </div>
        ))}
        <button type="button" onClick={addDescription}>Adicionar descrição</button>
      </ListFrame>

      <button type="submit">Salvar</button>
    </form>
  );
}
