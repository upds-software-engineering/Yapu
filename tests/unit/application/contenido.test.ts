import { describe, expect, it, vi } from 'vitest';
import type { ExportadorArchivoPort, SesionActual, SesionPort } from '@application/ports';
import { ExportarCorpusCsvUseCase } from '@application/use-cases/ExportarCorpusCsvUseCase';
import { ListarOracionesUseCase } from '@application/use-cases/ListarOracionesUseCase';
import { ListarRetosUseCase } from '@application/use-cases/ListarRetosUseCase';
import { ModerarRetoUseCase } from '@application/use-cases/ModerarRetoUseCase';
import { ProponerRetoUseCase, type EntradaReto } from '@application/use-cases/ProponerRetoUseCase';
import {
  RegistrarOracionBaseUseCase,
  type EntradaOracion
} from '@application/use-cases/RegistrarOracionBaseUseCase';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { OracionBase, RetoComunitario, type DatosReto } from '@domain/contenido';
import { BOM_UTF8 } from '@domain/contenido/serializadorCsv';
import {
  ConflictoEstadoError,
  NoEncontradoError,
  PermisoDenegadoError,
  ValidacionError
} from '@domain/errores';
import type { CategoriaGramatical, EstadoModeracion, RolUsuario } from '@domain/shared/tipos';
import {
  CatalogoMemoriaRepository,
  OracionMemoriaRepository,
  ProgresoMemoriaRepository,
  RetoMemoriaRepository
} from '@infrastructure/persistence/memory';
import { GeneradorIdSecuencial, RelojFijo } from '../../helpers';

/**
 * [RF-006] [RF-007] [RS-004] Casos de uso de contenido: oraciones base del docente, retos
 * comunitarios y exportación del corpus. Se prueban con los repositorios en memoria y dobles
 * deterministas, sin tocar infraestructura real.
 */

const DOCENTE = 'docente-1';
const DOCENTE_B = 'docente-2';
const ESTUDIANTE = 'estudiante-1';
const NOMBRE_ESTUDIANTE = 'Sumaq Quispe';

// ---------------------------------------------------------------------------
// Dobles y utilidades de prueba
// ---------------------------------------------------------------------------

/**
 * [RF-001] Sesión simulada configurable (ADR-003): `cambiarRol` muta el rol que devuelve el
 * puerto, de modo que el cambio se observe en las llamadas siguientes.
 */
function sesionFalsa(
  opciones: { rol?: RolUsuario; usuarioId?: string; nombre?: string } = {}
): SesionPort {
  let actual: SesionActual = {
    usuarioId: opciones.usuarioId ?? ESTUDIANTE,
    rol: opciones.rol ?? 'estudiante',
    nombre: opciones.nombre ?? NOMBRE_ESTUDIANTE
  };

  return {
    obtener: async () => ({ ...actual }),
    cambiarRol: async (rol: RolUsuario) => {
      actual = { ...actual, rol };
      return { ...actual };
    },
    establecerUsuario: async (usuarioId: string, nombre?: string) => {
      actual = { usuarioId, rol: actual.rol, nombre: nombre ?? actual.nombre };
      return { ...actual };
    }
  };
}

/** Palabra de prueba construida con el constructor validado del dominio. */
function palabra(datos: {
  id: string;
  nivelId: number;
  termino: string;
  traduccion?: string;
  categoria?: CategoriaGramatical;
}): Palabra {
  return Palabra.crear({
    id: datos.id,
    nivelId: datos.nivelId,
    termino: datos.termino,
    traduccion: datos.traduccion ?? 'saber',
    pronunciacion: 'yachay',
    categoria: datos.categoria ?? 'verbo',
    contextoCultural: 'Verbo central del aprendizaje andino.'
  });
}

const YACHAY = palabra({ id: 'pal-1', nivelId: 1, termino: 'yachay' });
const ALLIN = palabra({ id: 'pal-2', nivelId: 1, termino: 'allin', traduccion: 'bueno' });
/** Mismo término que YACHAY pero declarado en el nivel 2: sirve para probar RN-12. */
const YACHAY_NIVEL_2 = palabra({ id: 'pal-3', nivelId: 2, termino: 'yachay' });

function catalogo(palabras: readonly Palabra[]): CatalogoMemoriaRepository {
  return new CatalogoMemoriaRepository([], palabras);
}

/** Entrada válida de oración base, lista para sobrescribir campos concretos. */
function entradaOracion(sobrescribir: Partial<EntradaOracion> = {}): EntradaOracion {
  return {
    nivelId: 1,
    textoQuechua: 'Yachaywasipi yachakuni.',
    traduccionEspanol: 'Aprendo en la escuela.',
    palabraClaveId: YACHAY.id,
    contextoCultural: 'La escuela como espacio de transmisión del runasimi.',
    ...sobrescribir
  };
}

/** Oración ya construida por el dominio, para sembrar el repositorio en los listados. */
function unaOracion(opciones: {
  id: string;
  nivelId?: number;
  textoQuechua?: string;
  traduccionEspanol?: string;
  palabraClave?: Palabra;
  contextoCultural?: string;
  autorId?: string;
  estado?: EstadoModeracion;
  fechaCreacion?: string;
}): OracionBase {
  const clave = opciones.palabraClave ?? YACHAY;
  return OracionBase.crear(
    {
      id: opciones.id,
      nivelId: opciones.nivelId ?? 1,
      textoQuechua: opciones.textoQuechua ?? 'Yachaywasipi yachakuni.',
      traduccionEspanol: opciones.traduccionEspanol ?? 'Aprendo en la escuela.',
      palabraClaveId: clave.id,
      categoria: clave.categoria,
      contextoCultural: opciones.contextoCultural,
      autorId: opciones.autorId ?? DOCENTE,
      estado: opciones.estado ?? 'aprobado',
      fechaCreacion: opciones.fechaCreacion ?? '2026-03-15'
    },
    clave
  );
}

/** Progreso persistido con un nivel concreto, para las reglas de RN-13. */
function progresoDe(estudianteId: string, nivelActual: number): ProgresoEstudiante {
  return ProgresoEstudiante.reconstruir({
    estudianteId,
    nivelActual,
    cursoCompletado: false,
    xp: 0,
    rachaDias: 0,
    fechaUltimaActividad: null,
    nivelesAprobados: [],
    palabras: {}
  });
}

/** Repositorio de progreso ya sembrado con el agregado indicado. */
async function conProgreso(progreso: ProgresoEstudiante): Promise<ProgresoMemoriaRepository> {
  const repositorio = new ProgresoMemoriaRepository();
  await repositorio.guardar(progreso);
  return repositorio;
}

/** Entrada válida de reto comunitario, lista para sobrescribir campos concretos. */
function entradaReto(sobrescribir: Partial<EntradaReto> = {}): EntradaReto {
  return {
    textoQuechua: 'Pachamama kawsay.',
    traduccionSugerida: 'La Madre Tierra da vida.',
    pistaCultural: 'Saludo a la tierra antes de la siembra.',
    nivelSugerido: 7,
    ...sobrescribir
  };
}

/** Reto ya persistido, con la bitácora y el estado que indique el test. */
function unReto(sobrescribir: Partial<DatosReto> = {}): RetoComunitario {
  return RetoComunitario.reconstruir({
    id: 'reto-1',
    autorId: ESTUDIANTE,
    nombreAutor: NOMBRE_ESTUDIANTE,
    textoQuechua: 'Pachamama kawsay.',
    traduccionSugerida: 'La Madre Tierra da vida.',
    pistaCultural: 'Saludo a la tierra antes de la siembra.',
    nivelSugerido: 7,
    estado: 'pendiente',
    fechaCreacion: '2026-03-15',
    moderaciones: [],
    ...sobrescribir
  });
}

/** Repositorio de retos ya sembrado con los agregados indicados. */
async function repositorioConRetos(
  ...retos: RetoComunitario[]
): Promise<RetoMemoriaRepository> {
  const repositorio = new RetoMemoriaRepository();
  for (const reto of retos) {
    await repositorio.guardar(reto);
  }
  return repositorio;
}

/** Escenario de propuesta: el caso de uso y el repositorio donde queda el reto. */
async function casoProponer(opciones: {
  rol: RolUsuario;
  usuarioId: string;
  nivel: number;
}): Promise<{ caso: ProponerRetoUseCase; retos: RetoMemoriaRepository }> {
  const retos = new RetoMemoriaRepository();
  const caso = new ProponerRetoUseCase(
    retos,
    await conProgreso(progresoDe(opciones.usuarioId, opciones.nivel)),
    sesionFalsa({ rol: opciones.rol, usuarioId: opciones.usuarioId }),
    new RelojFijo(),
    new GeneradorIdSecuencial('reto')
  );
  return { caso, retos };
}

// ---------------------------------------------------------------------------
// RF-006 — Oraciones base del docente
// ---------------------------------------------------------------------------

describe('[RF-006] Oraciones base del docente', () => {
  describe('RegistrarOracionBaseUseCase', () => {
    it('[RN-12] una o un estudiante no puede registrar oraciones base', async () => {
      // Dado un estudiante con sesión activa
      const caso = new RegistrarOracionBaseUseCase(
        new OracionMemoriaRepository(),
        catalogo([YACHAY]),
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE }),
        new RelojFijo(),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando intenta registrar una oración válida
      const accion = caso.ejecutar(entradaOracion());

      // Entonces se le deniega el permiso
      await expect(accion).rejects.toBeInstanceOf(PermisoDenegadoError);
    });

    it('[RN-12] el docente registra la oración y esta alimenta el corpus', async () => {
      // Dado un docente y una palabra clave del mismo nivel que la oración
      const oraciones = new OracionMemoriaRepository();
      const caso = new RegistrarOracionBaseUseCase(
        oraciones,
        catalogo([YACHAY]),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE, nombre: 'Yachaq' }),
        new RelojFijo(),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando registra la oración
      const dto = await caso.ejecutar(entradaOracion());

      // Entonces la oración se guarda y el DTO la describe
      expect(await oraciones.listar()).toHaveLength(1);
      expect(dto.id).toBe('oracion-1');
      expect(dto.textoQuechua).toBe('Yachaywasipi yachakuni.');
      expect(dto.palabraClaveTermino).toBe('yachay');
      expect(dto.autorId).toBe(DOCENTE);
    });

    it('[RN-12] la oración registrada por el docente queda aprobada', async () => {
      // Dado un docente registrando contenido propio
      const caso = new RegistrarOracionBaseUseCase(
        new OracionMemoriaRepository(),
        catalogo([YACHAY]),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo('2026-03-15T09:00:00.000Z'),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando registra la oración
      const dto = await caso.ejecutar(entradaOracion());

      // Entonces queda aprobada sin pasar por moderación (RN-12)
      expect(dto.estado).toBe('aprobado');
      expect(dto.fechaCreacion).toBe('2026-03-15');
    });

    it('[RN-12] una palabra clave de otro nivel invalida la oración', async () => {
      // Dado un docente que usa una palabra clave del nivel 2 en una oración del nivel 1
      const caso = new RegistrarOracionBaseUseCase(
        new OracionMemoriaRepository(),
        catalogo([YACHAY_NIVEL_2]),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo(),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando registra la oración
      const accion = caso.ejecutar(entradaOracion({ palabraClaveId: YACHAY_NIVEL_2.id }));

      // Entonces falla la validación sobre la palabra clave
      await expect(accion).rejects.toBeInstanceOf(ValidacionError);
      await expect(accion).rejects.toMatchObject({ campo: 'palabraClaveId' });
    });

    it('[RN-11] una oración que no contiene la palabra clave es inválida', async () => {
      // Dado un docente que escribe una oración sin la palabra clave
      const caso = new RegistrarOracionBaseUseCase(
        new OracionMemoriaRepository(),
        catalogo([ALLIN]),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo(),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando registra la oración sin el término
      const accion = caso.ejecutar(
        entradaOracion({ palabraClaveId: ALLIN.id, textoQuechua: 'Yachaywasipi yachakuni.' })
      );

      // Entonces falla la validación sobre el texto
      await expect(accion).rejects.toBeInstanceOf(ValidacionError);
      await expect(accion).rejects.toMatchObject({ campo: 'textoQuechua' });
    });

    it('[RN-12] una palabra clave inexistente en el catálogo no se encuentra', async () => {
      // Dado un docente que referencia una palabra que no está en el catálogo
      const caso = new RegistrarOracionBaseUseCase(
        new OracionMemoriaRepository(),
        catalogo([YACHAY]),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo(),
        new GeneradorIdSecuencial('oracion')
      );

      // Cuando registra la oración con ese identificador
      const accion = caso.ejecutar(entradaOracion({ palabraClaveId: 'pal-inexistente' }));

      // Entonces se informa que no existe
      await expect(accion).rejects.toBeInstanceOf(NoEncontradoError);
    });
  });

  describe('ListarOracionesUseCase', () => {
    it('[RF-006] el listado resuelve el término de la palabra clave desde el catálogo', async () => {
      // Dado un corpus con una oración
      const oraciones = new OracionMemoriaRepository([unaOracion({ id: 'oracion-1' })]);
      const caso = new ListarOracionesUseCase(
        catalogo([YACHAY]),
        oraciones,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando se listan las oraciones
      const listado = await caso.ejecutar();

      // Entonces el DTO trae el término y la categoría de su palabra clave
      expect(listado).toHaveLength(1);
      expect(listado[0]?.palabraClaveTermino).toBe('yachay');
      expect(listado[0]?.categoria).toBe('verbo');
    });

    it('[RF-006] el listado filtra por nivel cuando se pide un nivel', async () => {
      // Dado un corpus con oraciones de los niveles 1 y 2
      const oraciones = new OracionMemoriaRepository([
        unaOracion({ id: 'oracion-n1', nivelId: 1 }),
        unaOracion({ id: 'oracion-n2', nivelId: 2, palabraClave: YACHAY_NIVEL_2 })
      ]);
      const caso = new ListarOracionesUseCase(
        catalogo([YACHAY, YACHAY_NIVEL_2]),
        oraciones,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando se pide el nivel 1
      const listado = await caso.ejecutar({ nivelId: 1 });

      // Entonces sólo llega la oración de ese nivel
      expect(listado.map((oracion) => oracion.id)).toEqual(['oracion-n1']);
    });

    it('[RF-006] sin filtro el listado devuelve todas las oraciones', async () => {
      // Dado un corpus con dos oraciones de niveles distintos
      const oraciones = new OracionMemoriaRepository([
        unaOracion({ id: 'oracion-n1', nivelId: 1 }),
        unaOracion({ id: 'oracion-n2', nivelId: 2, palabraClave: YACHAY_NIVEL_2 })
      ]);
      const caso = new ListarOracionesUseCase(
        catalogo([YACHAY, YACHAY_NIVEL_2]),
        oraciones,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando se lista sin filtro
      const listado = await caso.ejecutar();

      // Entonces llegan las dos
      expect(listado).toHaveLength(2);
    });

    it('[RF-006] el listado devuelve las oraciones más recientes primero', async () => {
      // Dado un corpus registrado en tres días distintos
      const oraciones = new OracionMemoriaRepository([
        unaOracion({ id: 'oracion-antigua', fechaCreacion: '2026-03-10' }),
        unaOracion({ id: 'oracion-mas-nueva', fechaCreacion: '2026-03-20' }),
        unaOracion({ id: 'oracion-intermedia', fechaCreacion: '2026-03-15' })
      ]);
      const caso = new ListarOracionesUseCase(
        catalogo([YACHAY]),
        oraciones,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando se listan
      const listado = await caso.ejecutar();

      // Entonces el orden es por fecha descendente
      expect(listado.map((oracion) => oracion.id)).toEqual([
        'oracion-mas-nueva',
        'oracion-intermedia',
        'oracion-antigua'
      ]);
    });

    it('[RF-006] entre oraciones del mismo día gana la última registrada', async () => {
      // Dado un corpus con dos oraciones del mismo día (el agregado sólo guarda el día)
      const oraciones = new OracionMemoriaRepository([
        unaOracion({ id: 'oracion-primera' }),
        unaOracion({ id: 'oracion-segunda' })
      ]);
      const caso = new ListarOracionesUseCase(
        catalogo([YACHAY]),
        oraciones,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando se listan
      const listado = await caso.ejecutar();

      // Entonces la registrada en último lugar aparece primero
      expect(listado.map((oracion) => oracion.id)).toEqual([
        'oracion-segunda',
        'oracion-primera'
      ]);
    });
  });
});

// ---------------------------------------------------------------------------
// RS-004 — Exportación CSV del corpus
// ---------------------------------------------------------------------------

describe('[RS-004] Exportación CSV', () => {
  /** Exporta un corpus de una oración cuya traducción es una carga de fórmula. */
  async function exportarCorpus() {
    const descargar = vi.fn();
    const exportador: ExportadorArchivoPort = { descargar };
    const caso = new ExportarCorpusCsvUseCase(
      catalogo([YACHAY]),
      new OracionMemoriaRepository([
        unaOracion({
          id: 'oracion-1',
          traduccionEspanol: '=1+1',
          contextoCultural: 'Ritual de siembra'
        })
      ]),
      exportador
    );

    const resultado = await caso.ejecutar();
    const contenido = String(descargar.mock.calls[0]?.[1] ?? '');
    return { resultado, contenido, descargar };
  }

  it('[RN-14] el archivo empieza por el BOM UTF-8 y separa los registros con CRLF', async () => {
    // Dado un corpus exportable
    // Cuando se exporta el corpus
    const { contenido } = await exportarCorpus();

    // Entonces el BOM encabeza el archivo y los registros usan CRLF
    expect(contenido.startsWith(BOM_UTF8)).toBe(true);
    expect(contenido.includes('\r\n')).toBe(true);
  });

  it('[RN-14] neutraliza una fórmula con apóstrofo antes de escribirla', async () => {
    // Dado un corpus cuya traducción empieza por igual
    // Cuando se exporta el corpus
    const { contenido } = await exportarCorpus();

    // Entonces la celda queda neutralizada
    expect(contenido).toContain("'=1+1");
  });

  it('[RS-004] escribe la cabecera del corpus y una fila por oración', async () => {
    // Dado un corpus de una oración
    // Cuando se exporta el corpus
    const { contenido, resultado } = await exportarCorpus();

    // Entonces la cabecera respeta el orden de las columnas y hay una fila de datos
    expect(contenido).toContain(
      'id,nivel,textoQuechua,traduccionEspanol,palabraClave,categoria,contextoCultural,autorId,estado,fechaCreacion'
    );
    expect(contenido).toContain('yachay,Verbo,Ritual de siembra,docente-1,aprobado,2026-03-15');
    expect(resultado.filas).toBe(1);
  });

  it('[RS-004] entrega el archivo al usuario con su nombre y tipo MIME', async () => {
    // Dado un corpus exportable
    // Cuando se exporta el corpus
    const { resultado, descargar } = await exportarCorpus();

    // Entonces el puerto de descarga recibe el nombre y el tipo MIME del CSV
    expect(descargar).toHaveBeenCalledTimes(1);
    expect(descargar).toHaveBeenCalledWith(
      'yapu_corpus_quechua.csv',
      expect.any(String),
      'text/csv;charset=utf-8'
    );
    expect(resultado).toEqual({
      nombreArchivo: 'yapu_corpus_quechua.csv',
      filas: 1,
      tipoMime: 'text/csv;charset=utf-8'
    });
  });
});

// ---------------------------------------------------------------------------
// RF-007 — Retos comunitarios
// ---------------------------------------------------------------------------

describe('[RF-007] Retos comunitarios', () => {
  describe('ProponerRetoUseCase', () => {
    it('[RN-13] una o un estudiante de nivel 6 no puede proponer retos', async () => {
      // Dado un estudiante que aún no alcanza el nivel 7
      const { caso } = await casoProponer({
        rol: 'estudiante',
        usuarioId: ESTUDIANTE,
        nivel: 6
      });

      // Cuando propone un reto
      const accion = caso.ejecutar(entradaReto());

      // Entonces se le deniega el permiso
      await expect(accion).rejects.toBeInstanceOf(PermisoDenegadoError);
    });

    it('[RN-13] una o un estudiante de nivel 7 propone un reto pendiente', async () => {
      // Dado un estudiante de nivel 7
      const { caso, retos } = await casoProponer({
        rol: 'estudiante',
        usuarioId: ESTUDIANTE,
        nivel: 7
      });

      // Cuando propone un reto
      const dto = await caso.ejecutar(entradaReto());

      // Entonces nace pendiente, sin votos y a la espera de la doble moderación
      expect(dto.estado).toBe('pendiente');
      expect(dto.aprobaciones).toBe(0);
      expect(dto.aprobacionesRequeridas).toBe(RetoComunitario.APROBACIONES_REQUERIDAS);
      expect(dto.votadoPorMi).toBe(false);
      expect(dto.esMiAutoría).toBe(true);
      expect(await retos.listar()).toHaveLength(1);
    });

    it('[RN-13] una o un docente no puede proponer retos comunitarios', async () => {
      // Dado un docente de nivel 10
      const { caso } = await casoProponer({ rol: 'docente', usuarioId: DOCENTE, nivel: 10 });

      // Cuando propone un reto
      const accion = caso.ejecutar(entradaReto());

      // Entonces se le deniega el permiso
      await expect(accion).rejects.toBeInstanceOf(PermisoDenegadoError);
    });

    it('[RN-13] la propuesta exige un texto en runasimi', async () => {
      // Dado un estudiante de nivel 7
      const { caso } = await casoProponer({
        rol: 'estudiante',
        usuarioId: ESTUDIANTE,
        nivel: 7
      });

      // Cuando propone un reto sin texto
      const accion = caso.ejecutar(entradaReto({ textoQuechua: '   ' }));

      // Entonces falla la validación del agregado
      await expect(accion).rejects.toBeInstanceOf(ValidacionError);
      await expect(accion).rejects.toMatchObject({ campo: 'textoQuechua' });
    });
  });

  describe('ModerarRetoUseCase', () => {
    it('[RN-13] una sola aprobación no publica el reto', async () => {
      // Dado un reto pendiente y una docente
      const retos = await repositorioConRetos(unReto());
      const caso = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );

      // Cuando aprueba el reto
      const dto = await caso.ejecutar({ retoId: 'reto-1', decision: 'aprobado' });

      // Entonces el reto sigue pendiente con una aprobación registrada
      expect(dto.estado).toBe('pendiente');
      expect(dto.aprobaciones).toBe(1);
      expect(dto.votadoPorMi).toBe(true);
    });

    it('[RN-13] dos aprobaciones de docentes distintos publican el reto', async () => {
      // Dado un reto pendiente y dos docentes distintos
      const retos = await repositorioConRetos(unReto());
      const primeraDocente = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );
      const segundaDocente = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE_B }),
        new RelojFijo()
      );

      // Cuando ambas lo aprueban
      const primera = await primeraDocente.ejecutar({
        retoId: 'reto-1',
        decision: 'aprobado'
      });
      const segunda = await segundaDocente.ejecutar({
        retoId: 'reto-1',
        decision: 'aprobado'
      });

      // Entonces la segunda aprobación lo publica
      expect(primera.estado).toBe('pendiente');
      expect(segunda.estado).toBe('aprobado');
      expect(segunda.aprobaciones).toBe(2);
    });

    it('[RN-13] un rechazo cierra el reto como rechazado', async () => {
      // Dado un reto pendiente
      const retos = await repositorioConRetos(unReto());
      const caso = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );

      // Cuando una docente lo rechaza
      const dto = await caso.ejecutar({ retoId: 'reto-1', decision: 'rechazado' });

      // Entonces el reto queda rechazado con su voto en la bitácora
      expect(dto.estado).toBe('rechazado');
      expect(dto.moderaciones).toHaveLength(1);
    });

    it('[RN-13] una o un docente no puede votar dos veces el mismo reto', async () => {
      // Dado un reto ya moderado por esta docente
      const retos = await repositorioConRetos(unReto());
      const caso = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );
      await caso.ejecutar({ retoId: 'reto-1', decision: 'aprobado' });

      // Cuando intenta votar de nuevo
      const accion = caso.ejecutar({ retoId: 'reto-1', decision: 'aprobado' });

      // Entonces el agregado lo rechaza por conflicto de estado
      await expect(accion).rejects.toBeInstanceOf(ConflictoEstadoError);
    });

    it('[RN-13] nadie modera su propio reto', async () => {
      // Dado un reto cuyo autor es la propia docente que intenta moderarlo
      const retos = await repositorioConRetos(unReto({ autorId: DOCENTE }));
      const caso = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );

      // Cuando intenta aprobarlo
      const accion = caso.ejecutar({ retoId: 'reto-1', decision: 'aprobado' });

      // Entonces se le deniega el permiso
      await expect(accion).rejects.toBeInstanceOf(PermisoDenegadoError);
    });

    it('[RN-13] una o un estudiante no puede moderar retos', async () => {
      // Dado un reto pendiente y una sesión de estudiante
      const retos = await repositorioConRetos(unReto());
      const caso = new ModerarRetoUseCase(
        retos,
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE }),
        new RelojFijo()
      );

      // Cuando intenta aprobarlo
      const accion = caso.ejecutar({ retoId: 'reto-1', decision: 'aprobado' });

      // Entonces se le deniega el permiso
      await expect(accion).rejects.toBeInstanceOf(PermisoDenegadoError);
    });

    it('[RN-13] moderar un reto inexistente informa que no se encontró', async () => {
      // Dado un repositorio de retos vacío
      const caso = new ModerarRetoUseCase(
        new RetoMemoriaRepository(),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }),
        new RelojFijo()
      );

      // Cuando intenta moderar un reto que no existe
      const accion = caso.ejecutar({ retoId: 'reto-fantasma', decision: 'aprobado' });

      // Entonces se informa que no existe
      await expect(accion).rejects.toBeInstanceOf(NoEncontradoError);
    });
  });

  describe('ListarRetosUseCase', () => {
    /** Reto ya publicado: dos docentes distintos lo aprobaron. */
    const retoAprobado = unReto({
      id: 'reto-aprobado',
      estado: 'aprobado',
      moderaciones: [
        { docenteId: DOCENTE, decision: 'aprobado', fecha: '2026-03-16' },
        { docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' }
      ]
    });

    it('[RF-007] una o un estudiante sólo recibe los retos aprobados', async () => {
      // Dado un corpus con un reto pendiente y otro aprobado
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(unReto(), retoAprobado),
        await conProgreso(progresoDe(ESTUDIANTE, 7)),
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE })
      );

      // Cuando el estudiante lista los retos
      const lista = await caso.ejecutar();

      // Entonces sólo ve el publicado
      expect(lista.retos.map((reto) => reto.id)).toEqual(['reto-aprobado']);
      expect(lista.retos.every((reto) => reto.estado === 'aprobado')).toBe(true);
    });

    it('[RF-007] una o un docente recibe también los retos pendientes de moderar', async () => {
      // Dado un corpus con un reto pendiente y otro aprobado
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(unReto(), retoAprobado),
        await conProgreso(progresoDe(DOCENTE, 1)),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando la docente lista los retos
      const lista = await caso.ejecutar();

      // Entonces recibe los dos, incluido el pendiente
      expect(lista.retos).toHaveLength(2);
      expect(lista.retos.some((reto) => reto.estado === 'pendiente')).toBe(true);
    });

    it('[RN-13] el permiso explica que un estudiante de nivel 6 no puede proponer', async () => {
      // Dado un estudiante de nivel 6
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(),
        await conProgreso(progresoDe(ESTUDIANTE, 6)),
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE })
      );

      // Cuando consulta el listado
      const lista = await caso.ejecutar();

      // Entonces el permiso lo indica con el nivel requerido y un motivo en español
      expect(lista.permiso.puedeProponer).toBe(false);
      expect(lista.permiso.nivelActual).toBe(6);
      expect(lista.permiso.nivelRequerido).toBe(RetoComunitario.NIVEL_MINIMO_PROPONER);
      expect(lista.permiso.motivo.length).toBeGreaterThan(0);
    });

    it('[RN-13] el permiso habilita la propuesta al estudiante de nivel 7', async () => {
      // Dado un estudiante de nivel 7
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(),
        await conProgreso(progresoDe(ESTUDIANTE, 7)),
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE })
      );

      // Cuando consulta el listado
      const lista = await caso.ejecutar();

      // Entonces puede proponer retos
      expect(lista.permiso.puedeProponer).toBe(true);
      expect(lista.permiso.nivelRequerido).toBe(7);
    });

    it('[RN-13] una o un docente nunca puede proponer retos', async () => {
      // Dado un docente de nivel 10
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(),
        await conProgreso(progresoDe(DOCENTE, 10)),
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE })
      );

      // Cuando consulta el listado
      const lista = await caso.ejecutar();

      // Entonces el permiso queda deshabilitado con su motivo
      expect(lista.permiso.puedeProponer).toBe(false);
      expect(lista.permiso.motivo).toContain('estudiantes');
    });

    it('[RF-007] el DTO marca la autoría y el voto previo de quien consulta', async () => {
      // Dado un reto publicado que escribió la propia estudiante que consulta
      const caso = new ListarRetosUseCase(
        await repositorioConRetos(retoAprobado),
        await conProgreso(progresoDe(ESTUDIANTE, 7)),
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE })
      );

      // Cuando lo lista
      const lista = await caso.ejecutar();

      // Entonces se reconoce como suyo y sin voto propio
      const [reto] = lista.retos;
      expect(reto?.esMiAutoría).toBe(true);
      expect(reto?.votadoPorMi).toBe(false);
    });
  });
});
