// CONFIGURACIÓN CENTRAL: modificar tarifas y límites solamente aquí.
export const CONFIG = Object.freeze({
  hasta50: 120000,
  hasta120: 220000,
  hasta200: 340000,
  hasta300: 480000,
  recargoChiloe: 30000,
  iva: 0.19,
  limitesKm: Object.freeze([50, 120, 200, 300]),
});

export const TRAMOS = Object.freeze(
  [CONFIG.hasta50, CONFIG.hasta120, CONFIG.hasta200, CONFIG.hasta300].map((neto, i, precios) =>
    Object.freeze({
      desde: i === 0 ? 0 : CONFIG.limitesKm[i - 1],
      hasta: CONFIG.limitesKm[i],
      netoDesde: i === 0 ? neto : precios[i - 1],
      netoHasta: neto,
    }),
  ),
);

export function calcularDespacho(km, chiloe = false) {
  if (typeof km !== 'number' || !Number.isFinite(km) || km < 0) {
    return { estado: 'invalido' };
  }
  const tramo = TRAMOS.find((item) => km <= item.hasta);
  if (!tramo) return { estado: 'especial', km };

  // Interpolación exacta entre extremos; redondeo a pesos al cerrar el neto.
  const proporcion = (km - tramo.desde) / (tramo.hasta - tramo.desde);
  const despachoNeto = Math.round(tramo.netoDesde + proporcion * (tramo.netoHasta - tramo.netoDesde));
  const recargoChiloe = chiloe ? CONFIG.recargoChiloe : 0;
  const totalNeto = despachoNeto + recargoChiloe;
  const iva = Math.round(totalNeto * CONFIG.iva);
  return { estado: 'calculado', km, tramo, despachoNeto, recargoChiloe, totalNeto, iva, total: totalNeto + iva };
}
