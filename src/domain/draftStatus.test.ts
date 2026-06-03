import { describe, it, expect } from 'vitest';
import { draftStatus } from './draftStatus';
import type { RegistroHistorico } from '../types';

type Snapshot = RegistroHistorico['snapshot'];
type Metricas = RegistroHistorico['metricas'];

/** Snapshot completo (todas las secciones OK). Se clona y se muta por caso. */
function baseSnapshot(): Snapshot {
  return {
    general: {
      certificador: { nombre: 'X', rut: '1-9', numero_registro: 'DN-1' },
      centro_cultivo: {
        codigo_centro: '110814', nombre_centro: 'PAMELA', titular: 'FIORDOS',
        acs: '24', ubicacion: 'CANAL', formato_modulo: '', tamano_jaulas: '',
        coordenadas_ensilaje: '', nombre_an_ensilaje: 'A/N PAMELA',
      },
      fechas: { evaluacion_documental: '2026-01-02', inspeccion_terreno: '2026-01-08', emision_certificado: '2026-01-10' },
      observaciones_acta: '',
    },
    extraction: { parametros: { numero_total_jaulas: 24, potencia_cfm: 185 } },
    denaturation: { equipos: { velocidad_nominal_kg_hr: 3000 } },
    storage: { parametros: { capacidad_almacenaje_m3: 60 } },
    images: [
      { id: '1', seccion: 'Ubicación Espacial', url: 'https://a' },
      { id: '2', seccion: 'Ubicación Espacial', url: 'https://b' },
      { id: '3', seccion: 'Ubicación Espacial', url: 'https://c' },
      { id: '4', seccion: 'Ubicación Espacial', url: 'https://d' },
    ],
  } as unknown as Snapshot;
}

const metricasOk: Metricas = {
  capExtraccion: 20, capDesnaturalizacion: 18, capAlmacenamiento: 30,
  cumpleExtraccion: true, cumpleDesnaturalizacion: true, cumpleAlmacenamiento: true,
  sistemaExtraccion: 'LIFT-UP', sistemaDesnaturalizacion: 'Ensilaje',
  modoOperacionMinima: false, numJaulas: 24, jaulas_simultaneas: 2, profundidad_m: 30,
};

describe('draftStatus', () => {
  it('borrador completo: sin pendientes, 5/5', () => {
    const r = draftStatus(baseSnapshot(), metricasOk);
    expect(r.pendientes).toEqual([]);
    expect(r.completados).toBe(5);
    expect(r.total).toBe(5);
  });

  it('faltan datos generales → General pendiente', () => {
    const s = baseSnapshot();
    s.general.centro_cultivo.codigo_centro = '';
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).toContain('General');
    expect(r.completados).toBe(4);
  });

  it('no cumple extracción (metricas) → Extracción pendiente', () => {
    const r = draftStatus(baseSnapshot(), { ...metricasOk, cumpleExtraccion: false });
    expect(r.pendientes).toContain('Extracción');
  });

  it('menos de 4 fotos de ubicación → Fotos pendiente', () => {
    const s = baseSnapshot();
    s.images = s.images.slice(0, 2);
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).toContain('Fotos');
  });

  it('op. mínima: cfm 0 no marca Extracción pendiente si cumple', () => {
    const s = baseSnapshot();
    s.general.modo_operacion_minima = true;
    s.extraction.parametros.potencia_cfm = 0;
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).not.toContain('Extracción');
  });

  it('sin metricas: solo evalúa inputs (compliance desconocido = ok)', () => {
    const r = draftStatus(baseSnapshot(), undefined);
    expect(r.pendientes).toEqual([]);
  });
});
