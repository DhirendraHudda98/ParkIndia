import '@testing-library/jest-dom/vitest';
import '../i18n';

import * as React from 'react';

// Some tests/components expect `React` to be in scope (classic JSX runtime).
// Provide it globally for the test environment.
global.React = React;

// Provide a generic mock for @phosphor-icons/react so tests importing
// individual icons receive a simple component rather than needing
// per-test mocks.
vi.mock('@phosphor-icons/react', () => {
  const factory = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      return (props) => React.createElement('span', { 'data-testid': `icon-${String(prop)}`, ...props });
    },
  });
  return factory;
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
