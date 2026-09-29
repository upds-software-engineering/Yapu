import type { EstadoNivelDto, EvaluacionResumenDto, NivelDto, PalabraDto } from '@application/dto';
import type { Nivel } from '@domain/aprendizaje/Nivel';
import type { Palabra } from '@domain/aprendizaje/Palabra';
import type { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { ETIQUETAS_CATEGORIA, type EstadoAprendizaje } from '@domain/shared/tipos';

/**
 * Mappers puros de dominio → DTO compartidos por los casos de uso de aprendizaje.
 *
 * La UI sólo consume DTOs planos, así que la traducción de entidades de dominio vive aquí y en
 * un único lugar: ni los casos de uso ni la infraestructura vuelven a construir estos objetos.
 * Estas funciones no tienen dependencias técnicas (sin reloj, sin repositorios), por lo que se
 * pueden probar y reutilizar desde cualquier otro caso de uso sin duplicar campos.
 */

/** RF-004: palabra de catálogo + el estado de aprendizaje concreto del estudiante. */
export function aPalabraDto(palabra: Palabra, estado: EstadoAprendizaje): PalabraDto {
  const dto: PalabraDto = {
    id: palabra.id,
    nivelId: palabra.nivelId.valor,
    termino: palabra.terminoTexto,
    traduccion: palabra.traduccion,
    pronunciacion: palabra.pronunciacion,
    categoria: palabra.categoria,
    etiquetaCategoria: ETIQUETAS_CATEGORIA[palabra.categoria],
    contextoCultural: palabra.contextoCultural,
    estado
  };

  // Los campos opcionales sólo se copian si existen, para no ensuciar el DTO con `undefined`.
  if (palabra.imagenUrl !== undefined) dto.imagenUrl = palabra.imagenUrl;
  if (palabra.ejemploUso !== undefined) dto.ejemploUso = palabra.ejemploUso;

  return dto;
}

/**
 * RF-003: nivel del mapa con su estado de recorrido.
 *
 * RN-01: en cualquier progreso alcanzable, "bloqueado" significa exactamente "posterior al nivel
 * actual"; por eso `accesible` se deriva del estado y el caso de uso no tiene que repetir la regla.
 */
export function aNivelDto(nivel: Nivel, estado: EstadoNivelDto, palabrasTotal: number): NivelDto {
  return {
    id: nivel.numero,
    tituloQuechua: nivel.tituloQuechua,
    tituloEspanol: nivel.tituloEspanol,
    descripcion: nivel.descripcion,
    icono: nivel.icono,
    colorAcento: nivel.colorAcento,
    tramo: nivel.tramo,
    estado,
    palabrasTotal,
    accesible: estado !== 'bloqueado'
  };
}

/** RF-008: fila del historial de evaluaciones (también cola de sincronización, RN-15). */
export function aEvaluacionResumenDto(evaluacion: Evaluacion): EvaluacionResumenDto {
  return {
    id: evaluacion.id,
    nivelId: evaluacion.nivelId.valor,
    puntuacion: evaluacion.puntuacion.valor,
    aciertos: evaluacion.aciertos,
    totalPreguntas: evaluacion.totalPreguntas,
    aprobado: evaluacion.aprobado,
    fecha: evaluacion.fecha,
    sincronizada: evaluacion.sincronizada
  };
}
