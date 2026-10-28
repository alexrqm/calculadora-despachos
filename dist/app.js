import { CONFIG, TRAMOS, calcularDespacho } from './tarifas.mjs';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 10 });
const porcentaje = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 2 });
const get = (id) => document.getElementById(id);
const distance = get('distance');
const chiloe = get('chiloe');
const limite = CONFIG.limitesKm.at(-1);
const textoTramo = (tramo) => tramo.desde === 0
  ? `Hasta ${numero.format(tramo.hasta)} km`
  : tramo.tipo === 'fijo'
    ? `Desde ${numero.format(tramo.desde)} hasta ${numero.format(tramo.hasta)} km`
    : `Más de ${numero.format(tramo.desde)} y menos de ${numero.format(tramo.hasta)} km`;
const cotizacionEspecial = `Distancia superior a ${numero.format(limite)} km — solicitar cotización especial.`;

get('surchargeLabel').textContent = `+${clp.format(CONFIG.recargoChiloe)} netos`;
get('vatLabel').textContent = `IVA ${porcentaje.format(CONFIG.iva)}`;
get('tariffNote').textContent = `Los tramos progresivos aumentan proporcionalmente por kilómetro; los tramos fijos mantienen su valor. Sobre ${numero.format(limite)} km se requiere cotización especial. A las tarifas netas se agrega IVA ${porcentaje.format(CONFIG.iva)}.`;

for (const [index, tramo] of TRAMOS.entries()) {
  const row = document.createElement('tr');
  row.dataset.tier = index;
  const fijo = tramo.tipo === 'fijo';
  const values = [textoTramo(tramo), fijo ? clp.format(tramo.netoHasta) : `${clp.format(tramo.netoDesde)} a ${clp.format(tramo.netoHasta)}`, fijo ? 'Tarifa fija' : 'Progresivo'];
  for (const text of values) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.append(cell);
  }
  get('tariffRows').append(row);
}

function actualizar() {
  const vacio = distance.value.trim() === '' && !distance.validity.badInput;
  const km = distance.valueAsNumber;
  const resultado = vacio ? { estado: 'vacio' } : calcularDespacho(km, chiloe.checked);
  const invalido = resultado.estado === 'invalido';
  const calculado = resultado.estado === 'calculado';
  const especial = resultado.estado === 'especial';
  distance.setAttribute('aria-invalid', String(invalido));
  get('distanceError').hidden = !invalido;
  get('distanceError').textContent = invalido ? 'Ingresa una distancia válida, igual o mayor que cero.' : '';
  get('statusNote').textContent = especial ? cotizacionEspecial : calculado ? 'Cálculo actualizado. Todos los valores se muestran en pesos chilenos.' : invalido ? 'Revisa la distancia para continuar.' : 'Ingresa una distancia para ver el resultado.';
  get('statusNote').classList.toggle('special', especial);
  get('distanceResult').textContent = calculado || especial ? `${numero.format(km)} km` : '—';
  get('tierResult').textContent = calculado ? textoTramo(resultado.tramo) : especial ? `Más de ${numero.format(limite)} km` : '—';
  for (const [id, valor] of [['dispatchResult', resultado.despachoNeto], ['chiloeResult', resultado.recargoChiloe], ['netResult', resultado.totalNeto], ['vatResult', resultado.iva], ['totalResult', resultado.total]]) {
    get(id).textContent = calculado ? clp.format(valor) : '—';
  }
  get('chiloeRow').hidden = !calculado || !chiloe.checked;
  get('totalCaption').textContent = especial ? 'Solicitar cotización especial' : calculado ? `Incluye IVA ${porcentaje.format(CONFIG.iva)}` : 'Completa la distancia del despacho';
  for (const row of get('tariffRows').children) {
    row.classList.toggle('active-tier', calculado && TRAMOS[Number(row.dataset.tier)] === resultado.tramo);
  }
}

distance.addEventListener('input', actualizar);
chiloe.addEventListener('change', actualizar);
get('resetButton').addEventListener('click', () => {
  distance.value = '';
  chiloe.checked = false;
  actualizar();
  distance.focus();
});
actualizar();
