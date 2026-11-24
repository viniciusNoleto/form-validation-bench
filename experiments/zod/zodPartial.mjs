// Utilitários para dar ao Zod as capacidades de getDefault/validateAt do Yup.
export function toPathKey(path) {
  // ['descriptions', 0, 'title'] -> 'descriptions.0.title'
  return path.map(String).join('.');
}

export function normalizePath(path) {
  // 'descriptions[0].title' -> 'descriptions.0.title'
  return path.replace(/\[(\d+)\]/g, '.$1');
}

// Remove wrappers (default, optional, nullable, prefault, pipe) até achar o tipo estrutural.
function unwrap(schema) {
  let s = schema;
  for (;;) {
    const def = s?._zod?.def;
    if (!def) return s;
    if (['default', 'prefault', 'optional', 'nullable', 'readonly', 'catch', 'nonoptional'].includes(def.type)) s = def.innerType;
    else if (def.type === 'pipe') s = def.in;
    else return s;
  }
}

// Resolve o sub-esquema de um caminho: 'descriptions.3.title'
export function schemaAt(schema, path) {
  let s = schema;
  for (const seg of normalizePath(path).split('.')) {
    const u = unwrap(s);
    const t = u._zod.def.type;
    if (t === 'object') s = u._zod.def.shape[seg];
    else if (t === 'array') s = u._zod.def.element;
    else return undefined;
    if (!s) return undefined;
  }
  return s;
}

export function getIn(obj, path) {
  let v = obj;
  for (const seg of normalizePath(path).split('.')) { if (v == null) return undefined; v = v[seg]; }
  return v;
}

// Estratégia 1: valida o objeto inteiro e filtra o issue do caminho (respeita refinamentos cruzados).
export function validateAtFull(schema, path, data) {
  const key = normalizePath(path);
  const r = schema.safeParse(data);
  if (r.success) return undefined;
  return r.error.issues.find(i => toPathKey(i.path) === key)?.message;
}

// Estratégia 2: valida só o sub-esquema do caminho (não vê refinamentos do objeto pai).
export function validateAtLocal(schema, path, data) {
  const sub = schemaAt(schema, path);
  if (!sub) return undefined;
  const r = sub.safeParse(getIn(data, path));
  return r.success ? undefined : r.error.issues.find(i => i.path.length === 0)?.message;
}

// Erros de todo o formulário num mapa plano: { 'descriptions.0.title': 'msg' }
export function flatErrors(schema, data) {
  const r = schema.safeParse(data);
  if (r.success) return {};
  const out = {};
  for (const i of r.error.issues) { const k = toPathKey(i.path); if (!(k in out)) out[k] = i.message; }
  return out;
}

export function getDefaults(schema) {
  // `.default()` devolve o valor padrão sem validá-lo; `.prefault()` o valida.
  const out = {};
  for (const [k, f] of Object.entries(unwrap(schema)._zod.def.shape)) {
    const r = f.safeParse(undefined);
    out[k] = r.success ? r.data : undefined;
  }
  return out;
}
