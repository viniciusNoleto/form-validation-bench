import { useMemo, type ReactNode } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import type { ErrorTree } from '../../core/formCore';
import { useValidatedFormState } from '../../react/useValidatedFormState';
import { descriptionSchema, eventFormOptions, eventSchema, type EventForm as EventFormData } from '../eventSchema';
import { FormTextInput } from '../../react/FormTextInput';
import { FormPassword } from '../../react/FormPassword';
import { FormTextarea } from '../../react/FormTextarea';
import { FormNumberInput } from '../../react/FormNumberInput';
import { FormCheckboxGroup } from '../../react/FormCheckboxGroup';
import { FormList } from '../../react/FormList';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Música' },
  { value: 'tech', label: 'Tecnologia' },
];

export function EventForm({ onSubmit, rootSuffix = true, renderDebug }: {
  onSubmit: (data: EventFormData) => void;
  rootSuffix?: boolean;
  renderDebug?: (snapshot: { state: EventFormData; errors: ErrorTree }) => ReactNode;
}) {
  const options = useMemo(() => ({ ...eventFormOptions, rootSuffix }), [rootSuffix]);

  const {
    state: eventState,
    errors: eventErrors,
    field: eventField,
    validate: eventValidate,
    addItem: eventAddItem,
    removeItem: eventRemoveItem,
  } = useValidatedFormState(eventSchema, options);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!eventValidate()) return;
    onSubmit(eventSchema.cast(eventState));
  }

  return (
    <form
      noValidate
      onSubmit={submit}
    >
      <Stack>
        <FormTextInput
          label="Nome"
          {...eventField('name')}
        />

        <FormTextInput
          label="E-mail"
          {...eventField('email')}
        />

        <FormPassword
          label="Senha"
          {...eventField('password')}
        />

        <FormPassword
          label="Confirmação"
          {...eventField('password_confirmation')}
        />

        <FormNumberInput
          label="Capacidade"
          {...eventField('capacity')}
        />

        <FormTextInput
          label="CEP"
          {...eventField('address.zip')}
        />

        <FormTextInput
          label="Cidade"
          {...eventField('address.city')}
        />

        <FormCheckboxGroup
          label="Categorias"
          options={CATEGORY_OPTIONS}
          {...eventField('categories')}
        />

        <FormList
          legend="Descrições"
          {...eventField('descriptions')}
        >
          {eventState.descriptions.map((item, index) => (
            <Stack key={item.uid}>
              <FormTextInput
                label={`Título ${index + 1}`}
                {...eventField(`descriptions[${index}].title`)}
              />

              <FormTextarea
                label={`Conteúdo ${index + 1}`}
                {...eventField(`descriptions[${index}].content`)}
              />

              <Button
                variant="subtle"
                color="red"
                onClick={() => eventRemoveItem('descriptions', index)}
              >
                {`Remover ${index + 1}`}
              </Button>
            </Stack>
          ))}

          <Button
            variant="light"
            onClick={() => eventAddItem('descriptions', descriptionSchema.getDefault())}
          >
            Adicionar descrição
          </Button>
        </FormList>

        <Group justify="flex-end">
          <Button type="submit">
            Salvar
          </Button>
        </Group>
      </Stack>

      {renderDebug?.({ state: eventState, errors: eventErrors })}
    </form>
  );
}
