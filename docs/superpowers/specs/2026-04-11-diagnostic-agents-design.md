# Agentes de Diagnóstico Automático — CERTIMAR 1511

**Fecha:** 2026-04-11
**Proyecto:** Certimar-1511-Doctos
**Stack:** React 19 + TypeScript + Vite + Vitest + Firebase

---

## Objetivo

Implementar dos hooks de Claude Code (`PostToolUse`) que detecten fallos automáticamente al correr tests o build, y lancen un agente que diagnostique la causa raíz y aplique el fix mínimo necesario en `src/` (protegiendo `src/domain/`).

---

## Arquitectura

```
settings.json (~/.claude/settings.json)
  └── hooks.PostToolUse [matcher: "Bash"]
        ├── scripts/hook-test-diagnose.sh   → activa cuando vitest falla (exit code ≠ 0)
        └── scripts/hook-build-diagnose.sh  → activa cuando vite build falla (exit code ≠ 0)

Flujo por hook:
  1. Claude Code ejecuta un Bash con vitest o vite build
  2. Hook recibe: comando, output, exit code via variables de entorno
  3. Script filtra: ¿es el comando correcto? ¿exit code ≠ 0?
  4. Si pasa el filtro: invoca `claude -p <PROMPT>` con el output del error
  5. Agente lee src/, identifica causa raíz, aplica fix, reporta resultado
```

---

## Componentes

### 1. `scripts/hook-test-diagnose.sh`

**Trigger:** Bash que contiene `vitest` con exit code ≠ 0.

**Lógica:**
```bash
#!/usr/bin/env bash
# Recibe variables de entorno de Claude Code:
#   CLAUDE_TOOL_NAME, CLAUDE_TOOL_INPUT, CLAUDE_TOOL_OUTPUT, CLAUDE_TOOL_EXIT_CODE

# Filtro 1: solo actuar en comandos vitest
echo "$CLAUDE_TOOL_INPUT" | grep -q "vitest" || exit 0

# Filtro 2: solo actuar si hay fallo
[ "$CLAUDE_TOOL_EXIT_CODE" = "0" ] && exit 0

# Invocar agente de diagnóstico
claude -p "$(cat <<PROMPT
[PROMPT DE TEST - ver sección Prompts]
PROMPT
)" --output-format text
```

### 2. `scripts/hook-build-diagnose.sh`

**Trigger:** Bash que contiene `vite build` con exit code ≠ 0.

**Lógica:** idéntica a hook-test-diagnose.sh pero filtra por `vite build` y usa el prompt de build.

### 3. Entrada en `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-test-diagnose.sh"
          },
          {
            "type": "command",
            "command": "bash /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-build-diagnose.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Prompts de Agente

### Prompt — Fallos de Test

```
Eres un agente de diagnóstico automático del proyecto CERTIMAR-1511-Doctos.

CONTEXTO DEL PROYECTO:
- App web de certificación normativa acuícola (Resolución Exenta N°1511/2021, Sernapesca)
- Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase + jsPDF
- Ruta: /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/

ESTRUCTURA CLAVE:
- src/domain/         → ZONA PROTEGIDA — solo lectura, lógica normativa legal
- src/App.tsx         → componente principal (~8000 líneas), aquí vive la mayoría del código UI
- src/firebase.ts     → configuración Firebase
- src/constants/      → catálogos de equipos y plataformas
- src/lib/            → utilidades

TESTS FALLIDOS (output de vitest):
---
{VITEST_OUTPUT}
---

PROCESO DE DIAGNÓSTICO:
1. Lee el mensaje de error completo — identifica archivo, línea y tipo de fallo
2. Lee el archivo afectado ANTES de proponer cualquier cambio
3. Determina si el fallo es:
   a) Regresión en UI/componentes → corrige en src/ (excepto domain/)
   b) Expectativa incorrecta en el test → analiza si el test fue escrito correctamente
      (en CERTIMAR los tests de domain/ validan norma legal — NO los cambies sin confirmación)
   c) Cambio de comportamiento intencional → reporta al usuario en vez de auto-corregir
4. Aplica el fix MÍNIMO necesario
5. Después del fix, lista los archivos modificados y explica en 2 líneas qué cambió y por qué

RESTRICCIONES ESTRICTAS:
- NUNCA modifiques src/domain/ (calculations.ts, documents.ts, constants.ts, actaHtml.ts)
- NUNCA modifiques src/domain/*.test.ts
- NUNCA aumentes timeouts como solución a fallos de timing
- NUNCA agregues dependencias nuevas (npm install)
- NUNCA refactorices código no relacionado con el error
- Si el error está EN src/domain/, detente y reporta al usuario con el diagnóstico completo

FORMATO DE REPORTE (siempre al final):
✅ Fix aplicado | Archivo: X | Causa: Y | Cambio: Z
❌ No se pudo corregir automáticamente | Razón: ...
⚠️ Requiere revisión manual | Motivo: ...
```

### Prompt — Fallos de Build

```
Eres un agente de diagnóstico automático del proyecto CERTIMAR-1511-Doctos.

CONTEXTO DEL PROYECTO:
- App web de certificación normativa acuícola (Resolución Exenta N°1511/2021, Sernapesca)
- Stack: React 19 + TypeScript 5 + Vite 6 + React 19
- Ruta: /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/

ERROR DE COMPILACIÓN (output de vite build):
---
{VITE_BUILD_OUTPUT}
---

PROCESO DE DIAGNÓSTICO:
1. Lee el error completo — identifica: archivo, línea, tipo de error TypeScript/JSX
2. Lee el archivo afectado completo antes de editar
3. Clasifica el error:
   - TS2xxx → error de tipos: busca el tipo correcto en el mismo archivo o en src/types.ts
   - TS18xxx → módulo no encontrado: verifica imports, rutas relativas
   - React hooks (#310, #321) → busca hook condicional o llamada como función directa
   - JSX syntax → error de sintaxis en el template
4. Aplica el fix mínimo
5. Si el error está en src/domain/, detente y reporta

RESTRICCIONES ESTRICTAS:
- NUNCA modifiques src/domain/
- NUNCA uses `// @ts-ignore` o `as any` como solución
- NUNCA elimines tipos — busca el tipo correcto
- NUNCA agregues dependencias
- Si el fix requiere tocar más de 3 archivos, reporta en vez de auto-corregir

FORMATO DE REPORTE (siempre al final):
✅ Fix aplicado | Archivo: X | Error TS: Y | Cambio: Z
❌ No se pudo corregir automáticamente | Razón: ...
⚠️ Requiere revisión manual | Motivo: ...
```

---

## Zona Protegida

`src/domain/` contiene lógica normativa con valor legal real. Los agentes tienen acceso de **solo lectura** a estos archivos para entender contexto, pero **nunca los modifican**:

| Archivo | Contenido |
|---------|-----------|
| `calculations.ts` | Funciones puras: extracción, desnaturalización, almacenamiento |
| `documents.ts` | Builders de documentos normativos |
| `constants.ts` | Constantes regulatorias (Res. Exenta N°1511/2021) |
| `actaHtml.ts` | Generación HTML del acta de inspección |
| `*.test.ts` | 60 tests que validan la norma |

---

## Comportamiento en casos borde

| Situación | Comportamiento del agente |
|-----------|--------------------------|
| Error está en `src/domain/` | Detiene, reporta con diagnóstico completo, no modifica |
| Fix requiere > 3 archivos | Reporta en vez de auto-corregir |
| Tests de domain fallan | Reporta con `⚠️ Requiere revisión manual` |
| Error ambiguo / causa no clara | Reporta con diagnóstico parcial, no modifica |
| Build OK / tests OK | Script sale silenciosamente (exit 0) |

---

## Archivos a crear

```
scripts/
  hook-test-diagnose.sh      # hook post-vitest
  hook-build-diagnose.sh     # hook post-vite-build
~/.claude/settings.json      # actualizar con los dos hooks PostToolUse
```

---

## Lo que NO se implementa

- Hook post-edit (demasiado ruidoso, TypeScript + editor ya cubren esto)
- Agente de mejoras proactivas (fuera de scope — solo errores)
- Modificación automática de `src/domain/` (zona normativa protegida)
- Instalación automática de dependencias
