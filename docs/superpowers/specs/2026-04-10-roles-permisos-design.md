# Diseño: Sistema de Roles y Permisos CERTIMAR

**Fecha:** 2026-04-10  
**Estado:** Aprobado

---

## Contexto

La app actualmente tiene dos roles: `admin` (solo `operaciones@certimar.cl` con PIN) y `reader` (cualquier otro `@certimar.cl`). Los inspectores de certificaciones (`informes@certimar.cl` y futuros) necesitan poder editar formularios y generar documentos PDF, pero no deben tener acceso a funciones destructivas ni de configuración del sistema.

---

## Decisiones de diseño

- **Sin PIN:** El login es directo vía Google OAuth con restricción de dominio `@certimar.cl`. No se requiere PIN para ningún rol.
- **Dos roles activos:** `admin` e `inspector`. `reader` queda como rol residual no utilizado en producción.
- **Permisos centralizados:** Un objeto `perms` calculado con `useMemo` reemplaza todos los usos de `isAdmin` dispersos en el JSX.
- **Sin banner para inspector:** El inspector tiene acceso funcional completo; no necesita aviso de modo restringido.

---

## Tipo de rol

```typescript
// Cambio en App.tsx (~línea 2251)
// Antes: 'admin' | 'reader'
type UserRole = 'admin' | 'inspector' | 'reader';
```

---

## Flujo de login

```
Google OAuth (@certimar.cl)
    ├── operaciones@certimar.cl  →  role: 'admin'    (directo, sin PIN)
    └── cualquier otro           →  role: 'inspector' (directo, sin PIN)
```

**Eliminaciones:**
- Paso PIN (`setStep('pin')`, `handlePin`, `ADMIN_PIN`, UI del PIN)
- Estado `step`, `pin`, `googleEmail` relacionados con el flujo PIN
- `AUTHORIZED_ADMINS` array (ya no necesario)

---

## Objeto `perms`

```typescript
const perms = React.useMemo(() => ({
  canEdit:                userRole === 'admin' || userRole === 'inspector',
  canSave:                userRole === 'admin' || userRole === 'inspector',
  canGenerate:            userRole === 'admin' || userRole === 'inspector',
  canAttachVisita:        userRole === 'admin' || userRole === 'inspector',
  canImportDraft:         userRole === 'admin' || userRole === 'inspector',
  canViewStats:           userRole === 'admin',
  canDeleteDraft:         userRole === 'admin',
  canDeletePhotos:        userRole === 'admin',
  canManageCatalog:       userRole === 'admin',
  canExportDraft:         userRole === 'admin',
  canModeOperacionMinima: userRole === 'admin',
}), [userRole]);
```

---

## Tabla de permisos

| Capacidad | admin | inspector | reader |
|---|:---:|:---:|:---:|
| Editar formularios | ✓ | ✓ | ✗ |
| Guardar secciones en Firestore | ✓ | ✓ | ✗ |
| Generar PDFs (Certificado, Informe, Acta) | ✓ | ✓ | ✗ |
| Adjuntar Registro de Visita PDF | ✓ | ✓ | ✗ |
| Importar borrador JSON | ✓ | ✓ | ✗ |
| Ver panel de estadísticas | ✓ | ✗ | ✗ |
| Borrar borrador | ✓ | ✗ | ✗ |
| Borrar fotos | ✓ | ✗ | ✗ |
| Gestionar logos / catálogo custom | ✓ | ✗ | ✗ |
| Exportar borrador JSON | ✓ | ✗ | ✗ |
| Modo Operación Mínima | ✓ | ✗ | ✗ |

---

## Migración de guardas JSX

| Línea aprox. | Función | Antes | Después |
|---|---|---|---|
| 2484 | Cargar catálogo custom Firestore | `isAdmin` | `perms.canManageCatalog` |
| 2495 | Cargar logos empresas Storage | `isAdmin` | `perms.canManageCatalog` |
| 4762 / 4915 | Panel estadísticas | `isAdmin` | `perms.canViewStats` |
| 5257 | Controles registro ID / generales | `isAdmin` | `perms.canEdit` |
| 5294 | Modo Operación Mínima toggle | `isAdmin` | `perms.canModeOperacionMinima` |
| 5884 | Borrar borrador | `isAdmin` | `perms.canDeleteDraft` |
| 5899 | Sección logos empresas | `isAdmin` | `perms.canManageCatalog` |
| 6482 | Guardar sección extracción | `isAdmin` | `perms.canSave` |
| 6879 | Guardar sección desnaturalización | `isAdmin` | `perms.canSave` |
| 7070 | Guardar sección almacenamiento | `isAdmin` | `perms.canSave` |
| 7227 | Borrar fotos | `isAdmin` | `perms.canDeletePhotos` |
| 7247 | Adjuntar Registro de Visita | `isAdmin` | `perms.canAttachVisita` |
| 7544 | Guardar sección informe | `isAdmin` | `perms.canSave` |
| 7668 / 7684 / 7700 | Botones generar PDF (×3) | `isAdmin` | `perms.canGenerate` |
| 7843 | Exportar borrador JSON | `isAdmin` | `perms.canExportDraft` |
| 7862 / 7865 | Importar borrador JSON | `isAdmin` | `perms.canImportDraft` |
| 7975 | Banner "MODO LECTURA" | `!isAdmin && reader` | **eliminado** |
| 7997 | Checklist flotante | `isAdmin` | `perms.canEdit` |

---

## Archivos afectados

- `src/App.tsx` — único archivo de cambios (login flow, tipo rol, objeto perms, ~20 guardas JSX)

## Tests

No hay tests de autenticación/roles actualmente. Los 60 tests de dominio existentes no se ven afectados por este cambio.
