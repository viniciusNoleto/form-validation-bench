# Resumo dos benchmarks

Gerado por `npm run bench:summary` a partir de `results/runs/`. Tempos: mediana das medianas de cada execução [mín–máx entre execuções].

## react

| Variante | renders (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | renders (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|
| H · input sem validação (linha de base do harness), memo | 25 / 25 | 25 | 0 | 54 / 54 | 0 / 0 | 135.3 [125.9–153.2] | 134.4 [126.2–143.5] | 8.2 [8–8.4] |
| A · forma anterior de produção: assíncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 524.5 [508.7–562.4] | 487.4 [467.7–510.8] | 7.9 [7.9–8.2] |
| A2 · hook atual, assíncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 502.8 [500–515.2] | 486.5 [482.3–496] | 8.1 [8.1–8.4] |
| A3 · hook atual, síncrono, limpar e regravar, sem memo | 840 / 840 | 50 | 0 | 1840 / 1840 | 55 / 55 | 505.6 [494.9–511.6] | 481.1 [473.4–493.3] | 8.1 [8–8.4] |
| B · gravação única, sem memo | 580 / 580 | 29 | 0 | 1280 / 1280 | 55 / 55 | 357.8 [355.2–384.1] | 365.4 [358.7–366.2] | 8.4 [8.4–8.4] |
| C0 · gravação única dentro do updater do setErrors (versão anterior) + memo | 29 / 29 | 50 | 0 | 64 / 64 | 55 / 55 | 236.6 [233.4–262.2] | 228.3 [221.6–240.3] | 8.2 [8.1–8.2] |
| C · gravação única antecipada, sem setErrors quando nada muda, + memo (forma adotada) | 29 / 29 | 29 | 0 | 64 / 64 | 55 / 55 | 211.1 [193.2–225.2] | 198.3 [193.3–228.3] | 8.4 [8.3–8.5] |
| D · gravação única + memo + debounce 200 ms | 29 / 25 | 29 | 0 | 64 / 54 | 55 / 2 | 238.9 [236.7–247.8] | 153.3 [151.3–157.9] | 8.8 [8.6–8.9] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | renders | pai | µs/tecla |
|---|---|---|---|---|
| B | 20 | 1280 | 64 | 339 [334.9–343.2] |
| B | 100 | 6400 | 64 | 1290.4 [1278.4–1301] |
| B | 500 | 32000 | 64 | 6163.3 [6161–6287.3] |
| C | 20 | 64 | 64 | 182.2 [177.3–182.6] |
| C | 100 | 64 | 64 | 479.8 [470.3–511.4] |
| C | 500 | 64 | 64 | 2144.6 [2122.5–2153.5] |
| C0 | 20 | 64 | 108 | 218.3 [214.9–221.8] |
| C0 | 100 | 64 | 108 | 682.8 [653–689.1] |
| C0 | 500 | 64 | 108 | 2981.9 [2976–3049.5] |
| H | 20 | 54 | 54 | 125.5 [125.2–126.7] |
| H | 100 | 54 | 54 | 394.2 [376.2–416.7] |
| H | 500 | 54 | 54 | 1778.6 [1743.6–1788.6] |

## vue

| Variante | updates (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | updates (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|
| H · wrapper sem validação (linha de base do harness) | 25 / 25 | 25 | 0 | 54 / 54 | 0 / 0 | 131.6 [130.9–133] | 124.2 [124.1–124.5] | 158.5 [156.8–160.2] |
| W · wrapper por tipo, validação no evento (forma adotada) | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 173.4 [172.3–176.4] | 165 [162–165.9] | 155.3 [154.5–158.7] |
| F · frame + provide/inject, validação no evento | 50 / 50 | 25 | 0 | 108 / 108 | 55 / 55 | 196.2 [186.2–201.2] | 183.1 [179.8–183.4] | 190.6 [183.4–191.1] |
| FWN · frame + provide/inject, watch sem debounce | 54 / 54 | 29 | 0 | 118 / 118 | 55 / 55 | 202.7 [198.3–203] | 193.8 [188.1–195.5] | 191.2 [184.4–193] |
| FW · frame + provide/inject, watch + debounce 200 ms | 54 / 50 | 29 | 0 | 118 / 108 | 55 / 2 | 228 [221.6–229.1] | 136.1 [133.9–148.2] | 192.4 [184.5–194.6] |
| WC · wrapper, assíncrono, limpar e regravar (forma anterior) | 40 / 40 | 40 | 13 | 87 / 87 | 55 / 55 | 240.3 [237.5–241.3] | 224.7 [218.2–228.6] | 159.3 [154.2–159.6] |
| WCS · wrapper, síncrono, limpar e regravar | 25 / 25 | 25 | 0 | 54 / 54 | 55 / 55 | 178.4 [172.9–179.6] | 168.8 [161–170.1] | 159.4 [154–160.7] |
| WD · wrapper, evento + debounce 200 ms | 29 / 25 | 29 | 0 | 64 / 54 | 55 / 2 | 203.2 [201.9–225.7] | 123.1 [118.9–123.5] | 161.6 [155.5–161.8] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | updates | pai | µs/tecla |
|---|---|---|---|---|
| H | 20 | 54 | 54 | 118.1 [114.1–133.8] |
| H | 100 | 54 | 54 | 241.3 [232.9–263.8] |
| H | 500 | 54 | 54 | 897.1 [856.3–901.2] |
| W | 20 | 54 | 54 | 155.9 [151.8–175.7] |
| W | 100 | 54 | 54 | 286.1 [285.1–296.7] |
| W | 500 | 54 | 54 | 925.1 [917.9–996.7] |

## angular

| Variante | updates (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | updates (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | montagem 500 campos, ms |
|---|---|---|---|---|---|---|---|---|
| H · wrapper sem validação (linha de base do harness) | 26 / 26 | 26 | 0 | 55 / 55 | 0 / 0 | 71.3 [70–73.3] | 65.5 [65.3–65.6] | 51.7 [51.4–52.6] |
| W · wrapper por tipo, validação no evento (forma adotada) | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 104.3 [103.5–105.6] | 95.4 [93.9–95.8] | 50.4 [50.1–51.1] |
| WC · wrapper, assíncrono, limpar e regravar | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 114.7 [108.1–115.4] | 102.4 [101.1–103.5] | 49 [48.5–49.1] |
| WCS · wrapper, síncrono, limpar e regravar | 26 / 26 | 26 | 0 | 55 / 55 | 55 / 55 | 110.5 [107.1–116.6] | 102.2 [99.9–103.3] | 49 [48.6–50.1] |
| WD · wrapper, evento + debounce 200 ms | 30 / 26 | 26 | 0 | 65 / 55 | 55 / 2 | 118.3 [114.9–121] | 56.4 [54.2–61.9] | 52 [50.6–52.2] |

Escala (54 teclas a cada 250 ms):

| Variante | campos | updates | pai | µs/tecla |
|---|---|---|---|---|
| H | 20 | 55 | 55 | 60 [60–60.6] |
| H | 100 | 55 | 55 | 235.6 [227.2–242.3] |
| H | 500 | 55 | 55 | 1201.6 [1179.3–1221.2] |
| W | 20 | 55 | 55 | 91.1 [90.5–91.6] |
| W | 100 | 55 | 55 | 266.6 [265–271.6] |
| W | 500 | 55 | 55 | 1209.1 [1198.9–1234.9] |

## Esquema (µs por chamada)

| Tarefa | n=3 média [mín–máx] · p99 | n=30 | n=300 |
|---|---|---|---|
| Yup validateSyncAt · campo raiz válido | 1.07 [0.99–1.14] · 1.78 | 1.07 [1.06–1.12] · 1.78 | 1.1 [1.06–1.11] · 1.71 |
| Yup validateSyncAt · campo raiz inválido | 13.19 [12.69–13.28] · 24.27 | 13.4 [13.15–13.73] · 25.14 | 13.25 [13–13.39] · 25.19 |
| Yup validateSyncAt · primeiro item inválido | 13.61 [13.33–13.72] · 25.47 | 13.72 [13.59–13.72] · 26.14 | 13.66 [13.62–13.75] · 26.6 |
| Yup validateSyncAt · último item inválido | 13.53 [13.42–13.69] · 25.69 | 13.62 [13.49–13.78] · 24.83 | 13.75 [13.67–13.79] · 25.43 |
| Yup validateSyncAt · regra entre campos inválida | 14.27 [14.22–14.6] · 27.84 | 14.2 [13.62–14.57] · 26.31 | 13.76 [13.72–14.53] · 26.6 |
| Yup validateSyncAt · contêiner (array inteiro) válido | 11.51 [11.25–11.52] · 23.26 | 99.85 [99.09–100.36] · 178.22 | 1004.94 [970.78–1016.86] · 1564.23 |
| Yup validateSyncAt · contêiner (array inteiro) inválido | 19.31 [19.29–19.46] · 34.81 | 44.85 [43.82–45.08] · 74 | 285.37 [283.17–287.78] · 480.82 |
| Yup validateAt (Promise) · campo raiz inválido | 15.05 [15.02–15.42] · 28.88 | 15.27 [15.11–15.45] · 27.49 | 15.4 [14.98–15.51] · 27.75 |
| Zod local · campo raiz válido | 0.5 [0.48–0.5] · 0.71 | 0.49 [0.49–0.49] · 0.62 | 0.49 [0.49–0.5] · 0.6 |
| Zod local · campo raiz inválido | 1.8 [1.79–1.82] · 2.91 | 1.86 [1.79–1.88] · 2.65 | 1.79 [1.78–1.85] · 2.69 |
| Zod local · primeiro item inválido | 2.02 [2–2.06] · 2.88 | 2.03 [2.02–2.05] · 2.93 | 2.06 [2–2.08] · 2.88 |
| Zod full+filtro · campo raiz inválido | 5.99 [5.96–6.35] · 10.19 | 23.98 [23.62–24.28] · 40.11 | 202.08 [197.93–207.72] · 2876.46 |
| Zod full+filtro · primeiro item inválido | 6.16 [6.03–6.27] · 13.55 | 24.02 [23.56–24.47] · 40.78 | 198.95 [197.35–203.43] · 2560.49 |
| Zod full+filtro · regra entre campos inválida | 6.32 [6.26–6.33] · 11.96 | 25.77 [25.61–26.69] · 43.63 | 222.63 [215.24–226.93] · 3107.33 |
| Yup validateSync · formulário inteiro inválido | 110.2 [109.3–111.95] · 195.82 | 487.57 [481.21–488.02] · 818.32 | 4263.75 [4228.83–4276.49] · 5733.67 |
| Yup validateSync · formulário inteiro válido | 20.43 [20.28–20.65] · 34.36 | 108.13 [107.17–110.08] · 205.92 | 965.24 [959.76–978.86] · 1466.06 |
| Zod safeParse · formulário inteiro inválido | 3.81 [3.78–3.96] · 6.9 | 17.09 [16.95–18.07] · 28.25 | 149.21 [148.52–156.96] · 363.57 |
| Zod safeParse · formulário inteiro válido | 1.7 [1.69–1.72] · 2.82 | 7.69 [7.65–7.75] · 14.73 | 66.64 [66.62–66.97] · 87.42 |
| Remoção do item do meio · árvore + splice (Immer) | 3.63 [3.61–3.71] · 6.98 | 15.14 [15.12–15.22] · 27.93 | 131.05 [127.93–131.72] · 208.89 |
| Remoção do item do meio · mapa plano + renumeração | 0.94 [0.93–0.94] · 1.45 | 6.79 [6.72–6.86] · 11.97 | 58.77 [58.46–59.99] · 95.76 |

## Tipos de dado e cadeias de regras (µs por chamada, média)

| Tipo | Cadeia | regras | entre campos | estado | regra reprovada | Yup média · p99 | Zod média · p99 | Zod: estratégia |
|---|---|---|---|---|---|---|---|---|
| string | required | 1 | não | válido | - | 0.97 · 1.61 | 0.18 · 0.33 | sub-esquema local |
| string | required | 1 | não | inválido | only | 12.54 · 24.46 | 1.57 · 2.31 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | válido | - | 1.21 · 1.94 | 0.28 · 0.44 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | first | 13.01 · 24.4 | 2.02 · 2.88 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | middle | 13.15 · 25.64 | 1.61 · 2.31 | sub-esquema local |
| string | trim · required · min(3) · max(40) | 3 | não | inválido | last | 13.38 · 25.43 | 1.65 · 2.56 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | válido | - | 1.54 · 2.25 | 0.44 · 0.74 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | first | 12.81 · 24.05 | 2.79 · 4.03 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | middle | 13.53 · 24.79 | 2.06 · 3.05 | sub-esquema local |
| string | trim · required · min(3) · max(40) · matches(letras) · test(2 palavras) | 5 | não | inválido | last | 13.83 · 28.82 | 1.86 · 2.58 | sub-esquema local |
| string | trim · required · email | 2 | não | válido | - | 1.21 · 1.86 | 0.33 · 0.5 | sub-esquema local |
| string | trim · required · email | 2 | não | inválido | first | 12.93 · 24.91 | 1.61 · 2.34 | sub-esquema local |
| string | trim · required · email | 2 | não | inválido | last | 13.81 · 27 | 2.09 · 3.15 | sub-esquema local |
| string | url | 1 | não | válido | - | 1.24 · 1.95 | 0.28 · 0.47 | sub-esquema local |
| string | url | 1 | não | inválido | only | 12.59 · 24.09 | 1.56 · 2.32 | sub-esquema local |
| string | uuid | 1 | não | válido | - | 0.99 · 1.59 | 0.24 · 0.44 | sub-esquema local |
| string | uuid | 1 | não | inválido | only | 12.83 · 24.53 | 1.79 · 2.53 | sub-esquema local |
| string | required · oneOf(3) | 2 | não | válido | - | 1.13 · 1.78 | 0.12 · 0.23 | sub-esquema local |
| string | required · oneOf(3) | 2 | não | inválido | last | 13.99 · 26.45 | 1.42 · 2.14 | sub-esquema local |
| string | transform(dígitos) · matches(CEP) | 1 | não | válido | - | 0.98 · 1.67 | 0.29 · 0.51 | sub-esquema local |
| string | transform(dígitos) · matches(CEP) | 1 | não | inválido | only | 12.96 · 24.41 | 1.92 · 2.76 | sub-esquema local |
| string | required · oneOf(ref(password)) | 2 | sim | válido | - | 1.12 · 1.94 | 0.19 · 0.3 | objeto inteiro + filtro |
| string | required · oneOf(ref(password)) | 2 | sim | inválido | last | 13.73 · 25.94 | 1.69 · 2.53 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | válido | - | 4.85 · 8.43 | 0.17 · 0.25 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | inválido | first | 16.5 · 30.31 | 1.56 · 2.36 | objeto inteiro + filtro |
| string | when(type = pj, required · matches(CNPJ)) | 2 | sim | inválido | last | 17.22 · 32.44 | 1.59 · 2.34 | objeto inteiro + filtro |
| number | nullable · required | 1 | não | válido | - | 0.88 · 1.38 | 0.18 · 0.32 | sub-esquema local |
| number | nullable · required | 1 | não | inválido | only | 12.86 · 24 | 1.5 · 2.28 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | válido | - | 1.07 · 1.7 | 0.2 · 0.34 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | inválido | middle | 12.97 · 24.33 | 1.57 · 2.33 | sub-esquema local |
| number | required · min(1) · max(1000) | 3 | não | inválido | last | 13.27 · 25.09 | 1.54 · 2.32 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | válido | - | 1.13 · 1.69 | 0.24 · 0.39 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | first | 13.11 · 24.79 | 1.45 · 2.16 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | middle | 13.07 · 25.12 | 1.52 · 2.21 | sub-esquema local |
| number | typeError · required · integer · positive · min(1) · max(1000) | 5 | não | inválido | last | 13.42 · 25.55 | 1.6 · 2.41 | sub-esquema local |
| number | required · moreThan(ref(min)) | 2 | sim | válido | - | 0.99 · 1.58 | 0.13 · 0.22 | objeto inteiro + filtro |
| number | required · moreThan(ref(min)) | 2 | sim | inválido | last | 13 · 26.23 | 1.6 · 2.38 | objeto inteiro + filtro |
| boolean | required | 1 | não | válido | - | 0.88 · 1.52 | 0.12 · 0.24 | sub-esquema local |
| boolean | required | 1 | não | inválido | only | 12.86 · 24.27 | 1.36 · 2.08 | sub-esquema local |
| boolean | required · oneOf([true]) | 2 | não | válido | - | 1.03 · 1.63 | 0.17 · 0.32 | sub-esquema local |
| boolean | required · oneOf([true]) | 2 | não | inválido | last | 13.73 · 26.28 | 1.57 · 2.3 | sub-esquema local |
| date | nullable · required | 1 | não | válido | - | 0.92 · 1.52 | 0.18 · 0.34 | sub-esquema local |
| date | nullable · required | 1 | não | inválido | only | 12.4 · 23.37 | 1.5 · 2.37 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | válido | - | 1.29 · 2.02 | 0.35 · 0.51 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | inválido | middle | 12.99 · 24.79 | 1.77 · 2.85 | sub-esquema local |
| date | typeError · required · min · max | 3 | não | inválido | last | 13.33 · 25.65 | 1.75 · 2.5 | sub-esquema local |
| date | required · min(ref(start)) | 2 | sim | válido | - | 1.12 · 1.79 | 0.21 · 0.28 | objeto inteiro + filtro |
| date | required · min(ref(start)) | 2 | sim | inválido | last | 13.23 · 25.88 | 1.72 · 2.62 | objeto inteiro + filtro |
| array | min(1) | 1 | não | válido | - | 1.96 · 3.17 | 0.2 · 0.38 | sub-esquema local |
| array | min(1) | 1 | não | inválido | only | 13.09 · 24.64 | 1.46 · 2.15 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | válido | - | 4.25 · 8.01 | 0.51 · 0.89 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | first | 12.86 · 25.52 | 1.61 · 2.33 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | middle | 14.4 · 26.61 | 1.62 · 2.61 | sub-esquema local |
| array | of(string · required) · min(1) · max(5) · test(únicos) | 3 | não | inválido | last | 13.75 · 25.23 | 1.86 · 2.7 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | válido | - | 1.48 · 2.15 | 0.38 · 0.54 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | inválido | first | 12.92 · 24.09 | 2.01 · 2.74 | sub-esquema local |
| array | item de of(object) · title required · min(3) | 2 | não | inválido | last | 13.7 · 26.77 | 1.76 · 2.63 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | válido | - | 1.27 · 2.07 | 0.3 · 0.39 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | inválido | first | 12.74 · 24.03 | 2.14 · 3.1 | sub-esquema local |
| object | folha de objeto aninhado · required · matches | 2 | não | inválido | last | 13.21 · 24.89 | 1.84 · 2.67 | sub-esquema local |
| object | objeto inteiro · test(início < fim) | 1 | não | válido | - | 3 · 4.79 | 0.18 · 0.34 | sub-esquema local |
| object | objeto inteiro · test(início < fim) | 1 | não | inválido | only | 13.78 · 28.03 | 1.53 · 2.22 | sub-esquema local |
| mixed | mixed · oneOf(3) | 1 | não | válido | - | 0.92 · 1.53 | 0.15 · 0.32 | sub-esquema local |
| mixed | mixed · oneOf(3) | 1 | não | inválido | only | 13.63 · 25.35 | 2.22 · 3.07 | sub-esquema local |
| mixed | mixed · test(arquivo ≤ 1 MB) | 1 | não | válido | - | 0.86 · 1.38 | 0.17 · 0.3 | sub-esquema local |
| mixed | mixed · test(arquivo ≤ 1 MB) | 1 | não | inválido | only | 12.68 · 23.45 | 1.53 · 2.32 | sub-esquema local |

| Tipo | Yup válido (mediana dos casos) | Yup inválido | Zod válido | Zod inválido |
|---|---|---|---|---|
| string | 1.17 (0.97–4.85, 10) | 13.27 (12.54–17.22, 16) | 0.26 (0.12–0.44, 10) | 1.67 (1.42–2.79, 16) |
| number | 1.03 (0.88–1.13, 4) | 13.07 (12.86–13.42, 7) | 0.19 (0.13–0.24, 4) | 1.54 (1.45–1.6, 7) |
| boolean | 0.96 (0.88–1.03, 2) | 13.29 (12.86–13.73, 2) | 0.15 (0.12–0.17, 2) | 1.47 (1.36–1.57, 2) |
| date | 1.12 (0.92–1.29, 3) | 13.11 (12.4–13.33, 4) | 0.21 (0.18–0.35, 3) | 1.73 (1.5–1.77, 4) |
| array | 1.96 (1.48–4.25, 3) | 13.39 (12.86–14.4, 6) | 0.38 (0.2–0.51, 3) | 1.69 (1.46–2.01, 6) |
| object | 2.13 (1.27–3, 2) | 13.21 (12.74–13.78, 3) | 0.24 (0.18–0.3, 2) | 1.84 (1.53–2.14, 3) |
| mixed | 0.89 (0.86–0.92, 2) | 13.16 (12.68–13.63, 2) | 0.16 (0.15–0.17, 2) | 1.88 (1.53–2.22, 2) |
