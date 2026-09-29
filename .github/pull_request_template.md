# Descripción

<!-- Qué cambia y por qué. Incluye el contexto necesario para revisar sin abrir el código. -->

## Tipo de cambio

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — corrección de un defecto
- [ ] `refactor` — reorganización sin cambio de comportamiento (hexagonal, capas)
- [ ] `test` — pruebas nuevas o corregidas
- [ ] `docs` — documentación (SRS, matriz de trazabilidad, ADR)
- [ ] `chore` — tooling, dependencias, CI/CD
- [ ] `breaking change` — rompe compatibilidad (indicar impacto y migración)

## Checklist de calidad

- [ ] `npm run test:unit && npm run test:contract && npm run test:component` en verde
- [ ] `npm run lint` en verde con **0 warnings** (ESLint + `tsc --noEmit` + `astro check`)
- [ ] `npm run lint:capas` en verde (no se cruzan fronteras entre dominio, aplicación, infraestructura y UI)
- [ ] Cobertura `src/domain/**` y `src/application/**` **≥ 90 %** y cobertura global **≥ 80 %** (`npm run test:coverage`)
- [ ] `npm run build` + `npm run verificar:paginas` en verde: **24+ páginas** generadas y servidas bajo `/Yapu/`
- [ ] E2E en verde: `npm run test:e2e`, `npm run test:a11y` y `npm run test:e2e:ux`
- [ ] Sin `console.log` de depuración, sin TODOs sin dueño y sin secretos ni tokens en el código

## Checklist de Leyes UX

- [ ] **Fitts**: todo objetivo interactivo mide **≥ 44 px en móvil** y **≥ 24 px en escritorio**, con separación **≥ 8 px** entre objetivos contiguos (incluidas las zonas de CTA secundarias y los enlaces de navegación).
- [ ] **Hick**: **≤ 7 opciones primarias** visibles por pantalla y **un único CTA principal** con `data-cta="primario"` por vista; el resto de acciones son secundarias o terciarias.
- [ ] **Miller**: los conjuntos de opciones se agrupan en tramos de **1–3**, **4–7** u **8–10** elementos; ningún menú o listado supera los 10 sin agrupar o paginar.
- [ ] **Apogeo-Final**: el resultado de cada ejercicio muestra el **próximo paso** tanto en el caso aprobado (continuar, subir de nivel) como en el reprobado (repasar, reintentar, volver al concepto).
- [ ] **Estética-Usabilidad**: **≤ 3 tamaños tipográficos** por pantalla y sólo los tokens `text-caption`, `text-body`, `text-title` y `text-display`; sin colores ni espaciados ad hoc.
- [ ] El flujo se verificó en móvil y escritorio, con teclado y con lector de pantalla (foco visible, orden lógico, contraste AA).

## Trazabilidad

- [ ] Matriz actualizada: [Docs/testing/matriz-trazabilidad.md](../blob/main/Docs/testing/matriz-trazabilidad.md) (la regenera `npm run reports:trazabilidad`)
- [ ] Requisitos tocados por este PR (indicar RF/RNF/RS/RN y el caso de prueba que los cubre):
  - RF:
  - RNF:
  - RS:
  - RN:

## Notas para el revisor

<!-- Qué mirar con lupa, decisiones dudosas, alternativas descartadas, cómo probarlo a mano. -->
