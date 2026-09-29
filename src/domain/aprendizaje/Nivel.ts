import { ValidacionError } from '../errores';
import { tramoDeNivel, type TramoNivel } from '../shared/tipos';
import { NivelId } from '../value-objects/NivelId';

/**
 * Nivel del curso A1 (1..10).
 *
 * Nota (RN-04): el nivel NO guarda su propio umbral de aprobación. Antes cada registro del seed
 * repetía `umbral_minimo_aprobacion: 70`; ahora el umbral es único y vive en `PoliticaAprobacion`.
 */
export interface DatosNivel {
  id: number;
  tituloQuechua: string;
  tituloEspanol: string;
  descripcion: string;
  icono: string;
  colorAcento: string;
}

export class Nivel {
  private constructor(
    readonly id: NivelId,
    readonly tituloQuechua: string,
    readonly tituloEspanol: string,
    readonly descripcion: string,
    readonly icono: string,
    readonly colorAcento: string
  ) {}

  static crear(datos: DatosNivel): Nivel {
    if (!datos.tituloQuechua?.trim()) {
      throw new ValidacionError('El nivel requiere un título en quechua.', 'tituloQuechua');
    }
    return new Nivel(
      NivelId.crear(datos.id),
      datos.tituloQuechua.trim(),
      datos.tituloEspanol?.trim() ?? '',
      datos.descripcion?.trim() ?? '',
      datos.icono?.trim() || 'Sparkles',
      datos.colorAcento?.trim() || '#B94700'
    );
  }

  get numero(): number {
    return this.id.valor;
  }

  /** Miller: tramo pedagógico (1–3 Fundamentos, 4–7 Vida cotidiana, 8–10 Cosmovisión). */
  get tramo(): TramoNivel {
    return tramoDeNivel(this.id.valor);
  }

  esElUltimo(): boolean {
    return this.id.esUltimo;
  }

  toJSON(): DatosNivel {
    return {
      id: this.id.valor,
      tituloQuechua: this.tituloQuechua,
      tituloEspanol: this.tituloEspanol,
      descripcion: this.descripcion,
      icono: this.icono,
      colorAcento: this.colorAcento
    };
  }
}
