import { cargarSemilla, CatalogoSeedRepository } from '@infrastructure/catalog';
import { BorradorEvaluacionMemoria } from '@infrastructure/persistence/memory/BorradorEvaluacionMemoria';
import { EvaluacionMemoriaRepository } from '@infrastructure/persistence/memory/EvaluacionMemoriaRepository';
import { OracionMemoriaRepository } from '@infrastructure/persistence/memory/OracionMemoriaRepository';
import { ProgresoMemoriaRepository } from '@infrastructure/persistence/memory/ProgresoMemoriaRepository';
import { RetoMemoriaRepository } from '@infrastructure/persistence/memory/RetoMemoriaRepository';
import {
  LocalStorageEvaluacionRepository,
  LocalStorageOracionRepository,
  LocalStorageProgresoRepository,
  LocalStorageRetoRepository,
  migrarClavesAntiguas,
  type Almacen
} from '@infrastructure/persistence/local-storage';
import { SincronizacionNoopAdapter } from '@infrastructure/sync';
import { AlmacenTokensLocal, ServidorIdentidadSimulado } from '@infrastructure/auth';
import {
  AleatorioMulberry32,
  ConectividadNavegador,
  DescargaCsvAdapter,
  GeneradorIdCrypto,
  RelojSistema,
  SesionLocalAdapter
} from '@infrastructure/system';
import type {
  AlmacenTokensPort,
  AutenticacionPort,
  BorradorEvaluacionPort,
  CatalogoRepository,
  ConectividadPort,
  EvaluacionRepository,
  ExportadorArchivoPort,
  GeneradorIdPort,
  OracionRepository,
  ProgresoRepository,
  RelojPort,
  AleatorioPort,
  RetoRepository,
  SesionPort,
  SincronizacionRemotaPort
} from '@application/ports';

/**
 * Composition root (ADR-001).
 *
 * Éste es el ÚNICO lugar del proyecto donde se hace `new` de adaptadores concretos.
 * La UI sólo puede importar este archivo desde `src/ui/hooks/**` y siempre a través de
 * `obtenerContenedor()`, que es perezoso y seguro en el render de servidor: durante el build,
 * Astro renderiza componentes en Node (sin `localStorage`), y en ese caso el contenedor usa
 * los repositorios en memoria en lugar de los persistentes.
 */

export interface AdaptadoresContenedor {
  reloj: RelojPort;
  aleatorio: AleatorioPort;
  generadorId: GeneradorIdPort;
  conectividad: ConectividadPort;
  sesion: SesionPort;
  /** RF-001: servidor de identidad (tokens de acceso y refresco). */
  autenticacion: AutenticacionPort;
  /** RF-001: par de tokens del cliente. */
  tokens: AlmacenTokensPort;
  exportador: ExportadorArchivoPort;
  sincronizacion: SincronizacionRemotaPort;
  progreso: ProgresoRepository;
  evaluaciones: EvaluacionRepository;
  catalogo: CatalogoRepository;
  oraciones: OracionRepository;
  retos: RetoRepository;
  borrador: BorradorEvaluacionPort;
}

let contenedor: AdaptadoresContenedor | null = null;

function hayAlmacenamientoLocal(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

/** Dobles que las pruebas de componente pueden inyectar en lugar de los adaptadores reales. */
export interface AdaptadoresParciales {
  catalogo?: CatalogoRepository;
}

/**
 * Construye los adaptadores. `almacen` permite inyectar `localStorage` en pruebas o forzar el
 * modo memoria pasando `null`; `sobrescribir` reemplaza adaptadores concretos (por ejemplo el
 * catálogo) sin tener que reconstruir el contenedor entero en cada prueba.
 */
export function crearAdaptadores(
  almacen?: Almacen | null,
  sobrescribir: AdaptadoresParciales = {}
): AdaptadoresContenedor {
  const persistente = almacen === null ? null : (almacen ?? (hayAlmacenamientoLocal() ? localStorage : null));

  const generadorId = new GeneradorIdCrypto();
  const reloj = new RelojSistema();
  const aleatorio = new AleatorioMulberry32();
  const conectividad = new ConectividadNavegador();
  const sesion = new SesionLocalAdapter(generadorId);
  const autenticacion = new ServidorIdentidadSimulado({
    reloj,
    generadorId,
    almacen: persistente ?? undefined
  });
  const tokens = new AlmacenTokensLocal(persistente);
  const exportador = new DescargaCsvAdapter();
  const sincronizacion = new SincronizacionNoopAdapter();

  const semilla = cargarSemilla();
  const catalogo: CatalogoRepository =
    sobrescribir.catalogo ?? new CatalogoSeedRepository(semilla.niveles, semilla.palabras);

  if (semilla.avisos.length > 0) {
    // Trazabilidad de calidad de datos: oraciones sembradas que no cumplen RN-11/RN-12.
    console.warn(`[yapu] Corpus sembrado con ${semilla.avisos.length} aviso(s):`, semilla.avisos);
  }

  if (persistente) {
    // Migración única desde las claves antiguas `yapu_*` (ADR-002).
    migrarClavesAntiguas(persistente);
  }

  const progreso: ProgresoRepository = persistente
    ? new LocalStorageProgresoRepository({ almacen: persistente })
    : new ProgresoMemoriaRepository();
  const evaluaciones: EvaluacionRepository = persistente
    ? new LocalStorageEvaluacionRepository({ almacen: persistente })
    : new EvaluacionMemoriaRepository();
  const oraciones: OracionRepository = persistente
    ? new LocalStorageOracionRepository(semilla.oraciones, { almacen: persistente })
    : new OracionMemoriaRepository(semilla.oraciones);
  const retos: RetoRepository = persistente ? new LocalStorageRetoRepository({ almacen: persistente }) : new RetoMemoriaRepository();

  return {
    reloj,
    aleatorio,
    generadorId,
    conectividad,
    sesion,
    autenticacion,
    tokens,
    exportador,
    sincronizacion,
    progreso,
    evaluaciones,
    catalogo,
    oraciones,
    retos,
    borrador: new BorradorEvaluacionMemoria()
  };
}

/** Contenedor perezoso de la aplicación (singleton por proceso). */
export function obtenerContenedor(): AdaptadoresContenedor {
  if (!contenedor) contenedor = crearAdaptadores();
  return contenedor;
}

/** Reemplaza el contenedor (pruebas de componente y escenarios con dobles). */
export function establecerContenedor(nuevo: AdaptadoresContenedor): void {
  contenedor = nuevo;
}

/** Descarta el contenedor actual para forzar su reconstrucción. */
export function reiniciarContenedor(): void {
  contenedor = null;
}
