export const stats = {
  /** atualizações de componente de campo (onBeforeUpdate) */
  updates: 0,
  /** atualizações do formulário pai */
  formUpdates: 0,
  validations: 0,
  /** mensagem exibida pelo campo f0 a cada atualização (para contar cintilações) */
  trail: [] as (string | null)[],
  reset() { this.updates = 0; this.formUpdates = 0; this.validations = 0; this.trail = []; },
};
