# Acta HTML — Fix Sección E Operación Mínima + Campo Observaciones

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el comportamiento incorrecto de la sección E del acta para centros con operación mínima, y usar el campo `observacion_sistema` (ya existente en UI y estado) como texto de la fila Observaciones del acta.

**Architecture:** Todo el trabajo está en `src/domain/actaHtml.ts`. El bug consiste en que el bloque `if (g.modo_operacion_minima)` (líneas ~185-224) sobreescribe erróneamente los campos de BUCEO, AUTOMÁTICA y ROV con valores fijos incorrectos. La solución elimina ese bloque y quita las guardas `modo_operacion_minima` de las sustituciones anteriores. La feature de observaciones reemplaza el texto hardcodeado del template con el valor de `state.extraction.parametros.observacion_sistema`.

**Tech Stack:** TypeScript, Vitest (tests unitarios en `src/domain/`), Vite build, Firebase Hosting deploy.

---

## Contexto clave

- `src/domain/actaHtml.ts` — generador HTML del acta. Función `buildActaHtml(state)`.
- `src/assets/acta-template.html` — template oficial. **NO modificar**.
- `src/types.ts` — `ExtractionData.parametros.observacion_sistema: string` ya existe.
- `src/App.tsx:6456` — ya existe el `<textarea>` UI para `observacion_sistema`. No tocar.
- El template tiene la fila Observaciones con este texto hardcodeado (una sola ocurrencia):
  ```
  Sistema Autom&aacute;tico; Consta de {nro_jaulas} &nbsp;Lift-up/ {linea_extraccion}, 1 por Jaula , con cono extractor el cual est&aacute; amarrado al fondo de la malla.
  ```
- `{nro_jaulas}` y `{linea_extraccion}` aparecen **únicamente** dentro de esa fila Observaciones.

---

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `src/domain/actaHtml.ts` | Modificar: eliminar bloque Op. Mínima, quitar guardas, agregar reemplazo observaciones |

---

## Task 1: Corregir sección E — eliminar overrides incorrectos de Operación Mínima

**Files:**
- Modify: `src/domain/actaHtml.ts:167-224`

El problema está en tres lugares:

**1a)** La sustitución de `TON/DIA` está guardada con `if (!g.modo_operacion_minima)`, haciendo que en Op. Mínima el campo quede en blanco en vez de mostrar la capacidad calculada.

**1b)** Las sustituciones de `{jaulas_simult}`, `{cfm}` y motocompresores tienen ternarios que fuerzan `N/A` cuando `g.modo_operacion_minima` es `true`, en vez de usar los valores reales del estado.

**1c)** El bloque `if (g.modo_operacion_minima)` completo (líneas ~185-224) sobreescribe incorrectamente BUCEO a `Si/APOYO DIARIO`, AUTOMÁTICA a `NO`, y ROV a `SI/15 TON/DIA`. Debe eliminarse.

- [ ] **Step 1: Reemplazar el bloque de extracción en actaHtml.ts**

Localizar en `src/domain/actaHtml.ts` el bloque completo que va desde:
```typescript
  // ── E. Extracción ─────────────────────────────────────────────────────────
  // Capacidad calculada ton/día — solo en modo normal (AUTOMÁTICA row)
  // En Op. Mínima el TON/DIA de AUTOMÁTICA se deja en blanco y la capacidad va a ROV
  if (!g.modo_operacion_minima) {
    html = rep(html, 'TON/DIA', calcExt.capacidad_diaria_ton.toFixed(2) + ' ton/día');
  }
  // N° motocompresores/jaula — N/A en Op. Mínima (AUTOMÁTICA = NO)
  html = rep(html,
    '<span class="c10">1</span></p></td></tr><tr class="c20"><td class="c66 c39"',
    `<span class="c10">${g.modo_operacion_minima ? na : ext.parametros.motocompresores_por_jaula}</span></p></td></tr><tr class="c20"><td class="c66 c39"`
  );
  html = rep(html, '{jaulas_simult}',   g.modo_operacion_minima ? na : ext.parametros.jaulas_simultaneas.toString());
  html = rep(html, '{cfm}',             g.modo_operacion_minima ? na : ext.parametros.potencia_cfm.toString());
  html = rep(html, '{nro_jaulas}',      ext.parametros.numero_total_jaulas.toString());
  html = rep(html, '{linea_extraccion}',
    ext.parametros.marca_equipo || ext.parametros.sistema_principal
  );

  // ── Operación Mínima — overrides sección E ──────────────────────────────
  // Sistema principal = ROV (complem. extracción mortal) + Buceo como apoyo diario
  // AUTOMÁTICA y Succión por YOMA quedan en NO
  if (g.modo_operacion_minima) {
    // BUCEO: NO → Si; ton/día vacío → APOYO DIARIO
    html = rep(html,
      '<p class="c149"><span class="c12 c10">NO</span></p></td><td class="c85" colspan="1" rowspan="2"><p class="c13"><span class="c12 c10"></span></p>',
      '<p class="c149"><span class="c12 c10">Si</span></p></td><td class="c85" colspan="1" rowspan="2"><p class="c13"><span class="c12 c10">APOYO DIARIO</span></p>'
    );
    // BUCEO: N° teams N/A → 1
    html = rep(html,
      '<p class="c169"><span class="c12 c10">N/A</span>',
      '<p class="c169"><span class="c12 c10">1</span>'
    );
    // BUCEO: N° buzos/team N/A → 3
    html = rep(html,
      '<p class="c200"><span class="c12 c10">N/A</span>',
      '<p class="c200"><span class="c12 c10">3</span>'
    );
    // BUCEO: periodicidad N/A → APOYO DIARIO
    html = rep(html,
      '<p class="c157"><span class="c12 c10">N/A</span>',
      '<p class="c157"><span class="c12 c10">APOYO DIARIO</span>'
    );
    // AUTOMÁTICA: SI → NO; TON/DIA (sin reemplazar) → vacío
    html = rep(html,
      '<p class="c139"><span class="c12 c10">SI</span></p></td><td class="c85" colspan="1" rowspan="1"><p class="c57"><span class="c12 c10"><br></span></p><p class="c190"><span class="c12 c10">TON/DIA</span></p>',
      '<p class="c139"><span class="c12 c10">NO</span></p></td><td class="c85" colspan="1" rowspan="1"><p class="c57"><span class="c12 c10"><br></span></p><p class="c190"><span class="c12 c10"></span></p>'
    );
    // ROV: NO → SI; N/A ton/día → 15 TON/DIA (capacidad mínima fija)
    html = rep(html,
      '<p class="c158"><span class="c10">NO</span></p></td><td class="c85" colspan="1" rowspan="1"><p class="c103"><span class="c10">N/A</span></p>',
      '<p class="c158"><span class="c10">SI</span></p></td><td class="c85" colspan="1" rowspan="1"><p class="c103"><span class="c10">15 TON/DIA</span></p>'
    );
    // ROV: segunda fila vacía → APOYO DIARIO
    html = rep(html,
      '<p class="c175"><span class="c12 c10"></span>',
      '<p class="c175"><span class="c12 c10">APOYO DIARIO</span>'
    );
  }
```

Y reemplazarlo con:

```typescript
  // ── E. Extracción ─────────────────────────────────────────────────────────
  // Capacidad calculada ton/día (AUTOMÁTICA row) — aplica para todos los modos
  html = rep(html, 'TON/DIA', calcExt.capacidad_diaria_ton.toFixed(2) + ' ton/día');
  // N° motocompresores/jaula
  html = rep(html,
    '<span class="c10">1</span></p></td></tr><tr class="c20"><td class="c66 c39"',
    `<span class="c10">${ext.parametros.motocompresores_por_jaula}</span></p></td></tr><tr class="c20"><td class="c66 c39"`
  );
  html = rep(html, '{jaulas_simult}', ext.parametros.jaulas_simultaneas.toString());
  html = rep(html, '{cfm}',           ext.parametros.potencia_cfm > 0 ? ext.parametros.potencia_cfm.toString() : na);
  // Observaciones de extracción — texto libre (reemplazar ANTES de {nro_jaulas}/{linea_extraccion})
  html = rep(html,
    'Sistema Autom&aacute;tico; Consta de {nro_jaulas} &nbsp;Lift-up/ {linea_extraccion}, 1 por Jaula , con cono extractor el cual est&aacute; amarrado al fondo de la malla.',
    ext.parametros.observacion_sistema || na
  );
  html = rep(html, '{nro_jaulas}',      ext.parametros.numero_total_jaulas.toString());
  html = rep(html, '{linea_extraccion}',
    ext.parametros.marca_equipo || ext.parametros.sistema_principal
  );
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd c:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npx tsc --noEmit
```

Expected: sin output (0 errores).

- [ ] **Step 3: Ejecutar tests**

```bash
cd c:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm test
```

Expected: todos los tests en PASS. Los tests existentes cubren `documents.ts` y `calculations.ts`, no `actaHtml.ts`, por lo que el resultado no cambia. Si alguno falla, es un regresión en otro módulo — investigar antes de continuar.

- [ ] **Step 4: Build y deploy**

```bash
cd c:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm run build && firebase deploy --only hosting
```

Expected output final: `+ hosting[certimar-1511-doctos]: release complete`

- [ ] **Step 5: Commit**

```bash
cd c:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
git add src/domain/actaHtml.ts
git commit -m "fix: corregir sección E operación mínima y usar observacion_sistema en acta"
```

---

## Self-Review

**Spec coverage:**
- ✅ Bug: sección E muestra AUTOMÁTICA=SI con capacidad calculada para operación mínima
- ✅ Bug: no aplica overrides de BUCEO/ROV incorrectos
- ✅ Feature: fila Observaciones en acta usa `observacion_sistema` del estado
- ✅ CFM: muestra N/A cuando `potencia_cfm = 0` (comportamiento correcto para Lift-up sin compresor)
- ✅ Template no modificado

**Placeholder scan:** ninguno.

**Type consistency:** `ext.parametros.observacion_sistema` es `string` en `ExtractionData.parametros` (types.ts:55). `ext.parametros.potencia_cfm` es `number` (types.ts:49). Consistente con los usos.
