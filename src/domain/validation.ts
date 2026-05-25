export interface OrdenFechasResult {
  valido: boolean;
  mensaje?: string;
}

export function validarOrdenFechas(fechas: {
  evaluacion_documental: string;
  inspeccion_terreno: string;
  emision_certificado: string;
}): OrdenFechasResult {
  const { evaluacion_documental: eva, inspeccion_terreno: insp, emision_certificado: emis } = fechas;
  if (!eva || !insp || !emis) return { valido: false, mensaje: 'Fechas incompletas' };
  if (insp < eva) return { valido: false, mensaje: 'Inspección terreno no puede ser anterior a evaluación documental' };
  if (emis < insp) return { valido: false, mensaje: 'Emisión certificado no puede ser anterior a inspección terreno' };
  return { valido: true };
}
