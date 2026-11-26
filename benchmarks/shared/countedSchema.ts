// Cópia de um esquema Yup que conta cada chamada externa de validação (validate, validateSync,
// validateAt, validateSyncAt e a interface Standard Schema). Usada nas variantes de biblioteca, que
// chamam o esquema por conta própria: a contagem diz quantas vezes cada biblioteca valida, e se
// valida o formulário inteiro ou um caminho.
import type * as yup from 'yup';

export type SchemaCalls = { whole: number; path: number };

export function countedSchema<S extends yup.ObjectSchema<any>>(schema: S, onCall: (kind: 'whole' | 'path') => void): S {
  const s = schema.clone() as any;
  const proto = Object.getPrototypeOf(s);
  for (const name of ['validate', 'validateSync'] as const) {
    s[name] = function (...args: unknown[]) { onCall('whole'); return proto[name].apply(this, args); };
  }
  for (const name of ['validateAt', 'validateSyncAt'] as const) {
    s[name] = function (...args: unknown[]) { onCall('path'); return proto[name].apply(this, args); };
  }
  // Standard Schema: o getter do protótipo chama schema.validate(); conta-se aqui e não lá.
  Object.defineProperty(s, '~standard', {
    configurable: true,
    get() {
      let owner = proto; // o getter fica na classe-base do Yup, não em ObjectSchema
      while (owner && !Object.getOwnPropertyDescriptor(owner, '~standard')) owner = Object.getPrototypeOf(owner);
      const inner = Object.getOwnPropertyDescriptor(owner, '~standard')!.get!.call(schema);
      return { ...inner, validate: (value: unknown) => { onCall('whole'); return inner.validate(value); } };
    },
  });
  return s as S;
}
