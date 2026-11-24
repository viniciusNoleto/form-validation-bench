<template>
  <InputText
    v-model="modelValue"
    :aria-label="label"
    @blur="validate"
  />
</template>

<script setup lang="ts">
  import { inject, onBeforeUpdate, type Ref } from 'vue';
  import InputText from 'primevue/inputtext';
  import { stats } from '../stats';

  defineProps<{ label: string }>();
  const modelValue = inject('modelValue') as Ref<any>;
  const validate = inject('validate') as () => void;

  onBeforeUpdate(() => { stats.updates++; });
</script>
