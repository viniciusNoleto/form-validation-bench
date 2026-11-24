<template>
  <fieldset class="form-field">
    <legend>
      {{ label }}
    </legend>

    <slot />

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
  import { computed } from 'vue';

  // Contêiner sem input: só exibe o erro do próprio array.
  // Quem valida o array são as operações addItem/removeItem do formulário.
  const props = defineProps<{ label?: string; error?: unknown }>();

  const message = computed(() => (typeof props.error === 'string' ? props.error : undefined));
</script>
