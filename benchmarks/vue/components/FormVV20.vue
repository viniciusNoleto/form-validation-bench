<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchVee name="f0" />
    <BenchVee name="f1" />
    <BenchVee name="f2" />
    <BenchVee name="f3" />
    <BenchVee name="f4" />
    <BenchVee name="f5" />
    <BenchVee name="f6" />
    <BenchVee name="f7" />
    <BenchVee name="f8" />
    <BenchVee name="f9" />
    <BenchVee name="f10" />
    <BenchVee name="f11" />
    <BenchVee name="f12" />
    <BenchVee name="f13" />
    <BenchVee name="f14" />
    <BenchVee name="f15" />
    <BenchVee name="f16" />
    <BenchVee name="f17" />
    <BenchVee name="f18" />
    <BenchVee name="f19" />
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import BenchVee from './BenchVee.vue';
  import { useForm } from 'vee-validate';
  import { counted } from '../libs';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  useForm({ validationSchema: counted(props.schema), initialValues: props.schema.getDefault() });
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
