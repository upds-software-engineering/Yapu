import type { LeccionDto } from '@application/dto';
import type { CatalogoRepository, ProgresoRepository, SesionPort } from '@application/ports';
import type { Palabra } from '@domain/aprendizaje/Palabra';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { NoEncontradoError } from '@domain/errores';
import { NivelId } from '@domain/value-objects/NivelId';
import { aPalabraDto } from './mappers';

/**
 * RF-004 — Lección de un nivel: las palabras que se van a practicar en flashcards.
 *
 * RN-01: sólo se abre la lección de un nivel accesible; pedir uno bloqueado deja escapar
 * `NivelBloqueadoError` (la UI lo traduce a un mensaje amigable). Apogeo-Final: si la petición
 * llega con `palabrasFalladas` (el estudiante viene de reprobar), la lección se abre filtrada y en
 * ese orden, para que repase justo lo que falló.
 */
export class ObtenerLeccionUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort
  ) {}

  /** RF-004, RN-01. */
  async ejecutar(entrada: {
    nivel: number;
    palabrasFalladas?: readonly string[];
  }): Promise<LeccionDto> {
    const { usuarioId, rol } = await this.sesion.obtener();
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    // RN-01: valida el rango del nivel y después el acceso (lanza NivelBloqueadoError).
    const nivelId = NivelId.crear(entrada.nivel);
    // El bloqueo secuencial es una regla de la RUTA DE APRENDIZAJE del estudiante. El profesorado
    // necesita consultar el vocabulario de cualquier nivel para registrar oraciones base (RF-006),
    // así que el rol docente no queda sujeto al gate.
    if (rol !== 'docente') {
      progreso.asegurarAccesoANivel(nivelId);
    }

    const nivel = await this.catalogo.obtenerNivel(nivelId.valor);
    if (nivel === null) {
      throw new NoEncontradoError(`El nivel ${nivelId.valor} no existe en el catálogo.`);
    }

    const palabrasDelNivel = await this.catalogo.listarPalabrasPorNivel(nivelId.valor);
    const palabrasFalladas = entrada.palabrasFalladas ?? [];
    const esRepaso = palabrasFalladas.length > 0;
    const seleccionadas = esRepaso
      ? ordenarPorPalabrasFalladas(palabrasDelNivel, palabrasFalladas)
      : palabrasDelNivel;

    // RN-08: el estado de cada palabra es el del progreso; sin registro previo, `nuevo`.
    const palabras = seleccionadas.map((palabra) =>
      aPalabraDto(palabra, progreso.obtenerRegistro(palabra.id)?.estado ?? 'nuevo')
    );

    return {
      nivelId: nivel.numero,
      tituloQuechua: nivel.tituloQuechua,
      tituloEspanol: nivel.tituloEspanol,
      descripcion: nivel.descripcion,
      palabras,
      esRepaso,
      aprendidas: palabras.filter((palabra) => palabra.estado === 'aprendido').length
    };
  }
}

/**
 * Apogeo-Final: la lección de repaso respeta el orden en que llegaron las palabras falladas,
 * ignora ids ajenos al nivel y nunca repite una palabra dos veces.
 */
function ordenarPorPalabrasFalladas(
  palabras: readonly Palabra[],
  palabrasFalladas: readonly string[]
): Palabra[] {
  const porId = new Map(palabras.map((palabra) => [palabra.id, palabra]));
  const seleccionadas: Palabra[] = [];
  const yaIncluidas = new Set<string>();

  for (const palabraId of palabrasFalladas) {
    if (yaIncluidas.has(palabraId)) continue;
    const palabra = porId.get(palabraId);
    if (palabra === undefined) continue;
    yaIncluidas.add(palabraId);
    seleccionadas.push(palabra);
  }

  return seleccionadas;
}
