export const STEPS = [
  'Clique em "Salvar" com tudo vazio. Na árvore, os erros dos contêineres aparecem em "categories:root" e "descriptions:root", separados dos campos.',
  'Adicione 3 descrições, preencha a 1ª e a 3ª (conteúdo com 10+ caracteres) e salve. "descriptions" vira um array paralelo à lista, com erro só no índice 1.',
  'Remova a 2ª descrição. O nó de erro sai junto: a antiga 3ª passa a ser a 2ª e não herda o erro.',
  'Colisão: adicione 6 descrições vazias e salve. Com ":root", aparecem o erro da lista ("No máximo 5") e o de cada item. Troque para "árvore ingênua" e repita: o erro da lista apaga os erros dos itens; ao editar um título, a mensagem da lista também some.',
];

export function highlight(json: string) {
  // devolve as linhas, marcando as que contêm uma chave :root
  return json.split('\n').map((line) => ({ line, root: line.includes(':root"') }));
}
