import { chromium, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..');
const outDir = path.join(raiz, 'Docs', 'capturas');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capturar() {
  console.log('Iniciando captura de evidencias...');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Contexto escritorio
  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 1.5
  });
  const page = await contextDesktop.newPage();

  // A. Cobertura V8
  const coveragePath = path.join(raiz, 'reports', 'coverage', 'index.html');
  if (fs.existsSync(coveragePath)) {
    console.log('Capturando Cobertura V8...');
    await page.goto(`file:///${coveragePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, '01_cobertura_v8_global.png'), fullPage: false });
  }

  // B. Playwright HTML Report
  const playwrightReportPath = path.join(raiz, 'playwright-report', 'index.html');
  if (fs.existsSync(playwrightReportPath)) {
    console.log('Capturando Reporte Playwright...');
    await page.goto(`file:///${playwrightReportPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, '02_playwright_e2e_report.png'), fullPage: false });
  }

  // C. Vitest HTML Report si existe
  const vitestHtmlPath = path.join(raiz, 'reports', 'html', 'vitest', 'index.html');
  if (fs.existsSync(vitestHtmlPath)) {
    console.log('Capturando Reporte Vitest HTML...');
    await page.goto(`file:///${vitestHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, '03_vitest_runner_report.png'), fullPage: false });
  }

  // D. Aplicación YAPU en ejecución
  const baseUrl = 'http://localhost:9500/Yapu';

  // 1. Portada
  console.log('Capturando Portada...');
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '04_app_portada.png') });

  // 2. Tablero
  console.log('Capturando Tablero...');
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '05_app_tablero.png') });

  // 3. Lección nivel 1
  console.log('Capturando Lección Flashcard...');
  await page.goto(`${baseUrl}/lesson/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '06_app_leccion_flashcard.png') });

  // Voltear tarjeta si existe
  try {
    const flashcard = await page.locator('[data-testid="flashcard"], button:has-text("Voltear"), .cursor-pointer').first();
    if (await flashcard.isVisible()) {
      await flashcard.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, '07_app_leccion_reverso.png') });
    }
  } catch (e) {
    console.log('No se pudo voltear flashcard:', e.message);
  }

  // 4. Evaluación Quiz
  console.log('Capturando Quiz Evaluación...');
  await page.goto(`${baseUrl}/quiz/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '08_app_quiz_pregunta.png') });

  // Responder preguntas del quiz para llegar al clímax
  try {
    for (let i = 0; i < 10; i++) {
      const opciones = page.locator('button[data-opcion], button:has([data-letra]), [role="radio"], button.w-full');
      const count = await opciones.count();
      if (count > 0) {
        await opciones.first().click();
        await page.waitForTimeout(150);
        const sigBtn = page.locator('button:has-text("Siguiente"), button:has-text("Finalizar"), button:has-text("Calificar")').first();
        if (await sigBtn.isVisible()) {
          await sigBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '09_app_quiz_resultado.png') });
  } catch (e) {
    console.log('Detalle al responder quiz:', e.message);
  }

  // 5. Portal Docente
  console.log('Capturando Portal Docente...');
  // Cambiar a rol docente primero si es necesario
  await page.evaluate(() => {
    try {
      globalThis.localStorage?.setItem('yapu_sesion_rol', 'docente');
    } catch {
      // Ignorar error si storage está restringido
    }
  });
  await page.goto(`${baseUrl}/docente`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '10_app_portal_docente.png') });

  // 6. Comunidad Ayllu
  console.log('Capturando Comunidad Ayllu...');
  await page.goto(`${baseUrl}/community`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '11_app_comunidad_ayllu.png') });

  // Contexto Móvil (Pixel 5)
  console.log('Capturando en emulación móvil Pixel 5...');
  const contextMobile = await browser.newContext({
    ...devices['Pixel 5'],
    deviceScaleFactor: 2
  });
  const pageMobile = await contextMobile.newPage();

  // Portada móvil
  await pageMobile.goto(baseUrl, { waitUntil: 'networkidle' });
  await pageMobile.screenshot({ path: path.join(outDir, '12_app_movil_portada.png') });

  // Lección móvil
  await pageMobile.goto(`${baseUrl}/lesson/1`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: path.join(outDir, '13_app_movil_leccion.png') });

  // Tablero móvil
  await pageMobile.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(500);
  await pageMobile.screenshot({ path: path.join(outDir, '14_app_movil_tablero.png') });

  await browser.close();
  console.log('Todas las capturas se guardaron exitosamente en:', outDir);
}

capturar().catch(err => {
  console.error('Error capturando:', err);
  process.exit(1);
});
