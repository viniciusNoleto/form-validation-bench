<template>
  <label class="form-field">
    {{ label }}

    <InputText
      :model-value="modelValue === null || modelValue === undefined ? '' : String(modelValue)"
      inputmode="numeric"
      :aria-label="label"
      :invalid="!!message"
      fluid
      @update:model-value="(raw) => update(raw === '' || raw === undefined ? null : Number(raw))"
      @blur="validate"
    />

    <small
      v-if="message"
      role="alert"
      :data-field="label"
    >
      {{ message }}
    </small>
  </label>
</template>

<script setup lang="ts">
  import InputText from 'primevue/inputtext';
  import { useFormField } from './useFormField';

  const props = defineProps<{
    name: string;
    validate?: (name: string) => void;
    error?: unknown;
    modelValue?: number | null;
    label?: string;
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

  const { update, validate, message } = useFormField(props, emit);
</script>
