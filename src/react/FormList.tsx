import type { ReactNode } from 'react';
import { Fieldset, Text } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FieldProps } from './useValidatedFormState';

/** Contêiner sem input: valida o próprio array quando um item entra ou sai. */
export function FormList({ legend, value, error, onValidate, children }: FieldProps<unknown[]> & { legend: string; children: ReactNode }) {
  useNotFirstEffect(() => {
    onValidate();
  }, [value?.length]);

  return (
    <Fieldset legend={legend}>
      {children}

      {typeof error === 'string' ? (
        <Text
          role="alert"
          data-field={legend}
          c="red"
          size="sm"
        >
          {error}
        </Text>
      ) : null}
    </Fieldset>
  );
}
