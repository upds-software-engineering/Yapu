import { describe, expect, it } from 'vitest';
import type {
  EvaluacionRepository,
  OracionRepository,
  ProgresoRepository,
  RetoRepository
} from '@application/ports';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { OracionBase } from '@domain/contenido/OracionBase';
import { RetoComunitario } from '@domain/contenido/RetoComunitario';
import { Evaluacion } from '@domain/evaluacion/Evaluacion';
import type { EstadoModeracion } from '@domain/shared/tipos';
import { NivelId, Puntuacion } from '@domain/value-objects';
import { RelojFijo } from '../helpers/index';

/**
 * [RNF-005] Suite de contrato COMPARTIDA por los adaptadores de persistencia.
 *
 * El mismo contrato se ejecuta contra los repositorios en memoria (`tests/contract/memory`) y
 * contra los de `localStorage` (`tests/contract/local-storage`). Si un adaptador se desvía, la
 * suite falla: es la garantía de que la infraestructura es intercambiable (arquitectura
 * hexagonal) y de que la persistencia no cambia el comportamiento del dominio.
 *
 * Nota sobre `crear()`: se invoca dos veces en la prueba de oraciones. Para el adaptador en
 * memoria devuelve el mismo objeto (el estado vive en la instancia), y para el de `localStorage`
 * devuelve instancias nuevas que comparten el almacén del navegador: en ambos casos, lo
 * guardado por la primera construcción lo ve la segunda.
 */

export interface RepositoriosDePrueba {
  progreso: ProgresoRepository;
  evaluaciones: EvaluacionRepository;
  oraciones: OracionRepository;
  retos: RetoRepository;
}

export type FabricaDeRepositorios = () => Promise<RepositoriosDePrueba>;

/** IDs del corpus sembrado, en el orden en que el repositorio debe devolverlo. */
export const IDS_SEMILLA = ['ora_sem_4_1', 'ora_sem_4_2', 'ora_sem_5_1'];

/** IDs del corpus sembrado del nivel 4, en orden. */
export const IDS_SEMILLA_NIVEL_4 = ['ora_sem_4_1', 'ora_sem_4_2'];

/** Autor de la oración que registra el docente durante la suite. */
export const AUTOR_DOCENTE = 'docente_1';

/** Orden de inserción esperado de las evaluaciones de prueba. */
const EVALUACIONES_FIFO = ['eval_1', 'eval_2', 'eval_3'];

function oracionDePrueba(datos: {
  id: string;
  nivelId: number;
  estado: EstadoModeracion;
  autorId?: string;
}): OracionBase {
  return OracionBase.reconstruir({
    id: datos.id,
    nivelId: datos.nivelId,
    textoQuechua: `Rimay ${datos.id}`,
    traduccionEspanol: `Habla ${datos.id}`,
    palabraClaveId: `voc_${datos.nivelId}_1`,
    categoria: 'sustantivo',
    contextoCultural: 'Corpus de prueba de la suite de contrato.',
    autorId: datos.autorId ?? 'docente_semilla',
    estado: datos.estado,
    fechaCreacion: '2026-01-05'
  });
}

/** Corpus mínimo compartido: dos niveles y dos estados de moderación. */
export function corpusDePrueba(): OracionBase[] {
  return [
    oracionDePrueba({ id: 'ora_sem_4_1', nivelId: 4, estado: 'aprobado' }),
    oracionDePrueba({ id: 'ora_sem_4_2', nivelId: 4, estado: 'pendiente' }),
    oracionDePrueba({ id: 'ora_sem_5_1', nivelId: 5, estado: 'aprobado' })
  ];
}

/** Oración aprobada del nivel 4 que aporta el docente durante la prueba. */
export function oracionDelDocente(): OracionBase {
  return oracionDePrueba({
    id: 'ora_doc_1',
    nivelId: 4,
    estado: 'aprobado',
    autorId: AUTOR_DOCENTE
  });
}

/** Falla con un mensaje claro y estrecha el tipo: evita aserciones no nulas en las pruebas. */
function exigirNoNulo<T>(valor: T | null): T {
  if (valor === null) {
    throw new Error('La persistencia debía devolver un agregado y devolvió null.');
  }
  return valor;
}

/** Agregado con actividad real: dos palabras aprendidas y el nivel 1 aprobado (RN-05, RN-06). */
function progresoConActividad(estudianteId: string, reloj: RelojFijo): ProgresoEstudiante {
  const progreso = ProgresoEstudiante.nuevo(estudianteId);
  progreso.marcarPalabra('voc_1_1', 'aprendido', reloj.diaActual);
  reloj.avanzarDias(1);
  progreso.marcarPalabra('voc_1_2', 'aprendido', reloj.diaActual);
  reloj.avanzarDias(1);
  progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, reloj.diaActual);
  return progreso;
}

function evaluacionDePrueba(datos: {
  id: string;
  estudianteId: string;
  puntuacion: number;
  aciertos: number;
  fechaIso: string;
}): Evaluacion {
  return Evaluacion.registrar({
    id: datos.id,
    estudianteId: datos.estudianteId,
    nivel: NivelId.crear(1),
    puntuacion: Puntuacion.crear(datos.puntuacion),
    aciertos: datos.aciertos,
    totalPreguntas: 10,
    fechaIso: datos.fechaIso
  });
}

/** Las tres primeras evaluaciones de la suite, en orden de inserción (FIFO). */
function evaluacionesDePrueba(reloj: RelojFijo): Evaluacion[] {
  return EVALUACIONES_FIFO.map((id, indice) => {
    const fechaIso = reloj.ahora().toISOString();
    if (indice < EVALUACIONES_FIFO.length - 1) reloj.avanzarDias(1);
    return evaluacionDePrueba({
      id,
      estudianteId: 'est_1',
      puntuacion: 90,
      aciertos: 9,
      fechaIso
    });
  });
}

function retoDePrueba(id: string, fechaCreacion: string): RetoComunitario {
  return RetoComunitario.proponer(
    {
      id,
      autorId: 'est_avanzado',
      nombreAutor: 'Estudiante Avanzado',
      textoQuechua: `Pukllay ${id}`,
      traduccionSugerida: `Juego ${id}`,
      pistaCultural: 'Juegos comunitarios andinos.',
      nivelSugerido: 8,
      fechaCreacion
    },
    { rol: 'estudiante', nivelActual: RetoComunitario.NIVEL_MINIMO_PROPONER }
  );
}

export function suiteDeContrato(nombre: string, crear: FabricaDeRepositorios): void {
  describe('[RNF-005] Contrato de repositorios', () => {
    describe(nombre, () => {
      describe('Progreso', () => {
        it('[RNF-005] Progreso: obtener de un estudiante inexistente devuelve null', async () => {
          // Dado un repositorio sin datos
          const { progreso } = await crear();

          // Cuando se pide un estudiante que no existe
          const encontrado = await progreso.obtener('estudiante_fantasma');

          // Entonces no hay progreso
          expect(encontrado).toBeNull();
        });

        it('[RNF-005] Progreso: guardar y volver a leer reconstruye el agregado', async () => {
          // Dado un progreso con XP, racha, nivel aprobado y palabras aprendidas
          const { progreso } = await crear();
          const original = progresoConActividad('est_1', new RelojFijo());

          // Cuando se guarda y se vuelve a leer
          await progreso.guardar(original);
          const leido = exigirNoNulo(await progreso.obtener('est_1'));

          // Entonces el agregado rehidratado es equivalente al original
          expect(leido.xp).toBe(original.xp);
          expect(leido.xp).toBeGreaterThan(0);
          expect(leido.rachaDias).toBe(original.rachaDias);
          expect(leido.rachaDias).toBeGreaterThan(0);
          expect(leido.nivelActual.valor).toBe(original.nivelActual.valor);
          expect(leido.nivelActual.valor).toBe(2);
          expect(leido.nivelesAprobados).toEqual([...original.nivelesAprobados]);
          expect(leido.nivelesAprobados).toEqual([1]);
          expect(leido.palabrasAprendidas).toBe(original.palabrasAprendidas);
          expect(leido.palabrasAprendidas).toBe(2);
          expect(leido.fechaUltimaActividad?.toJSON()).toBe(
            original.fechaUltimaActividad?.toJSON()
          );
        });

        it('[RNF-005] Progreso: dos estudiantes no se mezclan', async () => {
          // Dado un estudiante con actividad y otro recién creado
          const { progreso } = await crear();
          await progreso.guardar(progresoConActividad('est_1', new RelojFijo()));
          await progreso.guardar(ProgresoEstudiante.nuevo('est_2'));

          // Cuando se leen ambos
          const leidoPrimero = exigirNoNulo(await progreso.obtener('est_1'));
          const leidoSegundo = exigirNoNulo(await progreso.obtener('est_2'));

          // Entonces cada uno conserva su propio estado
          expect(leidoPrimero.estudianteId).toBe('est_1');
          expect(leidoPrimero.palabrasAprendidas).toBe(2);
          expect(leidoSegundo.estudianteId).toBe('est_2');
          expect(leidoSegundo.palabrasAprendidas).toBe(0);
          expect(leidoSegundo.xp).toBe(0);
          expect(leidoSegundo.nivelActual.valor).toBe(1);
          expect(leidoSegundo.rachaDias).toBe(0);
        });

        it('[RNF-005] Progreso: eliminar borra sólo el progreso indicado', async () => {
          // Dado dos estudiantes guardados
          const { progreso } = await crear();
          await progreso.guardar(progresoConActividad('est_1', new RelojFijo()));
          await progreso.guardar(ProgresoEstudiante.nuevo('est_2'));

          // Cuando se elimina el primero
          await progreso.eliminar('est_1');

          // Entonces desaparece y el otro sigue intacto
          expect(await progreso.obtener('est_1')).toBeNull();
          expect(exigirNoNulo(await progreso.obtener('est_2')).estudianteId).toBe('est_2');
        });
      });

      describe('Evaluaciones', () => {
        it('[RNF-005] Evaluaciones: listarPendientes respeta el orden FIFO de inserción', async () => {
          // Dado un historial de tres evaluaciones sin sincronizar (RN-15)
          const { evaluaciones } = await crear();
          const reloj = new RelojFijo();
          for (const evaluacion of evaluacionesDePrueba(reloj)) {
            await evaluaciones.guardar(evaluacion);
          }

          // Cuando se consulta la cola de pendientes
          const pendientes = await evaluaciones.listarPendientes();

          // Entonces salen en el mismo orden en que se guardaron
          expect(pendientes.map((evaluacion) => evaluacion.id)).toEqual(EVALUACIONES_FIFO);
          expect(pendientes.every((evaluacion) => !evaluacion.sincronizada)).toBe(true);

          // Y una evaluación nueva se añade al final, no al principio
          reloj.avanzarDias(1);
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_4',
              estudianteId: 'est_1',
              puntuacion: 80,
              aciertos: 8,
              fechaIso: reloj.ahora().toISOString()
            })
          );
          expect((await evaluaciones.listarPendientes()).map((evaluacion) => evaluacion.id)).toEqual(
            [...EVALUACIONES_FIFO, 'eval_4']
          );
        });

        it('[RNF-005] Evaluaciones: marcarSincronizada la saca de pendientes y es idempotente', async () => {
          // Dado dos evaluaciones pendientes
          const { evaluaciones } = await crear();
          const reloj = new RelojFijo();
          for (const evaluacion of evaluacionesDePrueba(reloj)) {
            await evaluaciones.guardar(evaluacion);
          }

          // Cuando se marca la primera como sincronizada (dos veces, y una inexistente)
          await evaluaciones.marcarSincronizada('eval_1');
          await evaluaciones.marcarSincronizada('eval_1');
          await evaluaciones.marcarSincronizada('eval_inexistente');

          // Entonces sale de la cola y sigue en el historial marcada como sincronizada
          expect((await evaluaciones.listarPendientes()).map((e) => e.id)).toEqual([
            'eval_2',
            'eval_3'
          ]);
          expect(exigirNoNulo(await evaluaciones.obtener('eval_1')).sincronizada).toBe(true);
          expect((await evaluaciones.listarPorEstudiante('est_1')).map((e) => e.id)).toEqual(
            EVALUACIONES_FIFO
          );
        });

        it('[RNF-005] Evaluaciones: listarPorEstudiante filtra por estudiante', async () => {
          // Dado un historial de dos estudiantes
          const { evaluaciones } = await crear();
          const reloj = new RelojFijo();
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_1',
              estudianteId: 'est_1',
              puntuacion: 90,
              aciertos: 9,
              fechaIso: reloj.ahora().toISOString()
            })
          );
          reloj.avanzarDias(1);
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_2',
              estudianteId: 'est_2',
              puntuacion: 60,
              aciertos: 6,
              fechaIso: reloj.ahora().toISOString()
            })
          );
          reloj.avanzarDias(1);
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_3',
              estudianteId: 'est_1',
              puntuacion: 40,
              aciertos: 4,
              fechaIso: reloj.ahora().toISOString()
            })
          );

          // Cuando se consulta un estudiante
          const delPrimero = await evaluaciones.listarPorEstudiante('est_1');

          // Entonces sólo salen las suyas, en orden de inserción
          expect(delPrimero.map((e) => e.id)).toEqual(['eval_1', 'eval_3']);
          expect((await evaluaciones.listarPorEstudiante('est_2')).map((e) => e.id)).toEqual([
            'eval_2'
          ]);
          expect(await evaluaciones.listarPorEstudiante('est_3')).toEqual([]);
        });

        it('[RNF-005] Evaluaciones: obtener reconstruye la puntuación y la aprobación (RN-04)', async () => {
          // Dado una evaluación aprobada y otra reprobada
          const { evaluaciones } = await crear();
          const reloj = new RelojFijo();
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_aprobada',
              estudianteId: 'est_1',
              puntuacion: 90,
              aciertos: 9,
              fechaIso: reloj.ahora().toISOString()
            })
          );
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_reprobada',
              estudianteId: 'est_1',
              puntuacion: 40,
              aciertos: 4,
              fechaIso: reloj.ahora().toISOString()
            })
          );

          // Cuando se recuperan por id
          const aprobada = exigirNoNulo(await evaluaciones.obtener('eval_aprobada'));
          const reprobada = exigirNoNulo(await evaluaciones.obtener('eval_reprobada'));

          // Entonces la puntuación y la aprobación son las del dominio
          expect(aprobada.puntuacion.valor).toBe(90);
          expect(aprobada.aprobado).toBe(true);
          expect(aprobada.aciertos).toBe(9);
          expect(aprobada.totalPreguntas).toBe(10);
          expect(aprobada.estudianteId).toBe('est_1');
          expect(reprobada.puntuacion.valor).toBe(40);
          expect(reprobada.aprobado).toBe(false);
          expect(await evaluaciones.obtener('eval_fantasma')).toBeNull();
        });
      });

      describe('Oraciones', () => {
        it('[RNF-005] Oraciones: listarAprobadasPorNivel filtra por nivel y por estado', async () => {
          // Dado un corpus con dos niveles y una oración pendiente
          const { oraciones } = await crear();

          // Cuando se consulta por nivel y por aprobadas
          const nivelCuatro = await oraciones.listarPorNivel(4);
          const aprobadasNivelCuatro = await oraciones.listarAprobadasPorNivel(4);
          const aprobadasNivelCinco = await oraciones.listarAprobadasPorNivel(5);

          // Entonces sólo pasan las del nivel y estado pedidos
          expect(nivelCuatro.map((oracion) => oracion.id)).toEqual(IDS_SEMILLA_NIVEL_4);
          expect(aprobadasNivelCuatro.map((oracion) => oracion.id)).toEqual(['ora_sem_4_1']);
          expect(aprobadasNivelCinco.map((oracion) => oracion.id)).toEqual(['ora_sem_5_1']);
          expect(await oraciones.listarAprobadasPorNivel(7)).toEqual([]);
        });

        it('[RNF-005] Oraciones: guardar persiste la del docente y la ve una construcción nueva', async () => {
          // Dado un corpus sembrado y una oración nueva del docente
          const primera = await crear();
          const delDocente = oracionDelDocente();

          // Cuando se guarda la del docente
          await primera.oraciones.guardar(delDocente);

          // Entonces una construcción nueva del repositorio la devuelve,
          // con el corpus sembrado primero y sin duplicados
          const segunda = await crear();
          const listado = await segunda.oraciones.listar();

          expect(listado.map((oracion) => oracion.id)).toEqual([...IDS_SEMILLA, delDocente.id]);
          expect(listado.filter((oracion) => oracion.id === delDocente.id)).toHaveLength(1);
          expect((await segunda.oraciones.listarAprobadasPorNivel(4)).map((o) => o.id)).toEqual([
            'ora_sem_4_1',
            delDocente.id
          ]);

          const persistida = listado.find((oracion) => oracion.id === delDocente.id);
          expect(persistida?.autorId).toBe(AUTOR_DOCENTE);
          expect(persistida?.textoQuechua).toBe(delDocente.textoQuechua);
          expect(persistida?.traduccionEspanol).toBe(delDocente.traduccionEspanol);
          expect(persistida?.palabraClaveId).toBe(delDocente.palabraClaveId);
          expect(persistida?.estado).toBe('aprobado');
        });
      });

      describe('Retos comunitarios', () => {
        it('[RNF-005] Retos: guardar y obtener reconstruye el estado y la bitácora (RN-13)', async () => {
          // Dado un reto con un voto de docente
          const { retos } = await crear();
          const reto = retoDePrueba('reto_1', '2026-03-10');
          reto.moderar({ docenteId: 'doc_1', decision: 'aprobado', fecha: '2026-03-11' });

          // Cuando se guarda y se recupera
          await retos.guardar(reto);
          const trasPrimerVoto = exigirNoNulo(await retos.obtener('reto_1'));

          // Entonces sigue pendiente (la doble moderación exige dos docentes)
          expect(trasPrimerVoto.estado).toBe('pendiente');
          expect(trasPrimerVoto.moderaciones).toHaveLength(1);

          // Y cuando se guarda el segundo voto, queda aprobado con la bitácora completa
          reto.moderar({ docenteId: 'doc_2', decision: 'aprobado', fecha: '2026-03-12' });
          await retos.guardar(reto);
          const publicado = exigirNoNulo(await retos.obtener('reto_1'));

          expect(publicado.estado).toBe('aprobado');
          expect(publicado.aprobaciones).toBe(2);
          expect(publicado.moderaciones.map((moderacion) => moderacion.docenteId)).toEqual([
            'doc_1',
            'doc_2'
          ]);
          expect(publicado.moderaciones.map((moderacion) => moderacion.decision)).toEqual([
            'aprobado',
            'aprobado'
          ]);
          expect(publicado.textoQuechua).toBe(reto.textoQuechua);
          expect(publicado.traduccionSugerida).toBe(reto.traduccionSugerida);
          expect(publicado.pistaCultural).toBe(reto.pistaCultural);
          expect(publicado.nivelSugerido.valor).toBe(8);
          expect(publicado.autorId).toBe(reto.autorId);
          expect(publicado.nombreAutor).toBe(reto.nombreAutor);
        });

        it('[RNF-005] Retos: listar ordena por fecha de creación descendente', async () => {
          // Dado tres retos guardados en orden desordenado
          const { retos } = await crear();
          await retos.guardar(retoDePrueba('reto_antiguo', '2026-03-10'));
          await retos.guardar(retoDePrueba('reto_nuevo', '2026-03-20'));
          await retos.guardar(retoDePrueba('reto_medio', '2026-03-15'));

          // Cuando se listan
          const listado = await retos.listar();

          // Entonces lo más nuevo va primero
          expect(listado.map((reto) => reto.id)).toEqual([
            'reto_nuevo',
            'reto_medio',
            'reto_antiguo'
          ]);
          expect(await retos.obtener('reto_fantasma')).toBeNull();
        });
      });

      describe('Aislamiento', () => {
        it('[RNF-005] Aislamiento: mutar el progreso devuelto no altera lo almacenado', async () => {
          // Dado un progreso guardado
          const { progreso } = await crear();
          const reloj = new RelojFijo();
          await progreso.guardar(progresoConActividad('est_1', reloj));

          const leido = exigirNoNulo(await progreso.obtener('est_1'));
          const palabrasAntes = leido.palabrasAprendidas;
          const xpAntes = leido.xp;

          // Cuando se muta el agregado devuelto
          reloj.avanzarDias(1);
          leido.marcarPalabra('voc_intrusa', 'aprendido', reloj.diaActual);

          // Entonces lo almacenado no cambia
          const releido = exigirNoNulo(await progreso.obtener('est_1'));
          expect(releido.palabrasAprendidas).toBe(palabrasAntes);
          expect(releido.xp).toBe(xpAntes);
          expect(releido.obtenerRegistro('voc_intrusa')).toBeUndefined();
        });

        it('[RNF-005] Aislamiento: mutar la evaluación devuelta no altera lo almacenado', async () => {
          // Dado una evaluación pendiente guardada
          const { evaluaciones } = await crear();
          await evaluaciones.guardar(
            evaluacionDePrueba({
              id: 'eval_1',
              estudianteId: 'est_1',
              puntuacion: 90,
              aciertos: 9,
              fechaIso: '2026-03-15T09:00:00.000Z'
            })
          );

          // Cuando se marca como sincronizada el agregado devuelto (no el repositorio)
          exigirNoNulo(await evaluaciones.obtener('eval_1')).marcarSincronizada();

          // Entonces lo almacenado sigue pendiente
          expect((await evaluaciones.listarPendientes()).map((e) => e.id)).toEqual(['eval_1']);
          expect(exigirNoNulo(await evaluaciones.obtener('eval_1')).sincronizada).toBe(false);
        });

        it('[RNF-005] Aislamiento: mutar el reto devuelto no altera lo almacenado', async () => {
          // Dado un reto pendiente guardado
          const { retos } = await crear();
          await retos.guardar(retoDePrueba('reto_1', '2026-03-10'));

          // Cuando se modera el agregado devuelto (no el repositorio)
          exigirNoNulo(await retos.obtener('reto_1')).moderar({
            docenteId: 'doc_1',
            decision: 'rechazado',
            fecha: '2026-03-11'
          });

          // Entonces lo almacenado sigue pendiente y sin bitácora
          const releido = exigirNoNulo(await retos.obtener('reto_1'));
          expect(releido.estado).toBe('pendiente');
          expect(releido.moderaciones).toHaveLength(0);
        });
      });
    });
  });
}
