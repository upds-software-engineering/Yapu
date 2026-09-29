/**
 * Barrel del feature de evaluación (RF-005).
 *
 * La página del examen monta únicamente `Evaluacion`; el resto de piezas se exportan para las
 * pruebas de componente y para reutilizarlas desde otras pantallas (por ejemplo, el tablero).
 */
export {
  Confeti,
  COLORES_ANDINOS,
  debeLanzarConfeti,
  puedeAnimarConfeti,
  type DecisionConfeti,
  type PropsConfeti
} from './Confeti';

export {
  PantallaNivelBloqueado,
  EnlaceCtaPrimario,
  type PropsPantallaNivelBloqueado
} from './PantallaNivelBloqueado';

export { TarjetaPregunta, type PropsTarjetaPregunta } from './TarjetaPregunta';

export { Resultado, type PropsResultado } from './Resultado';

export { Evaluacion, type PropsEvaluacion } from './Evaluacion';
