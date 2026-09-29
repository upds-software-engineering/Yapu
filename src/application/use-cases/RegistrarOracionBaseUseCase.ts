import type { OracionDto } from '@application/dto';
import type {
  CatalogoRepository,
  GeneradorIdPort,
  OracionRepository,
  RelojPort,
  SesionPort
} from '@application/ports';
import { OracionBase } from '@domain/contenido';
import { NoEncontradoError, PermisoDenegadoError } from '@domain/errores';

/** RF-006: datos que aporta una o un docente al registrar una oración base. */
export interface EntradaOracion {
  nivelId: number;
  textoQuechua: string;
  traduccionEspanol: string;
  palabraClaveId: string;
  contextoCultural?: string;
}

/**
 * RF-006 / RN-11 / RN-12: alta de una oración base del corpus.
 *
 * El caso de uso sólo orquesta: comprueba el rol, resuelve la palabra clave en el catálogo y
 * delega todas las invariantes lingüísticas en `OracionBase.crear` (RN-11: la oración contiene
 * la palabra clave; RN-12: la palabra clave existe y es del mismo nivel).
 *
 * RN-12: la oración se guarda directamente como `aprobado`, porque el contenido del docente es
 * fuente confiable y alimenta al generador determinista sin pasar por moderación.
 */
export class RegistrarOracionBaseUseCase {
  constructor(
    private readonly oraciones: OracionRepository,
    private readonly catalogo: CatalogoRepository,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort,
    private readonly generadorId: GeneradorIdPort
  ) {}

  async ejecutar(entrada: EntradaOracion): Promise<OracionDto> {
    const { rol, usuarioId } = await this.sesion.obtener();
    if (rol !== 'docente') {
      throw new PermisoDenegadoError('Sólo el rol docente puede registrar oraciones base (RF-006).');
    }

    const palabra = await this.catalogo.obtenerPalabra(entrada.palabraClaveId);
    if (!palabra) {
      throw new NoEncontradoError('La palabra clave indicada no existe.');
    }

    // RN-11 y RN-12 se validan aquí dentro: `ValidacionError` se deja escapar tal cual.
    const oracion = OracionBase.crear(
      {
        id: this.generadorId.generar(),
        nivelId: entrada.nivelId,
        textoQuechua: entrada.textoQuechua,
        traduccionEspanol: entrada.traduccionEspanol,
        palabraClaveId: palabra.id,
        categoria: palabra.categoria,
        contextoCultural: entrada.contextoCultural,
        autorId: usuarioId,
        estado: 'aprobado',
        fechaCreacion: this.reloj.ahora().toISOString()
      },
      palabra
    );

    await this.oraciones.guardar(oracion);

    return aOracionDtoLocal(oracion, palabra.terminoTexto);
  }
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
