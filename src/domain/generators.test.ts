import { describe, it, expect } from 'vitest';
import { inferCatalogoId } from './generators';

describe('inferCatalogoId', () => {
  it('devuelve el id correcto cuando hay coincidencia exacta', () => {
    expect(inferCatalogoId({ marca: 'Cummins', modelo: 'C110D5' })).toBe('cummins-c110d5');
  });

  it('devuelve otro cuando la marca no coincide', () => {
    expect(inferCatalogoId({ marca: 'Desconocida', modelo: 'C110D5' })).toBe('otro');
  });

  it('devuelve otro cuando el modelo no existe', () => {
    expect(inferCatalogoId({ marca: 'Cummins', modelo: 'X999' })).toBe('otro');
  });

  it('devuelve otro cuando ambos campos están vacíos', () => {
    expect(inferCatalogoId({ marca: '', modelo: '' })).toBe('otro');
  });
});
