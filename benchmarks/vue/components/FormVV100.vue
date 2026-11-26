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
    <BenchVee name="f20" />
    <BenchVee name="f21" />
    <BenchVee name="f22" />
    <BenchVee name="f23" />
    <BenchVee name="f24" />
    <BenchVee name="f25" />
    <BenchVee name="f26" />
    <BenchVee name="f27" />
    <BenchVee name="f28" />
    <BenchVee name="f29" />
    <BenchVee name="f30" />
    <BenchVee name="f31" />
    <BenchVee name="f32" />
    <BenchVee name="f33" />
    <BenchVee name="f34" />
    <BenchVee name="f35" />
    <BenchVee name="f36" />
    <BenchVee name="f37" />
    <BenchVee name="f38" />
    <BenchVee name="f39" />
    <BenchVee name="f40" />
    <BenchVee name="f41" />
    <BenchVee name="f42" />
    <BenchVee name="f43" />
    <BenchVee name="f44" />
    <BenchVee name="f45" />
    <BenchVee name="f46" />
    <BenchVee name="f47" />
    <BenchVee name="f48" />
    <BenchVee name="f49" />
    <BenchVee name="f50" />
    <BenchVee name="f51" />
    <BenchVee name="f52" />
    <BenchVee name="f53" />
    <BenchVee name="f54" />
    <BenchVee name="f55" />
    <BenchVee name="f56" />
    <BenchVee name="f57" />
    <BenchVee name="f58" />
    <BenchVee name="f59" />
    <BenchVee name="f60" />
    <BenchVee name="f61" />
    <BenchVee name="f62" />
    <BenchVee name="f63" />
    <BenchVee name="f64" />
    <BenchVee name="f65" />
    <BenchVee name="f66" />
    <BenchVee name="f67" />
    <BenchVee name="f68" />
    <BenchVee name="f69" />
    <BenchVee name="f70" />
    <BenchVee name="f71" />
    <BenchVee name="f72" />
    <BenchVee name="f73" />
    <BenchVee name="f74" />
    <BenchVee name="f75" />
    <BenchVee name="f76" />
    <BenchVee name="f77" />
    <BenchVee name="f78" />
    <BenchVee name="f79" />
    <BenchVee name="f80" />
    <BenchVee name="f81" />
    <BenchVee name="f82" />
    <BenchVee name="f83" />
    <BenchVee name="f84" />
    <BenchVee name="f85" />
    <BenchVee name="f86" />
    <BenchVee name="f87" />
    <BenchVee name="f88" />
    <BenchVee name="f89" />
    <BenchVee name="f90" />
    <BenchVee name="f91" />
    <BenchVee name="f92" />
    <BenchVee name="f93" />
    <BenchVee name="f94" />
    <BenchVee name="f95" />
    <BenchVee name="f96" />
    <BenchVee name="f97" />
    <BenchVee name="f98" />
    <BenchVee name="f99" />
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
