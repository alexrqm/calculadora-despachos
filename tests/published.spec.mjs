import { test, expect } from '@playwright/test';

const moneda = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

test('versión pública: carga, estilos, cálculos, Chiloé y cotización especial', async ({ page, request, baseURL }, testInfo) => {
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (req) => failedRequests.push(`${req.url()}: ${req.failure()?.errorText}`));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });

  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Calculadora de Despachos | Inductometal');
  await expect(page.locator('h1')).toHaveText('Calculadora de Despachos');
  await expect(page.locator('#tariffRows tr')).toHaveCount(7);
  await expect(page.locator('#tariffRows tr').filter({ hasText: 'Tarifa fija' })).toHaveCount(4);
  await expect(page.locator('#tariffRows tr').filter({ hasText: 'Progresivo' })).toHaveCount(3);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(12, 17, 20)');
  await expect(page.locator('#totalResult')).toHaveCSS('font-weight', '700');
  expect(await page.locator('.brand-logo').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  for (const asset of ['dist/styles.css', 'dist/app.js', 'dist/tarifas.mjs', 'dist/logo.png']) {
    const assetResponse = await request.get(new URL(asset, baseURL).href);
    expect(assetResponse.status(), asset).toBe(200);
  }
  const publishedConfig = await request.get(new URL('dist/tarifas.mjs', baseURL).href);
  const { readFile } = await import('node:fs/promises');
  expect(await publishedConfig.text()).toBe(await readFile(new URL('../dist/tarifas.mjs', import.meta.url), 'utf8'));

  const distance = page.getByLabel('Distancia del despacho', { exact: true });
  await expect(page.locator('#totalResult')).toHaveText('—');
  for (const [km, neto, total] of [[0, 120000, 142800], [50, 120000, 142800], [60, 145000, 172550], [70, 170000, 202300], [80, 195000, 232050], [90, 220000, 261800], [100, 220000, 261800], [110, 220000, 261800], [120, 220000, 261800], [130, 250000, 297500], [140, 280000, 333200], [150, 310000, 368900], [160, 340000, 404600], [180, 340000, 404600], [200, 340000, 404600], [210, 368000, 437920], [225, 410000, 487900], [240, 452000, 537880], [250, 480000, 571200], [275, 480000, 571200], [300, 480000, 571200]]) {
    await distance.fill(String(km));
    await expect(page.locator('#dispatchResult')).toHaveText(moneda(neto));
    await expect(page.locator('#totalResult')).toHaveText(moneda(total));
  }
  for (const [km, neto] of [[49.99, 120000], [50.01, 120025], [89.99, 219975], [90.01, 220000], [119.99, 220000], [120.01, 220030], [159.99, 339970], [160.01, 340000], [199.99, 340000], [200.01, 340028], [249.99, 479972], [250.01, 480000], [299.99, 480000]]) {
    await distance.fill(String(km));
    await expect(page.locator('#dispatchResult')).toHaveText(moneda(neto));
  }
  await distance.fill('90');
  await expect(page.locator('#tierResult')).toHaveText('Desde 90 hasta 120 km');
  await distance.fill('160');
  await expect(page.locator('#tierResult')).toHaveText('Desde 160 hasta 200 km');
  await distance.fill('250');
  await expect(page.locator('#tierResult')).toHaveText('Desde 250 hasta 300 km');
  await distance.fill('200');
  await page.getByRole('switch', { name: 'Chiloé' }).check();
  await expect(page.locator('#chiloeResult')).toHaveText(moneda(30000));
  await expect(page.locator('#netResult')).toHaveText(moneda(370000));
  await expect(page.locator('#vatResult')).toHaveText(moneda(70300));
  await expect(page.locator('#totalResult')).toHaveText(moneda(440300));

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('despacho-chiloe.png'), fullPage: true });
  await testInfo.attach('Vista de la calculadora publicada', { path: testInfo.outputPath('despacho-chiloe.png'), contentType: 'image/png' });

  await distance.fill('300.01');
  await expect(page.locator('#statusNote')).toHaveText('Distancia superior a 300 km — solicitar cotización especial.');
  await expect(page.locator('#totalResult')).toHaveText('—');
  await expect(page.locator('#dispatchResult')).toHaveText('—');
  await expect(page.locator('#chiloeRow')).toBeHidden();
  await distance.fill('200');
  await expect(page.locator('#totalResult')).toHaveText(moneda(440300));
  await page.getByRole('switch', { name: 'Chiloé' }).uncheck();
  await expect(page.locator('#totalResult')).toHaveText(moneda(404600));
  await distance.fill('-1');
  await expect(distance).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#totalResult')).toHaveText('—');
  await page.getByRole('button', { name: 'Reiniciar' }).click();
  await expect(distance).toHaveValue('');
  await expect(page.locator('#totalResult')).toHaveText('—');
  expect(failedRequests, 'Solicitudes de red fallidas').toEqual([]);
  expect(errors, 'Errores de consola, JavaScript o recursos').toEqual([]);
});
