<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchFK name="f0" :form="form" :rule="rule('f0')" :message="message('f0')" />
    <BenchFK name="f1" :form="form" :rule="rule('f1')" :message="message('f1')" />
    <BenchFK name="f2" :form="form" :rule="rule('f2')" :message="message('f2')" />
    <BenchFK name="f3" :form="form" :rule="rule('f3')" :message="message('f3')" />
    <BenchFK name="f4" :form="form" :rule="rule('f4')" :message="message('f4')" />
    <BenchFK name="f5" :form="form" :rule="rule('f5')" :message="message('f5')" />
    <BenchFK name="f6" :form="form" :rule="rule('f6')" :message="message('f6')" />
    <BenchFK name="f7" :form="form" :rule="rule('f7')" :message="message('f7')" />
    <BenchFK name="f8" :form="form" :rule="rule('f8')" :message="message('f8')" />
    <BenchFK name="f9" :form="form" :rule="rule('f9')" :message="message('f9')" />
    <BenchFK name="f10" :form="form" :rule="rule('f10')" :message="message('f10')" />
    <BenchFK name="f11" :form="form" :rule="rule('f11')" :message="message('f11')" />
    <BenchFK name="f12" :form="form" :rule="rule('f12')" :message="message('f12')" />
    <BenchFK name="f13" :form="form" :rule="rule('f13')" :message="message('f13')" />
    <BenchFK name="f14" :form="form" :rule="rule('f14')" :message="message('f14')" />
    <BenchFK name="f15" :form="form" :rule="rule('f15')" :message="message('f15')" />
    <BenchFK name="f16" :form="form" :rule="rule('f16')" :message="message('f16')" />
    <BenchFK name="f17" :form="form" :rule="rule('f17')" :message="message('f17')" />
    <BenchFK name="f18" :form="form" :rule="rule('f18')" :message="message('f18')" />
    <BenchFK name="f19" :form="form" :rule="rule('f19')" :message="message('f19')" />
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import BenchFK from './BenchFK.vue';
  import { formKitForm } from '../libs';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  const { form, rule, message } = formKitForm(props.schema);
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
