import { it, expect } from 'vitest';
import { dependentsOf } from '../../src/core/formCore';

const deps = {
  person_type: ['document'],
  'contact.phones[].type': ['contact.phones[].number'],
  'partners[].phones[].type': ['partners[].phones[].number', 'partners[].phones'],
  'partners[].share': ['partners'],
};

it('dependentes por caminho exato e por forma de caminho, com os índices preenchidos em ordem', () => {
  expect(dependentsOf(deps, 'person_type')).toEqual(['document']);
  expect(dependentsOf(deps, 'contact.phones[2].type')).toEqual(['contact.phones[2].number']);
  expect(dependentsOf(deps, 'partners[1].phones[0].type')).toEqual(['partners[1].phones[0].number', 'partners[1].phones']);
  expect(dependentsOf(deps, 'partners.3.share')).toEqual(['partners']); // notação com ponto também
  expect(dependentsOf(deps, 'name')).toEqual([]);
  expect(dependentsOf(undefined, 'name')).toEqual([]);
});
