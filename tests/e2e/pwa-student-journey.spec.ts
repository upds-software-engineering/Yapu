import { test, expect } from '@playwright/test';

test.describe('Nivel 3: Pruebas E2E de Pantallas de Usuario - PWA YAPU', () => {

  test('01. Pantalla de Inicio (Landing Page): Carga y branding cultural', async ({ page }) => {
    await page.goto('/');
    
    // Verificar titulo y elementos clave
    await expect(page).toHaveTitle(/YAPU/i);
    await expect(page.locator('text=Plataforma Web Progresiva')).toBeVisible();

    // Verificar navegacion hacia el Dashboard de Progreso (adaptativo Desktop y Mobile)
    const dashboardLink = page.locator('a[href="/dashboard"]:visible').first();
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('02. Pantalla de Tablero (Dashboard) y Métricas del Estudiante', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar navegacion visible
    const nav = page.locator('nav:visible').first();
    await expect(nav).toBeVisible();

    // Verificar encabezado del dashboard
    await expect(page.locator('text=Tablero del Estudiante')).toBeVisible();
    await expect(page.locator('text=Allianllachu, Yachaq!')).toBeVisible();

    // Verificar boton de regreso / continuar al mapa
    const continueBtn = page.locator('a[href="/"]:visible').first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('03. Pantalla de Leccion (Flashcards): Interacción y volteo de tarjeta', async ({ page }) => {
    await page.goto('/lesson/1');

    // Verificar que carga la leccion del nivel 1
    await expect(page.locator('text=Nivel 1:')).toBeVisible();

    // Interactuar con la tarjeta (volteo para ver traduccion al hacer click)
    const flashcard = page.locator('text=Toca para ver traducción');
    await expect(flashcard).toBeVisible();
    await flashcard.click();
    await expect(page.locator('text=Significado en Español')).toBeVisible();

    // Boton de aprendizaje
    const markButton = page.locator('button:has-text("¡Ya me la sé!")');
    await expect(markButton).toBeVisible();
    await markButton.click();

    // Boton para ir a la evaluacion del nivel
    const quizLink = page.locator('a[href="/quiz/1"]').first();
    await expect(quizLink).toBeVisible();
  });

  test('04. Pantalla de Evaluación (Quiz Runner): Flujo completo de 10 preguntas y calificación', async ({ page }) => {
    await page.goto('/quiz/1');

    // Esperar que cargue el quiz con la primera pregunta
    await expect(page.locator('text=Pregunta 1 de 10')).toBeVisible({ timeout: 10000 });

    // Responder secuencialmente las 10 preguntas
    for (let i = 1; i <= 10; i++) {
      // Seleccionar la primera opcion disponible
      const firstOption = page.locator('div.space-y-3 button').first();
      await firstOption.click();

      // Boton siguiente o calificar
      if (i < 10) {
        const nextBtn = page.locator('button:has-text("Siguiente Pregunta")');
        await nextBtn.click();
        await expect(page.locator(`text=Pregunta ${i + 1} de 10`)).toBeVisible({ timeout: 5000 });
      } else {
        const finishBtn = page.locator('button:has-text("Calificar Evaluación")');
        await finishBtn.click();
      }
    }

    // Verificar que aparece la pantalla de resultados de evaluacion
    const resultHeader = page.locator('text=% de Aciertos');
    await expect(resultHeader).toBeVisible({ timeout: 10000 });

    // Verificar boton de retorno al mapa de niveles
    const returnBtn = page.locator('a:has-text("Ver Mapa de Niveles")');
    await expect(returnBtn).toBeVisible();
  });

  test('05. Pantallas Administrativas: Gestión Docente y Comunidad', async ({ page }) => {
    // Probar panel docente
    await page.goto('/docente');
    await expect(page.locator('text=Panel de Gestión Docente')).toBeVisible();
    await expect(page.locator('button:has-text("Oraciones Base")')).toBeVisible();

    // Probar seccion de comunidad
    await page.goto('/community');
    await expect(page.locator('text=Retos de la Comunidad')).toBeVisible();
    await expect(page.locator('text=Publicar un Reto Lingüístico')).toBeVisible();
  });

});
