import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, calcularDespacho } from '../dist/tarifas.mjs';

test('tarifa fija, extremos y todos los ejemplos entregados', () => {
  for (const [km, neto] of [[0, 120000], [25, 120000], [50, 120000], [70, 148571], [100, 191429], [120, 220000], [150, 265000], [180, 310000], [200, 340000], [250, 410000], [300, 480000]]) {
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
  assert.equal(calcularDespacho(70.5).despachoNeto, 149286);
  for (const limite of CONFIG.limitesKm.slice(0, -1)) {
    const antes = calcularDespacho(limite - 0.001).despachoNeto;
    const exacto = calcularDespacho(limite).despachoNeto;
    const despues = calcularDespacho(limite + 0.001).despachoNeto;
    assert.ok(antes <= exacto && exacto <= despues);
    assert.ok(despues - antes <= 4);
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
