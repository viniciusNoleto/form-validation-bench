import * as yup from 'yup';

export const descriptionSchema = yup.object({
  uid: yup.string().default(() => crypto.randomUUID()), // chave estável de renderização
  title: yup.string().trim().required('Informe o título').default(''),
  content: yup.string().trim().min(10, 'Mínimo de 10 caracteres').default(''),
});

export const basicSchema = yup.object({
  name: yup.string().trim().required('Informe o nome').default(''),
  email: yup.string().trim().required('Informe o e-mail').email('E-mail inválido').default(''),
  password: yup.string().min(8, 'Mínimo de 8 caracteres').default(''),
  password_confirmation: yup.string()
    .required('Confirme a senha')
    .oneOf([yup.ref('password')], 'As senhas não conferem')
    .default(''),
  capacity: yup.number()
    .typeError('Informe a capacidade')
    .integer()
    .min(1, 'Capacidade mínima de 1')
    .nullable()
    .required('Informe a capacidade')
    .default(null),
  address: yup.object({
    zip: yup.string().matches(/^\d{5}-?\d{3}$/, 'CEP inválido').default(''),
    city: yup.string().trim().required('Informe a cidade').default(''),
  }),
  categories: yup.array().of(yup.string().required()).min(1, 'Escolha ao menos uma categoria').default([]),
  descriptions: yup.array().of(descriptionSchema)
    .min(1, 'Adicione ao menos uma descrição')
    .max(5, 'No máximo 5 descrições')
    .default([]),
});

export type BasicFormValues = yup.InferType<typeof basicSchema>;

export const basicFormOptions = {
  dependents: { password: ['password_confirmation'] },
};
