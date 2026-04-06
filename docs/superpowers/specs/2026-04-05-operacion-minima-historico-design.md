# Spec: Operación Mínima + Histórico Rediseñado

**Fecha:** 2026-04-05
**Estado:** Aprobado

---

## Objetivo

Tres cambios coordinados:
1. **Operación Mínima** — toggle en tab General que aplica presets regulatorios
2. **PDFs en Firebase Storage** — todos los documentos generados se suben y sus URLs se persisten
3. **Histórico rediseñado** — cards + drawer lateral con métricas técnicas y acceso a documentos

---

## 1. Operación Mínima

### Activación
- Toggle manual en el tab **General**, sección nueva al inicio del tab
- Texto explicativo: "Activa los parámetros mínimos regulatorios (Res. Exenta N°1511/2021)"
- Al activar: diálogo de confirmación si ya hay parámetros cargados
  - Muestra resumen de qué valores se sobreescribirán: talla pez, jaulas simultáneas, sistema principal, preset de batch
  - Opciones: "Aplicar presets" / "Cancelar"
- Al desactivar: NO revierte automáticamente (el usuario edita manualmente)

### Presets aplicados (fuente: `src/domain/constants.ts`)
**Extracción** — de `OPERACION_MINIMA_EXTRACTION`:
- `talla_pez`: `'Pequeño (<1.5kg)'`
- `t_trabajo_override_min`: `15`
- `jaulas_simultaneas`: `2`
- `personal_operativo`: `2`
- `disponibilidad_base_fd`: `1.0`
- `sistema_principal`: `'ROV'`

**Desnaturalización** — de `OPERACION_MINIMA_BATCH_INDEX` (índice por id de trituradora) y `OPERACION_MINIMA_AQUAINOX_PREPICADOR`:
- Aplica el batch preset correspondiente al equipo seleccionado en `id_catalogo_trituradora`
- Si no hay equipo seleccionado: muestra advertencia, no aplica preset de batch

### Modelo de datos
Agregar a `GeneralData` en `types.ts`:
```ts
modo_operacion_minima?: boolean;  // default: false
```

---

## 2. Subida de PDFs a Firebase Storage

### Trigger
Al generar cualquier documento (certificado, informe, acta, registro de visita):
1. jsPDF genera el blob (o el PDF de Registro de Visita se carga desde archivo local)
2. `uploadBytes(ref(storage, \`historico/${registroId}/{tipo}.pdf\`), blob)`
3. `getDownloadURL()` → URL pública permanente
4. `updateDoc(doc(db, 'historico', docId), { [\`documentUrls.${tipo}\`]: url })`
5. Descarga local al usuario se mantiene (comportamiento actual)

**Tipos:** `certificado`, `informe`, `acta`, `registro_visita`

### Precondición
Solo se sube si `registroId` existe. Si el registro no tiene ID asignado aún, se asigna uno antes de subir (mismo comportamiento que `saveToHistorico` actual).

### Modelo de datos
Agregar a `RegistroHistorico` en `types.ts`:
```ts
documentUrls?: {
  certificado?: string;
  informe?: string;
  acta?: string;
  registro_visita?: string;
};
```

### Registros existentes (sin URLs)
- Botón "Regenerar documentos" en el drawer del registro
- Regenera certificado/informe/acta desde el snapshot del registro
- Registro de Visita: muestra "no disponible" (no recuperable automáticamente)
- El botón regenera solo los tipos que aparecen en `documentosGenerados[]`

---

## 3. Histórico rediseñado

### Layout general
- Eliminar: sección "Histórico Certificaciones" con datos estáticos (`HISTORICO_CERTIFICACIONES` en `masterData.ts`)
- Reemplazar: grid de cards dinámicas cargadas desde Firestore `historico`

### Cards
Cada card muestra:
- `registroId` + `codigoCentro`
- `nombreCentro` + `titular`
- `fechaInspeccion`
- Badges de cumplimiento: tres chips (Extracción / Desnat / Almac) en verde/rojo
- Chips de documentos disponibles: por cada tipo en `documentosGenerados[]`, badge gris si no tiene URL / verde si tiene URL en `documentUrls`
- Indicador `modoOperacionMinima` si aplica
- Botones de estado: aprobado, firmado, enviado_sernapesca, cliente_notificado (ya existentes)

### Drawer lateral (400px)
Se abre al hacer click en una card. Contenido:
- **Encabezado:** registroId, centro, titular, fecha
- **Métricas técnicas:**
  - Capacidad Extracción (TN/día) — cumple/no cumple
  - Capacidad Desnaturalización (TN/día) — cumple/no cumple
  - Capacidad Almacenamiento (TN) — cumple/no cumple
  - Sistema de extracción, sistema de desnaturalización
  - N° jaulas totales, jaulas simultáneas, profundidad (m)
  - Modo Operación Mínima: sí/no
- **Documentos:**
  - Por cada tipo (certificado, informe, acta, registro_visita):
    - Si tiene URL: botón "Abrir PDF" → `window.open(url, '_blank')`
    - Si no tiene URL pero está en `documentosGenerados`: botón "Regenerar"
    - Si no está en `documentosGenerados`: no se muestra
- **Acciones:** "Cargar en formulario" (comportamiento actual de `loadFromHistorico`)

### Métricas — cálculo y persistencia
Las métricas no se recalculan en el drawer — se leen del campo `metricas` guardado en Firestore.

Al llamar a `saveToHistorico`, además del snapshot actual, se guardan las métricas calculadas:
```ts
metricas: {
  capExtraccion: state.extraction.resultados.capacidad_diaria_ton,
  capDesnaturalizacion: state.denaturation.resultados.capacidad_diaria_ton,
  capAlmacenamiento: state.storage.resultados.capacidad_almacenaje_ton,
  cumpleExtraccion: state.extraction.resultados.cumple_norma,
  cumpleDesnaturalizacion: state.denaturation.resultados.cumple_norma,
  cumpleAlmacenamiento: state.storage.resultados.cumple_norma,
  sistemaExtraccion: state.extraction.parametros.sistema_principal,
  sistemaDesnaturalizacion: state.denaturation.equipos.tipo_sistema,
  modoOperacionMinima: state.general.modo_operacion_minima ?? false,
  numJaulas: state.extraction.parametros.numero_total_jaulas,
  jaulas_simultaneas: state.extraction.parametros.jaulas_simultaneas,
  profundidad_m: state.extraction.parametros.profundidad_operacion_m,
}
```

Para registros existentes sin `metricas`: se infieren del `snapshot` en el drawer (calcular on-the-fly, no persistir).

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Agregar `modo_operacion_minima` a `GeneralData`; agregar `documentUrls` y `metricas` a `RegistroHistorico` |
| `src/App.tsx` | Toggle + diálogo Op. Mínima; subida PDF en generación; `saveToHistorico` con métricas; drawer histórico; eliminar datos estáticos |
| `src/constants/masterData.ts` | Eliminar `HISTORICO_CERTIFICACIONES` y su tipo |

---

## Fuera de alcance

- Notificaciones push al subir documentos
- Control de versiones de PDFs (sobreescribe el mismo path)
- Regeneración automática en background al cargar el histórico
