import { memo } from 'react';
import { NumberInput, type NumberInputProps } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FormInputPropsOnChange, FormInputPropsOnValidate } from './types';

export type FormNumberInputProps = FormInputPropsOnChange<NumberInputProps, number | null> & FormInputPropsOnValidate;

export const FormNumberInput = memo(function FormNumberInput({ value, onChange, onValidate, ...props }: FormNumberInputProps) {
  useNotFirstEffect(() => {
    onValidate?.();
  }, [value]);

  return (
    <NumberInput
      {...props}
      value={value ?? ''}
      onChange={(next) => onChange?.(typeof next === 'number' ? next : null)}
      onBlur={onValidate}
    />
  );
});
