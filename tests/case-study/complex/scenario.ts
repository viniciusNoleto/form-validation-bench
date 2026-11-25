// Roteiro do esquema de alta complexidade (src/schemas/complexSchema.ts), o mesmo nos três
// frameworks. Cada framework entra com um adaptador que liga as operações do roteiro ao seu núcleo
// (useValidatedFormState, useValidatedForm, validatedForm). O roteiro não monta interface: exercita
// o núcleo do padrão como os wrappers o chamam (gravar o valor, depois validar o caminho).
import { expect } from 'vitest';
import { addressSchema, complexSchema, dependentSchema, partnerSchema, phoneSchema } from '../../../src/schemas/complexSchema';

export type Adapter = {
  /** grava o valor e, depois do commit, valida o caminho (o que o wrapper faz no evento) */
  change(path: string, value: unknown): Promise<void>;
  /** só valida o caminho (o que o wrapper faz no blur) */
  blur(path: string): Promise<void>;
  /** acrescenta um item e valida a lista */
  add(path: string, item: unknown): Promise<void>;
  /** remove o item e o nó de erros dele, e valida a lista */
  remove(path: string, index: number): Promise<void>;
  /** validação completa (submissão) */
  submit(): Promise<boolean>;
  error(path: string): string | undefined;
  state(): any;
};

/** CPF válido a partir de 9 dígitos (calcula os verificadores). */
export function cpf(base: string): string {
  const d = base.split('').map(Number);
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += d[i] * (len + 1 - i);
    const rest = (sum * 10) % 11;
    d.push(rest === 10 ? 0 : rest);
  }
  return d.join('');
}
const CNPJ = '11222333000181';

/** Conta as folhas da árvore de erros (mensagens), em qualquer profundidade. */
export function leaves(tree: unknown): string[] {
  if (typeof tree === 'string') return [tree];
  if (tree && typeof tree === 'object') return Object.values(tree).flatMap(leaves);
  return [];
}

export async function runComplexScenario(f: Adapter, errorTree: () => unknown) {
  // a) Submissão vazia: pessoa física por padrão, um telefone vazio, nenhum endereço.
  expect(await f.submit()).toBe(false);
  expect(f.error('name')).toBe('Informe o nome');
  expect(f.error('document')).toBe('Informe o documento');
  expect(f.error('birth_date')).toBe('Informe a data de nascimento');
  expect(f.error('trade_name')).toBeUndefined(); // só pessoa jurídica
  expect(f.error('contact.phones[0].number')).toBe('Informe o número');
  expect(f.error('addresses')).toBe('Adicione ao menos um endereço');
  expect(f.error('credentials.password')).toBe('Informe a senha');
  expect(f.error('terms_accepted')).toBe('É preciso aceitar os termos');

  // b) Regra que depende de outro campo (when): o tipo de pessoa muda o documento exigido.
  await f.change('document', cpf('529982247'));
  expect(f.error('document')).toBeUndefined();
  await f.change('person_type', 'juridica');
  // birth_date exibia erro e é dependente de person_type: foi revalidado e o erro saiu
  expect(f.error('birth_date')).toBeUndefined();
  // document não exibia erro: não é revalidado até o próprio campo validar (política dos dependentes)
  expect(f.error('document')).toBeUndefined();
  await f.blur('document');
  expect(f.error('document')).toBe('CNPJ inválido');
  await f.change('document', CNPJ);
  expect(f.error('document')).toBeUndefined();

  // c) Listas que dependem do tipo de pessoa e erros a quatro níveis da raiz.
  expect(await f.submit()).toBe(false);
  expect(f.error('trade_name')).toBe('Informe o nome fantasia');
  expect(f.error('foundation_date')).toBe('Informe a data de fundação');
  expect(f.error('partners')).toBe('Adicione ao menos um sócio');
  await f.add('partners', partnerSchema.getDefault());
  // a lista é validada ao ganhar um item: a regra do mínimo passa, a do administrador não
  expect(f.error('partners')).toBe('Indique ao menos um sócio administrador');
  await f.add('partners', partnerSchema.getDefault());
  await f.add('partners', partnerSchema.getDefault());
  expect(await f.submit()).toBe(false);
  for (const i of [0, 1, 2]) {
    expect(f.error(`partners[${i}].name`)).toBe('Informe o nome do sócio');
    expect(f.error(`partners[${i}].address.zip`)).toBe('Informe o CEP');
    expect(f.error(`partners[${i}].phones[0].number`)).toBe('Informe o número');
  }

  // d) Paridade na remoção, com um item inválido DEPOIS do removido: o sócio 0 fica válido,
  //    remove-se o sócio 1; os erros do antigo sócio 2 precisam ir para o índice 1.
  await f.change('partners[0].name', 'Ana');
  await f.change('partners[0].cpf', cpf('111444777'));
  await f.change('partners[2].name', 'Caio');
  expect(f.error('partners[0].name')).toBeUndefined();
  expect(f.error('partners[1].name')).toBe('Informe o nome do sócio');
  expect(f.error('partners[2].name')).toBeUndefined();
  expect(f.error('partners[2].cpf')).toBe('Informe o CPF do sócio');
  await f.remove('partners', 1);
  expect(f.state().partners).toHaveLength(2);
  expect(f.state().partners[1].name).toBe('Caio');
  expect(f.error('partners[0].name')).toBeUndefined();
  expect(f.error('partners[1].name')).toBeUndefined(); // um mapa plano sem renumeração deixaria "Informe o nome do sócio" aqui
  expect(f.error('partners[1].cpf')).toBe('Informe o CPF do sócio'); // e perderia este
  expect(f.error('partners[2].cpf')).toBeUndefined();

  // e) Regras sobre a lista inteira convivem com os erros dos itens (chave :root).
  await f.change('partners[0].share', 60);
  await f.change('partners[1].share', 30);
  expect(await f.submit()).toBe(false);
  expect(f.error('partners')).toBe('A soma das participações deve ser 100%');
  expect(f.error('partners[1].cpf')).toBe('Informe o CPF do sócio');
  // partners[].share -> partners: a regra da lista é revalidada ao corrigir um item
  await f.change('partners[1].share', 40);
  expect(f.error('partners')).toBe('Indique ao menos um sócio administrador');
  await f.change('partners[0].is_administrator', true);
  expect(f.error('partners')).toBeUndefined();

  // f) Dependente por forma de caminho, a quatro níveis: o tipo do telefone muda a regra do número.
  await f.change('partners[1].phones[0].number', '8133334444'); // fixo, mas o tipo padrão é celular
  expect(f.error('partners[1].phones[0].number')).toBe('Celular inválido');
  await f.change('partners[1].phones[0].type', 'fixo');
  expect(f.error('partners[1].phones[0].number')).toBeUndefined();
  expect(f.error('partners[0].phones[0].number')).toBe('Informe o número'); // o outro sócio não foi tocado
  await f.change('partners[1].phones[0].whatsapp', true);
  expect(f.error('partners[1].phones[0].whatsapp')).toBe('WhatsApp só em celular');

  // g) Comparações entre irmãos dentro de objetos aninhados.
  await f.change('contact.email', 'ana@exemplo.com');
  await f.change('contact.email_confirmation', 'ANA@exemplo.com');
  expect(f.error('contact.email_confirmation')).toBeUndefined();
  await f.change('contact.email_confirmation', 'outra@exemplo.com');
  expect(f.error('contact.email_confirmation')).toBe('Os e-mails não conferem');
  await f.change('contact.email', 'outra@exemplo.com');
  expect(f.error('contact.email_confirmation')).toBeUndefined();
  await f.change('period.start_date', new Date(2026, 5, 1));
  await f.change('period.end_date', new Date(2026, 0, 1));
  expect(f.error('period.end_date')).toBe('O fim deve ser posterior ao início');
  await f.change('period.start_date', new Date(2025, 5, 1));
  expect(f.error('period.end_date')).toBeUndefined();

  // h) A chave Pix muda de formato conforme o tipo.
  await f.change('bank_account.pix_key', 'abc');
  expect(f.error('bank_account.pix_key')).toBe('Escolha o tipo da chave antes de informá-la');
  await f.change('bank_account.pix_key_type', 'email');
  expect(f.error('bank_account.pix_key')).toBe('E-mail inválido');
  await f.change('bank_account.pix_key_type', 'aleatoria');
  expect(f.error('bank_account.pix_key')).toBe('Chave aleatória inválida');
  await f.change('bank_account.pix_key', '0b1f5a3e-8c2d-4f6a-9b7e-1d2c3b4a5f60');
  expect(f.error('bank_account.pix_key')).toBeUndefined();

  // i) Exatamente um endereço principal (regra da lista, revalidada pelo item).
  await f.add('addresses', { ...addressSchema.getDefault(), is_primary: true });
  await f.add('addresses', { ...addressSchema.getDefault(), is_primary: true });
  expect(await f.submit()).toBe(false);
  expect(f.error('addresses')).toBe('Marque exatamente um endereço como principal');
  expect(f.error('addresses[1].zip')).toBe('Informe o CEP');
  await f.change('addresses[1].is_primary', false);
  expect(f.error('addresses')).toBeUndefined();

  // j) Regra que cruza sub-árvores (preferences × contact): só roda na validação completa.
  await f.change('preferences.channels', ['email', 'whatsapp']);
  expect(f.error('preferences.channels')).toBeUndefined(); // a validação do caminho não vê a regra da raiz
  expect(await f.submit()).toBe(false);
  expect(f.error('preferences.channels')).toBe('Para receber por WhatsApp, marque um celular com WhatsApp');
  // limitação: validar o caminho sozinho apaga a mensagem, embora a regra continue violada
  await f.change('preferences.channels', ['whatsapp', 'email']);
  expect(f.error('preferences.channels')).toBeUndefined();
  expect(await f.submit()).toBe(false);
  expect(f.error('preferences.channels')).toBe('Para receber por WhatsApp, marque um celular com WhatsApp');

  // k) Volta para pessoa física: listas de sócios proibidas, dependentes com CPF a partir de 18 anos.
  await f.change('person_type', 'fisica');
  expect(f.error('partners')).toBeUndefined(); // não exibia erro: não é revalidado
  expect(await f.submit()).toBe(false);
  expect(f.error('partners')).toBe('Pessoa física não tem sócios');
  await f.remove('partners', 1);
  await f.remove('partners', 0);
  expect(f.error('partners')).toBeUndefined();
  expect(leaves((errorTree() as any).partners ?? [])).toEqual([]); // nenhum erro órfão de item removido
  await f.add('dependents', dependentSchema.getDefault());
  await f.change('dependents[0].name', 'Bia');
  await f.change('dependents[0].relationship', 'outro');
  await f.blur('dependents[0].relationship_other');
  expect(f.error('dependents[0].relationship_other')).toBe('Descreva o parentesco');
  await f.change('dependents[0].relationship', 'filho');
  expect(f.error('dependents[0].relationship_other')).toBeUndefined();
  await f.change('dependents[0].birth_date', new Date(2015, 2, 10));
  await f.blur('dependents[0].cpf');
  expect(f.error('dependents[0].cpf')).toBeUndefined(); // menor de idade: CPF opcional
  await f.change('dependents[0].cpf', '123');
  expect(f.error('dependents[0].cpf')).toBe('CPF inválido');
  await f.change('dependents[0].cpf', '');
  await f.change('dependents[0].birth_date', new Date(2000, 2, 10));
  expect(f.error('dependents[0].cpf')).toBeUndefined(); // não exibia erro
  await f.blur('dependents[0].cpf');
  expect(f.error('dependents[0].cpf')).toBe('Dependente maior de idade precisa de CPF');
  await f.change('dependents[0].cpf', cpf('390533447'));
  await f.add('dependents', { ...dependentSchema.getDefault(), name: 'Caio', relationship: 'filho', birth_date: new Date(1999, 1, 1) });
  await f.change('dependents[1].cpf', cpf('390533447'));
  expect(await f.submit()).toBe(false);
  expect(f.error('dependents')).toBe('Há dependentes com o mesmo CPF');
  await f.change('dependents[1].cpf', cpf('987654321'));
  expect(f.error('dependents')).toBeUndefined();

  // l) Preenche o resto e submete: válido.
  await f.change('name', 'Ana Souza');
  await f.change('document', cpf('529982247'));
  await f.change('birth_date', new Date(1990, 0, 1));
  await f.change('contact.phones[0].number', '81988887777');
  await f.change('contact.phones[0].whatsapp', true);
  await f.change('contact.phones[0].type', 'fixo');
  expect(f.error('contact.phones[0].whatsapp')).toBeUndefined(); // dependente de type, não exibia erro
  await f.blur('contact.phones[0].whatsapp');
  expect(f.error('contact.phones[0].whatsapp')).toBe('WhatsApp só em celular');
  expect(f.error('contact.phones[0].number')).toBeUndefined(); // não exibia erro
  await f.change('contact.phones[0].type', 'celular');
  expect(f.error('contact.phones[0].whatsapp')).toBeUndefined();
  await f.add('contact.phones', { ...phoneSchema.getDefault(), number: '81988887777' });
  expect(await f.submit()).toBe(false);
  expect(f.error('contact.phones')).toBe('Há telefones repetidos');
  await f.change('contact.phones[1].number', '81977776666');
  expect(f.error('contact.phones')).toBeUndefined();
  for (const [path, value] of Object.entries({
    'addresses[0].zip': '50000-000', 'addresses[0].street': 'Rua A', 'addresses[0].number': '10',
    'addresses[0].district': 'Centro', 'addresses[0].city': 'Recife', 'addresses[0].state': 'PE',
  })) {
    await f.change(path, value);
    await f.change(path.replace('[0]', '[1]'), value);
  }
  await f.change('bank_account.bank_code', '001');
  await f.change('bank_account.branch', '1234');
  await f.change('bank_account.account', '12345-6');
  await f.change('credentials.password', 'Abcdefg1');
  await f.change('credentials.password_confirmation', 'Abcdefg1');
  await f.change('terms_accepted', true);
  expect(await f.submit()).toBe(true);
  expect(leaves(errorTree())).toEqual([]);
  const cast = complexSchema.cast(f.state());
  expect(cast).toMatchObject({ person_type: 'fisica', name: 'Ana Souza', partners: [], dependents: [{ name: 'Bia' }, { name: 'Caio' }] });
}
