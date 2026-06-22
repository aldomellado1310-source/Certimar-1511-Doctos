# Declaración de eficiencia del prepicador en el acta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declarar en el acta (y en la observación en pantalla) cómo se calcula la capacidad diaria de desnaturalización por ensilaje y el incremento de eficiencia que aporta el prepicador (reducción de batch + aumento de capacidad antes→después con %).

**Architecture:** Fuente única en el dominio. `calculateDenaturation()` (en `src/domain/calculations.ts`) construye una glosa de texto y la expone como un campo nuevo `glosa_eficiencia_prepicador` en `resultados`. Ese mismo texto reemplaza al `glosa_prepicador` interno dentro de `observacion_automatica` (consistencia pantalla↔acta). `actaHtml.ts` inserta el campo justo antes de la línea "Duración total por batch:". Cadena vacía ⇒ sin cambios (retrocompatible).

**Tech Stack:** TypeScript, Vitest. Zona normativa protegida (`src/domain/`).

**Spec:** `docs/superpowers/specs/2026-06-22-declaracion-eficiencia-prepicador-acta-design.md`

---

## Datos de referencia (para los tests)

Con `BASE_BATCH_PARAMS` (kg/batch=700, t_proc=15, t_pausa=10 → base=25 min), 9 h (540 min), 1 olla y factor 0,70:

| Magnitud | Sin prepicador | Con prepicador |
|---|---|---|
| Duración batch | 25,0 min | 17,5 min |
| Capacidad ensilaje (round 1 dec) | 15,1 TN | 21,6 TN |
| Incremento (de redondeados) | — | (+43,0%) → `(21,6/15,1−1)×100 = 43,0` |

Estos son los valores que asertan los tests de `calculations.test.ts` y `actaHtml.test.ts` (el `FIXTURE_STATE` usa los mismos parámetros de batch).

---

## Task 1: Campo `glosa_eficiencia_prepicador` con default vacío en todas las rutas

**Files:**
- Modify: `src/types.ts:132-140`
- Modify: `src/domain/calculations.ts:132-144` (ruta incineración), `:158-168` (guard), `:215-223` (ruta ensilaje)
- Test: `src/domain/calculations.test.ts`

- [ ] **Step 1: Escribir los tests que fallan (campo vacío en casos no aplicables)**

Añade este bloque al final del `describe('Efecto del prepicador — Res. Exenta N°1511/2021', ...)` existente, justo antes de su `});` de cierre (~línea 332 de `src/domain/calculations.test.ts`):

```ts
    it('glosa_eficiencia_prepicador es cadena vacía cuando NO hay prepicador', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: false },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('glosa_eficiencia_prepicador es cadena vacía en ruta de incineración', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, tipo_sistema: 'Incineración' as const },
        BASE_BATCH_PARAMS,
        { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 2000 }
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('glosa_eficiencia_prepicador es cadena vacía en el guard de batch ≤ 0', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx vitest run src/domain/calculations.test.ts`
Expected: FALLAN con error de TypeScript / propiedad inexistente `glosa_eficiencia_prepicador`.

- [ ] **Step 3: Añadir el campo al tipo**

En `src/types.ts`, dentro de `DenaturationData['resultados']` (después de `observacion_automatica: string;`, línea 139):

```ts
    observacion_automatica: string;
    glosa_eficiencia_prepicador: string;
```

- [ ] **Step 4: Añadir el campo (vacío) a la ruta de incineración**

En `src/domain/calculations.ts`, en el `return` de la ruta incineración (después de `observacion_automatica: ...`, ~línea 143), añade:

```ts
        `alcanza una capacidad de ${capacity_ton.toFixed(2)} toneladas/día.`,
      glosa_eficiencia_prepicador: '',
    };
```

- [ ] **Step 5: Añadir el campo (vacío) al guard de batch ≤ 0**

En el `return` del guard (después de su `observacion_automatica: ...`, ~línea 167):

```ts
        'Verifique los parámetros de batch.',
      glosa_eficiencia_prepicador: '',
    };
```

- [ ] **Step 6: Añadir el campo (vacío por ahora) a la ruta de ensilaje**

En el `return` final de la ruta ensilaje (después de `observacion_automatica: observacion,`, ~línea 222):

```ts
    observacion_automatica: observacion,
    glosa_eficiencia_prepicador: '',
  };
```

- [ ] **Step 7: Correr los tests para verificar que pasan**

Run: `npx vitest run src/domain/calculations.test.ts`
Expected: PASAN (los tres nuevos + los existentes).

- [ ] **Step 8: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en `src/`. (El único error preexistente conocido está en `vite.config.ts`, no relacionado.)

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/domain/calculations.ts src/domain/calculations.test.ts
git commit -m "feat: campo glosa_eficiencia_prepicador (vacío) en resultados de desnaturalización"
```

---

## Task 2: Poblar la glosa (método de cálculo + efecto del prepicador) en la ruta ensilaje

**Files:**
- Modify: `src/domain/calculations.ts:188-223`
- Test: `src/domain/calculations.test.ts`

- [ ] **Step 1: Escribir los tests que fallan (contenido de la glosa)**

Añade al mismo `describe('Efecto del prepicador …')`, después de los tests del Task 1:

```ts
    it('glosa declara el método de cálculo, el factor y el incremento de capacidad', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      // Encabezado: cómo se calcula la capacidad (antes de mencionar el prepicador)
      expect(r.glosa_eficiencia_prepicador).toContain(
        'La capacidad diaria de desnaturalización por ensilaje se calcula como:'
      );
      // Efecto del prepicador: factor, reducción de batch e incremento de capacidad
      expect(r.glosa_eficiencia_prepicador).toContain('factor de eficiencia: 70%');
      expect(r.glosa_eficiencia_prepicador).toContain('se reduce de 25,0 a 17,5 min');
      expect(r.glosa_eficiencia_prepicador).toContain(
        'incrementa dicha capacidad de 15,1 a 21,6 TN/día (+43,0%)'
      );
    });

    it('el método aparece ANTES de la mención del prepicador en la glosa', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const g = r.glosa_eficiencia_prepicador;
      expect(g.indexOf('se calcula como:')).toBeLessThan(g.indexOf('Con prepicador activo'));
    });

    it('glosa vacía cuando el prepicador está activo pero el factor es 1 (sin ganancia)', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true, factor_eficiencia_prepicador: 1 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('la observación en pantalla incluye la misma glosa (fuente única)', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.observacion_automatica).toContain('incrementa dicha capacidad de 15,1 a 21,6 TN/día');
    });
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx vitest run src/domain/calculations.test.ts`
Expected: FALLAN — la glosa está vacía (Task 1 la dejó en `''`).

- [ ] **Step 3: Reemplazar el bloque `glosa_prepicador` por la glosa extendida**

En `src/domain/calculations.ts`, **reemplaza** el bloque actual (líneas ~188-192):

```ts
  const glosa_prepicador = equipos.cuenta_con_prepicador
    ? `Con prepicador activo (factor de eficiencia: ${Math.round(factor_pre * 100)}%), ` +
      `la duración total del batch se reduce de ${batch_duration_base.toFixed(1)} min a ` +
      `${batch_duration.toFixed(1)} min. `
    : '';
```

por:

```ts
  // Glosa declarativa de eficiencia del prepicador (método de cálculo + efecto).
  // Coma decimal (es-CL), determinista y sin dependencia de locale/ICU del entorno.
  const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');
  let glosa_eficiencia_prepicador = '';
  if (equipos.cuenta_con_prepicador && factor_pre < 1) {
    const cap_sin = parseFloat(
      (((total_work_min / batch_duration_base) * parametros_batch.kilos_por_batch * n_ollas) / 1000).toFixed(1)
    );
    const cap_con = parseFloat(capacity_ton.toFixed(1));
    const metodo =
      'La capacidad diaria de desnaturalización por ensilaje se calcula como: ' +
      '(horas de trabajo × 60 ÷ duración total del batch) × kilos por batch × ' +
      'N° de ollas trituradoras ÷ 1.000. ';
    const efectoCap =
      cap_sin > 0
        ? `, lo que incrementa dicha capacidad de ${fmt1(cap_sin)} a ${fmt1(cap_con)} TN/día ` +
          `(+${fmt1(parseFloat(((cap_con / cap_sin - 1) * 100).toFixed(1)))}%)`
        : '';
    glosa_eficiencia_prepicador =
      metodo +
      `Con prepicador activo (factor de eficiencia: ${Math.round(factor_pre * 100)}%), ` +
      `la duración total del batch se reduce de ${fmt1(batch_duration_base)} a ${fmt1(batch_duration)} min` +
      efectoCap +
      '. ';
  }
```

- [ ] **Step 4: Usar la nueva glosa en `observacion` (reemplaza la referencia a `glosa_prepicador`)**

En la construcción de `observacion` (~línea 204), reemplaza `glosa_prepicador +` por `glosa_eficiencia_prepicador +`:

```ts
    `${equipos.horas_funcionamiento_dia} = ${total_work_min} min) ` +
    glosa_eficiencia_prepicador +
    `Duración total por batch: ${batch_duration.toFixed(1)} min / ` +
```

- [ ] **Step 5: Exponer la glosa en el `return` de la ruta ensilaje**

Reemplaza la línea `glosa_eficiencia_prepicador: '',` del `return` de ensilaje (añadida en Task 1, ~línea 222) por la variable:

```ts
    observacion_automatica: observacion,
    glosa_eficiencia_prepicador,
  };
```

- [ ] **Step 6: Correr los tests para verificar que pasan**

Run: `npx vitest run src/domain/calculations.test.ts`
Expected: PASAN todos (nuevos del Task 1 y Task 2 + existentes — los tests previos del prepicador solo verifican `duracion_total_batch_min`/`capacidad_diaria_ton`, no la redacción).

- [ ] **Step 7: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en `src/`.

- [ ] **Step 8: Commit**

```bash
git add src/domain/calculations.ts src/domain/calculations.test.ts
git commit -m "feat: glosa de eficiencia del prepicador (método + incremento de capacidad)"
```

---

## Task 3: Insertar la glosa en el acta HTML

**Files:**
- Modify: `src/domain/actaHtml.ts:280-283`
- Test: `src/domain/actaHtml.test.ts`

- [ ] **Step 1: Escribir los tests que fallan (presencia/ausencia en el acta)**

Añade este `describe` al final de `src/domain/actaHtml.test.ts` (antes del fin de archivo):

```ts
describe('buildActaHtml — glosa de eficiencia del prepicador (ensilaje)', () => {
  const stateConPrepicador = {
    ...FIXTURE_STATE,
    denaturation: {
      ...FIXTURE_STATE.denaturation,
      equipos: { ...FIXTURE_STATE.denaturation.equipos, cuenta_con_prepicador: true },
    },
  };

  it('incluye la glosa cuando el prepicador está activo', () => {
    const html = buildActaHtml(stateConPrepicador);
    expect(html).toContain('La capacidad diaria de desnaturalización por ensilaje se calcula como:');
    expect(html).toContain('Con prepicador activo (factor de eficiencia: 70%)');
    expect(html).toContain('incrementa dicha capacidad de 15,1 a 21,6 TN/día (+43,0%)');
  });

  it('NO incluye la glosa cuando no hay prepicador (sin regresión)', () => {
    const html = buildActaHtml(FIXTURE_STATE);
    expect(html).not.toContain('incrementa dicha capacidad');
    expect(html).not.toContain('Con prepicador activo');
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx vitest run src/domain/actaHtml.test.ts`
Expected: FALLA el test "incluye la glosa…" (el acta aún no inserta la glosa). El test de ausencia ya pasa.

- [ ] **Step 3: Insertar la glosa antes de "Duración total por batch:"**

En `src/domain/actaHtml.ts`, en el reemplazo de la observación de ensilaje (líneas 280-283), antepón `${calcDen.glosa_eficiencia_prepicador}` al valor de reemplazo:

```ts
  html = rep(html,
    'Duraci&oacute;n total por batch: 23 min + 10.6 min = 33,6 min / N&uacute;mero de batches por d&iacute;a: 540 &divide; 33,6 = 16,07 batches',
    `${calcDen.glosa_eficiencia_prepicador}Duración total por batch: ${batchDur.toFixed(1)} min / Número de batches por día: ${total_min} ÷ ${batchDur.toFixed(1)} = ${numBatches.toFixed(2)} batches`
  );
```

> La glosa termina en `". "`, por lo que queda separada de "Duración total por batch:". Cuando está vacía, el resultado es idéntico al actual.

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npx vitest run src/domain/actaHtml.test.ts`
Expected: PASAN ambos tests del nuevo `describe`.

- [ ] **Step 5: Correr toda la suite + TypeScript**

Run: `npm test`
Expected: toda la suite en verde.

Run: `npx tsc --noEmit`
Expected: sin errores nuevos en `src/`.

- [ ] **Step 6: Commit**

```bash
git add src/domain/actaHtml.ts src/domain/actaHtml.test.ts
git commit -m "feat: declarar la glosa de eficiencia del prepicador en el acta"
```

---

## Notas de cierre

- **Validación normativa pendiente:** la redacción final de la glosa debe validarse con el certificador responsable / Sernapesca antes de considerarla definitiva (ver nota en el spec). El código deja la redacción acordada como base.
- **Fuera de alcance (YAGNI):** tabla comparativa sin/con prepicador, capacidad combinada con incinerador en la glosa, y modificaciones al template `src/assets/acta-template.html`.
