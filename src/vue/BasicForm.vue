<template>
  <form
    novalidate
    @submit.prevent="submit"
  >
    <FormText
      v-model="form.name"
      name="name"
      :error="error('name')"
      :validate="validate"
      label="Nome"
    />

    <FormText
      v-model="form.email"
      name="email"
      :error="error('email')"
      :validate="validate"
      label="E-mail"
    />

    <FormText
      v-model="form.password"
      name="password"
      :error="error('password')"
      :validate="validate"
      label="Senha"
      type="password"
    />

    <FormText
      v-model="form.password_confirmation"
      name="password_confirmation"
      :error="error('password_confirmation')"
      :validate="validate"
      label="Confirmação"
      type="password"
    />

    <FormNumber
      v-model="form.capacity"
      name="capacity"
      :error="error('capacity')"
      :validate="validate"
      label="Capacidade"
    />

    <FormText
      v-model="form.address.zip"
      name="address.zip"
      :error="error('address.zip')"
      :validate="validate"
      label="CEP"
    />

    <FormText
      v-model="form.address.city"
      name="address.city"
      :error="error('address.city')"
      :validate="validate"
      label="Cidade"
    />

    <FormCheckboxGroup
      v-model="form.categories"
      name="categories"
      :error="error('categories')"
      :validate="validate"
      :options="CATEGORY_OPTIONS"
      label="Categorias"
    />

    <FormList
      :error="error('descriptions')"
      label="Descrições"
    >
      <div
        v-for="(item, index) in form.descriptions"
        :key="item.uid"
      >
        <FormText
          v-model="item.title"
          :name="`descriptions[${index}].title`"
          :error="error(`descriptions[${index}].title`)"
          :validate="validate"
          :label="`Título ${index + 1}`"
        />

        <FormTextarea
          v-model="item.content"
          :name="`descriptions[${index}].content`"
          :error="error(`descriptions[${index}].content`)"
          :validate="validate"
          :label="`Conteúdo ${index + 1}`"
        />

        <button
          type="button"
          @click="removeItem('descriptions', index)"
        >
          {{ `Remover ${index + 1}` }}
        </button>
      </div>

      <button
        type="button"
        @click="addItem('descriptions', descriptionSchema.getDefault())"
      >
        Adicionar descrição
      </button>
    </FormList>

    <button type="submit">
      Salvar
    </button>

    <slot
      name="debug"
      :form="form"
      :errors="errors"
    />
  </form>
</template>

<script setup lang="ts">
  import FormText from './FormText.vue';
  import FormTextarea from './FormTextarea.vue';
  import FormNumber from './FormNumber.vue';
  import FormCheckboxGroup from './FormCheckboxGroup.vue';
  import FormList from './FormList.vue';
  import { useValidatedForm } from './useValidatedForm';
  import { descriptionSchema, basicFormOptions, basicSchema } from '../schemas/basicSchema';

  const CATEGORY_OPTIONS = [
    { value: 'music', label: 'Música' },
    { value: 'tech', label: 'Tecnologia' },
  ];

  const props = withDefaults(defineProps<{ rootSuffix?: boolean }>(), { rootSuffix: true });

  const emit = defineEmits<{ submit: [data: unknown] }>();

  const { form, errors, error, validate, validateForm, addItem, removeItem } = useValidatedForm(basicSchema, { ...basicFormOptions, rootSuffix: props.rootSuffix });

  function submit() {
    if (!validateForm()) return;
    emit('submit', basicSchema.cast(form.value));
  }
</script>
