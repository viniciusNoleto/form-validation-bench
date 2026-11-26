<template>
  <label>
    <InputText :model-value="value" :aria-label="name" @update:model-value="input" @blur="blur" />
    <small v-if="shown()" role="alert">{{ shown() }}</small>
  </label>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import InputText from 'primevue/inputtext';
  import { useField } from 'vee-validate';
  import { stats } from '../stats';

  const props = defineProps<{ name: string }>();
  const { value, errorMessage, handleBlur } = useField<string>(() => props.name);
  let touched = false; // não reativo, como o useRef do React: só decide a exibição no próximo render
  const shown = () => (touched ? errorMessage.value : undefined);
  function input(v: string | undefined) { touched = true; value.value = v ?? ''; }
  function blur(e: Event) { touched = true; handleBlur(e, true); }

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(shown() ?? null);
  });
</script>
