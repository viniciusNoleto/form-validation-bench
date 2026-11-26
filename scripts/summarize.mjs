// Agrega as execuções arquivadas em results/runs/ (RUN >= 1) e gera results/summary.json e results/summary.md.
//
// Tempos por tecla e de montagem: em cada execução, a mediana das repetições; entre execuções,
// a mediana dessas medianas e o intervalo [mín, máx] delas. Também o IQR de todas as amostras.
// Micro-benchmarks (tinybench): média, mediana e p99 de cada execução; entre execuções, a mediana
// e o intervalo das médias. Contagens: precisam ser idênticas em todas as execuções (o script falha se não forem).
import fs from 'node:fs';

const DIR = 'results/runs';
const files = fs.readdirSync(DIR).filter((f) => /-(\d+)\.json$/.test(f) && Number(/-(\d+)\.json$/.exec(f)[1]) >= 1);
const load = (name) => files.filter((f) => f.startsWith(`${name}-`)).sort().map((f) => JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')));

const sorted = (xs) => [...xs].sort((a, b) => a - b);
const median = (xs) => { const s = sorted(xs); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const q = (xs, p) => { const s = sorted(xs); const i = (s.length - 1) * p; const lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };
const r1 = (x) => +x.toFixed(1);
const r2 = (x) => +x.toFixed(2);

/** Estatística de tempo entre execuções: cada execução contribui com a mediana das suas amostras. */
function timeStat(perRun) {
  const medians = perRun.map(median);
  const all = perRun.flat();
  return { median: r1(median(medians)), min: r1(Math.min(...medians)), max: r1(Math.max(...medians)), iqr: [r1(q(all, 0.25)), r1(q(all, 0.75))], runs: medians.map(r1), n: all.length };
}
function sameAcross(label, values) {
  const set = new Set(values.map((v) => JSON.stringify(v)));
  if (set.size !== 1) throw new Error(`contagens diferentes entre execuções em ${label}: ${[...set].join(' | ')}`);
  return values[0];
}

const summary = { generatedAt: new Date().toISOString(), runs: {}, frameworks: {}, schema: null, types: null };
const md = ['# Resumo dos benchmarks', '', `Gerado por \`npm run bench:summary\` a partir de \`results/runs/\`. Cada execução é uma sessão independente (processo próprio, ordem dos blocos alternada). Tempos: mediana das medianas de cada execução [mín–máx entre execuções]. "Só a tecla" exclui o avanço do relógio falso.`, ''];

/**
 * Comparações pareadas: as variantes rodam na mesma sessão, com a ordem sorteada, então a deriva entre
 * sessões é comum a elas. Para cada par, a razão e a diferença das medianas são calculadas DENTRO de cada
 * sessão. MDD (menor diferença detectável pelo critério do artigo): para que as amplitudes de duas
 * condições fiquem disjuntas, as medianas precisam diferir de pelo menos a meia-soma das larguras das
 * amplitudes; dividida pela mediana da referência, é a resolução relativa do critério naquela célula.
 */
const PAIRS = {
  react: { ref: 'C', extra: [['A3', 'B0'], ['A2', 'A3'], ['A2', 'C'], ['B0', 'B'], ['C0', 'C'], ['B0', 'C0'], ['B', 'C'], ['D', 'H']] },
  vue: { ref: 'W', extra: [['WC', 'WCS'], ['WC', 'WA'], ['WCS', 'W'], ['WA', 'W'], ['FWN', 'F'], ['FV', 'FVN'], ['FVN', 'F'], ['OP', 'O'], ['WD', 'H']] },
  angular: { ref: 'W', extra: [['WCS', 'W'], ['WD', 'H']] },
};

for (const fw of ['react', 'vue', 'angular']) {
  const runs = load(fw);
  if (!runs.length) continue;
  summary.runs[fw] = runs.map((r) => r.meta);
  const countKey = fw === 'react' ? 'renders' : 'updates';
  const out = { variants: {}, scaling: {} };
  for (const key of Object.keys(runs[0].variants)) {
    const vs = runs.map((r) => r.variants[key]);
    const pick = (x) => ({ [countKey]: x[countKey], formUpdates: x.formUpdates ?? x.formRenders, validations: x.validations, whole: x.whole ?? 0, flickers: x.flickers });
    out.variants[key] = {
      name: vs[0].name,
      counts25: { '250ms': sameAcross(`${fw}/${key}/25/250`, vs.map((v) => pick(v.counts25['250ms']))), '60ms': sameAcross(`${fw}/${key}/25/60`, vs.map((v) => pick(v.counts25['60ms']))) },
      counts54: { '250ms': sameAcross(`${fw}/${key}/54/250`, vs.map((v) => pick(v.keys54['250ms']))), '60ms': sameAcross(`${fw}/${key}/54/60`, vs.map((v) => pick(v.keys54['60ms']))) },
      usPerKey: { '250ms': timeStat(vs.map((v) => v.keys54['250ms'].samples_us)), '60ms': timeStat(vs.map((v) => v.keys54['60ms'].samples_us)) },
      // só a fase da tecla (evento + render síncrono), sem o avanço do relógio falso
      keyUsPerKey: { '250ms': timeStat(vs.map((v) => v.keys54['250ms'].samples_key_us)), '60ms': timeStat(vs.map((v) => v.keys54['60ms'].samples_key_us)) },
      mount500ms: timeStat(vs.map((v) => v.mount500_ms)),
    };
  }
  for (const cell of Object.keys(runs[0].scaling)) {
    const cs = runs.map((r) => r.scaling[cell]);
    const c = cs[0];
    out.scaling[cell] = { key: c.key, n: c.n, ...sameAcross(`${fw}/${cell}`, cs.map((x) => ({ [countKey]: x[countKey], formUpdates: x.formUpdates ?? x.formRenders }))), usPerKey: timeStat(cs.map((x) => x.samples_us)), keyUsPerKey: timeStat(cs.map((x) => x.samples_key_us)) };
  }
  out.paired = paired(fw, out);
  summary.frameworks[fw] = out;

  const fmt = (s) => `${s.median} [${s.min}–${s.max}]`;
  md.push(`## ${fw}`, '', `| Variante | ${countKey} (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | ${countKey} (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | só a tecla, 250/60 ms | montagem 500 campos, ms |`, '|---|---|---|---|---|---|---|---|---|---|');
  for (const [key, v] of Object.entries(out.variants)) {
    const c25 = v.counts25, c54 = v.counts54;
    md.push(`| ${v.name} | ${c25['250ms'][countKey]} / ${c25['60ms'][countKey]} | ${c25['250ms'].formUpdates} | ${c25['250ms'].flickers} | ${c54['250ms'][countKey]} / ${c54['60ms'][countKey]} | ${c54['250ms'].validations} / ${c54['60ms'].validations} | ${fmt(v.usPerKey['250ms'])} | ${fmt(v.usPerKey['60ms'])} | ${v.keyUsPerKey['250ms'].median} / ${v.keyUsPerKey['60ms'].median} | ${fmt(v.mount500ms)} |`);
  }
  md.push('', `Escala (54 teclas a cada 250 ms):`, '', `| Variante | campos | ${countKey} | pai | µs/tecla |`, '|---|---|---|---|---|');
  for (const s of Object.values(out.scaling).sort((a, b) => a.key.localeCompare(b.key) || a.n - b.n)) md.push(`| ${s.key} | ${s.n} | ${s[countKey]} | ${s.formUpdates} | ${fmt(s.usPerKey)} |`);
  md.push('', `Comparações pareadas por sessão (razão = variante / referência, calculada dentro de cada sessão; "sessões >1" = em quantas das ${runs.length} sessões a variante foi mais lenta; "MDD" = menor diferença relativa que o critério de amplitudes disjuntas consegue acusar nesta célula; "sobrepõem" = amplitudes entre sessões se sobrepõem):`, '',
    '| Comparação | cadência / campos | razão mediana [mín–máx] | sessões >1 | diferença mediana, µs [mín–máx] | MDD | sobrepõem |', '|---|---|---|---|---|---|---|');
  for (const p of out.paired) md.push(`| ${p.label} | ${p.cell} | ${p.ratio.median} [${p.ratio.min}–${p.ratio.max}] | ${p.slower}/${p.sessions} | ${p.diff.median} [${p.diff.min}–${p.diff.max}] | ${p.mdd}% | ${p.overlap ? 'sim' : 'não'} |`);
  md.push('');
}

function paired(fw, out) {
  const cfg = PAIRS[fw];
  const res = [];
  const one = (label, cell, a, b) => {
    if (!a || !b || a.runs.length !== b.runs.length) return;
    const ratios = a.runs.map((x, i) => x / b.runs[i]);
    const diffs = a.runs.map((x, i) => x - b.runs[i]);
    const w = (s) => s.max - s.min;
    res.push({
      label, cell, sessions: ratios.length, slower: ratios.filter((r) => r > 1).length,
      ratio: { median: r2(median(ratios)), min: r2(Math.min(...ratios)), max: r2(Math.max(...ratios)) },
      diff: { median: r1(median(diffs)), min: r1(Math.min(...diffs)), max: r1(Math.max(...diffs)) },
      mdd: r1((100 * (w(a) + w(b)) / 2) / b.median),
      overlap: !(a.min > b.max || b.min > a.max),
    });
  };
  const V = out.variants;
  const keys = Object.keys(V);
  for (const k of keys) if (k !== cfg.ref) for (const cad of ['250ms', '60ms']) one(`${k} × ${cfg.ref}`, cad, V[k].usPerKey[cad], V[cfg.ref].usPerKey[cad]);
  for (const [a, b] of cfg.extra) if (V[a] && V[b]) for (const cad of ['250ms', '60ms']) one(`${a} × ${b}`, cad, V[a].usPerKey[cad], V[b].usPerKey[cad]);
  // escala: cada variante contra a forma adotada e contra H no mesmo tamanho (diferença até H = custo por tecla acima da linha de base)
  const S = out.scaling;
  for (const n of [20, 100, 500]) {
    const ref = S[`${cfg.ref}@${n}`];
    for (const cell of Object.values(S).filter((c) => c.n === n && c.key !== cfg.ref)) one(`${cell.key} × ${cfg.ref}`, `${n} campos`, cell.usPerKey, ref?.usPerKey);
    for (const cell of Object.values(S).filter((c) => c.n === n && c.key !== 'H')) one(`${cell.key} × H`, `${n} campos`, cell.usPerKey, S[`H@${n}`]?.usPerKey);
  }
  return res;
}

/** Micro-benchmarks: média por execução; entre execuções, mediana e intervalo; p99 = mediana dos p99. */
function micro(runs, keyOf) {
  const byTask = new Map();
  for (const run of runs) for (const r of run.results) {
    const k = keyOf(r);
    if (!byTask.has(k)) byTask.set(k, { ...r, means: [], p50s: [], p99s: [] });
    const t = byTask.get(k);
    t.means.push(r.mean_us); t.p50s.push(r.p50_us); t.p99s.push(r.p99_us);
  }
  return [...byTask.values()].map(({ means, p50s, p99s, mean_us, p50_us, p99_us, sd_us, samples, ...rest }) => ({
    ...rest, mean_us: r2(median(means)), mean_min: r2(Math.min(...means)), mean_max: r2(Math.max(...means)), p50_us: r2(median(p50s)), p99_us: r2(median(p99s)), runs: means.length,
  }));
}

const schemaRuns = load('schema');
if (schemaRuns.length) {
  summary.runs.schema = schemaRuns.map((r) => r.meta);
  summary.schema = { results: micro(schemaRuns, (r) => `${r.n}|${r.task}`), sanity: schemaRuns[0].sanity };
  md.push('## Esquema (µs por chamada)', '', '| Tarefa | n=3 média [mín–máx] · p99 | n=30 | n=300 |', '|---|---|---|---|');
  const tasks = [...new Set(summary.schema.results.map((r) => r.task))];
  for (const task of tasks) {
    const cell = (n) => { const r = summary.schema.results.find((x) => x.task === task && x.n === n); return r ? `${r.mean_us} [${r.mean_min}–${r.mean_max}] · ${r.p99_us}` : ''; };
    md.push(`| ${task} | ${cell(3)} | ${cell(30)} | ${cell(300)} |`);
  }
  md.push('');
}

const typeRuns = load('types');
if (typeRuns.length) {
  summary.runs.types = typeRuns.map((r) => r.meta);
  const results = micro(typeRuns, (r) => r.name);
  summary.types = { results };
  md.push('## Tipos de dado e cadeias de regras (µs por chamada, média)', '', '| Tipo | Cadeia | regras | entre campos | estado | regra reprovada | Yup média · p99 | Zod média · p99 | Zod: estratégia |', '|---|---|---|---|---|---|---|---|---|');
  const yupRows = results.filter((r) => r.lib === 'Yup');
  for (const y of yupRows) {
    const z = results.find((r) => r.lib === 'Zod' && r.id === y.id && r.state === y.state && r.at === y.at);
    md.push(`| ${y.type} | ${y.chain} | ${y.rules} | ${y.crossField ? 'sim' : 'não'} | ${y.state} | ${y.at} | ${y.mean_us} · ${y.p99_us} | ${z.mean_us} · ${z.p99_us} | ${z.zodStrategy} |`);
  }
  // agregados por tipo: mediana das médias dos casos válidos e inválidos
  const agg = {};
  for (const r of results) {
    const k = `${r.lib}|${r.type}|${r.state}`;
    (agg[k] ??= []).push(r.mean_us);
  }
  summary.types.byType = Object.fromEntries(Object.entries(agg).map(([k, xs]) => [k, { median: r2(median(xs)), min: r2(Math.min(...xs)), max: r2(Math.max(...xs)), cases: xs.length }]));
  md.push('', '| Tipo | Yup válido (mediana dos casos) | Yup inválido | Zod válido | Zod inválido |', '|---|---|---|---|---|');
  for (const type of ['string', 'number', 'boolean', 'date', 'array', 'object', 'mixed']) {
    const g = (lib, state) => { const a = summary.types.byType[`${lib}|${type}|${state}`]; return a ? `${a.median} (${a.min}–${a.max}, ${a.cases})` : ''; };
    md.push(`| ${type} | ${g('Yup', 'válido')} | ${g('Yup', 'inválido')} | ${g('Zod', 'válido')} | ${g('Zod', 'inválido')} |`);
  }
  md.push('');
}

// Navegador real (experiments/browser/time.mjs): tempo da thread principal por tecla. Um arquivo com
// REPS repetições; cada repetição roda todas as tarefas em ordem sorteada, então o pareamento é por repetição.
const browserTime = load('browser-time')[0];
if (browserTime) {
  summary.runs.browserTime = [browserTime.meta];
  const byTask = {};
  for (const r of browserTime.results) (byTask[r.task] ??= []).push(r);
  const stat = (xs) => ({ median: r1(median(xs)), min: r1(Math.min(...xs)), max: r1(Math.max(...xs)) });
  const tasks = Object.fromEntries(Object.entries(byTask).map(([k, rs]) => [k, { total: stat(rs.map((r) => r.usPerKey)), script: stat(rs.map((r) => r.scriptUsPerKey)), layout: stat(rs.map((r) => r.layoutUsPerKey)), reps: rs.length }]));
  const PAIRS_BROWSER = [
    ['react/B@20', 'react/C@20'], ['react/B0@20', 'react/C0@20'], ['react/B0@20', 'react/B@20'], ['react/C0@20', 'react/C@20'], ['react/C@20', 'react/H@20'],
    ['vue/WC@20', 'vue/W@20'], ['vue/WCS@20', 'vue/W@20'], ['vue/WA@20', 'vue/W@20'], ['vue/WC@20', 'vue/WCS@20'], ['vue/WC@20', 'vue/WA@20'], ['vue/W@20', 'vue/H@20'],
    ['vue/O@500', 'vue/W@500'], ['vue/OP@500', 'vue/W@500'], ['vue/O@500', 'vue/OP@500'], ['vue/W@500', 'vue/H@500'],
  ];
  const pairs = [];
  for (const [a, b] of PAIRS_BROWSER) {
    if (!byTask[a] || !byTask[b]) continue;
    for (const metric of ['usPerKey', 'scriptUsPerKey']) {
      const ra = Object.fromEntries(byTask[a].map((r) => [r.rep, r[metric]]));
      const rb = Object.fromEntries(byTask[b].map((r) => [r.rep, r[metric]]));
      const reps = Object.keys(ra).filter((k) => k in rb);
      const ratios = reps.map((k) => ra[k] / rb[k]);
      const diffs = reps.map((k) => ra[k] - rb[k]);
      pairs.push({ label: `${a} × ${b}`, metric, reps: reps.length, slower: ratios.filter((x) => x > 1).length,
        ratio: { median: r2(median(ratios)), min: r2(Math.min(...ratios)), max: r2(Math.max(...ratios)) },
        diff: { median: r1(median(diffs)), min: r1(Math.min(...diffs)), max: r1(Math.max(...diffs)) } });
    }
  }
  summary.browserTime = { browser: browserTime.browser, method: browserTime.method, tasks, pairs };
  md.push('## Navegador real: tempo da thread principal por tecla', '', browserTime.method, '',
    '| Tarefa | total µs/tecla, mediana [mín–máx] | script µs/tecla | layout µs/tecla |', '|---|---|---|---|');
  for (const [k, t] of Object.entries(tasks).sort()) md.push(`| ${k} | ${t.total.median} [${t.total.min}–${t.total.max}] | ${t.script.median} [${t.script.min}–${t.script.max}] | ${t.layout.median} |`);
  md.push('', '| Comparação | métrica | razão mediana [mín–máx] | repetições >1 | diferença mediana, µs [mín–máx] |', '|---|---|---|---|---|');
  for (const p of pairs) md.push(`| ${p.label} | ${p.metric === 'usPerKey' ? 'total' : 'script'} | ${p.ratio.median} [${p.ratio.min}–${p.ratio.max}] | ${p.slower}/${p.reps} | ${p.diff.median} [${p.diff.min}–${p.diff.max}] |`);
  md.push('');
}

fs.writeFileSync('results/summary.json', JSON.stringify(summary, null, 2));
fs.writeFileSync('results/summary.md', md.join('\n'));
console.log(md.join('\n'));
