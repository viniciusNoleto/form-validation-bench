<template>
  <fieldset class="form-field">
    <legend>
      {{ label }}
    </legend>

    <label
      v-for="option in options"
      :key="option.value"
    >
      <Checkbox
        :model-value="modelValue"
        :value="option.value"
        :input-id="`${name}-${option.value}`"
        @update:model-value="update"
      />

      {{ option.label }}
    </label>

    <small
      v-if="message"
      role="alert"
      :data-field="label"
    >
      {{ message }}
    </small>
  </fieldset>
</template>

<script setup lang="ts">
  import Checkbox from 'primevue/checkbox';
  import { useFormField } from './useFormField';

  const props = defineProps<{
    name: string;
    validate?: (name: string) => void;
    error?: unknown;
    modelValue?: string[];
    label?: string;
    options: { value: string; label: string }[];
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

  const { update, message } = useFormField(props, emit);
</script>
