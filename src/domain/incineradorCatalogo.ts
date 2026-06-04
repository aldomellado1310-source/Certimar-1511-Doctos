import { CatalogoCustomEntry, DenaturationData, IncineradorDetalle } from '../types';

export const ID_NUEVO_INCINERADOR = '__nuevo__';

/** Forma canónica plana de un incinerador (estático o resuelto). */
export interface IncineradorCompleto extends IncineradorDetalle {
  marca_modelo: string;
  capacidad_carga_kg_h: number;
}

const VACIO: IncineradorCompleto = {
  marca_modelo: '',
  capacidad_carga_kg_h: 0,
  horas_funcionamiento: 8,
  camara_primaria: '',
  num_quemadores_primaria: 0,
  temperatura_camara_primaria_c: 0,
  camara_secundaria: '',
  num_quemadores_secundaria: 0,
  temperatura_camara_secundaria_c: 0,
  requerimiento_energetico: '',
  sistema_carga: 'N/A',
  sistema_descarga: 'N/A',
  disposicion_final: 'N/A',
  almacenamiento_gas: 'N/A',
  observaciones: '',
};

export const INCINERADOR_VACIO: IncineradorCompleto = { ...VACIO };

/** Mapea la forma canónica al sub-estado del incinerador + parametros_incineracion. */
export function estadoDesdeIncinerador(
  full: IncineradorCompleto,
  id_catalogo: string,
): {
  incinerador: DenaturationData['incinerador'];
  parametros_incineracion: DenaturationData['parametros_incineracion'];
} {
  return {
    incinerador: {
      activo: true,
      id_catalogo,
      marca_modelo: full.marca_modelo,
      capacidad_carga_kg_h: full.capacidad_carga_kg_h,
      horas_funcionamiento_dia: full.horas_funcionamiento,
      num_quemadores_primaria: full.num_quemadores_primaria,
      num_quemadores_secundaria: full.num_quemadores_secundaria,
      temperatura_camara_primaria_c: full.temperatura_camara_primaria_c,
      temperatura_camara_secundaria_c: full.temperatura_camara_secundaria_c,
      requerimiento_energetico: full.requerimiento_energetico,
      sistema_carga: full.sistema_carga,
      sistema_descarga: full.sistema_descarga,
      disposicion_final: full.disposicion_final,
      almacenamiento_gas: full.almacenamiento_gas,
      observaciones: full.observaciones,
    },
    parametros_incineracion: {
      capacidad_carga_kg_h: full.capacidad_carga_kg_h,
      temperatura_operacion: `${full.temperatura_camara_primaria_c}°C / ${full.temperatura_camara_secundaria_c}°C`,
      camara_primaria: full.camara_primaria,
      camara_secundaria: full.camara_secundaria,
    },
  };
}

/** Extrae la forma canónica desde una entrada de catálogo custom. */
export function incineradorDesdeCustom(entry: CatalogoCustomEntry): IncineradorCompleto {
  const d = entry.incinerador_detalle;
  return {
    marca_modelo: entry.marca_modelo,
    capacidad_carga_kg_h: entry.capacidad_carga_kg_h ?? 0,
    horas_funcionamiento: d?.horas_funcionamiento ?? 8,
    camara_primaria: d?.camara_primaria ?? '',
    num_quemadores_primaria: d?.num_quemadores_primaria ?? 0,
    temperatura_camara_primaria_c: d?.temperatura_camara_primaria_c ?? 0,
    camara_secundaria: d?.camara_secundaria ?? '',
    num_quemadores_secundaria: d?.num_quemadores_secundaria ?? 0,
    temperatura_camara_secundaria_c: d?.temperatura_camara_secundaria_c ?? 0,
    requerimiento_energetico: d?.requerimiento_energetico ?? '',
    sistema_carga: d?.sistema_carga ?? 'N/A',
    sistema_descarga: d?.sistema_descarga ?? 'N/A',
    disposicion_final: d?.disposicion_final ?? 'N/A',
    almacenamiento_gas: d?.almacenamiento_gas ?? 'N/A',
    observaciones: d?.observaciones ?? '',
  };
}

/** Resuelve el value del desplegable al sub-estado correspondiente. */
export function resolverIncinerador(
  value: string,
  estaticos: Array<IncineradorCompleto & { id: string }>,
  custom: CatalogoCustomEntry[],
): {
  incinerador: DenaturationData['incinerador'];
  parametros_incineracion: DenaturationData['parametros_incineracion'];
} {
  if (value === ID_NUEVO_INCINERADOR || value === '') {
    return estadoDesdeIncinerador({ ...VACIO }, value);
  }
  if (value.startsWith('custom:')) {
    const id = value.slice('custom:'.length);
    const entry = custom.find((c) => c.id === id && c.tipo === 'incinerador');
    if (entry) return estadoDesdeIncinerador(incineradorDesdeCustom(entry), value);
  }
  const inc = estaticos.find((e) => e.id === value);
  if (inc) return estadoDesdeIncinerador(inc, value);
  return estadoDesdeIncinerador({ ...VACIO }, value);
}

/** Construye la entrada de catálogo a persistir desde el estado actual. */
export function buildIncineradorEntry(
  inc: DenaturationData['incinerador'],
  params: DenaturationData['parametros_incineracion'],
  creadoPor: string,
  createdAt: unknown,
): Omit<CatalogoCustomEntry, 'id'> {
  return {
    tipo: 'incinerador',
    marca_modelo: inc.marca_modelo.trim(),
    capacidad_carga_kg_h: inc.capacidad_carga_kg_h,
    incinerador_detalle: {
      horas_funcionamiento: inc.horas_funcionamiento_dia,
      camara_primaria: params.camara_primaria,
      num_quemadores_primaria: inc.num_quemadores_primaria,
      temperatura_camara_primaria_c: inc.temperatura_camara_primaria_c,
      camara_secundaria: params.camara_secundaria,
      num_quemadores_secundaria: inc.num_quemadores_secundaria,
      temperatura_camara_secundaria_c: inc.temperatura_camara_secundaria_c,
      requerimiento_energetico: inc.requerimiento_energetico,
      sistema_carga: inc.sistema_carga,
      sistema_descarga: inc.sistema_descarga,
      disposicion_final: inc.disposicion_final,
      almacenamiento_gas: inc.almacenamiento_gas,
      observaciones: inc.observaciones,
    },
    creadoPor,
    __createdAt: createdAt,
  };
}

/** Busca un incinerador custom con la misma marca/modelo (normalizado). */
export function findIncineradorDuplicado(
  catalogo: CatalogoCustomEntry[],
  marca_modelo: string,
): CatalogoCustomEntry | undefined {
  const norm = marca_modelo.trim().toLowerCase();
  return catalogo.find(
    (c) => c.tipo === 'incinerador' && c.marca_modelo.trim().toLowerCase() === norm,
  );
}
