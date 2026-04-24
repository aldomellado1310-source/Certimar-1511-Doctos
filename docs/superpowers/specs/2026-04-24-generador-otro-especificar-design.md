# Spec: "Otro (Especificar)" en Generadores

**Fecha:** 2026-04-24  
**Estado:** Aprobado

## Objetivo

Permitir al usuario registrar un modelo de generador que no existe en el catálogo predefinido, seleccionando "Otro (Especificar)" en el dropdown de Modelo (Catálogo) y completando los campos manualmente.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Agregar `catalogoId?: string` al objeto de cada generador |
| `src/constants/masterData.ts` | Agregar entrada sentinel `{ id: 'otro', marca: '', modelo: '', kva: 0 }` al final de `CATALOGO_GENERADORES` |
| `src/App.tsx` | Ajustar `handleSelectGenerator`, valor del `<select>` y UI del bloque generador |

## Cambios detallados

### `types.ts`

Agregar campo opcional al array `generacion_electrica`:

```ts
generacion_electrica: Array<{
  tipo: string;
  marca: string;
  modelo: string;
  capacidad_kva: number;
  ubicacion: string;
  catalogoId?: string;  // id de CATALOGO_GENERADORES, o 'otro'
}>
```

### `masterData.ts`

Agregar al final de `CATALOGO_GENERADORES`:

```ts
{ id: 'otro', marca: '', modelo: '', kva: 0 },
```

### `App.tsx` — lógica

**`handleSelectGenerator`:**
- Si `id !== 'otro'`: comportamiento actual (rellena marca/modelo/kva) + establece `catalogoId = id`
- Si `id === 'otro'`: limpia marca `''`, modelo `''`, capacidad_kva `0`, establece `catalogoId = 'otro'`

**Valor del `<select>`:**

```ts
// Antes
value={CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo)?.id || ''}

// Después
value={gen.catalogoId || ''}
```

**Render de opciones del dropdown:**  
La opción "otro" se muestra como "Otro (Especificar)" con lógica condicional en el label, sin mostrar `"  — 0 kVA"`.

```tsx
{CATALOGO_GENERADORES.map(g => (
  <option key={g.id} value={g.id}>
    {g.id === 'otro' ? 'Otro (Especificar)' : `${g.marca} ${g.modelo} — ${g.kva} kVA`}
  </option>
))}
```

### `App.tsx` — UI

Cuando `gen.catalogoId === 'otro'`, mostrar un `InputField` adicional para **Modelo** debajo del dropdown:

```tsx
{gen.catalogoId === 'otro' && (
  <InputField
    label="Modelo"
    value={gen.modelo}
    onChange={(v) => handleUpdateGenerator(idx, 'modelo', v)}
    placeholder="Ej: WPG55L2"
  />
)}
```

Los campos Marca y Capacidad (kVA) ya son `InputField` editables — no requieren cambio.

### Migración de estado guardado

Al cargar un generador sin `catalogoId` (estado antiguo de Firestore/localStorage), inferir el valor:

```ts
catalogoId = CATALOGO_GENERADORES.find(
  g => g.modelo === gen.modelo && g.marca === gen.marca
)?.id ?? 'otro'
```

Si hay match exacto con catálogo → asignar ese `id`. Si no hay match → tratar como `'otro'`; los datos del usuario se conservan intactos y el dropdown muestra "Otro (Especificar)".

La migración se aplica donde se carga el estado (carga de Firestore y `loadFromLocalStorage`).

## Comportamiento esperado

1. El usuario agrega un generador y selecciona "Otro (Especificar)"
2. Los campos Marca, Modelo y Capacidad se limpian y quedan editables
3. El dropdown permanece en "Otro (Especificar)" aunque el usuario escriba en los campos
4. El PDF y el Acta HTML usan los valores de `gen.marca`, `gen.modelo`, `gen.capacidad_kva` — sin cambio
5. El estado se guarda y carga correctamente con el `catalogoId` persistido

## Fuera de alcance

- Guardar modelos personalizados en `CATALOGO_GENERADORES` (catálogo persistente de "otros") — queda habilitado a futuro por la arquitectura elegida
- Validación de campos obligatorios cuando `catalogoId === 'otro'`
