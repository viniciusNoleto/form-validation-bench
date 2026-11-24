import { memo } from 'react';
import { Checkbox, Group, type CheckboxGroupProps } from '@mantine/core';
import { useNotFirstEffect } from './hooks';
import type { FormInputPropsOnChange, FormInputPropsOnValidate } from './types';

export type FormCheckboxGroupProps = FormInputPropsOnChange<Omit<CheckboxGroupProps, 'children'>, string[]> & FormInputPropsOnValidate & {
  options: { value: string; label: string }[];
};

export const FormCheckboxGroup = memo(function FormCheckboxGroup({ value, onChange, onValidate, options, ...props }: FormCheckboxGroupProps) {
  useNotFirstEffect(() => {
    onValidate?.();
  }, [value]);

  return (
    <Checkbox.Group
      {...props}
      value={value ?? []}
      onChange={(next) => onChange?.(next)}
    >
      <Group>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </Group>
    </Checkbox.Group>
  );
});
