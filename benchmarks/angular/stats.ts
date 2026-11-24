export const stats = {
  /** vezes que a view de um campo foi atualizada */
  updates: 0,
  validations: 0,
  /** mensagem exibida pelo campo f0 a cada atualização (para contar cintilações) */
  trail: [] as (string | null)[],
  reset() { this.updates = 0; this.validations = 0; this.trail = []; },
};
