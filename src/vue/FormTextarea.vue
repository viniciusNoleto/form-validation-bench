<template>
  <label class="form-field">
    {{ label }}

    <Textarea
      :model-value="modelValue"
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
  import Textarea from 'primevue/textarea';
  import { useFormField } from './useFormField';

  const props = defineProps<{
    name: string;
    validate?: (name: string) => void;
    error?: unknown;
    modelValue?: string | null;
    label?: string;
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();

  const { update, validate, message } = useFormField(props, emit);
</script>
