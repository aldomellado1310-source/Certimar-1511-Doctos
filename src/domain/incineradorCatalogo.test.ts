import { describe, it, expect } from 'vitest';
import {
  ID_NUEVO_INCINERADOR,
  estadoDesdeIncinerador,
  incineradorDesdeCustom,
  resolverIncinerador,
  buildIncineradorEntry,
  findIncineradorDuplicado,
  IncineradorCompleto,
} from './incineradorCatalogo';
import { CatalogoCustomEntry } from '../types';

const ESTATICO: IncineradorCompleto & { id: string } = {
  id: 'addfield-thunder-1000',
  marca_modelo: 'ADDFIELD / THUNDER 1000',
  capacidad_carga_kg_h: 150,
  horas_funcionamiento: 8,
  camara_primaria: '1.450 m diámetro interior',
  num_quemadores_primaria: 1,
  temperatura_camara_primaria_c: 950,
  camara_secundaria: '2 m Diámetro Interior',
  num_quemadores_secundaria: 1,
  temperatura_camara_secundaria_c: 850,
  requerimiento_energetico: '390 kWh',
  sistema_carga: 'CARGA MANUAL TACHOS 60L',
  sistema_descarga: 'MANUAL HACIA MAXISACOS',
  disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
  almacenamiento_gas: '4000L X 2 = 8.000L GAS GLP',
  observaciones: 'Sistema secundario.',
};

const CUSTOM: CatalogoCustomEntry = {
  id: 'abc123',
  tipo: 'incinerador',
  marca_modelo: 'MI INCINERADOR X',
  capacidad_carga_kg_h: 80,
  incinerador_detalle: {
    horas_funcionamiento: 10,
    camara_primaria: '1.2 m',
    num_quemadores_primaria: 2,
    temperatura_camara_primaria_c: 900,
    camara_secundaria: '1.8 m',
    num_quemadores_secundaria: 1,
    temperatura_camara_secundaria_c: 800,
    requerimiento_energetico: '10 KW/h',
    sistema_carga: 'CARGA MANUAL TACHOS 60L',
    sistema_descarga: 'MANUAL HACIA MAXISACOS',
    disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
    almacenamiento_gas: 'N/A',
    observaciones: 'Custom guardado.',
  },
  creadoPor: 'eflores@certimar.cl',
  __createdAt: new Date(),
};

describe('estadoDesdeIncinerador', () => {
  it('mapea campos a incinerador y parametros_incineracion', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'addfield-thunder-1000');
    expect(incinerador.activo).toBe(true);
    expect(incinerador.id_catalogo).toBe('addfield-thunder-1000');
    expect(incinerador.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
    expect(incinerador.horas_funcionamiento_dia).toBe(8);
    expect(incinerador.num_quemadores_primaria).toBe(1);
    expect(parametros_incineracion.camara_primaria).toBe('1.450 m diámetro interior');
    expect(parametros_incineracion.temperatura_operacion).toBe('950°C / 850°C');
    expect(parametros_incineracion.capacidad_carga_kg_h).toBe(150);
  });
});

describe('incineradorDesdeCustom', () => {
  it('extrae el detalle anidado a IncineradorCompleto', () => {
    const full = incineradorDesdeCustom(CUSTOM);
    expect(full.marca_modelo).toBe('MI INCINERADOR X');
    expect(full.capacidad_carga_kg_h).toBe(80);
    expect(full.horas_funcionamiento).toBe(10);
    expect(full.num_quemadores_primaria).toBe(2);
  });
});

describe('resolverIncinerador', () => {
  it('value vacío o nuevo → estado en blanco editable', () => {
    const { incinerador } = resolverIncinerador(ID_NUEVO_INCINERADOR, [ESTATICO], [CUSTOM]);
    expect(incinerador.id_catalogo).toBe(ID_NUEVO_INCINERADOR);
    expect(incinerador.marca_modelo).toBe('');
    expect(incinerador.horas_funcionamiento_dia).toBe(8);
  });
  it('value estático → resuelve del catálogo estático', () => {
    const { incinerador } = resolverIncinerador('addfield-thunder-1000', [ESTATICO], [CUSTOM]);
    expect(incinerador.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
  });
  it('value custom:<id> → resuelve del catálogo custom', () => {
    const { incinerador } = resolverIncinerador('custom:abc123', [ESTATICO], [CUSTOM]);
    expect(incinerador.marca_modelo).toBe('MI INCINERADOR X');
    expect(incinerador.id_catalogo).toBe('custom:abc123');
  });
});

describe('buildIncineradorEntry', () => {
  it('construye CatalogoCustomEntry con detalle anidado desde el estado', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'x');
    const entry = buildIncineradorEntry(incinerador, parametros_incineracion, 'eflores@certimar.cl', null);
    expect(entry.tipo).toBe('incinerador');
    expect(entry.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
    expect(entry.capacidad_carga_kg_h).toBe(150);
    expect(entry.incinerador_detalle?.camara_primaria).toBe('1.450 m diámetro interior');
    expect(entry.incinerador_detalle?.temperatura_camara_secundaria_c).toBe(850);
  });
  it('recorta espacios en marca_modelo', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'x');
    const entry = buildIncineradorEntry({ ...incinerador, marca_modelo: '  EQ  ' }, parametros_incineracion, 'a', null);
    expect(entry.marca_modelo).toBe('EQ');
  });
});

describe('findIncineradorDuplicado', () => {
  it('encuentra por marca_modelo ignorando mayúsculas/espacios', () => {
    const dup = findIncineradorDuplicado([CUSTOM], '  mi incinerador x ');
    expect(dup?.id).toBe('abc123');
  });
  it('no confunde con otros tipos', () => {
    const tri: CatalogoCustomEntry = { ...CUSTOM, id: 'z', tipo: 'trituradora' };
    expect(findIncineradorDuplicado([tri], 'MI INCINERADOR X')).toBeUndefined();
  });
});
