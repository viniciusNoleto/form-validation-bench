<template>
  <label>
    {{ label }}

    <slot />

    <span
      v-for="message in messages"
      :key="message"
      role="alert"
      :data-field="label"
    >
      {{ message }}
    </span>
  </label>
</template>

<script setup lang="ts">
  import { computed, provide, watch } from 'vue';

  const props = defineProps<{
    label: string;
    name: string;
    rules?: (name: string) => void;
    errors?: unknown;
    watchLength?: boolean;
  }>();

  const modelValue = defineModel<any>();

  // Só strings são erros deste frame; objetos/arrays de objetos pertencem aos filhos.
  const messages = computed<string[]>(() => {
    const value = props.errors;
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((m): m is string => typeof m === 'string');
    return [];
  });

  const validate = () => props.rules?.(props.name);

  // O frame é quem sabe que o valor mudou. Para contêineres, observa o tamanho.
  watch(() => (props.watchLength ? modelValue.value?.length : modelValue.value), validate);

  provide('modelValue', modelValue);
  provide('validate', validate);
</script>
