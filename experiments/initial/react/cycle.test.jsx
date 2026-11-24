import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import * as yup from 'yup';
import { z } from 'zod';
import fs from 'node:fs';
import { stats, useValidatedFormStateA, useValidatedFormStateB, TextField, MemoTextField } from '../../../benchmarks/react/baseline-hooks.jsx';
afterEach(() => cleanup());

const K = 20;
const keys = Array.from({ length: K }, (_, i) => `f${i}`);
const yupSchema = yup.object(Object.fromEntries(keys.map(k => [k, k === 'f0'
  ? yup.string().required('obrigatório').email('e-mail inválido').default('')
  : yup.string().required('obrigatório').default('')])));
const zodSchema = z.object(Object.fromEntries(keys.map(k => [k, k === 'f0'
  ? z.string().min(1, 'obrigatório').pipe(z.email('e-mail inválido')).default('')
  : z.string().min(1, 'obrigatório').default('')])));

function makeForm(useHook, schema, Field) {
  return function Form() {
    stats.formRenders++;
    const { field } = useHook(schema);
    return <form>{keys.map(k => <Field key={k} name={k} {...field(k)} />)}</form>;
  };
}

const TEXT = 'fulano.de.tal@exemplo.com'; // inválido até o último caractere
function flickers(trail) {
  // erro -> sem erro -> mesmo erro, com o valor ainda inválido
  let n = 0;
  for (let i = 2; i < trail.length; i++) if (trail[i - 2] && trail[i - 1] === null && trail[i] === trail[i - 2]) n++;
  return n;
}
async function typeInto(Form) {
  const { getByLabelText, container } = render(<Form />);
  stats.reset();
  const input = getByLabelText('f0');
  const t0 = performance.now();
  for (let i = 1; i <= TEXT.length; i++) {
    await act(async () => { fireEvent.change(input, { target: { value: TEXT.slice(0, i) } }); });
    if (i === 5) expect(container.querySelector('[role=alert]')?.textContent).toBe('e-mail inválido');
  }
  await act(async () => { fireEvent.blur(input); });
  const ms = performance.now() - t0;
  expect(container.querySelector('[role=alert]')).toBeNull();
  const res = { keystrokes: TEXT.length, formRenders: stats.formRenders, fieldRenders: stats.renders, validations: stats.validations, flickers: flickers(stats.errorTrail), ms: +ms.toFixed(1) };
  await act(async () => { fireEvent.change(input, { target: { value: '' } }); });
  expect(container.querySelector('[role=alert]')?.textContent).toBe('obrigatório');
  return res;
}

describe('ciclo React — 25 teclas num campo de e-mail + blur, formulário com 20 campos', () => {
  const out = {};
  it('A: atual (Yup, clear-then-set, async)', async () => { out.A = await typeInto(makeForm(useValidatedFormStateA, yupSchema, TextField)); });
  it('B: proposta (Zod síncrono, set único com bail-out)', async () => { out.B = await typeInto(makeForm(useValidatedFormStateB, zodSchema, TextField)); });
  it('C: proposta + React.memo nos campos', async () => { out.C = await typeInto(makeForm(useValidatedFormStateB, zodSchema, MemoTextField)); });
  it('relatório', () => { console.table(out); fs.writeFileSync('experiments/initial/results/react.json', JSON.stringify(out, null, 2)); });
});
