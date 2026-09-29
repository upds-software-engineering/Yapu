import { beforeEach } from 'vitest';
import {
  EvaluacionMemoriaRepository,
  OracionMemoriaRepository,
  ProgresoMemoriaRepository,
  RetoMemoriaRepository
} from '@infrastructure/persistence/memory';
import {
  corpusDePrueba,
  suiteDeContrato,
  type RepositoriosDePrueba
} from './persistence.contract';

/**
 * [RNF-005] El contrato contra los repositorios EN MEMORIA.
 *
 * `crear()` devuelve siempre las mismas instancias dentro de una prueba (el estado vive en el
 * objeto) y se reinician antes de cada una, de modo que la suite compartida pueda comprobar la
 * persistencia llamando dos veces a la fábrica sin arrastrar estado entre pruebas.
 */

let repositorios: RepositoriosDePrueba | null = null;

beforeEach(() => {
  repositorios = null;
});

async function crear(): Promise<RepositoriosDePrueba> {
  repositorios ??= {
    progreso: new ProgresoMemoriaRepository(),
    evaluaciones: new EvaluacionMemoriaRepository(),
    oraciones: new OracionMemoriaRepository(corpusDePrueba()),
    retos: new RetoMemoriaRepository()
  };
  return repositorios;
}

suiteDeContrato('Adaptador en memoria', crear);
