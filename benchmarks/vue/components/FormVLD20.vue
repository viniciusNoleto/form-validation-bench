<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
    <BenchVld v-model="state.f0" name="f0" :field="v$.f0" />
    <BenchVld v-model="state.f1" name="f1" :field="v$.f1" />
    <BenchVld v-model="state.f2" name="f2" :field="v$.f2" />
    <BenchVld v-model="state.f3" name="f3" :field="v$.f3" />
    <BenchVld v-model="state.f4" name="f4" :field="v$.f4" />
    <BenchVld v-model="state.f5" name="f5" :field="v$.f5" />
    <BenchVld v-model="state.f6" name="f6" :field="v$.f6" />
    <BenchVld v-model="state.f7" name="f7" :field="v$.f7" />
    <BenchVld v-model="state.f8" name="f8" :field="v$.f8" />
    <BenchVld v-model="state.f9" name="f9" :field="v$.f9" />
    <BenchVld v-model="state.f10" name="f10" :field="v$.f10" />
    <BenchVld v-model="state.f11" name="f11" :field="v$.f11" />
    <BenchVld v-model="state.f12" name="f12" :field="v$.f12" />
    <BenchVld v-model="state.f13" name="f13" :field="v$.f13" />
    <BenchVld v-model="state.f14" name="f14" :field="v$.f14" />
    <BenchVld v-model="state.f15" name="f15" :field="v$.f15" />
    <BenchVld v-model="state.f16" name="f16" :field="v$.f16" />
    <BenchVld v-model="state.f17" name="f17" :field="v$.f17" />
    <BenchVld v-model="state.f18" name="f18" :field="v$.f18" />
    <BenchVld v-model="state.f19" name="f19" :field="v$.f19" />
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
  import BenchVld from './BenchVld.vue';
  import { reactive } from 'vue';
  import { useVuelidate } from '@vuelidate/core';
  import { vuelidateRules } from '../libs';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  const state = reactive(props.schema.getDefault());
  const v$ = useVuelidate(vuelidateRules(props.schema, state), state, { $autoDirty: true });
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
