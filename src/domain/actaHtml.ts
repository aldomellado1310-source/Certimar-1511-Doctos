/**
 * Generador de Acta HTML → PDF Oficio — CERTIMAR 1511
 * Toma el template oficial 110XXXDD_MM_AAACTA.html, sustituye todos los
 * placeholders y abre una ventana de impresión en tamaño Oficio (215.9×355.6mm).
 */

import actaTemplate from '../assets/acta-template.html?raw';
import type { AppState } from '../types';
import { calculateExtraction, calculateDenaturation, calculateStorage } from './calculations';

/**
 * Convierte oklch(L C H) a hex #rrggbb.
 * Necesario porque html2canvas no soporta oklch (Tailwind v4).
 */
function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  const l3 = l_ ** 3, m3 = m_ ** 3, s3 = s_ ** 3;
  let r =  4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  const gamma = (x: number) => x >= 0.0031308 ? 1.055 * x ** (1 / 2.4) - 0.055 : 12.92 * x;
  const toHex = (x: number) => Math.round(Math.max(0, Math.min(1, gamma(x))) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/** Reemplaza todas las ocurrencias de oklch(...) en un string CSS con hex. */
export function patchOklch(css: string): string {
  return css.replace(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\s*\)/g,
    (_, l, c, h) => oklchToHex(parseFloat(l), parseFloat(c), parseFloat(h))
  );
}

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// ---------------------------------------------------------------------------
// Helpers de reemplazo
// ---------------------------------------------------------------------------

/** Escapes HTML special characters to prevent XSS in document.write/iframeDoc.write contexts. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

  const calcExt = calculateExtraction(ext.parametros);
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
  const nOllasCalc = den.equipos.cantidad_ollas > 0 ? den.equipos.cantidad_ollas : 1;
  const capKg      = numBatches * den.parametros_batch.kilos_por_batch * nOllasCalc;
  const glosaOllas = nOllasCalc > 1 ? ` × ${nOllasCalc} ollas trituradoras en paralelo` : '';

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
  html = rep(html, '{codigo_RNA}',     escHtml(cc.codigo_centro));
  html = rep(html, '{nombre_titular}', escHtml(cc.titular));
  html = rep(html, '{nombre_centro}',  escHtml(cc.nombre_centro));
  html = rep(html, '{ACS}',            escHtml(cc.acs));

  // ── C. Evaluación documental ──────────────────────────────────────────────
  html = rep(html, '{fecha_generacion_acta}', g.fechas.evaluacion_documental);

  // ── D. Verificación en terreno ────────────────────────────────────────────
  html = rep(html, '{fecha_inspeccion_terreno}', g.fechas.inspeccion_terreno);

  // ── E. Extracción — sistemas de apoyo ────────────────────────────────────
  const isAuto  = ext.sistemas_apoyo?.automatica ?? true;
  const isBuceo = ext.sistemas_apoyo?.buceo       ?? false;
  const isYoma  = ext.sistemas_apoyo?.succion_yoma ?? false;
  const isRov   = ext.sistemas_apoyo?.rov          ?? false;
  const capacity = calcExt.capacidad_diaria_ton.toFixed(2) + ' ton/día';

  // AUTOMÁTICA: SI/NO + ton/día
  if (isAuto) {
    html = rep(html, 'TON/DIA', capacity);
  } else {
    html = rep(html,
      '<p class="c139"><span class="c12 c10">SI</span></p>',
      '<p class="c139"><span class="c12 c10">NO</span></p>'
    );
    html = rep(html, 'TON/DIA', '');
  }

  // BUCEO: NO→SI + ton/día + datos equipo
  if (isBuceo) {
    html = rep(html,
      '<p class="c149"><span class="c12 c10">NO</span></p></td><td class="c85" colspan="1" rowspan="2"><p class="c13"><span class="c12 c10"></span></p>',
      `<p class="c149"><span class="c12 c10">SI</span></p></td><td class="c85" colspan="1" rowspan="2"><p class="c13"><span class="c12 c10">${capacity}</span></p>`
    );
    html = rep(html, '<p class="c169"><span class="c12 c10">N/A</span>', `<p class="c169"><span class="c12 c10">${ext.parametros.n_teams_buceo ?? 1}</span>`);
    html = rep(html, '<p class="c200"><span class="c12 c10">N/A</span>', `<p class="c200"><span class="c12 c10">${ext.parametros.n_buzos_por_team ?? 4}</span>`);
    html = rep(html, '<p class="c157"><span class="c12 c10">N/A</span>', `<p class="c157"><span class="c12 c10">${escHtml(ext.parametros.periodicidad_buceo || 'DIARIA')}</span>`);
  }

  // YOMA: NO→SI
  if (isYoma) {
    html = rep(html,
      '<p class="c128"><span class="c12 c10">NO</span>',
      '<p class="c128"><span class="c12 c10">SI</span>'
    );
  }

  // ROV: NO→SI
  if (isRov) {
    html = rep(html,
      '<p class="c158"><span class="c10">NO</span>',
      '<p class="c158"><span class="c10">SI</span>'
    );
  }

  // N° motocompresores/jaula
  html = rep(html,
    '<span class="c10">1</span></p></td></tr><tr class="c20"><td class="c66 c39"',
    `<span class="c10">${isAuto ? ext.parametros.motocompresores_por_jaula : na}</span></p></td></tr><tr class="c20"><td class="c66 c39"`
  );
  html = rep(html, '{jaulas_simult}', ext.parametros.jaulas_simultaneas.toString());
  html = rep(html, '{cfm}',           isAuto && ext.parametros.potencia_cfm > 0 ? ext.parametros.potencia_cfm.toString() : na);
  // Observaciones de extracción — usa el campo editable del estado (puede haber sido modificado por el usuario)
  const nroJaulas = ext.parametros.numero_total_jaulas.toString();
  const lineaExt  = escHtml(ext.parametros.marca_equipo || ext.parametros.sistema_principal);
  const glosa = ext.parametros.observacion_sistema
    ? escHtml(ext.parametros.observacion_sistema)
    : `Sistema Automático; Consta de ${nroJaulas} Lift-up/ ${lineaExt}, 1 por Jaula , con cono extractor el cual está amarrado al fondo de la malla.`;
  html = rep(html,
    'Sistema Autom&aacute;tico; Consta de {nro_jaulas} &nbsp;Lift-up/ {linea_extraccion}, 1 por Jaula , con cono extractor el cual est&aacute; amarrado al fondo de la malla.',
    glosa
  );
  // fallback por si {nro_jaulas}/{linea_extraccion} aparecen en otro lugar del template
  html = rep(html, '{nro_jaulas}',       nroJaulas);
  html = rep(html, '{linea_extraccion}', lineaExt);

  // ── F. Desnaturalización — ensilaje ───────────────────────────────────────
  // "Cantidad de sistemas de ensilaje (N°)" y "Cantidad de trituradoras (olla moledora)"
  // son celdas con valor hardcodeado "1" en el template → se sustituyen por el estado.
  const nSistemas = (den.equipos.cantidad_sistemas ?? 1).toString();
  const nOllas    = (den.equipos.cantidad_ollas ?? 1).toString();
  html = rep(html,
    '<p class="c140"><span class="c12 c10">1</span></p>',
    `<p class="c140"><span class="c12 c10">${nSistemas}</span></p>`
  );
  html = rep(html,
    '<p class="c164"><span class="c10">1</span></p>',
    `<p class="c164"><span class="c10">${nOllas}</span></p>`
  );
  // {modelo_prepicador} = "Identificar proveedor (modelo)" → modelo de la trituradora/sistema ensilaje
  html = rep(html, '{modelo_prepicador}', escHtml(den.equipos.marca_modelo || na));
  html = rep(html, '{cuenta_con_prepicador}', siNo(den.equipos.cuenta_con_prepicador));
  html = rep(html, '{capacidad_prepicador}',
    den.equipos.cuenta_con_prepicador
      ? den.equipos.capacidad_prepicador_kg_hr.toString()
      : na
  );
  // {cantidad_prepicador} = fila "Cantidad prepicador (N° que cuenta el centro)"
  html = rep(html, '{cantidad_prepicador}',
    den.equipos.cuenta_con_prepicador
      ? den.equipos.cantidad_prepicador.toString()
      : na
  );
  html = rep(html, '{velocidad_olla_trituradora}', den.equipos.velocidad_nominal_kg_hr.toString());
  html = rep(html, '{hrs_trabajo}',               den.equipos.horas_funcionamiento_dia.toString());

  // Observación ensilaje — reemplaza números hardcodeados del template
  html = rep(html,
    '(kg/batch=1400 -- Horas de trabajo diar&iacute;o: 9 = 540 min)',
    `(kg/batch=${den.parametros_batch.kilos_por_batch} -- Horas de trabajo diario: ${den.equipos.horas_funcionamiento_dia} = ${total_min} min)`
  );
  html = rep(html,
    'Duraci&oacute;n total por batch: 23 min + 10.6 min = 33,6 min / N&uacute;mero de batches por d&iacute;a: 540 &divide; 33,6 = 16,07 batches',
    `Duración total por batch: ${batchDur.toFixed(1)} min / Número de batches por día: ${total_min} ÷ ${batchDur.toFixed(1)} = ${numBatches.toFixed(2)} batches`
  );
  html = rep(html,
    'Capacidad diaria: 1.400 kg * 16,07 = 22.500 kg = 22,5 toneladas',
    `Capacidad diaria: ${den.parametros_batch.kilos_por_batch.toLocaleString('es-CL')} kg × ${numBatches.toFixed(2)}${glosaOllas} = ${capKg.toFixed(0)} kg = ${calcDen.capacidad_diaria_ton.toFixed(2)} toneladas`
  );

  // ── F. Desnaturalización — incinerador (placeholders fragmentados) ─────────
  repSplit; // ensure function is referenced
  const eInc = (v: string | undefined | null) => escHtml(v || na);
  html = repSplit(html, 'marca_incinerador',
    incActivo ? eInc(inc!.marca_modelo) : na);
  html = repSplit(html, 'dim_2dra_camara_incinerador',
    incActivo ? eInc(den.parametros_incineracion.camara_secundaria) : na);
  html = repSplit(html, 'sistema_carga_incinerador',
    incActivo ? eInc(inc!.sistema_carga) : na);
  html = repSplit(html, 'tem_2da_camara_incinerador',
    incActivo ? (inc!.temperatura_camara_secundaria_c ? escHtml(`${inc!.temperatura_camara_secundaria_c}°C`) : na) : na);
  // dim_1ra es directo (no fragmentado)
  html = rep(html,     '{dim_1ra_camara_incinerador}',
    incActivo ? eInc(den.parametros_incineracion.camara_primaria) : na);
  html = repSplit(html, 'quemadores_2da_camara_incinerador',
    incActivo ? (inc!.num_quemadores_secundaria?.toString() || na) : na);
  html = repSplit(html, 'quemadores_1ra_camara_incinerador',
    incActivo ? (inc!.num_quemadores_primaria?.toString() || na) : na);
  html = repSplit(html, 'temp_funcionamiento_incinerador',
    incActivo ? (inc!.temperatura_camara_primaria_c ? escHtml(`${inc!.temperatura_camara_primaria_c}°C`) : na) : na);
  html = repSplit(html, 'capacidada_incinerador',
    incActivo ? (inc!.capacidad_carga_kg_h?.toString() || na) : na);
  html = repSplit(html, 'horas_funcionamiento_incinerador',
    incActivo ? (inc!.horas_funcionamiento_dia?.toString() || na) : na);
  html = repSplit(html, 'requerimienoa_incinerador',
    incActivo ? eInc(inc!.requerimiento_energetico) : na);
  html = repSplit(html, 'sistema_descarga_incinerador',
    incActivo ? eInc(inc!.sistema_descarga) : na);
  html = repSplit(html, 'disposicion_final',
    incActivo ? eInc(inc!.disposicion_final) : na);
  html = repSplit(html, 'capacidad_almacenamiento_gas',
    incActivo ? eInc(inc!.almacenamiento_gas) : na);
  html = repSplit(html, 'incinerador_sistema_primario_o_scndario',
    incActivo ? eInc(inc!.observaciones) : na);

  // ── G. Almacenamiento (placeholders directos de un solo span) ─────────────
  html = rep(html, '{capacidad_almacenamiento*1.2}', calcSto.capacidad_almacenaje_ton.toFixed(2));
  html = rep(html, '{capacidad_almacenamiento}',     sto.parametros.capacidad_almacenaje_m3.toString());
  // Observaciones de almacenamiento — texto hardcodeado en template (3 spans
  // fragmentados por Google Docs) → se sustituye por el campo editable del estado.
  html = rep(html,
    '<p class="c92"><span class="c12 c10">SE REALIZA EL </span><span class="c10">C&Aacute;LCULO</span><span class="c12 c10">&nbsp;POR DENSIDAD POR DENSIDAD DE &Aacute;CIDO F&Oacute;RMICO 1.2 TN/M3</span></p>',
    `<p class="c92"><span class="c12 c10">${escHtml(sto.parametros.observaciones?.trim() || na)}</span></p>`
  );

  // ── H. Certificación — Observaciones ─────────────────────────────────────
  html = rep(html,
    '<p class="c172"><span class="c12 c10">NO</span></p>',
    `<p class="c172"><span class="c12 c10">${escHtml(g.observaciones_acta?.trim() || 'N/A')}</span></p>`
  );

  // ── A. Certificador (sección encabezado + firma) ──────────────────────────
  html = rep(html, 'ENGELBERT FLORES CARRIO',         escHtml(cert.nombre.toUpperCase()));
  html = rep(html, 'Engelbert Flores Carrio',          escHtml(cert.nombre));
  html = rep(html, 'DN-02727-2023',                   escHtml(cert.numero_registro));
  html = rep(html, 'Sistema de Mortalidad DN-02727',  `Sistema de Mortalidad ${escHtml(regShort)}`);
  html = rep(html, '13.968.696-9',                    escHtml(cert.rut));  // aparece 2 veces

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
  const filename = `${cc.codigo_centro}-${diaStr}-${mesStr}-${anio}-ACTA`;

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
// Genera el PDF usando print() sobre un iframe oculto
// ---------------------------------------------------------------------------

/**
 * Abre el diálogo nativo "Guardar como PDF" sobre un iframe oculto.
 * El navegador renderiza el CSS completo (incluyendo oklch, tablas complejas, etc.)
 * sin el popup HTML intermedio que tenía downloadActaHtml.
 */
export function generateActaPdf(
  state: AppState,
  onProgress?: (msg: string) => void
): void {
  const htmlFull = buildActaHtml(state);
  const cc = state.general.centro_cultivo;
  const [anio = '', mesStr = '', diaStr = ''] =
    state.general.fechas.emision_certificado.split('-');
  const filename = `${cc.codigo_centro}_${diaStr}_${mesStr}_${anio}-ACTA`;

  onProgress?.('Preparando documento…');

  const iframe = document.createElement('iframe');
  iframe.style.cssText = [
    'position:fixed',
    'top:0', 'left:0',
    'width:0', 'height:0',
    'border:none',
    'opacity:0',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(htmlFull);
  iframeDoc.close();

  const print = () => {
    iframeDoc.title = filename;
    onProgress?.('Abriendo diálogo PDF…');
    iframe.contentWindow!.print();
    // Limpiar después de que el diálogo cierre (no hay evento, usamos timeout)
    // window.focus() restaura el foco al documento principal para que los
    // selectores del formulario vuelvan a responder tras cerrar el diálogo.
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.focus();
      onProgress?.('Listo');
    }, 3000);
  };

  if (iframeDoc.readyState === 'complete') {
    setTimeout(print, 500);
  } else {
    iframe.addEventListener('load', () => setTimeout(print, 500), { once: true });
  }
}
