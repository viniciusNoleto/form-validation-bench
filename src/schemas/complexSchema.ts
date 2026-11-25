// Esquema de alta complexidade usado nos testes do padrão (tests/case-study/complex/).
// 15 campos na raiz, até quatro níveis (partners[1].phones[0].whatsapp), regras que dependem de
// outros campos, regras sobre listas inteiras e uma regra que cruza sub-árvores (só na submissão).
import * as yup from 'yup';

/* ------------------------------------------------------------------ *
 * Domínios fechados                                                   *
 * ------------------------------------------------------------------ */
export const PERSON_TYPES = ['fisica', 'juridica'] as const;
export const PHONE_TYPES = ['celular', 'fixo', 'comercial'] as const;
export const ADDRESS_TYPES = ['residencial', 'comercial', 'correspondencia'] as const;
export const RELATIONSHIPS = ['conjuge', 'filho', 'enteado', 'pai_mae', 'outro'] as const;
export const ACCOUNT_TYPES = ['corrente', 'poupanca', 'pagamento'] as const;
export const PIX_KEY_TYPES = ['cpf_cnpj', 'email', 'telefone', 'aleatoria'] as const;
export const CHANNELS = ['email', 'sms', 'whatsapp'] as const;
export const LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PR', 'PB', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

/* ------------------------------------------------------------------ *
 * Regras auxiliares                                                   *
 * ------------------------------------------------------------------ */
const digits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

/** CPF com dígitos verificadores. */
export function isCpf(value?: string | null): boolean {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

/** CNPJ com dígitos verificadores. */
export function isCnpj(value?: string | null): boolean {
  const d = digits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const check = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(d[12]) && check(13) === Number(d[13]);
}

/** Idade completa em anos numa data de referência. */
export function ageAt(birth: Date, ref: Date = new Date()): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

const uid = () => yup.string().default(() => crypto.randomUUID()); // chave estável de renderização

/* ------------------------------------------------------------------ *
 * Sub-esquemas reutilizáveis                                          *
 * ------------------------------------------------------------------ */
export const phoneSchema = yup.object({
  uid: uid(),
  type: yup.string().oneOf(PHONE_TYPES, 'Tipo de telefone inválido').required('Informe o tipo').default('celular'),
  number: yup.string().trim().required('Informe o número')
    .when('type', ([type], s) => (type === 'celular'
      ? s.test('mobile', 'Celular inválido', (v) => digits(v).length === 11 && digits(v)[2] === '9')
      : s.test('landline', 'Telefone inválido', (v) => digits(v).length === 10)))
    .default(''),
  whatsapp: yup.boolean()
    .when('type', { is: (t: string) => t !== 'celular', then: (s) => s.oneOf([false], 'WhatsApp só em celular') })
    .default(false),
});

export const addressSchema = yup.object({
  uid: uid(),
  type: yup.string().oneOf(ADDRESS_TYPES, 'Tipo de endereço inválido').required('Informe o tipo').default('residencial'),
  zip: yup.string().required('Informe o CEP').matches(/^\d{5}-?\d{3}$/, 'CEP inválido').default(''),
  street: yup.string().trim().required('Informe o logradouro').max(120, 'Máximo de 120 caracteres').default(''),
  number: yup.string().trim().required('Informe o número ou S/N')
    .matches(/^(\d{1,6}|S\/N)$/i, 'Use apenas números ou S/N').default(''),
  complement: yup.string().trim().max(60, 'Máximo de 60 caracteres').default(''),
  district: yup.string().trim().required('Informe o bairro').default(''),
  city: yup.string().trim().required('Informe a cidade').default(''),
  state: yup.string().oneOf(UFS, 'UF inválida').nullable().required('Informe a UF').default(null),
  is_primary: yup.boolean().default(false),
});

const addressListSchema = yup.array().of(addressSchema)
  .min(1, 'Adicione ao menos um endereço')
  .max(3, 'No máximo 3 endereços')
  .test('one-primary', 'Marque exatamente um endereço como principal',
    (list) => !list?.length || list.filter((a) => a.is_primary).length === 1)
  .default([]); // o primeiro endereço entra por addItem('addresses', addressSchema.getDefault())

const phoneListSchema = yup.array().of(phoneSchema)
  .min(1, 'Adicione ao menos um telefone')
  .max(4, 'No máximo 4 telefones')
  .test('unique-phone', 'Há telefones repetidos',
    (list) => new Set((list ?? []).map((p) => digits(p.number)).filter(Boolean)).size
      === (list ?? []).filter((p) => digits(p.number)).length)
  .default(() => [phoneSchema.getDefault()]);

/** Sócio (pessoa jurídica): três níveis abaixo da raiz — partners[i].address.zip, partners[i].phones[j].number. */
export const partnerSchema = yup.object({
  uid: uid(),
  name: yup.string().trim().required('Informe o nome do sócio').default(''),
  cpf: yup.string().required('Informe o CPF do sócio').test('cpf', 'CPF inválido', isCpf).default(''),
  share: yup.number().typeError('Informe a participação')
    .min(0.01, 'Participação mínima de 0,01%').max(100, 'Participação máxima de 100%')
    .nullable().required('Informe a participação').default(null),
  is_administrator: yup.boolean().default(false),
  address: addressSchema.omit(['uid', 'is_primary', 'type']),
  phones: phoneListSchema,
});

/** Dependente (pessoa física). */
export const dependentSchema = yup.object({
  uid: uid(),
  name: yup.string().trim().required('Informe o nome do dependente').default(''),
  relationship: yup.string().oneOf(RELATIONSHIPS, 'Parentesco inválido').nullable().required('Informe o parentesco').default(null),
  relationship_other: yup.string().trim()
    .when('relationship', { is: 'outro', then: (s) => s.required('Descreva o parentesco') })
    .default(''),
  birth_date: yup.date().typeError('Data inválida').max(new Date(), 'A data não pode ser futura')
    .nullable().required('Informe a data de nascimento').default(null),
  // CPF obrigatório a partir de 18 anos (cross-field com birth_date)
  cpf: yup.string().default('')
    .when('birth_date', ([birth], s) => (birth instanceof Date && ageAt(birth) >= 18
      ? s.required('Dependente maior de idade precisa de CPF').test('cpf', 'CPF inválido', isCpf)
      : s.test('cpf', 'CPF inválido', (v) => !v || isCpf(v)))),
});

/* ------------------------------------------------------------------ *
 * Esquema do formulário                                               *
 * ------------------------------------------------------------------ */
export const complexSchema = yup.object({
  // Identificação: o tipo de pessoa muda as regras de outros campos (when)
  person_type: yup.string().oneOf(PERSON_TYPES, 'Tipo de pessoa inválido').required('Informe o tipo de pessoa').default('fisica'),
  name: yup.string().trim().required('Informe o nome').min(3, 'Mínimo de 3 caracteres').max(120, 'Máximo de 120 caracteres').default(''),
  trade_name: yup.string().trim()
    .when('person_type', { is: 'juridica', then: (s) => s.required('Informe o nome fantasia') })
    .default(''),
  document: yup.string().required('Informe o documento')
    .when('person_type', ([type], s) => (type === 'juridica'
      ? s.test('cnpj', 'CNPJ inválido', isCnpj)
      : s.test('cpf', 'CPF inválido', isCpf)))
    .default(''),
  birth_date: yup.date().typeError('Data inválida').nullable().default(null)
    .when('person_type', {
      is: 'fisica',
      then: (s) => s.required('Informe a data de nascimento')
        .max(new Date(), 'A data não pode ser futura')
        .test('adult', 'É preciso ter ao menos 18 anos', (v) => !v || ageAt(v) >= 18),
    }),
  foundation_date: yup.date().typeError('Data inválida').nullable().default(null)
    .when('person_type', {
      is: 'juridica',
      then: (s) => s.required('Informe a data de fundação').max(new Date(), 'A data não pode ser futura'),
    }),

  // Contato: regra entre campos dentro de um objeto aninhado
  contact: yup.object({
    email: yup.string().trim().required('Informe o e-mail').email('E-mail inválido').default(''),
    email_confirmation: yup.string().trim().required('Confirme o e-mail')
      .test('same-email', 'Os e-mails não conferem', function (v) {
        return !v || v.toLowerCase() === String(this.parent.email ?? '').toLowerCase();
      })
      .default(''),
    phones: phoneListSchema,
  }),

  // Endereços: array com regra sobre o conjunto (exatamente um principal)
  addresses: addressListSchema,

  // Listas que dependem do tipo de pessoa
  partners: yup.array().of(partnerSchema)
    .when('person_type', {
      is: 'juridica',
      then: (s) => s.min(1, 'Adicione ao menos um sócio')
        .test('shares-100', 'A soma das participações deve ser 100%', (list) => {
          if (!list?.length || list.some((p) => p.share == null)) return true; // cada item acusa o próprio erro
          return Math.abs(list.reduce((acc, p) => acc + Number(p.share), 0) - 100) < 0.001;
        })
        .test('one-admin', 'Indique ao menos um sócio administrador', (list) => !list?.length || list.some((p) => p.is_administrator)),
      otherwise: (s) => s.max(0, 'Pessoa física não tem sócios'),
    })
    .default([]),
  dependents: yup.array().of(dependentSchema)
    .when('person_type', {
      is: 'fisica',
      then: (s) => s.max(10, 'No máximo 10 dependentes')
        .test('unique-cpf', 'Há dependentes com o mesmo CPF', (list) => {
          const cpfs = (list ?? []).map((d) => digits(d.cpf)).filter(Boolean);
          return new Set(cpfs).size === cpfs.length;
        }),
      otherwise: (s) => s.max(0, 'Pessoa jurídica não tem dependentes'),
    })
    .default([]),

  // Dados bancários: a chave Pix muda de formato conforme o tipo
  bank_account: yup.object({
    bank_code: yup.string().required('Informe o banco').matches(/^\d{3}$/, 'Código de banco com 3 dígitos').default(''),
    branch: yup.string().required('Informe a agência').matches(/^\d{4}$/, 'Agência com 4 dígitos').default(''),
    account: yup.string().required('Informe a conta').matches(/^\d{1,12}-[\dXx]$/, 'Use o formato 12345-6').default(''),
    account_type: yup.string().oneOf(ACCOUNT_TYPES, 'Tipo de conta inválido').required('Informe o tipo de conta').default('corrente'),
    pix_key_type: yup.string().oneOf(PIX_KEY_TYPES, 'Tipo de chave inválido').nullable().default(null),
    pix_key: yup.string().trim().default('')
      .when('pix_key_type', ([type], s) => {
        switch (type) {
          case 'cpf_cnpj': return s.required('Informe a chave').test('doc', 'CPF ou CNPJ inválido', (v) => isCpf(v) || isCnpj(v));
          case 'email': return s.required('Informe a chave').email('E-mail inválido');
          case 'telefone': return s.required('Informe a chave').test('phone', 'Telefone inválido', (v) => /^\+?\d{12,13}$/.test(digits(v)));
          case 'aleatoria': return s.required('Informe a chave').uuid('Chave aleatória inválida');
          default: return s.max(0, 'Escolha o tipo da chave antes de informá-la');
        }
      }),
  }),

  // Vigência: intervalo de datas com referência ao irmão
  period: yup.object({
    start_date: yup.date().typeError('Data inválida').nullable().required('Informe o início').default(null),
    end_date: yup.date().typeError('Data inválida').nullable().default(null)
      .when('start_date', ([start], s) => (start instanceof Date
        ? s.min(start, 'O fim deve ser posterior ao início')
        : s)),
  }),

  // Credenciais: senha forte e confirmação (yup.ref para o irmão)
  credentials: yup.object({
    password: yup.string().required('Informe a senha')
      .min(8, 'Mínimo de 8 caracteres')
      .matches(/[a-z]/, 'Inclua uma letra minúscula')
      .matches(/[A-Z]/, 'Inclua uma letra maiúscula')
      .matches(/\d/, 'Inclua um número')
      .default(''),
    password_confirmation: yup.string().required('Confirme a senha')
      .oneOf([yup.ref('password')], 'As senhas não conferem')
      .default(''),
  }),

  // Preferências: array de valores primitivos e valores derivados
  preferences: yup.object({
    channels: yup.array().of(yup.string().oneOf(CHANNELS).required())
      .min(1, 'Escolha ao menos um canal')
      .test('unique', 'Canal repetido', (list) => new Set(list).size === (list ?? []).length)
      .default(() => ['email']),
    language: yup.string().oneOf(LANGUAGES, 'Idioma inválido').required('Informe o idioma').default('pt-BR'),
    newsletter: yup.boolean().default(false),
  }),

  notes: yup.string().trim().max(500, 'Máximo de 500 caracteres').default(''),
  terms_accepted: yup.boolean().oneOf([true], 'É preciso aceitar os termos').required().default(false),
})
  // Regra entre sub-árvores: só roda na validação completa (submissão)
  .test('whatsapp-channel', function (form) {
    const wantsWhatsapp = form.preferences?.channels?.includes('whatsapp');
    const hasWhatsapp = form.contact?.phones?.some((p) => p.whatsapp);
    return !wantsWhatsapp || hasWhatsapp
      ? true
      : this.createError({ path: 'preferences.channels', message: 'Para receber por WhatsApp, marque um celular com WhatsApp' });
  });

export type ComplexFormValues = yup.InferType<typeof complexSchema>;

/**
 * Quando a chave muda, os caminhos listados são revalidados se já exibirem erro.
 * Chaves com `[]` valem para qualquer item: o `[]` do dependente recebe o índice do caminho validado.
 */
export const complexFormOptions = {
  dependents: {
    person_type: ['trade_name', 'document', 'birth_date', 'foundation_date', 'partners', 'dependents'],
    'contact.email': ['contact.email_confirmation'],
    'contact.phones[].type': ['contact.phones[].number', 'contact.phones[].whatsapp'],
    'contact.phones[].number': ['contact.phones'],
    'addresses[].is_primary': ['addresses'],
    'partners[].share': ['partners'],
    'partners[].is_administrator': ['partners'],
    'partners[].phones[].type': ['partners[].phones[].number', 'partners[].phones[].whatsapp'],
    'partners[].phones[].number': ['partners[].phones'],
    'dependents[].relationship': ['dependents[].relationship_other'],
    'dependents[].birth_date': ['dependents[].cpf'],
    'dependents[].cpf': ['dependents'],
    'bank_account.pix_key_type': ['bank_account.pix_key'],
    'period.start_date': ['period.end_date'],
    'credentials.password': ['credentials.password_confirmation'],
  },
};
