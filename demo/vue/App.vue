<template>
  <main class="page">
    <h2>
      Vue + PrimeVue · árvore de erros
    </h2>

    <ol class="steps">
      <li
        v-for="step in STEPS"
        :key="step"
      >
        {{ step }}
      </li>
    </ol>

    <SelectButton
      v-model="mode"
      :options="MODES"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      @change="submitted = null"
    />

    <div class="grid">
      <section class="form-col">
        <EventForm
          :key="mode"
          :root-suffix="mode === 'root'"
          @submit="submitted = $event"
        >
          <template #debug="{ form, errors }">
            <Teleport
              defer
              to="#debug-root"
            >
              <strong>Árvore de erros</strong>

              <pre><span
                v-for="(item, i) in highlight(JSON.stringify(errors, null, 2))"
                :key="i"
                :class="{ root: item.root }"
              >{{ item.line }}
</span></pre>

              <strong>Estado</strong>

              <pre>{{ JSON.stringify(form, null, 2) }}</pre>
            </Teleport>
          </template>
        </EventForm>

        <Message
          v-if="submitted"
          severity="success"
        >
          Enviado: {{ JSON.stringify(submitted) }}
        </Message>
      </section>

      <aside
        id="debug-root"
        class="debug"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import SelectButton from 'primevue/selectbutton';
  import Message from 'primevue/message';
  import EventForm from '../../src/case-study/vue/EventForm.vue';
  import { STEPS, highlight } from '../guide';

  const MODES = [
    { value: 'root', label: 'com :root (final)' },
    { value: 'naive', label: 'árvore ingênua' },
  ];

  const mode = ref<'root' | 'naive'>('root');
  const submitted = ref<unknown>(null);
</script>

<style>
  body { font-family: system-ui, sans-serif; margin: 0; }
  .page { max-width: 1280px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .steps { font-size: 14px; margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
  .form-col form { display: flex; flex-direction: column; gap: 14px; }
  .form-field { display: flex; flex-direction: column; gap: 4px; font-size: 14px; border: 0; padding: 0; margin: 0; }
  .form-field small[role=alert] { color: #dc2626; }
  fieldset.form-field { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; gap: 10px; }
  fieldset.form-field > div { display: flex; flex-direction: column; gap: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e5e7eb; }
  button { align-self: flex-start; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
  button[type=submit] { background: #10b981; color: #fff; border-color: #10b981; }
  .debug { position: sticky; top: 16px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 48px); overflow: auto; }
  .debug pre { background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; margin: 0; }
  .debug .root { background: #fef08a; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
