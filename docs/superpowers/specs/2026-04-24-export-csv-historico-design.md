# Export CSV del Histórico

**Fecha:** 2026-04-24
**Estado:** Aprobado

## Objetivo

Agregar un botón en el tab Histórico que permita exportar todos los registros de Firestore a un archivo CSV con las métricas clave de cada inspección.

## Cambios en Firestore

### Campo `creadoEn`

- Al crear un documento en `historico` por primera vez (tanto en `handleGuardar()` como en `saveToHistorico()`), agregar `creadoEn: serverTimestamp()` condicionalmente.
- Usar `...(esNuevo && { creadoEn: serverTimestamp() })` dentro del objeto `setDoc` con `merge: true`.
- Los registros existentes sin el campo mostrarán celda vacía en el CSV — no se retroalimentan.

## Función de Export

Nueva función `exportHistoricoCSV()` en `App.tsx`:

1. Hace `getDocs(collection(db, 'historico'), orderBy('__updatedAt', 'desc'))` sin límite.
2. Mapea cada documento a una fila con las columnas definidas.
3. Genera el CSV como string con separador `,` y salto de línea `\r\n`.
4. Prefija con BOM UTF-8 (`﻿`) para compatibilidad con Excel en español.
5. Crea un `Blob` y dispara la descarga con nombre `historico_certimar_{YYYY-MM-DD}.csv`.

## Columnas del CSV

| Columna CSV | Fuente en `RegistroHistorico` |
|---|---|
| `registroId` | `registroId` |
| `codigoCentro` | `codigoCentro` |
| `nombreCentro` | `nombreCentro` |
| `titular` | `titular` |
| `fechaInspeccion` | `fechaInspeccion` |
| `creadoEn` | `creadoEn` (nuevo campo, Firestore Timestamp → ISO string) |
| `ultimaModificacion` | `__updatedAt` (Firestore Timestamp → ISO string) |
| `esBorrador` | `esBorrador` |
| `aprobado` | `aprobado` |
| `firmado` | `firmado` |
| `enviadoSernapesca` | `enviado_sernapesca` |
| `clienteNotificado` | `cliente_notificado` |
| `documentosGenerados` | `documentosGenerados` (array → join con `;`) |
| `capExtraccion_TN_dia` | `metricas.capExtraccion` |
| `capDesnaturalizacion_TN_dia` | `metricas.capDesnaturalizacion` |
| `capAlmacenamiento_TN` | `metricas.capAlmacenamiento` |
| `cumpleExtraccion` | `metricas.cumpleExtraccion` |
| `cumpleDesnaturalizacion` | `metricas.cumpleDesnaturalizacion` |
| `cumpleAlmacenamiento` | `metricas.cumpleAlmacenamiento` |
| `sistemaExtraccion` | `metricas.sistemaExtraccion` |
| `sistemaDesnaturalizacion` | `metricas.sistemaDesnaturalizacion` |
| `modoOperacionMinima` | `metricas.modoOperacionMinima` |
| `numJaulas` | `metricas.numJaulas` |
| `jaulasSimultaneas` | `metricas.jaulas_simultaneas` |
| `profundidad_m` | `metricas.profundidad_m` |

- Valores booleanos: `true` / `false`.
- Campos ausentes (`undefined` / `null`): celda vacía.
- Strings con comas o comillas: envueltos en `"..."` con comillas internas escapadas como `""`.

## Estado del botón

Nuevo estado en App: `exportingCSV: boolean` (default `false`).

- `false` → botón habilitado, texto `↓ Exportar CSV`
- `true` → botón deshabilitado, spinner + texto `Exportando...`
- Error → toast de error, `exportingCSV` vuelve a `false`

## UI — Ubicación del botón

En el encabezado del tab Histórico, a la derecha del título. Botón secundario/outline para no competir visualmente con las acciones de cada tarjeta.

```
[ Histórico ]                          [ ↓ Exportar CSV ]
```

## Nombre del archivo

`historico_certimar_{YYYY-MM-DD}.csv` donde la fecha es la del día de la exportación (`new Date().toISOString().slice(0, 10)`).

## Fuera de alcance

- Filtros por fecha o estado antes de exportar.
- Export paginado o en background.
- Retroalimentar `creadoEn` en registros históricos existentes.
