<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchFrame v-for="key in keys" :key="key" v-model="form[key]" :name="key" :error="error(key)" :validate="validate"><BenchCore /></BenchFrame>
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import BenchFrame from './BenchFrame.vue';
  import BenchCore from './BenchCore.vue';
  import { useFinal } from '../composables';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  const { form, validate, error } = useFinal(props.schema);
  void validate;
  const keys = Object.keys(props.schema.fields);
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
