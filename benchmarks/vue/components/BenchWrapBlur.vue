<template>
  <label>
    <InputText
      :model-value="modelValue"
      :aria-label="name"
      @update:model-value="emit('update:modelValue', $event)"
      @blur="validate?.(name)"
    />
    <small
      v-if="message"
      role="alert"
    >{{ message }}</small>
  </label>
</template>

<script setup lang="ts">
  // Campo da variante O: não pede a validação ao mudar o valor (quem valida é o observador do
  // formulário); valida só no blur.
  import { computed, onBeforeUpdate } from 'vue';
  import InputText from 'primevue/inputtext';
  import { stats } from '../stats';

  const props = defineProps<{ name: string; validate?: (name: string) => void; error?: unknown; modelValue?: string }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();
  const message = computed(() => (typeof props.error === 'string' ? props.error : undefined));

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(typeof props.error === 'string' ? props.error : null);
  });
</script>
