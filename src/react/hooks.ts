import { useEffect, useRef, type DependencyList } from 'react';

const sameDeps = (a: DependencyList, b: DependencyList) => a.length === b.length && a.every((dep, i) => Object.is(dep, b[i]));

/** Como useEffect, mas não roda na montagem — só quando alguma dependência muda. */
export function useNotFirstEffect(effect: () => void, deps: DependencyList) {
  const previousDeps = useRef<DependencyList | null>(null);

  useEffect(() => {
    const previous = previousDeps.current;
    previousDeps.current = deps;
    if (previous === null || sameDeps(previous, deps)) return;
    effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
