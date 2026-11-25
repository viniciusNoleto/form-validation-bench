import { useMemo, type ReactNode } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import type { ErrorTree } from '../core/formCore';
import { useValidatedFormState } from './useValidatedFormState';
import { descriptionSchema, basicFormOptions, basicSchema, type BasicFormValues } from '../schemas/basicSchema';
import { FormTextInput } from './FormTextInput';
import { FormPassword } from './FormPassword';
import { FormTextarea } from './FormTextarea';
import { FormNumberInput } from './FormNumberInput';
import { FormCheckboxGroup } from './FormCheckboxGroup';
import { FormList } from './FormList';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Música' },
  { value: 'tech', label: 'Tecnologia' },
];

export function BasicForm({ onSubmit, rootSuffix = true, renderDebug }: {
  onSubmit: (data: BasicFormValues) => void;
  rootSuffix?: boolean;
  renderDebug?: (snapshot: { state: BasicFormValues; errors: ErrorTree }) => ReactNode;
}) {
  const options = useMemo(() => ({ ...basicFormOptions, rootSuffix }), [rootSuffix]);

  const {
    state: basicState,
    errors: basicErrors,
    field: basicField,
    validate: basicValidate,
    addItem: basicAddItem,
    removeItem: basicRemoveItem,
  } = useValidatedFormState(basicSchema, options);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!basicValidate()) return;
    onSubmit(basicSchema.cast(basicState));
  }

  return (
    <form
      noValidate
      onSubmit={submit}
    >
      <Stack>
        <FormTextInput
          label="Nome"
          {...basicField('name')}
        />

        <FormTextInput
          label="E-mail"
          {...basicField('email')}
        />

        <FormPassword
          label="Senha"
          {...basicField('password')}
        />

        <FormPassword
          label="Confirmação"
          {...basicField('password_confirmation')}
        />

        <FormNumberInput
          label="Capacidade"
          {...basicField('capacity')}
        />

        <FormTextInput
          label="CEP"
          {...basicField('address.zip')}
        />

        <FormTextInput
          label="Cidade"
          {...basicField('address.city')}
        />

        <FormCheckboxGroup
          label="Categorias"
          options={CATEGORY_OPTIONS}
          {...basicField('categories')}
        />

        <FormList
          legend="Descrições"
          {...basicField('descriptions')}
        >
          {basicState.descriptions.map((item, index) => (
            <Stack key={item.uid}>
              <FormTextInput
                label={`Título ${index + 1}`}
                {...basicField(`descriptions[${index}].title`)}
              />

              <FormTextarea
                label={`Conteúdo ${index + 1}`}
                {...basicField(`descriptions[${index}].content`)}
              />

              <Button
                variant="subtle"
                color="red"
                onClick={() => basicRemoveItem('descriptions', index)}
              >
                {`Remover ${index + 1}`}
              </Button>
            </Stack>
          ))}

          <Button
            variant="light"
            onClick={() => basicAddItem('descriptions', descriptionSchema.getDefault())}
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

      {renderDebug?.({ state: basicState, errors: basicErrors })}
    </form>
  );
}
