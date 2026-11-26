# form-validation-bench

Código e experimentos do artigo **"Validação de formulários orientada a esquema: um padrão incremental para React, Vue e Angular"**. Todo número citado no artigo sai daqui.

Licença ISC (`LICENSE`). Node 24.21 (`.nvmrc`, `engines`).

```bash
npm ci              # instala exatamente as versões do package-lock.json
npm test            # estudo de caso, caso de alta complexidade e núcleo
npm run typecheck   # tsc strict
npm run bench:runs  # todos os benchmarks, cinco sessões, as medições no Chromium e results/summary.md
npm run bench:verify  # confere se results/runs/ saiu do código que está no diretório
```

## Estrutura

```
src/                 o padrão descrito no artigo (Yup)
├── core/            núcleo sem framework: formCore.ts
├── schemas/         esquemas do estudo de caso: basicSchema.ts (seção 10) e complexSchema.ts (seção 10.7)
├── react/           hook useValidatedFormState + wrappers por tipo (Mantine) + BasicForm.tsx (estudo de caso)
├── vue/             composable useValidatedForm + useFormField + wrappers por tipo (PrimeVue) + BasicForm.vue
└── angular/         validatedForm (signals) + formField + wrappers por tipo (spartan-ng) + BasicForm.ts
    └── ui/          componentes helm do spartan-ng, copiados como o CLI do spartan faz

tests/               verificação do padrão
├── core/            probe.test.ts (isContainer, :root), removal.test.ts (mapa plano × árvore),
│                    yup-behavior.test.ts e zod-pitfalls.test.ts (comportamentos "verificados por execução")
├── types/           cada cadeia de regras do catálogo, em Yup e em Zod, com a mensagem esperada
├── case-study/      roteiro de verificação da seção 10.6, React, Vue e Angular; *-renders contam as atualizações
│                    de cada campo nos três (Angular pelo profiler de depuração, ng.ɵsetProfiler);
│                    complex/: roteiro de alta complexidade (seção 10.7) sobre o núcleo dos três frameworks
└── setup/           ambiente de teste do Angular (zoneless, sem zone.js)

benchmarks/          as medições da seção 8
├── shared/          arquivo das execuções (results/runs/, com a revisão do código), ordem sorteada das variantes,
│                    changedPaths (variante O) e countedSchema (conta as validações das bibliotecas)
├── schema/          custo por chamada do esquema, Yup e Zod, 3/30/300 itens
├── types/           custo por tipo de dado e por cadeia de regras, Yup e Zod (cases.ts é o catálogo)
├── react/           renders, µs por tecla, debounce e montagem (React); forms.tsx monta as variantes; libs.tsx traz
│                    React Hook Form, TanStack Form e Formik
├── vue/             atualizações, µs por tecla, debounce e montagem (Vue + PrimeVue); libs.ts traz VeeValidate,
│                    Vuelidate e FormKit
└── angular/         atualizações, µs por tecla, debounce e montagem (Angular + spartan-ng); libs.ts traz Reactive
                     Forms, Signal Forms e ngx-formly

experiments/         experimentos de apoio, fora do padrão final
├── browser/         navegador real (Chromium): quadros pintados da variante assíncrona do Vue (seção 8.4) e tempo
│                    por tecla dos contrastes do Resumo (time.mjs, seção 8.8)
├── pitfalls/        colisões de erro com _set numa árvore ingênua
├── zod/             reimplementação com Zod usada na comparação (React, Vue e Angular)
└── initial/         primeiros experimentos (React, Vue e Angular), anteriores aos benchmarks/ e substituídos
                     por eles, mantidos como registro; o Angular segue o roteiro do Vue (frame que observa o valor)

results/             saídas citadas no artigo
├── runs/            uma execução por arquivo (<benchmark>-<n>.json): as amostras dos roteiros de framework e os
│                    agregados (média, mediana, p99, desvio) dos micro-benchmarks, mais a revisão do código
├── summary.md       tabelas do artigo, geradas por npm run bench:summary
└── summary.json     o mesmo, legível por máquina
scripts/             bench-runs.mjs (cinco sessões + navegador), summarize.mjs (agregação e comparações pareadas)
                     e verify-revision.mjs (confere a revisão)
demo/                apps de demonstração (Vite) que usam o estudo de caso: react/, vue/ e angular/
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
| 8.4. Atualização intermediária no navegador real | `experiments/browser/run.mjs` | `npm run browser` | `results/runs/browser-1.json` |
| 8.3–8.5. Bibliotecas no mesmo roteiro | `benchmarks/{react,vue,angular}/libs.*` | `npm run bench:react`, `bench:vue`, `bench:angular` | `results/runs/{react,vue,angular}-*.json` |
| 8.8. Tempo por tecla no navegador real | `experiments/browser/time.mjs` | `npm run browser:time` | `results/runs/browser-time-1.json` |
| 8.7. Custo por tipo de dado e cadeia de regras | `benchmarks/types/`, `tests/types/` | `npm run bench:types`, `npm test` | `results/runs/types-*.json` |
| 8 (tabelas) | `scripts/summarize.mjs` | `npm run bench:summary` | `results/summary.md` |
| 9. Por que Yup e não Zod | `experiments/zod/`, `benchmarks/schema/`, `benchmarks/types/`, `tests/core/zod-pitfalls.test.ts` | `npm run zod:probe`, `npm run zod:test`, `npm test` | `results/summary.md` |
| 10. Estudo de caso | `src/schemas/basicSchema.ts`, `src/{react,vue,angular}/BasicForm.*`, `tests/case-study/` | `npm test` | — |
| 4.2, 10.7. Dependentes por forma de caminho; caso de alta complexidade | `src/core/formCore.ts` (`dependentsOf`), `src/schemas/complexSchema.ts`, `tests/case-study/complex/`, `tests/core/dependents.test.ts` | `npm test`, `npm run bench:schema` | `results/runs/schema-*.json` (tarefas "Complexo") |

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | núcleo, comportamentos do Yup e do Zod, catálogo de tipos e estudo de caso (React com Mantine, Vue com PrimeVue, Angular com spartan-ng) |
| `npm run typecheck` | `tsc` em modo strict sobre `src/`, `tests/` e a implementação com Zod, e `ngc` com `strictTemplates` sobre o código Angular |
| `npm run bench:runs` | cinco sessões independentes de todos os benchmarks (`RUN=1..5`), cada passo num processo novo e com a ordem dos blocos girando a cada sessão; depois, `browser` e `browser:time`, e o resumo; `RUNS=3` muda o número, `FROM_RUN=3` retoma da sessão 3, `SKIP_BROWSER=1` pula o navegador; cada passo tem limite de `STEP_TIMEOUT_MIN` minutos (padrão 30) e, se estourar, o passo e seus processos são encerrados e a rodada para com erro |
| `npm run bench:verify` | compara o hash de conteúdo gravado em cada `results/runs/*.json` (`meta.revision`) com o dos arquivos atuais; cada execução grava também o commit e se havia alterações não commitadas |
| `npm run browser` | abre as variantes W e WC do Vue no Chromium (Playwright, modo headless novo) e conta, por `requestAnimationFrame`, quadros sem a mensagem |
| `npm run browser:time` | tempo da thread principal por tecla no Chromium (CDP `Performance.getMetrics`), para os contrastes do Resumo: React H, B0, B, C0, C; Vue H, W, WC, WCS, WA com 20 campos; Vue H, W, O, OP com 500 campos; cinco repetições em ordem sorteada |
| `npm run bench` | uma execução de todos os benchmarks (`RUN=1` por padrão) |
| `npm run bench:summary` | agrega `results/runs/` em `results/summary.md` e `results/summary.json`; falha se alguma contagem diferir entre execuções |
| `npm run bench:schema` | µs por chamada (média, mediana, p99, desvio) de `validateSyncAt` em campo, item, contêiner e regra entre campos, `validateAt`, `validateSync`, Zod local e full+filtro, e remoção de item (árvore × mapa plano) |
| `npm run bench:types` | µs por chamada de cada cadeia de regras do catálogo, por tipo de dado, em Yup e em Zod |
| `npm run bench:react` | React: linha de base sem validação (H), forma anterior (A), limpar e regravar assíncrono (A2) e síncrono (A3), gravação única no updater sem memo (B0), gravação única antecipada sem memo (B), gravação no updater com memo (C0), forma adotada (C), C + debounce (D), frame genérico com contexto (F), observador do formulário (O); bibliotecas: React Hook Form (RHF), TanStack Form (TSF), Formik (FMK); escala com 20/100/500 campos |
| `npm run bench:vue` | Vue: H, wrapper (W), frame (F), frame com `watch` sem e com debounce (FWN, FW), limpar e regravar assíncrono e síncrono (WC, WCS), wrapper + debounce (WD), observador do formulário (O), assíncrono com gravação única (WA), observador com um `watch` por caminho (OP), campos num `v-for` (WV, FV, FVN); bibliotecas: VeeValidate (VV), Vuelidate (VLD), FormKit (FK); escala |
| `npm run bench:angular` | Angular: H, wrapper (W), limpar e regravar assíncrono e síncrono (WC, WCS), wrapper + debounce (WD), frame genérico com injeção de dependência (F), wrapper que observa o próprio valor com `effect` (WN), observador do formulário (O); bibliotecas: Reactive Forms (RF), Signal Forms (SF), ngx-formly (FLY); escala |
| `npm run gen:vue` | gera os formulários do benchmark Vue (`benchmarks/vue/components/Form*.vue`) |
| `npm run pitfalls` | imprime as colisões de erro e grava `results/pitfalls.txt` |
| `npm run zod:probe` | comportamento de `parse({})`, `default`, `prefault` e refinamentos no Zod 4 |
| `npm run zod:test` | a implementação com Zod, em React, Vue e Angular, passa pelo mesmo roteiro do estudo de caso; a Angular usa os mesmos wrappers de `src/angular` |
| `npm run initial` | primeiros experimentos em React, Vue e Angular (grava `react.json`, `vue.json` e `angular.json` em `experiments/initial/results/`) |
| `npm run dev:react` / `npm run dev:vue` / `npm run dev:angular` | demo do estudo de caso em http://localhost:5173 (React), http://localhost:5174 (Vue) e http://localhost:5175 (Angular, sem zone.js) |

Os três benchmarks de framework seguem o mesmo roteiro e gravam o mesmo formato: contagens com 25 teclas (renders ou atualizações do campo e do formulário pai, validações, cintilações), contagens e µs por tecla com 54 teclas, cada uma a cada 250 ms e a cada 60 ms, montagem de 500 campos e escala (54 teclas com 20, 100 e 500 campos). Cada execução faz 15 repetições, com a ordem das variantes embaralhada a cada repetição por uma semente fixa (`número da execução × 1000 + repetição`, reprodutível) e uma rodada de aquecimento. As células de escala com 100 e 500 campos entram no mesmo sorteio das variantes, e a célula de 20 campos é a própria medição da variante: a mesma condição tem um número só. A janela medida de cada tecla inclui o evento, o `act`/`flush` do framework e o avanço do relógio falso até a próxima tecla, mais os 300 ms finais em que um debounce pendente dispara; cada amostra registra também só a fase da tecla (`samples_key_us`), sem o avanço do relógio.

Cada execução grava um arquivo em `results/runs/` com todas as amostras dos roteiros de framework (os micro-benchmarks guardam os agregados do tinybench); nada é sobrescrito entre execuções de números diferentes. O resumo traz, para cada par de variantes, a razão calculada dentro de cada sessão, em quantas sessões a variante foi mais lenta e a menor diferença que o critério de amplitudes disjuntas consegue acusar.

As variantes de biblioteca usam o mesmo esquema Yup, do jeito que a documentação de cada uma recomenda, e a mesma regra de exibição do padrão (o erro aparece depois que o usuário alterou o campo ou saiu dele). `countedSchema` conta as chamadas ao esquema, separando as que validam o formulário inteiro (`whole`). As bibliotecas foram escolhidas pelas downloads mensais do npm (26/10 a 24/11/2026): as três primeiras em React e em Vue; em Angular, as duas APIs do pacote oficial `@angular/forms` e o ngx-formly. As contagens (renders, atualizações, validações, cintilações) são verificadas: as 15 repetições de uma execução e as cinco execuções precisam dar o mesmo número.

## Variantes do benchmark Vue

Os componentes em `benchmarks/vue/components/Form<variante><campos>.vue` são gerados por `npm run gen:vue`, com 20 ou 500 campos (e 100 para H e W). Os que usam a forma adotada usam o composable de `src/vue` (`useFinal` só conta as validações):

| Sigla | Estrutura do campo |
|---|---|
| `H` | wrapper que nunca pede validação (linha de base do harness) |
| `W` | wrapper por tipo, validação no evento (a forma final, seção 5.2) |
| `F` | frame genérico com provide/inject, validação no evento |
| `FWN` | frame genérico observando o valor com `watch`, sem debounce |
| `FW` | frame genérico observando o valor com `watch` + debounce de 200 ms |
| `WC` | wrapper por tipo, limpar e regravar com `validateAt` assíncrono (a forma anterior) |
| `WCS` | wrapper por tipo, limpar e regravar com `validateSyncAt`, no mesmo tique |
| `WD` | wrapper por tipo com debounce de 200 ms (seção 8.6) |
| `O` | observador do formulário: `watch` profundo compara com uma cópia anterior e valida o que mudou; o campo só valida no blur |
| `WV` | wrapper por tipo declarado num `v-for` |
| `FV` | frame num `v-for`, com o slot usando a variável do laço |
| `FVN` | frame num `v-for`, com o slot sem a variável do laço |
| `WA` | wrapper por tipo, `validateAt` assíncrono com gravação única, sem limpar (separa assincronia de limpar e regravar) |
| `OP` | observador do formulário com um `watch` por caminho, sem cópia nem comparação; o campo só valida no blur |
| `VV`, `VLD`, `FK` | VeeValidate, Vuelidate e FormKit (`libs.ts`, `BenchVee`, `BenchVld`, `BenchFK`) |

`BenchWrap`, `BenchWrapDebounce`, `BenchWrapBlur`, `BenchFrame` e `BenchCore` são os campos usados por essas variantes; `composables.ts` traz os modos de gravação do erro (`useFinal`, `useObserver`, `useClearThenSet`, `useClearThenSetSync`, `useAsyncOnce`, `usePathObserver`).

## Angular

- **Sem zone.js.** O ambiente de teste (`tests/setup/angular.ts`) usa `provideZonelessChangeDetection()`; o pacote `zone.js` nem está instalado, e o teste do estudo de caso confirma que `Zone` não existe.
- **Compilação.** Os testes Angular rodam num projeto próprio do Vitest (`vitest.config.mjs`), compilados pelo `@analogjs/vite-plugin-angular` com `tsconfig.angular.json`. O projeto React/Vue segue com esbuild.
- **spartan-ng.** O spartan divide-se em *brain* (primitivas, pacote npm `@spartan-ng/brain`) e *helm* (estilos, código copiado para o projeto). Os helm de `src/angular/ui/` saíram dos templates do `@spartan-ng/cli` (input, textarea, checkbox, label, field, button, separator, utils), só com o alias trocado por caminhos relativos. Sem Tailwind configurado, os componentes renderizam sem estilo, o que não afeta os testes.
- **TypeScript 6.0.** O compilador do Angular 22 exige TypeScript `>=6.0 <6.1`; o TypeScript 7 não expõe a API JS de que ele precisa. O projeto todo usa a 6.0.

## Ambiente

Node 24.21, Yup 1.7.1, Zod 4.6.7, React 19.3.1, Vue 3.5.46, Angular 22.3 (zoneless), spartan-ng 1.10, Immer 11, Vitest 5.1, @testing-library/react 16.3.3, @vue/test-utils 2.6.0, TypeScript 6.0, tinybench 6.2.5, jsdom 31, Playwright 1.65 (Chromium) para `npm run browser` e `browser:time`. Bibliotecas comparadas: React Hook Form 7.92 (+ @hookform/resolvers 7.0), TanStack Form 1.33, Formik 2.4, VeeValidate 4.15, Vuelidate 2.0, FormKit 2.10, ngx-formly 11.3; Reactive Forms e Signal Forms do @angular/forms 22.3. Medições em Intel Core i7-13650HX (20 threads), 10 GB de RAM no WSL2 (Ubuntu 22.04); `meta` de cada execução registra a máquina.
