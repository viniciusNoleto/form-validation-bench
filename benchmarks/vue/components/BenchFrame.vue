<template>
  <label>
    <slot />
    <small
      v-if="message"
      role="alert"
    >{{ message }}</small>
  </label>
</template>

<script setup lang="ts">
  import { computed, onBeforeUpdate, provide, watch } from 'vue';
  import _debounce from 'lodash-es/debounce';
  import { stats } from '../stats';

  const props = defineProps<{ name: string; validate?: (name: string) => void; error?: unknown; useWatch?: boolean; debounce?: number }>();
  const model = defineModel<any>();

  const run = () => props.validate?.(props.name);
  const validate = props.useWatch && props.debounce ? _debounce(run, props.debounce) : run;

  if (props.useWatch) watch(model, () => validate());

  provide('modelValue', computed({
    get: () => model.value,
    set: (value) => { model.value = value; if (!props.useWatch) validate(); },
  }));
  provide('validate', validate);

  const message = computed(() => (typeof props.error === 'string' ? props.error : undefined));

  onBeforeUpdate(() => {
    stats.updates++;
    if (props.name === 'f0') stats.trail.push(typeof props.error === 'string' ? props.error : null);
  });
</script>
