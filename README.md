# form-validation-bench

Código e experimentos do artigo **"Validação de formulários orientada a esquema com disparo por campo: um padrão incremental para React, Vue e Angular"**. Todo número citado no artigo sai daqui.

Licença ISC (`LICENSE`). Node 24.21 (`.nvmrc`, `engines`).

```bash
npm install
npm test            # estudo de caso + núcleo
npm run typecheck   # tsc strict
npm run bench:runs  # todos os benchmarks, três execuções, + results/summary.md (~15 min)
```

## Estrutura

```
src/                 o padrão descrito no artigo (Yup)
├── core/            núcleo sem framework: formCore.ts
├── react/           hook useValidatedFormState + wrappers por tipo (Mantine)
├── vue/             composable useValidatedForm + useFormField + wrappers por tipo (PrimeVue)
├── angular/         validatedForm (signals) + formField + wrappers por tipo (spartan-ng)
│   └── ui/          componentes helm do spartan-ng, copiados como o CLI do spartan faz
└── case-study/      estudo de caso: eventSchema.ts e o formulário de evento em React, Vue e Angular

tests/               verificação do padrão
├── core/            probe.test.ts (isContainer, :root), removal.test.ts (mapa plano × árvore),
│                    yup-behavior.test.ts e zod-pitfalls.test.ts (comportamentos "verificados por execução")
├── types/           cada cadeia de regras do catálogo, em Yup e em Zod, com a mensagem esperada
├── case-study/      roteiro de verificação da seção 10.6, React, Vue e Angular; react-renders conta os renders
└── setup/           ambiente de teste do Angular (zoneless, sem zone.js)

benchmarks/          as medições da seção 8
├── shared/          arquivo das execuções (results/runs/) e ordem sorteada das variantes
├── schema/          custo por chamada do esquema, Yup e Zod, 3/30/300 itens
├── types/           custo por tipo de dado e por cadeia de regras, Yup e Zod (cases.ts é o catálogo)
├── react/           renders, µs por tecla, debounce e montagem (React)
├── vue/             atualizações, µs por tecla, debounce e montagem (Vue + PrimeVue)
└── angular/         atualizações, µs por tecla, debounce e montagem (Angular + spartan-ng)

experiments/         experimentos de apoio, fora do padrão final
├── pitfalls/        colisões de erro com _set numa árvore ingênua
├── zod/             reimplementação com Zod usada na comparação
└── initial/         primeiros experimentos (substituídos por benchmarks/), mantidos como registro

results/             saídas citadas no artigo
├── runs/            uma execução por arquivo (<benchmark>-<n>.json), com todas as amostras
├── summary.md       tabelas do artigo, geradas por npm run bench:summary
└── summary.json     o mesmo, legível por máquina
scripts/             bench-runs.mjs (três execuções) e summarize.mjs (agregação)
demo/                apps de demonstração (Vite) que usam o estudo de caso
```

## Do artigo ao código

| Seção do artigo | Código | Comando | Saída |
|---|---|---|---|
| 3–6. Esquema, validação parcial, campo como gatilho, ciclo | `src/core`, `src/react`, `src/vue`, `src/angular` | `npm run typecheck`, `npm test` | — |
| 3, 4. Comportamentos do Yup citados | `tests/core/yup-behavior.test.ts` | `npm test` | — |
| 7. Árvore de erros, `:root`, remoção de itens (árvore × mapa plano com renumeração) | `src/core/formCore.ts`, `tests/core/`, `experiments/pitfalls/flatMap.mjs` | `npm test` | — |
| 7.2. O problema da árvore (colisões) | `experiments/pitfalls/` | `npm run pitfalls` | `results/pitfalls.txt` |
| 8.2. Validar um caminho, não o formulário | `benchmarks/schema/` | `npm run bench:schema` | `results/runs/schema-*.json` |
| 8.3–8.5. Renders, tempo por tecla, escala, montagem e debounce | `benchmarks/{react,vue,angular}/structure.test.*` | `npm run bench:react`, `bench:vue`, `bench:angular` | `results/runs/{react,vue,angular}-*.json` |
| 8.6. Custo por tipo de dado e cadeia de regras | `benchmarks/types/`, `tests/types/` | `npm run bench:types`, `npm test` | `results/runs/types-*.json` |
| 8 (tabelas) | `scripts/summarize.mjs` | `npm run bench:summary` | `results/summary.md` |
| 9. Por que Yup e não Zod | `experiments/zod/`, `benchmarks/schema/`, `benchmarks/types/`, `tests/core/zod-pitfalls.test.ts` | `npm run zod:probe`, `npm run zod:test`, `npm test` | `results/summary.md` |
| 10. Estudo de caso | `src/case-study/`, `tests/case-study/` | `npm test` | — |

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | núcleo, comportamentos do Yup e do Zod, catálogo de tipos e estudo de caso (React com Mantine, Vue com PrimeVue, Angular com spartan-ng) |
| `npm run typecheck` | `tsc` em modo strict sobre `src/`, `tests/` e a implementação com Zod, e `ngc` com `strictTemplates` sobre o código Angular |
| `npm run bench:runs` | três execuções de todos os benchmarks (`RUN=1..3`) e o resumo; `RUNS=5` muda o número |
| `npm run bench` | uma execução de todos os benchmarks (`RUN=1` por padrão) |
| `npm run bench:summary` | agrega `results/runs/` em `results/summary.md` e `results/summary.json`; falha se alguma contagem diferir entre execuções |
| `npm run bench:schema` | µs por chamada (média, mediana, p99, desvio) de `validateSyncAt` em campo, item, contêiner e regra entre campos, `validateAt`, `validateSync`, Zod local e full+filtro, e remoção de item (árvore × mapa plano) |
| `npm run bench:types` | µs por chamada de cada cadeia de regras do catálogo, por tipo de dado, em Yup e em Zod |
| `npm run bench:react` | React: linha de base sem validação (H), forma anterior (A), limpar e regravar assíncrono (A2) e síncrono (A3), gravação única sem memo (B), versão anterior da gravação única (C0), forma adotada (C), C + debounce (D); escala com 20/100/500 campos |
| `npm run bench:vue` | Vue: H, wrapper (W), frame (F), frame com `watch` sem e com debounce (FWN, FW), limpar e regravar assíncrono e síncrono (WC, WCS), wrapper + debounce (WD); escala |
| `npm run bench:angular` | Angular: H, wrapper (W), limpar e regravar assíncrono e síncrono (WC, WCS), wrapper + debounce (WD); escala |
| `npm run gen:vue` | gera os formulários do benchmark Vue (`benchmarks/vue/components/Form*.vue`) |
| `npm run pitfalls` | imprime as colisões de erro e grava `results/pitfalls.txt` |
| `npm run zod:probe` | comportamento de `parse({})`, `default`, `prefault` e refinamentos no Zod 4 |
| `npm run zod:test` | a implementação com Zod passa pelo mesmo roteiro do estudo de caso |
| `npm run initial` | primeiros experimentos (grava em `experiments/initial/results/`) |
| `npm run dev:react` / `npm run dev:vue` | demo do estudo de caso em http://localhost:5173 (React) e http://localhost:5174 (Vue) |

Os três benchmarks de framework seguem o mesmo roteiro e gravam o mesmo formato: contagens com 25 teclas (renders ou atualizações do campo e do formulário pai, validações, cintilações), contagens e µs por tecla com 54 teclas, cada uma a cada 250 ms e a cada 60 ms, montagem de 500 campos e escala (54 teclas com 20, 100 e 500 campos). Cada execução faz 15 repetições, com a ordem das variantes sorteada a cada repetição (semente = número da execução) e uma rodada de aquecimento. A janela medida de cada tecla inclui o evento, o `act`/`flush` do framework e o avanço do relógio falso até a próxima tecla, mais os 300 ms finais em que um debounce pendente dispara.

Cada execução grava um arquivo em `results/runs/` com todas as amostras; nada é sobrescrito entre execuções de números diferentes. As contagens (renders, atualizações, validações, cintilações) são verificadas: as 15 repetições de uma execução e as três execuções precisam dar o mesmo número.

## Variantes do benchmark Vue

Os componentes em `benchmarks/vue/components/Form<variante><campos>.vue` são gerados por `npm run gen:vue`, com 20 ou 500 campos (e 100 para H e W):

| Sigla | Estrutura do campo |
|---|---|
| `H` | wrapper que nunca pede validação (linha de base do harness) |
| `W` | wrapper por tipo, validação no evento (a forma final, seção 5.2) |
| `F` | frame genérico com provide/inject, validação no evento |
| `FWN` | frame genérico observando o valor com `watch`, sem debounce |
| `FW` | frame genérico observando o valor com `watch` + debounce de 200 ms |
| `WC` | wrapper por tipo, limpar e regravar com `validateAt` assíncrono (a forma anterior) |
| `WCS` | wrapper por tipo, limpar e regravar com `validateSyncAt`, no mesmo tique |
| `WD` | wrapper por tipo com debounce de 200 ms (seção 8.5) |

`BenchWrap`, `BenchWrapDebounce`, `BenchFrame` e `BenchCore` são os campos usados por essas variantes; `composables.ts` traz os modos de gravação do erro (`useFinal`, `useClearThenSet`, `useClearThenSetSync`).

## Angular

- **Sem zone.js.** O ambiente de teste (`tests/setup/angular.ts`) usa `provideZonelessChangeDetection()`; o pacote `zone.js` nem está instalado, e o teste do estudo de caso confirma que `Zone` não existe.
- **Compilação.** Os testes Angular rodam num projeto próprio do Vitest (`vitest.config.mjs`), compilados pelo `@analogjs/vite-plugin-angular` com `tsconfig.angular.json`. O projeto React/Vue segue com esbuild.
- **spartan-ng.** O spartan divide-se em *brain* (primitivas, pacote npm `@spartan-ng/brain`) e *helm* (estilos, código copiado para o projeto). Os helm de `src/angular/ui/` saíram dos templates do `@spartan-ng/cli` (input, textarea, checkbox, label, field, button, separator, utils), só com o alias trocado por caminhos relativos. Sem Tailwind configurado, os componentes renderizam sem estilo, o que não afeta os testes.
- **TypeScript 6.0.** O compilador do Angular 22 exige TypeScript `>=6.0 <6.1`; o TypeScript 7 não expõe a API JS de que ele precisa. O projeto todo usa a 6.0.

## Ambiente

Node 24.21, Yup 1.7.1, Zod 4.6.7, React 19.3.1, Vue 3.5.46, Angular 22.3 (zoneless), spartan-ng 1.10, Immer 11, Vitest 5.1, TypeScript 6.0, tinybench, jsdom. Medições em Intel Core i7-13650HX, WSL2.
