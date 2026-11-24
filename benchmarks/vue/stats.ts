export const stats = { updates: 0, validations: 0, trail: [] as (string | null)[], reset() { this.updates = 0; this.validations = 0; this.trail = []; } };
