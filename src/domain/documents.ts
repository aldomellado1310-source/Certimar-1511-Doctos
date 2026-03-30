/**
 * Constructores de datos de documentos — CERTIMAR 1511
 * Funciones puras que toman AppState y retornan estructuras de datos
 * listas para renderizar en PDF (Certificado, Informe Técnico, Acta).
 *
 * Al separar la construcción de datos del renderizado PDF se logra:
 *  - Testabilidad en entorno Node (sin canvas/browser APIs)
 *  - Reutilización entre distintos formatos de salida
 */

import type { AppState } from '../types';
import { MIN_EXTRACTION_TON_DIA, MIN_DENATURATION_TON_DIA, MIN_STORAGE_TON } from './constants';

// ---------------------------------------------------------------------------
// Tipos de retorno
// ---------------------------------------------------------------------------

export interface CapacidadRow {
  descripcion: string;
  valor: string;
  umbral: string;
  cumple: boolean;
}

export interface CertificadoData {
  titulo: string;
  normativa: string;
  identificacion: Record<string, string>;
  capacidades: CapacidadRow[];
  cumpleGeneral: boolean;
  firmante: {
    nombre: string;
    rut: string;
    registro: string;
  };
  fechaEmision: string;
}

export interface InformeTecnicoData {
  encabezado: {
    codigoCentro: string;
    nombreCentro: string;
    titular: string;
    acs: string;
    ubicacion: string;
    fechaInspeccion: string;
    fechaEvaluacionDoc: string;
    fechaEmision: string;
  };
  extraccion: {
    sistema: string;
    talla: string;
    jaulas: number;
    jaulasSimult: number;
    horasDia: number;
    personal: number;
    profundidad: number;
    capacidadTonDia: number;
    cumple: boolean;
  };
  desnaturalizacion: {
    tipo: string;
    marcaModelo: string;
    capacidadTonDia: number;
    cumple: boolean;
  };
  almacenamiento: {
    capacidadM3: number;
    factorDensidad: number;
    capacidadTon: number;
    cumple: boolean;
    observaciones: string;
  };
  cumpleGeneral: boolean;
  certificador: {
    nombre: string;
    rut: string;
    registro: string;
  };
}

export interface ActaInspeccionData {
  numeroActa: string;           // generado por código + fecha
  fechaInspeccion: string;
  codigoCentro: string;
  nombreCentro: string;
  titular: string;
  ubicacion: string;
  acs: string;
  hallazgos: ActaHallazgo[];
  conclusionGeneral: 'CUMPLE' | 'NO CUMPLE' | 'CUMPLE PARCIALMENTE';
  certificador: {
    nombre: string;
    rut: string;
    registro: string;
  };
}

export interface ActaHallazgo {
  sistema: 'Extracción' | 'Desnaturalización' | 'Almacenamiento';
  capacidad: string;
  umbral: string;
  resultado: 'CUMPLE' | 'NO CUMPLE';
  observacion: string;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export function buildCertificadoData(state: AppState): CertificadoData {
  const { general, extraction, denaturation, storage } = state;
  const g = general.centro_cultivo;
  const c = general.certificador;

  const cumpleGeneral =
    extraction.resultados.cumple_norma &&
    denaturation.resultados.cumple_norma &&
    storage.resultados.cumple_norma;

  return {
    titulo: 'CERTIFICADO DE CAPACIDADES DE SISTEMAS DE MORTALIDAD',
    normativa: 'Resolución Exenta N°1511/2021',
    identificacion: {
      'Titular': g.titular,
      'Código Centro': g.codigo_centro,
      'Nombre Centro': g.nombre_centro,
      'A.C.S': g.acs,
      'Ubicación': g.ubicacion,
      'Fecha Inspección Terreno': general.fechas.inspeccion_terreno,
      'Fecha Evaluación Documental': general.fechas.evaluacion_documental,
      'Fecha Emisión': general.fechas.emision_certificado,
    },
    capacidades: [
      {
        descripcion: 'Extracción de Mortalidad',
        valor: `${extraction.resultados.capacidad_diaria_ton.toFixed(2)} TN/día`,
        umbral: `min. ${MIN_EXTRACTION_TON_DIA} TN/día`,
        cumple: extraction.resultados.cumple_norma,
      },
      {
        descripcion: 'Desnaturalización',
        valor: `${denaturation.resultados.capacidad_diaria_ton.toFixed(2)} TN/día`,
        umbral: `min. ${MIN_DENATURATION_TON_DIA} TN/día`,
        cumple: denaturation.resultados.cumple_norma,
      },
      {
        descripcion: 'Almacenamiento',
        valor: `${storage.resultados.capacidad_almacenaje_ton.toFixed(2)} TN`,
        umbral: `min. ${MIN_STORAGE_TON} TN`,
        cumple: storage.resultados.cumple_norma,
      },
    ],
    cumpleGeneral,
    firmante: {
      nombre: c.nombre,
      rut: c.rut,
      registro: c.numero_registro,
    },
    fechaEmision: general.fechas.emision_certificado,
  };
}

export function buildInformeTecnicoData(state: AppState): InformeTecnicoData {
  const { general, extraction, denaturation, storage } = state;
  const g = general.centro_cultivo;

  const cumpleGeneral =
    extraction.resultados.cumple_norma &&
    denaturation.resultados.cumple_norma &&
    storage.resultados.cumple_norma;

  return {
    encabezado: {
      codigoCentro: g.codigo_centro,
      nombreCentro: g.nombre_centro,
      titular: g.titular,
      acs: g.acs,
      ubicacion: g.ubicacion,
      fechaInspeccion: general.fechas.inspeccion_terreno,
      fechaEvaluacionDoc: general.fechas.evaluacion_documental,
      fechaEmision: general.fechas.emision_certificado,
    },
    extraccion: {
      sistema: extraction.parametros.sistema_principal,
      talla: extraction.parametros.talla_pez,
      jaulas: extraction.parametros.numero_total_jaulas,
      jaulasSimult: extraction.parametros.jaulas_simultaneas,
      horasDia: extraction.parametros.horas_efectivas_trabajo,
      personal: extraction.parametros.personal_operativo,
      profundidad: extraction.parametros.profundidad_operacion_m,
      capacidadTonDia: extraction.resultados.capacidad_diaria_ton,
      cumple: extraction.resultados.cumple_norma,
    },
    desnaturalizacion: {
      tipo: denaturation.equipos.tipo_sistema,
      marcaModelo: denaturation.equipos.marca_modelo,
      capacidadTonDia: denaturation.resultados.capacidad_diaria_ton,
      cumple: denaturation.resultados.cumple_norma,
    },
    almacenamiento: {
      capacidadM3: storage.parametros.capacidad_almacenaje_m3,
      factorDensidad: storage.parametros.factor_densidad,
      capacidadTon: storage.resultados.capacidad_almacenaje_ton,
      cumple: storage.resultados.cumple_norma,
      observaciones: storage.parametros.observaciones,
    },
    cumpleGeneral,
    certificador: {
      nombre: general.certificador.nombre,
      rut: general.certificador.rut,
      registro: general.certificador.numero_registro,
    },
  };
}

export function buildActaInspeccionData(state: AppState): ActaInspeccionData {
  const { general, extraction, denaturation, storage } = state;
  const g = general.centro_cultivo;

  const hallazgos: ActaHallazgo[] = [
    {
      sistema: 'Extracción',
      capacidad: `${extraction.resultados.capacidad_diaria_ton.toFixed(2)} TN/día`,
      umbral: `${MIN_EXTRACTION_TON_DIA} TN/día`,
      resultado: extraction.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE',
      observacion: extraction.resultados.cumple_norma
        ? 'Sistema de extracción verificado en terreno.'
        : `Capacidad insuficiente. Mínimo requerido: ${MIN_EXTRACTION_TON_DIA} TN/día.`,
    },
    {
      sistema: 'Desnaturalización',
      capacidad: `${denaturation.resultados.capacidad_diaria_ton.toFixed(2)} TN/día`,
      umbral: `${MIN_DENATURATION_TON_DIA} TN/día`,
      resultado: denaturation.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE',
      observacion: denaturation.resultados.cumple_norma
        ? `Sistema ${denaturation.equipos.tipo_sistema} verificado en terreno.`
        : `Capacidad insuficiente. Mínimo requerido: ${MIN_DENATURATION_TON_DIA} TN/día.`,
    },
    {
      sistema: 'Almacenamiento',
      capacidad: `${storage.resultados.capacidad_almacenaje_ton.toFixed(2)} TN`,
      umbral: `${MIN_STORAGE_TON} TN`,
      resultado: storage.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE',
      observacion: storage.resultados.cumple_norma
        ? 'Capacidad de almacenamiento verificada en terreno.'
        : `Capacidad insuficiente. Mínimo requerido: ${MIN_STORAGE_TON} TN.`,
    },
  ];

  const cumpliendo = hallazgos.filter(h => h.resultado === 'CUMPLE').length;
  const conclusionGeneral =
    cumpliendo === 3 ? 'CUMPLE' :
    cumpliendo === 0 ? 'NO CUMPLE' :
    'CUMPLE PARCIALMENTE';

  // Número de acta: código + fecha inspección sin separadores
  const fechaSinGuion = general.fechas.inspeccion_terreno.replace(/-/g, '');
  const numeroActa = `ACTA-${g.codigo_centro}-${fechaSinGuion}`;

  return {
    numeroActa,
    fechaInspeccion: general.fechas.inspeccion_terreno,
    codigoCentro: g.codigo_centro,
    nombreCentro: g.nombre_centro,
    titular: g.titular,
    ubicacion: g.ubicacion,
    acs: g.acs,
    hallazgos,
    conclusionGeneral,
    certificador: {
      nombre: general.certificador.nombre,
      rut: general.certificador.rut,
      registro: general.certificador.numero_registro,
    },
  };
}
