import { describe, expect, it } from 'vitest';
import { baseUrl, ruta, rutaActiva, rutaEvaluacion, rutaLeccion } from '@ui/lib/ruta';

/**
 * [RS-002] Helper de rutas bajo `base: '/Yapu'` (ADR-004).
 *
 * Las páginas se publican como `ruta/index.html`. GitHub Pages responde a una URL sin barra final
 * con un 301 hacia la versión con barra, así que cada enlace sin barra costaba un viaje de red
 * extra en cada navegación: con conexiones lentas (RS-002) eso se nota.
 */
describe('[RS-002] Helper de rutas', () => {
  it('[RS-002] las páginas terminan en barra para evitar la redirección 301 de GitHub Pages', () => {
    // Dado un destino lógico de página, Cuando se construye su URL
    // Entonces termina en barra bajo el prefijo de despliegue
    expect(ruta('/community')).toBe(`${baseUrl}/community/`);
    expect(ruta('/lesson/3')).toBe(`${baseUrl}/lesson/3/`);
    expect(ruta('docente')).toBe(`${baseUrl}/docente/`);
    expect(rutaEvaluacion(10)).toBe(`${baseUrl}/quiz/10/`);
  });

  it('[RS-002] la portada y los destinos que ya tienen barra no se duplican', () => {
    // Dado la portada o una ruta con barra, Cuando se construye la URL
    // Entonces hay exactamente una barra final
    expect(ruta('/')).toBe(`${baseUrl}/`);
    expect(ruta('')).toBe(`${baseUrl}/`);
    expect(ruta('/dashboard/')).toBe(`${baseUrl}/dashboard/`);
  });

  it('[RS-002] los archivos estáticos conservan su nombre sin barra', () => {
    // Dado un archivo (tiene extensión), Cuando se construye su URL
    // Entonces no se le agrega barra: `manifest.json/` daría 404
    expect(ruta('/manifest.json')).toBe(`${baseUrl}/manifest.json`);
    expect(ruta('/favicon.svg')).toBe(`${baseUrl}/favicon.svg`);
  });

  it('[RS-002] la consulta y el ancla quedan detrás de la barra', () => {
    // Dado un destino con parámetros, Cuando se construye la URL
    // Entonces la barra va antes del `?` o del `#`
    expect(ruta('/login?siguiente=/docente')).toBe(`${baseUrl}/login/?siguiente=/docente`);
    expect(ruta('/community#retos')).toBe(`${baseUrl}/community/#retos`);
    expect(rutaLeccion(1, ['p1', 'p2'])).toBe(`${baseUrl}/lesson/1/?palabras=p1%2Cp2`);
    expect(rutaLeccion(1)).toBe(`${baseUrl}/lesson/1/`);
  });

  it('[RS-002] la navegación resalta el destino activo con o sin barra final', () => {
    // Dado la URL real del navegador (con barra) y el destino lógico (sin barra)
    // Cuando se comparan, Entonces coinciden
    expect(rutaActiva(`${baseUrl}/community/`, '/community')).toBe(true);
    expect(rutaActiva(`${baseUrl}/community`, '/community')).toBe(true);
    expect(rutaActiva(`${baseUrl}/dashboard/`, '/community')).toBe(false);
  });
});
