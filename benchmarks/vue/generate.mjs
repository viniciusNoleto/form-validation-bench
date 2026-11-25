// Gera os formulários do benchmark Vue: components/Form<variante><campos>.vue.
// Os campos são declarados um a um no template (sem v-for), como num formulário real.
// Uso: node benchmarks/vue/generate.mjs
import fs from 'node:fs';

const wrap = (comp, extra = '') => (i) => `    <${comp} v-model="form.f${i}" name="f${i}" :error="error('f${i}')"${extra} />`;
const frame = (extra = '') => (i) => `    <BenchFrame v-model="form.f${i}" name="f${i}" :error="error('f${i}')" :validate="validate"${extra}><BenchCore label="f${i}" /></BenchFrame>`;

// sigla: [linha de cada campo, componentes importados, composable]
const VARIANTS = {
  H: [wrap('BenchWrap'), ['BenchWrap'], 'useFinal'], // linha de base: o campo nunca pede validação
  W: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useFinal'],
  F: [frame(), ['BenchFrame', 'BenchCore'], 'useFinal'],
  FWN: [frame(' use-watch'), ['BenchFrame', 'BenchCore'], 'useFinal'],
  FW: [frame(' use-watch :debounce="200"'), ['BenchFrame', 'BenchCore'], 'useFinal'],
  WC: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useClearThenSet'],
  WCS: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useClearThenSetSync'],
  WD: [wrap('BenchWrapDebounce', ' :validate="validate"'), ['BenchWrapDebounce'], 'useFinal'],
};
const SIZES = { H: [20, 100, 500], W: [20, 100, 500] };

for (const file of fs.readdirSync('benchmarks/vue/components')) {
  if (/^Form[A-Z0-9]+\.vue$/.test(file)) fs.rmSync(`benchmarks/vue/components/${file}`);
}
for (const [key, [line, comps, composable]] of Object.entries(VARIANTS)) {
  for (const n of SIZES[key] ?? [20, 500]) {
    const fields = Array.from({ length: n }, (_, i) => line(i)).join('\n');
    const sfc = `<!-- gerado por benchmarks/vue/generate.mjs: não editar à mão -->
<template>
  <form>
${fields}
  </form>
</template>

<script setup lang="ts">
  import { onBeforeUpdate } from 'vue';
${comps.map((c) => `  import ${c} from './${c}.vue';`).join('\n')}
  import { ${composable} } from '../composables';
  import { stats } from '../stats';
  const props = defineProps<{ schema: any }>();
  const { form, validate, error } = ${composable}(props.schema);
  void validate;
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
`;
    fs.writeFileSync(`benchmarks/vue/components/Form${key}${n}.vue`, sfc);
  }
}
console.log('ok');
