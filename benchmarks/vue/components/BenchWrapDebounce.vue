<template>
  <label>
    <InputText
      :model-value="modelValue"
      :aria-label="name"
      @update:model-value="update"
      @blur="blur"
    />
    <small
      v-if="message"
      role="alert"
    >{{ message }}</small>
  </label>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onBeforeUpdate } from 'vue';
  import InputText from 'primevue/inputtext';
  import _debounce from 'lodash-es/debounce';
  import { stats } from '../stats';

  const props = defineProps<{ name: string; validate?: (name: string) => void; error?: unknown; modelValue?: string; debounce?: number }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();

  const run = () => props.validate?.(props.name);
  const debounced = _debounce(run, props.debounce ?? 200);

  function update(value: string | undefined) {
    emit('update:modelValue', value);
    debounced();
  }

  function blur() {
    debounced.cancel();
    run(); // no blur, valida na hora
  }

  onBeforeUnmount(() => debounced.cancel());

  const message = computed(() => (typeof props.error === 'string' ? props.error : undefined));

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(typeof props.error === 'string' ? props.error : null);
  });
</script>
