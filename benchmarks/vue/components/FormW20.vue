<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchWrap v-model="form.f0" name="f0" :error="error('f0')" :validate="validate" />
    <BenchWrap v-model="form.f1" name="f1" :error="error('f1')" :validate="validate" />
    <BenchWrap v-model="form.f2" name="f2" :error="error('f2')" :validate="validate" />
    <BenchWrap v-model="form.f3" name="f3" :error="error('f3')" :validate="validate" />
    <BenchWrap v-model="form.f4" name="f4" :error="error('f4')" :validate="validate" />
    <BenchWrap v-model="form.f5" name="f5" :error="error('f5')" :validate="validate" />
    <BenchWrap v-model="form.f6" name="f6" :error="error('f6')" :validate="validate" />
    <BenchWrap v-model="form.f7" name="f7" :error="error('f7')" :validate="validate" />
    <BenchWrap v-model="form.f8" name="f8" :error="error('f8')" :validate="validate" />
    <BenchWrap v-model="form.f9" name="f9" :error="error('f9')" :validate="validate" />
    <BenchWrap v-model="form.f10" name="f10" :error="error('f10')" :validate="validate" />
    <BenchWrap v-model="form.f11" name="f11" :error="error('f11')" :validate="validate" />
    <BenchWrap v-model="form.f12" name="f12" :error="error('f12')" :validate="validate" />
    <BenchWrap v-model="form.f13" name="f13" :error="error('f13')" :validate="validate" />
    <BenchWrap v-model="form.f14" name="f14" :error="error('f14')" :validate="validate" />
    <BenchWrap v-model="form.f15" name="f15" :error="error('f15')" :validate="validate" />
    <BenchWrap v-model="form.f16" name="f16" :error="error('f16')" :validate="validate" />
    <BenchWrap v-model="form.f17" name="f17" :error="error('f17')" :validate="validate" />
    <BenchWrap v-model="form.f18" name="f18" :error="error('f18')" :validate="validate" />
    <BenchWrap v-model="form.f19" name="f19" :error="error('f19')" :validate="validate" />
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import BenchWrap from './BenchWrap.vue';
  import { useFinal } from '../composables';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  const { form, validate, error } = useFinal(props.schema);
  void validate;
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
