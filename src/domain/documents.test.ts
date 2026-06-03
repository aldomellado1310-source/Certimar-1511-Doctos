/**
 * Tests de generación de documentos — CERTIMAR 1511
 * Fixture real: Centro 110814 "PAMELA" — EXPORTADORA LOS FIORDOS LTDA.
 * Fuente: registro enviado 02-01-2026, inspección 08-01-2026.
 *
 * Cobertura:
 *  - buildCertificadoData: identificación, capacidades, cumplimiento, firmante
 *  - buildInformeTecnicoData: encabezado, extracción, desnaturalización, almacenamiento
 *  - buildActaInspeccionData: número de acta, hallazgos, conclusión general
 */

import { describe, it, expect } from 'vitest';
import {
  buildCertificadoData,
  buildInformeTecnicoData,
  buildActaInspeccionData,
} from './documents';
import type { AppState } from '../types';
import { MIN_EXTRACTION_TON_DIA, MIN_DENATURATION_TON_DIA, MIN_STORAGE_TON } from './constants';
import { FIXTURE_STATE } from './fixtures';

// ---------------------------------------------------------------------------
// buildCertificadoData
// ---------------------------------------------------------------------------

describe('buildCertificadoData — Centro 110814 PAMELA', () => {
  const cert = buildCertificadoData(FIXTURE_STATE);

  it('tiene el título y normativa correctos', () => {
    expect(cert.titulo).toBe('CERTIFICADO DE CAPACIDADES DE SISTEMAS DE MORTALIDAD');
    expect(cert.normativa).toContain('1511/2021');
  });

  it('identificación incluye todos los campos del centro', () => {
    expect(cert.identificacion['Código Centro']).toBe('110814');
    expect(cert.identificacion['Nombre Centro']).toBe('PAMELA');
    expect(cert.identificacion['Titular']).toBe('EXPORTADORA LOS FIORDOS LTDA.');
    expect(cert.identificacion['A.C.S']).toBe('24');
    expect(cert.identificacion['Ubicación']).toContain('Región de Aysén');
    expect(cert.identificacion['Fecha Inspección Terreno']).toBe('2026-01-08');
    expect(cert.identificacion['Fecha Emisión']).toBe('2026-02-10');
  });

  it('capacidades reflejan los valores del registro real', () => {
    const ext = cert.capacidades.find(c => c.descripcion === 'Extracción de Mortalidad')!;
    const den = cert.capacidades.find(c => c.descripcion === 'Desnaturalización')!;
    const alm = cert.capacidades.find(c => c.descripcion === 'Almacenamiento')!;

    expect(ext.valor).toBe('23.60 TN/día');
    expect(den.valor).toBe('17.90 TN/día');
    expect(alm.valor).toBe('25.20 TN');
  });

  it('todas las capacidades cumplen la norma', () => {
    expect(cert.capacidades.every(c => c.cumple)).toBe(true);
    expect(cert.cumpleGeneral).toBe(true);
  });

  it('los umbrales regulatorios son los correctos (Res. 1511)', () => {
    const ext = cert.capacidades.find(c => c.descripcion === 'Extracción de Mortalidad')!;
    const den = cert.capacidades.find(c => c.descripcion === 'Desnaturalización')!;
    const alm = cert.capacidades.find(c => c.descripcion === 'Almacenamiento')!;

    expect(ext.umbral).toContain(`${MIN_EXTRACTION_TON_DIA}`);
    expect(den.umbral).toContain(`${MIN_DENATURATION_TON_DIA}`);
    expect(alm.umbral).toContain(`${MIN_STORAGE_TON}`);
  });

  it('firmante tiene los datos del certificador', () => {
    expect(cert.firmante.nombre).toBe('ENGELBERT FLORES');
    expect(cert.firmante.rut).toBe('13.968.696-9');
    expect(cert.firmante.registro).toBe('DN-02727-2023');
  });

  it('cumpleGeneral es false si cualquier sistema no cumple', () => {
    const stateConFalla: AppState = {
      ...FIXTURE_STATE,
      extraction: {
        ...FIXTURE_STATE.extraction,
        resultados: { ...FIXTURE_STATE.extraction.resultados, capacidad_diaria_ton: 12, cumple_norma: false },
      },
    };
    const certFalla = buildCertificadoData(stateConFalla);
    expect(certFalla.cumpleGeneral).toBe(false);
    expect(certFalla.capacidades[0].cumple).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildInformeTecnicoData
// ---------------------------------------------------------------------------

describe('buildInformeTecnicoData — Centro 110814 PAMELA', () => {
  const informe = buildInformeTecnicoData(FIXTURE_STATE);

  it('encabezado contiene código, nombre y titular correctos', () => {
    expect(informe.encabezado.codigoCentro).toBe('110814');
    expect(informe.encabezado.nombreCentro).toBe('PAMELA');
    expect(informe.encabezado.titular).toBe('EXPORTADORA LOS FIORDOS LTDA.');
  });

  it('encabezado contiene las tres fechas relevantes', () => {
    expect(informe.encabezado.fechaInspeccion).toBe('2026-01-08');
    expect(informe.encabezado.fechaEvaluacionDoc).toBe('2026-01-02');
    expect(informe.encabezado.fechaEmision).toBe('2026-02-10');
  });

  it('extracción refleja sistema LIFT-UP con 24 jaulas', () => {
    expect(informe.extraccion.sistema).toBe('LIFT-UP');
    expect(informe.extraccion.jaulas).toBe(24);
    expect(informe.extraccion.talla).toBe('Grande (>=4.5kg)');
    expect(informe.extraccion.capacidadTonDia).toBe(23.6);
    expect(informe.extraccion.cumple).toBe(true);
  });

  it('desnaturalización es tipo Ensilaje y cumple norma', () => {
    expect(informe.desnaturalizacion.tipo).toBe('Ensilaje');
    expect(informe.desnaturalizacion.capacidadTonDia).toBe(17.9);
    expect(informe.desnaturalizacion.cumple).toBe(true);
  });

  it('almacenamiento con 21 m³ × 1.2 = 25.2 TN cumple norma', () => {
    expect(informe.almacenamiento.capacidadM3).toBe(21);
    expect(informe.almacenamiento.factorDensidad).toBe(1.2);
    expect(informe.almacenamiento.capacidadTon).toBe(25.2);
    expect(informe.almacenamiento.cumple).toBe(true);
  });

  it('cumpleGeneral es true cuando los 3 sistemas cumplen', () => {
    expect(informe.cumpleGeneral).toBe(true);
  });

  it('certificador tiene registro DN-02727-2023', () => {
    expect(informe.certificador.registro).toBe('DN-02727-2023');
    expect(informe.certificador.nombre).toBe('ENGELBERT FLORES');
  });
});

// ---------------------------------------------------------------------------
// buildActaInspeccionData
// ---------------------------------------------------------------------------

describe('buildActaInspeccionData — Centro 110814 PAMELA', () => {
  const acta = buildActaInspeccionData(FIXTURE_STATE);

  it('número de acta incluye código de centro y fecha de inspección', () => {
    expect(acta.numeroActa).toBe('ACTA-110814-20260108');
  });

  it('contiene exactamente 3 hallazgos (uno por sistema)', () => {
    expect(acta.hallazgos).toHaveLength(3);
    const sistemas = acta.hallazgos.map(h => h.sistema);
    expect(sistemas).toContain('Extracción');
    expect(sistemas).toContain('Desnaturalización');
    expect(sistemas).toContain('Almacenamiento');
  });

  it('todos los hallazgos son CUMPLE', () => {
    expect(acta.hallazgos.every(h => h.resultado === 'CUMPLE')).toBe(true);
  });

  it('conclusión general es CUMPLE cuando los 3 sistemas pasan', () => {
    expect(acta.conclusionGeneral).toBe('CUMPLE');
  });

  it('hallazgo de extracción muestra valor correcto', () => {
    const h = acta.hallazgos.find(h => h.sistema === 'Extracción')!;
    expect(h.capacidad).toBe('23.60 TN/día');
    expect(h.umbral).toBe('15 TN/día');
  });

  it('conclusión es NO CUMPLE cuando los 3 sistemas fallan', () => {
    const stateTotal: AppState = {
      ...FIXTURE_STATE,
      extraction: { ...FIXTURE_STATE.extraction, resultados: { ...FIXTURE_STATE.extraction.resultados, cumple_norma: false } },
      denaturation: { ...FIXTURE_STATE.denaturation, resultados: { ...FIXTURE_STATE.denaturation.resultados, cumple_norma: false } },
      storage: { ...FIXTURE_STATE.storage, resultados: { ...FIXTURE_STATE.storage.resultados, cumple_norma: false } },
    };
    expect(buildActaInspeccionData(stateTotal).conclusionGeneral).toBe('NO CUMPLE');
  });

  it('conclusión es CUMPLE PARCIALMENTE cuando solo algunos sistemas cumplen', () => {
    const stateParcial: AppState = {
      ...FIXTURE_STATE,
      denaturation: { ...FIXTURE_STATE.denaturation, resultados: { ...FIXTURE_STATE.denaturation.resultados, cumple_norma: false } },
    };
    expect(buildActaInspeccionData(stateParcial).conclusionGeneral).toBe('CUMPLE PARCIALMENTE');
  });

  it('hallazgo de sistema no cumplido incluye mensaje con umbral regulatorio', () => {
    const stateFalla: AppState = {
      ...FIXTURE_STATE,
      denaturation: {
        ...FIXTURE_STATE.denaturation,
        resultados: { ...FIXTURE_STATE.denaturation.resultados, cumple_norma: false, capacidad_diaria_ton: 10 },
      },
    };
    const actaFalla = buildActaInspeccionData(stateFalla);
    const h = actaFalla.hallazgos.find(h => h.sistema === 'Desnaturalización')!;
    expect(h.resultado).toBe('NO CUMPLE');
    expect(h.observacion).toContain(`${MIN_DENATURATION_TON_DIA}`);
  });

  it('datos del certificador son correctos', () => {
    expect(acta.certificador.nombre).toBe('ENGELBERT FLORES');
    expect(acta.certificador.registro).toBe('DN-02727-2023');
  });
});
