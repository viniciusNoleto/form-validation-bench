import { memo } from 'react';
import { PasswordInput, type PasswordInputProps } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FormInputPropsOnChange, FormInputPropsOnValidate } from './types';

export type FormPasswordProps = FormInputPropsOnChange<PasswordInputProps, string> & FormInputPropsOnValidate;

export const FormPassword = memo(function FormPassword({ value, onChange, onValidate, ...props }: FormPasswordProps) {
  useNotFirstEffect(() => {
    onValidate?.();
  }, [value]);

  return (
    <PasswordInput
      {...props}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      onBlur={onValidate}
    />
  );
});
