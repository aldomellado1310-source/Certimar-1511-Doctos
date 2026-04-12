# IMPROVEMENTS — CERTIMAR 1511

Registro de auditoría técnica y cambios aplicados sobre el sistema de certificación normativa.
Marco normativo: Resolución Exenta N°1511/2021 — D.S. N°320 — Sernapesca / Subpesca.

---

## [AUTOMATIZACIÓN] Agentes de Diagnóstico Post-Test y Post-Build

**Fecha:** 2026-04-12

**Archivos:** `scripts/hook-test-diagnose.sh`, `scripts/hook-build-diagnose.sh`, `~/.claude/settings.json`

**Qué hace:** Dos hooks `PostToolUse` de Claude Code que detectan automáticamente
fallos en `vitest` y `vite build`, y lanzan un agente que diagnostica la causa raíz
y aplica el fix mínimo en `src/` (nunca toca `src/domain/`).

**Zona protegida:** `src/domain/` (calculations.ts, documents.ts, constants.ts,
actaHtml.ts y sus tests) — lógica normativa legal bajo Res. Exenta N°1511/2021.

**Nota técnica:** En Windows/Git Bash usar `python` (no `python3`).

---

## Cambios Aplicados (Fase 3)

### [CRÍTICO — F1] Corrección de División por Cero en Cálculo de Ensilaje

**Archivo:** `src/domain/calculations.ts` — función `calculateDenaturation()`

**Problema:** Cuando `tiempo_procesamiento_min = 0` y `tiempo_pausa_min = 0`, la variable
`batch_duration` resultaba en `0`. La división `total_work_min / 0` producía `Infinity`, lo que
hacía que `cumple_norma` resultara `true` para cualquier configuración con tiempos en cero.
Esto permitía emitir un certificado de CUMPLIMIENTO sin que existiera capacidad real de
desnaturalización — fraude normativo.

**Solución:** Se agregó una guarda explícita antes de la división:

```typescript
if (batch_duration <= 0) {
  return { capacidad_diaria_ton: 0, cumple_norma: false, observacion_automatica: 'Error...' };
}
```

**Efecto en lógica de negocio:** El cambio solo afecta el caso borde `batch_duration = 0`.
Para todos los demás valores, el resultado es idéntico al anterior. No altera ninguna
certificación con parámetros válidos (tiempo > 0).

**Tests que verifican la corrección:** `calculations.test.ts` — bloque
`"CRÍTICO — F1: Guard DIV/0"` (3 casos de prueba).

---

### [CRÍTICO — F2] Extracción de Magic Numbers a Constantes Nombradas

**Archivo nuevo:** `src/domain/constants.ts`

**Problema:** Todos los factores regulatorios estaban hardcodeados como literales numéricos
anónimos en el cuerpo de `App.tsx`. Esto dificultaba la trazabilidad normativa y exponía
al sistema a errores silenciosos si un valor era modificado.

**Hallazgo adicional:** El valor `0.70` era usado para dos propósitos distintos:
- `η ROV > 25m` (factor de eficiencia de extracción)
- Factor de eficiencia del prepicador (reducción de tiempo de batch)

En el código original ambas constantes tenían el mismo literal `0.70`, creando un riesgo de
colisión si se refactorizaba una sin la otra.

**Solución:** Se creó `src/domain/constants.ts` con:
- `ETA_ROV_DEEP = 0.70` — eficiencia ROV en profundidad > 25m
- `PREPICADOR_BATCH_FACTOR = 0.70` — factor de reducción de duración de batch con prepicador

Ambos valores son iguales actualmente pero ahora son independientes y tienen nombre semántico
con comentario de propósito.

**Constantes creadas con referencia normativa:**

| Constante | Valor | Propósito |
|---|---|---|
| `MIN_EXTRACTION_TON_DIA` | 15 | Umbral extracción — Res. Exenta N°1511/2021 |
| `MIN_DENATURATION_TON_DIA` | 15 | Umbral desnaturalización — Res. Exenta N°1511/2021 |
| `MIN_STORAGE_TON` | 20 | Umbral almacenamiento — Res. Exenta N°1511/2021 |
| `ETA_LIFTUP_SHALLOW` | 0.95 | η LIFT-UP profundidad ≤ 25m |
| `ETA_MORTEX_SHALLOW` | 0.92 | η Mortex HW profundidad ≤ 25m |
| `ETA_ROV_SHALLOW` | 0.75 | η ROV profundidad ≤ 25m |
| `ETA_YOMA` | 0.80 | η Succión por Yoma |
| `ETA_LIFTUP_DEEP` | 0.85 | η LIFT-UP profundidad > 25m |
| `ETA_MORTEX_DEEP` | 0.82 | η Mortex HW profundidad > 25m |
| `ETA_ROV_DEEP` | 0.70 | η ROV profundidad > 25m |
| `DEPTH_THRESHOLD_M` | 25 | Umbral de profundidad para penalización |
| `FD_REDUCTION_LOW_PERSONNEL` | 0.90 | Reducción fd por personal < 3 |
| `MIN_PERSONNEL_THRESHOLD` | 3 | Mínimo personal sin penalización |
| `PAUSA_PROPORCIONAL_COEF` | 0.01 | Coeficiente pausa proporcional a jaulas |
| `PREPICADOR_BATCH_FACTOR` | 0.70 | Reducción duración batch con prepicador |
| `FORMIC_ACID_DENSITY_TN_M3` | 1.2 | Densidad ácido fórmico (TN/m³) |

---

### [ALTA — F9] Extracción de Fórmulas de Cálculo a Módulo de Dominio

**Archivo nuevo:** `src/domain/calculations.ts`

**Problema:** Las tres fórmulas regulatorias (extracción, desnaturalización, almacenamiento)
vivían embebidas como funciones anónimas dentro de `useMemo` en `App.tsx` (componente React).
Esto hacía imposible testearlas de forma aislada y mezclaba lógica de dominio con gestión
de estado de UI.

**Solución:** Se extrajeron como funciones puras exportadas:

```typescript
export function calculateExtraction(parametros): ExtractionData['resultados']
export function calculateDenaturation(equipos, parametros_batch, parametros_incineracion): DenaturationData['resultados']
export function calculateStorage(parametros): StorageData['resultados']
```

**En `App.tsx`**, los `useMemo` ahora delegan directamente a estas funciones:

```typescript
const calculatedExtraction = useMemo(
  () => calculateExtraction(state.extraction.parametros),
  [state.extraction.parametros]
);
```

**Beneficio:** Las fórmulas son ahora testeables de forma independiente, sin montar
componentes React ni simular estado. El resultado de cada certificación es reproducible
y verificable en aislamiento.

**Invariante garantizado:** El resultado de todos los cálculos es idéntico al anterior.
Solo cambió la ubicación del código, no la lógica.

---

### [ALTA — F6] Tests Unitarios de Cálculos Regulatorios

**Archivo nuevo:** `src/domain/calculations.test.ts`

**Problema:** No existía ningún test en el proyecto. Las fórmulas que determinan si un
centro CUMPLE o NO CUMPLE la norma eran completamente no verificadas.

**Solución:** Se creó una suite de 25 tests con Vitest, cubriendo:

**Extracción (7 tests):**
- Resultado finito y no negativo con parámetros estándar
- Cumplimiento con valores por defecto del sistema
- NO cumple cuando horas/jaulas son insuficientes
- Consistencia del operador `>=` con el umbral de 15 TN
- Penalización por profundidad > 25m (LIFT-UP y ROV)
- Penalización por personal < 3
- NO penalización cuando personal = 3 exactamente

**Desnaturalización Ensilaje (9 tests):**
- Resultado finito y no negativo
- Cálculo correcto con parámetros conocidos (25 min batch, 700 kg)
- **F1: DIV/0 — no produce Infinity cuando tiempo = 0**
- **F1: cumple_norma = false cuando tiempo = 0 (previene fraude)**
- **F1: guarda activa también con prepicador + tiempo = 0**
- Mensaje de error descriptivo en caso de tiempo = 0
- NO cumple cuando kilos_por_batch es insuficiente
- Prepicador reduce duración de batch en 30%
- Prepicador aumenta capacidad diaria
- Pausa = 0 con proceso > 0 no produce Infinity

**Desnaturalización Incineración (4 tests):**
- Calcula correctamente 2000 kg/h × 9h = 18 TN/día
- Incinerador de catálogo (150 kg/h) nunca alcanza 15 TN/día
- batch y ciclos = 0 para incineración (no aplica)
- NO cumple cuando capacidad_carga_kg_h = 0

**Almacenamiento (6 tests):**
- 20 m³ × 1.2 TN/m³ = 24 TN → CUMPLE
- Cumple exactamente en 20 TN (operador `>=`)
- 10 m³ × 1.2 = 12 TN → NO CUMPLE
- Consistencia del operador con umbral
- Verificación con densidad FORMIC_ACID_DENSITY_TN_M3
- Los 7 tamaños del catálogo de almacenamiento todos CUMPLEN con densidad estándar

**Comandos:**
```bash
npm test             # Ejecutar todos los tests
npm run test:watch   # Modo observador (desarrollo)
npm run test:coverage # Con reporte de cobertura
```

---

### [MEDIA — F10] Validación de Rango en Inputs Críticos

**Archivo:** `src/App.tsx` — componente `InputField` y vistas de Extracción/Desnaturalización/Almacenamiento

**Problema:** Los campos numéricos que afectan el resultado de certificación no tenían
restricción de rango. Un usuario podía ingresar `factor_densidad = 100` para obtener
CUMPLE con un estanque de 1 m³, o `tiempo_procesamiento = 0` para causar DIV/0.

**Solución:**
1. Se agregaron props `min` y `max` al componente `InputField`.
2. El handler aplica `Math.min/max` al valor antes de pasarlo al estado.
3. Se asignaron rangos razonables a todos los campos que participan en cálculos legales:

| Campo | Min | Max | Justificación |
|---|---|---|---|
| `horas_efectivas_trabajo` | 0.5 | 24 | No puede superar un día natural |
| `factor_ajuste_biomasa` | 0.1 | 2.0 | Ajuste máximo del doble de biomasa |
| `disponibilidad_base_fd` | 0.1 | 1.0 | Factor de disponibilidad (fracción) |
| `tiempo_procesamiento_min` | 1 | 240 | Mínimo 1 min; máximo 4 horas por ciclo |
| `tiempo_pausa_min` | 0 | 120 | Pausa puede ser 0 pero proceso no |
| `kilos_por_batch` | 1 | 5000 | Rango razonable para equipos de catálogo |
| `factor_densidad` | 0.5 | 2.5 | Rango físico de densidades de ácido |

**Nota:** La guarda en `calculateDenaturation()` permanece como segunda línea de defensa
independientemente de la validación de UI (defensa en profundidad).

---

### [MEDIA — F15] Corrección de Título Desnaturalización

**Archivo:** `src/App.tsx` — componente `DenaturationView`

**Problema:** El `SectionHeader` siempre mostraba `"Desnaturalización (Ensilaje)"` aunque
el sistema seleccionado fuera Incineración Térmica. El título era confuso e incorrecto.

**Solución:** El título se calcula dinámicamente según `tipo_sistema`:

```typescript
title={`Desnaturalización (${
  state.denaturation.equipos.tipo_sistema === 'Incineración'
    ? 'Incineración Térmica'
    : 'Ensilaje Químico'
})`}
```

La descripción de la sección también cambia en consecuencia.

---

## Cambios en Lógica de Negocio

> Los siguientes cambios alteran el resultado de cálculos ya existentes y se documentan
> explícitamente tal como exige la política de cambios.

**InputField — Clamp de valores mínimos:** Si un usuario había ingresado previamente un
valor fuera del rango (ej. `tiempo_procesamiento_min = 0`), al recargar la aplicación
desde `localStorage` el valor se mantiene como está. Solo al volver a editar el campo
se aplicará el clamp. Esto preserva el estado guardado y no altera retroactivamente
certificaciones previas almacenadas en borrador.

---

## Cambios Propuestos Pendientes de Aprobación

> Los siguientes cambios requieren decisión de arquitectura o impactan documentos legales.
> No se aplican directamente hasta su revisión y aprobación por el equipo.

### [PROPUESTA A — F4/F5] Implementación de Acta de Certificación e Informe Técnico PDF

La función `generatePDF()` solo genera el Certificado básico. La UI promete tres documentos.

**Propuesta:** Crear tres funciones de generación PDF independientes:
- `generateCertificado()` — documento actual (mejorado con timestamp y número de serie)
- `generateActa()` — Acta de Certificación con detalle de parámetros, fórmulas y observaciones
- `generateInformeTecnico()` — Informe fotográfico con grilla de imágenes y semáforo por sección

El botón de emisión dispararía los tres en secuencia o como un PDF consolidado multipágina.

**Impacto:** Rediseño completo del flujo de generación de documentos. Requiere definir la
estructura legal de cada documento con el certificador responsable y validar el formato con
Sernapesca antes de implementar.

**Estimación:** Trabajo de 2–3 días de desarrollo + revisión legal del contenido.

---

### [PROPUESTA B — F7/F8] Sistema de Inmutabilidad y Auditoría

**Problema:** No existe mecanismo que garantice la inmutabilidad de los documentos post-emisión
ni registro de quién emitió qué certificado y cuándo.

**Propuesta:**
1. Asignar UUID v4 a cada sesión de certificación al iniciarse
2. Embeber en el PDF: UUID, timestamp de emisión, hash SHA-256 del objeto de estado serializado
3. Implementar backend mínimo (Express + SQLite, dependencias ya instaladas) para:
   - Registrar cada emisión (UUID, timestamp, certificador, centro, capacidades calculadas)
   - Almacenar el JSON de estado completo como evidencia inmutable
   - Proveer endpoint de consulta/verificación por UUID

**Impacto:** Requiere decisión sobre arquitectura de despliegue (¿la app es local o en servidor?),
política de retención de datos y consideraciones de privacidad (RUT del certificador).

---

### [PROPUESTA C — F3] Conexión del Catálogo de Equipos al Cálculo

**Problema:** La selección de equipo del catálogo (ej. Novatech 10" = 2500 kg/h) no tiene
efecto en la capacidad certificada. El cálculo de extracción usa `limite_biomasa` (fijo por
talla de pez), no la capacidad del equipo seleccionado.

**Propuesta:** Definir con el certificador cuál es el rol regulatorio del catálogo:
- Opción A: El catálogo es solo referencia documental (estado actual, mantener)
- Opción B: La capacidad del equipo actúa como límite superior de `kg_bins`
  (`kg_bins = min(limite_biomasa × factor, capacidad_equipo_kg_ciclo)`)
- Opción C: La capacidad nominal del equipo reemplaza al `limite_biomasa`

Cualquier cambio en esta fórmula altera directamente la capacidad certificada y debe
ser validado contra la Res. Exenta N°1511/2021 antes de implementar.

**Impacto:** Cambio en lógica de negocio que podría invalidar certificaciones anteriores.
Requiere aprobación formal.

---

### [PROPUESTA D — F19] Catálogo de Incineración — Advertencia Normativa

**Problema:** El único incinerador en catálogo (Addfield THUNDER 1000, 150 kg/h) tiene una
capacidad máxima de 3.6 TN/día (24h × 150 kg/h ÷ 1000), que nunca alcanza el umbral de
15 TN/día exigido por la norma.

**Propuesta:** Dos opciones:
- Opción A: Agregar incineradores industriales con capacidad ≥ 625 kg/h al catálogo
- Opción B: Agregar advertencia visual cuando el incinerador seleccionado no puede
  alcanzar el umbral, antes de que el usuario complete el formulario

**Impacto:** Bajo (solo datos de catálogo o aviso UI). No cambia fórmulas.

---

## Archivos Nuevos Creados

| Archivo | Propósito |
|---|---|
| `src/domain/constants.ts` | Constantes regulatorias nombradas con citas normativas |
| `src/domain/calculations.ts` | Funciones puras de cálculo (extracción, desnaturalización, almacenamiento) |
| `src/domain/calculations.test.ts` | 25 tests unitarios con casos borde regulatorios |
| `IMPROVEMENTS.md` | Este documento |
| `README.md` | Documentación del proyecto (reemplazó placeholder de AI Studio) |

## Archivos Modificados

| Archivo | Cambios |
|---|---|
| `src/App.tsx` | Importa módulo de cálculo; useMemo delega a funciones puras; InputField con min/max; título dinámico en DenaturationView |
| `package.json` | Scripts de test (`test`, `test:watch`, `test:coverage`); devDependencies: `vitest`, `@vitest/coverage-v8` |
| `vite.config.ts` | Bloque `test` con configuración Vitest |

---

*Auditoría realizada: 2026-03-10*
*Sistema: CERTIMAR 1511 v2.0 Build 2026*
*Marco normativo: Res. Exenta N°1511/2021 — D.S. N°320*
