// Arquivo de cada execução de benchmark: results/runs/<nome>-<RUN>.json.
// RUN vem da variável de ambiente RUN (padrão 1). `npm run bench:runs` executa as cinco sessões.
// Cada arquivo registra a revisão do código que o produziu: o commit, se havia alterações não
// commitadas e um hash do conteúdo dos arquivos que geram os números (que confere com o commit
// seguinte quando as alterações forem commitadas sem mudança).
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const SOURCES = ['src', 'benchmarks', 'scripts', 'experiments', 'tests', 'package.json', 'package-lock.json', 'vitest.config.mjs', 'tsconfig.json', 'tsconfig.angular.json', '.nvmrc'];
const git = (cmd) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

/** Commit, alterações não commitadas nos arquivos-fonte e hash SHA-256 do conteúdo deles. */
export function revision() {
  const files = (git(`ls-files -co --exclude-standard -- ${SOURCES.join(' ')}`) ?? '').split('\n').filter((f) => f && fs.existsSync(f)).sort();
  const hash = crypto.createHash('sha256');
  for (const f of files) { hash.update(f); hash.update('\0'); hash.update(fs.readFileSync(f)); hash.update('\0'); }
  const dirty = git(`status --porcelain -- ${SOURCES.join(' ')}`);
  return { commit: git('rev-parse HEAD'), dirty: dirty === null ? null : dirty.length > 0, sourceHash: hash.digest('hex'), files: files.length };
}
const REVISION = revision();

export const RUN = Number(process.env.RUN ?? 1);

export function meta() {
  return {
    run: RUN,
    date: new Date().toISOString(),
    node: process.version,
    cpu: os.cpus()[0]?.model ?? 'desconhecida',
    cpus: os.cpus().length,
    memGB: +(os.totalmem() / 2 ** 30).toFixed(1),
    distro: (() => { try { return /PRETTY_NAME="([^"]+)"/.exec(fs.readFileSync('/etc/os-release', 'utf8'))?.[1] ?? null; } catch { return null; } })(),
    platform: `${os.platform()} ${os.release()}`,
    order: process.env.BENCH_ORDER ?? null, // ordem dos blocos na sessão (scripts/bench-runs.mjs)
    revision: REVISION,
  };
}

export function writeRun(name, data) {
  fs.mkdirSync('results/runs', { recursive: true });
  const file = `results/runs/${name}-${RUN}.json`;
  fs.writeFileSync(file, JSON.stringify({ meta: meta(), ...data }, null, 2));
  return file;
}

/** Embaralhamento determinístico por semente (ordem das variantes a cada repetição). */
export function shuffled(xs, seed) {
  const out = [...xs];
  let s = seed * 2654435761 % 2 ** 32 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
export const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
