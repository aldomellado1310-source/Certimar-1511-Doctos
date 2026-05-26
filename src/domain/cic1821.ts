/**
 * CIC E1 — Certificación de Estructuras de Cultivo (Res. Ex. N° 1821/2020)
 * Plantilla oficial SERNAPESCA versión 1.0 - 24/06/2025
 *
 * Documento 1: Certificado de Seguridad de Estructuras de Cultivo (1 pág.)
 * Documento 2: Anexo Certificación de Estructuras de Cultivo (2 págs.)
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoCertificacionCIC = 'ANUAL' | 'CIC_E1' | 'CIC_E2';

export interface EstudioAmbiental {
  fechaInicio: string;
  fechaTermino: string;
  empresaEjecutora: string;
  metodologiaEquipo: string;
  cumple: boolean;
  observaciones: string;
}

export interface VariablesAmbientalesCIC {
  corrientes: EstudioAmbiental;
  vientos: EstudioAmbiental;
  olas: EstudioAmbiental;
  calidadFondo: EstudioAmbiental;
  batimetria: EstudioAmbiental;
  estudiosComplementarios: string;
  revisionDesde: string;
  revisionHasta: string;
}

export interface MemoriaCalculoCIC {
  empresaEjecutora: string;
  fechaEmision: string;
  metodologiaAnalisis: string;
  observaciones: string;
  fechasRevision: string;
  cumple: boolean;
}

export interface VerticeUTM1821 {
  vertice: number;
  utmEste: string;
  utmNorte: string;
  datum: string;
}

export interface PruebasTraccionCIC {
  fechaEjecucion: string;
  empresaEjecutora: string;
  metodologia: string;
  cumple: boolean;
}

/** Datos para generar el Certificado (página única). */
export interface CertificadoCIC_E1Data {
  nroCertificado: string;
  tipoCertificacion: TipoCertificacionCIC;
  fechaEmision: string;
  fechaInicioSiembra: string | null;
  fechaTerminoSiembra: string | null;
  codigoRNA: string;
  nombreCentro: string;
  titular: string;
  certificadorNombre: string;
  certificadorRut: string;
  certificadorNRegistro: string;
}

/** Datos para generar el Anexo (2 páginas). */
export interface AnexoCIC_E1Data {
  nroCertificado: string;
  fechaEmision: string;
  nroModulosCultivo: number;
  identificacionModulo: string;
  tipoCertificacion: TipoCertificacionCIC;
  fechaInicioSiembra: string;
  fechaTerminoSiembra: string;
  variablesAmbientales: VariablesAmbientalesCIC;
  memoriaCalculo: MemoriaCalculoCIC;
  coordenadasDiseno: VerticeUTM1821[];
  pruebasTraccion: PruebasTraccionCIC;
  certificadorNombre: string;
  certificadorRut: string;
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function emptyEstudioAmbiental(): EstudioAmbiental {
  return {
    fechaInicio: '', fechaTermino: '', empresaEjecutora: '',
    metodologiaEquipo: '', cumple: true, observaciones: '',
  };
}

export function emptyVariablesAmbientales(): VariablesAmbientalesCIC {
  return {
    corrientes: emptyEstudioAmbiental(),
    vientos: emptyEstudioAmbiental(),
    olas: emptyEstudioAmbiental(),
    calidadFondo: emptyEstudioAmbiental(),
    batimetria: emptyEstudioAmbiental(),
    estudiosComplementarios: '',
    revisionDesde: '',
    revisionHasta: '',
  };
}

export function emptyMemoriaCalculo(): MemoriaCalculoCIC {
  return {
    empresaEjecutora: '',
    fechaEmision: '',
    metodologiaAnalisis: 'Análisis dinámico de estructuras mediante software especializado.',
    observaciones: 'N/A',
    fechasRevision: '',
    cumple: true,
  };
}

export function emptyPruebasTraccion(): PruebasTraccionCIC {
  return {
    fechaEjecucion: '',
    empresaEjecutora: '',
    metodologia: 'Dinamometría hidráulica con registro digital de carga y tiempo.',
    cumple: true,
  };
}

// ─── PDF — utilidades internas ────────────────────────────────────────────────

const BLUE_DARK: [number, number, number] = [26, 58, 92];
const BLUE_MID: [number, number, number]  = [100, 155, 200];

const PAGE_W  = 210;   // A4 mm
const PAGE_H  = 297;
const MARGIN  = 20;
const CONT_W  = PAGE_W - 2 * MARGIN;  // 170 mm

/** Marca la cabecera SERNAPESCA común a todos los documentos CIC. */
function addHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  logoUrl: string | null,
): number {
  const y0 = 10;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text('Versión 1.0', PAGE_W - MARGIN, y0 + 2, { align: 'right' });
  doc.text('24/06/2025', PAGE_W - MARGIN, y0 + 6, { align: 'right' });

  if (logoUrl) {
    doc.addImage(logoUrl, 'PNG', MARGIN, y0, 24, 24);
  } else {
    // Placeholder si no hay imagen SERNAPESCA
    doc.setDrawColor(26, 58, 92);
    doc.setFillColor(26, 58, 92);
    doc.rect(MARGIN, y0, 24, 24, 'S');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SERNAPESCA', MARGIN + 12, y0 + 13, { align: 'center' });
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, PAGE_W / 2, y0 + 10, { align: 'center' });
  if (subtitle) {
    doc.text(subtitle, PAGE_W / 2, y0 + 17, { align: 'center' });
  }

  return y0 + 30;
}

function addFooter(doc: jsPDF, label: string) {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  doc.text(label, MARGIN, PAGE_H - 10);
}

function xMark(cumple: boolean): string {
  return cumple ? 'X  Sí     ___  No' : '___  Sí     X  No';
}

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 0;
}

// ─── Certificado ──────────────────────────────────────────────────────────────

/**
 * Genera el Certificado de Seguridad de Estructuras de Cultivo (1 página).
 * @param data          Datos del certificado
 * @param sernapescaLogo Data-URL base64 del logo SERNAPESCA (opcional)
 */
export async function generateCertificadoCIC_E1PDF(
  data: CertificadoCIC_E1Data,
  sernapescaLogo: string | null = null,
): Promise<Blob> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  let y = addHeader(
    doc,
    'CERTIFICADO DE SEGURIDAD DE ESTRUCTURAS DE CULTIVO',
    'EMITIDO POR CERTIFICADOR PERSONA NATURAL',
    sernapescaLogo,
  );

  y += 2;

  // Tabla 1: centro + certificador
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      [
        { content: 'Código centro\nRNA:', styles: { fontStyle: 'normal' } },
        data.codigoRNA,
        { content: 'Nombre del\nCertificador:' },
        { content: data.certificadorNombre, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: 'Titular centro de\ncultivo:' },
        data.titular,
        { content: 'N° inscripción Registro\nD.S. N° 15/2011:' },
        { content: data.certificadorNRegistro, styles: { fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: { 0: { cellWidth: 32 }, 2: { cellWidth: 42 }, 3: { cellWidth: 46 } },
  });

  y = finalY(doc) + 5;

  // Tabla 2: tipo de certificación + fechas
  const anualX = data.tipoCertificacion === 'ANUAL'  ? 'X' : '';
  const e1X    = data.tipoCertificacion === 'CIC_E1' ? 'X' : '';
  const e2X    = data.tipoCertificacion === 'CIC_E2' ? 'X' : '';

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      [
        { content: 'N° certificado:',                  styles: { cellWidth: 35 } },
        { content: data.nroCertificado,                styles: { fontStyle: 'italic', cellWidth: 40 } },
        { content: 'Certificación Anual.' },
        { content: anualX, styles: { halign: 'center', cellWidth: 12 } },
      ],
      [
        { content: 'Fecha emisión del\ncertificado' },
        data.fechaEmision,
        { content: 'Certificación Inicio de ciclo\nproductivo, Etapa 1 (CIC‑E1).' },
        { content: e1X, styles: { halign: 'center' } },
      ],
      [
        { content: 'Fecha inicio de\nsiembra' },
        data.fechaInicioSiembra ?? '',
        { content: 'Certificación Inicio de ciclo\nproductivo, Etapa 2 (CIC‑E2).' },
        { content: e2X, styles: { halign: 'center' } },
      ],
      [
        { content: 'Fecha término de\nsiembra' },
        data.fechaTerminoSiembra ?? '',
        { content: 'Marcar con una X la casilla que corresponda', colSpan: 2, styles: { fontStyle: 'italic', textColor: [80, 80, 80] } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
  });

  y = finalY(doc) + 10;

  // Cuerpo del certificado
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const parrafo1 = `Yo ${data.certificadorNombre} certificador de estructuras, certifico que el centro de cultivo código RNA N° ${data.codigoRNA} (${data.nombreCentro}) del Titular ${data.titular}. CUMPLE con las condiciones de seguridad del(los) módulo(s) de cultivo y sistema de fondeo, para operar conforme a lo establecido en la letra e) del artículo 4 del D.S. N° 320/2001, MINECON y la Res. Ex. N° 1821/2020 de la Subsecretaria de Pesca y Acuicultura (Subpesca) y sus modificaciones.`;
  const parrafo2 = `A su vez, declaro que verifiqué toda la información entregada por el titular del centro de cultivo, según lo establecido en la Res. Ex. N° 1821/2020 de Subpesca y sus modificaciones, y a las especificaciones indicadas por el Servicio, las cuales se encuentran en el Anexo e Instructivo de la Certificación de las Estructuras de Cultivo.`;

  const lineas1 = doc.splitTextToSize(parrafo1, CONT_W);
  doc.text(lineas1, MARGIN, y);
  y += lineas1.length * 5.5 + 7;

  const lineas2 = doc.splitTextToSize(parrafo2, CONT_W);
  doc.text(lineas2, MARGIN, y);
  y += lineas2.length * 5.5 + 14;

  doc.text('En comprobante firma,', MARGIN, y);

  // Bloque firma centrado-derecha
  y += 32;
  const sx = PAGE_W / 2 + 22;
  doc.line(sx - 38, y, sx + 38, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Firma, Nombre y RUT', sx, y + 5, { align: 'center' });
  doc.text('Certificador de Estructuras', sx, y + 11, { align: 'center' });

  addFooter(doc, 'Certificado de seguridad de estructuras de cultivo. Persona Natural. Versión 1.0 24/06/2025');

  return doc.output('blob');
}

// ─── Anexo ────────────────────────────────────────────────────────────────────

/**
 * Genera el Anexo Certificación de Estructuras de Cultivo (2 páginas).
 * @param data          Datos del anexo
 * @param sernapescaLogo Data-URL base64 del logo SERNAPESCA (opcional)
 */
export async function generateAnexoCIC_E1PDF(
  data: AnexoCIC_E1Data,
  sernapescaLogo: string | null = null,
): Promise<Blob> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  // ── Página 1 ─────────────────────────────────────────────────────────────

  let y = addHeader(doc, 'ANEXO', 'CERTIFICACIÓN DE ESTRUCTURAS DE CULTIVO', sernapescaLogo);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Certificado: ${data.nroCertificado}`, MARGIN, y);
  y += 6;
  doc.text(`Fecha de Emisión del Certificado: ${data.fechaEmision}`, MARGIN, y);
  y += 7;

  // Módulos + identificación
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      [
        { content: 'N° Módulos de cultivo*:', styles: { cellWidth: 50 } },
        { content: String(data.nroModulosCultivo), styles: { cellWidth: 20 } },
        { content: '*Si tiene más de un módulo de cultivo, deberá replicar este Anexo para cada uno de ellos.', styles: { fontStyle: 'italic', textColor: [80, 80, 80], fontSize: 7 } },
      ],
      [
        { content: 'Identificación del Módulo de cultivo*:' },
        data.identificacionModulo,
        '',
      ],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
  });

  y = finalY(doc) + 4;

  if (data.tipoCertificacion === 'CIC_E2') {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Si la certificación corresponde a la Etapa 2, señalar las fechas de:', MARGIN, y);
    y += 5;
    doc.text(`Inicio de siembra: ${data.fechaInicioSiembra}`, MARGIN, y);
    doc.text(`Término de siembra: ${data.fechaTerminoSiembra || 'N/A'}`, PAGE_W / 2, y);
    y += 7;
  }

  // I. REVISIÓN DOCUMENTAL
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('I.    REVISIÓN DOCUMENTAL', MARGIN, y);
  y += 6;

  // 1. Variables Ambientales
  const va = data.variablesAmbientales;
  const estudios: [string, EstudioAmbiental][] = [
    ['Estudio de Corrientes',     va.corrientes],
    ['Estudio de Vientos',        va.vientos],
    ['Estudio de Olas',           va.olas],
    ['Estudio de Calidad de fondo', va.calidadFondo],
    ['Estudio de Batimetría',     va.batimetria],
  ];

  const vaBody: object[][] = [];
  for (const [label, e] of estudios) {
    vaBody.push([
      { content: label, styles: { fontStyle: 'bold', fillColor: [240, 246, 252] } },
      { content: e.fechaInicio,       styles: { fillColor: [240, 246, 252] } },
      { content: e.fechaTermino,      styles: { fillColor: [240, 246, 252] } },
      { content: e.empresaEjecutora,  styles: { fillColor: [240, 246, 252] } },
      { content: e.metodologiaEquipo, styles: { fillColor: [240, 246, 252] } },
      { content: xMark(e.cumple),     styles: { fillColor: [240, 246, 252], fontSize: 7 } },
    ]);
    vaBody.push([{
      content: `Observaciones a los resultados     ${e.observaciones || 'Sin Observaciones.'}`,
      colSpan: 6,
      styles: { fontStyle: 'italic', textColor: [60, 60, 60], fontSize: 8 },
    }]);
  }
  vaBody.push([{
    content: `Revisión de estudios complementarios (opcional)     ${va.estudiosComplementarios || 'Sin observaciones.'}`,
    colSpan: 6,
    styles: { fontStyle: 'italic', textColor: [60, 60, 60], fontSize: 8 },
  }]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        { content: 'Parámetro',               rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Período de medición',      colSpan: 2, styles: { halign: 'center' } },
        { content: 'Empresa\nEjecutora',       rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Metodología\no equipo\nutilizado', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Cumple con\nRes. Ex. N°\n1821/2020', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ],
      [
        { content: 'Fecha\nInicio',   styles: { halign: 'center' } },
        { content: 'Fecha\nTérmino',  styles: { halign: 'center' } },
      ],
    ],
    body: vaBody,
    theme: 'grid',
    headStyles: { fillColor: BLUE_DARK, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', cellPadding: 2 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 17 },
      2: { cellWidth: 17 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 31 },
    },
  });

  y = finalY(doc) + 3;

  const revText = `La revisión de los informes de variables ambientales se realizó entre los días: desde el ${va.revisionDesde || 'DD'} al ${va.revisionHasta || 'DD'} de ${new Date().toLocaleString('es-CL', { month: 'long' })} del ${new Date().getFullYear()}.`;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(doc.splitTextToSize(revText, CONT_W), MARGIN, y);

  addFooter(doc, 'Página 1 de 2');

  // ── Página 2 ─────────────────────────────────────────────────────────────

  doc.addPage();
  y = addHeader(doc, 'ANEXO', 'CERTIFICACIÓN DE ESTRUCTURAS DE CULTIVO', sernapescaLogo);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Certificado: ${data.nroCertificado}`, MARGIN, y);
  y += 8;

  // 2. Memoria de Cálculo
  const mc = data.memoriaCalculo;
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[{ content: '2.   MEMORIA DE CÁLCULO DEL MÓDULO DE CULTIVO Y FONDEO', colSpan: 2 }]],
    body: [
      ['Empresa ejecutora:',         mc.empresaEjecutora],
      ['Fecha de emisión:',          mc.fechaEmision],
      ['Metodología de análisis:',   mc.metodologiaAnalisis],
      [{ content: 'Observaciones al documento:', styles: { fontStyle: 'italic' } }, mc.observaciones],
      ['Fechas de revisión:',        mc.fechasRevision],
      [
        { content: 'Cumple con Res. Ex. N° 1821/2020:', styles: { fontStyle: 'bold' } },
        { content: xMark(mc.cumple), styles: { fontSize: 8 } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: BLUE_DARK, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 60, fillColor: [245, 245, 245] },
      1: { cellWidth: CONT_W - 60 },
    },
  });

  y = finalY(doc) + 5;

  // 3. Coordenadas del Módulo
  const defaultCoords: object[][] = [[1, '', '', '18G'], [2, '', '', '18G'], [3, '', '', '18G'], [4, '', '', '18G']];
  const coordRows = data.coordenadasDiseno.length > 0
    ? data.coordenadasDiseno.map(v => [v.vertice, v.utmEste, v.utmNorte, v.datum])
    : defaultCoords;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [{ content: '3.   UBICACIÓN GEOGRÁFICA - COORDENADAS DEL MÓDULO DE CULTIVO (DISEÑO)', colSpan: 4 }],
      ['Vértice', 'UTM Este', 'UTM Norte', 'DATUM / HUSO'],
    ],
    body: coordRows,
    theme: 'grid',
    headStyles: { fillColor: BLUE_DARK, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center' },
  });

  y = finalY(doc) + 5;

  // Pruebas de Tracción
  const pt = data.pruebasTraccion;
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[{ content: 'PRUEBAS DE TRACCIÓN  (según lo indica la Res. Ex. 1821-2020)', colSpan: 2 }]],
    body: [
      ['Fecha de ejecución:',   pt.fechaEjecucion],
      ['Empresa ejecutora:',    pt.empresaEjecutora],
      [{ content: `Metodología utilizada: ${pt.metodologia}`, colSpan: 2 }],
      [
        { content: 'Cumple con la Memoria de cálculo:', styles: { fontStyle: 'bold' } },
        { content: xMark(pt.cumple), styles: { fontSize: 8 } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: BLUE_MID, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 60, fillColor: [245, 245, 245] },
      1: { cellWidth: CONT_W - 60 },
    },
  });

  y = finalY(doc) + 14;

  // Firma
  const sx = PAGE_W / 2 + 22;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(50, 50, 50);
  if (data.certificadorRut) {
    doc.text(data.certificadorRut, sx, y, { align: 'center' });
    y += 5;
  }
  doc.line(sx - 38, y, sx + 38, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Firma, Nombre y RUT',       sx, y + 5,  { align: 'center' });
  doc.text('Certificador de Estructuras', sx, y + 11, { align: 'center' });

  addFooter(doc, 'Página 2 de 2');

  return doc.output('blob');
}
