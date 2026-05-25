import { describe, it, expect } from 'vitest';
import { validarOrdenFechas } from './validation';

describe('validarOrdenFechas', () => {
  it('falla si evaluacion_documental está vacía', () => {
    const r = validarOrdenFechas({ evaluacion_documental: '', inspeccion_terreno: '2025-01-10', emision_certificado: '2025-01-15' });
    expect(r.valido).toBe(false);
    expect(r.mensaje).toBe('Fechas incompletas');
  });

  it('falla si inspeccion_terreno está vacía', () => {
    expect(validarOrdenFechas({ evaluacion_documental: '2025-01-08', inspeccion_terreno: '', emision_certificado: '2025-01-15' }).valido).toBe(false);
  });

  it('falla si emision_certificado está vacía', () => {
    expect(validarOrdenFechas({ evaluacion_documental: '2025-01-08', inspeccion_terreno: '2025-01-10', emision_certificado: '' }).valido).toBe(false);
  });

  it('es válido con orden correcto', () => {
    const r = validarOrdenFechas({ evaluacion_documental: '2025-01-08', inspeccion_terreno: '2025-01-10', emision_certificado: '2025-01-15' });
    expect(r.valido).toBe(true);
    expect(r.mensaje).toBeUndefined();
  });

  it('es válido cuando las tres fechas son iguales', () => {
    expect(validarOrdenFechas({ evaluacion_documental: '2025-01-10', inspeccion_terreno: '2025-01-10', emision_certificado: '2025-01-10' }).valido).toBe(true);
  });

  it('falla si inspección es anterior a evaluación documental', () => {
    const r = validarOrdenFechas({ evaluacion_documental: '2025-01-10', inspeccion_terreno: '2025-01-08', emision_certificado: '2025-01-15' });
    expect(r.valido).toBe(false);
    expect(r.mensaje).toContain('Inspección');
  });

  it('falla si emisión es anterior a inspección terreno', () => {
    const r = validarOrdenFechas({ evaluacion_documental: '2025-01-08', inspeccion_terreno: '2025-01-15', emision_certificado: '2025-01-10' });
    expect(r.valido).toBe(false);
    expect(r.mensaje).toContain('Emisión');
  });
});
