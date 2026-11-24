import { memo } from 'react';
import { TextInput, type TextInputProps } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FormInputPropsOnChange, FormInputPropsOnValidate } from './types';

export type FormTextInputProps = FormInputPropsOnChange<TextInputProps, string> & FormInputPropsOnValidate;

export const FormTextInput = memo(function FormTextInput({ value, onChange, onValidate, ...props }: FormTextInputProps) {
  useNotFirstEffect(() => {
    onValidate?.();
  }, [value]);

  return (
    <TextInput
      {...props}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      onBlur={onValidate}
    />
  );
});
