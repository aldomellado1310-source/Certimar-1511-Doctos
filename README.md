# CERTIMAR 1511

**Sistema de certificación normativa para centros de cultivo de salmónidos**
Resolución Exenta N°1511/2021 — D.S. N°320 — Sernapesca / Subpesca

---

## Descripción

CERTIMAR 1511 es una aplicación web que automatiza el proceso de certificación de sistemas de manejo de mortalidad en centros de cultivo de peces (salmónidos). Calcula y valida el cumplimiento de los tres umbrales críticos exigidos por la normativa chilena:

| Sistema | Umbral mínimo |
|---|---|
| Extracción de mortalidad (jaulas → superficie) | ≥ 15 TN/día |
| Desnaturalización (ensilaje o incineración) | ≥ 15 TN/día |
| Almacenamiento de biomasa desnaturalizada | ≥ 20 TN |

Los documentos legales generados son:
- **Certificado de Sistemas de Mortalidad** (PDF)
- **Informe Técnico fotográfico** con semáforo normativo Verde / Amarillo / Rojo (PDF)
- **Acta de Inspección** (PDF)
- **Registro de Visita** adjunto al informe (PDF externo procesado y embebido)

---

## Capacidades

### Cálculo normativo y cumplimiento
- Cálculo automático de capacidad y verificación de los umbrales 15/15/20 TN (Res. 1511): **extracción**, **desnaturalización** y **almacenamiento**.
- Desnaturalización por **ensilaje** (olla trituradora + batches, con **prepicador** y **múltiples ollas en paralelo**) o por **incineración térmica**.
- **Capacidad combinada olla + incinerador**: cuando coexisten ambos, la capacidad total es la suma de los dos sistemas, con una glosa que explica la composición en el Acta (Tabla F).
- **Override manual** de la capacidad diaria del incinerador (editable por cualquier usuario): si se ingresa un valor, reemplaza al cálculo automático (carga × horas ÷ 1.000) en el Acta y en el cumplimiento; vacío = automático.

### Documentos
- Generación de **Certificado**, **Informe técnico** (semáforo Verde/Amarillo/Rojo) y **Acta de inspección** en PDF, más **Registro de Visita** embebido.
- Registro fotográfico por sección con semáforo, ubicación espacial y recorte manual.
- **Correo de notificación** (asunto + mensaje) para la entrega de documentos asociados vía carpeta Drive, listo para copiar y pegar.
- Nomenclatura de archivos y de asunto conforme al **Oficio DN-03435/2025** (ver sección dedicada).

### Gestión e histórico
- Histórico en Firestore con **borradores vs. finalizados**, filtros, vistas grilla/lista y chips de estado (aprobado / firmado / Sernapesca / notificado).
- **Auditoría de última modificación**: respaldos y borradores registran la **cuenta logueada** como autor; las tarjetas del Histórico muestran fecha y autor de la última modificación.
- **Respaldos versionados** (`respaldos/{id}/versiones`) con autor, versiones nombradas y restauración.
- Auto-guardado en Firestore cada 30 s y trabajo offline (IndexedDB) para imágenes y Registro de Visita.

### Acceso y configuración
- Login con Google `@certimar.cl` y PIN; **roles** admin / editor / reader.
- **Panel de Configuración disponible para todos los roles** (apariencia: modo oscuro, olas del PDF, logos). Las operaciones sensibles (logos de empresa, catálogo de equipos, mantención de datos) siguen restringidas a admin.
- Panel de **estadísticas de uso** (solo admin).
- **Catálogo de equipos** editable (trituradoras, incineradores, prepicadores, compresores, generadores, bombas).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Estilos | Tailwind CSS 4 |
| Animaciones | Motion (Framer Motion) |
| Iconos | lucide-react |
| Backend / Auth | Firebase (Firestore, Storage, Hosting, Auth con Google) |
| Generación PDF | jsPDF + jspdf-autotable (lazy-load) |
| Render PDF → imágenes | pdfjs-dist (Web Worker) |
| Captura HTML→PDF | html2canvas-pro |
| Persistencia local | localStorage + IndexedDB |

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Proyecto Firebase con Firestore, Storage y Authentication habilitados
- Firebase CLI instalada globalmente (`npm i -g firebase-tools`)

---

## Variables de entorno

Crear `.env` en la raíz del proyecto (no commitear):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=certimar-1511-doctos
VITE_FIREBASE_STORAGE_BUCKET=certimar-1511-doctos-storage
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_CLIENT_ID=...   # OAuth client ID para autenticación Google
VITE_ADMIN_PIN=...          # PIN de acceso a funciones de administración
```

---

## Instalación y desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Build de producción en /dist
npm run lint         # Chequeo TypeScript sin emitir
npm run test         # Suite de tests unitarios (vitest)
```

---

## Deploy

Despliegue de **solo Hosting** (no toca las reglas de Firestore/Storage):

```bash
npm run build
firebase deploy --only hosting
```

URL de producción: **https://certimar-1511-doctos.web.app**

### Autenticación del despliegue (CI / headless)

Método recomendado: **cuenta de servicio** con permisos de Firebase Hosting.

1. En Google Cloud Console → **IAM y administración → Cuentas de servicio**, crea una cuenta con el rol *Firebase Hosting Admin* y descarga su clave JSON.
2. Apunta `GOOGLE_APPLICATION_CREDENTIALS` a la clave y despliega:

```bash
# bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/clave-servicio.json"
firebase deploy --only hosting --project certimar-1511-doctos
```

```powershell
# PowerShell (Windows)
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\clave-servicio.json"
firebase deploy --only hosting --project certimar-1511-doctos
```

> ⚠️ El método `firebase login:ci` + `FIREBASE_TOKEN` está **deprecado** en firebase-tools 15+. Úsalo solo de forma puntual y **nunca lo pegues en el repositorio, issues o chats**: es una credencial de larga duración. Si se expone, revócala en *Cuenta de Google → Seguridad → Accesos de terceros con acceso a tu cuenta → Firebase CLI → Quitar acceso*.

---

## Nomenclatura de archivos y correo (Oficio DN-03435/2025)

Reglas para el envío de documentos de certificación a Sernapesca:

- **Fecha** en formato `AAAA-MM-DD` (año-mes-día), nunca `DD-MM-YYYY`.
- **Nombres de archivo**: separador **guion** (`-`), tipo en **minúsculas** y sin abreviar; el código de centro va primero.
- **Asunto del correo**: separador **guion bajo** (`_`).

### Nombres de archivo

| Documento | Patrón | Ejemplo (`120149`, `2026-06-23`) |
|---|---|---|
| Certificado | `{codigo}-{AAAA-MM-DD}-certificado.pdf` | `120149-2026-06-23-certificado.pdf` |
| Acta | `{codigo}-{AAAA-MM-DD}-acta.pdf` | `120149-2026-06-23-acta.pdf` |
| Informe | `{codigo}-{AAAA-MM-DD}-informe.pdf` | `120149-2026-06-23-informe.pdf` |
| Fotografías* | `{codigo}-{AAAA-MM-DD}-fotografias.zip` | `120149-2026-06-23-fotografias.zip` |
| Registro de ingreso* | `{codigo}-{AAAA-MM-DD}-registro_ingreso.pdf` | `120149-2026-06-23-registro_ingreso.pdf` |

\* Las fotografías y el registro de ingreso se entregan por carpeta Drive (no los descarga el sistema). El sistema genera y nombra Certificado, Acta e Informe.

### Asunto del correo

| Contenido | Patrón | Ejemplo |
|---|---|---|
| Documentos asociados (entrega vía Drive) | `{codigo}_{AAAA-MM-DD}_documentos_asociados` | `120149_2026-06-23_documentos_asociados` |
| Certificado + acta | `{codigo}_{AAAA-MM-DD}_certificado_y_acta` | `120149_2026-06-23_certificado_y_acta` |

> El generador de correo de la app produce hoy el asunto `documentos_asociados`. La fecha usada es la de emisión del certificado.

---

## Arquitectura y flujo de datos

### Autenticación y roles
Login con Google OAuth restringido a cuentas `@certimar.cl`, más PIN. Roles:

| Rol | Cómo se obtiene | Alcance |
|---|---|---|
| **admin** | PIN de administración | Acceso total: catálogo de equipos, logos de empresa, mantención de datos, estadísticas |
| **editor** | Cuenta Google `@certimar.cl` | Registro y generación de documentos |
| **reader** | Acceso sin PIN | Consulta |

El **panel de Configuración** es accesible para todos los roles (apariencia); las operaciones sensibles dentro de él permanecen restringidas a admin.

### Flujo de certificación

```
1. Datos Generales
   └─ Centro de cultivo, fechas, certificador

2. Extracción
   └─ Sistema principal (LIFT-UP / Mortex HW / ROV / Succión Yoma)
   └─ Parámetros: jaulas, profundidad, talla de pez, horas efectivas, compresores
   └─ Modo Operación Mínima (override de parámetros de producción)

3. Desnaturalización
   └─ Modo Ensilaje: trituradoras, ciclos batch, prepicador, ollas en paralelo
   └─ Modo Incineración: capacidad kg/h, cámaras, temperaturas
   └─ Capacidad combinada olla + incinerador (suma de ambos sistemas)
   └─ Capacidad del incinerador editable (override manual sobre carga × horas)
   └─ Generadores eléctricos asociados

4. Almacenamiento
   └─ Capacidad (m³ × densidad ácido fórmico)
   └─ Infraestructura: pretil, piping, A/N Pontón

5. Registro fotográfico
   └─ Imágenes por sección con semáforo normativo
   └─ Slot de ubicación espacial (con recorte manual)
   └─ Adjunto del Registro de Visita (PDF → páginas JPEG)

6. Generación de documentos
   └─ Revisión de umbrales → emisión de Certificado, Informe y Acta en PDF
```

### Persistencia

| Capa | Qué guarda |
|---|---|
| **localStorage** | Auto-guardado continuo del estado del formulario activo |
| **IndexedDB** | URLs de imágenes (blob / base64) y páginas del Registro de Visita |
| **Firestore `registros/{id}`** | Snapshot completo del estado al guardar (borrador o final) |
| **Firestore `historico/{id}`** | Metadatos + snapshot + métricas + estado de gestión + autor/fecha de última modificación |
| **Firestore `respaldos/{id}/versiones`** | Versiones de respaldo del estado, con autor y motivo (auto, documento, versión nombrada) |
| **Firebase Storage** | PDFs de documentos generados y Registro de Visita original |

### Borradores y histórico

- Cada registro recibe un correlativo `REG-NNN` al iniciar con "Comenzar Registro".
- "Guardar borrador" persiste el estado en Firestore con `esBorrador: true` y lo muestra en la pestaña Histórico con badge ámbar.
- Al cargar un registro desde el Histórico, el Registro de Visita asociado se recupera automáticamente desde Firebase Storage.
- "Continuar" (borradores) y "Cargar" (finalizados) muestran el estado exacto en que quedó el registro.
- Los registros finalizados (con documentos generados) no se degradan a borrador por el autosave; solo el guardado manual explícito puede cambiar su estado.
- **Auditoría:** cada guardado registra la cuenta logueada como autor del último cambio; las tarjetas de borrador del Histórico muestran fecha y autor de la última modificación.
- **Respaldos:** además del histórico, cada guardado/generación crea una versión en `respaldos/{id}/versiones` (con autor), restaurable desde el historial de versiones; se pueden crear versiones nombradas.

### Catálogo de equipos

Administrado desde el panel de Admin (requiere PIN). Incluye trituradoras, incineradores, prepicadores, compresores, líneas de extracción, generadores y bombas. Los ítems del catálogo personalizado se almacenan en `Firestore/catalogo_custom` y se fusionan con el catálogo estático en `constants/masterData.ts`.

---

## Estructura del proyecto

```
src/
├── App.tsx                   # Componente principal: estado, lógica, vistas, PDF
├── types.ts                  # Interfaces TypeScript del dominio
├── main.tsx                  # Entry point
├── firebase.ts               # Inicialización Firebase
├── components/
│   └── CatalogoEquiposAdmin.tsx  # Panel de administración del catálogo
├── constants/
│   └── masterData.ts         # Catálogos estáticos de equipos y centros
├── data/
│   └── concesiones.ts        # Base de datos de concesiones acuícolas
├── domain/
│   ├── calculations.ts       # Cálculos de capacidad (extracción / den. / alm.)
│   ├── documents.ts          # Constructores de datos para documentos PDF
│   ├── actaHtml.ts           # Generador HTML del Acta de Inspección
│   ├── draftStatus.ts        # Evaluación de completitud de borradores
│   ├── generators.ts         # Generación de IDs y correlativos
│   ├── validation.ts         # Validación de fechas y campos
│   ├── incineradorCatalogo.ts # Lógica de resolución del catálogo de incineradores
│   └── constants.ts          # Constantes de cálculo normativo
└── lib/
    └── utils.ts              # Utilidad cn() para clases Tailwind
```

---

## Marco normativo

| Documento | Descripción |
|---|---|
| **D.S. N°320** | Decreto Supremo — requisitos sanitarios para centros de cultivo acuícola |
| **Res. Exenta N°1511/2021** | Regulación Sernapesca sobre sistemas de manejo de mortalidad |

Los umbrales 15/15/20 TN están definidos en la Res. Exenta N°1511/2021 y deben ser verificados por un certificador inscrito en el registro de Sernapesca.

---

## Licencia

Uso interno — © 2026 Certimar SpA. Todos los derechos reservados.
