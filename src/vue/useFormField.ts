import { computed } from 'vue';

/** Props comuns a todo wrapper de campo: o mesmo contrato do `field(p)` do React. */
export type FormFieldProps = {
  name: string;
  validate?: (name: string) => void;
  error?: unknown;
};

/**
 * Liga um wrapper de campo à validação. Sem watch: a validação é chamada no próprio evento.
 * O emit de update:modelValue é síncrono — quando ele retorna, o v-model do pai já gravou o valor.
 */
export function useFormField(props: FormFieldProps, emit: (event: 'update:modelValue', value: any) => void) {
  const validate = () => props.validate?.(props.name);

  function update(value: unknown) {
    emit('update:modelValue', value);
    validate();
  }

  // Só string é erro deste campo; objeto/array são erros dos filhos.
  const message = computed(() => (typeof props.error === 'string' ? props.error : undefined));

  return { update, validate, message };
}
