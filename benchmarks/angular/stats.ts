export const stats = {
  /** vezes que a view de um campo foi atualizada */
  updates: 0,
  /** vezes que a view do formulário pai foi atualizada */
  formUpdates: 0,
  validations: 0,
  /** chamadas que validam o formulário inteiro (só nas variantes de biblioteca, contadas no esquema) */
  whole: 0,
  /** mensagem exibida pelo campo f0 a cada atualização (para contar cintilações) */
  trail: [] as (string | null)[],
  reset() { this.updates = 0; this.formUpdates = 0; this.validations = 0; this.whole = 0; this.trail = []; },
};
