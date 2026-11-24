<template>
  <form>
    <Frame
      v-model="form.f0"
      :errors="errors.f0"
      :rules="rules"
      name="f0"
      :debounce="debounce"
    >
      <Input label="f0" />
    </Frame>

    <Frame
      v-model="form.f1"
      :errors="errors.f1"
      :rules="rules"
      name="f1"
      :debounce="debounce"
    >
      <Input label="f1" />
    </Frame>

    <Frame
      v-model="form.f2"
      :errors="errors.f2"
      :rules="rules"
      name="f2"
      :debounce="debounce"
    >
      <Input label="f2" />
    </Frame>

    <Frame
      v-model="form.f3"
      :errors="errors.f3"
      :rules="rules"
      name="f3"
      :debounce="debounce"
    >
      <Input label="f3" />
    </Frame>

    <Frame
      v-model="form.f4"
      :errors="errors.f4"
      :rules="rules"
      name="f4"
      :debounce="debounce"
    >
      <Input label="f4" />
    </Frame>

    <Frame
      v-model="form.f5"
      :errors="errors.f5"
      :rules="rules"
      name="f5"
      :debounce="debounce"
    >
      <Input label="f5" />
    </Frame>

    <Frame
      v-model="form.f6"
      :errors="errors.f6"
      :rules="rules"
      name="f6"
      :debounce="debounce"
    >
      <Input label="f6" />
    </Frame>

    <Frame
      v-model="form.f7"
      :errors="errors.f7"
      :rules="rules"
      name="f7"
      :debounce="debounce"
    >
      <Input label="f7" />
    </Frame>

    <Frame
      v-model="form.f8"
      :errors="errors.f8"
      :rules="rules"
      name="f8"
      :debounce="debounce"
    >
      <Input label="f8" />
    </Frame>

    <Frame
      v-model="form.f9"
      :errors="errors.f9"
      :rules="rules"
      name="f9"
      :debounce="debounce"
    >
      <Input label="f9" />
    </Frame>

    <Frame
      v-model="form.f10"
      :errors="errors.f10"
      :rules="rules"
      name="f10"
      :debounce="debounce"
    >
      <Input label="f10" />
    </Frame>

    <Frame
      v-model="form.f11"
      :errors="errors.f11"
      :rules="rules"
      name="f11"
      :debounce="debounce"
    >
      <Input label="f11" />
    </Frame>

    <Frame
      v-model="form.f12"
      :errors="errors.f12"
      :rules="rules"
      name="f12"
      :debounce="debounce"
    >
      <Input label="f12" />
    </Frame>

    <Frame
      v-model="form.f13"
      :errors="errors.f13"
      :rules="rules"
      name="f13"
      :debounce="debounce"
    >
      <Input label="f13" />
    </Frame>

    <Frame
      v-model="form.f14"
      :errors="errors.f14"
      :rules="rules"
      name="f14"
      :debounce="debounce"
    >
      <Input label="f14" />
    </Frame>

    <Frame
      v-model="form.f15"
      :errors="errors.f15"
      :rules="rules"
      name="f15"
      :debounce="debounce"
    >
      <Input label="f15" />
    </Frame>

    <Frame
      v-model="form.f16"
      :errors="errors.f16"
      :rules="rules"
      name="f16"
      :debounce="debounce"
    >
      <Input label="f16" />
    </Frame>

    <Frame
      v-model="form.f17"
      :errors="errors.f17"
      :rules="rules"
      name="f17"
      :debounce="debounce"
    >
      <Input label="f17" />
    </Frame>

    <Frame
      v-model="form.f18"
      :errors="errors.f18"
      :rules="rules"
      name="f18"
      :debounce="debounce"
    >
      <Input label="f18" />
    </Frame>

    <Frame
      v-model="form.f19"
      :errors="errors.f19"
      :rules="rules"
      name="f19"
      :debounce="debounce"
    >
      <Input label="f19" />
    </Frame>
  </form>
</template>

<script setup>
  import { ref } from 'vue';
  import { Frame, Input } from './frame.js';

  const props = defineProps({ useRules: Function, schema: Object, defaults: Object, keys: Array, debounce: Number });

  const form = ref({ ...props.defaults });
  const errors = ref({});
  const rules = props.useRules(props.schema, form, errors);
</script>
