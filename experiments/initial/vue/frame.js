import { h, ref, computed, watch, provide, inject, defineComponent } from 'vue';
import _set from 'lodash-es/set';
import _get from 'lodash-es/get';
import _debounce from 'lodash-es/debounce';
import { validateAtLocal, normalizePath } from '../../zod/zodPartial.mjs';

export const vstats = { frameRenders: 0, validations: 0, trail: [], reset() { this.frameRenders = 0; this.validations = 0; this.trail = []; } };

// ===== A: cópia fiel do composable useRules (Yup) =====
export function useRulesA(schema, form, errors) {
  return (field) => {
    vstats.validations++;
    _set(errors.value, field, []);
    schema.validateAt(field, form.value).catch((error) => {
      if (field === error.path) _set(errors.value, error.path, error.errors);
    });
  };
}

// ===== B: proposta (Zod síncrono, atribuição única e só quando muda) =====
export function useRulesB(schema, form, errors) {
  return (field) => {
    vstats.validations++;
    const key = normalizePath(field);
    const message = validateAtLocal(schema, key, form.value);
    const current = _get(errors.value, key);
    const next = message ? [message] : [];
    const same = Array.isArray(current) && current.length === next.length && current.every((m, i) => m === next[i]);
    if (!same) _set(errors.value, key, next);
  };
}

// Frame: dono do v-model; observa o valor e dispara a validação do próprio campo.
export const Frame = defineComponent({
  props: { rules: Function, name: String, modelValue: null, errors: { type: [Array, Object], default: () => [] }, debounce: { type: Number, default: 200 } },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const validate = computed(() => {
      if (!props.rules || !props.name) return () => {};
      const run = () => props.rules(props.name);
      return props.debounce ? _debounce(run, props.debounce) : run;
    });
    watch(() => props.modelValue, () => validate.value());
    provide('validate', validate);
    provide('modelValue', computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) }));
    const messages = computed(() => (Array.isArray(props.errors) ? props.errors : []).filter(m => typeof m === 'string'));
    return () => {
      vstats.frameRenders++; if (props.name === 'f0') vstats.trail.push(messages.value[0] ?? null);
      return h('label', [slots.default?.(), ...messages.value.map(m => h('span', { role: 'alert' }, m))]);
    };
  },
});

export const Input = defineComponent({
  props: { label: String },
  setup(props) {
    const model = inject('modelValue');
    const validate = inject('validate');
    return () => h('input', { 'aria-label': props.label, value: model.value, onInput: (e) => { model.value = e.target.value; }, onBlur: () => validate.value() });
  },
});
