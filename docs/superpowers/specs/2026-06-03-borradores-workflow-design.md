# Borradores: flujo de guardado y retomado — Diseño

**Fecha:** 2026-06-03
**Estado:** Aprobado (diseño)

## Objetivo

Permitir guardar registros como borradores para avanzar con otros sin perder
trabajo, con marcado y visibilidad claros, y facilitar retomarlos. Mejora
integral sobre el sistema de borradores que ya existe parcialmente en
`src/App.tsx`.

## Contexto actual (lo que ya existe)

- **`comenzarRegistro()`** ([App.tsx:2136]) — asigna correlativo `REG-00X`,
  limpia el formulario (conserva certificador), pide confirmación. **No guarda
  el registro actual antes de limpiar.**
- **`handleGuardar(section)`** ([App.tsx:2158]) — guarda el estado en
  `registros/{docId}` y hace upsert en `historico/{docId}` con
  `esBorrador: true`, respetando el guard `keepNonBorrador` (no degrada a
  borrador un registro que ya generó documentos).
- **`saveToHistorico(tipo, url)`** ([App.tsx:2248]) — al generar un documento
  pone `esBorrador: false`.
- **`loadFromHistorico(entry)`** ([App.tsx:2439]) — carga un snapshot en el
  formulario, con bloqueo (lock) y merge de URLs de IDB. **Advierte que los
  cambios no guardados se perderán, pero no los guarda.**
- **Histórico (UI)** ([App.tsx:6945]) — grilla de tarjetas con badge "Borrador",
  badges de cumplimiento/documentos, chips de estado (Aprobado/Firmado/
  SERNAPESCA/Notificado, deshabilitados mientras es borrador) y botones
  "Ver detalle" / "Cargar".
- **`RegistroHistorico`** ([types.ts:248]) ya tiene `esBorrador?`, `aprobado?`,
  `firmado?`, `enviado_sernapesca?`, `cliente_notificado?`, `snapshot`,
  `metricas`, `__updatedAt`.

## Decisiones de diseño

- **Sin cambios de esquema de datos.** Reusa `esBorrador`, `__updatedAt`,
  `snapshot`, `metricas`.
- **Borradores viven dentro del Histórico** (filtro/segmented control), no en
  una colección, tabla ni pestaña nueva.
- **Un archivo nuevo:** `src/domain/draftStatus.ts` (función pura) + su test.
  El resto son ediciones en `src/App.tsx`.

## Piezas

### Pieza 0 — Refactor base: `persistDraft()`

Extraer la lógica de "guardar estado + upsert histórico como borrador" que hoy
vive dentro de `handleGuardar` a una función reutilizable:

```
persistDraft(motivo: 'manual' | 'auto' | 'section'): Promise<boolean>
```

- Guarda el estado en `registros/{docId}` (misma lógica de limpieza de imágenes
  base64/blob → solo URL `https://`).
- Hace upsert en `historico/{docId}` con `esBorrador: true`, respetando
  `keepNonBorrador` (no degradar registros que ya generaron documentos).
- Actualiza `historicoEntries` en memoria (igual que hoy).
- Devuelve `true` si el guardado en Firestore tuvo éxito, `false` si falló.

`handleGuardar(section)` pasa a ser un wrapper: `persistDraft('section')` +
feedback visual de sección (`setGuardadoSection`, `exportDraft()`). **No cambia
el comportamiento observable actual.**

### Pieza 1 — Acción explícita "Guardar borrador"

- Botón **"Guardar borrador"** visible junto a "Comenzar registro"
  (sidebar/header). Llama `persistDraft('manual')` y muestra toast
  "Borrador guardado".
- Habilitado solo si hay `state.registroId` y algún dato de centro
  (p.ej. `codigo_centro` o `nombre_centro` no vacío). Deshabilitado si no hay
  nada que guardar.

### Pieza 2 — No perder trabajo al cambiar de registro

- En `comenzarRegistro()` y `loadFromHistorico()`: **antes** de limpiar/cargar,
  si el estado actual tiene datos significativos (helper `hasDraftableData(state)`
  = `registroId` definido y algún campo de centro lleno), `await persistDraft('auto')`.
- Cambiar el texto del `window.confirm`:
  - De: *"Los cambios no guardados del formulario actual se perderán."*
  - A: *"El registro actual se guardará automáticamente como borrador y podrás
    retomarlo desde el Histórico."*
- **Manejo offline:** si `persistDraft('auto')` devuelve `false`, mostrar
  `window.confirm` adicional: *"No se pudo guardar el borrador actual (sin
  conexión). ¿Continuar de todas formas y descartar los cambios no guardados?"*.
  Solo continuar si el usuario acepta.

### Pieza 3 — Visibilidad / filtro en Histórico

- Control segmentado arriba de la grilla: **Todos · Borradores (N) ·
  Finalizados**, con contador de borradores.
  - "Borradores" = `esBorrador === true`.
  - "Finalizados" = `esBorrador !== true`.
- Tarjetas de borrador resaltadas: borde de acento (ámbar punteado) además del
  badge "Borrador" existente.
- Borradores ordenados primero por `__updatedAt` desc dentro de su filtro.

### Pieza 4 — Claridad para retomar

- Nueva función pura `draftStatus(snapshot, metricas)` en
  `src/domain/draftStatus.ts`:
  - Entrada: `snapshot` (estado guardado) + `metricas` (cumplimiento ya
    calculado y persistido).
  - Salida: `{ pendientes: SeccionPendiente[]; completados: number; total: number }`.
  - Secciones evaluadas: General, Extracción, Desnaturalización,
    Almacenamiento, Fotos. Reglas derivadas de los campos obligatorios ya usados
    por el checklist existente y por `metricas` (cumplimiento).
  - Con test unitario en Vitest (`src/domain/draftStatus.test.ts`).
- En la tarjeta de borrador: chips de secciones pendientes + texto
  "Editado: <fecha `__updatedAt`>".
- Botón **"Cargar" → "Continuar"** cuando `esBorrador`.

## Pruebas

- `draftStatus.test.ts`: casos de borrador vacío, parcial y completo;
  verifica `pendientes`, `completados/total`.
- Verificación manual: crear registro, llenar parcialmente, "Guardar borrador",
  "Comenzar registro" → confirmar que el anterior aparece como borrador en
  Histórico con sus secciones pendientes; "Continuar" lo recarga.
- Regresión: generar un documento sobre un borrador → pasa a Finalizado y los
  guardados posteriores no lo regresan a borrador (`keepNonBorrador`).

## Fuera de alcance (YAGNI)

- Colección/pestaña separada de borradores.
- Barra de borradores recientes global.
- Cambios en el esquema de Firestore o en las reglas de seguridad.
