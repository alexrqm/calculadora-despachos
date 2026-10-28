import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, calcularDespacho } from '../dist/tarifas.mjs';

test('tarifa fija, extremos y todos los ejemplos entregados', () => {
  for (const [km, neto] of [[0, 120000], [25, 120000], [50, 120000], [60, 145000], [70, 170000], [80, 195000], [90, 220000], [100, 220000], [110, 220000], [120, 220000], [130, 250000], [140, 280000], [150, 310000], [160, 340000], [180, 340000], [200, 340000], [210, 368000], [225, 410000], [240, 452000], [250, 480000], [275, 480000], [300, 480000]]) {
    const result = calcularDespacho(km);
    assert.equal(result.estado, 'calculado');
    assert.equal(result.despachoNeto, neto, `${km} km`);
    assert.equal(result.total, neto + Math.round(neto * CONFIG.iva));
  }
});

test('Chiloé integra la base imponible y coincide con el ejemplo definitivo', () => {
  const result = calcularDespacho(200, true);
  assert.equal(result.despachoNeto, 340000);
  assert.equal(result.recargoChiloe, 30000);
  assert.equal(result.totalNeto, 370000);
  assert.equal(result.iva, 70300);
  assert.equal(result.total, 440300);
  assert.equal(calcularDespacho(200, false).recargoChiloe, 0);
});

test('decimales, continuidad y monotonicidad a ambos lados de los límites', () => {
  assert.equal(calcularDespacho(70.5).despachoNeto, 171250);
  for (const [limite, neto, tipo] of [[50, 120000, 'fijo'], [90, 220000, 'fijo'], [120, 220000, 'fijo'], [160, 340000, 'fijo'], [200, 340000, 'fijo'], [250, 480000, 'fijo'], [300, 480000, 'fijo']]) {
    const antes = calcularDespacho(limite - 0.001).despachoNeto;
    const exacto = calcularDespacho(limite).despachoNeto;
    assert.equal(exacto, neto, `${limite} km`);
    assert.equal(calcularDespacho(limite).tramo.tipo, tipo, `tramo en ${limite} km`);
    if (limite === 300) {
      assert.equal(antes, exacto);
      assert.equal(calcularDespacho(limite + 0.001).estado, 'especial');
      continue;
    }
    const despues = calcularDespacho(limite + 0.001).despachoNeto;
    assert.ok(antes <= exacto && exacto <= despues);
    assert.ok(despues - antes <= 3);
  }
});

test('mesetas y subidas aplican el tramo correcto, con Chiloé antes del IVA', () => {
  for (const [km, tipo] of [[50.01, 'progresivo'], [89.99, 'progresivo'], [90, 'fijo'], [119.99, 'fijo'], [120.01, 'progresivo'], [159.99, 'progresivo'], [160, 'fijo'], [199.99, 'fijo'], [200.01, 'progresivo'], [249.99, 'progresivo'], [250, 'fijo'], [299.99, 'fijo']]) {
    const result = calcularDespacho(km, true);
    assert.equal(result.tramo.tipo, tipo, `${km} km`);
    assert.equal(result.totalNeto, result.despachoNeto + CONFIG.recargoChiloe);
    assert.equal(result.iva, Math.round(result.totalNeto * CONFIG.iva));
    assert.equal(result.total, result.totalNeto + result.iva);
  }
});

test('distancias superiores al límite no generan importes, incluso con Chiloé', () => {
  for (const km of [300.01, 301, 1000]) {
    for (const chiloe of [false, true]) {
      const result = calcularDespacho(km, chiloe);
      assert.equal(result.estado, 'especial');
      assert.equal(result.total, undefined);
      assert.equal(result.totalNeto, undefined);
    }
  }
});

test('rechaza entradas negativas, no numéricas o no finitas', () => {
  for (const km of [-0.01, -10, NaN, Infinity, -Infinity, undefined, null, '', '200']) {
    assert.equal(calcularDespacho(km).estado, 'invalido');
  }
});
