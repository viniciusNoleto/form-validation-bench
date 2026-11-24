import * as yup from 'yup';
import _set from 'lodash-es/set.js';
import _get from 'lodash-es/get.js';
import { produce } from 'immer';

const schema = yup.object({
  descriptions: yup.array().of(yup.object({ title: yup.string().required('título obrigatório').default('') })).min(2, 'mínimo 2 descrições').default([]),
});
const form = { descriptions: [{ title: '' }] };
const frameFormat = v => (v === null ? [] : typeof v === 'object' ? v : [v]); // frame.vue

console.log('=== Vue (erros como string[] num objeto aninhado) ===');
const errors = { descriptions: [] }; // useInitialErrors
try { schema.validateSync(form, { abortEarly: false }); } catch (e) {
  console.log('paths emitidos pelo Yup, na ordem:', e.inner.map(i => i.path));
  e.inner.forEach(i => _set(errors, i.path, i.errors)); // useValidateSchema
}
console.log('V1. após submit, errors.descriptions =', JSON.stringify(errors.descriptions), '  <- o erro do item 0 foi sobrescrito pelo do array');
// o usuário digita no título do item 0 -> useRules limpa o caminho do item
_set(errors, 'descriptions[0].title', []);
console.log('V2. após editar o item, errors.descriptions =', JSON.stringify(errors.descriptions));
console.log('    o frame de "descriptions" renderiza:', frameFormat(errors.descriptions).map(m => typeof m === 'string' ? m : `<objeto ${JSON.stringify(m)}>`));
console.log('    com filtro typeof === "string":', frameFormat(errors.descriptions).filter(m => typeof m === 'string'), '  <- e a mensagem do array se perdeu');

console.log('\n=== React (erros como string num objeto) ===');
let rerr = {};
try { schema.validateSync(form, { abortEarly: false }); } catch (e) { e.inner.forEach(i => { if (i.path) rerr[i.path] = i.errors[0]; }); }
console.log('R1. após submit (chaves planas):', JSON.stringify(rerr));
console.log("R2. field('descriptions[0].title').error =", _get(rerr, 'descriptions[0].title'));
console.log("    field('descriptions.0.title').error  =", _get(rerr, 'descriptions.0.title'), '  <- notação com ponto não encontra a chave plana');
rerr = produce(rerr, d => { _set(d, 'descriptions.0.title', undefined); });
console.log("R3. onValidate('descriptions.0.title') limpa com _set:", JSON.stringify(rerr, (k, v) => v === undefined ? '<undef>' : v), '  <- destruiu a mensagem do array');
const containerError = { descriptions: [{ title: 'título obrigatório' }] }.descriptions;
console.log('R4. erro do contêiner aninhado: truthy =', !!containerError, '| typeof string =', typeof containerError === 'string', '-> `{error}` em JSX lançaria "Objects are not valid as a React child"');

console.log('\n=== Proposta: mapa plano com chave normalizada ===');
const norm = p => p.replace(/\[(\d+)\]/g, '.$1');
let flat = {};
try { schema.validateSync(form, { abortEarly: false }); } catch (e) { e.inner.forEach(i => { const k = norm(i.path); if (!(k in flat)) flat[k] = i.errors[0]; }); }
console.log('P1.', JSON.stringify(flat));
delete flat[norm('descriptions[0].title')];
console.log('P2. após corrigir o item:', JSON.stringify(flat), '  <- o erro do array sobrevive, sem colisão');
