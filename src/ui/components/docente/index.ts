/**
 * Barrel del panel docente (RF-001, RF-006, RF-007 y RS-004).
 *
 * `src/pages/**` monta `PanelDocente`; el resto de los componentes se exportan para poder
 * componerlos en otras pantallas o probarlos por separado.
 */
export { PanelDocente } from './PanelDocente';
export { GuardiaDocente, type PropsGuardiaDocente } from './GuardiaDocente';
export {
  FormularioOracion,
  type EntradaOracionFormulario,
  type OpcionNivel,
  type PropsFormularioOracion
} from './FormularioOracion';
export { ListaOraciones, type PropsListaOraciones } from './ListaOraciones';
export { ModeracionRetos, type PropsModeracionRetos } from './ModeracionRetos';
export { ExportacionCorpus, type PropsExportacionCorpus } from './ExportacionCorpus';
