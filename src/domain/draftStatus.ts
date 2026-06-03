import type { RegistroHistorico } from '../types';

export type DraftSection =
  | 'General' | 'Extracción' | 'Desnaturalización' | 'Almacenamiento' | 'Fotos';

export interface DraftStatusResult {
  pendientes: DraftSection[];
  completados: number;
  total: number;
}

/**
 * Calcula qué secciones de un borrador quedan pendientes, usando el snapshot
 * guardado y las métricas de cumplimiento ya persistidas (no recalcula nada).
 * Si no hay métricas (borradores antiguos), el cumplimiento se asume OK y solo
 * se evalúan los campos de entrada.
 */
export function draftStatus(
  snapshot: RegistroHistorico['snapshot'],
  metricas?: RegistroHistorico['metricas'],
): DraftStatusResult {
  const pendientes: DraftSection[] = [];
  const cc = snapshot.general.centro_cultivo;
  const f = snapshot.general.fechas;

  const generalOk =
    !!cc.codigo_centro?.trim() && !!cc.nombre_centro?.trim() && !!cc.titular?.trim() &&
    !!cc.acs?.trim() && !!cc.ubicacion?.trim() && !!cc.nombre_an_ensilaje?.trim() &&
    !!f.evaluacion_documental && !!f.inspeccion_terreno && !!f.emision_certificado;
  if (!generalOk) pendientes.push('General');

  const ext = snapshot.extraction.parametros;
  const opMin = snapshot.general.modo_operacion_minima === true;
  const extInputsOk = ext.numero_total_jaulas > 0 && (opMin || ext.potencia_cfm > 0);
  const extCumple = metricas ? metricas.cumpleExtraccion : true;
  if (!extInputsOk || !extCumple) pendientes.push('Extracción');

  const denInputsOk = snapshot.denaturation.equipos.velocidad_nominal_kg_hr > 0;
  const denCumple = metricas ? metricas.cumpleDesnaturalizacion : true;
  if (!denInputsOk || !denCumple) pendientes.push('Desnaturalización');

  const stoInputsOk = snapshot.storage.parametros.capacidad_almacenaje_m3 > 0;
  const stoCumple = metricas ? metricas.cumpleAlmacenamiento : true;
  if (!stoInputsOk || !stoCumple) pendientes.push('Almacenamiento');

  const ubiCount = (snapshot.images ?? []).filter(
    (i) => i.seccion === 'Ubicación Espacial' && !!i.url,
  ).length;
  if (ubiCount < 4) pendientes.push('Fotos');

  const total = 5;
  return { pendientes, completados: total - pendientes.length, total };
}
