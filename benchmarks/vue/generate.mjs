// Gera os formulários do benchmark Vue: components/Form<variante><campos>.vue.
// Os campos são declarados um a um no template (sem v-for), como num formulário real; as variantes
// WV, FV e FVN declaram os mesmos campos com v-for, para medir o efeito do laço.
// Uso: node benchmarks/vue/generate.mjs
import fs from 'node:fs';

const wrap = (comp, extra = '') => (i) => `    <${comp} v-model="form.f${i}" name="f${i}" :error="error('f${i}')"${extra} />`;
const frame = (extra = '') => (i) => `    <BenchFrame v-model="form.f${i}" name="f${i}" :error="error('f${i}')" :validate="validate"${extra}><BenchCore label="f${i}" /></BenchFrame>`;

// v-for: uma linha só, repetida pelo laço sobre as chaves do esquema
const loop = (tag) => () => tag;
const WV = '    <BenchWrap v-for="key in keys" :key="key" v-model="form[key]" :name="key" :error="error(key)" :validate="validate" />';
const FV = '    <BenchFrame v-for="key in keys" :key="key" v-model="form[key]" :name="key" :error="error(key)" :validate="validate"><BenchCore :label="key" /></BenchFrame>';
const FVN = '    <BenchFrame v-for="key in keys" :key="key" v-model="form[key]" :name="key" :error="error(key)" :validate="validate"><BenchCore /></BenchFrame>';

// sigla: [linha de cada campo, componentes importados, composable, v-for?]
const VARIANTS = {
  H: [wrap('BenchWrap'), ['BenchWrap'], 'useFinal'], // linha de base: o campo nunca pede validação
  W: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useFinal'],
  F: [frame(), ['BenchFrame', 'BenchCore'], 'useFinal'],
  FWN: [frame(' use-watch'), ['BenchFrame', 'BenchCore'], 'useFinal'],
  FW: [frame(' use-watch :debounce="200"'), ['BenchFrame', 'BenchCore'], 'useFinal'],
  WC: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useClearThenSet'],
  WCS: [wrap('BenchWrap', ' :validate="validate"'), ['BenchWrap'], 'useClearThenSetSync'],
  WD: [wrap('BenchWrapDebounce', ' :validate="validate"'), ['BenchWrapDebounce'], 'useFinal'],
  O: [wrap('BenchWrapBlur', ' :validate="validate"'), ['BenchWrapBlur'], 'useObserver'], // observador do formulário
  WV: [loop(WV), ['BenchWrap'], 'useFinal', true], // wrapper num v-for
  FV: [loop(FV), ['BenchFrame', 'BenchCore'], 'useFinal', true], // frame num v-for, o slot usa a variável do laço
  FVN: [loop(FVN), ['BenchFrame', 'BenchCore'], 'useFinal', true], // frame num v-for, o slot não usa a variável do laço
};
const SIZES = { H: [20, 100, 500], W: [20, 100, 500], O: [20, 100, 500] };

for (const file of fs.readdirSync('benchmarks/vue/components')) {
  if (/^Form[A-Z0-9]+\.vue$/.test(file)) fs.rmSync(`benchmarks/vue/components/${file}`);
}
for (const [key, [line, comps, composable, vfor]] of Object.entries(VARIANTS)) {
  for (const n of SIZES[key] ?? [20, 500]) {
    const fields = vfor ? line() : Array.from({ length: n }, (_, i) => line(i)).join('\n');
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
  void validate;${vfor ? '\n  const keys = Object.keys(props.schema.fields);' : ''}
  onBeforeUpdate(() => { stats.formUpdates++; });
</script>
`;
    fs.writeFileSync(`benchmarks/vue/components/Form${key}${n}.vue`, sfc);
  }
}
console.log('ok');
