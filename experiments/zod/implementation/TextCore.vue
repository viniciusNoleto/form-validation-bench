<template>
  <input
    :aria-label="label"
    :type="type ?? 'text'"
    :value="modelValue ?? ''"
    @input="onInput"
    @blur="validate()"
  >
</template>

<script setup lang="ts">
  import { inject, type Ref } from 'vue';

  const props = defineProps<{ label: string; type?: string }>();

  const modelValue = inject('modelValue') as Ref<any>;
  const validate = inject('validate') as () => void;

  function onInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    modelValue.value = props.type === 'number' ? (raw === '' ? null : Number(raw)) : raw;
  }
</script>
