import { describe, expect, it } from 'vitest';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { NivelId } from '@domain/value-objects';
import {
  CLAVES_ANTIGUAS,
  CLAVES_NUEVAS,
  CLAVE_MIGRACION,
  LocalStorageEvaluacionRepository,
  LocalStorageOracionRepository,
  LocalStorageProgresoRepository,
  LocalStorageRetoRepository,
  migrarClavesAntiguas
} from '@infrastructure/persistence/local-storage';
import { RelojFijo } from '../../helpers/index';

/**
 * [RN-15] / [RNF-005] Migración desde las claves antiguas `yapu_*` (ADR-002).
 *
 * Las formas antiguas se copian LITERALMENTE de `src/lib/storage/local-repository.ts` y de
 * `src/types/domain.ts` (snake_case, sin versión) para que la prueba falle si alguien cambia la
 * migración sin cambiar el origen. `tests/helpers/setup.ts` limpia `localStorage` entre pruebas.
 */

/** Perfil tal cual lo escribía `LocalRepository.saveProfile` (`PerfilEstudiante`). */
const PERFIL_ANTIGUO = {
  id_estudiante: 'est_antiguo',
  nivel_actual: 4,
  racha_dias: 3,
  total_palabras_aprendidas: 2,
  fecha_ultima_sesion: '2026-03-15T09:00:00.000Z',
  puntos_experiencia: 120
};

/** `Record<idPalabra, VocabularioEstudiante>` tal cual lo escribía `markWordStatus`. */
const VOCABULARIO_ANTIGUO = {
  voc_2_1: {
    id_registro: 'reg_voc_2_1',
    id_estudiante: 'est_antiguo',
    id_palabra: 'voc_2_1',
    estado_aprendizaje: 'aprendido',
    contador_aciertos: 2,
    fecha_ultimo_repaso: '2026-03-14T18:30:00.000Z'
  },
  voc_2_2: {
    id_registro: 'reg_voc_2_2',
    id_estudiante: 'est_antiguo',
    id_palabra: 'voc_2_2',
    estado_aprendizaje: 'repasar',
    contador_aciertos: 1,
    fecha_ultimo_repaso: '2026-03-13T10:00:00.000Z'
  }
};

/** Evaluación en la forma antigua (`Evaluacion` de `src/types/domain.ts`). */
function evaluacionAntigua(id: string, sincronizada: boolean): Record<string, unknown> {
  return {
    id_evaluacion: id,
    id_estudiante: 'est_antiguo',
    id_nivel: 4,
    puntuacion_obtenida: 90,
    total_aciertos: 9,
    total_preguntas: 10,
    estado_aprobacion: 'aprobado',
    fecha_evaluacion: '2026-03-15T09:00:00.000Z',
    sincronizado_nube: sincronizada
  };
}

/** Historial: dos evaluaciones, la segunda ya sincronizada. */
const HISTORIAL_ANTIGUO = [evaluacionAntigua('eval_1', false), evaluacionAntigua('eval_2', true)];

/** Cola offline: repite la evaluación sincronizada y añade una tercera (RF-009). */
const COLA_ANTIGUA = [evaluacionAntigua('eval_2', true), evaluacionAntigua('eval_3', false)];

/** Oraciones del docente en la forma antigua (`OracionBase`, sin fecha de creación). */
const ORACIONES_ANTIGUAS = [
  {
    id_oracion: 'ora_doc_1',
    id_nivel: 4,
    texto_quechua: "Mamayqa sumaq mut'ita wayk'un.",
    traduccion_espanol: 'Mi madre cocina un mote delicioso.',
    palabra_clave_id: 'voc_2_1',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El rol de la madre en la preparación del alimento familiar.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_doc_2',
    id_nivel: 1,
    texto_quechua: 'Allianllachu masiy kachkanki?',
    traduccion_espanol: '¿Cómo estás, amigo mío?',
    palabra_clave_id: 'voc_1_1',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Saludo respetuoso entre compañeros.',
    autor_id: 'docente_quispe_01',
    estado_moderacion: 'pendiente'
  }
];

/** Retos comunitarios en la forma antigua (`RetoComunitario`, sin bitácora). */
const RETOS_ANTIGUOS = [
  {
    id_reto: 'reto_1',
    id_estudiante: 'est_maria',
    nombre_estudiante: 'María Condori',
    texto_quechua: "Munakuywan wayk'usqa mikhunaqa allin sumaqmi.",
    traduccion_sugerida: 'La comida cocinada con amor es sumamente buena.',
    pista_cultural: 'Cultura culinaria andina y la intención del cocinero.',
    nivel_sugerido: 6,
    estado_reto: 'aprobado',
    fecha_creacion: '2026-09-18'
  },
  {
    id_reto: 'reto_2',
    id_estudiante: 'est_carlos',
    nombre_estudiante: 'Carlos Mamani',
    texto_quechua: "Ch'askakunaqa ñankunata tutapi k'ancharichinku.",
    traduccion_sugerida: 'Las estrellas iluminan los caminos durante la noche.',
    pista_cultural: 'Astronomía andina de los pastores.',
    nivel_sugerido: 10,
    estado_reto: 'aprobado',
    fecha_creacion: '2026-09-19'
  }
];

type ClavesAntiguasEscritas = Partial<Record<keyof typeof CLAVES_ANTIGUAS, unknown>>;

/** Escribe las claves antiguas: los textos se guardan en crudo (para simular JSON corrupto). */
function escribirClavesAntiguas(claves: ClavesAntiguasEscritas): void {
  for (const [nombre, valor] of Object.entries(claves)) {
    const clave = CLAVES_ANTIGUAS[nombre as keyof typeof CLAVES_ANTIGUAS];
    localStorage.setItem(clave, typeof valor === 'string' ? valor : JSON.stringify(valor));
  }
}

/** Las seis claves antiguas con contenido válido: 8 agregados migrables en total. */
function escribirTodasLasClavesAntiguas(): void {
  escribirClavesAntiguas({
    perfilEstudiante: PERFIL_ANTIGUO,
    progresoVocabulario: VOCABULARIO_ANTIGUO,
    historialEvaluaciones: HISTORIAL_ANTIGUO,
    colaSincronizacion: COLA_ANTIGUA,
    oracionesDocente: ORACIONES_ANTIGUAS,
    retosComunitarios: RETOS_ANTIGUOS
  });
}

/** Agregados esperados: 1 progreso + 3 evaluaciones + 2 oraciones + 2 retos. */
const AGREGADOS_MIGRABLES = 8;

describe('[RN-15] Migración de las claves antiguas al formato versionado', () => {
  it('[RN-15] migra el perfil antiguo con nivel, racha, XP y fecha de última actividad', async () => {
    // Dado un perfil guardado por el repositorio anterior
    escribirClavesAntiguas({ perfilEstudiante: PERFIL_ANTIGUO });

    // Cuando se ejecuta la migración
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces el progreso nuevo reproduce el perfil (RN-07)
    expect(migrados).toBe(1);
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso).not.toBeNull();
    expect(progreso?.estudianteId).toBe('est_antiguo');
    expect(progreso?.nivelActual.valor).toBe(4);
    expect(progreso?.rachaDias).toBe(3);
    expect(progreso?.xp).toBe(120);
    expect(progreso?.fechaUltimaActividad?.toJSON()).toBe('2026-03-15');
    expect(progreso?.nivelesAprobados).toEqual([1, 2, 3]);
    expect(progreso?.cursoCompletado).toBe(false);
    expect(progreso?.palabrasAprendidas).toBe(0);
  });

  it('[RN-15] marca el curso como completado si el perfil antiguo estaba en el nivel 10', async () => {
    // Dado un perfil en el último nivel
    escribirClavesAntiguas({ perfilEstudiante: { ...PERFIL_ANTIGUO, nivel_actual: 10 } });

    // Cuando se migra
    migrarClavesAntiguas(localStorage);

    // Entonces el curso queda completado con los nueve niveles previos aprobados (RN-02, RN-03)
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso?.nivelActual.valor).toBe(NivelId.ULTIMO);
    expect(progreso?.cursoCompletado).toBe(true);
    expect(progreso?.nivelesAprobados).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('[RN-15] conserva las palabras del vocabulario antiguo dentro del progreso', async () => {
    // Dado un perfil y su vocabulario
    escribirClavesAntiguas({
      perfilEstudiante: PERFIL_ANTIGUO,
      progresoVocabulario: VOCABULARIO_ANTIGUO
    });

    // Cuando se migra
    migrarClavesAntiguas(localStorage);

    // Entonces los registros de palabras llegan al agregado nuevo (RN-08)
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso?.palabrasAprendidas).toBe(1);
    expect(progreso?.obtenerRegistro('voc_2_1')).toEqual({
      palabraId: 'voc_2_1',
      estado: 'aprendido',
      contadorAciertos: 2,
      fechaUltimoRepaso: '2026-03-14'
    });
    expect(progreso?.obtenerRegistro('voc_2_2')).toEqual({
      palabraId: 'voc_2_2',
      estado: 'repasar',
      contadorAciertos: 1,
      fechaUltimoRepaso: '2026-03-13'
    });
  });

  it('[RN-15] migra el vocabulario aunque no exista el perfil', async () => {
    // Dado un vocabulario huérfano (sin `yapu_student_profile`)
    escribirClavesAntiguas({ progresoVocabulario: VOCABULARIO_ANTIGUO });

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces el progreso toma el estudiante del propio registro de vocabulario
    expect(migrados).toBe(1);
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso?.estudianteId).toBe('est_antiguo');
    expect(progreso?.palabrasAprendidas).toBe(1);
  });

  it('[RN-15] unifica el historial y la cola offline sin duplicados', async () => {
    // Dado un historial y una cola offline que repiten una evaluación
    escribirClavesAntiguas({
      historialEvaluaciones: HISTORIAL_ANTIGUO,
      colaSincronizacion: COLA_ANTIGUA
    });

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces quedan las tres evaluaciones únicas, con su estado de sincronización
    expect(migrados).toBe(3);
    const evaluaciones = new LocalStorageEvaluacionRepository();
    expect((await evaluaciones.listarPorEstudiante('est_antiguo')).map((e) => e.id)).toEqual([
      'eval_1',
      'eval_2',
      'eval_3'
    ]);
    expect((await evaluaciones.listarPendientes()).map((e) => e.id)).toEqual(['eval_1', 'eval_3']);
    const sincronizada = await evaluaciones.obtener('eval_2');
    expect(sincronizada?.sincronizada).toBe(true);
    const aprobada = await evaluaciones.obtener('eval_1');
    expect(aprobada?.puntuacion.valor).toBe(90);
    expect(aprobada?.aprobado).toBe(true);
    expect(aprobada?.aciertos).toBe(9);
  });

  it('[RN-15] migra las seis claves y devuelve el número de agregados', async () => {
    // Dadas las seis claves antiguas
    escribirTodasLasClavesAntiguas();

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces se cuentan los agregados y queda el marcador de migración
    expect(migrados).toBe(AGREGADOS_MIGRABLES);
    expect(localStorage.getItem(CLAVE_MIGRACION)).toBe('1');
    expect(await new LocalStorageProgresoRepository().obtener('est_antiguo')).not.toBeNull();
    expect(await new LocalStorageEvaluacionRepository().obtener('eval_1')).not.toBeNull();
    expect(await new LocalStorageOracionRepository().listar()).toHaveLength(2);
    expect(await new LocalStorageRetoRepository().listar()).toHaveLength(2);
  });

  it('[RN-15] es idempotente: la segunda ejecución no migra nada', async () => {
    // Dadas las seis claves antiguas
    escribirTodasLasClavesAntiguas();
    const primera = migrarClavesAntiguas(localStorage);

    // Cuando se vuelve a migrar
    const segunda = migrarClavesAntiguas(localStorage);
    const tercera = migrarClavesAntiguas(localStorage);

    // Entonces no se vuelve a migrar y los datos siguen disponibles
    expect(primera).toBe(AGREGADOS_MIGRABLES);
    expect(segunda).toBe(0);
    expect(tercera).toBe(0);
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso?.xp).toBe(120);
    expect(progreso?.palabrasAprendidas).toBe(1);
  });
});

describe('[RNF-005] Migración tolerante y no destructiva', () => {
  it('[RNF-005] migra las oraciones del docente al formato nuevo', async () => {
    // Dadas dos oraciones registradas por docentes (una aprobada y una pendiente)
    escribirClavesAntiguas({ oracionesDocente: ORACIONES_ANTIGUAS });

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces las oraciones quedan en el formato nuevo (RF-006), con fecha de alta
    expect(migrados).toBe(2);
    const listado = await new LocalStorageOracionRepository().listar();
    expect(listado.map((oracion) => oracion.id)).toEqual(['ora_doc_1', 'ora_doc_2']);

    const aprobada = listado[0];
    expect(aprobada?.nivelId.valor).toBe(4);
    expect(aprobada?.textoQuechua).toBe("Mamayqa sumaq mut'ita wayk'un.");
    expect(aprobada?.traduccionEspanol).toBe('Mi madre cocina un mote delicioso.');
    expect(aprobada?.palabraClaveId).toBe('voc_2_1');
    expect(aprobada?.categoria).toBe('sustantivo');
    expect(aprobada?.contextoCultural).toBe(
      'El rol de la madre en la preparación del alimento familiar.'
    );
    expect(aprobada?.autorId).toBe('docente_quispe_01');
    expect(aprobada?.estado).toBe('aprobado');
    expect(aprobada?.fechaCreacion.toJSON()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const pendiente = listado[1];
    expect(pendiente?.estado).toBe('pendiente');
    expect(pendiente?.categoria).toBe('saludo');
    expect(pendiente?.nivelId.valor).toBe(1);
  });

  it('[RNF-005] migra los retos comunitarios con la bitácora vacía', async () => {
    // Dados dos retos aprobados en la forma antigua
    escribirClavesAntiguas({ retosComunitarios: RETOS_ANTIGUOS });

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces conservan autor, textos y fecha, y quedan sin bitácora (RF-007)
    expect(migrados).toBe(2);
    const retos = new LocalStorageRetoRepository();
    const reto = await retos.obtener('reto_1');
    expect(reto?.autorId).toBe('est_maria');
    expect(reto?.nombreAutor).toBe('María Condori');
    expect(reto?.textoQuechua).toBe("Munakuywan wayk'usqa mikhunaqa allin sumaqmi.");
    expect(reto?.traduccionSugerida).toBe('La comida cocinada con amor es sumamente buena.');
    expect(reto?.pistaCultural).toBe('Cultura culinaria andina y la intención del cocinero.');
    expect(reto?.nivelSugerido.valor).toBe(6);
    expect(reto?.estado).toBe('aprobado');
    expect(reto?.fechaCreacion.toJSON()).toBe('2026-09-18');
    expect(reto?.moderaciones).toEqual([]);
    expect((await retos.listar()).map((comunitario) => comunitario.id)).toEqual([
      'reto_2',
      'reto_1'
    ]);
  });

  it('[RNF-005] no sobrescribe una clave nueva que ya tiene contenido', async () => {
    // Dado un progreso y una evaluación YA migrados (claves nuevas con datos)
    const reloj = new RelojFijo();
    const progresoNuevo = ProgresoEstudiante.nuevo('est_antiguo');
    progresoNuevo.marcarPalabra('voc_9_9', 'aprendido', reloj.diaActual);
    localStorage.setItem(
      CLAVES_NUEVAS.progreso,
      JSON.stringify({ est_antiguo: progresoNuevo.toJSON() })
    );
    localStorage.setItem(
      CLAVES_NUEVAS.evaluaciones,
      JSON.stringify([
        {
          id: 'eval_nueva',
          estudianteId: 'est_antiguo',
          nivelId: 4,
          puntuacion: 70,
          aciertos: 7,
          totalPreguntas: 10,
          aprobado: true,
          fecha: '2026-03-16',
          sincronizada: false
        }
      ])
    );
    // Y con las claves antiguas todavía presentes
    escribirClavesAntiguas({
      perfilEstudiante: PERFIL_ANTIGUO,
      historialEvaluaciones: HISTORIAL_ANTIGUO
    });

    // Cuando se migra
    const migrados = migrarClavesAntiguas(localStorage);

    // Entonces no se toca nada de lo nuevo
    expect(migrados).toBe(0);
    const progreso = await new LocalStorageProgresoRepository().obtener('est_antiguo');
    expect(progreso?.xp).toBe(2);
    expect(progreso?.nivelActual.valor).toBe(1);
    expect(progreso?.palabrasAprendidas).toBe(1);
    const evaluaciones = new LocalStorageEvaluacionRepository();
    expect((await evaluaciones.listarPendientes()).map((e) => e.id)).toEqual(['eval_nueva']);
    expect(await evaluaciones.obtener('eval_1')).toBeNull();
  });

  it('[RNF-005] tolera claves antiguas con JSON corrupto sin lanzar', () => {
    // Dado un almacén con basura en todas las claves antiguas
    localStorage.setItem(CLAVES_ANTIGUAS.perfilEstudiante, '{no-es-json');
    localStorage.setItem(CLAVES_ANTIGUAS.progresoVocabulario, '"texto"');
    localStorage.setItem(CLAVES_ANTIGUAS.historialEvaluaciones, '{"no":"es-un-array"}');
    localStorage.setItem(CLAVES_ANTIGUAS.colaSincronizacion, '7');
    localStorage.setItem(CLAVES_ANTIGUAS.oracionesDocente, '[1, 2, 3]');
    localStorage.setItem(CLAVES_ANTIGUAS.retosComunitarios, '');

    // Cuando se migra
    let migrados = -1;
    expect(() => {
      migrados = migrarClavesAntiguas(localStorage);
    }).not.toThrow();

    // Entonces no se migra nada y no se crean claves nuevas vacías
    expect(migrados).toBe(0);
    expect(localStorage.getItem(CLAVES_NUEVAS.progreso)).toBeNull();
    expect(localStorage.getItem(CLAVES_NUEVAS.evaluaciones)).toBeNull();
    expect(localStorage.getItem(CLAVES_NUEVAS.oraciones)).toBeNull();
    expect(localStorage.getItem(CLAVES_NUEVAS.retos)).toBeNull();
  });

  it('[RNF-005] limpia una clave nueva corrupta y devuelve el respaldo', async () => {
    // Dada una clave nueva con JSON corrupto y otra con forma inválida
    localStorage.setItem(CLAVES_NUEVAS.progreso, '{corrupto');
    localStorage.setItem(CLAVES_NUEVAS.evaluaciones, JSON.stringify([{ id: 'eval_1' }]));

    // Cuando se leen
    const progreso = await new LocalStorageProgresoRepository().obtener('est_1');
    const pendientes = await new LocalStorageEvaluacionRepository().listarPendientes();

    // Entonces se devuelve el respaldo y la clave dañada se elimina
    expect(progreso).toBeNull();
    expect(pendientes).toEqual([]);
    expect(localStorage.getItem(CLAVES_NUEVAS.progreso)).toBeNull();
    expect(localStorage.getItem(CLAVES_NUEVAS.evaluaciones)).toBeNull();
  });
});
