// Custo por chamada de cada cadeia de regras, por tipo de dado, em Yup e em Zod 4.
// O comportamento de cada caso é verificado em tests/types/chains.test.ts.
import { Bench } from 'tinybench';
import { CASES, build, yupErrorAt, zodErrorAt } from './cases.ts';
import { writeRun } from '../shared/runs.mjs';

const tasks = [];
const bench = new Bench({ time: 200, warmupTime: 50 });

for (const c of CASES) {
  const built = build(c);
  const { yupForm, data, path } = built;
  const scenarios = [{ state: 'válido', at: '-', value: c.valid }];
  for (const inv of c.invalid) if (inv.yupMessage === undefined) scenarios.push({ state: 'inválido', at: inv.at, value: inv.value });
  for (const sc of scenarios) {
    const d = data(sc.value);
    for (const lib of ['Yup', 'Zod']) {
      const name = `${lib} · ${c.id} · ${sc.state} · ${sc.at}`;
      const fn = lib === 'Yup' ? () => yupErrorAt(yupForm, path, d) : () => zodErrorAt(c, built, d);
      tasks.push({ name, lib, id: c.id, type: c.type, chain: c.chain, rules: c.rules, crossField: !!c.crossField,
        zodStrategy: lib === 'Zod' ? (c.crossField ? 'objeto inteiro + filtro' : 'sub-esquema local') : null, state: sc.state, at: sc.at });
      bench.add(name, fn);
    }
  }
}

await bench.run();
const us = (ms) => +(ms * 1000).toFixed(3);
const results = bench.tasks.map((t, i) => {
  const l = t.result.latency;
  return { ...tasks[i], mean_us: us(l.mean), p50_us: us(l.p50), p99_us: us(l.p99), sd_us: us(l.sd), samples: l.samplesCount ?? l.samples?.length };
});
console.table(results.map(({ name, mean_us, p50_us, p99_us }) => ({ name, mean_us, p50_us, p99_us })));
console.log('gravado em', writeRun('types', { method: 'tinybench, 200 ms por tarefa, 50 ms de aquecimento; latência por chamada', results }));
