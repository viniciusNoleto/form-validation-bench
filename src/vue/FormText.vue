<template>
  <label class="form-field">
    {{ label }}

    <InputText
      :model-value="modelValue"
      :type="type ?? 'text'"
      :aria-label="label"
      :invalid="!!message"
      fluid
      @update:model-value="update"
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
    modelValue?: string | null;
    label?: string;
    type?: string;
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();

  const { update, validate, message } = useFormField(props, emit);
</script>
