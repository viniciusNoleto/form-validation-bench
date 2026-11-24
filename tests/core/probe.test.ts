import { it, expect } from 'vitest';
import * as yup from 'yup';
import { isContainer, validateAllSync, readError, validateAtSync } from '../../src/core/formCore';

const schema = yup.object({
  descriptions: yup.array().of(yup.object({
    title: yup.string().required('título obrigatório').default(''),
    tags: yup.array().of(yup.string()).min(1, 'uma tag').default([]),
  })).min(2, 'mínimo 2 descrições').default([]),
});

it('container detection and tree', () => {
  expect(isContainer(schema, 'descriptions')).toBe(true);
  expect(isContainer(schema, 'descriptions[0].tags')).toBe(true);
  expect(isContainer(schema, 'descriptions.0.tags')).toBe(true);
  expect(isContainer(schema, 'descriptions[0].title')).toBe(false);
  const tree = validateAllSync(schema, { descriptions: [{ title: '', tags: [] }] })!;
  console.log(JSON.stringify(tree));
  expect(readError(schema, tree, 'descriptions')).toBe('mínimo 2 descrições');
  expect(readError(schema, tree, 'descriptions[0].title')).toBe('título obrigatório');
  expect(readError(schema, tree, 'descriptions[0].tags')).toBe('uma tag');
  expect(validateAtSync(schema, 'descriptions', { descriptions: [{ title: '', tags: [] }] })).toBe('mínimo 2 descrições');
});
