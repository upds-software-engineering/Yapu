import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Setup global de Vitest.
 *  - matchers de jest-dom (`toBeInTheDocument`, etc.)
 *  - limpieza del DOM entre pruebas de componente
 *  - aislamiento de localStorage entre pruebas de contrato (jsdom)
 */
beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

afterEach(() => {
  cleanup();
});
