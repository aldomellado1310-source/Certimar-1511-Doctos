# Diseño — Declaración del incremento de eficiencia del prepicador en el acta

**Fecha:** 2026-06-22
**Marco normativo:** Res. Exenta N°1511/2021 — D.S. N°320 — Sernapesca / Subpesca
**Zona afectada:** `src/domain/` (zona normativa protegida)

---

## Problema

En el proceso de Desnaturalización por Ensilaje, el **prepicador** reduce la duración total
del batch (factor de eficiencia por defecto `0,70` = −30%), lo que aumenta el número de
batches diarios y, por lo tanto, la **capacidad diaria de desnaturalización**.

El **motor de cálculo** ([`src/domain/calculations.ts`](../../../src/domain/calculations.ts))
ya aplica este efecto: `batch_duration = batch_duration_base × factor_pre`, y construye un
texto interno `glosa_prepicador` que menciona la reducción de tiempo de batch.

Sin embargo, el **acta oficial** ([`src/domain/actaHtml.ts`](../../../src/domain/actaHtml.ts))
**no declara** ese incremento de eficiencia. El acta solo inserta del prepicador: modelo,
Sí/No, capacidad kg/hr y cantidad. La observación de ensilaje reemplaza los números de batch
y capacidad **ya con el factor aplicado**, pero nunca incluye la `glosa_prepicador`. Resultado:
quien lee el acta ve una duración de batch reducida sin que se declare que esa mejora proviene
del prepicador, con qué factor, ni cuánto incrementa la capacidad.

**El efecto está en el número, pero no está declarado en el documento legal.**

---

## Objetivo

Declarar explícitamente en el acta (y, por consistencia, en la observación en pantalla):

1. **Cómo se calcula** la capacidad diaria de desnaturalización por ensilaje (fórmula).
2. **El efecto del prepicador**: reducción de la duración del batch e **incremento de la
   capacidad** resultante (antes → después, con el % de incremento).

---

## Decisiones de diseño (acordadas)

| Tema | Decisión |
|---|---|
| Forma del contenido | Glosa declarativa reusando la lógica del motor de cálculo. |
| Contenido | Reducción de tiempo de batch **+** incremento de capacidad resultante. |
| Dónde vive la lógica | **Fuente única en el dominio** (`calculations.ts`), consumida por pantalla y acta. |
| Encabezado | Incluir **el método de cálculo** de la capacidad **antes** de mencionar el prepicador. |
| Consistencia del % | Derivar el % de las **capacidades redondeadas mostradas** (no del ratio exacto). |

---

## Arquitectura y flujo de datos

Fuente única en el dominio, dos consumidores (observación en pantalla + acta).

### 1. `src/types.ts`

Añadir a `DenaturationData['resultados']` un campo dedicado:

```ts
glosa_eficiencia_prepicador: string; // '' cuando no aplica
```

Se setea en las **tres** rutas de retorno de `calculateDenaturation()` (incineración,
guard `batch ≤ 0`, ensilaje) para completitud de tipo.

### 2. `src/domain/calculations.ts` — `calculateDenaturation()` (ruta Ensilaje)

1. Calcular el escenario contrafactual **sin prepicador** (factor = 1):

   ```
   batch_duration_sin = batch_duration_base
   num_batches_sin    = total_work_min / batch_duration_base
   cap_ensilaje_sin   = num_batches_sin × kilos_por_batch × n_ollas / 1000
   ```

2. Redondear a 1 decimal **antes** de calcular el %, para que el documento cuadre al leerlo:

   ```
   cap_sin = round(cap_ensilaje_sin, 1)
   cap_con = round(capacidad_ensilaje_ton, 1)
   incremento_pct = round((cap_con / cap_sin − 1) × 100, 1)   // solo si cap_sin > 0
   ```

3. Construir `glosa_eficiencia_prepicador` (método de cálculo **+** efecto del prepicador) y
   exponerla como campo. El mismo texto reemplaza al `glosa_prepicador` actual dentro de
   `observacion_automatica`, de modo que la observación en pantalla quede consistente con el acta.

### 3. `src/domain/actaHtml.ts`

Insertar `calcDen.glosa_eficiencia_prepicador` **justo antes** de la línea
`"Duración total por batch:"` de la observación de ensilaje
([actaHtml.ts:280-283](../../../src/domain/actaHtml.ts)), replicando la posición que ya usa
el motor. Cadena vacía ⇒ no cambia nada (retrocompatible).

---

## Redacción de la glosa

Texto propuesto (ejemplo con factor 70%, 9 h, kg/batch 1.400):

> La capacidad diaria de desnaturalización por ensilaje se calcula como: (horas de trabajo × 60
> ÷ duración total del batch) × kilos por batch × N° de ollas trituradoras ÷ 1.000. Con
> prepicador activo (factor de eficiencia: **70%**), la duración total del batch se reduce de
> **33,6 a 23,5 min**, lo que incrementa dicha capacidad de **22,5 a 32,1 TN/día (+42,7%)**.

Reglas de formato:

- Números en formato **es-CL** (coma decimal, punto de miles), consistente con el resto del acta.
- **% de incremento** derivado de las capacidades **redondeadas mostradas** (22,5 → 32,1 = +42,7%),
  no del ratio exacto `1/0,70 = +42,9%`. Garantiza consistencia interna del documento.
- Capacidad comparada = **solo ensilaje** (`capacidad_ensilaje_ton`), no la combinada con
  incinerador — el prepicador solo afecta el ensilaje.

---

## Casos borde

| Condición | Comportamiento |
|---|---|
| `cuenta_con_prepicador = false` | `glosa_eficiencia_prepicador = ''` → acta y pantalla como hoy. |
| Prepicador activo pero `factor = 1` | Glosa vacía (evita declarar "se reduce de X a X / +0%"). Condición: `cuenta_con_prepicador && factor_pre < 1`. |
| Ruta de **incineración** | Campo `= ''`. |
| Guard `batch_duration ≤ 0` | Retorno temprano con campo `= ''`. |
| `cap_sin` redondeada llega a `0,0` (config extrema) | Se omite la cláusula del incremento para evitar división por cero. |

---

## Pruebas (TDD — primero fallan, luego se implementa)

### `src/domain/calculations.test.ts` (extender bloque *"Efecto del prepicador"*, ~línea 304)

- Glosa **no vacía** con prepicador activo + factor < 1; contiene el factor %, el texto del
  método y el antes→después de capacidad.
- El % mostrado = `round((round(cap_con,1) / round(cap_sin,1) − 1) × 100, 1)`.
- Glosa **vacía** en los cuatro casos borde: sin prepicador, factor = 1, ruta incineración,
  guard `batch ≤ 0`.
- El contrafactual `cap_sin` equivale a la capacidad de ensilaje con factor = 1.

### `src/domain/actaHtml.test.ts`

- Con prepicador activo, el HTML del acta **incluye** la glosa (p. ej. contiene
  "factor de eficiencia" e "incrementa dicha capacidad").
- Sin prepicador, el HTML **no** la incluye (no regresión).

---

## Nota normativa

Este cambio modifica `src/domain` (zona normativa) y el texto de un **documento legal** (acta).
La redacción final de la glosa debe **validarse con el certificador responsable / Sernapesca**
antes de considerarla definitiva. La implementación parte de la redacción aquí acordada como base.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Nuevo campo `glosa_eficiencia_prepicador: string` en `DenaturationData['resultados']`. |
| `src/domain/calculations.ts` | Contrafactual sin prepicador, % consistente, construcción de la glosa y exposición como campo; reemplaza al `glosa_prepicador` interno. |
| `src/domain/actaHtml.ts` | Inserción de la glosa antes de "Duración total por batch:". |
| `src/domain/calculations.test.ts` | Tests del campo y casos borde. |
| `src/domain/actaHtml.test.ts` | Tests de presencia/ausencia de la glosa en el acta. |

## Fuera de alcance (YAGNI)

- Tabla comparativa "sin/con prepicador" en el acta (se descartó en favor de la glosa).
- Capacidad **combinada** con incinerador en la glosa del prepicador (solo ensilaje).
- Cambios al template HTML (`src/assets/acta-template.html`): la inserción es por reemplazo en
  `actaHtml.ts`, sin tocar el template.
