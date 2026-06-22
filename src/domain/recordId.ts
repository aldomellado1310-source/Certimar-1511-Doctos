/**
 * Identidad de un registro en Firestore.
 *
 * Antes, el ID de documento (clave de `historico`, `registros`, `respaldos` y
 * de las rutas de Storage) se derivaba del correlativo REG-XXX, y ese
 * correlativo salía de un contador guardado SOLO en localStorage. Como
 * localStorage es por navegador/dispositivo y nunca se reconciliaba con los
 * registros ya existentes en Firestore, dos registros distintos podían recibir
 * el mismo REG-XXX. Un `setDoc` con un ID ya existente sobrescribe el documento
 * anterior → se "borraban" registros al crear nuevos (el usuario percibía un
 * tope de ~15 registros).
 *
 * Solución: el ID de documento ahora es un identificador único y estable que NO
 * depende del contador local. REG-XXX queda únicamente como etiqueta visible.
 */

/** Acuña un ID de documento único para un registro nuevo. */
export function newRecordDocId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback para entornos sin crypto.randomUUID.
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Devuelve el ID de documento a usar para el registro actual.
 *
 * - Si el registro ya tiene un ID asignado (registro nuevo de esta sesión o uno
 *   cargado del histórico), se reutiliza para que las ediciones actualicen el
 *   mismo documento.
 * - Si no, se acuña uno nuevo y único. NUNCA se deriva del correlativo local.
 */
export function resolveDocId(
  existingDocId: string | null | undefined,
  mint: () => string = newRecordDocId,
): string {
  const trimmed = existingDocId?.trim();
  return trimmed ? trimmed : mint();
}
