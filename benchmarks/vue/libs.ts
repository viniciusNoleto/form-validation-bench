// Bibliotecas no roteiro Vue (seção 8.4 do artigo): VeeValidate, Vuelidate e FormKit, as três
// bibliotecas de formulário/validação Vue mais baixadas do npm (26/10 a 24/11/2026). Todas validam
// com o MESMO esquema Yup, do jeito que cada documentação recomenda:
// - VeeValidate: useForm({ validationSchema }) no formulário e useField() em cada campo.
// - Vuelidate: useVuelidate(regras, estado, { $autoDirty: true }); a regra de cada campo chama o
//   esquema no caminho do campo (validateSyncAt), porque o Vuelidate não recebe esquema de formulário.
// - FormKit: inputs FormKit com uma regra própria que chama o esquema no caminho do campo; o FormKit
//   aplica o atraso padrão de 20 ms dos inputs de texto antes de gravar o valor.
// Exibição igual em todas, e igual à do padrão: o erro aparece depois que o usuário alterou o campo
// ou saiu dele (flag local do campo), nunca na montagem.
import { reactive } from 'vue';
import type * as yup from 'yup';
import { helpers } from '@vuelidate/validators';
import { validateAtSync } from '../../src/core/formCore';
import { countedSchema } from '../shared/countedSchema';
import { stats } from './stats';

export const counted = (schema: yup.ObjectSchema<any>) => countedSchema(schema, (kind) => {
  stats.validations++;
  if (kind === 'whole') stats.whole++;
});

/** Regras do Vuelidate: uma por campo, que valida o caminho do campo no esquema. */
export function vuelidateRules(schema: yup.ObjectSchema<any>, state: Record<string, unknown>) {
  const s = counted(schema);
  return Object.fromEntries(Object.keys(schema.fields).map((key) => [key, {
    yup: helpers.withMessage(({ $response }: any) => $response?.message ?? '', (value: unknown) => {
      const message = validateAtSync(s, key, { ...state, [key]: value });
      return { $valid: !message, message };
    }),
  }]));
}

/** FormKit: estado do formulário e a regra que valida o caminho do campo; a mensagem fica guardada para o validation-messages. */
export function formKitForm(schema: yup.ObjectSchema<any>) {
  const s = counted(schema);
  const form = reactive(schema.getDefault()) as Record<string, unknown>;
  const last: Record<string, string | undefined> = {};
  const rule = (name: string) => Object.assign((node: { value: unknown }) => {
    last[name] = validateAtSync(s, name, { ...form, [name]: node.value });
    return !last[name];
  }, { skipEmpty: false }); // o FormKit pula regras em campo vazio, salvo esta marca: o "obrigatório" vem do esquema
  return { form, rule, message: (name: string) => () => last[name] ?? '' };
}
