<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchFrame v-model="form.f0" name="f0" :error="error('f0')" :validate="validate" use-watch :debounce="200"><BenchCore label="f0" /></BenchFrame>
    <BenchFrame v-model="form.f1" name="f1" :error="error('f1')" :validate="validate" use-watch :debounce="200"><BenchCore label="f1" /></BenchFrame>
    <BenchFrame v-model="form.f2" name="f2" :error="error('f2')" :validate="validate" use-watch :debounce="200"><BenchCore label="f2" /></BenchFrame>
    <BenchFrame v-model="form.f3" name="f3" :error="error('f3')" :validate="validate" use-watch :debounce="200"><BenchCore label="f3" /></BenchFrame>
    <BenchFrame v-model="form.f4" name="f4" :error="error('f4')" :validate="validate" use-watch :debounce="200"><BenchCore label="f4" /></BenchFrame>
    <BenchFrame v-model="form.f5" name="f5" :error="error('f5')" :validate="validate" use-watch :debounce="200"><BenchCore label="f5" /></BenchFrame>
    <BenchFrame v-model="form.f6" name="f6" :error="error('f6')" :validate="validate" use-watch :debounce="200"><BenchCore label="f6" /></BenchFrame>
    <BenchFrame v-model="form.f7" name="f7" :error="error('f7')" :validate="validate" use-watch :debounce="200"><BenchCore label="f7" /></BenchFrame>
    <BenchFrame v-model="form.f8" name="f8" :error="error('f8')" :validate="validate" use-watch :debounce="200"><BenchCore label="f8" /></BenchFrame>
    <BenchFrame v-model="form.f9" name="f9" :error="error('f9')" :validate="validate" use-watch :debounce="200"><BenchCore label="f9" /></BenchFrame>
    <BenchFrame v-model="form.f10" name="f10" :error="error('f10')" :validate="validate" use-watch :debounce="200"><BenchCore label="f10" /></BenchFrame>
    <BenchFrame v-model="form.f11" name="f11" :error="error('f11')" :validate="validate" use-watch :debounce="200"><BenchCore label="f11" /></BenchFrame>
    <BenchFrame v-model="form.f12" name="f12" :error="error('f12')" :validate="validate" use-watch :debounce="200"><BenchCore label="f12" /></BenchFrame>
    <BenchFrame v-model="form.f13" name="f13" :error="error('f13')" :validate="validate" use-watch :debounce="200"><BenchCore label="f13" /></BenchFrame>
    <BenchFrame v-model="form.f14" name="f14" :error="error('f14')" :validate="validate" use-watch :debounce="200"><BenchCore label="f14" /></BenchFrame>
    <BenchFrame v-model="form.f15" name="f15" :error="error('f15')" :validate="validate" use-watch :debounce="200"><BenchCore label="f15" /></BenchFrame>
    <BenchFrame v-model="form.f16" name="f16" :error="error('f16')" :validate="validate" use-watch :debounce="200"><BenchCore label="f16" /></BenchFrame>
    <BenchFrame v-model="form.f17" name="f17" :error="error('f17')" :validate="validate" use-watch :debounce="200"><BenchCore label="f17" /></BenchFrame>
    <BenchFrame v-model="form.f18" name="f18" :error="error('f18')" :validate="validate" use-watch :debounce="200"><BenchCore label="f18" /></BenchFrame>
    <BenchFrame v-model="form.f19" name="f19" :error="error('f19')" :validate="validate" use-watch :debounce="200"><BenchCore label="f19" /></BenchFrame>
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
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
