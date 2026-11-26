<template>
  <label>
    <InputText :model-value="modelValue" :aria-label="name" @update:model-value="input" @blur="blur" />
    <small v-if="shown()" role="alert">{{ shown() }}</small>
  </label>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import InputText from 'primevue/inputtext';
  import { stats } from '../stats';

  // field = v$.<campo> do Vuelidate: $errors, $touch
  const props = defineProps<{ name: string; modelValue?: string; field: any }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();
  let touched = false;
  const shown = () => (touched ? (props.field.$errors[0]?.$message as string | undefined) || undefined : undefined);
  function input(v: string | undefined) { touched = true; emit('update:modelValue', v); }
  function blur() { touched = true; props.field.$touch(); }

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(shown() ?? null);
  });
</script>
