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

```bash
npm run build
firebase deploy --only hosting
```

URL de producción: **https://certimar-1511-doctos.web.app**

---

## Arquitectura y flujo de datos

### Autenticación
Login con Google OAuth. Los usuarios autenticados acceden al sistema completo; el PIN de admin habilita la gestión del catálogo de equipos.

### Flujo de certificación

```
1. Datos Generales
   └─ Centro de cultivo, fechas, certificador

2. Extracción
   └─ Sistema principal (LIFT-UP / Mortex HW / ROV / Succión Yoma)
   └─ Parámetros: jaulas, profundidad, talla de pez, horas efectivas, compresores
   └─ Modo Operación Mínima (override de parámetros de producción)

3. Desnaturalización
   └─ Modo Ensilaje: trituradoras, ciclos batch, prepicador
   └─ Modo Incineración: capacidad kg/h, cámaras, temperaturas
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
| **Firestore `historico/{id}`** | Metadatos + snapshot + métricas de cumplimiento + estado de gestión |
| **Firebase Storage** | PDFs de documentos generados y Registro de Visita original |

### Borradores y histórico

- Cada registro recibe un correlativo `REG-NNN` al iniciar con "Comenzar Registro".
- "Guardar borrador" persiste el estado en Firestore con `esBorrador: true` y lo muestra en la pestaña Histórico con badge ámbar.
- Al cargar un registro desde el Histórico, el Registro de Visita asociado se recupera automáticamente desde Firebase Storage.
- "Continuar" (borradores) y "Cargar" (finalizados) muestran el estado exacto en que quedó el registro.
- Los registros finalizados (con documentos generados) no se degradan a borrador por el autosave; solo el guardado manual explícito puede cambiar su estado.

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
