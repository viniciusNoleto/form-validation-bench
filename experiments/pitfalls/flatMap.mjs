// Mapa plano de erros (chave = caminho com índice) com a manutenção que a remoção exige:
// apagar as chaves do item removido e renumerar as dos itens seguintes, em qualquer profundidade.
// É a alternativa "plana" mantida, comparada com a árvore + splice (seção 7.1).

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function removeFlat(errors, arrayPath, index) {
  const re = new RegExp(`^${escape(arrayPath)}\\[(\\d+)\\](.*)$`);
  const out = {};
  for (const [key, message] of Object.entries(errors)) {
    const m = re.exec(key);
    if (!m) { out[key] = message; continue; }
    const i = Number(m[1]);
    if (i === index) continue;
    out[i > index ? `${arrayPath}[${i - 1}]${m[2]}` : key] = message;
  }
  return out;
}

/** Inserção no meio: as chaves dos itens a partir de `index` avançam uma posição. */
export function insertFlat(errors, arrayPath, index) {
  const re = new RegExp(`^${escape(arrayPath)}\\[(\\d+)\\](.*)$`);
  const out = {};
  for (const [key, message] of Object.entries(errors)) {
    const m = re.exec(key);
    const i = m ? Number(m[1]) : -1;
    out[m && i >= index ? `${arrayPath}[${i + 1}]${m[2]}` : key] = message;
  }
  return out;
}
