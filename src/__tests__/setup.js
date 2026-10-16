import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount between tests so a leaked component can't satisfy the next
// assertion.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom has no matchMedia or scrollTo; components that call them on mount
// would otherwise throw during render rather than failing on an assertion.
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
window.scrollTo = () => {};
