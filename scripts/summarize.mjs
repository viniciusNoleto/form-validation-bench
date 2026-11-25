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

for (const fw of ['react', 'vue', 'angular']) {
  const runs = load(fw);
  if (!runs.length) continue;
  summary.runs[fw] = runs.map((r) => r.meta);
  const countKey = fw === 'react' ? 'renders' : 'updates';
  const out = { variants: {}, scaling: {} };
  for (const key of Object.keys(runs[0].variants)) {
    const vs = runs.map((r) => r.variants[key]);
    const pick = (x) => ({ [countKey]: x[countKey], formUpdates: x.formUpdates ?? x.formRenders, validations: x.validations, flickers: x.flickers });
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
  summary.frameworks[fw] = out;

  const fmt = (s) => `${s.median} [${s.min}–${s.max}]`;
  md.push(`## ${fw}`, '', `| Variante | ${countKey} (25 teclas, 250/60 ms) | pai (25 teclas, 250 ms) | cintilações | ${countKey} (54 teclas, 250/60 ms) | validações (54, 250/60) | µs/tecla, 250 ms | µs/tecla, 60 ms | só a tecla, 250/60 ms | montagem 500 campos, ms |`, '|---|---|---|---|---|---|---|---|---|---|');
  for (const [key, v] of Object.entries(out.variants)) {
    const c25 = v.counts25, c54 = v.counts54;
    md.push(`| ${v.name} | ${c25['250ms'][countKey]} / ${c25['60ms'][countKey]} | ${c25['250ms'].formUpdates} | ${c25['250ms'].flickers} | ${c54['250ms'][countKey]} / ${c54['60ms'][countKey]} | ${c54['250ms'].validations} / ${c54['60ms'].validations} | ${fmt(v.usPerKey['250ms'])} | ${fmt(v.usPerKey['60ms'])} | ${v.keyUsPerKey['250ms'].median} / ${v.keyUsPerKey['60ms'].median} | ${fmt(v.mount500ms)} |`);
  }
  md.push('', `Escala (54 teclas a cada 250 ms):`, '', `| Variante | campos | ${countKey} | pai | µs/tecla |`, '|---|---|---|---|---|');
  for (const s of Object.values(out.scaling).sort((a, b) => a.key.localeCompare(b.key) || a.n - b.n)) md.push(`| ${s.key} | ${s.n} | ${s[countKey]} | ${s.formUpdates} | ${fmt(s.usPerKey)} |`);
  md.push('');
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

fs.writeFileSync('results/summary.json', JSON.stringify(summary, null, 2));
fs.writeFileSync('results/summary.md', md.join('\n'));
console.log(md.join('\n'));
