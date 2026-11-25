# Resumo dos benchmarks

Gerado por `npm run bench:summary` a partir de `results/runs/`. Cada execução é uma sessão independente (processo próprio, ordem dos blocos alternada). Tempos: mediana das medianas de cada execução [mín–máx entre execuções]. "Só a tecla" exclui o avanço do relógio falso.

## react

| Variante | renders (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | renders (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | só a tecla, 250/60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|---|
| H · input sem validação (linha de base do harness), memo | 25 / 25 | 25 | 0 | 54 / 54 | 0 / 0 | 147.2 [138.7–153.6] | 143.4 [134.7–147.8] | 142 / 137.8 | 8.8 [8.7–9.4] |
| A · forma anterior de produção: assíncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 542.1 [514.5–558.5] | 515.9 [511.3–551] | 533.1 / 507.7 | 8.6 [8.3–9.1] |
| A2 · hook atual, assíncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 543.4 [513.4–572.9] | 518.2 [506.3–542.9] | 533.1 / 512.3 | 8.7 [8.4–9.1] |
| A3 · hook atual, síncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 540.8 [499.2–552.8] | 533 [522.2–556.6] | 533.2 / 525.1 | 8.8 [8.6–9.1] |
| B0 · gravação única dentro do updater do setErrors, sem memo | 580 / 580 | 50 | 0 | 1280 / 1280 | 55 / 55 | 429.6 [421.1–459] | 430.2 [414.4–453.6] | 421.1 / 424 | 8.6 [8.4–9.2] |
| B · gravação única antecipada, sem memo | 580 / 580 | 29 | 0 | 1280 / 1280 | 55 / 55 | 378 [367–412.2] | 370.9 [360.6–381.1] | 372.2 / 365.6 | 8.9 [8.6–9.3] |
| C0 · gravação única dentro do updater do setErrors (versão anterior) + memo | 29 / 29 | 50 | 0 | 64 / 64 | 55 / 55 | 249.4 [246.3–252.8] | 247.7 [238.6–258.8] | 242.6 / 240.9 | 8.6 [8.4–9.1] |
| C · gravação única antecipada, sem setErrors quando nada muda, + memo (forma adotada) | 29 / 29 | 29 | 0 | 64 / 64 | 55 / 55 | 205.2 [204.7–232.5] | 201.2 [190.4–212.6] | 199.9 / 196.1 | 8.8 [8.4–9] |
| D · gravação única + memo + debounce 200 ms | 29 / 25 | 29 | 0 | 64 / 54 | 55 / 2 | 242.2 [225.3–250.5] | 152.1 [138.8–157.8] | 168 / 140.2 | 9.6 [9.2–9.8] |
| F · frame genérico + contexto, gravação antecipada + memo | 54 / 54 | 29 | 0 | 118 / 118 | 55 / 55 | 222.1 [217.1–233.3] | 215.2 [200.9–222.1] | 216.5 / 208.4 | 10.7 [10.5–11] |
| O · observador do formulário (useEffect sobre o estado) + gravação antecipada + memo; o campo só valida no blur | 29 / 29 | 29 | 0 | 64 / 64 | 55 / 55 | 201.9 [196–226.5] | 205 [197.3–209.7] | 195.3 / 199.5 | 8.6 [8.1–8.7] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | renders | pai | µs/tecla |
|---|---|---|---|---|
| B | 20 | 1280 | 64 | 378 [367–412.2] |
| B | 100 | 6400 | 64 | 1445 [1374.1–1502.4] |
| B | 500 | 32000 | 64 | 7023.3 [6595.2–7435.3] |
| C | 20 | 64 | 64 | 205.2 [204.7–232.5] |
| C | 100 | 64 | 64 | 554.3 [542.8–563.2] |
| C | 500 | 64 | 64 | 2386.1 [2264.7–2537.4] |
| C0 | 20 | 64 | 108 | 249.4 [246.3–252.8] |
| C0 | 100 | 64 | 108 | 751.9 [725–766.5] |
| C0 | 500 | 64 | 108 | 3327.8 [3206.2–3540.3] |
| H | 20 | 54 | 54 | 147.2 [138.7–153.6] |
| H | 100 | 54 | 54 | 447.2 [428.4–459.8] |
| H | 500 | 54 | 54 | 1965.6 [1890.5–2014.7] |
| O | 20 | 64 | 64 | 201.9 [196–226.5] |
| O | 100 | 64 | 64 | 567.6 [541.9–596.8] |
| O | 500 | 64 | 64 | 2334.6 [2317.7–2527.4] |

## vue

| Variante | updates (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | updates (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | só a tecla, 250/60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|---|
| H · wrapper sem validação (linha de base do harness) | 25 / 25 | 25 | 0 | 54 / 54 | 0 / 0 | 148.8 [137.5–156.7] | 141.3 [129.8–146.5] | 137.7 / 129.3 | 173.9 [169.4–176] |
| W · wrapper por tipo, validação no evento (forma adotada) | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 183.7 [172–191.7] | 182.8 [173.9–188] | 173.6 / 173.4 | 171.7 [167.5–178.1] |
| F · frame + provide/inject, validação no evento | 50 / 50 | 25 | 0 | 108 / 108 | 55 / 55 | 213.4 [193.5–221.1] | 214.2 [189.6–219.5] | 195.9 / 191.1 | 204.8 [201.2–213.2] |
| FWN · frame + provide/inject, watch sem debounce | 54 / 54 | 29 | 0 | 118 / 118 | 55 / 55 | 217.5 [200.4–223.1] | 211.2 [199.7–222.8] | 206.4 / 201.4 | 209.5 [204.2–211.7] |
| FW · frame + provide/inject, watch + debounce 200 ms | 54 / 50 | 29 | 0 | 118 / 108 | 55 / 2 | 242.4 [230.6–244.5] | 151.4 [144.4–156.1] | 176.4 / 139.7 | 210.4 [204–214.4] |
| WC · wrapper, assíncrono, limpar e regravar (forma anterior) | 40 / 40 | 40 | 13 | 87 / 87 | 55 / 55 | 264.8 [239.8–286.4] | 245.2 [240.4–274] | 250.1 / 234.3 | 171.6 [171.1–176.7] |
| WCS · wrapper, síncrono, limpar e regravar | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 189.8 [176.4–198.5] | 186.7 [175.8–190] | 180.8 / 177.9 | 173.8 [172.1–185.4] |
| WD · wrapper, evento + debounce 200 ms | 29 / 25 | 29 | 0 | 64 / 54 | 55 / 2 | 216.6 [205.1–220.2] | 126.2 [125.1–137.6] | 156.5 / 117 | 176.7 [173.8–184.4] |
| O · observador do formulário (watch profundo + cópia anterior); o campo só valida no blur | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 237.4 [215.8–246.1] | 221.4 [212.8–234.6] | 224 / 210.2 | 175.4 [170.7–179.7] |
| WV · wrapper por tipo declarado num v-for | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 195.1 [174.5–205.2] | 185.2 [171.4–194.2] | 181.1 / 175.2 | 172.7 [170.5–181.8] |
| FV · frame num v-for, o slot usa a variável do laço | 525 / 525 | 25 | 0 | 1134 / 1134 | 55 / 55 | 371.9 [354.6–395.3] | 366.2 [347.1–387.2] | 352.6 / 348.9 | 202.4 [197–210] |
| FVN · frame num v-for, o slot não usa a variável do laço | 50 / 50 | 25 | 0 | 108 / 108 | 55 / 55 | 213.1 [201.4–219.1] | 212.4 [200.1–221.8] | 202.9 / 197.4 | 206.4 [198.9–213.6] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | updates | pai | µs/tecla |
|---|---|---|---|---|
| H | 20 | 54 | 54 | 148.8 [137.5–156.7] |
| H | 100 | 54 | 54 | 292 [276.7–361.7] |
| H | 500 | 54 | 54 | 1096.8 [1016.8–1208.7] |
| O | 20 | 54 | 54 | 237.4 [215.8–246.1] |
| O | 100 | 54 | 54 | 465.6 [455.1–553.8] |
| O | 500 | 54 | 54 | 1716.1 [1699–1761.5] |
| W | 20 | 54 | 54 | 183.7 [172–191.7] |
| W | 100 | 54 | 54 | 349.4 [338.1–358.1] |
| W | 500 | 54 | 54 | 1121.8 [1102.3–1129.3] |

## angular

| Variante | updates (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | updates (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | só a tecla, 250/60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|---|
| H · wrapper sem validação (linha de base do harness) | 26 / 26 | 26 | 0 | 55 / 55 | 0 / 0 | 76.4 [73.6–85.9] | 73.2 [68.3–84] | 25.5 / 25.5 | 70.5 [62.2–73.2] |
| W · wrapper por tipo, validação no evento (forma adotada) | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 109.9 [108.8–113.3] | 106 [97.5–111.3] | 52 / 46.8 | 67.4 [63–71.4] |
| WC · wrapper, assíncrono, limpar e regravar | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 119.4 [110.1–142.3] | 111.9 [105.6–123.7] | 49.7 / 45.6 | 66.3 [64.7–71.8] |
| WCS · wrapper, síncrono, limpar e regravar | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 115.6 [112.6–118.7] | 111 [104.2–121.2] | 52.9 / 49.1 | 66.5 [59.4–69.9] |
| WD · wrapper, evento + debounce 200 ms | 30 / 26 | 26 | 0 | 65 / 55 | 55 / 2 | 125.7 [119.6–129.5] | 60.9 [57.6–72.7] | 29.8 / 19.1 | 69.4 [64.2–75.6] |
| F · frame genérico + injeção de dependência, validação no evento | 30 / 30 | 26 | 0 | 65 / 65 | 55 / 55 | 111.8 [107.4–122.6] | 106.6 [104.9–122.6] | 51.2 / 48.2 | 74.7 [73.2–80.3] |
| WN · wrapper que observa o próprio valor (effect), em vez de validar no evento | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 114.5 [108.6–123.6] | 110.4 [107.7–120.9] | 28.5 / 26.4 | 73.1 [64.8–76.9] |
| O · observador do formulário (effect sobre o signal); o campo só valida no blur | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 115.3 [109.8–130.5] | 114.7 [108.6–122.1] | 27.3 / 26 | 68.7 [62.2–76] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | updates | pai | µs/tecla |
|---|---|---|---|---|
| H | 20 | 55 | 55 | 76.4 [73.6–85.9] |
| H | 100 | 55 | 55 | 271.6 [257.7–285.7] |
| H | 500 | 55 | 55 | 1414.8 [1299.5–1508.8] |
| O | 20 | 55 | 55 | 115.3 [109.8–130.5] |
| O | 100 | 55 | 55 | 332.6 [307–338.8] |
| O | 500 | 55 | 55 | 1555.2 [1420.1–1602] |
| W | 20 | 55 | 55 | 109.9 [108.8–113.3] |
| W | 100 | 55 | 55 | 313.1 [307.6–329.6] |
| W | 500 | 55 | 55 | 1397.4 [1291.3–1501.3] |

## Esquema (µs por chamada)

| Tarefa | n=3 média [mín–máx] · p99 | n=30 | n=300 |
|---|---|---|---|
| Yup validateSyncAt · campo raiz válido | 1.18 [1.11–1.38] · 2.31 | 1.16 [1.13–1.21] · 2.15 | 1.15 [1.14–1.22] · 2.15 |
| Yup validateSyncAt · campo raiz inválido | 13.91 [13.52–18.08] · 33.5 | 14.15 [13.82–14.69] · 31.35 | 14.23 [13.54–15.17] · 36.81 |
| Yup validateSyncAt · primeiro item inválido | 14.34 [14.1–20] · 33.21 | 14.62 [14.42–15.1] · 33.75 | 14.64 [13.98–15.42] · 33.55 |
| Yup validateSyncAt · último item inválido | 14.47 [13.83–17.74] · 30.28 | 14.87 [14.16–15.11] · 35.24 | 14.83 [14.16–16.6] · 34.09 |
| Yup validateSyncAt · regra entre campos inválida | 14.82 [14.73–20.82] · 30.09 | 15.29 [14.17–15.75] · 32.63 | 15.04 [14.73–16.3] · 31.66 |
| Yup validateSyncAt · contêiner (array inteiro) válido | 12.61 [12.38–14.99] · 28.63 | 108.47 [105.33–111.35] · 264.49 | 1088.66 [1046.22–1163.62] · 1809.04 |
| Yup validateSyncAt · contêiner (array inteiro) inválido | 20.15 [20.05–26.72] · 46.76 | 46.75 [45.88–47.13] · 100.47 | 302.05 [296.84–334.19] · 591.22 |
| Yup validateAt (Promise) · campo raiz inválido | 16.09 [15.32–17.98] · 39.33 | 16.08 [15.56–17.28] · 35.09 | 16.23 [16.02–16.87] · 36.92 |
| Zod local · campo raiz válido | 0.51 [0.5–0.53] · 0.82 | 0.53 [0.5–0.53] · 0.89 | 0.52 [0.51–0.55] · 0.8 |
| Zod local · campo raiz inválido | 1.94 [1.79–2.02] · 3.87 | 1.95 [1.93–2.08] · 3.08 | 1.92 [1.9–2] · 3.18 |
| Zod local · primeiro item inválido | 2.12 [2.05–2.3] · 3.36 | 2.16 [2.08–2.38] · 3.6 | 2.13 [2.08–2.21] · 3.69 |
| Zod full+filtro · campo raiz inválido | 6.42 [6.16–6.76] · 15.57 | 25.6 [24.45–26.89] · 56.27 | 214.3 [209.22–222.4] · 3015.43 |
| Zod full+filtro · primeiro item inválido | 6.38 [6.29–7.4] · 16.11 | 25.72 [24.3–26.81] · 58.13 | 211.33 [207.72–225.26] · 2984.72 |
| Zod full+filtro · regra entre campos inválida | 6.69 [6.65–7.14] · 17.66 | 27.14 [26.35–28.02] · 58.09 | 235.73 [226.23–242.92] · 3095.6 |
| Yup validateSync · formulário inteiro inválido | 121.93 [114.86–137.48] · 275.37 | 514.82 [503.87–520.95] · 945.5 | 4791.92 [4512–4823] · 7223.98 |
| Yup validateSync · formulário inteiro válido | 22.76 [21.89–24.66] · 46.52 | 115.19 [114.05–119.04] · 283.85 | 1057.98 [1017.95–1087.03] · 1670.35 |
| Zod safeParse · formulário inteiro inválido | 4.14 [3.94–4.45] · 7.6 | 18.34 [17.64–18.55] · 34.34 | 164.41 [159.07–167.92] · 498.6 |
| Zod safeParse · formulário inteiro válido | 1.8 [1.73–1.83] · 3.25 | 7.83 [7.78–8.49] · 18.89 | 68.35 [66.57–74.37] · 140.59 |
| Remoção do item do meio · árvore + splice (Immer) | 3.98 [3.94–4.4] · 9.2 | 15.88 [15.54–15.97] · 34.5 | 136.22 [133.36–141.72] · 266.12 |
| Remoção do item do meio · mapa plano + renumeração | 0.99 [0.98–1.03] · 1.75 | 7.06 [6.99–7.26] · 17.34 | 61.87 [61.43–64.34] · 129.6 |
| Complexo · validateSyncAt · folha a 4 níveis, primeiro sócio, inválida | 23.09 [22.69–24.23] · 52.58 | 22.89 [22.75–24.76] · 50.4 | 22.63 [22.36–22.82] · 46.24 |
| Complexo · validateSyncAt · folha a 4 níveis, último sócio, inválida | 22.98 [22.56–24.24] · 53.13 | 23.78 [22.92–25.8] · 50.9 | 23.47 [23.1–23.62] · 51.08 |
| Complexo · validateSyncAt · folha a 4 níveis, válida | 10.18 [9.92–10.3] · 22.64 | 10.01 [9.93–10.5] · 22.38 | 10.05 [9.94–10.13] · 22.13 |
| Complexo · validateSyncAt · campo com when (CNPJ), válido | 3.95 [3.81–4.22] · 8.01 | 3.91 [3.87–4.06] · 7.93 | 3.91 [3.77–3.96] · 7.77 |
| Complexo · validateSyncAt · regra da lista (soma 100%), inválida | 47.66 [47.28–52.2] · 124.74 | 283.9 [281.64–314.41] · 597.55 | 2588.52 [2542.53–2715.5] · 3185.61 |
| Complexo · validateSync · formulário inteiro inválido | 388.17 [379.9–413.03] · 810.05 | 2477.79 [2440.76–2624.64] · 3416.87 | 23806.39 [23736.19–25576.63] · 25581.98 |
| Complexo · validateSync · formulário inteiro válido | 242.69 [234.88–270.71] · 559.82 | 1177.54 [1150.77–1188.69] · 1671.69 | 10327.24 [10183.86–10584.06] · 12003.71 |

## Tipos de dado e cadeias de regras (µs por chamada, média)

| Tipo | Cadeia | regras | entre campos | estado | regra reprovada | Yup média · p99 | Zod média · p99 | Zod: estratégia |
|---|---|---|---|---|---|---|---|---|
| string | required | 1 | não | válido | - | 1.02 · 1.93 | 0.2 · 0.37 | sub-esquema local |
| string | required | 1 | não | inválido | only | 13.49 · 29.02 | 1.56 · 2.78 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | válido | - | 1.32 · 2.34 | 0.31 · 0.57 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | first | 13.68 · 27.98 | 2.12 · 3.91 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | middle | 14.26 · 28.39 | 1.81 · 2.89 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | last | 14.46 · 31.48 | 1.78 · 3.25 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | válido | - | 1.66 · 3.09 | 0.47 · 0.9 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | first | 13.82 · 29.14 | 3.09 · 6.43 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | middle | 14.38 · 30.42 | 2.24 · 3.85 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | last | 14.34 · 29.86 | 1.98 · 3.18 | sub-esquema local |
| string | trim · required · email | 2 | não | válido | - | 1.3 · 2.29 | 0.34 · 0.56 | sub-esquema local |
| string | trim · required · email | 2 | não | inválido | first | 13.59 · 28.74 | 1.72 · 3.13 | sub-esquema local |
| string | trim · required · email | 2 | não | inválido | last | 14.18 · 28.77 | 2.21 · 4.9 | sub-esquema local |
| string | url | 1 | não | válido | - | 1.29 · 2.19 | 0.3 · 0.55 | sub-esquema local |
| string | url | 1 | não | inválido | only | 13.45 · 28.65 | 1.64 · 2.58 | sub-esquema local |
| string | uuid | 1 | não | válido | - | 1.03 · 1.83 | 0.25 · 0.47 | sub-esquema local |
| string | uuid | 1 | não | inválido | only | 13.26 · 27.82 | 1.97 · 3.08 | sub-esquema local |
| string | required · oneOf(3) | 2 | não | válido | - | 1.18 · 1.99 | 0.13 · 0.28 | sub-esquema local |
| string | required · oneOf(3) | 2 | não | inválido | last | 14.87 · 33.38 | 1.46 · 2.44 | sub-esquema local |
| string | transform(dígitos) · matches(CEP) | 1 | não | válido | - | 1.1 · 2.09 | 0.31 · 0.55 | sub-esquema local |
| string | transform(dígitos) · matches(CEP) | 1 | não | inválido | only | 13.48 · 27.58 | 2 · 3.63 | sub-esquema local |
| string | required · oneOf(ref(password)) | 2 | sim | válido | - | 1.2 · 2.2 | 0.21 · 0.35 | objeto inteiro + filtro |
| string | required · oneOf(ref(password)) | 2 | sim | inválido | last | 14.63 · 30.01 | 1.75 · 2.89 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | válido | - | 5.11 · 9.97 | 0.18 · 0.35 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | inválido | first | 17.82 · 38.37 | 1.64 · 2.65 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | inválido | last | 18.22 · 35.65 | 1.66 · 2.75 | objeto inteiro + filtro |
| number | nullable · required | 1 | não | válido | - | 0.94 · 1.81 | 0.2 · 0.35 | sub-esquema local |
| number | nullable · required | 1 | não | inválido | only | 13.55 · 28.08 | 1.58 · 2.73 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | válido | - | 1.15 · 2.04 | 0.21 · 0.36 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | inválido | middle | 13.39 · 27.45 | 1.67 · 3.1 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | inválido | last | 14 · 30.86 | 1.62 · 2.73 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | válido | - | 1.25 · 2.26 | 0.26 · 0.44 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | first | 13.78 · 28.12 | 1.51 · 2.65 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | middle | 13.79 · 27.8 | 1.64 · 2.77 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | last | 13.98 · 28.22 | 1.75 · 3.18 | sub-esquema local |
| number | required · moreThan(ref(min)) | 2 | sim | válido | - | 1.07 · 1.9 | 0.14 · 0.23 | objeto inteiro + filtro |
| number | required · moreThan(ref(min)) | 2 | sim | inválido | last | 13.67 · 29.16 | 1.65 · 2.84 | objeto inteiro + filtro |
| boolean | required | 1 | não | válido | - | 0.95 · 1.83 | 0.13 · 0.27 | sub-esquema local |
| boolean | required | 1 | não | inválido | only | 13.92 · 31.83 | 1.46 · 2.76 | sub-esquema local |
| boolean | required · oneOf([true]) | 2 | não | válido | - | 1.07 · 1.94 | 0.18 · 0.34 | sub-esquema local |
| boolean | required · oneOf([true]) | 2 | não | inválido | last | 14.72 · 33.69 | 1.59 · 2.51 | sub-esquema local |
| date | nullable · required | 1 | não | válido | - | 0.98 · 1.81 | 0.2 · 0.39 | sub-esquema local |
| date | nullable · required | 1 | não | inválido | only | 13.29 · 29.19 | 1.6 · 2.61 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | válido | - | 1.34 · 2.34 | 0.35 · 0.63 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | inválido | middle | 13.57 · 29.08 | 1.84 · 3.05 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | inválido | last | 14.25 · 29.52 | 1.87 · 3.05 | sub-esquema local |
| date | required · min(ref(start)) | 2 | sim | válido | - | 1.18 · 2.09 | 0.22 · 0.38 | objeto inteiro + filtro |
| date | required · min(ref(start)) | 2 | sim | inválido | last | 13.89 · 29.85 | 1.83 · 3.13 | objeto inteiro + filtro |
| array | min(1) | 1 | não | válido | - | 2.05 · 3.55 | 0.22 · 0.41 | sub-esquema local |
| array | min(1) | 1 | não | inválido | only | 14.01 · 30.68 | 1.59 · 2.66 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | válido | - | 4.7 · 9.83 | 0.55 · 1.08 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | first | 13.72 · 29.53 | 1.75 · 2.78 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | middle | 15.78 · 33.95 | 1.75 · 3.08 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | last | 14.58 · 29.15 | 2 · 3.17 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | válido | - | 1.59 · 2.59 | 0.4 · 0.59 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | inválido | first | 13.89 · 28.84 | 2.12 · 3.3 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | inválido | last | 14.23 · 28.26 | 1.82 · 3.24 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | válido | - | 1.36 · 2.26 | 0.31 · 0.48 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | inválido | first | 13.69 · 28.14 | 2.35 · 4.11 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | inválido | last | 13.99 · 28.18 | 2 · 3.11 | sub-esquema local |
| object | objeto inteiro · test(início < fim) | 1 | não | válido | - | 3.28 · 7.29 | 0.2 · 0.41 | sub-esquema local |
| object | objeto inteiro · test(início < fim) | 1 | não | inválido | only | 14.59 · 31.75 | 1.6 · 2.5 | sub-esquema local |
| mixed | mixed · oneOf(3) | 1 | não | válido | - | 1 · 1.77 | 0.17 · 0.41 | sub-esquema local |
| mixed | mixed · oneOf(3) | 1 | não | inválido | only | 14.38 · 28.62 | 2.4 · 4.69 | sub-esquema local |
| mixed | mixed · test(arquivo ≤ 1 MB) | 1 | não | válido | - | 0.92 · 1.83 | 0.18 · 0.35 | sub-esquema local |
| mixed | mixed · test(arquivo ≤ 1 MB) | 1 | não | inválido | only | 13.49 · 28.83 | 1.59 · 2.54 | sub-esquema local |

| Tipo | Yup válido (mediana dos casos) | Yup inválido | Zod válido | Zod inválido |
|---|---|---|---|---|
| string | 1.25 (1.02–5.11, 10) | 14.22 (13.26–18.22, 16) | 0.28 (0.13–0.47, 10) | 1.79 (1.46–3.09, 16) |
| number | 1.11 (0.94–1.25, 4) | 13.78 (13.39–14, 7) | 0.21 (0.14–0.26, 4) | 1.64 (1.51–1.75, 7) |
| boolean | 1.01 (0.95–1.07, 2) | 14.32 (13.92–14.72, 2) | 0.15 (0.13–0.18, 2) | 1.52 (1.46–1.59, 2) |
| date | 1.18 (0.98–1.34, 3) | 13.73 (13.29–14.25, 4) | 0.22 (0.2–0.35, 3) | 1.83 (1.6–1.87, 4) |
| array | 2.05 (1.59–4.7, 3) | 14.12 (13.72–15.78, 6) | 0.4 (0.22–0.55, 3) | 1.79 (1.59–2.12, 6) |
| object | 2.32 (1.36–3.28, 2) | 13.99 (13.69–14.59, 3) | 0.26 (0.2–0.31, 2) | 2 (1.6–2.35, 3) |
| mixed | 0.96 (0.92–1, 2) | 13.94 (13.49–14.38, 2) | 0.17 (0.17–0.18, 2) | 2 (1.59–2.4, 2) |
