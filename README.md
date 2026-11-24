# form-validation-bench

Código e experimentos do artigo **"Validação de formulários orientada a esquema com disparo por campo: um padrão incremental para React e Vue"**. Todo número citado no artigo sai daqui.

```bash
npm install
npm test            # estudo de caso + núcleo
npm run typecheck   # tsc strict
npm run bench       # todos os benchmarks (sobrescreve results/)
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
├── core/            probe.test.ts (isContainer, :root), removal.test.ts (mapa plano × árvore)
├── case-study/      roteiro de verificação da seção 10.6, React, Vue e Angular
└── setup/           ambiente de teste do Angular (zoneless, sem zone.js)

benchmarks/          as medições da seção 8
├── schema/          custo por chamada do esquema, Yup e Zod, 3/30/300 itens
├── react/           renders, µs por tecla, debounce e montagem (React)
├── vue/             atualizações, µs por tecla, debounce e montagem (Vue + PrimeVue)
└── angular/         atualizações, µs por tecla, debounce e montagem (Angular + spartan-ng)

experiments/         experimentos de apoio, fora do padrão final
├── pitfalls/        colisões de erro com _set numa árvore ingênua
├── zod/             reimplementação com Zod usada na comparação
└── initial/         primeiros experimentos (substituídos por benchmarks/), mantidos como registro

results/             saídas dos benchmarks citadas no artigo
demo/                apps de demonstração (Vite) que usam o estudo de caso
```

## Do artigo ao código

| Seção do artigo | Código | Comando | Saída |
|---|---|---|---|
| 3–6. Esquema, validação parcial, campo como gatilho, ciclo | `src/core`, `src/react`, `src/vue`, `src/angular` | `npm run typecheck` | — |
| 7. Árvore de erros, `:root`, remoção de itens | `src/core/formCore.ts`, `tests/core/` | `npm test` | — |
| 7.2. O problema da árvore (colisões) | `experiments/pitfalls/` | `npm run pitfalls` | `results/pitfalls.txt` |
| 8.2. Validar um caminho, não o formulário | `benchmarks/schema/` | `npm run bench:schema` | `results/schema.json` |
| 8.3–8.5. Renders por tecla, tempo por tecla, montagem e debounce (React) | `benchmarks/react/structure.test.tsx` | `npm run bench:react` | `results/react-structure.json` |
| 8.3–8.5. O mesmo no Vue | `benchmarks/vue/structure.test.ts` | `npm run bench:vue` | `results/vue-structure.json` |
| 8.3–8.5. O mesmo no Angular | `benchmarks/angular/structure.test.ts` | `npm run bench:angular` | `results/angular-structure.json` |
| 9. Por que Yup e não Zod | `experiments/zod/`, `benchmarks/schema/` | `npm run zod:probe`, `npm run zod:test`, `npm run bench:schema` | `results/schema.json` |
| 10. Estudo de caso | `src/case-study/`, `tests/case-study/` | `npm test` | — |

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | testes do núcleo e do estudo de caso (React com Mantine, Vue com PrimeVue, Angular com spartan-ng) |
| `npm run typecheck` | `tsc` em modo strict sobre `src/`, `tests/` e a implementação com Zod, e `ngc` com `strictTemplates` sobre o código Angular |
| `npm run bench` | roda `bench:schema`, `bench:react`, `bench:vue` e `bench:angular` em sequência |
| `npm run bench:schema` | µs por chamada de `validateSyncAt`, `validateAt` e `validateSync` (Yup) e equivalentes em Zod |
| `npm run bench:react` | React: limpar e regravar (A), gravação única (B), gravação única + memo (C), C + debounce (D) |
| `npm run bench:vue` | Vue: wrapper (W), frame (F), frame com `watch` (FW), limpar e regravar (WC), wrapper + debounce (WD) |
| `npm run bench:angular` | Angular: wrapper (W), limpar e regravar (WC), wrapper + debounce (WD) |
| `npm run pitfalls` | imprime as colisões de erro e grava `results/pitfalls.txt` |
| `npm run zod:probe` | comportamento de `parse({})`, `default`, `prefault` e refinamentos no Zod 4 |
| `npm run zod:test` | a implementação com Zod passa pelo mesmo roteiro do estudo de caso |
| `npm run initial` | primeiros experimentos (grava em `experiments/initial/results/`) |
| `npm run dev:react` / `npm run dev:vue` | demo do estudo de caso em http://localhost:5173 (React) e http://localhost:5174 (Vue) |

Os três benchmarks de framework seguem o mesmo roteiro e gravam o mesmo formato: contagens com 25 teclas (renders ou atualizações, validações, cintilações), contagens e µs por tecla com 54 teclas, cada uma a cada 250 ms e a cada 60 ms, e montagem de 500 campos. Os tempos são a mediana de 15 repetições intercaladas.

Os benchmarks sobrescrevem os arquivos em `results/`. As contagens (renders, validações, cintilações) são exatas e se repetem; os tempos variam até cerca de 15% entre execuções (seção 8.6).

## Variantes do benchmark Vue

Os componentes em `benchmarks/vue/components/` seguem o padrão `Form<variante><campos>.vue`, com 20 ou 500 campos:

| Sigla | Estrutura do campo |
|---|---|
| `W` | wrapper por tipo, validação no evento (a forma final, seção 5.2) |
| `F` | frame genérico com provide/inject, validação no evento |
| `FW` | frame genérico observando o valor com `watch` + debounce de 200 ms |
| `WC` | wrapper por tipo, limpar e regravar o erro |
| `WD` | wrapper por tipo com debounce de 200 ms (seção 8.5) |

`BenchWrap`, `BenchWrapDebounce`, `BenchFrame` e `BenchCore` são os campos usados por essas variantes; `composables.ts` traz os modos de gravação do erro (`useFinal`, `useClearThenSet`).

## Angular

- **Sem zone.js.** O ambiente de teste (`tests/setup/angular.ts`) usa `provideZonelessChangeDetection()`; o pacote `zone.js` nem está instalado, e o teste do estudo de caso confirma que `Zone` não existe.
- **Compilação.** Os testes Angular rodam num projeto próprio do Vitest (`vitest.config.mjs`), compilados pelo `@analogjs/vite-plugin-angular` com `tsconfig.angular.json`. O projeto React/Vue segue com esbuild.
- **spartan-ng.** O spartan divide-se em *brain* (primitivas, pacote npm `@spartan-ng/brain`) e *helm* (estilos, código copiado para o projeto). Os helm de `src/angular/ui/` saíram dos templates do `@spartan-ng/cli` (input, textarea, checkbox, label, field, button, separator, utils), só com o alias trocado por caminhos relativos. Sem Tailwind configurado, os componentes renderizam sem estilo, o que não afeta os testes.
- **TypeScript 6.0.** O compilador do Angular 22 exige TypeScript `>=6.0 <6.1`; o TypeScript 7 não expõe a API JS de que ele precisa. O projeto todo usa a 6.0.

## Ambiente

Node 24.21, Yup 1.7.1, Zod 4.6.7, React 19, Vue 3.5, Angular 22.3 (zoneless), spartan-ng 1.10, Immer 11, Vitest 5.1, TypeScript 6.0, tinybench, jsdom. Medições em Intel Core i7-13650HX, WSL2.
