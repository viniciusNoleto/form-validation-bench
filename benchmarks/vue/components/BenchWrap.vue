<template>
  <label>
    <InputText
      :model-value="modelValue"
      :aria-label="name"
      @update:model-value="update"
      @blur="validate"
    />
    <small
      v-if="message"
      role="alert"
    >{{ message }}</small>
  </label>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import InputText from 'primevue/inputtext';
  import { useFormField } from '../../../src/vue/useFormField';
  import { stats } from '../stats';

  const props = defineProps<{ name: string; validate?: (name: string) => void; error?: unknown; modelValue?: string }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();
  const { update, validate, message } = useFormField(props, emit);

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(typeof props.error === 'string' ? props.error : null);
  });
</script>
