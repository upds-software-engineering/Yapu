import type { OracionDto } from '@application/dto';
import type { CatalogoRepository, OracionRepository, SesionPort } from '@application/ports';
import type { OracionBase } from '@domain/contenido';

/**
 * RF-006: listado del corpus de oraciones base para la pantalla del docente.
 *
 * Devuelve las oraciones más recientes primero. Como la fecha del agregado es un día calendario
 * (`FechaDia`, sin hora), el desempate entre oraciones del mismo día es el orden inverso de
 * registro, de modo que "lo último que se escribió" siga apareciendo arriba.
 *
 * El término de la palabra clave no vive en el agregado: se resuelve contra el catálogo en un
 * `Map` para no recorrer la lista de palabras una vez por oración.
 */
export class ListarOracionesUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly oraciones: OracionRepository,
    private readonly sesion: SesionPort
  ) {}

  async ejecutar(entrada?: { nivelId?: number }): Promise<OracionDto[]> {
    // El corpus es de lectura para cualquier rol autenticado: se resuelve la sesión actual y no
    // se filtra por autor (una oración base es de la comunidad, no de quien la escribió).
    await this.sesion.obtener();

    const nivelId = entrada?.nivelId;
    const listado =
      nivelId === undefined
        ? await this.oraciones.listar()
        : await this.oraciones.listarPorNivel(nivelId);

    const palabras = await this.catalogo.listarPalabras();
    const terminos = new Map(palabras.map((palabra) => [palabra.id, palabra.terminoTexto]));

    return [...listado]
      .reverse()
      .sort(compararPorFechaDescendente)
      .map((oracion) => aOracionDtoLocal(oracion, terminos.get(oracion.palabraClaveId) ?? ''));
  }
}

/** Fechas en formato `YYYY-MM-DD`: la comparación lexicográfica ya es cronológica. */
function compararPorFechaDescendente(a: OracionBase, b: OracionBase): number {
  return b.fechaCreacion.toJSON().localeCompare(a.fechaCreacion.toJSON());
}

/**
 * Proyección local del agregado a DTO: `mappers.ts` es de otro módulo y puede no exponer
 * todavía un `aOracionDto`, así que este caso de uso mantiene su propio mapeo privado.
 */
function aOracionDtoLocal(oracion: OracionBase, palabraClaveTermino: string): OracionDto {
  return {
    id: oracion.id,
    nivelId: oracion.nivelId.valor,
    textoQuechua: oracion.textoQuechua,
    traduccionEspanol: oracion.traduccionEspanol,
    palabraClaveId: oracion.palabraClaveId,
    palabraClaveTermino,
    categoria: oracion.categoria,
    contextoCultural: oracion.contextoCultural,
    autorId: oracion.autorId,
    estado: oracion.estado,
    fechaCreacion: oracion.fechaCreacion.toJSON()
  };
}
