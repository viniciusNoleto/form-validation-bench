import * as yup from 'yup';
import _get from 'lodash-es/get';
import _set from 'lodash-es/set';

/** Árvore de erros com o MESMO formato do formulário: folhas são strings. */
export type ErrorTree = Record<string, any>;

export type FormOptions = {
  /** quando a chave muda, revalidar também estes caminhos (se já exibem erro) */
  dependents?: Record<string, string[]>;
  /** false = árvore ingênua: o erro do contêiner divide o nó com os erros dos filhos (só para demonstração) */
  rootSuffix?: boolean;
};

/** Sufixo do erro do PRÓPRIO contêiner (array/objeto): `descriptions:root`. */
export const ROOT = ':root';

const containerCache = new WeakMap<yup.Schema, Map<string, boolean>>();

/** `descriptions[3].title` -> `descriptions[].title`: a forma do caminho sem os índices. */
const shapeOf = (path: string) => path.replace(/\[\d+\]/g, '[]').replace(/\.\d+(?=\.|$)/g, '[]');

/** O caminho aponta para um array/objeto no esquema? (memoizado por forma de caminho) */
export function isContainer(schema: yup.Schema, path: string): boolean {
  let cache = containerCache.get(schema);
  if (!cache) containerCache.set(schema, (cache = new Map()));
  const shape = shapeOf(path);
  let hit = cache.get(shape);
  if (hit === undefined) {
    try {
      const type = (yup.reach(schema, path.replace(/\.(\d+)(?=\.|$)/g, '[$1]')) as yup.Schema).type;
      hit = type === 'array' || type === 'object';
    } catch {
      hit = false;
    }
    cache.set(shape, hit);
  }
  return hit;
}

/** Onde o erro de um caminho mora na árvore. */
export const errorPath = (schema: yup.Schema, path: string, rootSuffix = true) =>
  (rootSuffix && isContainer(schema, path) ? `${path}${ROOT}` : path);

/** Lê um erro. Só string é erro; objeto/array são erros dos filhos. */
export function readError(schema: yup.Schema, errors: ErrorTree, path: string, rootSuffix = true): string | undefined {
  const value = _get(errors, errorPath(schema, path, rootSuffix));
  return typeof value === 'string' ? value : undefined;
}

/** Erro de UM caminho, síncrono. `undefined` = válido. */
export function validateAtSync(schema: yup.Schema, path: string, data: unknown): string | undefined {
  try {
    schema.validateSyncAt(path, data);
    return undefined;
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;
    // validar um contêiner pode falhar por causa de um filho: esse erro é do frame do filho
    return error.path === path ? error.errors[0] : undefined;
  }
}

/** Valida tudo e monta a árvore de erros (sem colisão contêiner × filhos). */
export function validateAllSync(schema: yup.Schema, data: unknown, rootSuffix = true): ErrorTree | null {
  try {
    schema.validateSync(data, { abortEarly: false });
    return null;
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;
    const tree: ErrorTree = {};
    const seen = new Set<string>();
    for (const inner of error.inner) {
      if (!inner.path || seen.has(inner.path)) continue; // primeira mensagem de cada caminho
      seen.add(inner.path);
      _set(tree, errorPath(schema, inner.path, rootSuffix), inner.errors[0]);
    }
    return tree;
  }
}
