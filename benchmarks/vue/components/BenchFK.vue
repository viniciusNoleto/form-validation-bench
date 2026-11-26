<template>
  <FormKit
    v-model="form[name]"
    type="text"
    :name="name"
    :aria-label="name"
    validation="yup"
    :validation-rules="{ yup: rule }"
    :validation-messages="{ yup: message }"
    validation-visibility="live"
    @input="touched = true"
    @blur="touched = true"
  >
    <template #messages="context">
      <FkMessage :name="name" :text="touched ? firstMessage(context.messages) : undefined" />
    </template>
  </FormKit>
</template>

<script setup lang="ts">
  import { h, type FunctionalComponent } from 'vue';
  import { FormKit } from '@formkit/vue';
  import { stats } from '../stats';

  defineProps<{ name: string; form: Record<string, unknown>; rule: any; message: any }>();
  let touched = false;
  const firstMessage = (messages: Record<string, { visible: boolean; type: string; value: unknown }>) =>
    Object.values(messages ?? {}).find((m) => m.visible && m.type === 'validation')?.value as string | undefined;

  // O FormKit renderiza o próprio componente; a contagem é a de renders da seção de mensagens do campo.
  const FkMessage: FunctionalComponent<{ name: string; text?: string }> = ({ name, text }) => {
    stats.updates++;
    if (name === 'f0') stats.trail.push(text ?? null);
    return text ? h('small', { role: 'alert' }, text) : null;
  };
</script>
