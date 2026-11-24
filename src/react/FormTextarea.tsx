import { memo } from 'react';
import { Textarea, type TextareaProps } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FormInputPropsOnChange, FormInputPropsOnValidate } from './types';

export type FormTextareaProps = FormInputPropsOnChange<TextareaProps, string> & FormInputPropsOnValidate;

export const FormTextarea = memo(function FormTextarea({ value, onChange, onValidate, ...props }: FormTextareaProps) {
  useNotFirstEffect(() => {
    onValidate?.();
  }, [value]);

  return (
    <Textarea
      {...props}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      onBlur={onValidate}
    />
  );
});
