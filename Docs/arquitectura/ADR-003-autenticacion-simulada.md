# ADR-003 — Autenticación simulada con `SesionPort` y `SesionLocalAdapter`

- **Estado:** Aceptado (decisión de alcance, con adaptador de nube documentado como futuro)
- **Fecha:** 2026-09-29
- **Ámbito:** RF-001 (registro e inicio de sesión) y RF-002 (gestión de roles)
- **Requisitos relacionados:** RF-001, RF-002, RNF-004 (seguridad y ausencia de credenciales), RS-001 (sostenibilidad técnica)

---

## 1. Contexto

RF-001 y RF-002 están en el catálogo del proyecto como requisitos funcionales:

| ID | Descripción |
| --- | --- |
| `RF-001` | Registro e inicio de sesión de estudiantes |
| `RF-002` | Gestión de roles (estudiante/docente) |

Sin embargo, la naturaleza del producto impone restricciones que chocan con una autenticación real en esta iteración:

1. **YAPU es una PWA estática** (`output: 'static'` en `astro.config.mjs`, publicada en GitHub Pages). No hay servidor, ni API, ni función de borde donde verificar una contraseña. Cualquier "verificación" hecha en el cliente es, por definición, evitable.
2. **No hay credenciales ni secretos que gestionar.** RNF-004 exige expresamente la ausencia de credenciales en el repositorio. Un `.env.example` con cadenas de conexión a PostgreSQL/MySQL ya existe para la arquitectura de datos *prevista*, y la decisión es no añadir a esa lista ninguna clave de Firebase.
3. **El objetivo pedagógico manda.** El estudiante objetivo (RS-002) estudia en un teléfono modesto, posiblemente sin cuenta de correo usable y sin conexión estable. Un formulario de registro con verificación por correo sería una barrera de entrada, no una función.
4. **Los roles sí importan funcionalmente.** Aunque el inicio de sesión sea simulado, RN-12 y RN-13 dependen del rol: sólo un docente registra oraciones base, sólo un estudiante de nivel ≥ 7 propone retos y nadie modera su propio reto. Ese comportamiento debe existir y ser verificable.
5. **Sin abstracción, el día que haya Firebase habría que reescribir la UI.** Si los componentes leyeran directamente una cookie o un `localStorage`, sustituir la autenticación implicaría tocar todas las pantallas.

## 2. Decisión

La autenticación se declara **fuera del alcance real** de esta iteración y se **simula** detrás de un puerto, de modo que el contrato ya sea el de una autenticación de verdad.

### 2.1 El puerto

```ts
// src/application/ports/SesionPort.ts
export interface SesionActual {
  usuarioId: string;
  rol: RolUsuario;      // 'estudiante' | 'docente'
  nombre: string;
}

export interface SesionPort {
  obtener(): Promise<SesionActual>;
  cambiarRol(rol: RolUsuario): Promise<SesionActual>;
  establecerUsuario(usuarioId: string, nombre?: string): Promise<SesionActual>;
}
```

`RolUsuario` está definido en el dominio (`src/domain/shared/tipos.ts`) porque RN-12 y RN-13 lo necesitan sin depender de la aplicación:

```ts
/** RF-001/002 simulado: los roles que la sesión local puede adoptar. */
export type RolUsuario = 'estudiante' | 'docente';
```

### 2.2 El adaptador: `SesionLocalAdapter`

`src/infrastructure/system/SesionLocalAdapter.ts` persiste la sesión simulada en `localStorage` bajo una clave versionada y con espacio de nombres:

```ts
export const CLAVE_SESION = 'yapu:sesion:v1';

/** RF-001 simulado: sin autenticación real (ADR-003) todo usuario entra como estudiante. */
const ROL_POR_DEFECTO: RolUsuario = 'estudiante';
const NOMBRE_POR_DEFECTO = 'Estudiante YAPU';
```

Comportamiento verificado del adaptador:

| Aspecto | Cómo se resuelve |
| --- | --- |
| **Identificador estable** | Si no hay sesión previa, se genera un `usuarioId` con `GeneradorIdPort` y se persiste. Todas las visitas posteriores reutilizan el mismo id, de modo que progreso, historial y racha siguen perteneciendo a la misma persona |
| **Rol por defecto** | `estudiante`. `cambiarRol('docente')` es una transición explícita de la UI, sin ninguna verificación |
| **Tolerancia a fallos** | Sin `localStorage` (SSR o modo privado) la sesión se mantiene **en memoria**; si la lectura falla por cuota o por almacenamiento bloqueado, `setItem` está en `try/catch` |
| **Datos corruptos** | `interpretarSesion(dato)` valida que existan `usuarioId` (texto no vacío) y `rol` (`'estudiante'` \| `'docente'`); si el JSON está corrupto o no es una sesión utilizable, se descarta y `obtener()` regenera la sesión por defecto |
| **Inmutabilidad defensiva** | Cada lectura y escritura clona el objeto de sesión (`clonar(sesion)`), de modo que nadie muta la sesión almacenada desde fuera |
| **Clave de inyección** | El constructor acepta `SesionLocalAdapter(generadorId, clave = CLAVE_SESION)` para poder probar contra una clave aislada |

### 2.3 Control de acceso: el rol se verifica en el dominio, no en la UI

La simulación **no** significa que RN-12/RN-13 se relajen. Las entidades validan el rol y el permiso:

- `RetoComunitario.proponer(propuesta, { rol, nivelActual })` lanza `PermisoDenegadoError` si `rol !== 'estudiante'` o si `nivelActual < RetoComunitario.NIVEL_MINIMO_PROPONER` (7).
- `RetoComunitario.moderar({ docenteId, decision, fecha })` lanza `PermisoDenegadoError` si quien modera es el autor y `ConflictoEstadoError` si ya votó.
- `RetoComunitario.puedeProponer(rol, nivelActual)` permite a la UI habilitar o no el formulario **sin efectos secundarios**.

En consecuencia, ocultar el botón en la UI es una mejora de usabilidad (Ley de Hick, Ley de Jakob), **no** el mecanismo de seguridad. La regla vive en el dominio y se prueba ahí.

### 2.4 Firebase como adaptador futuro, sin dependencias ni credenciales

El camino de evolución queda documentado, no implementado:

```
src/infrastructure/system/SesionLocalAdapter.ts   ← iteración actual (simulado)
src/infrastructure/system/SesionFirebaseAdapter.ts ← previsto (misma interfaz `SesionPort`)
```

Reglas de esa evolución futura:

1. `SesionFirebaseAdapter` implementará **la misma interfaz** `SesionPort`, de modo que `ObtenerSesionUseCase` y `CambiarRolUseCase` no cambien y la UI no se toque;
2. se añadirá como **dependencia nueva y explícita** en `package.json` y sus credenciales irán a variables de entorno (nunca al repositorio), respetando RNF-004;
3. mientras no exista, **no se añade ninguna dependencia de Firebase ni ningún archivo de credenciales**. Este ADR deja constancia del `SesionFirebaseAdapter` como opción, no como compromiso.

### 2.5 Trazabilidad del alcance

La matriz de trazabilidad `Docs/testing/matriz-trazabilidad.md`, **autogenerada** por `scripts/generar-matriz-trazabilidad.mjs`, declara el alcance en su propio catálogo de requisitos:

```js
{ id: 'RF-001', descripcion: 'Registro e inicio de sesión de estudiantes', nota: 'Simulado (SesionLocal)' },
{ id: 'RF-002', descripcion: 'Gestión de roles (estudiante/docente)', nota: 'Simulado (SesionLocal)' }
```

y añade al final del documento una **nota de alcance (ADR-003)** que explica que estos dos requisitos se validan mediante pruebas de infraestructura del adaptador, no con una suite de autenticación real. Así, ninguna persona que lea la matriz puede confundir "cubierto" con "implementado de verdad".

## 3. Justificación

1. **Honestidad de alcance sobre seguridad teatral.** Un login en el cliente que "valida" contraseñas daría una falsa sensación de seguridad. Declararlo simulado y documentarlo es preferible a construir una ilusión.
2. **La inversión de dependencia ya paga.** La UI consume `SesionDto` (`{ usuarioId, rol, nombre, esDocente }`) desde los casos de uso. Cuando exista un adaptador real, el cambio se limita al *composition root*.
3. **El rol se necesita aunque no haya login.** RN-12 y RN-13 son reglas del curso: sin un `RolUsuario` en el dominio no se podrían expresar. Simular la sesión permite que esas reglas existan y se prueben hoy.
4. **Id estable = datos coherentes.** Generar un `usuarioId` con `GeneradorIdPort` y persistirlo evita el bug clásico de "cada recarga crea un estudiante nuevo y se pierde el progreso".
5. **Tolerancia a fallos del almacenamiento.** El modo privado o una cuota agotada no deben impedir estudiar: degradar a sesión en memoria mantiene el flujo completo, sólo se pierde la persistencia.
6. **No añadir dependencias tiene valor propio.** RNF-004 y RS-002: cada kilobyte de un SDK de terceros es carga de red en un teléfono modesto y superficie de mantenimiento. Firebase entra sólo cuando resuelva un problema real.

## 4. Consecuencias

### Positivas

- La UI no conoce `localStorage` ni Firebase: sólo `SesionPort` y `SesionDto`.
- El rol está tipado y validado en el dominio, con errores tipados (`PermisoDenegadoError`, `ConflictoEstadoError`).
- La sesión simulada es testeable y hoy tiene pruebas de infraestructura (`describe('SesionLocalAdapter')` en `tests/unit/infrastructure/system.test.ts`).
- Cero credenciales y cero dependencias de autenticación en el repositorio (RNF-004).

### Costes y límites asumidos — declarados explícitamente

- **RF-001 y RF-002 quedan fuera del alcance real.** No hay registro con contraseña, ni verificación, ni recuperación de cuenta, ni sesión caducada.
- **El rol es autoasignable.** Cualquier persona puede llamar a `cambiarRol('docente')` desde las herramientas del navegador y acceder al panel docente. No hay ninguna barrera técnica: es una simulación.
- **No hay aislamiento multiusuario real.** El `usuarioId` es local a ese navegador; dos personas en el mismo dispositivo comparten el perfil salvo que se cambie el identificador.
- **Sin sincronización de identidad.** `SincronizacionNoopAdapter` (ADR-002) no envía nada, así que la identidad tampoco se reconcilia con una nube.
- **Deuda de migración de datos.** Cuando exista autenticación real habrá que decidir qué ocurre con las sesiones `yapu:sesion:v1` ya presentes en los navegadores (probablemente migrar el `usuarioId` anónimo a la cuenta nueva). No se decide aquí.
- **Riesgo de erosión del alcance.** Si el producto pide "sólo un login simple" en el futuro, la respuesta correcta es implementar el adaptador real, **no** endurecer el simulado.

## 5. Alternativas consideradas

| Alternativa | Por qué se descartó |
| --- | --- |
| **Firebase Authentication en esta iteración** | Añade dependencia, credenciales, configuración de proyecto y flujo de verificación por correo; contradice RNF-004 y encarece la primera experiencia en un dispositivo modesto. Queda documentado como camino futuro. |
| **Login falso con usuario y contraseña fijos en el código** | Peor que el rol autoasignable: crea la apariencia de autenticación, guarda credenciales en el repositorio (viola RNF-004) y confunde a quien lea el código. |
| **`localStorage` leído directamente por los componentes** | Sin puerto no hay forma de sustituirlo; la UI se llenaría de guardas de entorno y de validación de datos corruptos. |
| **Cookies o JWT firmados en el cliente** | No hay servidor que firme ni que verifique: el cliente podría falsificar la firma igual. Seguridad teatral. |
| **No modelar el rol en absoluto** ("todos son estudiantes") | Rompe RN-12 y RN-13 y hace imposible el panel docente, que sí está en el alcance (RF-006, RF-010, RS-004). |
| **Backend mínimo (serverless) sólo para autenticar** | Añade una superficie de despliegue, secretos y coste operativo a un proyecto académico cuyo despliegue es GitHub Pages estático. Desproporcionado y contrario a RS-001. |
| **Firebase detrás de un *feature flag*, código presente pero desactivado** | Deja en el repositorio una dependencia y una ruta de código sin pruebas reales. Mejor un ADR que un código muerto. |

## 6. Estado

**Aceptado y en vigor. Simulación implementada; adaptador real sólo documentado.**

| Elemento | Estado verificado |
| --- | --- |
| `SesionPort` y `SesionActual` (`src/application/ports/SesionPort.ts`) | Implementado |
| `SesionLocalAdapter` con clave `yapu:sesion:v1` | Implementado |
| `RolUsuario` en `src/domain/shared/tipos.ts` | Implementado |
| Validación de rol y permiso en `RetoComunitario` (RN-13) | Implementado |
| `SesionDto` (`esDocente`) en `src/application/dto/contenido.ts` | Implementado |
| Nota de alcance "Simulado (SesionLocal)" en la matriz de trazabilidad | Implementado (`scripts/generar-matriz-trazabilidad.mjs`) |
| `ObtenerSesionUseCase` y `CambiarRolUseCase` | **Pendiente** (casos de uso en curso) |
| `SesionFirebaseAdapter` | **Sólo documentado aquí**; sin dependencias ni credenciales añadidas |

## 7. Referencias internas

- [`Docs/arquitectura/ADR-001-arquitectura-hexagonal.md`](ADR-001-arquitectura-hexagonal.md) — puertos y adaptadores.
- [`Docs/arquitectura/ADR-002-persistencia-local-y-sincronizacion.md`](ADR-002-persistencia-local-y-sincronizacion.md) — por qué la sesión también vive en `localStorage` y cómo se versionan las claves.
- `src/application/ports/SesionPort.ts`, `src/infrastructure/system/SesionLocalAdapter.ts`, `src/domain/contenido/RetoComunitario.ts`, `scripts/generar-matriz-trazabilidad.mjs`
- Matriz de trazabilidad (artefacto generado): `Docs/testing/matriz-trazabilidad.md`, producido por `npm run reports:trazabilidad`.
