import { beforeEach } from 'vitest';
import {
  LocalStorageEvaluacionRepository,
  LocalStorageOracionRepository,
  LocalStorageProgresoRepository,
  LocalStorageRetoRepository
} from '@infrastructure/persistence/local-storage';
import {
  corpusDePrueba,
  suiteDeContrato,
  type RepositoriosDePrueba
} from './persistence.contract';

/**
 * [RNF-005] EL MISMO contrato contra los repositorios de `localStorage`.
 *
 * Cada llamada a `crear()` construye instancias nuevas que comparten el `localStorage` de jsdom,
 * así que la suite comprueba de verdad que lo guardado sobrevive a una instancia nueva del
 * repositorio. `tests/helpers/setup.ts` limpia el almacén antes de cada prueba (y aquí se
 * reitera de forma explícita para que la dependencia sea visible).
 */

beforeEach(() => {
  localStorage.clear();
});

async function crear(): Promise<RepositoriosDePrueba> {
  return {
    progreso: new LocalStorageProgresoRepository(),
    evaluaciones: new LocalStorageEvaluacionRepository(),
    oraciones: new LocalStorageOracionRepository(corpusDePrueba()),
    retos: new LocalStorageRetoRepository()
  };
}

suiteDeContrato('Adaptador de localStorage', crear);
