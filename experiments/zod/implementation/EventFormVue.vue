<template>
  <form
    novalidate
    @submit.prevent="submit"
  >
    <InputFrame
      v-model="form.name"
      :errors="errors.name"
      :rules="rules"
      name="name"
      label="Nome"
    >
      <TextCore label="Nome" />
    </InputFrame>

    <InputFrame
      v-model="form.email"
      :errors="errors.email"
      :rules="rules"
      name="email"
      label="E-mail"
    >
      <TextCore label="E-mail" />
    </InputFrame>

    <InputFrame
      v-model="form.password"
      :errors="errors.password"
      :rules="rules"
      name="password"
      label="Senha"
    >
      <TextCore
        label="Senha"
        type="password"
      />
    </InputFrame>

    <InputFrame
      v-model="form.password_confirmation"
      :errors="errors.password_confirmation"
      :rules="rules"
      name="password_confirmation"
      label="Confirmação"
    >
      <TextCore
        label="Confirmação"
        type="password"
      />
    </InputFrame>

    <InputFrame
      v-model="form.capacity"
      :errors="errors.capacity"
      :rules="rules"
      name="capacity"
      label="Capacidade"
    >
      <TextCore
        label="Capacidade"
        type="number"
      />
    </InputFrame>

    <InputFrame
      v-model="form.address.zip"
      :errors="errors['address.zip']"
      :rules="rules"
      name="address.zip"
      label="CEP"
    >
      <TextCore label="CEP" />
    </InputFrame>

    <InputFrame
      v-model="form.address.city"
      :errors="errors['address.city']"
      :rules="rules"
      name="address.city"
      label="Cidade"
    >
      <TextCore label="Cidade" />
    </InputFrame>

    <InputFrame
      v-model="form.categories"
      :errors="errors.categories"
      :rules="rules"
      name="categories"
      label="Categorias"
      watch-length
    >
      <label
        v-for="category in ['music', 'tech']"
        :key="category"
      >
        <input
          type="checkbox"
          :aria-label="category"
          :checked="form.categories.includes(category)"
          @change="toggleCategory(category)"
        >
        {{ category }}
      </label>
    </InputFrame>

    <InputFrame
      v-model="form.descriptions"
      :errors="errors.descriptions"
      :rules="rules"
      name="descriptions"
      label="Descrições"
      watch-length
    >
      <div
        v-for="(item, index) in form.descriptions"
        :key="item.uid"
      >
        <InputFrame
          v-model="item.title"
          :errors="errors[`descriptions.${index}.title`]"
          :rules="rules"
          :name="`descriptions.${index}.title`"
          :label="`Título ${index + 1}`"
        >
          <TextCore :label="`Título ${index + 1}`" />
        </InputFrame>

        <InputFrame
          v-model="item.content"
          :errors="errors[`descriptions.${index}.content`]"
          :rules="rules"
          :name="`descriptions.${index}.content`"
          :label="`Conteúdo ${index + 1}`"
        >
          <TextCore :label="`Conteúdo ${index + 1}`" />
        </InputFrame>

        <button
          type="button"
          @click="removeDescription(index)"
        >
          {{ `Remover ${index + 1}` }}
        </button>
      </div>

      <button
        type="button"
        @click="addDescription"
      >
        Adicionar descrição
      </button>
    </InputFrame>

    <button type="submit">
      Salvar
    </button>
  </form>
</template>

<script setup lang="ts">
  import InputFrame from './InputFrame.vue';
  import TextCore from './TextCore.vue';
  import { useSchemaFormVue } from './useSchemaFormVue';
  import { descriptionSchema, eventFormOptions, eventSchema } from './eventSchema';
  import { getDefaults } from './schemaForm';

  const emit = defineEmits<{ submit: [data: unknown] }>();

  const { form, errors, rules, validate, clearErrorsUnder } = useSchemaFormVue(eventSchema, eventFormOptions);

  function toggleCategory(category: string) {
    form.value.categories = form.value.categories.includes(category)
      ? form.value.categories.filter((c) => c !== category)
      : [...form.value.categories, category];
  }

  function addDescription() {
    form.value.descriptions = [...form.value.descriptions, getDefaults(descriptionSchema)];
  }

  function removeDescription(index: number) {
    clearErrorsUnder('descriptions');
    form.value.descriptions = form.value.descriptions.filter((_, i) => i !== index);
  }

  function submit() {
    if (!validate()) return;
    emit('submit', eventSchema.parse(form.value));
  }
</script>
