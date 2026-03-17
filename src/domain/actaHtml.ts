/**
 * Generador de Acta HTML → PDF Oficio — CERTIMAR 1511
 * Toma el template oficial 110XXXDD_MM_AAACTA.html, sustituye todos los
 * placeholders y abre una ventana de impresión en tamaño Oficio (215.9×355.6mm).
 */

import actaTemplate from '../assets/acta-template.html?raw';
import type { AppState } from '../types';
import { calculateDenaturation, calculateStorage } from './calculations';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// ---------------------------------------------------------------------------
// Helpers de reemplazo
// ---------------------------------------------------------------------------

/** Placeholder directo dentro de un span: {key} */
function rep(html: string, from: string, to: string): string {
  return html.split(from).join(to);
}

/**
 * Placeholder fragmentado en 3 spans consecutivos (generado por Google Docs):
 *   <span class="c10">{</span><span class="c10">key</span><span class="c10">}</span>
 * Lo colapsa en un único span con el valor.
 */
function repSplit(html: string, key: string, value: string): string {
  // La clase del span puede variar — usamos regex flexible
  const re = new RegExp(
    `<span[^>]*>\\{<\\/span><span[^>]*>${key}<\\/span><span[^>]*>\\}<\\/span>`,
    'g'
  );
  return html.replace(re, `<span class="c10">${value}</span>`);
}

// CSS inyectado para impresión oficio + alineación de tablas
const PRINT_CSS = `
<style id="certimar-print">
  @page {
    size: 215.9mm 355.6mm;
    /* margin:0 suprime cabecera/pie del navegador */
    margin: 0;
  }

  /* ── Párrafos: eliminar márgenes que agrega el navegador ── */
  p { margin-top: 0 !important; margin-bottom: 0 !important; }

  /* ── Todas las tablas: mismo ancho de página ── */
  table { width: 100% !important; }

  /* ── Firma del certificador: espacio, izquierda con sangría ── */
  td.c120:has(p.c83) {
    vertical-align: top !important;
    padding-top: 8pt !important;
    padding-bottom: 8pt !important;
    padding-left: 12pt !important;
    height: 52pt !important;
  }
  td.c120 p.c83 {
    text-align: left !important;
    margin-bottom: 3pt !important;
    line-height: 1.5 !important;
  }

  /* ── Impresión: zoom 0.80 para caber en oficio ── */
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #certimar-banner { display: none !important; }
    html { zoom: 0.80; }
    body { margin: 10mm 8mm !important; padding: 0 !important; }
  }
</style>
`;

// ---------------------------------------------------------------------------
// Builder principal
// ---------------------------------------------------------------------------

export function buildActaHtml(state: AppState): string {
  const { general: g, extraction: ext, denaturation: den, storage: sto } = state;
  const cc   = g.centro_cultivo;
  const cert = g.certificador;

  const calcDen = calculateDenaturation(
    den.equipos, den.parametros_batch, den.parametros_incineracion, den.incinerador
  );
  const calcSto = calculateStorage(sto.parametros);

  const siNo = (b: boolean) => b ? 'Si' : 'No';
  const na   = 'N/A';

  // Fecha de emisión → partes
  const [anio = '2026', mesStr = '01', diaStr = '01'] = g.fechas.emision_certificado.split('-');
  const dia = diaStr.replace(/^0/, '');
  const mes = MESES_ES[parseInt(mesStr, 10) - 1] ?? '';

  // Nro registro corto: "DN-02727" desde "DN-02727/2023" o "DN-02727-2023"
  const regShort = cert.numero_registro.replace(/[-\/]\d{4}$/, '');

  // Cálculos observación ensilaje
  const total_min  = den.equipos.horas_funcionamiento_dia * 60;
  const batchDur   = calcDen.duracion_total_batch_min;
  const numBatches = calcDen.numero_batches_dia;
  const capKg      = numBatches * den.parametros_batch.kilos_por_batch;

  const inc       = den.incinerador;
  const incActivo = inc?.activo === true;

  let html = actaTemplate;

  // ── Inyectar CSS de impresión oficio ─────────────────────────────────────
  html = html.replace('</head>', PRINT_CSS + '</head>');

  // ── Fecha elaboración acta (línea completa con año hardcodeado) ───────────
  html = rep(html,
    '{dia_generacion_acta} de &nbsp;{mes_generacion_acta}de 2026',
    `${dia} de &nbsp;${mes} de ${anio}`
  );

  // ── B. Centro de cultivo ──────────────────────────────────────────────────
  html = rep(html, '{codigo_RNA}',     cc.codigo_centro);
  html = rep(html, '{nombre_titular}', cc.titular);
  html = rep(html, '{nombre_centro}',  cc.nombre_centro);
  html = rep(html, '{ACS}',            cc.acs);

  // ── C. Evaluación documental ──────────────────────────────────────────────
  html = rep(html, '{fecha_generacion_acta}', g.fechas.evaluacion_documental);

  // ── D. Verificación en terreno ────────────────────────────────────────────
  html = rep(html, '{fecha_inspeccion_terreno}', g.fechas.inspeccion_terreno);

  // ── E. Extracción ─────────────────────────────────────────────────────────
  html = rep(html, '{jaulas_simult}',   ext.parametros.jaulas_simultaneas.toString());
  html = rep(html, '{cfm}',             ext.parametros.potencia_cfm.toString());
  html = rep(html, '{nro_jaulas}',      ext.parametros.numero_total_jaulas.toString());
  html = rep(html, '{linea_extraccion}',
    ext.parametros.marca_equipo || ext.parametros.sistema_principal
  );

  // ── F. Desnaturalización — ensilaje ───────────────────────────────────────
  html = rep(html, '{modelo_prepicador}',     den.equipos.marca_modelo || na);
  html = rep(html, '{cuenta_con_prepicador}', siNo(den.equipos.cuenta_con_prepicador));
  html = rep(html, '{capacidad_prepicador}',
    den.equipos.cuenta_con_prepicador
      ? den.equipos.capacidad_prepicador_kg_hr.toString()
      : na
  );
  html = rep(html, '{velocidad_olla_trituradora}', den.equipos.velocidad_nominal_kg_hr.toString());
  html = rep(html, '{hrs_trabajo}',               den.equipos.horas_funcionamiento_dia.toString());

  // Observación ensilaje — reemplaza números hardcodeados del template
  html = rep(html,
    '(kg/batch=1400 -- Horas de trabajo diari&iacute;o: 9 = 540 min)',
    `(kg/batch=${den.parametros_batch.kilos_por_batch} -- Horas de trabajo diario: ${den.equipos.horas_funcionamiento_dia} = ${total_min} min)`
  );
  html = rep(html,
    'Duraci&oacute;n total por batch: 23 min + 10.6 min = 33,6 min / N&uacute;mero de batches por d&iacute;a: 540 &divide; 33,6 = 16,07 batches',
    `Duración total por batch: ${batchDur.toFixed(1)} min / Número de batches por día: ${total_min} ÷ ${batchDur.toFixed(1)} = ${numBatches.toFixed(2)} batches`
  );
  html = rep(html,
    'Capacidad diaria: 1.400 kg * 16,07 = 22.500 kg = 22,5 toneladas',
    `Capacidad diaria: ${den.parametros_batch.kilos_por_batch.toLocaleString('es-CL')} kg × ${numBatches.toFixed(2)} = ${capKg.toFixed(0)} kg = ${calcDen.capacidad_diaria_ton.toFixed(2)} toneladas`
  );

  // ── F. Desnaturalización — incinerador (placeholders fragmentados) ─────────
  repSplit; // ensure function is referenced
  html = repSplit(html, 'marca_incinerador',
    incActivo ? (inc!.marca_modelo || na) : na);
  html = repSplit(html, 'dim_2dra_camara_incinerador',
    incActivo ? (den.parametros_incineracion.camara_secundaria || na) : na);
  html = repSplit(html, 'sistema_carga_incinerador',
    incActivo ? (inc!.sistema_carga || na) : na);
  html = repSplit(html, 'tem_2da_camara_incinerador',
    incActivo ? (den.parametros_incineracion.temperatura_operacion || na) : na);
  // dim_1ra es directo (no fragmentado)
  html = rep(html,     '{dim_1ra_camara_incinerador}',
    incActivo ? (den.parametros_incineracion.camara_primaria || na) : na);
  html = repSplit(html, 'quemadores_2da_camara_incinerador', na);
  html = repSplit(html, 'quemadores_1ra_camara_incinerador', na);
  html = repSplit(html, 'temp_funcionamiento_incinerador',
    incActivo ? (den.parametros_incineracion.temperatura_operacion || na) : na);
  html = repSplit(html, 'capacidada_incinerador',
    incActivo ? (inc!.capacidad_carga_kg_h?.toString() || na) : na);
  html = repSplit(html, 'horas_funcionamiento_incinerador',
    incActivo ? (inc!.horas_funcionamiento_dia?.toString() || na) : na);
  html = repSplit(html, 'requerimienoa_incinerador',       na);
  html = repSplit(html, 'sistema_descarga_incinerador',
    incActivo ? (inc!.sistema_descarga || na) : na);
  html = repSplit(html, 'disposicion_final',
    incActivo ? (inc!.disposicion_final || na) : na);
  html = repSplit(html, 'capacidad_almacenamiento_gas',
    incActivo ? (inc!.almacenamiento_gas || na) : na);
  html = repSplit(html, 'incinerador_sistema_primario_o_scndario',
    incActivo ? (inc!.observaciones || na) : na);

  // ── G. Almacenamiento (placeholders directos de un solo span) ─────────────
  html = rep(html, '{capacidad_almacenamiento*1.2}', calcSto.capacidad_almacenaje_ton.toFixed(2));
  html = rep(html, '{capacidad_almacenamiento}',     sto.parametros.capacidad_almacenaje_m3.toString());

  // ── A. Certificador (sección encabezado + firma) ──────────────────────────
  html = rep(html, 'ENGELBERT FLORES CARRIO',         cert.nombre.toUpperCase());
  html = rep(html, 'Engelbert Flores Carrio',          cert.nombre);
  html = rep(html, 'DN-02727-2023',                   cert.numero_registro);
  html = rep(html, 'Sistema de Mortalidad DN-02727',  `Sistema de Mortalidad ${regShort}`);
  html = rep(html, '13.968.696-9',                    cert.rut);  // aparece 2 veces

  return html;
}

// ---------------------------------------------------------------------------
// Descarga / Impresión
// ---------------------------------------------------------------------------

/**
 * Abre el acta en una ventana emergente lista para imprimir/guardar como PDF.
 * El @page declarado en el CSS configura el tamaño Oficio (215.9 × 355.6 mm).
 */
export function downloadActaHtml(state: AppState): void {
  const html = buildActaHtml(state);
  const cc   = state.general.centro_cultivo;
  const [anio = '', mesStr = '', diaStr = ''] =
    state.general.fechas.emision_certificado.split('-');
  const aa = anio.slice(2);
  const filename = `${cc.codigo_centro}_${diaStr}_${mesStr}_${aa}-ACTA`;

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    alert('Activa las ventanas emergentes para este sitio y vuelve a intentarlo.');
    return;
  }

  // Banner de instrucciones (se oculta al imprimir via @media print)
  const banner = `
    <div id="certimar-banner" style="
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:#1e3a5f; color:#fff; font-family:sans-serif;
      font-size:13px; padding:10px 20px;
      display:flex; align-items:center; justify-content:space-between;
      box-shadow:0 2px 8px rgba(0,0,0,.4);">
      <span>⚠️ Para guardar como PDF: desactiva <strong>«Encabezados y pies de página»</strong> en el diálogo de impresión.</span>
      <button onclick="window.print()" style="
        background:#f0a500; border:none; color:#000; font-weight:bold;
        padding:6px 16px; border-radius:4px; cursor:pointer; font-size:13px;">
        🖨️ Imprimir / Guardar PDF
      </button>
    </div>
    <div style="height:44px"></div>`;

  const htmlWithBanner = html.replace('<body', '<body').replace(
    /(<body[^>]*>)/,
    `$1${banner}`
  );

  win.document.open();
  win.document.write(htmlWithBanner);
  win.document.close();

  win.onload = () => {
    win.document.title = filename;
  };
}

// ---------------------------------------------------------------------------
// Generación de PDF vía impresión nativa del navegador
// ---------------------------------------------------------------------------

/**
 * Abre el acta en una ventana emergente y dispara automáticamente el diálogo
 * de impresión. El usuario solo debe elegir "Guardar como PDF" y confirmar.
 * El motor de impresión del navegador admite oklch y todos los CSS modernos.
 */
export function generateActaPdf(
  state: AppState,
  onProgress?: (msg: string) => void
): void {
  const html = buildActaHtml(state);
  const cc   = state.general.centro_cultivo;
  const [anio = '', mesStr = '', diaStr = ''] =
    state.general.fechas.emision_certificado.split('-');
  const aa = anio.slice(2);
  const filename = `${cc.codigo_centro}_${diaStr}_${mesStr}_${aa}-ACTA`;

  onProgress?.('Abriendo ventana de impresión…');

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    alert('Activa las ventanas emergentes para este sitio y vuelve a intentarlo.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    win.document.title = filename;
    // Pequeño retraso para que fuentes y estilos terminen de aplicarse
    setTimeout(() => win.print(), 400);
  };
}
