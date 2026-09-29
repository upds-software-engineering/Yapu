/**
 * Barrel de la lección con flashcards (RF-004).
 *
 * `src/pages/**` monta la pantalla con `<Leccion nivelId={…} />`; los E2E se apoyan además en el
 * contrato de selectores (`data-pantalla`, `data-flashcard`, `data-accion`, `data-cta`).
 */
export { Flashcard, type PropsFlashcard } from './Flashcard';
export { Leccion, type PropsLeccion } from './Leccion';
export { CierreLeccion, type PropsCierreLeccion } from './CierreLeccion';
