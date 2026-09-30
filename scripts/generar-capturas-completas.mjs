import { chromium, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..');
const outDir = path.join(raiz, 'Docs', 'capturas');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.gz': 'application/gzip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function startStaticServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let targetFile = null;

      if (urlPath.startsWith('/vitest/')) {
        const rel = urlPath.slice('/vitest/'.length) || 'index.html';
        targetFile = path.join(raiz, '.vitest', rel);
      } else if (urlPath.startsWith('/playwright/')) {
        const rel = urlPath.slice('/playwright/'.length) || 'index.html';
        targetFile = path.join(raiz, 'playwright-report', rel);
      } else if (urlPath.startsWith('/coverage/')) {
        const rel = urlPath.slice('/coverage/'.length) || 'index.html';
        targetFile = path.join(raiz, 'reports', 'coverage', rel);
      }

      if (!targetFile || !fs.existsSync(targetFile)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + urlPath);
        return;
      }

      const stat = fs.statSync(targetFile);
      if (stat.isDirectory()) {
        targetFile = path.join(targetFile, 'index.html');
      }

      if (!fs.existsSync(targetFile)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Index Not Found');
        return;
      }

      const ext = path.extname(targetFile).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(targetFile).pipe(res);
    });

    server.listen(port, () => {
      console.log(`Servidor de reportes escuchando en http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  const server = await startStaticServer(9506);
  const browser = await chromium.launch({ headless: true });

  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });
  const page = await contextDesktop.newPage();

  console.log('--- 1. Capturando Cobertura V8 Global ---');
  await page.goto('http://localhost:9506/coverage/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01_cobertura_v8_global.png'), fullPage: false });

  console.log('--- 2. Capturando Cobertura V8 Casos de Uso ---');
  await page.goto('http://localhost:9506/coverage/application/use-cases/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01b_cobertura_v8_usecases.png'), fullPage: false });

  console.log('--- 2b. Capturando Cobertura V8 Dominio Evaluación ---');
  await page.goto('http://localhost:9506/coverage/domain/evaluacion/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01c_cobertura_v8_evaluacion.png'), fullPage: false });

  console.log('--- 3. Capturando Reporte Playwright Global ---');
  await page.goto('http://localhost:9506/playwright/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '02_playwright_e2e_report.png'), fullPage: false });

  console.log('--- 4. Capturando Reporte Playwright Accesibilidad (a11y) ---');
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('a11y');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '02b_playwright_a11y_report.png'), fullPage: false });
  }

  console.log('--- 5. Capturando Reporte Playwright Leyes UX (ux) ---');
  if (await searchInput.isVisible()) {
    await searchInput.fill('ux');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '02c_playwright_ux_report.png'), fullPage: false });
  }

  console.log('--- 6. Capturando Reporte Playwright Flujos Críticos (flujos) ---');
  if (await searchInput.isVisible()) {
    await searchInput.fill('flujos');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '02d_playwright_flujos_report.png'), fullPage: false });
  }

  console.log('--- 7. Capturando Vitest Runner Oficial UI ---');
  await page.goto('http://localhost:9506/vitest/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '03_vitest_runner_report.png'), fullPage: false });

  console.log('--- 8. Capturando Vistas de la Aplicación en Vivo (Astro Preview) ---');
  const baseUrl = 'http://localhost:9500/Yapu';

  // Portada
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '04_app_portada.png') });

  // Tablero
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '05_app_tablero.png') });

  // Lección Flashcard Anverso
  await page.goto(`${baseUrl}/lesson/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '06_app_leccion_flashcard.png') });

  // Lección Flashcard Reverso
  try {
    const flashcard = page.locator('[data-testid="flashcard"], button:has-text("Voltear"), .cursor-pointer').first();
    if (await flashcard.isVisible()) {
      await flashcard.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, '07_app_leccion_reverso.png') });
    }
  } catch (e) {
    console.log('Aviso flashcard reverso:', e.message);
  }

  // Quiz Pregunta
  await page.goto(`${baseUrl}/quiz/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '08_app_quiz_pregunta.png') });

  // Quiz Resultado con Confeti
  try {
    for (let i = 0; i < 10; i++) {
      const opciones = page.locator('button[data-opcion], button:has([data-letra]), [role="radio"], button.w-full');
      const count = await opciones.count();
      if (count > 0) {
        await opciones.first().click();
        await page.waitForTimeout(120);
        const sigBtn = page.locator('button:has-text("Siguiente"), button:has-text("Finalizar"), button:has-text("Calificar")').first();
        if (await sigBtn.isVisible()) {
          await sigBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '09_app_quiz_resultado.png') });
  } catch (e) {
    console.log('Aviso quiz resultado:', e.message);
  }

  // Portal Docente
  await page.goto(`${baseUrl}/docente`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '10_app_portal_docente.png') });

  // Comunidad Ayllu
  await page.goto(`${baseUrl}/community`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '11_app_comunidad_ayllu.png') });

  // Emulación Móvil Pixel 5
  console.log('--- 9. Capturando Vistas Móviles en Pixel 5 ---');
  const contextMobile = await browser.newContext({
    ...devices['Pixel 5'],
    deviceScaleFactor: 2
  });
  const pageMobile = await contextMobile.newPage();

  await pageMobile.goto(baseUrl, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: path.join(outDir, '12_app_movil_portada.png') });

  await pageMobile.goto(`${baseUrl}/lesson/1`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: path.join(outDir, '13_app_movil_leccion.png') });

  await pageMobile.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: path.join(outDir, '14_app_movil_tablero.png') });

  await browser.close();
  server.close();
  console.log('¡Todas las capturas reales fueron generadas con éxito!');
}

main().catch(err => {
  console.error('Error al capturar:', err);
  process.exit(1);
});
