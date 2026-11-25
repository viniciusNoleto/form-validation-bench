// Diferença entre dois estados do formulário: os caminhos das folhas que mudaram.
// É o que um observador do formulário (variante O) precisa calcular a cada mudança para saber
// o que validar. Subárvores com a mesma referência são puladas (o Immer preserva as referências
// do que não mudou; no Vue, que muta no lugar, a comparação é com uma cópia anterior).
const isNode = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !(x instanceof Date);

export function changedPaths(prev: unknown, next: unknown, base = '', out: string[] = []): string[] {
  if (Object.is(prev, next)) return out;
  if (!isNode(prev) || !isNode(next)) {
    if (prev instanceof Date && next instanceof Date && prev.getTime() === next.getTime()) return out;
    out.push(base);
    return out;
  }
  const array = Array.isArray(next);
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    const path = array ? `${base}[${key}]` : base ? `${base}.${key}` : key;
    changedPaths(prev[key], next[key], path, out);
  }
  return out;
}
