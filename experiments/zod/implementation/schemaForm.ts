import { z } from 'zod';

export type ErrorMap = Record<string, string>;

export type SchemaFormOptions = {
  /** caminhos cujas regras vivem no objeto pai (.refine/.superRefine) */
  crossFields?: string[];
  /** quando a chave muda, revalidar também estes caminhos (se já exibem erro) */
  dependents?: Record<string, string[]>;
};

const WRAPPERS = new Set(['default', 'prefault', 'optional', 'nullable', 'readonly', 'catch', 'nonoptional']);

export const normalizePath = (path: string) => path.replace(/\[(\d+)\]/g, '.$1');

function unwrap(schema: z.ZodType): z.ZodType {
  let current: any = schema;
  for (;;) {
    const def = current._zod.def;
    if (WRAPPERS.has(def.type)) current = def.innerType;
    else if (def.type === 'pipe') current = def.in;
    else return current;
  }
}

export function schemaAt(schema: z.ZodType, path: string): z.ZodType | undefined {
  let current: any = schema;
  for (const segment of normalizePath(path).split('.')) {
    const def = (unwrap(current) as any)._zod.def;
    if (def.type === 'object') current = def.shape[segment];
    else if (def.type === 'array') current = def.element;
    else return undefined;
    if (!current) return undefined;
  }
  return current;
}

export function getIn(data: unknown, path: string): unknown {
  let current: any = data;
  for (const segment of normalizePath(path).split('.')) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}

export function setIn<T>(data: T, path: string, value: unknown): T {
  const [head, ...rest] = normalizePath(path).split('.');
  const source: any = data ?? {};
  const copy: any = Array.isArray(source) ? [...source] : { ...source };
  copy[head] = rest.length ? setIn(source[head], rest.join('.'), value) : value;
  return copy;
}

export function getDefaults<S extends z.ZodObject>(schema: S): z.output<S> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const result = (field as z.ZodType).safeParse(undefined);
    out[key] = result.success ? result.data : undefined;
  }
  return out as z.output<S>;
}

export function toErrorMap(issues: readonly { path: PropertyKey[]; message: string }[]): ErrorMap {
  const map: ErrorMap = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!(key in map)) map[key] = issue.message;
  }
  return map;
}

/** Erro de um único caminho: local por padrão, completo para crossFields. */
export function validateAt(schema: z.ZodType, path: string, data: unknown, crossFields: string[] = []): string | undefined {
  const key = normalizePath(path);

  if (crossFields.includes(key)) {
    const result = schema.safeParse(data);
    return result.success ? undefined : result.error.issues.find((i) => i.path.map(String).join('.') === key)?.message;
  }

  const sub = schemaAt(schema, key);
  if (!sub) return undefined;
  const result = sub.safeParse(getIn(data, key));
  return result.success ? undefined : result.error.issues.find((i) => i.path.length === 0)?.message;
}

export function validateAll(schema: z.ZodType, data: unknown): ErrorMap {
  const result = schema.safeParse(data);
  return result.success ? {} : toErrorMap(result.error.issues);
}
