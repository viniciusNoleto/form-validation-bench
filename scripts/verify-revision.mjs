// Confere se os arquivos de results/runs/ foram gerados pelo código que está no diretório: compara o
// hash de conteúdo gravado em cada execução (meta.revision.sourceHash) com o hash dos arquivos atuais.
// Uso: npm run bench:verify
import fs from 'node:fs';
import { revision } from '../benchmarks/shared/runs.mjs';

const now = revision();
let ok = true;
for (const f of fs.readdirSync('results/runs').filter((x) => /-[1-9]\d*\.json$/.test(x)).sort()) {
  const r = JSON.parse(fs.readFileSync(`results/runs/${f}`, 'utf8')).meta?.revision;
  const same = r?.sourceHash === now.sourceHash;
  ok &&= same;
  console.log(`${same ? 'ok      ' : 'DIFERENTE'} ${f}  commit ${r?.commit?.slice(0, 7) ?? '?'}${r?.dirty ? ' (com alterações não commitadas)' : ''}`);
}
console.log(`\nhash atual: ${now.sourceHash} (commit ${now.commit?.slice(0, 7)}${now.dirty ? ', com alterações não commitadas' : ''})`);
process.exit(ok ? 0 : 1);
