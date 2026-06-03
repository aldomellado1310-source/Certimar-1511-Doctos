# Incinerador manual + catálogo reutilizable — Diseño

**Fecha:** 2026-06-03
**Rama:** feat/borradores-workflow
**Estado:** Aprobado para implementación

## Problema

Hoy la tarjeta "Incinerador Secundario (Sistema Complementario)" solo permite
**seleccionar** un incinerador desde un catálogo estático de 2 entradas
([masterData.ts:145](../../../src/constants/masterData.ts)). Al seleccionar, los
campos de detalle (cámaras, temperaturas, quemadores, requerimiento energético,
sistemas de carga/descarga, etc.) se rellenan en **solo-lectura**
([App.tsx:7900-7919](../../../src/App.tsx)).

No existe forma de:
1. Ingresar un incinerador nuevo llenando todos sus campos manualmente.
2. Guardar ese incinerador para reutilizarlo en otras certificaciones.
3. Editar los campos de un incinerador seleccionado solo para la certificación actual.

El sistema de catálogo custom ya existe (`catalogo_custom` en Firestore, tipo
`CatalogoCustomEntry`, componente `CatalogoEquiposAdmin`), pero para incinerador
solo persiste `marca_modelo` + `capacidad_carga_kg_h`, y el desplegable de la
tarjeta ni siquiera lista las entradas custom.

## Enfoque elegido (A): campos editables + guardar inline

Convertir los campos de detalle del incinerador en inputs **siempre editables**,
pre-llenados al seleccionar. El desplegable lista catálogo estático + guardados +
opción "Nuevo manual". Un botón "Guardar en catálogo" persiste los valores
actuales. Una sola superficie de edición cubre los tres flujos.

## Modelo de datos

Extender `CatalogoCustomEntry` ([types.ts:225](../../../src/types.ts)) con un
objeto anidado opcional. `capacidad_carga_kg_h` se mantiene plano (ya existe y lo
usa la tabla del admin); el resto del detalle va anidado para no contaminar el
tipo con 13 campos exclusivos del incinerador.

```ts
incinerador_detalle?: {
  horas_funcionamiento: number;
  camara_primaria: string;
  num_quemadores_primaria: number;
  temperatura_camara_primaria_c: number;
  camara_secundaria: string;
  num_quemadores_secundaria: number;
  temperatura_camara_secundaria_c: number;
  requerimiento_energetico: string;
  sistema_carga: string;
  sistema_descarga: string;
  disposicion_final: string;
  almacenamiento_gas: string;
  observaciones: string;
};
```

Persistencia: colección Firestore `catalogo_custom` (sin cambios de colección).

## Comportamiento de la tarjeta (UI + estado)

El desplegable "Incinerador (Catálogo)" ([App.tsx:7879](../../../src/App.tsx))
pasa a tener tres grupos (`<optgroup>`):

```
Seleccionar incinerador...
── Catálogo estándar ──
  ADDFIELD / THUNDER 1000 — 150 kg/h
  INCINERADOR 300 — 50 kg/h
── Guardados ──            (CatalogoCustomEntry tipo 'incinerador')
  <los que el usuario haya guardado>
── ➕ Nuevo incinerador (manual)
```

El bloque `ReadOnly` ([App.tsx:7900-7919](../../../src/App.tsx)) se reemplaza por
**inputs editables** (los mismos `InputField` / `<select>` usados en el resto de
la tarjeta), siempre escribibles. Se pre-llenan al seleccionar; el usuario puede
ajustarlos.

`handleSelectIncineradorSecundario` ([App.tsx:3631](../../../src/App.tsx)) se
amplía para:
- Resolver también entradas custom (buscar en `catalogoCustom` además del
  catálogo estático), mapeando `incinerador_detalle` → `state.denaturation.incinerador`.
- Caso "nuevo manual": limpiar los campos del incinerador (id_catalogo marcador,
  ej. `'__nuevo__'`) dejándolos editables en blanco.

Todos los valores siguen viviendo en `state.denaturation.incinerador`.

### Flujos resultantes
- **Manual:** "➕ Nuevo incinerador" → campos en blanco/editables → llenar →
  (opcional) Guardar.
- **Editar para esta cert:** seleccionar guardado → ajustar campo → **no**
  guardar → solo afecta este certificado.
- **Estático/guardado tal cual:** seleccionar y listo.

## Guardar en catálogo (persistencia)

Botón **"Guardar en catálogo"** bajo los campos (visible cuando
`incinerador.activo`). Al pulsarlo:

1. Valida `marca_modelo` no vacío (igual que el admin).
2. Arma `CatalogoCustomEntry` con `tipo: 'incinerador'`, `marca_modelo`,
   `capacidad_carga_kg_h` plano + `incinerador_detalle` con los 13 campos del estado.
3. Si `marca_modelo` ya existe entre los guardados → `updateDoc` de ese registro
   (cubre "actualizar guardado"); si no → `addDoc`. Mismo patrón que
   `saveCustomEquipo` ([App.tsx:3567](../../../src/App.tsx)).
4. Actualiza `catalogoCustom` en memoria; el ítem aparece en el grupo "Guardados"
   y queda seleccionado. Feedback "Guardando…/Guardado ✓".

## Editar / eliminar después (admin)

En `CatalogoEquiposAdmin` ([CatalogoEquiposAdmin.tsx](../../../src/components/CatalogoEquiposAdmin.tsx)):
- Cuando `tipo === 'incinerador'`, el formulario muestra **todos** los campos del
  detalle (hoy solo `capacidad_carga_kg_h`).
- **Editar (nuevo):** botón de editar por fila que pre-carga el formulario con la
  entrada; al guardar hace `updateDoc` en vez de `addDoc`. El editar es genérico,
  pero el formulario completo de detalle solo se despliega para incinerador.
- **Eliminar:** ya existe ([CatalogoEquiposAdmin.tsx:120](../../../src/components/CatalogoEquiposAdmin.tsx)).

## Impacto en documentos

Acta y PDF leen de `state.denaturation.incinerador`, que se llena igual que hoy.
**Sin cambios** en `actaHtml.ts` ni en los builders de documentos.

## Pruebas

Extraer como funciones puras en `src/domain/` (patrón de `calculations.ts`):
- Resolución de selección: estático, custom, y modo "nuevo" → estado del incinerador.
- Armado de `CatalogoCustomEntry` con `incinerador_detalle` desde el estado.
- Detección de duplicado por `marca_modelo` → decidir update vs. add.

Tests unitarios con Vitest para cada una.

## Changelog

Actualizar `CHANGELOG_VERSION` y agregar paso al modal de novedades (convención
del proyecto: cada deploy visible se reporta en el modal).

## Fuera de alcance (YAGNI)

- No se toca el incinerador como sistema **principal** (rama `tipo_sistema === 'Incineración'`).
- No se migran los 2 incineradores estáticos a Firestore.
- El "editar después" en el admin no incluye historial de versiones ni auditoría.
