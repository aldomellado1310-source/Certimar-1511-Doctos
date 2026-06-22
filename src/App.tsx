declare const __APP_VERSION__: string;
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Waves,
  FlaskConical,
  Database,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileDown,
  Camera,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowRight,
  ShieldCheck,
  History,
  Fish,
  Anchor,
  Moon,
  Sun,
  Star,
  Cloud,
  Save,
  TestTube2,
  LogOut,
  PlayCircle,
  Bookmark,
  Mail,
  Copy,
  X,
  Settings2,
  Palette,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Beaker,
  Pencil,
  BarChart2,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Award,
  AlertTriangle,
  Download,
  Building2,
  Upload,
  ClipboardList,
  BarChart3,
  ExternalLink,
  Crop,
  Move,
  LayoutGrid,
  MousePointer2,
  RefreshCw,
  Menu,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
// ── WelcomeScreen constants (outside component to avoid re-renders) ──
const SCHOOL_FISH = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.25;
  const r     = 55 + (i % 4) * 18;
  return {
    startX:  Math.cos(angle) * r,
    startY:  Math.sin(angle) * r * 0.52,
    endX:    Math.cos(angle) * (320 + (i % 4) * 70),
    endY:    Math.sin(angle) * (190 + (i % 5) * 40),
    size:    10 + (i % 5) * 4,
    flipX:   Math.cos(angle) < 0,
    delay:   i * 0.038,
    dur:     0.55 + (i % 4) * 0.12,
  };
});
const BG_FISH = [
  { x: -8, y: 20, size: 24, dir: 1,  dur: 22, delay: 0  },
  { x: -8, y: 70, size: 16, dir: 1,  dur: 18, delay: 5  },
  { x:108, y: 38, size: 20, dir: -1, dur: 26, delay: 2  },
  { x:108, y: 82, size: 13, dir: -1, dur: 20, delay: 8  },
  { x: -8, y: 55, size: 30, dir: 1,  dur: 31, delay: 13 },
  { x:108, y: 14, size: 15, dir: -1, dur: 24, delay: 6  },
  { x: -8, y: 88, size: 18, dir: 1,  dur: 28, delay: 17 },
  { x:108, y: 62, size: 22, dir: -1, dur: 22, delay: 10 },
];
const BG_JELLYFISH = [
  { x:  8, dur: 14, delay:  0, size: 20 },
  { x: 78, dur: 18, delay:  5, size: 16 },
  { x: 45, dur: 16, delay:  9, size: 24 },
  { x: 92, dur: 12, delay:  3, size: 14 },
  { x: 25, dur: 20, delay: 14, size: 18 },
];
const BG_BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  x:     (i * 41 + 7) % 100,
  dur:   9 + (i * 2.3) % 10,
  delay: (i * 1.7) % 15,
  size:  2 + (i % 3) * 2,
}));
// Algas: puntos de bezier base y offset para animación sway
const BG_SEAWEED = [
  { x:  5, h: 160, color: '#10b981', delay: 0,   dur: 3.5 },
  { x: 12, h: 220, color: '#059669', delay: 0.8, dur: 4.2 },
  { x: 20, h: 130, color: '#34d399', delay: 1.5, dur: 3.8 },
  { x: 60, h: 190, color: '#10b981', delay: 0.5, dur: 4.0 },
  { x: 72, h: 150, color: '#059669', delay: 1.2, dur: 3.3 },
  { x: 82, h: 240, color: '#34d399', delay: 0.2, dur: 4.8 },
  { x: 91, h: 120, color: '#10b981', delay: 2.0, dur: 3.6 },
];
// Rocas en el fondo
const BG_ROCKS = [
  { x: 3,  w: 90,  h: 50 },
  { x: 14, w: 60,  h: 35 },
  { x: 35, w: 120, h: 60 },
  { x: 55, w: 80,  h: 45 },
  { x: 70, w: 100, h: 55 },
  { x: 85, w: 70,  h: 38 },
  { x: 93, w: 55,  h: 30 },
];
import { useDropzone } from 'react-dropzone';
import type { jsPDF } from 'jspdf';
// jsPDF + jspdf-autotable se cargan de forma diferida (import dinámico) para que no
// entren en el bundle inicial; solo se descargan al generar el primer documento.
let JsPDFCtor: typeof import('jspdf').jsPDF;
let autoTable: typeof import('jspdf-autotable').default;
async function ensurePdfLibs() {
  if (!JsPDFCtor) {
    const [m1, m2] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    JsPDFCtor = m1.jsPDF;
    autoTable = m2.default;
  }
}
import { cn } from './lib/utils';
import { resolveDocId, newRecordDocId } from './domain/recordId';
import { AppState, ReportImage, RegistroHistorico, RespaldoVersion, EventoUso, CatalogoCustomEntry, TipoEquipoCatalogo } from './types';
import {
  ID_NUEVO_INCINERADOR,
  resolverIncinerador,
  buildIncineradorEntry,
  findIncineradorDuplicado,
} from './domain/incineradorCatalogo';
import {
  CATALOGO_EXTRACCION,
  CATALOGO_DESNATURALIZACION,
  CATALOGO_GENERADORES,
  CATALOGO_ALMACENAMIENTO,
  CATALOGO_FOTOS,
  TITULARES_CONOCIDOS,
  FORMATOS_MODULO_CONOCIDOS,
  TAMANOS_JAULAS_CONOCIDOS,
  NOMBRES_AN_CONOCIDOS,
  OPCIONES_INCINERADOR,
  INCINERADORES_ESTATICOS,
  OPCIONES_INFRAESTRUCTURA,
  EMPRESA_HINTS,
  CATALOGO_CENTROS,
  CATALOGO_PLATAFORMAS,
} from './constants/masterData';
import type { ImageSeccion } from './types';
import { CONCESIONES_DB, type ConcesionCentro } from './data/concesiones';
import {
  calculateExtraction,
  calculateDenaturation,
  calculateStorage,
} from './domain/calculations';
import {
  buildCertificadoData,
  buildInformeTecnicoData,
  buildActaInspeccionData,
} from './domain/documents';
import { buildActaHtml, patchOklch } from './domain/actaHtml';
import { inferCatalogoId } from './domain/generators';
import { validarOrdenFechas } from './domain/validation';
import { draftStatus } from './domain/draftStatus';
import {
  OPERACION_MINIMA_EXTRACTION,
  OPERACION_MINIMA_BATCH_INDEX,
  OPERACION_MINIMA_AQUAINOX_PREPICADOR,
} from './domain/constants';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CatalogoEquiposAdmin } from './components/CatalogoEquiposAdmin';

// ─── Credenciales desde variables de entorno (.env — no subir a git) ────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const ADMIN_PIN        = import.meta.env.VITE_ADMIN_PIN        as string | undefined;

// --- Constants & Defaults ---
const DEFAULT_STATE: AppState = {
  general: {
    certificador: {
      nombre: "ENGELBERT ALEXANDER FLORES CARRIO",
      rut: "13.968.696-9",
      numero_registro: "DN-02727/2023"
    },
    centro_cultivo: {
      codigo_centro: "",
      nombre_centro: "",
      titular: "",
      acs: "",
      ubicacion: "",
      formato_modulo: "",
      tamano_jaulas: "",
      coordenadas_ensilaje: "",
      nombre_an_ensilaje: ""
    },
    fechas: {
      evaluacion_documental: "",
      inspeccion_terreno: "",
      emision_certificado: ""
    },
    observaciones_acta: "",
    revisionConfirmada: false
  },
  extraction: {
    sistemas_apoyo: { buceo: false, rov: false, succion_yoma: false, automatica: false },
    parametros: {
      numero_total_jaulas: 0,
      jaulas_simultaneas: 1,
      horas_efectivas_trabajo: 8,
      personal_operativo: 2,
      profundidad_operacion_m: 20,
      sistema_principal: 'LIFT-UP',
      talla_pez: 'Grande (>=4.5kg)',
      factor_ajuste_biomasa: 1.0,
      marca_equipo: "",
      id_catalogo_equipo: "",
      tipo_compresor: "",
      id_catalogo_compresor: "",
      potencia_cfm: 0,
      capacidad_receptor_bins_litros: 500,
      disponibilidad_base_fd: 0.90,
      motocompresores_por_jaula: 1,
      ubicacion_compresor: "",
      observacion_sistema: "",
      n_teams_buceo: 1,
      n_buzos_por_team: 4,
      periodicidad_buceo: "DIARIA"
    },
    resultados: { ciclos_por_dia: 0, capacidad_diaria_ton: 0, cumple_norma: false },
    equipos_extraccion: []
  },
  denaturation: {
    equipos: {
      cantidad_sistemas: 1,
      cantidad_ollas: 1,
      id_catalogo_trituradora: "",
      id_catalogo_incinerador: "",
      marca_modelo: "",
      velocidad_nominal_kg_hr: 0,
      horas_funcionamiento_dia: 8,
      cuenta_con_prepicador: false,
      marca_modelo_prepicador: "",
      cantidad_prepicador: 1,
      capacidad_prepicador_kg_hr: 0,
      factor_eficiencia_prepicador: 0.70,
      cuenta_con_recirculacion_acido: false,
      material_construccion: "",
      tipo_sistema: 'Ensilaje',
      estado_olla: 'Bueno' as const
    },
    parametros_batch: { kilos_por_batch: 0, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
    parametros_incineracion: { capacidad_carga_kg_h: 0, temperatura_operacion: "", camara_primaria: "", camara_secundaria: "" },
    incinerador: {
      activo: false,
      id_catalogo: '',
      marca_modelo: '',
      num_quemadores_primaria: 0,
      num_quemadores_secundaria: 0,
      temperatura_camara_primaria_c: 0,
      temperatura_camara_secundaria_c: 0,
      requerimiento_energetico: '',
      capacidad_carga_kg_h: 0,
      horas_funcionamiento_dia: 8,
      sistema_carga: 'N/A',
      sistema_descarga: 'N/A',
      disposicion_final: 'N/A',
      almacenamiento_gas: 'N/A',
      observaciones: '',
    },
    generacion_electrica: [],
    resultados: { duracion_total_batch_min: 0, numero_batches_dia: 0, capacidad_ensilaje_ton: 0, capacidad_incinerador_ton: 0, capacidad_diaria_ton: 0, cumple_norma: false, observacion_automatica: "" }
  },
  storage: {
    parametros: {
      capacidad_almacenaje_m3: 0,
      factor_densidad: 1.2,
      observaciones: "SE REALIZA EL CÁLCULO POR DENSIDAD DE ÁCIDO FÓRMICO 1.2 TN/M3"
    },
    infraestructura: {
      pretil_material: "",
      pretil_estado: 'Bueno',
      piping_material: "",
      piping_diametro: "",
      piping_valvulas: "",
      piping_estado: 'Bueno',
      eslora_m: "",
      manga_m: "",
      puntual_m: ""
    },
    resultados: { capacidad_almacenaje_ton: 0, cumple_norma: false }
  },
  images: []
};

// --- Components ---

const StatusBadge = ({ status }: { status: boolean }) => (
  <div className={cn(
    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
    status ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
  )}>
    {status ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    {status ? "Cumple Norma" : "No Cumple"}
  </div>
);

// Elementos marinos estáticos (posiciones fijas para evitar re-renders)
const FISH_DATA = [
  { dir: 1, y: 22, dur: 28, delay: 0,  size: 28 },
  { dir: -1, y: 38, dur: 35, delay: 5,  size: 20 },
  { dir: 1, y: 55, dur: 22, delay: 9,  size: 36 },
  { dir: -1, y: 18, dur: 40, delay: 2,  size: 18 },
  { dir: 1, y: 68, dur: 30, delay: 14, size: 24 },
  { dir: -1, y: 45, dur: 26, delay: 7,  size: 32 },
  { dir: 1, y: 30, dur: 45, delay: 18, size: 16 },
  { dir: -1, y: 62, dur: 33, delay: 11, size: 22 },
  { dir: 1, y: 75, dur: 20, delay: 3,  size: 40 },
  { dir: -1, y: 50, dur: 38, delay: 20, size: 14 },
  { dir: 1, y: 85, dur: 25, delay: 16, size: 20 },
  { dir: -1, y: 35, dur: 42, delay: 8,  size: 26 },
];
const BUBBLE_DATA = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37 + 13) % 100,
  dur: 14 + (i * 7) % 18,
  delay: (i * 3.7) % 22,
  size: i % 4 === 0 ? 'w-4 h-4' : i % 3 === 0 ? 'w-2.5 h-2.5' : i % 2 === 0 ? 'w-2 h-2' : 'w-1 h-1',
}));
const STAR_FLOOR = [12, 26, 40, 54, 68, 82, 20, 35, 50, 65];
const STAR_FLOAT = [
  { top: 15, left: 18, dur: 12, delay: 0 },
  { top: 42, left: 73, dur: 9,  delay: 3 },
  { top: 28, left: 55, dur: 15, delay: 6 },
  { top: 60, left: 30, dur: 11, delay: 2 },
  { top: 78, left: 85, dur: 13, delay: 8 },
  { top: 20, left: 90, dur: 10, delay: 4 },
];
const JELLYFISH_DATA = [
  { left: 12, top: 28, dur: 8,  delay: 0 },
  { left: 38, top: 50, dur: 11, delay: 3 },
  { left: 65, top: 35, dur: 9,  delay: 6 },
  { left: 82, top: 60, dur: 12, delay: 1 },
];
const SEAWEED_DATA = [
  { left: 4,  h: 200, color: 'bg-emerald-500/25', dur: 4, delay: 0 },
  { left: 10, h: 280, color: 'bg-teal-500/20',    dur: 6, delay: 1 },
  { left: 18, h: 160, color: 'bg-emerald-400/20', dur: 5, delay: 2 },
  { left: 68, h: 240, color: 'bg-cyan-500/20',    dur: 7, delay: 0.5 },
  { left: 76, h: 190, color: 'bg-emerald-600/20', dur: 4, delay: 1.5 },
  { left: 84, h: 260, color: 'bg-teal-400/25',    dur: 5, delay: 3 },
  { left: 92, h: 170, color: 'bg-emerald-500/15', dur: 6, delay: 2 },
];
const CORAL_DATA = [
  { left: 22, stems: [{ h: 90, w: 8, color: 'bg-rose-500/25'   }, { h: 65, w: 5, color: 'bg-pink-400/20', ml: -14 }, { h: 75, w: 6, color: 'bg-rose-400/20', ml: 10 }] },
  { left: 45, stems: [{ h: 70, w: 6, color: 'bg-orange-400/20' }, { h: 55, w: 4, color: 'bg-amber-400/15', ml: -10 }, { h: 60, w: 5, color: 'bg-orange-300/15', ml: 8 }] },
  { left: 60, stems: [{ h: 85, w: 7, color: 'bg-violet-400/20' }, { h: 60, w: 5, color: 'bg-purple-400/15', ml: -12 }, { h: 70, w: 6, color: 'bg-violet-300/15', ml: 9 }] },
  { left: 78, stems: [{ h: 75, w: 6, color: 'bg-rose-400/20'   }, { h: 50, w: 4, color: 'bg-pink-300/15', ml: -9 },  { h: 65, w: 5, color: 'bg-rose-300/15', ml: 7 }] },
];
const RAY_DATA = [
  { left: 5,  skew: -8,  h: 50, dur: 9,  delay: 0 },
  { left: 18, skew: -5,  h: 42, dur: 13, delay: 2 },
  { left: 32, skew: -2,  h: 58, dur: 8,  delay: 5 },
  { left: 50, skew: 2,   h: 45, dur: 11, delay: 1 },
  { left: 65, skew: 5,   h: 38, dur: 10, delay: 3.5 },
  { left: 78, skew: 7,   h: 55, dur: 14, delay: 2.5 },
  { left: 90, skew: 10,  h: 40, dur: 7,  delay: 6 },
];

function formatSavedAt(date: Date): string {
  const dd  = String(date.getDate()).padStart(2, '0');
  const mm  = String(date.getMonth() + 1).padStart(2, '0');
  const HH  = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss  = String(date.getSeconds()).padStart(2, '0');
  return `${dd}-${mm} ${HH}:${min}:${ss}`;
}

const MarineBackground = () => {
  const reduceMotion = useReducedMotion();

  // Pausar la animación cuando la pestaña no está visible (ahorra batería/CPU en terreno).
  const [docVisible, setDocVisible] = React.useState(
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  React.useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Movimiento reducido o pestaña oculta: solo el gradiente estático, sin criaturas animadas.
  if (reduceMotion || !docVisible) {
    return (
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-55 dark:opacity-40 transition-colors duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 via-indigo-50/20 via-60% to-cyan-100/40 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-950/20 dark:to-teal-950/20" />
      </div>
    );
  }

  return (
  <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-55 dark:opacity-40 transition-colors duration-700">

    {/* === FONDO: gradiente profundidad oceánica === */}
    <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 via-indigo-50/20 via-60% to-cyan-100/40 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-900" />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-950/20 dark:to-teal-950/20" />

    {/* === RAYOS DE LUZ desde la superficie === */}
    {RAY_DATA.map((r, i) => (
      <motion.div
        key={`ray-${i}`}
        className="absolute top-0 origin-top"
        style={{
          left: `${r.left}%`,
          width: '70px',
          height: `${r.h}%`,
          background: 'linear-gradient(to bottom, rgba(147,197,253,0.12), transparent)',
          transform: `skewX(${r.skew}deg)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [1, 1.4, 1] }}
        transition={{ duration: r.dur, repeat: Infinity, ease: "easeInOut", delay: r.delay }}
      />
    ))}

    {/* === RED DE PESCA (dos capas) === */}
    <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none">
      <div className="w-full h-full" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />
    </div>
    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{ transform: 'rotate(15deg) scale(1.5)' }}>
      <div className="w-full h-full" style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
    </div>

    {/* === ALGAS MARINAS — múltiples variedades === */}
    {SEAWEED_DATA.map((sw, i) => (
      <motion.div
        key={`sw-${i}`}
        className={`absolute bottom-0 rounded-t-full blur-xl origin-bottom ${sw.color}`}
        style={{ left: `${sw.left}%`, width: '28px', height: `${sw.h}px` }}
        animate={{ rotate: [0, 6, -6, 3, 0], scaleY: [1, 1.06, 0.94, 1.03, 1] }}
        transition={{ duration: sw.dur, repeat: Infinity, ease: "easeInOut", delay: sw.delay }}
      />
    ))}

    {/* === CORAL en el fondo === */}
    {CORAL_DATA.map((c, i) => (
      <motion.div
        key={`coral-${i}`}
        className="absolute bottom-0 flex items-end"
        style={{ left: `${c.left}%` }}
        animate={{ scaleY: [1, 1.02, 0.99, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
      >
        {c.stems.map((s, j) => (
          <div
            key={j}
            className={`rounded-t-full ${s.color} blur-sm`}
            style={{ width: `${s.w}px`, height: `${s.h}px`, marginLeft: j > 0 ? `${s.ml}px` : 0 }}
          />
        ))}
      </motion.div>
    ))}

    {/* === MEDUSAS === */}
    {JELLYFISH_DATA.map((j, i) => (
      <motion.div
        key={`jelly-${i}`}
        className="absolute"
        style={{ left: `${j.left}%`, top: `${j.top}%` }}
        animate={{ y: [0, -28, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: j.dur, repeat: Infinity, ease: "easeInOut", delay: j.delay }}
      >
        {/* cuerpo */}
        <div className="w-10 h-7 bg-gradient-to-b from-cyan-200/25 to-indigo-100/10 dark:from-cyan-400/15 dark:to-indigo-200/5 rounded-t-full border-t border-x border-cyan-300/20" />
        {/* tentáculos */}
        <div className="flex justify-around px-0.5">
          {[14, 20, 12, 18, 16, 10].map((h, k) => (
            <motion.div
              key={k}
              className="bg-gradient-to-b from-cyan-300/20 to-transparent"
              style={{ width: '1px', height: `${h}px` }}
              animate={{ scaleX: [1, 2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: k * 0.18, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.div>
    ))}

    {/* === ESTRELLAS DE MAR — piso marino === */}
    {STAR_FLOOR.map((left, i) => (
      <motion.div
        key={`sf-${i}`}
        className="absolute bottom-3 text-amber-400/40 dark:text-amber-300/20"
        style={{ left: `${left}%` }}
        animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.6, repeatType: "reverse" }}
      >
        <Star size={14 + (i % 3) * 7} fill="currentColor" />
      </motion.div>
    ))}

    {/* === ESTRELLAS FLOTANTES === */}
    {STAR_FLOAT.map((s, i) => (
      <motion.div
        key={`sfloat-${i}`}
        className="absolute text-amber-300/20 dark:text-amber-400/15"
        style={{ top: `${s.top}%`, left: `${s.left}%` }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.7, 1.3, 0.7], rotate: [0, 120, 240] }}
        transition={{ duration: s.dur, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
      >
        <Star size={20 + (i % 3) * 10} />
      </motion.div>
    ))}

    {/* === BURBUJAS — variedad de tamaños === */}
    {BUBBLE_DATA.map((b, i) => (
      <motion.div
        key={`bub-${i}`}
        className={`absolute ${b.size} rounded-full border border-indigo-300/25 bg-white/10 blur-[1px]`}
        initial={{ y: "108vh" }}
        animate={{
          y: "-8vh",
          x: [0, Math.sin(i) * 30, Math.sin(i + 1) * 15, 0],
          opacity: [0, 0.5, 0.5, 0],
        }}
        transition={{
          duration: b.dur,
          repeat: Infinity,
          delay: b.delay,
          ease: "linear",
        }}
        style={{ left: `${b.x}%` }}
      />
    ))}

    {/* === PECES — escuela grande con variedad === */}
    {FISH_DATA.map((f, i) => (
      <motion.div
        key={`fish-${i}`}
        className={cn(
          "absolute",
          i < 4  ? "text-indigo-400/35 dark:text-indigo-300/25" :
          i < 8  ? "text-cyan-500/30 dark:text-cyan-400/20" :
                   "text-teal-500/25 dark:text-teal-400/15"
        )}
        initial={{ x: f.dir > 0 ? "-8vw" : "108vw" }}
        animate={{
          x: f.dir > 0 ? "108vw" : "-8vw",
          y: [0, Math.sin(i) * 25, 0],
          opacity: [0, 0.8, 0.8, 0.8, 0],
        }}
        transition={{
          duration: f.dur,
          repeat: Infinity,
          delay: f.delay,
          ease: "linear",
        }}
        style={{ top: `${f.y}%` }}
      >
        <Fish
          size={f.size}
          className={f.dir < 0 ? "scale-x-[-1]" : ""}
        />
      </motion.div>
    ))}

    {/* === ANCLAS flotando suavemente === */}
    {[{ left: 8, top: 60, dur: 14, delay: 0 }, { left: 90, top: 40, dur: 18, delay: 7 }].map((a, i) => (
      <motion.div
        key={`anchor-${i}`}
        className="absolute text-slate-500/15 dark:text-slate-300/10"
        style={{ left: `${a.left}%`, top: `${a.top}%` }}
        animate={{ y: [0, -18, 0], rotate: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: a.dur, repeat: Infinity, ease: "easeInOut", delay: a.delay }}
      >
        <Anchor size={32 + i * 10} />
      </motion.div>
    ))}

    {/* === OLAS DOBLES en la parte inferior === */}
    <div className="absolute bottom-0 left-0 right-0 h-80 select-none pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <motion.path
          initial={{ d: "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z" }}
          animate={{
            d: [
              "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z",
              "M0,180L60,197C120,213,240,245,360,234.7C480,224,600,171,720,165.3C840,160,960,203,1080,218.7C1200,235,1320,224,1380,218.7L1440,213L1440,320L0,320Z",
              "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z",
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="fill-indigo-400/10 dark:fill-indigo-400/8"
        />
        <motion.path
          initial={{ d: "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z" }}
          animate={{
            d: [
              "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z",
              "M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L0,320Z",
              "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z",
            ]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="fill-cyan-400/8 dark:fill-cyan-400/5"
        />
      </svg>
    </div>

  </div>
  );
};

const Logo = ({ collapsed, tema }: { collapsed?: boolean; tema?: { logo: 'certimar' | 'engelbert'; palette: 'certimar' | 'engelbert' } }) => {
  const src = tema?.logo === 'engelbert' ? '/engelbert-logo.png' : '/certimar-logo.png';
  const alt = tema?.logo === 'engelbert' ? 'Engelbert' : 'Certimar';
  return (
    <div className="flex items-center justify-center">
      <img src={src} alt={alt} className={collapsed ? "w-12 h-12 object-contain" : "h-16 max-w-full object-contain"} />
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon, description }: { title: string, icon: React.ElementType, description?: string }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
    </div>
    {description && <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">{description}</p>}
  </div>
);

const FormCard = ({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors", className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Convierte yyyy-mm-dd ↔ dd-mm-yyyy para display/storage
const DateField = ({
  label, value, onChange, inputRef, highlight
}: {
  label: string, value: string, onChange: (val: string) => void,
  inputRef?: React.RefObject<HTMLInputElement | null>, highlight?: boolean
}) => {
  const toDisplay = (iso: string) => iso ? iso.split('-').reverse().join('-') : '';
  const toISO     = (dmy: string) => {
    const parts = dmy.split('-');
    if (parts.length === 3 && parts[2].length === 4) return parts.reverse().join('-');
    return dmy;
  };
  const [raw, setRaw] = React.useState(toDisplay(value));
  const fieldId = React.useId();

  React.useEffect(() => { setRaw(toDisplay(value)); }, [value]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        id={fieldId}
        ref={inputRef}
        type="text"
        value={raw}
        placeholder="dd-mm-yyyy"
        maxLength={10}
        onChange={(e) => {
          let v = e.target.value.replace(/[^\d-]/g, '');
          setRaw(v);
          if (/^\d{2}-\d{2}-\d{4}$/.test(v)) onChange(toISO(v));
        }}
        onBlur={() => {
          if (!/^\d{2}-\d{2}-\d{4}$/.test(raw)) setRaw(toDisplay(value));
        }}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
          highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
        )}
      />
    </div>
  );
};

const InputField = ({
  label, value, onChange, onBlur, type = "text", placeholder, suffix, inputRef, highlight, min, max
}: {
  label: string, value: any, onChange: (val: any) => void, onBlur?: () => void, type?: string,
  placeholder?: string, suffix?: string, inputRef?: React.RefObject<HTMLInputElement | null>,
  highlight?: boolean, min?: number, max?: number
}) => {
  const isNumeric = type === 'number';
  const [local, setLocal] = React.useState<string>(isNumeric ? String(value ?? '') : '');

  React.useEffect(() => {
    if (isNumeric) setLocal(String(value ?? ''));
  }, [value, isNumeric]);

  const handleNumericChange = (raw: string) => {
    setLocal(raw);
    const v = parseFloat(raw);
    if (!isNaN(v)) {
      const clamped = min !== undefined && v < min ? min
                    : max !== undefined && v > max ? max
                    : v;
      onChange(clamped);
    }
  };

  const handleNumericBlur = () => {
    const v = parseFloat(local);
    if (isNaN(v) || local.trim() === '') {
      setLocal(String(value ?? ''));
    } else {
      const clamped = min !== undefined && v < min ? min
                    : max !== undefined && v > max ? max
                    : v;
      setLocal(String(clamped));
      onChange(clamped);
    }
    onBlur?.();
  };

  const fieldId = React.useId();

  return (
  <div className="space-y-1.5">
    <label htmlFor={fieldId} className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <input
        id={fieldId}
        ref={inputRef}
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? 'decimal' : undefined}
        value={isNumeric ? local : value}
        onChange={(e) => isNumeric ? handleNumericChange(e.target.value) : onChange(e.target.value)}
        placeholder={placeholder}
        onBlur={isNumeric ? handleNumericBlur : onBlur}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
          highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
        )}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500 text-sm font-medium">
          {suffix}
        </div>
      )}
    </div>
  </div>
  );
};

// Combo de autocompletado para leyendas fotográficas.
// Filtra el catálogo según la sección, resuelve placeholders dinámicos ({m3}, {kva})
// y excluye descripciones ya asignadas a otras fotos de la misma sección.
const LeyendaCombo = ({
  seccion, value, onChange, m3, kva, usedLeyendas = [], savedOpciones = [], onNewLeyenda
}: {
  seccion: ImageSeccion;
  value: string;
  onChange: (v: string) => void;
  m3: number;
  kva: number;
  usedLeyendas?: string[];
  /** Sugerencias guardadas en Firestore para esta sección */
  savedOpciones?: string[];
  /** Callback que se dispara al perder el foco si la leyenda es nueva */
  onNewLeyenda?: (v: string, seccion: ImageSeccion) => void;
}) => {
  const listId = `leyenda-list-${seccion.replace(/[\s\/]/g, '-').replace(/[áéíóúñ]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n' } as Record<string,string>)[c] ?? c)}`;

  const staticOpciones = (CATALOGO_FOTOS[seccion] ?? [])
    .map(s => s.replace(/\{m3\}/g, String(m3)).replace(/\{kva\}/g, String(kva)));

  // Unión de sugerencias estáticas + guardadas, sin duplicados ni ya usadas por otras fotos
  const allOpciones = [...new Set([...staticOpciones, ...savedOpciones])]
    .filter(op => op === value || !usedLeyendas.includes(op));

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed && onNewLeyenda) onNewLeyenda(trimmed, seccion);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={listId + '-input'} className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Descripción</label>
      <input
        id={listId + '-input'}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Seleccione o escriba una descripción..."
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
      />
      <datalist id={listId}>
        {allOpciones.map((op, i) => <option key={i} value={op} />)}
      </datalist>
    </div>
  );
};

// ─── Anotador de imágenes ───────────────────────────────────────────────────

const ANNOT_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

interface Annotation {
  type: 'rect' | 'circle';
  x: number; y: number; w: number; h: number;
  color: string;
}

const ImageAnnotator: React.FC<{
  img: ReportImage;
  onSave: (annotatedUrl: string) => void;
  onClose: () => void;
}> = ({ img, onSave, onClose }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<'rect' | 'circle'>('rect');
  const [color, setColor] = useState(ANNOT_COLORS[0]);
  const [current, setCurrent] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const toFrac = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };

  const onMD = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { x, y } = toFrac(e);
    startRef.current = { x, y };
    setCurrent({ x, y, w: 0, h: 0 });
  };

  const onMM = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!current) return;
    const { x, y } = toFrac(e);
    const { x: sx, y: sy } = startRef.current;
    setCurrent({ x: Math.min(sx, x), y: Math.min(sy, y), w: Math.abs(x - sx), h: Math.abs(y - sy) });
  };

  const onMU = () => {
    if (current && current.w > 0.01 && current.h > 0.01) {
      setAnnotations(prev => [...prev, { type: tool, ...current, color }]);
    }
    setCurrent(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    let blobUrl: string | null = null;
    try {
      // Para URLs remotas (Firebase Storage), hacer fetch como blob primero.
      // Usar directamente una URL http en canvas.drawImage() puede "contaminar" (taint)
      // el canvas por CORS, haciendo que toDataURL() lance SecurityError silencioso.
      // Un blob: URL es mismo-origen y no produce taint.
      let imageUrl = img.url;
      if (img.url.startsWith('http')) {
        const resp = await fetch(img.url);
        if (!resp.ok) throw new Error(`No se pudo cargar la imagen (HTTP ${resp.status})`);
        const blob = await resp.blob();
        blobUrl = URL.createObjectURL(blob);
        imageUrl = blobUrl;
      }

      const image = new Image();
      image.src = imageUrl;
      await new Promise<void>((res, rej) => {
        image.onload = () => res();
        image.onerror = () => rej(new Error('Error al decodificar la imagen'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const lw = Math.max(canvas.width, canvas.height) * 0.004;
      for (const ann of annotations) {
        const px = ann.x * canvas.width, py = ann.y * canvas.height;
        const pw = ann.w * canvas.width, ph = ann.h * canvas.height;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = lw;
        ctx.fillStyle = ann.color + '44';
        if (ann.type === 'rect') {
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeRect(px, py, pw, ph);
        } else {
          ctx.beginPath();
          ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }
      onSave(canvas.toDataURL('image/jpeg', 0.88));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la anotación');
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setSaving(false);
    }
  };

  const renderSVGShape = (ann: { type: string; x: number; y: number; w: number; h: number; color: string }, key: number) =>
    ann.type === 'rect' ? (
      <rect key={key} x={ann.x} y={ann.y} width={ann.w} height={ann.h}
        stroke={ann.color} strokeWidth="0.003" fill={ann.color + '44'} />
    ) : (
      <ellipse key={key}
        cx={ann.x + ann.w / 2} cy={ann.y + ann.h / 2} rx={ann.w / 2} ry={ann.h / 2}
        stroke={ann.color} strokeWidth="0.003" fill={ann.color + '44'} />
    );

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] bg-black/85 flex flex-col items-center justify-center p-4 gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 shadow-xl max-w-4xl w-full">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Marcar:</span>
        {(['rect', 'circle'] as const).map(t => (
          <button key={t} onClick={() => setTool(t)}
            className={cn('px-3 py-1 rounded-lg text-sm font-medium border transition-colors',
              tool === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            )}>
            {t === 'rect' ? 'Cuadrado' : 'Círculo'}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          {ANNOT_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={cn('w-5 h-5 rounded-full border-2 transition-all',
                color === c ? 'border-slate-900 dark:border-white scale-125' : 'border-transparent'
              )} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setAnnotations([])}
            className="px-3 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            Limpiar
          </button>
          <button onClick={onClose}
            className="px-3 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={annotations.length === 0 || saving}
            className="px-4 py-1 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed min-w-[80px]">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
      {/* Image + SVG overlay */}
      <div className="relative select-none" style={{ lineHeight: 0 }}>
        <img src={img.url} alt="" draggable={false}
          style={{ maxHeight: '72vh', maxWidth: '90vw', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />
        <svg ref={svgRef} viewBox="0 0 1 1" preserveAspectRatio="none"
          className="absolute inset-0 cursor-crosshair"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
          {annotations.map((ann, i) => renderSVGShape(ann, i))}
          {current && renderSVGShape({ type: tool, ...current, color }, -1)}
        </svg>
      </div>
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 rounded-lg text-xs text-red-700 dark:text-red-300 max-w-4xl w-full">
          <AlertCircle size={13} className="shrink-0" />
          {saveError}
        </div>
      )}
      <p className="text-xs text-slate-500">Clic y arrastra para dibujar · Limpiar elimina todas las marcas</p>
    </div>
  );
};

const CenterCodeAutocomplete = ({
  label, value, onChange, inputRef, highlight
}: {
  label: string, value: string, onChange: (code: string, center?: ConcesionCentro) => void,
  inputRef?: React.RefObject<HTMLInputElement | null>, highlight?: boolean
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const concesionFieldId = React.useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync from external changes only (e.g. reset or auto-fill from center selection).
  // The ref prevents re-syncing when the change originated from the user's own typing.
  const internalTyping = useRef(false);
  useEffect(() => {
    if (!internalTyping.current) {
      setQuery(value);
    }
    internalTyping.current = false;
  }, [value]);

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return CONCESIONES_DB
      .filter(c => c.codigo.startsWith(query) || c.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (center: ConcesionCentro) => {
    setQuery(center.codigo);
    setOpen(false);
    onChange(center.codigo, center);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor={concesionFieldId} className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          id={concesionFieldId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            internalTyping.current = true;
            setQuery(e.target.value);
            setOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder="Ej. 102345"
          className={cn(
            "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
            highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
          )}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-auto max-h-64">
            {suggestions.map(c => (
              <button
                key={c.codigo}
                type="button"
                onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{c.codigo}</span>
                  <span className="text-slate-700 dark:text-slate-200 text-sm truncate">{c.nombre}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 truncate">{c.titular}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MarineButton = ({ children, onClick, disabled, className, variant = "primary" }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, className?: string, variant?: "primary" | "secondary" }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "relative overflow-hidden group px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "primary" 
        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40" 
        : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700",
      className
    )}
  >
    <div className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </div>
    {/* Marine wave effect on hover */}
    <motion.div
      initial={{ y: "100%" }}
      whileHover={{ y: "0%" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
    />
    <div className="absolute -bottom-1 -left-1 right-0 h-1 bg-cyan-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const CheckboxField = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className={cn(
      "w-5 h-5 rounded border transition-all flex items-center justify-center",
      checked 
        ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500" 
        : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400"
    )}>
      {checked && <CheckCircle2 size={14} className="text-white" />}
    </div>
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

// --- WelcomeScreen — extracted outside App to prevent remount on every render ---

const WelcomeScreen = ({
  setUserRole,
  setShowWelcome,
  setAquaPhase,
  logoProvider = 'certimar',
  skipSplash = false,
}: {
  setUserRole:    React.Dispatch<React.SetStateAction<'admin' | 'editor' | 'reader' | null>>;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
  setAquaPhase:   React.Dispatch<React.SetStateAction<'idle' | 'in' | 'hold' | 'out'>>;
  logoProvider?:  'certimar' | 'engelbert';
  skipSplash?:    boolean;
}) => {
  const [phase, setPhase]             = React.useState<'splash' | 'login'>(skipSplash ? 'login' : 'splash');
  const [splashPhase, setSplashPhase] = React.useState<'school' | 'logo' | 'out'>('school');
  const [step, setStep]               = React.useState<'google' | 'pin'>('google');
  const [googleEmail, setGoogleEmail] = React.useState('');
  const [pin, setPin]                 = React.useState('');
  const [error, setError]             = React.useState('');
  const [loading, setLoading]         = React.useState(false);

  // ── responsive ──
  const [winW, setWinW] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = winW < 640;
  const pendingRoleRef                = React.useRef<'admin' | 'editor' | 'reader' | null>(null);

  const triggerAquaLogin = React.useCallback((role: 'admin' | 'editor' | 'reader') => {
    pendingRoleRef.current = role;
    setAquaPhase('in');
    setTimeout(() => setAquaPhase('hold'), 600);
    // Transicionar a la app principal mientras el overlay aún cubre la pantalla
    setTimeout(() => {
      setUserRole(pendingRoleRef.current);
      setShowWelcome(false);
    }, 1100);
    // Desvanecer el overlay DESPUÉS de que la app principal ya esté renderizada
    setTimeout(() => setAquaPhase('out'), 1700);
  }, [setUserRole, setShowWelcome, setAquaPhase]);

  const logoSrc = logoProvider === 'engelbert' ? '/engelbert-logo.png' : '/certimar-logo.png';
  const logoAlt = logoProvider === 'engelbert' ? 'Engelbert Aquastructures' : 'CERTIMAR';

  React.useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase('logo'),  1300);
    const t2 = setTimeout(() => setSplashPhase('out'),   3100);
    const t3 = setTimeout(() => setPhase('login'),       3600);
    // Precarga firebase/auth para que el popup no sea bloqueado por el navegador
    import('firebase/auth').catch(() => {});
    import('./firebase').catch(() => {});
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleGoogleSignIn = React.useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: 'certimar.cl' });
      const result = await signInWithPopup(auth, provider);
      const email = (result.user.email ?? '').toLowerCase();
      if (!email.endsWith('@certimar.cl')) {
        setError('Solo cuentas @certimar.cl tienen acceso.');
        await result.user.delete().catch(() => {});
        return;
      }
      if (email === 'operaciones@certimar.cl') {
        setGoogleEmail(email);
        setStep('pin');
      } else {
        localStorage.setItem('certimar-session', JSON.stringify({ role: 'editor', email, expiry: Date.now() + 8 * 60 * 60 * 1000 }));
        triggerAquaLogin('editor');
      }
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [triggerAquaLogin]);

  const handlePin = () => {
    if (ADMIN_PIN && pin === ADMIN_PIN) {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'admin', email: googleEmail, expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      triggerAquaLogin('admin');
    } else if (pin === '') {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'reader', email: googleEmail, expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      triggerAquaLogin('reader');
    } else {
      setError('PIN incorrecto.');
    }
  };

  // ── Google SVG helper ──
  const GoogleIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#080c14', overflow: 'hidden' }}>

      {/* ══ AMBIENTE MARINO ══ 30% opacidad, siempre visible ══ */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.3 }}>

        {/* Rocas en el fondo */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 120, display: 'block' }} viewBox="0 0 1440 120" preserveAspectRatio="none">
          {BG_ROCKS.map((r, i) => (
            <ellipse key={i} cx={`${r.x + r.w * 0.35}%`} cy="105" rx={`${r.w * 0.4}%`} ry={r.h * 0.4} fill={i % 2 === 0 ? '#1e3a5f' : '#0f2040'} />
          ))}
          <path d="M0,90 Q80,60 160,80 Q240,100 320,70 Q400,40 480,65 Q560,90 640,60 Q720,30 800,55 Q880,80 960,50 Q1040,20 1120,45 Q1200,70 1280,50 Q1360,30 1440,55 L1440,120 L0,120Z" fill="#0d1b2e" />
        </svg>

        {/* Algas (seaweed) animadas */}
        {BG_SEAWEED.map((s, i) => (
          <motion.div
            key={`sw-${i}`}
            style={{ position: 'absolute', bottom: 0, left: `${s.x}%`, width: 8, height: s.h, borderRadius: '4px 4px 0 0', background: s.color, transformOrigin: 'bottom center' }}
            animate={{ rotate: [-6, 6, -4, 8, -6], scaleX: [1, 0.85, 1.1, 0.9, 1] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Ola de marea */}
        <motion.svg style={{ position: 'absolute', bottom: 60, left: 0, width: '200%', height: 40 }} viewBox="0 0 2880 40" preserveAspectRatio="none"
          animate={{ x: [0, -1440] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
          <path d="M0,20 Q90,5 180,20 Q270,35 360,20 Q450,5 540,20 Q630,35 720,20 Q810,5 900,20 Q990,35 1080,20 Q1170,5 1260,20 Q1350,35 1440,20 Q1530,5 1620,20 Q1710,35 1800,20 Q1890,5 1980,20 Q2070,35 2160,20 Q2250,5 2340,20 Q2430,35 2520,20 Q2610,5 2700,20 Q2790,35 2880,20 L2880,40 L0,40Z" fill="rgba(56,189,248,0.15)" />
        </motion.svg>

        {/* Segunda ola (offset) */}
        <motion.svg style={{ position: 'absolute', bottom: 50, left: 0, width: '200%', height: 30 }} viewBox="0 0 2880 30" preserveAspectRatio="none"
          animate={{ x: [-720, -2160] }} transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}>
          <path d="M0,15 Q120,2 240,15 Q360,28 480,15 Q600,2 720,15 Q840,28 960,15 Q1080,2 1200,15 Q1320,28 1440,15 Q1560,2 1680,15 Q1800,28 1920,15 Q2040,2 2160,15 Q2280,28 2400,15 Q2520,2 2640,15 Q2760,28 2880,15 L2880,30 L0,30Z" fill="rgba(56,189,248,0.1)" />
        </motion.svg>

        {/* Peces nadando */}
        {BG_FISH.map((f, i) => (
          <motion.div key={`bgf-${i}`} style={{ position: 'absolute', top: `${f.y}%`, color: '#7dd3fc' }}
            initial={{ x: f.dir > 0 ? '-8vw' : '108vw' }}
            animate={{ x: f.dir > 0 ? '110vw' : '-10vw', y: [0, Math.sin(i) * 10, -Math.sin(i) * 7, 0] }}
            transition={{ duration: f.dur, repeat: Infinity, delay: f.delay, ease: 'linear' }}>
            <Fish size={f.size} style={{ transform: f.dir < 0 ? 'scaleX(-1)' : 'none' }} />
          </motion.div>
        ))}

        {/* Medusas */}
        {BG_JELLYFISH.map((j, i) => (
          <motion.div key={`bgj-${i}`} style={{ position: 'absolute', left: `${j.x}%`, color: '#a5b4fc' }}
            initial={{ y: '-12vh' }}
            animate={{ y: '110vh', x: [0, 12, -8, 6, 0] }}
            transition={{ duration: j.dur, repeat: Infinity, delay: j.delay, ease: 'linear' }}>
            <svg width={j.size} height={j.size * 1.4} viewBox="0 0 40 55" fill="none">
              <ellipse cx="20" cy="18" rx="16" ry="14" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
              {[8,13,18,23,28,33].map((cx, k) => (
                <motion.line key={k} x1={cx} y1="31" x2={cx + (k%2===0?-3:3)} y2="52"
                  stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" strokeLinecap="round"
                  animate={{ x2: [cx+(k%2===0?-3:3), cx+(k%2===0?3:-3), cx+(k%2===0?-3:3)] }}
                  transition={{ duration: 1.4+k*0.2, repeat: Infinity, ease: 'easeInOut' }} />
              ))}
            </svg>
          </motion.div>
        ))}

        {/* Burbujas */}
        {BG_BUBBLES.map((b, i) => (
          <motion.div key={`bgb-${i}`} style={{ position: 'absolute', bottom: '-5%', left: `${b.x}%`, width: b.size, height: b.size, borderRadius: '50%', background: 'rgba(125,211,252,0.45)', border: '1px solid rgba(125,211,252,0.25)' }}
            animate={{ y: [0, '-105vh'], opacity: [0, 0.8, 0.8, 0], x: [0, Math.sin(i)*18, 0] }}
            transition={{ duration: b.dur, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }} />
        ))}
      </div>

      {/* ══ SPLASH ══ cardumen → logo protagonista ══ */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            key="splash"
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ opacity: splashPhase === 'out' ? 0 : 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Cardumen que se dispersa */}
            {SCHOOL_FISH.map((f, i) => (
              <motion.div
                key={`sf-${i}`}
                style={{ position: 'absolute', color: '#7dd3fc' }}
                animate={{
                  x:       splashPhase === 'school' ? f.startX : f.endX,
                  y:       splashPhase === 'school' ? f.startY : f.endY,
                  opacity: splashPhase === 'school' ? 0.65 : 0,
                  scale:   splashPhase === 'school' ? 1 : 0.2,
                }}
                transition={{ duration: splashPhase === 'logo' ? f.dur : 0.6, delay: splashPhase === 'logo' ? f.delay : 0, ease: 'easeOut' }}
              >
                <Fish size={f.size} style={{ transform: f.flipX ? 'scaleX(-1)' : 'none' }} />
              </motion.div>
            ))}

            {/* Logo protagonista — aparece al dispersarse el cardumen */}
            <motion.div
              style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}
              animate={{
                opacity: splashPhase === 'school' ? 0 : 1,
                scale:   splashPhase === 'school' ? 0.75 : 1,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={logoSrc}
                alt={logoAlt}
                style={{ height: isMobile ? 80 : 130, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.95, maxWidth: isMobile ? 200 : 320 }}
              />
              <p style={{ color: '#475569', fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>
                Norma 1511 · Puerto Aysén
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SPLIT LAYOUT ══ */}
      <AnimatePresence>
        {phase === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '16px 12px' : 24 }}
          >
            <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: isMobile ? 16 : 20, border: '1px solid #1e2535', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', minHeight: isMobile ? 'unset' : 520 }}>

              {/* ── PANEL IZQUIERDO ── */}
              <div style={{ flex: '0 0 55%', minWidth: 280, background: '#0d1117', padding: '44px 40px 36px', borderRight: '1px solid #1e2535', display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>

                {/* Patrón topográfico sutil */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }} viewBox="0 0 480 520" preserveAspectRatio="xMidYMid slice">
                  {[40,80,120,160,200,240,280,320,360,400,440,480].map((r, i) => (
                    <ellipse key={i} cx="240" cy="280" rx={r} ry={r * 0.55} fill="none" stroke="#3b82f6" strokeWidth="1" />
                  ))}
                </svg>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Logo */}
                  <div style={{ marginBottom: 20 }}>
                    <img src={logoSrc} alt={logoAlt} style={{ height: 48, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                    <p style={{ color: '#334155', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>
                      Sistema de Certificación · Norma 1511
                    </p>
                  </div>

                  <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.65, marginBottom: 24 }}>
                    Sistema integrado de certificación bajo <span style={{ color: '#94a3b8' }}>Resolución Exenta N°1511/2021</span> para centros de cultivo de salmónidos. Gestiona el ciclo completo: registro de visita con firma digital en campo, elaboración de informes técnicos, generación de certificados en PDF y despacho a SERNAPESCA — todo en una sola plataforma con trazabilidad de extremo a extremo.
                  </p>

                  <div style={{ height: 1, background: '#1e2535', marginBottom: 24 }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {([
                      { icon: <ClipboardList size={14} style={{ color: '#3b82f6' }} />, label: 'Registro de Visita', desc: 'Captura digital con firma en campo' },
                      { icon: <FileText size={14} style={{ color: '#3b82f6' }} />, label: 'Informe 1511', desc: 'Certificados y actas en PDF con firma digital' },
                      { icon: <BarChart3 size={14} style={{ color: '#3b82f6' }} />, label: 'Métricas de Despacho', desc: 'Trazabilidad visita → informe con delay' },
                    ] as { icon: React.ReactNode; label: string; desc: string }[]).map(({ icon, label, desc }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                          {icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 11, color: '#475569' }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 20, height: 1, background: '#1e2535' }} />
                  <p style={{ fontSize: 10, fontWeight: 400, color: '#334155', letterSpacing: '0.05em' }}>
                    Developed by Micorriza, 2026, Puerto Aysén
                  </p>
                </div>
              </div>

              {/* ── PANEL DERECHO ── login */}
              <div style={{ flex: isMobile ? '1 1 100%' : '0 0 45%', minWidth: isMobile ? 'unset' : 260, background: '#111827', padding: isMobile ? '32px 24px 28px' : '44px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {isMobile && (
                  <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <img src={logoSrc} alt={logoAlt} style={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                    <p style={{ color: '#334155', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                      Sistema de Certificación · Norma 1511
                    </p>
                  </div>
                )}
                <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 280 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Ingresar al sistema</p>
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 32 }}>Usa tu cuenta institucional para acceder</p>

                  <AnimatePresence mode="wait">
                    {step === 'google' ? (
                      <motion.div key="google-step" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} transition={{duration:0.2}} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: '#f1f5f9', color: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'background 0.15s' }}
                          onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e2e8f0')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                        >
                          {loading ? (
                            <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                            </svg>
                          ) : <GoogleIcon />}
                          {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                        </button>
                        {error && <p style={{ textAlign: 'center', fontSize: 12, color: '#f87171' }}>{error}</p>}
                        <p style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 8 }}>
                          Acceso restringido · Solo cuentas @certimar.cl
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div key="pin-step" initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} transition={{duration:0.2}} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => { setStep('google'); setPin(''); setError(''); }} style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                            onMouseEnter={e=>(e.currentTarget.style.color='#94a3b8')} onMouseLeave={e=>(e.currentTarget.style.color='#475569')}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                          </button>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1' }}>
                            Acceso a <span style={{ color: '#3b82f6', fontWeight: 700 }}>Operaciones</span>
                          </p>
                        </div>
                        <p style={{ fontSize: 12, color: '#475569' }}>Cuenta: <span style={{ color: '#94a3b8' }}>{googleEmail}</span></p>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', display: 'block', marginBottom: 6 }}>
                            PIN Administrador <span style={{ textTransform: 'none', fontWeight: 400, color: '#334155' }}>(vacío = solo lectura)</span>
                          </label>
                          <input type="password" value={pin} autoFocus
                            onChange={e => { setPin(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handlePin()}
                            placeholder="••••" maxLength={4}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14, outline: 'none', textAlign: 'center', letterSpacing: '0.5em', fontWeight: 700, background: '#0d1117', border: '1px solid #1e2535', color: '#f1f5f9', caretColor: '#3b82f6', boxSizing: 'border-box' }}
                          />
                        </div>
                        {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}
                        <button onClick={handlePin}
                          style={{ width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='#2563eb')}
                          onMouseLeave={e=>(e.currentTarget.style.background='#1d4ed8')}>
                          Ingresar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── IndexedDB — almacenamiento de imágenes (sin límite de quota) ────────────
const IDB_NAME = 'certimar-images-v1';
const IDB_STORE = 'urls';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
async function idbSave(id: string, url: string) {
  const db = await idbOpen();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(url, id);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
async function idbDelete(id: string) {
  const db = await idbOpen();
  return new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res();
  });
}
async function idbGetAll(): Promise<Record<string, string>> {
  const db = await idbOpen();
  return new Promise((res) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const result: Record<string, string> = {};
    const curReq = store.openCursor();
    curReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) { result[cursor.key as string] = cursor.value; cursor.continue(); }
      else res(result);
    };
    curReq.onerror = () => res(result);
  });
}
async function idbClear() {
  const db = await idbOpen();
  return new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => res();
  });
}

// ─── Registro de Visita en IDB ────────────────────────────────────────────────
const RV_NAME_KEY  = '__rv_name__';
const RV_PAGE_PFX  = '__rv_page_';

async function idbSaveRegistroVisita(name: string, pages: string[]) {
  const db = await idbOpen();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Eliminar páginas antiguas antes de guardar (el PDF nuevo puede tener menos páginas)
    const curReq = store.openCursor();
    curReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        if ((cursor.key as string).startsWith(RV_PAGE_PFX)) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => {
      // Guardar nombre y páginas en una nueva transacción
      const tx2 = db.transaction(IDB_STORE, 'readwrite');
      const s2 = tx2.objectStore(IDB_STORE);
      s2.put(name, RV_NAME_KEY);
      pages.forEach((page, i) => s2.put(page, `${RV_PAGE_PFX}${i}`));
      tx2.oncomplete = () => res();
      tx2.onerror   = () => rej(tx2.error);
    };
    tx.onerror = () => rej(tx.error);
  });
}

async function idbDeleteRegistroVisita() {
  const db = await idbOpen();
  return new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(RV_NAME_KEY);
    const curReq = store.openCursor();
    curReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        if ((cursor.key as string).startsWith(RV_PAGE_PFX)) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => res();
  });
}

// ── Recortador manual de imagen para slots Ubicación Espacial ──
const CROP_TUTORIAL_KEY = 'certimar-crop-tutorial-seen';

const CropModal: React.FC<{
  img: { url: string; leyenda: string; slotUbicacion?: string };
  targetAr: number;
  onSave: (croppedUrl: string) => void;
  onClose: () => void;
}> = ({ img, targetAr, onSave, onClose }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef  = useRef<HTMLImageElement>(null);
  // imgBounds: rendered image position (px) relative to wrapRef
  const [imgBounds, setImgBounds] = useState({ left: 0, top: 0, w: 1, h: 1 });
  // crop in [0..1] relative to rendered image bounds
  const [crop, setCrop] = useState({ x: 0.05, y: 0.05, w: 0.9 });
  const dragging = useRef<{ mx: number; my: number; c0: typeof crop; mode: 'move' | 'resize' } | null>(null);
  // Tutorial: mostrar la primera vez, o si el usuario lo abre manualmente
  const [tutStep, setTutStep] = useState<number | null>(() =>
    localStorage.getItem(CROP_TUTORIAL_KEY) ? null : 0
  );
  const closeTutorial = () => { localStorage.setItem(CROP_TUTORIAL_KEY, '1'); setTutStep(null); };
  const tutSteps = [
    {
      icon: LayoutGrid,
      title: 'El recuadro define el área',
      desc: 'El recuadro blanco delimita la zona de la imagen que aparecerá en el informe PDF. Lo que quede fuera se recortará.',
      highlight: 'crop',
    },
    {
      icon: Move,
      title: 'Arrastra para reposicionar',
      desc: 'Haz clic y arrastra dentro del recuadro para moverlo sobre la imagen. La proporción del slot se mantiene fija.',
      highlight: 'move',
    },
    {
      icon: MousePointer2,
      title: 'Esquina inferior derecha para redimensionar',
      desc: 'Arrastra el handle blanco en la esquina inferior derecha para cambiar el tamaño del recorte, conservando siempre la relación de aspecto.',
      highlight: 'resize',
    },
    {
      icon: Crop,
      title: 'Aplica el recorte',
      desc: 'Pulsa "Aplicar recorte" para confirmar. El recorte se guarda en este dispositivo y se usa en el PDF. Puedes editarlo cuantas veces quieras.',
      highlight: 'apply',
    },
  ];

  const updateBounds = () => {
    if (!wrapRef.current || !imgRef.current) return;
    const wr = wrapRef.current.getBoundingClientRect();
    const ir = imgRef.current.getBoundingClientRect();
    setImgBounds({ left: ir.left - wr.left, top: ir.top - wr.top, w: ir.width || 1, h: ir.height || 1 });
  };

  const clamp = (c: typeof crop): typeof crop => {
    const h = c.w / targetAr;
    const x = Math.max(0, Math.min(1 - c.w, c.x));
    const y = Math.max(0, Math.min(1 - h, c.y));
    const w = Math.max(0.05, Math.min(1 - x, c.w));
    return { x, y, w };
  };

  const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = { mx: e.clientX, my: e.clientY, c0: { ...crop }, mode };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - dragging.current.mx) / imgBounds.w;
    const dy = (e.clientY - dragging.current.my) / imgBounds.h;
    const c0 = dragging.current.c0;
    if (dragging.current.mode === 'move') {
      setCrop(clamp({ ...c0, x: c0.x + dx, y: c0.y + dy }));
    } else {
      setCrop(clamp({ ...c0, w: Math.max(0.05, c0.w + dx) }));
    }
  };

  const onPointerUp = () => { dragging.current = null; };

  const applyCrop = () => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => {
      const nw = el.naturalWidth, nh = el.naturalHeight;
      const ch = crop.w / targetAr;
      const sx = Math.round(crop.x * nw), sy = Math.round(crop.y * nh);
      const sw = Math.round(crop.w * nw), sh = Math.round(ch * nh);
      const OUT_W = 1200, OUT_H = Math.round(OUT_W / targetAr);
      const canvas = document.createElement('canvas');
      canvas.width = OUT_W; canvas.height = OUT_H;
      canvas.getContext('2d')!.drawImage(el, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
      onSave(canvas.toDataURL('image/jpeg', 0.92));
    };
    el.onerror = () => onClose();
    el.src = img.url;
  };

  const cropH = crop.w / targetAr;
  const slotLabel = img.slotUbicacion === 'top' ? 'Arriba' : img.slotUbicacion === 'bottom' ? 'Abajo'
    : img.slotUbicacion === 'left' ? 'Centro izq.' : img.slotUbicacion === 'right' ? 'Centro der.' : '—';

  // Crop rect in px relative to wrap (accounts for image letterbox inside wrap)
  const rx = imgBounds.left + crop.x * imgBounds.w;
  const ry = imgBounds.top  + crop.y * imgBounds.h;
  const rw = crop.w * imgBounds.w;
  const rh = cropH  * imgBounds.h;

  const tut = tutStep !== null ? tutSteps[tutStep] : null;
  const TutIcon = tut ? tut.icon : null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col gap-4 p-5 w-full max-w-2xl relative">

        {/* Tutorial overlay (shown on first use) */}
        {tut && TutIcon && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-white/97 dark:bg-slate-900/97 backdrop-blur-sm flex flex-col items-center justify-center gap-6 p-8">
            {/* Diagram SVG illustration per step */}
            <div className="w-full max-w-xs">
              {tut.highlight === 'crop' && (
                <svg viewBox="0 0 240 120" className="w-full rounded-xl border border-slate-200 dark:border-slate-700">
                  <rect width="240" height="120" fill="#0f172a" />
                  <image href={img.url} x="0" y="0" width="240" height="120" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.5 }} />
                  <rect x="20" y="15" width="200" height="90" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 3" />
                  <rect x="0" y="0" width="20" height="120" fill="rgba(0,0,0,0.55)" />
                  <rect x="220" y="0" width="20" height="120" fill="rgba(0,0,0,0.55)" />
                  <rect x="20" y="0" width="200" height="15" fill="rgba(0,0,0,0.55)" />
                  <rect x="20" y="105" width="200" height="15" fill="rgba(0,0,0,0.55)" />
                  <text x="120" y="65" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">Área visible en PDF</text>
                </svg>
              )}
              {tut.highlight === 'move' && (
                <svg viewBox="0 0 240 120" className="w-full rounded-xl border border-slate-200 dark:border-slate-700">
                  <rect width="240" height="120" fill="#0f172a" />
                  <image href={img.url} x="0" y="0" width="240" height="120" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.5 }} />
                  <rect x="40" y="20" width="160" height="72" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="2" />
                  <line x1="80" y1="56" x2="120" y2="56" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr)" />
                  <line x1="120" y1="56" x2="120" y2="30" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="80" cy="56" r="5" fill="#38bdf8" />
                  <text x="130" y="52" fill="#38bdf8" fontSize="9" fontFamily="sans-serif">Arrastra</text>
                </svg>
              )}
              {tut.highlight === 'resize' && (
                <svg viewBox="0 0 240 120" className="w-full rounded-xl border border-slate-200 dark:border-slate-700">
                  <rect width="240" height="120" fill="#0f172a" />
                  <image href={img.url} x="0" y="0" width="240" height="120" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.5 }} />
                  <rect x="30" y="15" width="160" height="72" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="2" />
                  <rect x="178" y="75" width="14" height="14" fill="white" rx="2" />
                  <line x1="192" y1="89" x2="212" y2="109" stroke="#38bdf8" strokeWidth="2.5" />
                  <circle cx="212" cy="109" r="5" fill="#38bdf8" />
                  <text x="170" y="113" fill="#38bdf8" fontSize="9" fontFamily="sans-serif">Redimensiona</text>
                </svg>
              )}
              {tut.highlight === 'apply' && (
                <svg viewBox="0 0 240 80" className="w-full rounded-xl border border-slate-200 dark:border-slate-700">
                  <rect width="240" height="80" fill="#f0f9ff" />
                  <rect x="60" y="20" width="120" height="40" rx="8" fill="#0284c7" />
                  <text x="120" y="45" textAnchor="middle" fill="white" fontSize="13" fontFamily="sans-serif" fontWeight="bold">Aplicar recorte</text>
                  <path d="M 45 40 L 58 40" stroke="#0284c7" strokeWidth="2" markerEnd="url(#arr2)" />
                </svg>
              )}
            </div>

            {/* Step indicator */}
            <div className="flex gap-1.5">
              {tutSteps.map((_, i) => (
                <div key={i} className="rounded-full transition-all" style={{ width: i === tutStep ? 20 : 8, height: 8, background: i === tutStep ? '#0284c7' : '#cbd5e1' }} />
              ))}
            </div>

            {/* Icon + text */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 mx-auto">
                <TutIcon size={24} className="text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{tut.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">{tut.desc}</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {tutStep > 0 && (
                <button onClick={() => setTutStep(s => (s ?? 1) - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1">
                  <ChevronLeft size={14} /> Anterior
                </button>
              )}
              {tutStep < tutSteps.length - 1 ? (
                <button onClick={() => setTutStep(s => (s ?? 0) + 1)}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center gap-1.5">
                  Siguiente <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={closeTutorial}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} /> Empezar a recortar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Recorte manual</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Slot: <span className="font-semibold text-sky-600">{slotLabel}</span> · Relación {targetAr.toFixed(2)}:1 · Arrastra el recuadro
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTutStep(0)}
              title="Ver tutorial"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-sky-600 transition-colors"
            >
              <Info size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image + crop overlay */}
        <div
          ref={wrapRef}
          className="relative rounded-xl bg-slate-900 select-none overflow-hidden"
          style={{ maxHeight: '55vh' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={img.url}
            alt=""
            className="block mx-auto max-w-full max-h-[55vh] object-contain"
            draggable={false}
            onLoad={updateBounds}
          />
          {/* dark overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.5)' }} />
          {/* crop rect */}
          <div
            className="absolute cursor-move"
            style={{ left: rx, top: ry, width: rw, height: rh, outline: '2px solid white', background: 'rgba(255,255,255,0.05)' }}
            onPointerDown={(e) => onPointerDown(e, 'move')}
          >
            {[33.3, 66.6].map(p => (
              <React.Fragment key={p}>
                <div className="absolute border-white/25 border-r" style={{ left: `${p}%`, top: 0, bottom: 0, width: 0 }} />
                <div className="absolute border-white/25 border-b" style={{ top: `${p}%`, left: 0, right: 0, height: 0 }} />
              </React.Fragment>
            ))}
            <div
              className="absolute bottom-0 right-0 w-7 h-7 bg-white/90 cursor-se-resize flex items-center justify-center rounded-tl-lg shadow"
              onPointerDown={(e) => onPointerDown(e, 'resize')}
            >
              <SlidersHorizontal size={11} className="text-slate-700" />
            </div>
          </div>
        </div>

        {/* Quick tips bar */}
        <div className="flex items-center gap-4 px-1 text-[11px] text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1"><Move size={11} /> Arrastra el recuadro</span>
          <span className="text-slate-200 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1"><MousePointer2 size={11} /> Esquina para redimensionar</span>
          <span className="text-slate-200 dark:text-slate-700">·</span>
          <button onClick={() => setTutStep(0)} className="flex items-center gap-1 underline underline-offset-2 hover:text-sky-500 transition-colors">
            <Info size={10} /> Tutorial
          </button>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={applyCrop}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow flex items-center gap-2"
          >
            <Crop size={14} /> Aplicar recorte
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Vista previa 4-slot de Ubicación Espacial ──
const AerialPreview: React.FC<{
  images: import('./types').ReportImage[];
}> = ({ images }) => {
  const ubicacion = images.filter(i => i.seccion === 'Ubicación Espacial');
  if (ubicacion.length === 0) return null;

  const kw = (img: import('./types').ReportImage, ...words: string[]) =>
    words.some(w => img.leyenda?.toLowerCase().includes(w.toLowerCase()));
  const bySlot = (slot: string) => ubicacion.find(i => i.slotUbicacion === slot);
  const noSlot = ubicacion.filter(i => !i.slotUbicacion);

  const top    = bySlot('top')    ?? noSlot.find(i => kw(i,'estructura','módulo')) ?? noSlot[0];
  const left   = bySlot('left')   ?? noSlot.find(i => kw(i,'diagonal','arreglo') && i !== top) ?? noSlot.find(i => i !== top);
  const right  = bySlot('right')  ?? noSlot.find(i => kw(i,'aérea','general','contexto') && i !== top && i !== left) ?? noSlot.find(i => i !== top && i !== left);
  const bottom = bySlot('bottom') ?? noSlot.find(i => i !== top && i !== left && i !== right);

  const Slot: React.FC<{ img?: import('./types').ReportImage; label: string }> = ({ img, label }) => (
    <div className="relative rounded overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center" style={{ minHeight: 56 }}>
      {img?.croppedUrl || img?.url ? (
        <img src={img.croppedUrl ?? img.url} alt={img.leyenda} className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <span className="text-[9px] text-slate-500 dark:text-slate-500 z-10 px-1 text-center">{label}</span>
      )}
      {img && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 truncate text-[9px] text-white text-center">
          {img.leyenda || '(sin leyenda)'}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      <div className="px-3 py-2 bg-sky-50 dark:bg-sky-900/30 border-b border-sky-100 dark:border-sky-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">Vista previa tabla Ubicación Espacial</p>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <Slot img={top} label="Arriba (ancho completo)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <Slot img={left} label="Centro izquierda" />
          <Slot img={right} label="Centro derecha" />
        </div>
        <Slot img={bottom} label="Abajo (ancho completo)" />
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'general' | 'extraction' | 'denaturation' | 'storage' | 'report' | 'issue' | 'history' | 'config' | 'stats'>('general');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(() => {
    const SCHEMA_VERSION = 'v3';
    try {
      const raw = localStorage.getItem('certimar-draft-state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.__version === SCHEMA_VERSION) {
          // Preservar URLs de Firebase (http); limpiar blob:/base64 (el guardado ya solo escribe http o '')
          parsed.images = (parsed.images ?? []).map((img: any) => ({ ...img, url: img.url?.startsWith('http') ? img.url : '' }));
          // Rellenar campos añadidos después del primer guardado con valor 'v3'
          if (parsed.general && parsed.general.observaciones_acta === undefined) {
            parsed.general.observaciones_acta = '';
          }
          if (parsed.general && parsed.general.revisionConfirmada === undefined) {
            parsed.general.revisionConfirmada = false;
          }
          if (parsed.extraction && parsed.extraction.equipos_extraccion === undefined) {
            parsed.extraction.equipos_extraccion = [];
          }
          if (parsed.denaturation?.generacion_electrica) {
            parsed.denaturation.generacion_electrica = parsed.denaturation.generacion_electrica.map(
              (gen: any) => gen.catalogoId !== undefined ? gen : { ...gen, catalogoId: inferCatalogoId(gen) }
            );
          }
          if (parsed.extraction?.parametros?.sistema_principal === 'LIFT-UP (Novatech)') {
            parsed.extraction.parametros.sistema_principal = 'LIFT-UP';
          }
          // Continuidad con borradores guardados antes del fix de docId único:
          // en registros pre-fix el ID de documento era el propio registroId, así
          // que al reabrir el borrador seguimos escribiendo sobre el mismo doc en
          // vez de bifurcarlo en uno nuevo.
          if (parsed.docId === undefined && parsed.registroId) {
            parsed.docId = parsed.registroId;
          }
          return parsed;
        }
        localStorage.removeItem('certimar-draft-state');
      }
    } catch {}
    return DEFAULT_STATE;
  });

  // Catálogo de equipos personalizados (persiste en Firestore, visible para admin)
  const [catalogoCustom, setCatalogoCustom] = useState<CatalogoCustomEntry[]>([]);
  const [guardandoInc, setGuardandoInc] = useState<'idle' | 'guardando' | 'guardado'>('idle');
  const [pendingCustomEquipo, setPendingCustomEquipo] = useState<{ marca_modelo: string; tipo: TipoEquipoCatalogo } | null>(null);

  // Bloqueo optimista de registros
  const [bloqueoActivo, setBloqueoActivo] = useState<{ email: string; nombre: string; desde: Date } | null>(null);

  const handleAddEquipo = (entry: CatalogoCustomEntry) => {
    setCatalogoCustom(prev => [...prev, entry]);
  };

  const handleUpdateEquipo = (entry: CatalogoCustomEntry) => {
    setCatalogoCustom(prev => prev.map(e => (e.id === entry.id ? entry : e)));
  };

  const handleDeleteEquipo = (id: string) => {
    setCatalogoCustom(prev => prev.filter(e => e.id !== id));
  };

  const LOCK_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

  const acquireLock = async (registroId: string) => {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      if (!user) return;
      await setDoc(doc(db, 'bloqueos', registroId), {
        email: user.email ?? '',
        nombre: state.general.certificador.nombre || user.email,
        desde: serverTimestamp(),
        expira: new Date(Date.now() + LOCK_TTL_MS),
      });
    } catch { /* no crítico */ }
  };

  const releaseLock = async (registroId: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      if (!user) return;
      // Solo libera si el bloqueo le pertenece
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'bloqueos', registroId));
      if (snap.exists() && snap.data().email === user.email) {
        await deleteDoc(doc(db, 'bloqueos', registroId));
      }
    } catch { /* no crítico */ }
    setBloqueoActivo(null);
  };

  const checkLock = async (registroId: string): Promise<{ email: string; nombre: string; desde: Date } | null> => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      const snap = await getDoc(doc(db, 'bloqueos', registroId));
      if (!snap.exists()) return null;
      const data = snap.data();
      // Bloqueo propio o expirado → ignorar
      if (data.email === user?.email) return null;
      const expira = data.expira?.toDate ? data.expira.toDate() : new Date(data.expira);
      if (expira < new Date()) return null;
      return { email: data.email, nombre: data.nombre, desde: data.desde?.toDate ? data.desde.toDate() : new Date() };
    } catch { return null; }
  };

  // Restaurar imágenes y Registro de Visita desde IndexedDB al montar.
  // IDB tiene prioridad sobre la URL de Firebase: garantiza que las anotaciones
  // sean siempre visibles y que las imágenes carguen aunque Firebase no esté disponible.
  const [imagesRestoring, setImagesRestoring] = useState(false);
  useEffect(() => {
    setImagesRestoring(true);
    idbGetAll().then(urlMap => {
      // Restaurar imágenes
      if (Object.keys(urlMap).length) {
        setState(prev => ({
          ...prev,
          images: prev.images.map(img => ({
            ...img,
            url: urlMap[img.id] ?? img.url,
            croppedUrl: urlMap[`crop_${img.id}`] ?? img.croppedUrl,
          }))
        }));
      }
      // Restaurar Registro de Visita
      const rvName = urlMap[RV_NAME_KEY];
      if (rvName) {
        const pages: string[] = [];
        let i = 0;
        while (urlMap[`${RV_PAGE_PFX}${i}`]) {
          pages.push(urlMap[`${RV_PAGE_PFX}${i}`]);
          i++;
        }
        if (pages.length > 0) {
          registroVisitaRef.current = pages;
          setRegistroVisitaName(rvName);
        }
      }
    }).finally(() => setImagesRestoring(false));
  }, []); // solo al montar

  // Recuperar URLs desde Firebase Storage para imágenes sin URL (registros antiguos sin URL en Firestore)
  const storageRecoveredIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const emptyImgs = state.images.filter(img => !img.url && img.id && !storageRecoveredIds.current.has(img.id));
    if (emptyImgs.length === 0) return;
    emptyImgs.forEach(async img => {
      storageRecoveredIds.current.add(img.id);
      try {
        const { ref, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('./firebase');
        const url = await getDownloadURL(ref(storage, `images/${img.id}.jpg`));
        setState(prev => ({ ...prev, images: prev.images.map(i => i.id === img.id ? { ...i, url } : i) }));
        idbSave(img.id, url).catch(() => {});
      } catch { /* imagen no disponible en Storage */ }
    });
  }, [state.images]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-guardado en localStorage — SIN URLs (van en IndexedDB)
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savedBy, setSavedBy] = useState<string | null>(null);
  const [saveAnim, setSaveAnim] = useState(false);
  const [guardadoSection, setGuardadoSection] = useState<string | null>(null);
  const [guardandoSection, setGuardandoSection] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ref para leer el estado más reciente dentro de callbacks sin dependencias
  const stateRef = useRef(state);
  stateRef.current = state;

  // ID de documento único y estable del registro actual. NO se deriva del
  // correlativo local (que colisiona entre dispositivos). Se mantiene en un ref
  // para que esté disponible de inmediato en callbacks, aún antes del re-render.
  const docIdRef = useRef<string | null>(state.docId ?? null);
  useEffect(() => { if (state.docId && state.docId !== docIdRef.current) docIdRef.current = state.docId; }, [state.docId]);

  /**
   * Devuelve el ID de documento Firestore del registro actual; si todavía no
   * tiene uno, acuña uno único y lo persiste en el estado. Todas las rutas de
   * guardado (historico/registros/respaldos/Storage) deben usar esta función
   * para evitar que dos registros distintos compartan ID y se sobrescriban.
   */
  const ensureDocId = (): string => {
    const id = resolveDocId(docIdRef.current);
    if (id !== docIdRef.current) {
      docIdRef.current = id;
      setState(prev => (prev.docId ? prev : { ...prev, docId: id }));
    }
    return id;
  };

  // Auto-guardado silencioso en localStorage en cada cambio de estado
  useEffect(() => {
    const stateForStorage = {
      ...state,
      images: state.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : '',
      })),
      __version: 'v3',
    };
    try {
      localStorage.setItem('certimar-draft-state', JSON.stringify(stateForStorage));
    } catch { /* quota — no crítico, imágenes están en IndexedDB */ }
  }, [state]);

  const resetState = () => {
    if (window.confirm("¿Está seguro de que desea borrar el borrador actual y comenzar de nuevo?")) {
      if (state.docId) releaseLock(state.docId);
      setBloqueoActivo(null);
      idbClear();
      docIdRef.current = null;
      setState(DEFAULT_STATE);
      localStorage.removeItem('certimar-draft-state');
      setSavedAt(null);
      setSavedBy(null);
      setActiveTab('general');
    }
  };

  // Nuevo registro — limpia datos del centro pero preserva el certificador
  const newRecord = () => {
    if (window.confirm('¿Iniciar un nuevo registro?\nSe limpiarán los datos del centro, extracción, desnaturalización, almacenamiento e imágenes.\nLos datos del certificador se conservan.')) {
      if (state.docId) releaseLock(state.docId);
      setBloqueoActivo(null);
      idbClear();
      docIdRef.current = null;
      setState(prev => ({
        ...DEFAULT_STATE,
        general: {
          ...DEFAULT_STATE.general,
          certificador: prev.general.certificador,
          fechas: {
            evaluacion_documental: new Date().toISOString().split('T')[0],
            inspeccion_terreno:    new Date().toISOString().split('T')[0],
            emision_certificado:   new Date().toISOString().split('T')[0],
          },
        },
      }));
      setSavedAt(null);
      setSavedBy(null);
      setActiveTab('general');
    }
  };

  // Correlativo interno REG-001…
  const getNextCorrelativo = (): { registroId: string; nextCounter: number } => {
    const raw = localStorage.getItem('certimar-correlativo-counter');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    return { registroId: `REG-${String(next).padStart(3, '0')}`, nextCounter: next };
  };

  /** Hay datos del registro actual dignos de guardar como borrador. */
  const hasDraftableData = (): boolean => {
    const cc = state.general.centro_cultivo;
    return !!(cc.codigo_centro.trim() || cc.nombre_centro.trim());
  };

  /**
   * Guarda el registro actual como borrador antes de descartarlo. Devuelve true
   * si se puede continuar (guardado OK, nada que guardar, o el usuario aceptó
   * continuar pese al fallo de guardado).
   */
  const autosaveBeforeSwitch = async (): Promise<boolean> => {
    if (!hasDraftableData()) return true;
    const ok = await persistDraft('auto');
    if (ok) return true;
    return window.confirm(
      'No se pudo guardar el borrador actual (sin conexión).\n' +
      '¿Continuar de todas formas y descartar los cambios no guardados?'
    );
  };

  const comenzarRegistro = async () => {
    if (!window.confirm(
      '¿Comenzar un nuevo registro?\n' +
      'El registro actual se guardará automáticamente como borrador y podrás retomarlo desde el Histórico.\n' +
      'Se asignará un correlativo y se limpiarán los datos del centro, extracción, desnaturalización, almacenamiento e imágenes.\n' +
      'Los datos del certificador se conservan.'
    )) return;
    if (!(await autosaveBeforeSwitch())) return;
    logEvento('crear_registro');
    idbClear();
    const { registroId, nextCounter } = getNextCorrelativo();
    localStorage.setItem('certimar-correlativo-counter', String(nextCounter));
    const docId = newRecordDocId();
    docIdRef.current = docId;
    setState(prev => ({
      ...DEFAULT_STATE,
      registroId,
      docId,
      general: {
        ...DEFAULT_STATE.general,
        certificador: prev.general.certificador,
        fechas: { evaluacion_documental: "", inspeccion_terreno: "", emision_certificado: "" },
        revisionConfirmada: false,
      },
    }));
    setSavedAt(null);
    setSavedBy(null);
    setActiveTab('general');
  };

  /**
   * Guarda el estado actual en Firestore (registros/{id}) y hace upsert de la
   * entrada de histórico como borrador (esBorrador:true), sin degradar registros
   * que ya generaron documentos. Devuelve true si Firestore respondió OK.
   * `motivo` solo se registra en el doc registros para depuración.
   */
  const persistDraft = async (motivo: 'manual' | 'auto' | 'section'): Promise<boolean> => {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const cc = state.general.centro_cultivo;
      const docId = ensureDocId();
      const imagesMetadata = state.images.map(img => ({
        ...img,
        url: img.url?.startsWith('https://') ? img.url : '',
      }));
      const stateClean = JSON.parse(JSON.stringify(state));
      await setDoc(doc(db, 'registros', docId), {
        ...stateClean,
        images: imagesMetadata,
        __version: 'v3',
        __savedAt: serverTimestamp(),
        __savedBy: state.general.certificador.nombre || 'desconocido',
        __section: motivo,
      });
      const calcExt = calculatedExtraction;
      const calcDen = calculatedDenaturation;
      const calcSto = calculatedStorage;
      const existingEntry = historicoEntries.find(e => e.id === docId);
      const keepNonBorrador = motivo !== 'manual' && existingEntry && existingEntry.esBorrador === false;
      if (!keepNonBorrador) {
        const esEntradaNueva = !existingEntry?.creadoEn;
        await setDoc(doc(db, 'historico', docId), {
          registroId: state.registroId ?? docId,
          codigoCentro: cc.codigo_centro,
          nombreCentro: cc.nombre_centro,
          titular: cc.titular,
          fechaInspeccion: state.general.fechas.inspeccion_terreno,
          esBorrador: true,
          snapshot: JSON.parse(JSON.stringify({ ...state, images: imagesMetadata })),
          metricas: {
            capExtraccion: calcExt.capacidad_diaria_ton,
            capDesnaturalizacion: calcDen.capacidad_diaria_ton,
            capAlmacenamiento: calcSto.capacidad_almacenaje_ton,
            cumpleExtraccion: calcExt.cumple_norma,
            cumpleDesnaturalizacion: calcDen.cumple_norma,
            cumpleAlmacenamiento: calcSto.cumple_norma,
            sistemaExtraccion: state.extraction.parametros.sistema_principal,
            sistemaDesnaturalizacion: state.denaturation.equipos.tipo_sistema,
            modoOperacionMinima: state.general.modo_operacion_minima ?? false,
            numJaulas: state.extraction.parametros.numero_total_jaulas,
            jaulas_simultaneas: state.extraction.parametros.jaulas_simultaneas,
            profundidad_m: state.extraction.parametros.profundidad_operacion_m,
          },
          __updatedAt: serverTimestamp(),
          ...(esEntradaNueva && { creadoEn: serverTimestamp() }),
        }, { merge: true });
        setHistoricoEntries(prev => {
          const idx = prev.findIndex(e => e.id === docId);
          const updated: RegistroHistorico = {
            ...(idx >= 0 ? prev[idx] : {}),
            id: docId,
            registroId: state.registroId ?? docId,
            codigoCentro: cc.codigo_centro,
            nombreCentro: cc.nombre_centro,
            titular: cc.titular,
            fechaInspeccion: state.general.fechas.inspeccion_terreno,
            esBorrador: true,
            documentosGenerados: idx >= 0 ? (prev[idx].documentosGenerados ?? []) : [],
            snapshot: { ...state, images: imagesMetadata } as any,
            creadoEn: idx >= 0 ? (prev[idx].creadoEn ?? 'pending') : 'pending',
          };
          return idx >= 0 ? prev.map(e => e.id === docId ? updated : e) : [updated, ...prev];
        });
      }
      return true;
    } catch (err) {
      console.error('Error guardando borrador en Firestore:', err);
      return false;
    }
  };

  // Ref para usar siempre la versión más reciente de persistDraft en el intervalo
  const persistDraftRef = useRef(persistDraft);
  persistDraftRef.current = persistDraft;

  // Auto-guardado en Firestore cada 30 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      const cc = stateRef.current.general.centro_cultivo;
      if (!(cc.codigo_centro.trim() || cc.nombre_centro.trim())) return;
      const ok = await persistDraftRef.current('auto');
      if (ok) {
        setSavedAt(new Date());
        setSavedBy(stateRef.current.general.certificador.nombre.trim() || null);
        setSaveAnim(true);
        setTimeout(() => setSaveAnim(false), 1800);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const crearRespaldo = async (
    motivo: 'guardado_manual' | 'documento_generado' | 'version_nombrada',
    documentoTipo?: 'certificado' | 'informe' | 'acta',
    nombreVersion?: string
  ) => {
    try {
      const { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      const docId = ensureDocId();
      const imagesMetadata = state.images.map(img => ({
        ...img,
        url: img.url?.startsWith('https://') ? img.url : '',
        croppedUrl: undefined,
      }));
      const snapshotClean = JSON.parse(JSON.stringify({ ...state, images: imagesMetadata }));
      const versionData: Record<string, any> = {
        savedAt: serverTimestamp(),
        usuario: {
          nombre: state.general.certificador.nombre || user?.email || 'desconocido',
          email: user?.email || '',
        },
        motivo,
        snapshot: snapshotClean,
        __version: 'v3',
      };
      if (documentoTipo) versionData.documentoTipo = documentoTipo;
      if (nombreVersion) versionData.nombreVersion = nombreVersion;
      const versionesRef = collection(db, 'respaldos', docId, 'versiones');
      await addDoc(versionesRef, versionData);
      // Mantener máx. 30 versiones automáticas (las nombradas nunca se eliminan)
      if (motivo !== 'version_nombrada') {
        const allSnap = await getDocs(query(versionesRef, orderBy('savedAt', 'asc')));
        const autoVersions = allSnap.docs.filter(d => d.data().motivo !== 'version_nombrada');
        if (autoVersions.length > 30) {
          const toDelete = autoVersions.slice(0, autoVersions.length - 30);
          await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'respaldos', docId, 'versiones', d.id))));
        }
      }
    } catch (err) {
      console.error('Error creando respaldo de versión:', err);
    }
  };

  const guardarVersionNombrada = () => {
    if (!nombreVersionInput.trim() || nombrandoVersion || !versionesModal) return;
    setNombrandoVersion(true);
    crearRespaldo('version_nombrada', undefined, nombreVersionInput.trim())
      .then(() => loadVersiones(versionesModal.registroId))
      .finally(() => { setNombreVersionInput(''); setNombrandoVersion(false); });
  };

  const loadVersiones = async (registroId: string) => {
    setVersionesLoading(true);
    setVersiones([]);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const snap = await getDocs(query(collection(db, 'respaldos', registroId, 'versiones'), orderBy('savedAt', 'desc')));
      setVersiones(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RespaldoVersion, 'id'>) })));
    } catch (err) {
      console.error('Error cargando versiones:', err);
    } finally {
      setVersionesLoading(false);
    }
  };

  const restaurarVersion = async (version: RespaldoVersion) => {
    if (!window.confirm(
      '¿Restaurar esta versión?\n' +
      'El estado actual se guardará primero como respaldo automático.'
    )) return;
    setRestaurandoVersion(true);
    try {
      await crearRespaldo('guardado_manual');
      const targetId = versionesModal!.registroId; // doc ID del registro (clave Firestore)
      if (state.docId && state.docId !== targetId) {
        await releaseLock(state.docId);
      }
      const urlMap = await idbGetAll();
      const imagesFromVersion = (version.snapshot.images as any[]).map(img => ({
        ...img,
        url: urlMap[img.id] ?? img.url ?? '',
        croppedUrl: urlMap[`crop_${img.id}`] ?? '',
      }));
      docIdRef.current = targetId;
      setState({
        ...(version.snapshot as AppState),
        images: imagesFromVersion,
        docId: targetId,
        registroId: versionesModal!.entry.registroId,
      });
      await acquireLock(targetId);
      setVersionesModal(null);
      setActiveTab('general');
    } finally {
      setRestaurandoVersion(false);
    }
  };

  const handleGuardar = async (section: string) => {
    if (guardandoSection) return; // evitar doble-click
    setGuardandoSection(section);
    setSaveError(null);
    const ok = await persistDraft('section');
    if (ok) {
      crearRespaldo('guardado_manual'); // fire-and-forget, best-effort
      exportDraft();
      setGuardadoSection(section);
      setTimeout(() => setGuardadoSection(null), 2500);
      setSavedAt(new Date());
      setSavedBy(state.general.certificador.nombre.trim() || null);
      setSaveAnim(true);
      setTimeout(() => setSaveAnim(false), 1800);
    } else {
      setSaveError('No se pudo guardar en la nube. Verifica tu conexión.');
      setTimeout(() => setSaveError(null), 4000);
    }
    setGuardandoSection(null);
  };

  // ─── Histórico: guardar snapshot tras generar un documento ────────────────
  const saveToHistorico = async (
    tipo: 'certificado' | 'informe' | 'acta',
    documentUrl?: string
  ) => {
    try {
      const { doc, setDoc, serverTimestamp, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const cc = state.general.centro_cultivo;
      const docId = ensureDocId();
      const snapshotImgs = state.images.map(img => {
        const { croppedUrl: _crop, ...imgRest } = img as any;
        void _crop; // croppedUrl se almacena solo en IDB, no en Firestore
        return { ...imgRest, url: img.url?.startsWith('https://') ? img.url : '' };
      });
      // JSON.parse/stringify elimina undefined — Firestore v9 lanza error en campos undefined
      const snapshotClean = JSON.parse(JSON.stringify({ ...state, images: snapshotImgs }));
      const payload: Record<string, any> = {
        registroId: state.registroId ?? docId,
        codigoCentro: cc.codigo_centro,
        nombreCentro: cc.nombre_centro,
        titular: cc.titular,
        fechaInspeccion: state.general.fechas.inspeccion_terreno,
        esBorrador: false,
        documentosGenerados: arrayUnion(tipo),
        snapshot: snapshotClean,
        metricas: {
          capExtraccion: calculatedExtraction.capacidad_diaria_ton,
          capDesnaturalizacion: calculatedDenaturation.capacidad_diaria_ton,
          capAlmacenamiento: calculatedStorage.capacidad_almacenaje_ton,
          cumpleExtraccion: calculatedExtraction.cumple_norma,
          cumpleDesnaturalizacion: calculatedDenaturation.cumple_norma,
          cumpleAlmacenamiento: calculatedStorage.cumple_norma,
          sistemaExtraccion: state.extraction.parametros.sistema_principal,
          sistemaDesnaturalizacion: state.denaturation.equipos.tipo_sistema,
          modoOperacionMinima: state.general.modo_operacion_minima ?? false,
          numJaulas: state.extraction.parametros.numero_total_jaulas,
          jaulas_simultaneas: state.extraction.parametros.jaulas_simultaneas,
          profundidad_m: state.extraction.parametros.profundidad_operacion_m,
        },
        __updatedAt: serverTimestamp(),
      };
      const esEntradaNueva = !historicoEntries.find(e => e.id === docId)?.creadoEn;
      if (esEntradaNueva) {
        payload.creadoEn = serverTimestamp();
      }
      if (documentUrl) {
        payload[`documentUrls.${tipo}`] = documentUrl;
      }
      await setDoc(doc(db, 'historico', docId), payload, { merge: true });
      crearRespaldo('documento_generado', tipo); // fire-and-forget, best-effort
      setHistoricoEntries(prev => {
        const idx = prev.findIndex(e => e.id === docId);
        const base = idx >= 0 ? prev[idx] : {};
        const updated: RegistroHistorico = {
          ...base,
          id: docId,
          registroId: state.registroId ?? docId,
          codigoCentro: cc.codigo_centro,
          nombreCentro: cc.nombre_centro,
          titular: cc.titular,
          fechaInspeccion: state.general.fechas.inspeccion_terreno,
          esBorrador: false,
          documentosGenerados: [...((base as any).documentosGenerados ?? []), tipo].filter((v, i, a) => a.indexOf(v) === i),
          snapshot: snapshotClean as any,
        };
        return idx >= 0 ? prev.map(e => e.id === docId ? updated : e) : [updated, ...prev];
      });
    } catch (err) {
      console.error('Error guardando en histórico:', err);
      alert(`⚠️ El documento se generó, pero no se pudo guardar en el historial.\nError: ${(err as any)?.message ?? String(err)}\n\nCopia el mensaje anterior y repórtalo.`);
    }
  };

  const uploadDocToStorage = async (
    blob: Blob,
    docId: string,
    tipo: 'certificado' | 'informe' | 'acta' | 'registro_visita'
  ): Promise<string> => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('./firebase');
    const storageRef = ref(storage, `historico/${docId}/${tipo}.pdf`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const generateActaBlob = async (st: AppState = state): Promise<Blob> => {
    // patchOklch sobre el HTML completo elimina cualquier oklch() del template/estilos inline.
    const html = patchOklch(buildActaHtml(st));
    // Iframe aislado: su documento solo contiene el CSS del template (sin Tailwind v4),
    // por lo que html2canvas nunca encuentra oklch() al leer los estilos computados.
    // (Importante: se invoca html2canvas DIRECTAMENTE sobre el iframe, no vía jsPDF.html,
    //  que re-parenta el contenido al documento principal y filtraba el oklch de Tailwind.)
    const ANCHO_PX = 816; // 215,9mm a 96dpi ≈ ancho de página Oficio
    const iframe = document.createElement('iframe');
    // El iframe debe renderizarse REALMENTE (no `visibility:hidden` ni fuera de pantalla):
    // los iframes ocultos/desplazados no completan la maquetación del contenido alto y el
    // acta salía recortada (sin las secciones G y H). Lo dejamos en pantalla pero
    // transparente y alto desde el inicio para que el navegador lo maquete completo.
    iframe.style.cssText = `position:fixed;left:0;top:0;width:${ANCHO_PX}px;height:2400px;border:none;opacity:0;pointer-events:none;z-index:-1;`;
    // Cargar vía srcdoc (navegación real) en vez de document.write: este último tiene
    // quirks de maquetación que dejaban las últimas tablas (G y H) con altura ~0.
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    try {
      await new Promise<void>((resolve) => {
        iframe.addEventListener('load', () => resolve(), { once: true });
      });
      const iframeDoc = iframe.contentDocument!;
      // Envolver TODO el contenido en un div que se ajusta a su contenido (shrink-wrap).
      // El <body> se estira a la altura del iframe, por lo que su scrollHeight no es
      // fiable para medir; un <div> en flujo normal sí reporta la altura real → así
      // html2canvas captura el acta completa (incluidas las secciones G y H).
      const root = iframeDoc.createElement('div');
      root.id = 'acta-capture-root';
      while (iframeDoc.body.firstChild) root.appendChild(iframeDoc.body.firstChild);
      iframeDoc.body.appendChild(root);

      // Normalizar el ancho: el template (export de Google Docs) trae un padding-right
      // enorme (85pt) que deja el contenido pegado a la izquierda. Lo igualamos para que
      // la tabla llene el ancho como en el acta de referencia.
      const capStyle = iframeDoc.createElement('style');
      capStyle.textContent =
        '.c90{max-width:none !important;padding:0 !important;}' +
        'html,body{margin:0 !important;background:#fff !important;}' +
        '#acta-capture-root{width:' + ANCHO_PX + 'px;background:#fff;padding:14pt 12pt;box-sizing:border-box;}';
      iframeDoc.head.appendChild(capStyle);

      // El iframe debe ser más alto que el contenido para que el navegador lo maquete
      // y pinte por completo antes de capturar.
      iframe.style.height = '4000px';
      try { await (iframeDoc as any).fonts?.ready; } catch { /* */ }
      await new Promise((r) => setTimeout(r, 250));

      const html2canvas = (await import('html2canvas-pro')).default;
      const captureW = Math.max(root.scrollWidth, ANCHO_PX);
      const captureH = root.scrollHeight; // altura real del contenido envuelto

      const canvas = await html2canvas(root, {
        backgroundColor: '#ffffff',
        scale: 3, // ~290 DPI sobre Oficio → texto nítido pese a ser raster
        width: captureW,
        height: captureH,
        windowWidth: captureW,
        windowHeight: captureH,
        useCORS: true,
        logging: false,
      });

      const PAGE_W = 215.9, PAGE_H = 355.6; // Oficio (mm)
      // Márgenes que replican el layout de impresión del template (body { margin: 10mm 8mm }).
      const MARGIN_X = 8, MARGIN_TOP = 8, MARGIN_BOTTOM = 8;
      const availW = PAGE_W - 2 * MARGIN_X;
      const availH = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;
      // Ajustar el acta completa a UNA sola página Oficio conservando la proporción
      // (equivale al `zoom: 0.80` que aplicaba la impresión para que entrara en una hoja).
      const ratio = canvas.width / canvas.height;
      let imgW = availW;
      let imgH = imgW / ratio;
      if (imgH > availH) {
        imgH = availH;
        imgW = imgH * ratio;
      }
      const x = (PAGE_W - imgW) / 2;
      const y = MARGIN_TOP;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      await ensurePdfLibs();
      const doc = new JsPDFCtor({ format: [PAGE_W, PAGE_H], unit: 'mm', compress: true });
      doc.addImage(imgData, 'JPEG', x, y, imgW, imgH, undefined, 'FAST');
      return doc.output('blob');
    } finally {
      document.body.removeChild(iframe);
    }
  };

  /**
   * Genera el acta como PDF real y lo descarga directamente al equipo del usuario
   * (sin pasar por el diálogo «Imprimir → Guardar como PDF» del navegador).
   * Devuelve el blob para poder reutilizarlo (p. ej. subirlo a Storage) sin regenerarlo.
   */
  const downloadActaPdf = async (st: AppState = state): Promise<Blob> => {
    const blob = await generateActaBlob(st);
    const cc = st.general.centro_cultivo;
    const [anio = '', mesStr = '', diaStr = ''] =
      st.general.fechas.emision_certificado.split('-');
    const filename = `${cc.codigo_centro}_${diaStr}_${mesStr}_${anio}-ACTA.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Liberar el object URL tras dar tiempo a que el navegador inicie la descarga.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return blob;
  };

  const logEvento = async (
    tipo: EventoUso['tipo'],
    extras?: { codigoCentro?: string; nombreCentro?: string; titular?: string }
  ) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      let sessionEmail: string | null = null;
      try { const s = JSON.parse(localStorage.getItem('certimar-session') ?? '{}'); sessionEmail = s.email ?? null; } catch { /* */ }
      const usuario = user?.email ?? sessionEmail ?? (userRole === 'admin' ? 'admin-pin' : 'lector');
      const payload: Record<string, any> = { tipo, usuario, fecha: serverTimestamp() };
      if (extras?.codigoCentro) payload.codigoCentro = extras.codigoCentro;
      if (extras?.nombreCentro) payload.nombreCentro = extras.nombreCentro;
      if (extras?.titular)      payload.titular      = extras.titular;
      await addDoc(collection(db, 'eventos_uso'), payload);
    } catch { /* silencioso */ }
  };

  const applyOperacionMinima = () => {
    const { talla_pez, t_trabajo_override_min, jaulas_simultaneas, personal_operativo, disponibilidad_base_fd, sistema_principal } = OPERACION_MINIMA_EXTRACTION;
    const idTri = state.denaturation.equipos.id_catalogo_trituradora;
    const batchIndex = idTri ? OPERACION_MINIMA_BATCH_INDEX[idTri] : undefined;

    setState(prev => {
      const next: AppState = {
        ...prev,
        general: { ...prev.general, modo_operacion_minima: true },
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            talla_pez,
            t_trabajo_override_min,
            jaulas_simultaneas,
            personal_operativo,
            disponibilidad_base_fd,
            sistema_principal,
          },
        },
      };

      if (idTri && batchIndex !== undefined) {
        const catTri = CATALOGO_DESNATURALIZACION.trituradoras.find(t => t.id === idTri);
        const batchCfg = catTri?.configuraciones_batch?.[batchIndex];
        if (batchCfg) {
          const useAquainoxPre = idTri === 'aquainox-1430' && prev.denaturation.equipos.cuenta_con_prepicador;
          const cfg = useAquainoxPre
            ? OPERACION_MINIMA_AQUAINOX_PREPICADOR
            : { kilos: batchCfg.kilos, t_proceso: batchCfg.t_proceso, t_pausa: batchCfg.t_pausa };
          next.denaturation = {
            ...prev.denaturation,
            parametros_batch: {
              ...prev.denaturation.parametros_batch,
              kilos_por_batch: cfg.kilos,
              tiempo_procesamiento_min: cfg.t_proceso,
              tiempo_pausa_min: cfg.t_pausa,
            },
          };
        }
      }

      return next;
    });
  };

  const updateHistoricoStatus = async (docId: string, field: string, value: boolean) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await updateDoc(doc(db, 'historico', docId), { [field]: value });
      setHistoricoEntries(prev =>
        prev.map(e => e.id === docId ? { ...e, [field]: value } : e)
      );
    } catch (err) {
      console.error('Error actualizando estado histórico:', err);
    }
  };

  const deleteFromHistorico = async (entry: RegistroHistorico) => {
    if (!window.confirm(
      `¿Eliminar el registro de ${entry.nombreCentro || entry.codigoCentro} (${entry.registroId})?\n\nEsta acción es permanente y no se puede deshacer.`
    )) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await deleteDoc(doc(db, 'historico', entry.id!));
      await deleteDoc(doc(db, 'registros', entry.id!)).catch(() => {});
      setHistoricoEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch (err) {
      console.error('Error eliminando registro del histórico:', err);
      alert('No se pudo eliminar el registro. Verifica tu conexión.');
    }
  };

  const loadFromHistorico = async (entry: RegistroHistorico) => {
    if (!window.confirm(
      `¿Cargar los datos de ${entry.nombreCentro} (${entry.codigoCentro}) en el formulario?\n` +
      'El registro actual se guardará automáticamente como borrador antes de continuar.'
    )) return;

    // Verificar bloqueo antes de abrir
    const lock = await checkLock(entry.id!);
    if (lock) {
      const hora = lock.desde.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      const continuar = window.confirm(
        `⚠️ Este registro está siendo editado por ${lock.email} desde las ${hora}.\n\n` +
        'Si lo abres y guardas, podrías sobreescribir sus cambios.\n\n' +
        '¿Deseas abrirlo de todas formas?'
      );
      if (!continuar) return;
      setBloqueoActivo(lock);
    } else {
      setBloqueoActivo(null);
    }

    // Liberar bloqueo anterior si había un registro abierto
    if (state.docId) await releaseLock(state.docId);
    if (!(await autosaveBeforeSwitch())) return;

    // Limpiar el Registro de Visita del registro anterior antes de cargar el nuevo
    registroVisitaRef.current = null;
    setRegistroVisitaName(null);
    idbDeleteRegistroVisita().catch(() => {});

    logEvento('abrir_registro', { codigoCentro: entry.codigoCentro, nombreCentro: entry.nombreCentro, titular: entry.titular });

    // Primera pasada: cargar snapshot tal como viene (puede tener url vacía en registros antiguos)
    setState({
      ...entry.snapshot,
      extraction: {
        ...entry.snapshot.extraction,
        equipos_extraccion: entry.snapshot.extraction.equipos_extraccion ?? [],
      },
      denaturation: {
        ...entry.snapshot.denaturation,
        generacion_electrica: (entry.snapshot.denaturation.generacion_electrica ?? []).map(
          (gen: any) => gen.catalogoId !== undefined ? gen : { ...gen, catalogoId: inferCatalogoId(gen) }
        ),
      },
      images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
      registroId: entry.registroId,
      docId: entry.id!,
    });
    docIdRef.current = entry.id!;

    // Adquirir bloqueo (incluso si otro lo tiene — el usuario confirmó)
    await acquireLock(entry.id!);

    // Segunda pasada: fusionar URLs del IDB local (cubre registros creados en este dispositivo
    // antes del fix que guarda URLs en Firestore)
    try {
      const urlMap = await idbGetAll();
      if (Object.keys(urlMap).length > 0) {
        setState(prev => ({
          ...prev,
          images: prev.images.map(img => ({
            ...img,
            url: urlMap[img.id] ?? img.url,
            croppedUrl: urlMap[`crop_${img.id}`] ?? img.croppedUrl,
          })),
        }));
      }
    } catch { /* IDB no crítico */ }

    // Auto-cargar el RV guardado en Storage para este registro
    if (entry.documentUrls?.registro_visita) {
      const rvUrl = entry.documentUrls.registro_visita;
      const rvName = `RV-${entry.codigoCentro || entry.registroId}`;
      setRegistroVisitaProcessing(true);
      setRegistroVisitaProgress(0);
      (async () => {
        try {
          const resp = await fetch(rvUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const arrayBuffer = await resp.arrayBuffer();
          const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
          GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
          const pdf = await getDocument({ data: arrayBuffer }).promise;
          const snapshots: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;
            await page.render({ canvasContext: ctx as any, canvas, viewport }).promise;
            snapshots.push(canvas.toDataURL('image/jpeg', 0.80));
            setRegistroVisitaProgress(Math.round((i / pdf.numPages) * 100));
          }
          registroVisitaRef.current = snapshots;
          setRegistroVisitaName(rvName);
          idbSaveRegistroVisita(rvName, snapshots).catch(() => {});
        } catch {
          // RV no disponible — el usuario puede adjuntarlo manualmente
        } finally {
          setRegistroVisitaProcessing(false);
          setRegistroVisitaProgress(0);
        }
      })();
    }

    setActiveTab('general');
  };

  // Exportar borrador como archivo JSON descargable
  const exportDraft = () => {
    const cc = state.general.centro_cultivo;
    const rid = state.registroId ?? 'borrador';
    const code = cc.codigo_centro ? `-${cc.codigo_centro}` : '';
    const filename = `${rid}${code}.json`;
    // URLs son base64 — se exportan completas para preservar imágenes entre sesiones
    const exportState = { ...state, __version: 'v3' };
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (v: unknown): string => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const exportHistoricoCSV = async () => {
    setExportingCSV(true);
    try {
      const { getDocs, query, collection, orderBy } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const snap = await getDocs(query(collection(db, 'historico'), orderBy('__updatedAt', 'desc')));

      const toISO = (ts: any): string => {
        if (!ts) return '';
        if (ts?.toDate) return ts.toDate().toISOString();
        return String(ts);
      };

      const headers = [
        'registroId', 'codigoCentro', 'nombreCentro', 'titular', 'fechaInspeccion',
        'creadoEn', 'ultimaModificacion',
        'esBorrador', 'aprobado', 'firmado', 'enviadoSernapesca', 'clienteNotificado',
        'documentosGenerados',
        'capExtraccion_TN_dia', 'capDesnaturalizacion_TN_dia', 'capAlmacenamiento_TN',
        'cumpleExtraccion', 'cumpleDesnaturalizacion', 'cumpleAlmacenamiento',
        'sistemaExtraccion', 'sistemaDesnaturalizacion',
        'modoOperacionMinima', 'numJaulas', 'jaulasSimultaneas', 'profundidad_m',
      ];

      const rows = snap.docs.map(d => {
        const e = d.data() as RegistroHistorico;
        const m = e.metricas;
        return [
          e.registroId,
          e.codigoCentro,
          e.nombreCentro,
          e.titular,
          e.fechaInspeccion,
          toISO(e.creadoEn),
          toISO(e.__updatedAt),
          e.esBorrador,
          e.aprobado,
          e.firmado,
          e.enviado_sernapesca,
          e.cliente_notificado,
          (e.documentosGenerados ?? []).join(';'),
          m?.capExtraccion,
          m?.capDesnaturalizacion,
          m?.capAlmacenamiento,
          m?.cumpleExtraccion,
          m?.cumpleDesnaturalizacion,
          m?.cumpleAlmacenamiento,
          m?.sistemaExtraccion,
          m?.sistemaDesnaturalizacion,
          m?.modoOperacionMinima,
          m?.numJaulas,
          m?.jaulas_simultaneas,
          m?.profundidad_m,
        ].map(csvEscape).join(',');
      });

      const csv = '﻿' + headers.join(',') + '\r\n' + rows.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico_certimar_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      alert('No se pudo exportar el historial. Verifica tu conexión.');
    } finally {
      setExportingCSV(false);
    }
  };

  // Importar borrador desde archivo JSON
  const importDraftRef = useRef<HTMLInputElement>(null);

  // Registro de Visita PDF — almacenado como snapshots JPEG (comprimidos) por página
  const registroVisitaRef = useRef<string[] | null>(null);
  const [registroVisitaName, setRegistroVisitaName] = useState<string | null>(null);
  const [registroVisitaProcessing, setRegistroVisitaProcessing] = useState(false);
  const [registroVisitaProgress, setRegistroVisitaProgress] = useState(0);
  const registroVisitaInputRef = useRef<HTMLInputElement>(null);

  const handleRegistroVisitaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    e.target.value = '';
    setRegistroVisitaProcessing(true);
    setRegistroVisitaProgress(0);
    // Upload original PDF to Storage if the record already has a doc ID
    const rvDocId = state.docId;
    if (rvDocId) {
      const rvBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      uploadDocToStorage(rvBlob, rvDocId, 'registro_visita').then(url => {
        import('firebase/firestore').then(async ({ doc, updateDoc }) => {
          const { db } = await import('./firebase');
          await updateDoc(doc(db, 'historico', rvDocId), { 'documentUrls.registro_visita': url });
          setHistoricoEntries(prev =>
            prev.map(e => e.id === rvDocId
              ? { ...e, documentUrls: { ...e.documentUrls, registro_visita: url } }
              : e
            )
          );
        });
      }).catch(() => { /* silencioso */ });
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const snapshots: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx as any, canvas, viewport }).promise;
        snapshots.push(canvas.toDataURL('image/jpeg', 0.80));
        setRegistroVisitaProgress(Math.round((i / pdf.numPages) * 100));
      }
      registroVisitaRef.current = snapshots;
      setRegistroVisitaName(file.name);
      // Persistir en IDB para que sobreviva recargas
      idbSaveRegistroVisita(file.name, snapshots).catch(() => { /* quota — no crítico */ });
    } finally {
      setRegistroVisitaProcessing(false);
      setRegistroVisitaProgress(0);
    }
  };
  const importDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.__version !== 'v3') {
          alert('Versión de borrador incompatible. Solo se pueden cargar borradores exportados con la versión actual de la aplicación.');
          return;
        }
        // Guardar URLs de imágenes en IndexedDB y limpiarlas del estado
        await idbClear();
        const images: ReportImage[] = (parsed.images ?? []).map((img: any) => {
          if (img.url && img.url.startsWith('data:')) {
            idbSave(img.id, img.url); // async, no bloqueante
          }
          return { ...img, url: img.url?.startsWith('data:') ? img.url : '' };
        });
        setState({ ...parsed, images });
        setActiveTab('general');
      } catch {
        alert('Archivo inválido. Selecciona un borrador exportado por esta aplicación.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadTestData = () => {
    const TEST_STATE: AppState = {
      general: {
        certificador: {
          nombre: 'ENGELBERT FLORES',
          rut: '13.968.696-9',
          numero_registro: 'DN-02727-2023',
        },
        centro_cultivo: {
          codigo_centro: '110814',
          nombre_centro: 'PAMELA',
          titular: 'EXPORTADORA LOS FIORDOS LTDA.',
          acs: '24',
          ubicacion: 'CANAL MORALEDA, AL ESTE DE ISLA AUCHILE, Región de Aysén del General Carlos Ibáñez del Campo',
          formato_modulo: '24 jaulas, tipo Metálicas',
          tamano_jaulas: '30 x 30 metros',
          coordenadas_ensilaje: '45°27\'S 72°51\'W',
          nombre_an_ensilaje: 'A/N PAMELA',
        },
        fechas: {
          evaluacion_documental: '2026-01-02',
          inspeccion_terreno: '2026-01-08',
          emision_certificado: '2026-02-10',
        },
        observaciones_acta: '',
      },
      extraction: {
        sistemas_apoyo: { buceo: false, rov: false, succion_yoma: false, automatica: false },
        parametros: {
          numero_total_jaulas: 24,
          jaulas_simultaneas: 3,
          horas_efectivas_trabajo: 9,
          personal_operativo: 4,
          profundidad_operacion_m: 20,
          sistema_principal: 'LIFT-UP',
          talla_pez: 'Grande (>=4.5kg)',
          factor_ajuste_biomasa: 1.0,
          marca_equipo: 'Novatech 10"',
          id_catalogo_equipo: 'novatech-10',
          tipo_compresor: 'Kaeser M50E',
          id_catalogo_compresor: 'kaeser-m50e',
          potencia_cfm: 185,
          capacidad_receptor_bins_litros: 500,
          disponibilidad_base_fd: 0.90,
          motocompresores_por_jaula: 1,
          ubicacion_compresor: 'A/N Pontón',
          observacion_sistema: 'Sistema Automático; Consta de 24 Lift-up / 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla.',
        },
        resultados: { ciclos_por_dia: 0, capacidad_diaria_ton: 0, cumple_norma: false },
        equipos_extraccion: [],
      },
      denaturation: {
        equipos: {
          cantidad_sistemas: 1,
          cantidad_ollas: 1,
          id_catalogo_trituradora: 'acuimaster-ac715',
          id_catalogo_incinerador: '',
          marca_modelo: 'ACUIMASTER AC-715 LT',
          velocidad_nominal_kg_hr: 1500,
          horas_funcionamiento_dia: 9,
          cuenta_con_prepicador: false,
          marca_modelo_prepicador: "",
          cantidad_prepicador: 1,
          capacidad_prepicador_kg_hr: 0,
          factor_eficiencia_prepicador: 0.70,
          cuenta_con_recirculacion_acido: true,
          material_construccion: 'Acero inoxidable AISI 304',
          tipo_sistema: 'Ensilaje',
          estado_olla: 'Bueno' as const,
        },
        parametros_batch: { kilos_por_batch: 700, tiempo_procesamiento_min: 15, tiempo_pausa_min: 10 },
        parametros_incineracion: { capacidad_carga_kg_h: 0, temperatura_operacion: '', camara_primaria: '', camara_secundaria: '' },
        incinerador: {
          activo: false,
          id_catalogo: '',
          marca_modelo: '',
          capacidad_carga_kg_h: 0,
          horas_funcionamiento_dia: 8,
          num_quemadores_primaria: 0,
          num_quemadores_secundaria: 0,
          temperatura_camara_primaria_c: 0,
          temperatura_camara_secundaria_c: 0,
          requerimiento_energetico: '',
          sistema_carga: 'N/A',
          sistema_descarga: 'N/A',
          disposicion_final: 'N/A',
          almacenamiento_gas: 'N/A',
          observaciones: 'INCINERADOR ES EL SISTEMA SECUNDARIO DE DESNATURALIZACIÓN DEL CENTRO DE CULTIVO.',
        },
        generacion_electrica: [],
        resultados: { duracion_total_batch_min: 0, numero_batches_dia: 0, capacidad_ensilaje_ton: 0, capacidad_incinerador_ton: 0, capacidad_diaria_ton: 0, cumple_norma: false, observacion_automatica: '' },
      },
      storage: {
        parametros: { capacidad_almacenaje_m3: 21, factor_densidad: 1.2, observaciones: 'Estanque de acero inoxidable con dique de contención.' },
        infraestructura: {
          pretil_material: 'Hormigón',
          pretil_estado: 'Bueno',
          piping_material: 'HDPE',
          piping_diametro: '2"',
          piping_valvulas: 'Válvula de bola DN50',
          piping_estado: 'Bueno',
          eslora_m: '25',
          manga_m: '8',
          puntual_m: '1.2',
        },
        resultados: { capacidad_almacenaje_ton: 0, cumple_norma: false },
      },
      images: [],
    };
    const hasData = state.general.centro_cultivo.codigo_centro || state.general.centro_cultivo.nombre_centro;
    if (hasData && !window.confirm('¿Cargar datos de prueba?\nSe sobrescribirán los datos actuales.')) return;
    setState(TEST_STATE);
    setActiveTab('general');
  };
  const centerCodeRef = useRef<HTMLInputElement>(null);
  const SESSION_KEY = 'certimar-session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

  const readSession = (): { role: 'admin' | 'editor' | 'reader'; email?: string; expiry: number } | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s?.role || !s?.expiry || Date.now() > s.expiry) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch { return null; }
  };

  const savedSession = readSession();
  const [showWelcome, setShowWelcome] = useState(!savedSession);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'reader' | null>(savedSession?.role ?? null);
  const [loginAquaPhase, setLoginAquaPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');
  const [wasLoggedOut, setWasLoggedOut] = useState(false);

  const CHANGELOG_VERSION = '2026-06-22-v1';
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogStep, setChangelogStep] = useState(0);
  const [pendingGenerate, setPendingGenerate] = useState<'certificado' | 'informe' | null>(null);
  useEffect(() => {
    if (!pendingGenerate) return;
    const tipo = pendingGenerate;
    setPendingGenerate(null);
    if (tipo === 'certificado') generateCertificadoPDF();
    else if (tipo === 'informe') generateInformePDF();
  }, [pendingGenerate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!savedSession) return;
    // Opt-out permanente: si el usuario eligió "No volver a mostrar", no se muestra nunca más.
    if (localStorage.getItem('certimar-changelog-never') === 'true') return;
    const seen = localStorage.getItem('certimar-changelog-seen');
    if (seen !== CHANGELOG_VERSION) { setShowChangelog(true); setChangelogStep(0); }
  }, []);
  const isAdmin  = userRole === 'admin';
  const isEditor = userRole === 'editor';
  const sessionEmail = (savedSession as any)?.email ?? '';
  const canExportCSV = ['operaciones@certimar.cl', 'eflores@certimar.cl'].includes(sessionEmail);
  // Colapsado del sidebar: preferencia solo de escritorio (en móvil se usa el drawer)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Drawer del sidebar en móvil (off-canvas)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useEffect(() => { setMobileSidebarOpen(false); }, [activeTab]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [tema, setTema] = useState<{ logo: 'certimar' | 'engelbert'; palette: 'certimar' | 'engelbert' }>(() => {
    try {
      const raw = localStorage.getItem('certimar-tema');
      if (raw) {
        // Migrar formato anterior (string simple) al nuevo formato objeto
        if (raw === '"certimar"' || raw === 'certimar') return { logo: 'certimar', palette: 'certimar' };
        if (raw === '"engelbert"' || raw === 'engelbert') return { logo: 'engelbert', palette: 'engelbert' };
        const parsed = JSON.parse(raw);
        if (parsed?.logo && parsed?.palette) return parsed;
      }
    } catch {}
    return { logo: 'certimar', palette: 'certimar' };
  });
  useEffect(() => { localStorage.setItem('certimar-tema', JSON.stringify(tema)); }, [tema]);

  // ── Logos de empresas clientes (Firebase Storage) ──
  const [logosEmpresas, setLogosEmpresas] = useState<Record<string, string>>({});
  const [logoClienteUrl, setLogoClienteUrl] = useState<string | null>(null);
  const [logoManualOverride, setLogoManualOverride] = useState(false);
  const logoRestoredRef = React.useRef(false);
  const [renamingLogo, setRenamingLogo] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // fullPath real en Firebase Storage para cada logo (clave = displayName)
  const [logosStoragePaths, setLogosStoragePaths] = useState<Record<string, string>>({});
  // Logos marcados para la portada (persiste en localStorage)
  const [logosPortada, setLogosPortada] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('certimar-logos-portada') ?? '[]')); } catch { return new Set(); }
  });
  useEffect(() => {
    localStorage.setItem('certimar-logos-portada', JSON.stringify([...logosPortada]));
  }, [logosPortada]);
  const toggleLogoPortada = (name: string) =>
    setLogosPortada(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });

  const [datosPrueba, setDatosPrueba] = useState(false);

  const DATOS_PRUEBA_STATE: Partial<AppState> = {
    general: {
      certificador: { nombre: 'ENGELBERT ALEXANDER FLORES CARRIO', rut: '13.968.696-9', numero_registro: 'DN-02727/2023' },
      centro_cultivo: {
        codigo_centro: '120160200326MOR', nombre_centro: 'STAINES 1', titular: 'AQUACHILE S.A.',
        acs: '42', ubicacion: 'NORTE DE PENÍNSULA STAINES, SECTOR 1, Región de Magallanes',
        formato_modulo: '2 MODULOS CUADRADOS 40X40 - 12 JAULAS POR MODULO',
        tamano_jaulas: '40 x 40 metros', coordenadas_ensilaje: '51° 23\' 02" S 73° 50\' 24" O',
        nombre_an_ensilaje: 'A/N AQUACHILE 308',
      },
      fechas: {
        evaluacion_documental: new Date().toISOString().split('T')[0],
        inspeccion_terreno: new Date().toISOString().split('T')[0],
        emision_certificado: new Date().toISOString().split('T')[0],
      },
      observaciones_acta: '',
    },
  };

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-dark-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [showHints, setShowHints] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-show-hints');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [wavesOpacity, setWavesOpacity] = useState(() => {
    const saved = localStorage.getItem('certimar-waves-opacity');
    return saved ? parseFloat(saved) : 0.05;
  });
  useEffect(() => { localStorage.setItem('certimar-waves-opacity', String(wavesOpacity)); }, [wavesOpacity]);

  const [logoPortadaOpacity, setLogoPortadaOpacity] = useState(() => {
    const saved = localStorage.getItem('certimar-logo-portada-opacity');
    return saved ? parseFloat(saved) : 0.4;
  });
  useEffect(() => { localStorage.setItem('certimar-logo-portada-opacity', String(logoPortadaOpacity)); }, [logoPortadaOpacity]);

  // ── Posición y tamaño del logo de marca en portada ──
  const [logoMarcaX, setLogoMarcaX] = useState(() => parseFloat(localStorage.getItem('certimar-logo-marca-x') ?? '21'));
  const [logoMarcaY, setLogoMarcaY] = useState(() => parseFloat(localStorage.getItem('certimar-logo-marca-y') ?? '5'));
  const [logoMarcaW, setLogoMarcaW] = useState(() => parseFloat(localStorage.getItem('certimar-logo-marca-w') ?? '20'));
  useEffect(() => { localStorage.setItem('certimar-logo-marca-x', String(logoMarcaX)); }, [logoMarcaX]);
  useEffect(() => { localStorage.setItem('certimar-logo-marca-y', String(logoMarcaY)); }, [logoMarcaY]);
  useEffect(() => { localStorage.setItem('certimar-logo-marca-w', String(logoMarcaW)); }, [logoMarcaW]);

  // ── Posición, tamaño y rotación del watermark logo en portada ──
  const [logoWmX, setLogoWmX] = useState(() => parseFloat(localStorage.getItem('certimar-logo-wm-x') ?? '183'));
  const [logoWmY, setLogoWmY] = useState(() => parseFloat(localStorage.getItem('certimar-logo-wm-y') ?? '59'));
  const [logoWmW, setLogoWmW] = useState(() => parseFloat(localStorage.getItem('certimar-logo-wm-w') ?? '31'));
  const [logoWmRotation, setLogoWmRotation] = useState(() => parseFloat(localStorage.getItem('certimar-logo-wm-rot') ?? '-90'));
  useEffect(() => { localStorage.setItem('certimar-logo-wm-x', String(logoWmX)); }, [logoWmX]);
  useEffect(() => { localStorage.setItem('certimar-logo-wm-y', String(logoWmY)); }, [logoWmY]);
  useEffect(() => { localStorage.setItem('certimar-logo-wm-w', String(logoWmW)); }, [logoWmW]);
  useEffect(() => { localStorage.setItem('certimar-logo-wm-rot', String(logoWmRotation)); }, [logoWmRotation]);

  // Cargar portada_settings desde Firestore al iniciar sesión
  useEffect(() => {
    if (!userRole) return;
    import('firebase/firestore').then(async ({ doc, getDoc }) => {
      const { db } = await import('./firebase');
      const snap = await getDoc(doc(db, 'config', 'portada_settings'));
      if (!snap.exists()) return;
      const d = snap.data();
      if (typeof d.logoPortadaOpacity === 'number') setLogoPortadaOpacity(d.logoPortadaOpacity);
      if (typeof d.logoMarcaX === 'number') setLogoMarcaX(d.logoMarcaX);
      if (typeof d.logoMarcaY === 'number') setLogoMarcaY(d.logoMarcaY);
      if (typeof d.logoMarcaW === 'number') setLogoMarcaW(d.logoMarcaW);
      if (typeof d.logoWmX === 'number') setLogoWmX(d.logoWmX);
      if (typeof d.logoWmY === 'number') setLogoWmY(d.logoWmY);
      if (typeof d.logoWmW === 'number') setLogoWmW(d.logoWmW);
      if (typeof d.logoWmRotation === 'number') setLogoWmRotation(d.logoWmRotation);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const saveLogoPortadaOpacity = async (value: number) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'config', 'portada_settings'), { logoPortadaOpacity: value }, { merge: true });
    } catch { /* falla silenciosa */ }
  };

  const saveLogoMarcaSettings = async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'config', 'portada_settings'),
        { logoMarcaX, logoMarcaY, logoMarcaW }, { merge: true });
    } catch { /* falla silenciosa */ }
  };

  const saveLogoWmSettings = async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'config', 'portada_settings'),
        { logoWmX, logoWmY, logoWmW, logoWmRotation }, { merge: true });
    } catch { /* falla silenciosa */ }
  };

  // Guardar selección de logo cliente en Firestore (por nombre, no URL)
  const saveLogoClienteSettings = async (logoName: string | null, manualOverride: boolean) => {
    if (!userRole) return;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'config', 'portada_settings'),
        { logoClienteNombre: logoName ?? null, logoManualOverride: manualOverride },
        { merge: true });
    } catch { /* falla silenciosa */ }
  };

  // Restaurar selección de logo cliente desde Firestore (una sola vez, cuando logosEmpresas esté listo)
  useEffect(() => {
    if (!userRole || Object.keys(logosEmpresas).length === 0 || logoRestoredRef.current) return;
    logoRestoredRef.current = true;
    import('firebase/firestore').then(async ({ doc, getDoc }) => {
      const { db } = await import('./firebase');
      const snap = await getDoc(doc(db, 'config', 'portada_settings'));
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.logoManualOverride === true) {
        setLogoManualOverride(true);
        const nombre = data.logoClienteNombre;
        setLogoClienteUrl(nombre && logosEmpresas[nombre] ? logosEmpresas[nombre] : null);
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, logosEmpresas]);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [subjectCopied, setSubjectCopied] = useState(false);

  // Registra evento de login/acceso cada vez que el usuario inicia sesión
  useEffect(() => {
    if (userRole) logEvento('login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('certimar-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('certimar-show-hints', JSON.stringify(showHints));
  }, [showHints]);

  useEffect(() => {
    if (!showWelcome && centerCodeRef.current) {
      centerCodeRef.current.focus();
    }
  }, [showWelcome]);

  // Carga el histórico cuando el usuario activa la pestaña.
  // Se usa getDocs sin orderBy para incluir registros que no tengan __updatedAt
  // (Firestore excluye silenciosamente esos docs cuando se usa orderBy en el campo).
  // El ordenamiento se hace en cliente por __updatedAt → creadoEn → '' desc.
  useEffect(() => {
    if (activeTab !== 'history') return;
    logEvento('ver_historico');
    setHistoricoLoading(true);
    import('firebase/firestore').then(async ({ collection, getDocs }) => {
      const { db } = await import('./firebase');
      const snap = await getDocs(collection(db, 'historico'));
      const entries = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RegistroHistorico, 'id'>) }));
      const toMs = (ts: any): number => {
        if (!ts) return 0;
        if (ts?.toDate) return ts.toDate().getTime();
        if (ts?.seconds) return ts.seconds * 1000;
        return 0;
      };
      entries.sort((a, b) => {
        const ta = toMs((a as any).__updatedAt) || toMs((a as any).creadoEn);
        const tb = toMs((b as any).__updatedAt) || toMs((b as any).creadoEn);
        return tb - ta;
      });
      setHistoricoEntries(entries);
    }).catch(console.error).finally(() => setHistoricoLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Cargar catálogo personalizado desde Firestore (todos los usuarios autenticados)
  useEffect(() => {
    if (!userRole) return;
    import('firebase/firestore').then(async ({ collection, getDocs }) => {
      const { db } = await import('./firebase');
      const snap = await getDocs(collection(db, 'catalogo_custom'));
      setCatalogoCustom(snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogoCustomEntry)));
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // Cargar logos de empresas clientes desde Firebase Storage
  useEffect(() => {
    if (!userRole) return;
    import('firebase/storage').then(async ({ ref, listAll, getDownloadURL }) => {
      const { storage } = await import('./firebase');
      const listRef = ref(storage, 'logos-empresas/');
      const result = await listAll(listRef).catch(() => null);
      if (!result) return;
      const entries = await Promise.all(
        result.items.map(async item => {
          const url = await getDownloadURL(item).catch(() => null);
          const name = decodeURIComponent(item.name).replace(/\.[^.]+$/, '').replace(/-/g, ' ').toUpperCase();
          return url ? { name, url, path: item.fullPath } : null;
        })
      );
      const valid = entries.filter(Boolean) as { name: string; url: string; path: string }[];
      setLogosEmpresas(Object.fromEntries(valid.map(e => [e.name, e.url])));
      setLogosStoragePaths(Object.fromEntries(valid.map(e => [e.name, e.path])));
    }).catch(console.error);
  }, [userRole]);

  // Auto-seleccionar logo del cliente según el titular (solo si el usuario no ha elegido manualmente)
  useEffect(() => {
    if (logoManualOverride) return;
    if (!Object.keys(logosEmpresas).length) return;
    const titular = state.general.centro_cultivo.titular.toUpperCase().trim();
    if (!titular) { setLogoClienteUrl(null); return; }
    const match = Object.keys(logosEmpresas).find(k =>
      titular.includes(k) || k.includes(titular.split(' ')[0])
    );
    setLogoClienteUrl(match ? logosEmpresas[match] : null);
  }, [state.general.centro_cultivo.titular, logosEmpresas, logoManualOverride]);

  // Catálogo de leyendas guardadas en Firestore: { seccion -> string[] }
  const [leyendasExtra, setLeyendasExtra] = useState<Partial<Record<ImageSeccion, string[]>>>({});

  // Cargar leyendas guardadas desde Firestore (disponibles para todos los usuarios autenticados)
  useEffect(() => {
    if (!userRole) return;
    import('firebase/firestore').then(async ({ doc, getDoc }) => {
      const { db } = await import('./firebase');
      const snap = await getDoc(doc(db, 'config', 'leyendas_sugeridas'));
      if (snap.exists()) setLeyendasExtra(snap.data() as Partial<Record<ImageSeccion, string[]>>);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  /** Guarda una leyenda nueva en Firestore (sólo si no existe ya en el catálogo local) */
  const saveNewLeyenda = useCallback(async (leyenda: string, seccion: ImageSeccion) => {
    const current = leyendasExtra[seccion] ?? [];
    // Verificar si ya está en el catálogo estático o en el guardado
    const staticList = CATALOGO_FOTOS[seccion] ?? [];
    if (current.includes(leyenda) || staticList.includes(leyenda)) return;
    // Actualizar estado local de inmediato
    setLeyendasExtra(prev => ({ ...prev, [seccion]: [...(prev[seccion] ?? []), leyenda] }));
    // Persistir en Firestore usando arrayUnion para evitar duplicados concurrentes
    try {
      const { doc, setDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'config', 'leyendas_sugeridas'), { [seccion]: arrayUnion(leyenda) }, { merge: true });
    } catch (err) {
      console.error('Error guardando leyenda:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leyendasExtra]);

  // Detecta si el centro seleccionado es de operación mínima
  const centroOperacionMinima = useMemo(() =>
    CATALOGO_CENTROS.find(c => c.codigo === state.general.centro_cultivo.codigo_centro && c.operacion_minima) ?? null,
    [state.general.centro_cultivo.codigo_centro]
  );

  // Construye la glosa de observación de sistema según los sistemas de apoyo actuales
  const buildObservacionSistema = useCallback(() => {
    const { numero_total_jaulas, marca_equipo, sistema_principal } = state.extraction.parametros;
    const { automatica, rov, buceo } = state.extraction.sistemas_apoyo;
    const nombreCentro = state.general.centro_cultivo.nombre_centro;
    const modoMinima = state.general.modo_operacion_minima ?? false;
    const nroJaulas = numero_total_jaulas.toString();
    const lineaExt = marca_equipo || sistema_principal;

    if (modoMinima) {
      return `Extracción por R.O.V.; Extracción del centro ${nombreCentro} se realiza mediante equipo de robótica submarina (ROV), apoyado directamente con embarcación de apoyo.`;
    } else if (buceo && rov && automatica) {
      return `Sistema Automático con apoyo de Buceo y R.O.V.; Extracción del centro ${nombreCentro} consta de ${nroJaulas} Lift-up/${lineaExt}, 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla. La extracción submarina es apoyada con equipos de buceo semiautónomo y equipo de robótica submarina (ROV).`;
    } else if (rov && automatica) {
      return `Sistema Automático con apoyo R.O.V.; Extracción del centro ${nombreCentro} consta de ${nroJaulas} Lift-up/${lineaExt}, 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla. La extracción submarina es apoyada con equipo de robótica submarina semiautónoma (ROV).`;
    } else if (buceo && rov) {
      return `Extracción por Buceo y R.O.V.; Extracción del centro ${nombreCentro} se realiza mediante equipos de buceo semiautónomo y equipo de robótica submarina (ROV), apoyados directamente con embarcación de apoyo.`;
    } else if (buceo && automatica) {
      return `Sistema Automático con apoyo de Buceo; Extracción del centro ${nombreCentro} consta de ${nroJaulas} Lift-up/${lineaExt}, 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla. La extracción submarina es apoyada con equipos de buceo semiautónomo.`;
    } else if (automatica) {
      return `Sistema Automático; Consta de ${nroJaulas} Lift-up/ ${lineaExt}, 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla.`;
    } else if (buceo) {
      return `Extracción por Buceo; Extracción del centro ${nombreCentro} se realiza mediante equipos de buceo semiautónomo, apoyados directamente con embarcación de apoyo.`;
    } else {
      return `Extracción por R.O.V.; Extracción del centro ${nombreCentro} se realiza mediante equipo de robótica submarina (ROV), apoyado directamente con embarcación de apoyo.`;
    }
  }, [
    state.general.centro_cultivo.nombre_centro,
    state.extraction.parametros.sistema_principal,
    state.extraction.parametros.marca_equipo,
    state.extraction.parametros.numero_total_jaulas,
    state.extraction.sistemas_apoyo.automatica,
    state.extraction.sistemas_apoyo.rov,
    state.extraction.sistemas_apoyo.buceo,
    state.general.modo_operacion_minima,
  ]);

  // Auto-genera la observación cuando cambia sistema/apoyos, solo si el texto es auto-generado (no editado)
  useEffect(() => {
    const obs = state.extraction.parametros.observacion_sistema;
    const isDefault = !obs
      || /^Sistema Automático/.test(obs)
      || /^Extracción por (R\.O\.V\.|Buceo)/.test(obs);
    if (isDefault) {
      const autoObs = buildObservacionSistema();
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: { ...prev.extraction.parametros, observacion_sistema: autoObs }
        }
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildObservacionSistema]);

  const normalizeCampo = (v: string) => v.toUpperCase().trim().replace(/\s+/g, '_');

  const [normalizandoHistorico, setNormalizandoHistorico] = useState<'idle' | 'running' | 'done'>('idle');
  const [recuperandoRegistros, setRecuperandoRegistros] = useState<'idle' | 'running' | 'done'>('idle');
  const [registrosHuerfanos, setRegistrosHuerfanos] = useState<Array<{id: string; codigo: string; nombre: string; fecha: string; snapshot: any}>>([]);

  const verificarRegistrosHuerfanos = async () => {
    setRecuperandoRegistros('running');
    setRegistrosHuerfanos([]);
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const [regSnap, histSnap] = await Promise.all([
        getDocs(collection(db, 'registros')),
        getDocs(collection(db, 'historico')),
      ]);
      const histIds = new Set(histSnap.docs.map(d => d.id));
      const huerfanos = regSnap.docs
        .filter(d => !histIds.has(d.id))
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            codigo: (data.general?.centro_cultivo?.codigo_centro ?? '') as string,
            nombre: (data.general?.centro_cultivo?.nombre_centro ?? '') as string,
            fecha: (data.general?.fechas?.inspeccion_terreno ?? '') as string,
            snapshot: data,
          };
        })
        .filter(e => e.codigo || e.nombre);
      setRegistrosHuerfanos(huerfanos);
      setRecuperandoRegistros('done');
    } catch (err) {
      console.error('Error verificando registros huérfanos:', err);
      alert('No se pudo verificar los registros. Verifica tu conexión.');
      setRecuperandoRegistros('idle');
    }
  };

  const recuperarRegistroAHistorico = async (huerfano: {id: string; codigo: string; nombre: string; fecha: string; snapshot: any}) => {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const snap = huerfano.snapshot;
      const cc = snap.general?.centro_cultivo ?? {};
      await setDoc(doc(db, 'historico', huerfano.id), {
        registroId: huerfano.id,
        codigoCentro: cc.codigo_centro ?? '',
        nombreCentro: cc.nombre_centro ?? '',
        titular: cc.titular ?? '',
        fechaInspeccion: snap.general?.fechas?.inspeccion_terreno ?? '',
        esBorrador: true,
        documentosGenerados: [],
        snapshot: JSON.parse(JSON.stringify(snap)),
        metricas: {
          capExtraccion: 0, capDesnaturalizacion: 0, capAlmacenamiento: 0,
          cumpleExtraccion: false, cumpleDesnaturalizacion: false, cumpleAlmacenamiento: false,
          sistemaExtraccion: snap.extraction?.parametros?.sistema_principal ?? '',
          sistemaDesnaturalizacion: snap.denaturation?.equipos?.tipo_sistema ?? '',
          modoOperacionMinima: snap.general?.modo_operacion_minima ?? false,
          numJaulas: snap.extraction?.parametros?.numero_total_jaulas ?? 0,
          jaulas_simultaneas: snap.extraction?.parametros?.jaulas_simultaneas ?? 0,
          profundidad_m: snap.extraction?.parametros?.profundidad_operacion_m ?? 0,
        },
        creadoEn: serverTimestamp(),
        __updatedAt: serverTimestamp(),
      });
      setRegistrosHuerfanos(prev => prev.filter(e => e.id !== huerfano.id));
      setHistoricoEntries(prev => [{
        id: huerfano.id,
        registroId: huerfano.id,
        codigoCentro: cc.codigo_centro ?? '',
        nombreCentro: cc.nombre_centro ?? '',
        titular: cc.titular ?? '',
        fechaInspeccion: snap.general?.fechas?.inspeccion_terreno ?? '',
        esBorrador: true,
        documentosGenerados: [],
        snapshot: snap,
      }, ...prev]);
      alert(`Registro ${huerfano.id} (${huerfano.nombre || huerfano.codigo}) recuperado al histórico como borrador.`);
    } catch (err) {
      console.error('Error recuperando registro:', err);
      alert('No se pudo recuperar el registro. Ver consola para detalles.');
    }
  };

  const normalizarHistorico = async () => {
    if (!window.confirm('¿Normalizar todos los registros del histórico?\nSe aplicará MAYÚSCULAS + espacios→_ a codigoCentro, nombreCentro y titular en Firestore.')) return;
    setNormalizandoHistorico('running');
    try {
      const { collection, getDocs, doc, writeBatch, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const snap = await getDocs(collection(db, 'historico'));
      const batch = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        const codigoCentro  = normalizeCampo(data.codigoCentro  ?? '');
        const nombreCentro  = normalizeCampo(data.nombreCentro  ?? '');
        const titular       = normalizeCampo(data.titular       ?? '');
        const needsNorm     = codigoCentro !== data.codigoCentro || nombreCentro !== data.nombreCentro || titular !== data.titular;
        const needsTs       = !data.__updatedAt;
        if (needsNorm || needsTs) {
          const patch: Record<string, any> = { codigoCentro, nombreCentro, titular };
          if (needsTs) patch.__updatedAt = serverTimestamp();
          batch.update(doc(db, 'historico', d.id), patch);
          count++;
        }
      });
      if (count > 0) await batch.commit();
      setHistoricoEntries(prev => prev.map(e => ({
        ...e,
        codigoCentro: normalizeCampo(e.codigoCentro ?? ''),
        nombreCentro: normalizeCampo(e.nombreCentro ?? ''),
        titular:      normalizeCampo(e.titular      ?? ''),
      })));
      setNormalizandoHistorico('done');
      setTimeout(() => setNormalizandoHistorico('idle'), 3000);
    } catch (err) {
      console.error('Error normalizando histórico:', err);
      alert('No se pudo completar la normalización. Verifica tu conexión.');
      setNormalizandoHistorico('idle');
    }
  };

  const handleCenterCodeChange = (code: string, center?: ConcesionCentro) => {
    if (center) {
      // center.nombre = descripción geográfica del sector (ej. "CANAL MORALEDA, AL ESTE DE ISLA AUCHILE")
      // La ubicación completa = sector + región oficial según prefijo de código
      const region = center.codigo.startsWith('120')
        ? 'Región de Magallanes y de la Antártica Chilena'
        : 'Región de Aysén del General Carlos Ibáñez del Campo';
      const ubicacionCompleta = `${center.nombre}, ${region}`;
      setState(prev => ({
        ...prev,
        general: {
          ...prev.general,
          centro_cultivo: {
            ...prev.general.centro_cultivo,
            codigo_centro: normalizeCampo(center.codigo),
            nombre_centro: normalizeCampo(center.nombre_centro ?? ""),
            titular: normalizeCampo(center.titular),
            acs: center.acs,
            ubicacion: ubicacionCompleta
          }
        }
      }));
    } else {
      updateGeneral('centro_cultivo.codigo_centro', normalizeCampo(code));
    }
  };

  // --- Calculations ---
  // Las fórmulas están en src/domain/calculations.ts (funciones puras testeables).
  // Res. Exenta N°1511/2021 — Umbrales: Extracción ≥15 TN/día, Desnaturalización ≥15 TN/día, Almacenamiento ≥20 TN.

  const calculatedExtraction = useMemo(
    () => state.general.modo_operacion_minima
      ? { ciclos_por_dia: 0, capacidad_diaria_ton: 15, cumple_norma: true }
      : calculateExtraction(state.extraction.parametros),
    [state.extraction.parametros, state.general.modo_operacion_minima]
  );

  const calculatedDenaturation = useMemo(
    () => calculateDenaturation(
      state.denaturation.equipos,
      state.denaturation.parametros_batch,
      state.denaturation.parametros_incineracion,
      state.denaturation.incinerador
    ),
    [state.denaturation.equipos, state.denaturation.parametros_batch, state.denaturation.parametros_incineracion, state.denaturation.incinerador]
  );

  const calculatedStorage = useMemo(
    () => calculateStorage(state.storage.parametros),
    [state.storage.parametros]
  );

  // Sync results to state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      extraction: { ...prev.extraction, resultados: calculatedExtraction },
      denaturation: { ...prev.denaturation, resultados: calculatedDenaturation },
      storage: { ...prev.storage, resultados: calculatedStorage }
    }));
  }, [calculatedExtraction, calculatedDenaturation, calculatedStorage]);

  // ── Checklist unificado — items requeridos bloquean la generación ──
  const checklistItems = useMemo(() => {
    const g    = state.general;
    const cc   = g.centro_cultivo;
    const cert = g.certificador;
    const imgs = state.images;
    const ext  = state.extraction.parametros;
    const den  = state.denaturation.equipos;
    const sto  = state.storage.parametros;
    const ordenFechas = validarOrdenFechas(g.fechas);
    return [
      // ─ General — Centro ─
      { id: 'codigo',         tab: 'general' as const, grupo: 'Centro',       label: 'Código de centro',                detail: cc.codigo_centro         || 'Sin ingresar', ok: !!cc.codigo_centro.trim(),         required: true  },
      { id: 'nombre',         tab: 'general' as const, grupo: 'Centro',       label: 'Nombre del centro',               detail: cc.nombre_centro         || 'Sin ingresar', ok: !!cc.nombre_centro.trim(),         required: true  },
      { id: 'titular',        tab: 'general' as const, grupo: 'Centro',       label: 'Titular / empresa',               detail: cc.titular               || 'Sin ingresar', ok: !!cc.titular.trim(),               required: true  },
      { id: 'acs',            tab: 'general' as const, grupo: 'Centro',       label: 'A.C.S',                           detail: cc.acs                   || 'Sin ingresar', ok: !!cc.acs.trim(),                   required: true  },
      { id: 'ubicacion',      tab: 'general' as const, grupo: 'Centro',       label: 'Ubicación',                       detail: cc.ubicacion             || 'Sin ingresar', ok: !!cc.ubicacion.trim(),             required: true  },
      { id: 'nombre_an',      tab: 'general' as const, grupo: 'Centro',       label: 'Nombre A/N Ensilaje',             detail: cc.nombre_an_ensilaje    || 'Sin ingresar', ok: !!cc.nombre_an_ensilaje.trim(),    required: true  },
      { id: 'formato_modulo', tab: 'general' as const, grupo: 'Centro',       label: 'Formato del módulo',              detail: cc.formato_modulo        || 'Sin ingresar', ok: !!cc.formato_modulo.trim(),        required: false },
      { id: 'tamano_jaulas',  tab: 'general' as const, grupo: 'Centro',       label: 'Tamaño de jaulas',                detail: cc.tamano_jaulas         || 'Sin ingresar', ok: !!cc.tamano_jaulas.trim(),         required: false },
      { id: 'coordenadas',    tab: 'general' as const, grupo: 'Centro',       label: 'Coordenadas ensilaje',            detail: cc.coordenadas_ensilaje  || 'Sin ingresar', ok: !!cc.coordenadas_ensilaje.trim(),  required: false },
      // ─ General — Certificador ─
      { id: 'cert_nom',       tab: 'general' as const, grupo: 'Certificador', label: 'Nombre certificador',             detail: cert.nombre              || 'Sin ingresar', ok: !!cert.nombre.trim(),              required: true  },
      { id: 'cert_rut',       tab: 'general' as const, grupo: 'Certificador', label: 'RUT certificador',                detail: cert.rut                 || 'Sin ingresar', ok: !!cert.rut.trim(),                 required: true  },
      { id: 'cert_reg',       tab: 'general' as const, grupo: 'Certificador', label: 'N° registro',                     detail: cert.numero_registro     || 'Sin ingresar', ok: !!cert.numero_registro.trim(),     required: true  },
      // ─ General — Fechas ─
      { id: 'fecha_eval',     tab: 'general' as const, grupo: 'Fechas',       label: 'Fecha evaluación documental',     detail: g.fechas.evaluacion_documental || 'Sin ingresar', ok: !!g.fechas.evaluacion_documental, required: true },
      { id: 'fecha_inspec',   tab: 'general' as const, grupo: 'Fechas',       label: 'Fecha inspección terreno',        detail: g.fechas.inspeccion_terreno    || 'Sin ingresar', ok: !!g.fechas.inspeccion_terreno,    required: true },
      { id: 'fecha_emis',     tab: 'general' as const, grupo: 'Fechas',       label: 'Fecha emisión certificado',       detail: g.fechas.emision_certificado   || 'Sin ingresar', ok: !!g.fechas.emision_certificado,   required: true },
      { id: 'orden_fechas',   tab: 'general' as const, grupo: 'Fechas',       label: 'Orden cronológico',               detail: ordenFechas.mensaje ?? 'eval ≤ inspec ≤ emis', ok: ordenFechas.valido, required: true },
      // ─ General — Revisión ─
      { id: 'revision_confirmada', tab: 'general' as const, grupo: 'Revisión', label: 'Revisión confirmada',           detail: g.revisionConfirmada ? 'Confirmado' : 'Pendiente', ok: !!(g.revisionConfirmada), required: true },
      { id: 'observaciones',  tab: 'general' as const, grupo: 'Revisión',     label: 'Observaciones acta revisadas',    detail: g.observaciones_acta  ? 'Ingresadas' : 'Vacías (quedará N/A)', ok: !!g.observaciones_acta.trim(), required: false },
      // ─ Extracción ─
      { id: 'jaulas',    tab: 'extraction' as const,   grupo: 'Parámetros',   label: 'N° total de jaulas',            detail: ext.numero_total_jaulas > 0 ? String(ext.numero_total_jaulas) : 'Sin ingresar', ok: ext.numero_total_jaulas > 0, required: true },
      { id: 'cfm',       tab: 'extraction' as const,   grupo: 'Parámetros',   label: 'Potencia compresor (CFM)',       detail: g.modo_operacion_minima ? 'N/A (Op. Mín.)' : (ext.potencia_cfm > 0 ? String(ext.potencia_cfm) : 'Sin ingresar'), ok: g.modo_operacion_minima || ext.potencia_cfm > 0, required: true },
      { id: 'ext',       tab: 'extraction' as const,   grupo: 'Capacidad',    label: 'Extracción ≥ 15 TN/día',        detail: `${calculatedExtraction.capacidad_diaria_ton} TN/día`, ok: calculatedExtraction.cumple_norma, required: true },
      // ─ Desnaturalización ─
      { id: 'vel_olla',  tab: 'denaturation' as const, grupo: 'Parámetros',   label: 'Vel. nominal olla (kg/h)',       detail: den.velocidad_nominal_kg_hr > 0 ? String(den.velocidad_nominal_kg_hr) : 'Sin ingresar', ok: den.velocidad_nominal_kg_hr > 0, required: true },
      { id: 'den',       tab: 'denaturation' as const, grupo: 'Capacidad',    label: 'Desnaturalización ≥ 15 TN/día', detail: `${calculatedDenaturation.capacidad_diaria_ton} TN/día`, ok: calculatedDenaturation.cumple_norma, required: true },
      // ─ Almacenamiento ─
      { id: 'cap_m3',    tab: 'storage' as const,      grupo: 'Parámetros',   label: 'Capacidad almacenaje (m³)',      detail: sto.capacidad_almacenaje_m3 > 0 ? String(sto.capacidad_almacenaje_m3) : 'Sin ingresar', ok: sto.capacidad_almacenaje_m3 > 0, required: true },
      { id: 'sto',       tab: 'storage' as const,      grupo: 'Capacidad',    label: 'Almacenamiento ≥ 20 TN',        detail: `${calculatedStorage.capacidad_almacenaje_ton} TN`, ok: calculatedStorage.cumple_norma, required: true },
      // ─ Informe / Fotos ─
      { id: 'foto_port', tab: 'report' as const,       grupo: 'Fotos',        label: 'Foto de portada',               detail: `${imgs.filter(i => i.seccion === 'Portada' && i.url).length} cargada(s)`, ok: imgs.some(i => i.seccion === 'Portada' && i.url), required: false },
      { id: 'foto_ubi',  tab: 'report' as const,       grupo: 'Fotos',        label: 'Ubicación espacial (4)',         detail: `${imgs.filter(i => i.seccion === 'Ubicación Espacial' && i.url).length}/4`, ok: imgs.filter(i => i.seccion === 'Ubicación Espacial' && i.url).length >= 4, required: true  },
      { id: 'foto_tec',  tab: 'report' as const,       grupo: 'Fotos',        label: 'Fotos técnicas',                detail: `${imgs.filter(i => ['Extracción','Desnaturalización','Almacenamiento'].includes(i.seccion) && i.url).length} cargada(s)`, ok: imgs.some(i => ['Extracción','Desnaturalización','Almacenamiento'].includes(i.seccion) && i.url), required: false },
      { id: 'registro',  tab: 'report' as const,       grupo: 'Fotos',        label: 'Registro de visita adjunto',    detail: registroVisitaName ?? 'Sin adjuntar', ok: !!registroVisitaName, required: false },
    ];
  }, [state, calculatedExtraction, calculatedDenaturation, calculatedStorage, registroVisitaName]);

  const canEmit = useMemo(
    () => checklistItems.filter(i => i.required).every(i => i.ok),
    [checklistItems]
  );

  const allGenCritOk = useMemo(
    () => checklistItems
      .filter(i => i.tab === 'general' && i.required && i.id !== 'revision_confirmada')
      .every(i => i.ok),
    [checklistItems]
  );

  const hasImages = state.images.length > 0;
  const [generating, setGenerating] = useState<'certificado'|'informe'|'acta'|null>(null);

  // ── Checklist flotante: minimizar y arrastrar para no tapar el formulario ──
  const [checklistMin, setChecklistMin] = useState(() => localStorage.getItem('certimar-checklist-min') === 'true');
  const [checklistPos, setChecklistPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem('certimar-checklist-pos');
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p?.x === 'number' && typeof p?.y === 'number') {
        // Clampar dentro de la ventana actual por si cambió de tamaño
        const x = Math.min(Math.max(8, p.x), Math.max(8, window.innerWidth - 288 - 8));
        const y = Math.min(Math.max(8, p.y), Math.max(8, window.innerHeight - 48));
        return { x, y };
      }
    } catch { /* noop */ }
    return null;
  });
  const checklistDragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('certimar-checklist-min', String(checklistMin));
  }, [checklistMin]);
  useEffect(() => {
    if (checklistPos) localStorage.setItem('certimar-checklist-pos', JSON.stringify(checklistPos));
    else localStorage.removeItem('certimar-checklist-pos');
  }, [checklistPos]);

  // Chequeo previo: verifica concordancia de capacidades entre los 3 documentos
  const checkCapacidades = (): string[] => {
    const issues: string[] = [];

    // Campos obligatorios de identificación
    const cc = state.general.centro_cultivo;
    if (!cc.codigo_centro.trim())   issues.push('Falta: Código de Centro');
    if (!cc.nombre_centro.trim())   issues.push('Falta: Nombre del Centro');
    if (!cc.titular.trim())         issues.push('Falta: Titular / Empresa');
    if (!cc.acs.trim())             issues.push('Falta: A.C.S / RNA');
    if (!cc.ubicacion.trim())       issues.push('Falta: Ubicación del Centro');

    // Parámetros técnicos mínimos
    if (state.extraction.parametros.numero_total_jaulas <= 0)
      issues.push('Falta: Número total de jaulas (Extracción)');
    if (!state.general.modo_operacion_minima && state.extraction.parametros.potencia_cfm <= 0)
      issues.push('Falta: Potencia del compresor en CFM (Extracción)');
    if (state.denaturation.equipos.velocidad_nominal_kg_hr <= 0)
      issues.push('Falta: Velocidad nominal de la olla (Desnaturalización)');
    if (state.storage.parametros.capacidad_almacenaje_m3 <= 0)
      issues.push('Falta: Capacidad de almacenaje en m³');

    // Cumplimiento normativo
    if (!calculatedExtraction.cumple_norma)
      issues.push(`Extracción: ${calculatedExtraction.capacidad_diaria_ton.toFixed(2)} TN/día (mín. 15)`);
    if (!calculatedDenaturation.cumple_norma)
      issues.push(`Desnaturalización: ${calculatedDenaturation.capacidad_diaria_ton.toFixed(2)} TN/día (mín. 15)`);
    if (!calculatedStorage.cumple_norma)
      issues.push(`Almacenamiento: ${calculatedStorage.capacidad_almacenaje_ton.toFixed(2)} TN (mín. 20)`);

    return issues;
  };

  const formatDateES = (iso: string): string => {
    if (!iso) return '—';
    const [year, month, day] = iso.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${parseInt(day)} de ${months[parseInt(month)-1]} del ${year}`;
  };

  const makeDocCode = (codigo: string, fecha: string): string => {
    if (!fecha) return `${codigo}MOR`;
    const [year, month, day] = fecha.split('-');
    return `${codigo}${day}${month}${year.slice(2)}MOR`;
  };

  /** Convierte yyyy-mm-dd → dd-mm-yyyy para nombres de archivo */
  const formatFileDate = (iso: string): string => {
    if (!iso) return '00-00-0000';
    const [year, month, day] = iso.split('-');
    return `${day}-${month}-${year}`;
  };

  const buildEmailSubject = (): string => {
    const cc = state.general.centro_cultivo;
    const iso = state.general.fechas.emision_certificado;
    let datePart = '';
    if (iso) {
      const [year, month, day] = iso.split('-');
      datePart = `${day} ${month} ${year}`;
    }
    return `${cc.codigo_centro}-${datePart}-Documentos Asociados`;
  };

  const buildEmailText = (): string => {
    const cc = state.general.centro_cultivo;
    return `Estimados,

Junto con saludar cordialmente, se informa que se ha realizado la entrega de las fichas técnicas y registros fotográficos correspondientes al Centro ${cc.nombre_centro} - ${cc.codigo_centro}, cuyo titular es ${cc.titular}.

Debido al tamaño de los archivos comprimidos, estos no han podido ser adjuntados directamente al correo. Por lo tanto, se ha habilitado un acceso mediante carpeta compartida en Drive, disponible en el siguiente enlace:

[enlace Drive]

Agradeciendo desde ya su atención,

Se despide atentamente`;
  };

  // --- Handlers ---
  const handleSelectExtractionSystem = (id: string) => {
    const system = CATALOGO_EXTRACCION.sistemas.find(s => s.id === id);
    if (system) {
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            id_catalogo_equipo: id,
            marca_equipo: `${system.marca} ${system.modelo}`,
          }
        }
      }));
    }
  };

  const handleSelectCompressor = (id: string) => {
    const comp = CATALOGO_EXTRACCION.compresores.find(c => c.id === id);
    if (comp) {
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            id_catalogo_compresor: id,
            tipo_compresor: `${comp.marca} ${comp.modelo}`,
            potencia_cfm: comp.cfm
          }
        }
      }));
    }
  };

  // Detecta si una marca/modelo no existe en el catálogo estático ni en el custom
  const checkNuevoEquipo = (marca_modelo: string, tipo: TipoEquipoCatalogo) => {
    if (!marca_modelo.trim()) return;
    const enEstatico = tipo === 'trituradora'
      ? CATALOGO_DESNATURALIZACION.trituradoras.some(t => t.marca_modelo.toLowerCase() === marca_modelo.toLowerCase())
      : CATALOGO_DESNATURALIZACION.incineradores.some(i => i.marca_modelo.toLowerCase() === marca_modelo.toLowerCase());
    const enCustom = catalogoCustom.some(c => c.tipo === tipo && c.marca_modelo.toLowerCase() === marca_modelo.toLowerCase());
    if (!enEstatico && !enCustom) {
      setPendingCustomEquipo({ marca_modelo, tipo });
    }
  };

  const saveCustomEquipo = async () => {
    if (!pendingCustomEquipo) return;
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      const entry: CatalogoCustomEntry = {
        tipo: pendingCustomEquipo.tipo,
        marca_modelo: pendingCustomEquipo.marca_modelo,
        creadoPor: user?.email ?? 'admin',
        __createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'catalogo_custom'), entry);
      setCatalogoCustom(prev => [...prev, { ...entry, __createdAt: new Date() }]);
      setPendingCustomEquipo(null);
    } catch (err) {
      console.error('Error guardando equipo personalizado:', err);
    }
  };

  const handleGuardarIncinerador = async () => {
    const inc = state.denaturation.incinerador;
    if (!inc.marca_modelo.trim()) {
      alert('Ingresa la marca/modelo del incinerador antes de guardarlo.');
      return;
    }
    setGuardandoInc('guardando');
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      const payload = buildIncineradorEntry(
        inc,
        state.denaturation.parametros_incineracion,
        user?.email ?? 'admin',
        serverTimestamp(),
      );
      const dup = findIncineradorDuplicado(catalogoCustom, inc.marca_modelo);
      if (dup?.id) {
        await updateDoc(doc(db, 'catalogo_custom', dup.id), payload as any);
        setCatalogoCustom(prev => prev.map(c => (c.id === dup.id ? { ...payload, id: dup.id, __createdAt: new Date() } : c)));
        updateDenaturation('incinerador.id_catalogo', `custom:${dup.id}`);
      } else {
        const ref = await addDoc(collection(db, 'catalogo_custom'), payload);
        setCatalogoCustom(prev => [...prev, { ...payload, id: ref.id, __createdAt: new Date() }]);
        updateDenaturation('incinerador.id_catalogo', `custom:${ref.id}`);
      }
      setGuardandoInc('guardado');
      setTimeout(() => setGuardandoInc('idle'), 2000);
    } catch (err) {
      console.error('Error guardando incinerador:', err);
      setGuardandoInc('idle');
      alert('Error al guardar el incinerador. Verifica la conexión e intenta nuevamente.');
    }
  };

  const handleSelectTrituradora = (id: string) => {
    const tri = CATALOGO_DESNATURALIZACION.trituradoras.find(t => t.id === id)
      ?? catalogoCustom.find(c => c.tipo === 'trituradora' && c.marca_modelo === id) as any;
    if (tri) {
      setState(prev => ({
        ...prev,
        denaturation: {
          ...prev.denaturation,
          equipos: {
            ...prev.denaturation.equipos,
            id_catalogo_trituradora: id,
            marca_modelo: tri.marca_modelo,
            velocidad_nominal_kg_hr: tri.capacidad_nominal_kg_h ?? 0,
            material_construccion: tri.material ?? '',
            capacidad_prepicador_kg_hr: tri.capacidad_prepicador_kg_h || 0
          }
        }
      }));
    }
  };

  const handleSelectIncinerador = (id: string) => {
    const inc = CATALOGO_DESNATURALIZACION.incineradores.find(i => i.id === id);
    if (inc) {
      setState(prev => ({
        ...prev,
        denaturation: {
          ...prev.denaturation,
          equipos: {
            ...prev.denaturation.equipos,
            id_catalogo_incinerador: id,
            marca_modelo: inc.marca_modelo,
          },
          parametros_incineracion: {
            capacidad_carga_kg_h: inc.capacidad_carga_kg_h,
            temperatura_operacion: `${inc.temperatura_camara_primaria_c}°C / ${inc.temperatura_camara_secundaria_c}°C`,
            camara_primaria: `${inc.camara_primaria} — ${inc.num_quemadores_primaria} quemador(es)`,
            camara_secundaria: `${inc.camara_secundaria} — ${inc.num_quemadores_secundaria} quemador(es)`,
          }
        }
      }));
    }
  };

  const handleSelectIncineradorSecundario = (value: string) => {
    const { incinerador, parametros_incineracion } = resolverIncinerador(
      value,
      INCINERADORES_ESTATICOS,
      catalogoCustom,
    );
    setState(prev => ({
      ...prev,
      denaturation: {
        ...prev.denaturation,
        parametros_incineracion,
        incinerador: {
          ...incinerador,
          activo: prev.denaturation.incinerador.activo,
        },
      },
    }));
  };

  const handleSelectGenerator = (index: number, id: string) => {
    const newGens = [...state.denaturation.generacion_electrica];
    if (id === 'otro') {
      newGens[index] = { ...newGens[index], catalogoId: 'otro', marca: '', modelo: '', capacidad_kva: 0 };
      setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
    } else {
      const gen = CATALOGO_GENERADORES.find(g => g.id === id);
      if (gen) {
        newGens[index] = { ...newGens[index], catalogoId: id, marca: gen.marca, modelo: gen.modelo, capacidad_kva: gen.kva };
        setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
      }
    }
  };

  const handleUpdateGenerator = (index: number, field: string, value: any) => {
    const newGens = [...state.denaturation.generacion_electrica];
    (newGens[index] as any)[field] = value;
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
  };

  const handleAddGenerator = () => {
    const newGen = { tipo: 'Principal', marca: '', modelo: '', capacidad_kva: 0, ubicacion: '', catalogoId: '' };
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: [...prev.denaturation.generacion_electrica, newGen] } }));
  };

  const handleRemoveGenerator = (index: number) => {
    const newGens = state.denaturation.generacion_electrica.filter((_, i) => i !== index);
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
  };

  const handleAddExtractionEquipo = () => {
    const newEquipo = { tipo: 'Principal', id_catalogo: '', marca: '', modelo: '', capacidad_kg_h: 0, ubicacion: '' };
    setState(prev => ({ ...prev, extraction: { ...prev.extraction, equipos_extraccion: [...prev.extraction.equipos_extraccion, newEquipo] } }));
  };

  const handleRemoveExtractionEquipo = (index: number) => {
    const newEquipos = state.extraction.equipos_extraccion.filter((_, i) => i !== index);
    setState(prev => ({ ...prev, extraction: { ...prev.extraction, equipos_extraccion: newEquipos } }));
  };

  const handleUpdateExtractionEquipo = (index: number, field: string, value: any) => {
    const newEquipos = [...state.extraction.equipos_extraccion];
    (newEquipos[index] as any)[field] = value;
    setState(prev => ({ ...prev, extraction: { ...prev.extraction, equipos_extraccion: newEquipos } }));
  };

  const handleSelectExtractionEquipoItem = (index: number, id: string) => {
    const system = CATALOGO_EXTRACCION.sistemas.find(s => s.id === id);
    if (system) {
      const newEquipos = [...state.extraction.equipos_extraccion];
      newEquipos[index] = { ...newEquipos[index], id_catalogo: id, marca: system.marca, modelo: system.modelo, capacidad_kg_h: system.capacidad_kg_h };
      setState(prev => ({ ...prev, extraction: { ...prev.extraction, equipos_extraccion: newEquipos } }));
    } else {
      handleUpdateExtractionEquipo(index, 'id_catalogo', id);
    }
  };

  const updateGeneral = (field: string, value: any) => {
    // La confirmación de revisión se pide una sola vez al completar los datos.
    // Editar campos después de confirmar NO debe reabrir el popup (interferiría al escribir).
    if (!field.includes('.')) {
      setState(prev => ({ ...prev, general: { ...prev.general, [field]: value } }));
      return;
    }
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [section]: {
          ...(prev.general as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateExtraction = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        [section]: {
          ...(prev.extraction as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateDenaturation = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      denaturation: {
        ...prev.denaturation,
        [section]: {
          ...(prev.denaturation as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateStorage = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        [section]: {
          ...(prev.storage as any)[section],
          [key]: value
        }
      }
    }));
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 2000; // px lado largo máximo
          const QUALITY = 0.88;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
            else                 { width  = Math.round(width  * MAX / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', QUALITY));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const [imagesUploadProgress, setImagesUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [aiClassifying, setAiClassifying] = useState<Set<string>>(new Set());
  const [aiMeta, setAiMeta] = useState<Record<string, { confianza: number; justificacion: string }>>({});
  const [annotatingImageId, setAnnotatingImageId] = useState<string | null>(null);
  const annotatingImg = annotatingImageId ? (state.images.find(i => i.id === annotatingImageId) ?? null) : null;
  const [cropModalId, setCropModalId] = useState<string | null>(null);
  const cropModalImg = cropModalId ? (state.images.find(i => i.id === cropModalId) ?? null) : null;

  const [historicoEntries, setHistoricoEntries] = useState<RegistroHistorico[]>([]);
  const [historicoFiltro, setHistoricoFiltro] = useState<'todos' | 'borradores' | 'finalizados'>('todos');
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoViewMode, setHistoricoViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('certimar_historico_view') as 'grid' | 'list') ?? 'grid'
  );
  const [historicoEmpresaFiltro, setHistoricoEmpresaFiltro] = useState('');
  const [selectedHistoricoEntry, setSelectedHistoricoEntry] = useState<RegistroHistorico | null>(null);
  const [resubirLoadingId, setResubirLoadingId] = useState<string | null>(null); // "docId-tipo"
  const [confirmDownload, setConfirmDownload] = useState<{ entry: RegistroHistorico; tipo: string; url?: string } | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [versionesModal, setVersionesModal] = useState<{ registroId: string; entry: RegistroHistorico } | null>(null);
  const [versiones, setVersiones] = useState<RespaldoVersion[]>([]);
  const [versionesLoading, setVersionesLoading] = useState(false);
  const [restaurandoVersion, setRestaurandoVersion] = useState(false);
  const [nombreVersionInput, setNombreVersionInput] = useState('');
  const [nombrandoVersion, setNombrandoVersion] = useState(false);
  const resubirPendienteRef = useRef<{ entry: RegistroHistorico; tipo: string } | null>(null);
  const resubirFileInputRef = useRef<HTMLInputElement>(null);

  const handleResubirDocumento = (entry: RegistroHistorico, tipo: string) => {
    resubirPendienteRef.current = { entry, tipo };
    resubirFileInputRef.current?.click();
  };

  const handleResubirFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pending = resubirPendienteRef.current;
    e.target.value = '';
    if (!file || !pending) return;
    const { entry, tipo } = pending;
    resubirPendienteRef.current = null;
    const loadingKey = `${entry.id}-${tipo}`;
    setResubirLoadingId(loadingKey);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('./firebase');
      const storageRef = ref(storage, `historico/${entry.id}/${tipo}.pdf`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await updateDoc(doc(db, 'historico', entry.id!), {
        [`documentUrls.${tipo}`]: url,
      });
      setHistoricoEntries(prev =>
        prev.map(e => e.id === entry.id
          ? { ...e, documentUrls: { ...e.documentUrls, [tipo]: url } }
          : e
        )
      );
    } catch (err) {
      console.error('Error en re-subida:', err);
      alert('No se pudo subir el archivo. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setResubirLoadingId(null);
    }
  };

  const addImage = (files: File[]) => {
    if (!files.length) return;
    setImagesUploadProgress({ done: 0, total: files.length });
    let done = 0;
    files.forEach(async (file) => {
      const base64 = await compressImage(file);
      const id = Math.random().toString(36).substr(2, 9);

      // Subir a Firebase Storage y obtener URL persistente.
      // Siempre se guarda en IDB como respaldo (si Firebase no está disponible al recargar,
      // la imagen se puede recuperar desde IDB).
      await idbSave(id, base64);
      let imageUrl = base64;
      try {
        const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('./firebase');
        const storageRef = ref(storage, `images/${id}.jpg`);
        await uploadString(storageRef, base64, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      } catch {
        // Firebase falló — imageUrl queda como base64, IDB ya fue guardado arriba
      }

      const newImg: ReportImage = {
        id, url: imageUrl,
        seccion: 'General', leyenda: '', estado: 'Verde',
        observacion: 'CUMPLE CON LO DECLARADO',
      };
      setState(prev => ({ ...prev, images: [...prev.images, newImg] }));
      done += 1;
      if (done >= files.length) {
        setImagesUploadProgress(null);
      } else {
        setImagesUploadProgress({ done, total: files.length });
      }

      // Clasificación IA — no bloquea la subida
      if (CLAUDE_API_KEY) {
        setAiClassifying(prev => new Set(prev).add(id));
        classifyImage(base64).then(result => {
          if (result) {
            setState(prev => ({
              ...prev,
              images: prev.images.map(img =>
                img.id === id ? { ...img, seccion: result.seccion } : img
              ),
            }));
            setAiMeta(prev => ({ ...prev, [id]: { confianza: result.confianza, justificacion: result.justificacion } }));
          }
          setAiClassifying(prev => { const s = new Set(prev); s.delete(id); return s; });
        });
      }
    });
  };

  const removeImage = (id: string) => {
    idbDelete(id);
    // Eliminar de Firebase Storage si existe
    import('firebase/storage').then(({ ref, deleteObject }) =>
      import('./firebase').then(({ storage }) =>
        deleteObject(ref(storage, `images/${id}.jpg`)).catch(() => { /* ya no existía */ })
      )
    );
    setState(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const updateImage = (id: string, updates: Partial<ReportImage>) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, ...updates } : img)
    }));
  };

  // ─── Helpers PDF compartidos ───────────────────────────────────────────────

  /** Corrige orientación EXIF dibujando la imagen en un canvas offscreen.
   *  Para URLs HTTP (Firebase Storage) hace fetch como blob primero para evitar
   *  que el canvas quede "tainted" por CORS y toDataURL() lance SecurityError.
   *  Implementado como cadena de Promises (sin async/await) para evitar problemas
   *  de TDZ en el estado de máquina generado por el compilador. */
  const fixImageOrientation = (url: string): Promise<string> => {
    if (!url) return Promise.resolve('');

    const drawOnCanvas = (imageUrl: string, cleanup: () => void): Promise<string> =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const MAX_PX = 2400;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > MAX_PX || h > MAX_PX) {
            if (w >= h) { h = Math.round(h * MAX_PX / w); w = MAX_PX; }
            else        { w = Math.round(w * MAX_PX / h); h = MAX_PX; }
          }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d')!.drawImage(img, 0, 0, w, h);
          try { resolve(c.toDataURL('image/jpeg', 0.88)); } catch { resolve(''); }
          cleanup();
        };
        img.onerror = () => { resolve(''); cleanup(); };
        img.src = imageUrl;
      });

    if (!url.startsWith('http')) {
      return drawOnCanvas(url, () => {}).catch(() => '');
    }

    return fetch(url)
      .then(resp => {
        if (!resp.ok) return Promise.resolve('');
        return resp.blob().then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          return drawOnCanvas(blobUrl, () => URL.revokeObjectURL(blobUrl));
        });
      })
      .catch(() => '');
  };

  const loadLogo = async (): Promise<string | null> => {
    const logoPath = tema.logo === 'engelbert' ? '/engelbert-logo.png' : '/certimar-logo.png';
    try {
      const resp = await fetch(logoPath);
      const blob = await resp.blob();
      return new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const loadUrlAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const handleUploadLogoEmpresa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 600_000) { alert('El archivo supera los 500 KB.'); return; }
    const slug = file.name.replace(/\s+/g, '-').toLowerCase();
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('./firebase');
      const storageRef = ref(storage, `logos-empresas/${slug}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const name = file.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ').toUpperCase();
      setLogosEmpresas(prev => ({ ...prev, [name]: url }));
      setLogosStoragePaths(prev => ({ ...prev, [name]: `logos-empresas/${slug}` }));
    } catch (err) { console.error(err); alert('Error al subir el logo.'); }
    e.target.value = '';
  };

  const deleteLogoEmpresa = async (name: string) => {
    if (!window.confirm(`¿Eliminar logo de "${name}"?`)) return;
    const url = logosEmpresas[name];
    const storagePath = logosStoragePaths[name];
    try {
      if (storagePath) {
        const { ref, deleteObject } = await import('firebase/storage');
        const { storage } = await import('./firebase');
        await deleteObject(ref(storage, storagePath));
      }
      setLogosEmpresas(prev => { const n = { ...prev }; delete n[name]; return n; });
      setLogosStoragePaths(prev => { const n = { ...prev }; delete n[name]; return n; });
      if (logoClienteUrl === url) setLogoClienteUrl(null);
    } catch (err) { console.error('Error al eliminar logo:', err); alert('No se pudo eliminar el logo.'); }
  };

  const renameLogo = (oldName: string, newName: string) => {
    const trimmed = newName.trim().toUpperCase();
    if (!trimmed || trimmed === oldName) { setRenamingLogo(null); return; }
    setLogosEmpresas(prev => {
      const next = { ...prev };
      next[trimmed] = next[oldName];
      delete next[oldName];
      return next;
    });
    setLogosStoragePaths(prev => {
      const next = { ...prev };
      next[trimmed] = next[oldName];
      delete next[oldName];
      return next;
    });
    setRenamingLogo(null);
  };

  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

  const CLASSIFY_SYSTEM = `Actúa como un experto certificador ambiental de la industria acuícola chilena (Norma D.S. N° 320 y Res. 1511).
Tu tarea es analizar la imagen proporcionada de un centro de cultivo de salmones y clasificarla estrictamente en UNA de las siguientes categorías, devolviendo la respuesta en formato JSON.

CATEGORÍAS PERMITIDAS Y SUS CARACTERÍSTICAS:
1. "PORTADA": Vistas aéreas, paisajes marítimos, vista general de pontones o jaulas de cultivo.
2. "UBICACION": Vistas de dron o satélite mostrando la cuadrícula de jaulas en el mar, para ubicar espacialmente el centro.
3. "EXTRACCION": Compresores de aire industriales, mangas neumáticas, bins plásticos de transporte, tuberías de HDPE y válvulas asociadas a las jaulas.
4. "DESNATURALIZACION": Ollas trituradoras de acero inoxidable (ensilaje), motores prepicadores, tableros eléctricos de control, bombas de ácido, mesas de necropsia, lavaojos de emergencia, extintores, o chimeneas/cámaras de incineradores.
5. "ALMACENAMIENTO": Estanques cúbicos IBC (blancos con rejilla), grandes plataformas de fondeo, agrupaciones de bidones azules.
6. "GENERAL": Fotografías de hojas de papel, actas de inspección, escritura a mano, firmas, o imágenes que no encajan en las anteriores.

INSTRUCCIONES ADICIONALES:
- Si detectas acero inoxidable cilíndrico, es altamente probable que sea "DESNATURALIZACION".
- Si la imagen es claramente aérea/dron mostrando jaulas en cuadrícula en el mar, usa "UBICACION".
- Si la imagen es una panorámica del centro o fachada del pontón, usa "PORTADA".

FORMATO DE SALIDA (Solo JSON puro, sin markdown):
{"categoria_sugerida":"NOMBRE","confianza":0.95,"justificacion_breve":"..."}`;

  const AI_SECCION_MAP: Record<string, ImageSeccion> = {
    PORTADA: 'Portada',
    UBICACION: 'Ubicación Espacial',
    EXTRACCION: 'Extracción',
    DESNATURALIZACION: 'Desnaturalización',
    ALMACENAMIENTO: 'Almacenamiento',
    GENERAL: 'General',
  };

  async function classifyImage(base64: string): Promise<{ seccion: ImageSeccion; confianza: number; justificacion: string } | null> {
    if (!CLAUDE_API_KEY) return null;
    try {
      const mediaType = base64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const imageData = base64.split(',')[1];
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          system: CLASSIFY_SYSTEM,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: 'Clasifica esta imagen.' }
          ]}],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      const seccion: ImageSeccion = AI_SECCION_MAP[parsed.categoria_sugerida] ?? 'General';
      return { seccion, confianza: parsed.confianza ?? 0, justificacion: parsed.justificacion_breve ?? '' };
    } catch {
      return null;
    }
  }

  const addInformePageFrame = (doc: jsPDF, docCode: string, logo: string | null, pageLabel: string) => {
    const n = (doc as any).internal.getNumberOfPages();
    // Empieza en la p.2 — la portada (p.1) tiene su propio diseño de cabecera/pie
    for (let i = 2; i <= n; i++) {
      doc.setPage(i);
      const W = 215.9, H = 279.4;

      // ── Helper onda decorativa — con opacidad para no tapar el texto ──
      const isEngelbertFrame = tema.palette === 'engelbert';
      const gState25 = (doc as any).GState({ opacity: 0.25, 'fill-opacity': 0.25 });
      const gState100 = (doc as any).GState({ opacity: 1, 'fill-opacity': 1 });
      const drawWave = (y0: number, amp: number) => {
        doc.setDrawColor(...(isEngelbertFrame ? [253, 186, 116] as [number,number,number] : [168, 200, 232] as [number,number,number]));
        doc.setLineWidth(0.35);
        const w = W / 4;
        doc.lines(
          [[w*0.38,-amp,w*0.62,-amp,w,0],[w*0.38,amp,w*0.62,amp,w,0],
           [w*0.38,-amp,w*0.62,-amp,w,0],[w*0.38,amp,w*0.62,amp,w,0]],
          0, y0, [1, 1], 'S', false
        );
      };
      // Las ondas del cuerpo se dibujan ANTES del contenido (via drawBodyWaves) para
      // quedar detrás del texto. Aquí solo dibujamos header + footer.

      // ── Header: fondo blanco + ondas + logo izquierda + banda azul marino ──
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, 22, 'F');
      // Líneas horizontales muy sutiles — color casi blanco para simular 5% opacidad
      doc.setDrawColor(246, 248, 252);
      doc.setLineWidth(0.15);
      for (let ly = 3; ly < 17; ly += 3.5) doc.line(0, ly, W, ly);
      // Logo a la izquierda
      if (logo) {
        const props = doc.getImageProperties(logo);
        const maxW = 30, maxH = 15;
        const scale = Math.min(maxW / props.width, maxH / props.height);
        const imgW = props.width * scale, imgH = props.height * scale;
        doc.addImage(logo, 'PNG', 3 + (maxW - imgW) / 2, 2 + (maxH - imgH) / 2, imgW, imgH);
      }
      const FRAME_PRI: [number,number,number] = isEngelbertFrame ? [210, 65, 10] : [26, 58, 92];
      const FRAME_DRK: [number,number,number] = isEngelbertFrame ? [160, 40,  0] : [10, 28, 70];
      // Normativa y folio
      doc.setTextColor(...FRAME_PRI);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('Res. Exenta N°1511/2021 — D.S. N°320', 37, 6);
      doc.setFont('helvetica', 'bold');
      doc.text(docCode, W - 5, 6, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text(pageLabel, W - 5, 12, { align: 'right' });

      // ── Footer liviano ──
      doc.setDrawColor(...FRAME_PRI);
      doc.setLineWidth(0.18);
      doc.line(10, H - 14, W - 10, H - 14);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...FRAME_PRI);
      doc.text(`${tema.logo === 'engelbert' ? 'Engelbert Aquastructures' : 'CERTIMAR SPA'} — Res. Exenta N°1511/2021`, 10, H - 9);
      doc.text(`Pág. ${i} de ${n}`, W - 10, H - 9, { align: 'right' });
      doc.setFontSize(6.5); doc.setTextColor(130, 130, 130);
      doc.text('Mario Toral 101, Puerto Aysén  ·  +56 9 45052052  ·  eflores@certimar.cl',
               W / 2, H - 4, { align: 'center' });
    }
  };

  const addActaFooter = (doc: jsPDF) => {
    const n = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(180, 180, 180);
      doc.line(14, 289, 196, 289);
      doc.text(`${tema.palette === 'engelbert' ? 'Engelbert Aquastructures' : 'CERTIMAR SPA'} — Res. Exenta N°1511/2021 — D.S. (MINECON) N°15/2011`, 14, 293);
      doc.text(`Pág. ${i}/${n}`, 196, 293, { align: 'right' });
    }
  };

  // ─── CERTIFICADO ───────────────────────────────────────────────────────────
  const generateCertificadoPDF = async () => {
    if (!canEmit) {
      alert('Hay campos obligatorios sin completar. Revisa el checklist de cada sección antes de generar el certificado.');
      return;
    }
    setGenerating('certificado');
    try {
      const logo = await loadLogo();
      const stateWithCalc = {
        ...state,
        extraction:   { ...state.extraction,   resultados: calculatedExtraction },
        denaturation: { ...state.denaturation, resultados: calculatedDenaturation },
        storage:      { ...state.storage,      resultados: calculatedStorage },
      };
      const cert   = buildCertificadoData(stateWithCalc);
      const codigo = state.general.centro_cultivo.codigo_centro;

      const isEngelbert = tema.palette === 'engelbert';
      const AZUL: [number, number, number]    = isEngelbert ? [210, 65, 10]  : [15, 40, 90];
      const AZUL_DARK: [number, number, number] = isEngelbert ? [160, 40,  0]  : [10, 28, 70];
      const VERDE: [number, number, number]   = [22, 101, 52];
      const ROJO: [number, number, number]    = [185, 28, 28];
      const GRIS: [number, number, number]    = isEngelbert ? [255, 248, 240] : [248, 250, 252];
      const fmtC = (c: boolean) => c ? 'CUMPLE' : 'NO CUMPLE';
      const colC = (c: boolean): [number,number,number] => c ? VERDE : ROJO;

      await ensurePdfLibs();
      const doc = new JsPDFCtor({ compress: true });

      // Header: solo banda arcilla
      doc.setFillColor(...AZUL);
      doc.rect(0, 37, 210, 1.5, 'F');

// ── Ondas decorativas + salmones acuarelados en el banner ─────────────
        // (() => {
        //   // Ondas horizontales (se mantienen sin cambios)
        //   const drawOnda = (x0: number, y0: number, totalW: number, amp: number) => {
        //     const w = totalW / 4;
        //     doc.lines([
        //       [w*0.38, -amp, w*0.62, -amp, w, 0],
        //       [w*0.38,  amp, w*0.62,  amp, w, 0],
        //       [w*0.38, -amp, w*0.62, -amp, w, 0],
        //       [w*0.38,  amp, w*0.62,  amp, w, 0],
        //     ], x0, y0, [1, 1], 'S', false);
        //   };
        //   doc.setDrawColor(95, 155, 210);
        //   ([
        //     [7,  2.0, 0.34],
        //     [14, 1.5, 0.28],
        //     [21, 2.3, 0.38],
        //     [29, 1.4, 0.26],
        //     [37, 1.9, 0.32],
        //   ] as [number,number,number][]).forEach(([y, amp, lw]) => {
        //     doc.setGState((doc as any).GState({ opacity: 0.30, 'fill-opacity': 0.30 }));
        //     doc.setLineWidth(lw);
        //     drawOnda(0, y, 212, amp);
        //   });

        //   // ─── Salmones acuarelados: canvas → PNG con canal alfa ───────────────
        //   //
        //   // Cada salmón se renderiza en un <canvas> offscreen usando globalAlpha
        //   // para fijar la opacidad final en el pixel. El PNG resultante preserva
        //   // la transparencia y jsPDF lo compone sobre el fondo sin afectar el texto.
        //   //
        //   // Orden de capas dentro del banner:
        //   //   1. Fondo blanco (existente)
        //   //   2. Líneas onduladas (arriba)
        //   //   3. ← Salmones aquí (opacidad 0.12-0.15)
        //   //   4. Logo, textos y barra azul (encima de todo)
        //   //
        //   const makeSalmonPng = (
        //     mmW: number, mmH: number,
        //     baseHex: string, facingLeft: boolean, alpha: number
        //   ): string => {
        //     const PX = 3;                                   // 3 px / mm → buena resolución
        //     const W  = Math.round(mmW * PX);
        //     const H  = Math.round(mmH * PX);
        //     const cv = document.createElement('canvas');
        //     cv.width = W; cv.height = H;
        //     const c  = cv.getContext('2d')!;

        //     // Reflejar si el pez nada hacia la izquierda
        //     if (facingLeft) { c.translate(W, 0); c.scale(-1, 1); }
        //     c.globalAlpha = alpha;                          // toda la transparencia en el PNG

        //     // ── Ejes internos: cabeza=derecha, cola=izquierda ──
        //     const cx = W * 0.50, cy = H * 0.52;
        //     const bw = W * 0.34, bh = H * 0.25;            // semiejes del cuerpo

        //     // Oscurece/aclara un color hex por `d` puntos en cada canal
        //     const sh = (hex: string, d: number): string => {
        //       const n = parseInt(hex.replace('#', ''), 16);
        //       const cl = (v: number) => Math.min(255, Math.max(0, v));
        //       return `rgb(${cl((n >> 16) + d)},${cl(((n >> 8) & 255) + d)},${cl((n & 255) + d)})`;
        //     };

        //     // 1 — Cuerpo principal
        //     c.fillStyle = baseHex;
        //     c.beginPath();
        //     c.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2);
        //     c.fill();

        //     // 2 — Cabeza (ligeramente más redondeada y oscura)
        //     c.fillStyle = sh(baseHex, -22);
        //     c.beginPath();
        //     c.ellipse(cx + bw * 0.70, cy + bh * 0.06, bw * 0.28, bh * 0.82, -0.08, 0, Math.PI * 2);
        //     c.fill();

        //     // 3 — Hocico terminal
        //     c.beginPath();
        //     c.ellipse(cx + bw * 0.96, cy + bh * 0.16, bw * 0.08, bh * 0.38, -0.15, 0, Math.PI * 2);
        //     c.fill();

        //     // 4 — Cola bifurcada (dos lóbulos simétricos)
        //     c.fillStyle = sh(baseHex, -14);
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.92, cy - bh * 0.12);
        //     c.bezierCurveTo(
        //       cx - bw * 1.12, cy - bh * 0.18,
        //       cx - bw * 1.38, cy - bh * 1.52,
        //       cx - bw * 1.52, cy - bh * 1.78
        //     );
        //     c.lineTo(cx - bw * 1.36, cy - bh * 0.88);
        //     c.lineTo(cx - bw * 0.98, cy);
        //     c.lineTo(cx - bw * 1.36, cy + bh * 0.88);
        //     c.lineTo(cx - bw * 1.52, cy + bh * 1.78);
        //     c.bezierCurveTo(
        //       cx - bw * 1.38, cy + bh * 1.52,
        //       cx - bw * 1.12, cy + bh * 0.18,
        //       cx - bw * 0.92, cy + bh * 0.12
        //     );
        //     c.fill();

        //     // 5 — Aleta dorsal (prominente, curva natural)
        //     c.fillStyle = sh(baseHex, -18);
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.06, cy - bh);
        //     c.quadraticCurveTo(cx + bw * 0.14, cy - bh * 2.20, cx + bw * 0.46, cy - bh);
        //     c.closePath();
        //     c.fill();

        //     // 6 — Aleta adiposa (pequeña, característica del salmón, entre dorsal y cola)
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.50, cy - bh * 0.96);
        //     c.quadraticCurveTo(cx - bw * 0.42, cy - bh * 1.44, cx - bw * 0.30, cy - bh * 0.96);
        //     c.closePath();
        //     c.fill();

        //     // 7 — Aleta pectoral (debajo de la cabeza, diagonal)
        //     c.fillStyle = sh(baseHex, -10);
        //     c.beginPath();
        //     c.moveTo(cx + bw * 0.50, cy + bh * 0.25);
        //     c.quadraticCurveTo(cx + bw * 0.72, cy + bh * 1.10, cx + bw * 0.62, cy + bh * 0.52);
        //     c.closePath();
        //     c.fill();

        //     // 8 — Aleta ventral
        //     c.beginPath();
        //     c.moveTo(cx + bw * 0.08, cy + bh * 0.90);
        //     c.quadraticCurveTo(cx + bw * 0.22, cy + bh * 1.52, cx + bw * 0.34, cy + bh * 0.92);
        //     c.closePath();
        //     c.fill();

        //     // 9 — Franja plateada lateral (iridiscencia)
        //     c.fillStyle = 'rgba(160,185,205,0.52)';
        //     c.beginPath();
        //     c.ellipse(cx, cy + bh * 0.08, bw * 0.84, bh * 0.20, 0, 0, Math.PI * 2);
        //     c.fill();

        //     // 10 — Manchas oscuras características (salmón del Atlántico)
        //     c.fillStyle = sh(baseHex, -48);
        //     ([
        //       [cx - 0.05 * bw, cy - 0.38 * bh, bh * 0.13],
        //       [cx + 0.20 * bw, cy - 0.50 * bh, bh * 0.11],
        //       [cx + 0.36 * bw, cy - 0.30 * bh, bh * 0.12],
        //       [cx - 0.18 * bw, cy - 0.55 * bh, bh * 0.10],
        //       [cx + 0.08 * bw, cy - 0.62 * bh, bh * 0.09],
        //       [cx - 0.35 * bw, cy - 0.42 * bh, bh * 0.08],
        //     ] as [number, number, number][]).forEach(([sx, sy, sr]) => {
        //       c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
        //     });

        //     // 11 — Ojo + reflejo especular
        //     c.fillStyle = 'rgba(28,16,6,0.92)';
        //     c.beginPath();
        //     c.arc(cx + bw * 0.66, cy - bh * 0.10, bh * 0.22, 0, Math.PI * 2);
        //     c.fill();
        //     c.fillStyle = 'rgba(255,255,255,0.68)';
        //     c.beginPath();
        //     c.arc(cx + bw * 0.70, cy - bh * 0.16, bh * 0.07, 0, Math.PI * 2);
        //     c.fill();

        //     return cv.toDataURL('image/png');
        //   };

        //   // ─── Generar los 3 PNG antes de componer el PDF ───────────────────────
        //   //  - salmonGrande (#C9967A): pinkish salmon, zona derecha (sin texto denso)
        //   //  - salmonMedio  (#8096A5): gris plateado,  detrás del logo (izquierda)
        //   //  - salmonPeq    (#A8916E): dorado pardo,   transición logo→texto
        //   const salmonGrande = makeSalmonPng(72, 38, '#C9967A', false, 0.15);
        //   const salmonMedio  = makeSalmonPng(52, 26, '#8096A5', true,  0.12);
        //   const salmonPeq    = makeSalmonPng(40, 20, '#A8916E', false, 0.13);

        //   // Opacidad 1 en GState — la semi-transparencia viene del canal alfa del PNG
        //   doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));

        //   // Posiciones en mm (x, y, ancho, alto):
        //   //   grande  → x=133, y=4  : extremo derecho del banner
        //   //   mediano → x=3,   y=9  : detrás del logo, semioculto
        //   //   pequeño → x=72,  y=22 : entre logo y texto central
        //   doc.addImage(salmonGrande, 'PNG', 133,  4, 72, 38);
        //   doc.addImage(salmonMedio,  'PNG',   3,  9, 52, 26);
        //   doc.addImage(salmonPeq,    'PNG',  72, 22, 40, 20);

        //   doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));
        //   doc.setLineWidth(0.2);
        // })();

      // Logo con proporción correcta
      if (logo) {
        const props = doc.getImageProperties(logo);
        const maxW = 40, maxH = 28;
        const scale = Math.min(maxW / props.width, maxH / props.height);
        const imgW = props.width * scale;
        const imgH = props.height * scale;
        doc.addImage(logo, 'PNG', 5 + (maxW - imgW) / 2, 3 + (maxH - imgH) / 2, imgW, imgH);
      }
      doc.setTextColor(...AZUL);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Res. Exenta N°1511/2021 — D.S. N°320', 50, 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CERTIFICADO DE CAPACIDADES DE', 50, 17);
      doc.text('SISTEMAS DE MORTALIDAD', 50, 25);
      doc.setTextColor(0, 0, 0);

      // ── Marca de agua: olas multicolor (paleta según tema) ──────────────────
      const PALETTE: [number,number,number][] = isEngelbert ? [
        [255, 235, 215],
        [255, 215, 180],
        [245, 190, 140],
        [230, 165, 105],
        [210, 140,  75],
      ] : [
        [197, 218, 218],
        [127, 181, 176],
        [ 90, 158, 152],
        [ 46, 122, 115],
        [ 31,  78,  73],
      ];
      const drawOnda = (x0: number, y0: number, totalW: number, amp: number, lw: number, color: [number,number,number]) => {
        const w = totalW / 4;
        doc.setDrawColor(...color);
        doc.setLineWidth(lw);
        doc.lines([
          [w*0.38, -amp, w*0.62, -amp, w, 0],
          [w*0.38,  amp, w*0.62,  amp, w, 0],
          [w*0.38, -amp, w*0.62, -amp, w, 0],
          [w*0.38,  amp, w*0.62,  amp, w, 0],
        ], x0, y0, [1, 1], 'S', false);
      };
      const drawWatermarkOnPage = (yStart: number) => {
        doc.setGState((doc as any).GState({ opacity: wavesOpacity, 'fill-opacity': wavesOpacity }));
        let row = 0;
        for (let wy = yStart + 6; wy < 275; wy += 13) {
          const color = PALETTE[row % PALETTE.length];
          const amp = 1.4 + (row % 3) * 0.35;
          const lw  = 0.22 + (row % 5) * 0.06;
          drawOnda(0, wy, 212, amp, lw, color);
          row++;
        }
        doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));
        doc.setLineWidth(0.2);
      };

      drawWatermarkOnPage(42);

      autoTable(doc, {
        startY: 42,
        margin: { top: 30 },
        head: [['IDENTIFICACIÓN DEL CENTRO', '']],
        body: Object.entries(cert.identificacion).map(([k, v]) => [k, v]),
        theme: 'striped',
        headStyles: { fillColor: AZUL, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: GRIS },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
        styles: { fontSize: 9, cellPadding: 3 },
        didDrawPage: (data: any) => { if (data.pageNumber > 1) drawWatermarkOnPage(30); },
      });

      const bodyCapacidades: string[][] = [];
      const capByRow: number[] = [];
      cert.capacidades.forEach((c, i) => {
        bodyCapacidades.push([c.descripcion, c.valor, c.umbral, fmtC(c.cumple)]);
        capByRow.push(i);
      });

      autoTable(doc, {
        startY: ((doc as any).lastAutoTable?.finalY ?? 110) + 8,
        head: [['SISTEMA', 'CAPACIDAD CERTIFICADA', 'UMBRAL MÍNIMO', 'RESULTADO']],
        body: bodyCapacidades,
        theme: 'grid',
        headStyles: { fillColor: AZUL, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { top: 42 },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 3) {
            const capIdx = capByRow[data.row.index];
            data.cell.styles.textColor = colC(cert.capacidades[capIdx]?.cumple ?? false);
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      const verdY = ((doc as any).lastAutoTable?.finalY ?? 180) + 8;
      const verdText = cert.cumpleGeneral
        ? 'g) Da cumplimiento a las capacidades mínimas establecidas en el artículo 4° A del D.S. N° 320 de 2001, del Ministerio de Economía, Fomento y Turismo.'
        : 'g) No da cumplimiento a las capacidades mínimas establecidas en el artículo 4° A del D.S. N° 320 de 2001, del Ministerio de Economía, Fomento y Turismo.';
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      const verdLines = doc.splitTextToSize(verdText, 172);
      const verdH = Math.max(12, verdLines.length * 5.5 + 6);
      doc.setFillColor(...(cert.cumpleGeneral ? VERDE : ROJO));
      doc.roundedRect(14, verdY, 182, verdH, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(verdLines, 105, verdY + 6, { align: 'center', lineHeightFactor: 1.4 });
      doc.setTextColor(0, 0, 0);

      const firmY = verdY + verdH + 45;
      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.5);
      doc.line(55, firmY, 155, firmY);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(cert.firmante.nombre, 105, firmY + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`RUT: ${cert.firmante.rut}   |   Registro: ${cert.firmante.registro}`, 105, firmY + 13, { align: 'center' });
      doc.text(`Fecha de emisión: ${cert.fechaEmision}`, 105, firmY + 19, { align: 'center' });

      // Pie
      const np = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= np; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setTextColor(150,150,150); doc.setFont('helvetica','normal');
        doc.setDrawColor(200,200,200); doc.line(14,289,196,289);
        doc.text(`${tema.logo === 'engelbert' ? 'Engelbert Aquastructures' : 'CERTIMAR SPA'} — Res. Exenta N°1511/2021`, 14, 293);
        doc.text(`Página ${i} de ${np}`, 196, 293, { align: 'right' });
      }

      const certBlob = doc.output('blob');
      doc.save(`${codigo}-${formatFileDate(state.general.fechas.emision_certificado)}-CERTIFICADO.pdf`);
      setShowEmailModal(true);
      const certDocId = ensureDocId();
      uploadDocToStorage(certBlob, certDocId, 'certificado')
        .then(url => saveToHistorico('certificado', url))
        .catch(() => saveToHistorico('certificado'));
      logEvento('generar_certificado', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
    } finally { setGenerating(null); }
  };

  // ─── INFORME TÉCNICO ───────────────────────────────────────────────────────
  const generateInformePDF = async () => {
    if (!canEmit) {
      alert('Hay campos obligatorios sin completar. Revisa el checklist de cada sección antes de generar el informe.');
      return;
    }
    setGenerating('informe');
    try {
      const logo = await loadLogo();
      const g    = state.general;
      const ext  = state.extraction;
      const den  = state.denaturation;
      const sto  = state.storage;
      const cc   = g.centro_cultivo;
      const codigo = cc.codigo_centro;
      const docCode = makeDocCode(codigo, g.fechas.inspeccion_terreno);

      // Corregir orientación EXIF de todas las imágenes antes de insertar en PDF
      // 'Portada' y 'Ubicación Espacial' siempre se incluyen (no requieren leyenda).
      // El resto requiere leyenda para aparecer en el informe.
      // 'Ubicación Espacial' NO se excluye aquí — addAerialSection las filtra por sección.
      // Para imágenes de Ubicación Espacial: se pre-recortan al AR del slot para evitar letterbox.

      // AR por slot (basados en FULL_W/H y HALF_W/H definidos en addAerialSection)
      const AERIAL_AR: Record<string, number> = {
        top:    182 / 54,   // FULL_W / (FULL_H - CAPTION_H - 2)
        bottom: 182 / 54,
        left:   91  / 39,   // HALF_W / (HALF_H - CAPTION_H - 2)
        right:  91  / 39,
      };

      // Recorta imagen al centro llenando el box (object-fit: cover) usando canvas
      const coverCropDataUrl = (srcUrl: string, ar: number): Promise<string> =>
        new Promise<string>(res => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => {
            const nw = im.naturalWidth, nh = im.naturalHeight;
            // crop to target AR from center
            let sx = 0, sy = 0, sw = nw, sh = nh;
            const naturalAr = nw / nh;
            if (naturalAr > ar) { sw = Math.round(nh * ar); sx = Math.round((nw - sw) / 2); }
            else                { sh = Math.round(nw / ar); sy = Math.round((nh - sh) / 2); }
            const OUT_W = Math.min(sw, 1600);
            const OUT_H = Math.round(OUT_W / ar);
            const canvas = document.createElement('canvas');
            canvas.width = OUT_W; canvas.height = OUT_H;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(im, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
            res(canvas.toDataURL('image/jpeg', 0.9));
          };
          im.onerror = () => res(srcUrl);
          im.src = srcUrl;
        });

      const correctedImgs = await Promise.all(
        state.images
          .filter(img =>
            img.url &&
            (img.seccion === 'Portada' || img.seccion === 'Paisaje' || img.seccion === 'Ubicación Espacial' || img.leyenda.trim() !== '' || img.enPortada)
          )
          .map(async img => {
            let srcUrl = img.url;
            if (img.seccion === 'Ubicación Espacial') {
              if (img.croppedUrl) {
                // Manual crop: use as-is, already correct AR
                srcUrl = img.croppedUrl;
              } else {
                // Auto cover-crop to slot AR
                const ar = AERIAL_AR[img.slotUbicacion ?? 'top'] ?? AERIAL_AR['top'];
                srcUrl = await coverCropDataUrl(img.url, ar);
              }
            }
            const url = await fixImageOrientation(srcUrl);
            const dims = await new Promise<{w:number;h:number}>(res => {
              const el = new Image();
              el.onload  = () => res({ w: el.naturalWidth  || 4, h: el.naturalHeight || 3 });
              el.onerror = () => res({ w: 4, h: 3 });
              el.src = url;
            });
            return { ...img, url, _w: dims.w, _h: dims.h };
          })
      ).then(imgs => imgs.filter(img => img.url));

      // Ajusta imagen al box preservando aspect ratio (object-fit: contain) — usado fuera de Ubicación Espacial
      const fitContain = (nw: number, nh: number, boxW: number, boxH: number) => {
        const scale = Math.min(boxW / nw, boxH / nh);
        const w = nw * scale, h = nh * scale;
        return { w, h, dx: (boxW - w) / 2, dy: (boxH - h) / 2 };
      };

      // Paleta según tema
      const isEngelbert = tema.palette === 'engelbert';
      const AZUL_H: [number,number,number]    = isEngelbert ? [210, 65,  10]  : [74, 118, 168];
      const AZUL_T: [number,number,number]    = isEngelbert ? [180, 60,   0]  : [31,  73, 125];
      const AZUL_D: [number,number,number]    = isEngelbert ? [160, 40,   0]  : [31,  56, 100];
      const VERDE_H:[number,number,number]    = [193, 225, 193]; // legacy
      const AZUL_MARINO: [number,number,number] = isEngelbert ? [160, 48,   5]  : [26,  58,  92];
      const GRIS_FILA:   [number,number,number] = isEngelbert ? [255, 248, 242] : [245, 247, 250];
      const BORDE_TABLA: [number,number,number] = isEngelbert ? [240, 170,  90] : [221, 227, 234];

      await ensurePdfLibs();
      const doc = new JsPDFCtor({ format: 'letter', compress: true });
      const PW = 215.9, PH = 279.4;

      // Dibuja olas de marca de agua en la página actual — llamar ANTES del contenido
      // para que las olas queden detrás del texto.
      const drawBodyWaves = () => {
        const gS25  = (doc as any).GState({ opacity: wavesOpacity, 'fill-opacity': wavesOpacity });
        const gS100 = (doc as any).GState({ opacity: 1,    'fill-opacity': 1 });
        doc.setDrawColor(...(isEngelbert ? [253, 186, 116] as [number,number,number] : [168, 200, 232] as [number,number,number]));
        doc.setLineWidth(0.35);
        const bw = PW / 4;
        const wv = (y0: number, amp: number) =>
          doc.lines([[bw*0.38,-amp,bw*0.62,-amp,bw,0],[bw*0.38,amp,bw*0.62,amp,bw,0],
                     [bw*0.38,-amp,bw*0.62,-amp,bw,0],[bw*0.38,amp,bw*0.62,amp,bw,0]],
                    0, y0, [1, 1], 'S', false);
        doc.setGState(gS25);
        [26, 42, 60, 80, 102, 126, 152, 180, 210].forEach((y, idx) => wv(y, 1.0 + (idx % 3) * 0.35));
        doc.setGState(gS100);
      };

      // ── Portada ── diseño limpio · fondo blanco · tipografía navy · olas SVG · fotos ──
      const logoClienteDataUrl = logoClienteUrl ? await loadUrlAsDataUrl(logoClienteUrl) : null;

      // ── Procesamiento canvas para logo empresa en portada ──
      // Task 1: rotar -90° CCW (expand=true → canvas OH×OW) + alpha * opacity → watermark derecho
      // Task 2: si SVG → renderizar a canvas PNG (preservar colores) → header superior-izquierdo
      let logoWmDataUrl: string | null = null;
      let logoWmAW = 1, logoWmAH = 1;               // aspect ratio del logo tras la rotación
      let logoHdrDataUrl: string | null = logoClienteDataUrl;
      let logoHdrAW = 1, logoHdrAH = 1;             // aspect ratio para header

      if (logoClienteDataUrl) {
        // Obtener dimensiones originales
        const origDims = await new Promise<{w:number; h:number}>(res => {
          const img = new Image();
          img.onload  = () => res({w: img.naturalWidth,  h: img.naturalHeight});
          img.onerror = () => res({w: 1, h: 1});
          img.src = logoClienteDataUrl;
        });
        logoHdrAW = origDims.w; logoHdrAH = origDims.h;

        // Task 2 — SVG: renderizar con fondo transparente para preservar colores
        if (logoClienteDataUrl.startsWith('data:image/svg')) {
          await new Promise<void>(res => {
            const imgEl = new Image();
            imgEl.onload = () => {
              const PX = Math.max(350, origDims.w);
              const py = Math.round(PX * (origDims.h / origDims.w));
              const c = document.createElement('canvas');
              c.width = PX; c.height = py;
              const ctx = c.getContext('2d')!;
              ctx.clearRect(0, 0, PX, py);      // fondo transparente
              ctx.drawImage(imgEl, 0, 0, PX, py);
              logoHdrDataUrl = c.toDataURL('image/png');
              logoHdrAW = PX; logoHdrAH = py;
              res();
            };
            imgEl.onerror = () => res();
            imgEl.src = logoClienteDataUrl;
          });
        }

        // Task 1 — rotar con ángulo configurable (expand) y aplicar opacidad
        if (logoPortadaOpacity > 0) {
          await new Promise<void>(res => {
            const imgEl = new Image();
            imgEl.onload = () => {
              const OW = imgEl.naturalWidth, OH = imgEl.naturalHeight;
              const rotRad = (logoWmRotation * Math.PI) / 180;
              const cosA = Math.abs(Math.cos(rotRad));
              const sinA = Math.abs(Math.sin(rotRad));
              const cW = Math.ceil(OW * cosA + OH * sinA);
              const cH = Math.ceil(OW * sinA + OH * cosA);
              const c = document.createElement('canvas');
              c.width = cW; c.height = cH;
              const ctx = c.getContext('2d')!;
              ctx.translate(cW / 2, cH / 2);
              ctx.rotate(rotRad);
              ctx.drawImage(imgEl, -OW / 2, -OH / 2);
              // canal alpha = alpha * opacity
              const id = ctx.getImageData(0, 0, cW, cH);
              for (let i = 3; i < id.data.length; i += 4)
                id.data[i] = Math.round(id.data[i] * logoPortadaOpacity);
              ctx.putImageData(id, 0, 0);
              logoWmDataUrl = c.toDataURL('image/png');
              logoWmAW = cW; logoWmAH = cH;
              res();
            };
            imgEl.onerror = () => res();
            imgEl.src = logoClienteDataUrl;
          });
        }
      }

      // Paleta portada (igual para Engelbert y Certimar salvo acento)
      const CNVY: [number,number,number] = [27,  52, 100]; // #1B3464
      const CT1:  [number,number,number] = [74, 155, 196]; // #4A9BC4
      const CT2:  [number,number,number] = [107,206, 218]; // #6BCEDA
      const CB2:  [number,number,number] = [43, 108, 176]; // #2B6CB0
      const CB3:  [number,number,number] = [30,  71, 150]; // #1E4796
      const CMUT: [number,number,number] = [138,172, 191]; // muted blue-grey
      const CMID: [number,number,number] = [90, 122, 148]; // mid grey-blue
      const WB = PH - 14;                                  // wave bottom / footer top

      // ── 1. Fondo blanco ──
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, PW, PH, 'F');

      // ── 2. Franja superior navy (2mm) ──
      doc.setFillColor(...CNVY);
      doc.rect(0, 0, PW, 2, 'F');

      // ── 3. Header: logo ──
      // Escalar a 50mm de ancho manteniendo aspect ratio real del archivo
      let lH = 13; // fallback si no hay logo
      if (logo) {
        const logoAR = await new Promise<number>(resolve => {
          const img = new Image();
          img.onload  = () => resolve(img.naturalWidth / img.naturalHeight);
          img.onerror = () => resolve(300 / 199);
          img.src = logo;
        });
        lH = parseFloat((logoMarcaW / logoAR).toFixed(2));
        doc.addImage(logo, 'PNG', logoMarcaX, logoMarcaY, logoMarcaW, lH);
      }
      doc.setFont('courier', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...CNVY);
      doc.text(docCode, PW - 8, 9, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...CMID);
      doc.text(formatDateES(g.fechas.emision_certificado), PW - 8, 16, { align: 'right' });

      // BODY_Y: arranque del cuerpo justo debajo del logo + 4mm de margen
      const BODY_Y = parseFloat((logoMarcaY + lH + 4).toFixed(1));

      // ── 4. Barra vertical izquierda (acento) — empieza en BODY_Y, no atraviesa el logo ──
      doc.setFillColor(...CT1);
      doc.rect(11.5, BODY_Y, 1.1, 64, 'F');

      // ── 5. Texto del cuerpo — posiciones relativas a BODY_Y ──
      const TX = 21;

      // Título "INFORME TÉCNICO"
      doc.setFont('helvetica', 'bold'); doc.setFontSize(27); doc.setTextColor(...CNVY);
      doc.text('INFORME', TX, BODY_Y + 26);
      doc.text('TÉCNICO', TX, BODY_Y + 39);

      // Regla teal
      doc.setFillColor(...CT1);
      doc.rect(TX, BODY_Y + 43, 17, 0.9, 'F');

      // Subtítulo
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...CMID);
      doc.text('INSPECCIÓN SISTEMA DE MORTALIDAD — RES. N°1511/2021', TX, BODY_Y + 50);

      // Nombre del centro
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...CNVY);
      doc.text(doc.splitTextToSize(`CENTRO ${codigo} — ${cc.nombre_centro}`, PW - TX - 10).slice(0, 2), TX, BODY_Y + 59);

      // Nombre del titular — bajo el nombre del centro
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...CMUT);
      doc.text(cc.titular.toUpperCase(), TX, BODY_Y + 68, { maxWidth: PW - TX - 10 });

      // Meta: ref + fecha
      doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...CMID);
      doc.text(`${docCode}  ·  ${formatDateES(g.fechas.inspeccion_terreno)}`, TX, BODY_Y + 79);

      // Certificador
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...CMID);
      doc.text(`Cert: ${g.certificador.nombre}  ·  Reg. ${g.certificador.numero_registro}`, TX, BODY_Y + 86);

      // ── 5b. Task 1: Watermark logo empresa — posición y rotación configurables ──
      if (logoWmDataUrl) {
        const lwW = logoWmW;
        const lwH = logoWmW * (logoWmAH / logoWmAW);
        try { doc.addImage(logoWmDataUrl, 'PNG', logoWmX, logoWmY, lwW, lwH); } catch { /* skip */ }
      }

      // ── 6. Ondas (5 capas SVG traducidas a jsPDF, de claro a oscuro) ──
      // SVG viewBox 0 0 490 265 → PDF x=[0,PW] y=[159,WB]
      // Cada onda: 2 curvas quadratic→cubic + líneas de cierre hacia abajo

      // Wave 1 — #6BCEDA — empieza en Y≈186
      doc.setFillColor(...CT2);
      doc.lines([[36.1,-8.5, 72.3,-8.5, 108.4,0],[36.1,8.5, 72.0,8.3, 107.5,-0.8],[0,WB-185.4],[-215.9,0]],
        0, 186.2, [1,1], 'F', true);

      // Wave 2 — #4A9BC4 — Y≈196
      doc.setFillColor(...CT1);
      doc.lines([[37.6,-8.8, 74.0,-9.5, 109.3,-2.0],[35.8,8.0, 71.3,8.3, 106.6,0.8],[0,WB-195.0],[-215.9,0]],
        0, 196.2, [1,1], 'F', true);

      // Wave 3 — #2B6CB0 — Y≈206
      doc.setFillColor(...CB2);
      doc.lines([[34.7,-9.1, 71.1,-9.9, 109.3,-2.4],[38.1,8.5, 73.7,8.8, 106.6,0.8],[0,WB-204.6],[-215.9,0]],
        0, 206.2, [1,1], 'F', true);

      // Wave 4 — #1E4796 — Y≈216
      doc.setFillColor(...CB3);
      doc.lines([[33.2,-9.3, 69.6,-10.3, 109.3,-2.8],[39.6,7.5, 75.1,7.7, 106.6,0.8],[0,WB-214.2],[-215.9,0]],
        0, 216.2, [1,1], 'F', true);

      // Wave 5 — #1B3464 — Y≈226 (llena hasta el footer)
      doc.setFillColor(...CNVY);
      doc.lines([[31.7,-9.6, 68.2,-10.7, 109.3,-3.2],[41.1,7.5, 75.8,7.7, 106.6,0.8],[0,WB-223.8],[-215.9,0]],
        0, 226.2, [1,1], 'F', true);

      // ── 7. Tira de fotos paisaje/fondo portada (Y=237, H=28) — sobre las olas ──
      const TIRA_Y = 237, TIRA_H = 28;
      const fotosTecnicas = correctedImgs.filter(img =>
        (img.seccion === 'Paisaje' || img.enPortada) && img.url
      ).slice(0, 4);
      if (fotosTecnicas.length > 0) {
        const gap = 1.5, fw = (PW - gap * (fotosTecnicas.length - 1)) / fotosTecnicas.length;
        fotosTecnicas.forEach((img, idx) => {
          try { doc.addImage(img.url, 'JPEG', idx * (fw + gap), TIRA_Y, fw, TIRA_H); } catch { /* skip */ }
        });
      } else {
        const phColors: [number,number,number][] = [CT1, CB2, CT2, CB3];
        const fw = (PW - 1.5 * 3) / 4;
        phColors.forEach((c, idx) => { doc.setFillColor(...c); doc.rect(idx*(fw+1.5), TIRA_Y, fw, TIRA_H, 'F'); });
      }

      // ── 8. Footer (navy, H=14mm) ──
      doc.setFillColor(...CNVY);
      doc.rect(0, WB, PW, PH - WB, 'F');
      doc.setGState((doc as any).GState({ opacity: 0.75, 'fill-opacity': 0.75 }));
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
      doc.text('Mario Toral 101, Puerto Aysén', PW / 6, WB + 9, { align: 'center' });
      doc.text('+56 9 45052052', PW / 2, WB + 9, { align: 'center' });
      doc.text(isEngelbert ? 'eflores@engelbert.cl' : 'eflores@certimar.cl', PW * 5 / 6, WB + 9, { align: 'center' });
      doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));

      // ── helpers de posicionamiento ──
      const CONTENT_BOTTOM = PH - 22;
      const lastY = () => ((doc as any).lastAutoTable?.finalY ?? 30);
      const HEADER_CONTENT_Y = 25; // cabecera 22mm + 3mm margen
      const ensureSpace = (needed: number) => {
        if (lastY() + needed > CONTENT_BOTTOM) {
          doc.addPage();
          drawBodyWaves();
          (doc as any).lastAutoTable = { finalY: HEADER_CONTENT_Y };
        }
      };
      const sectionTitle = (text: string, size: number, y: number) => {
        doc.setTextColor(...AZUL_T);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
        doc.text(text, 14, y);
        doc.setTextColor(0, 0, 0);
      };

      // ── Índice (TOC) — entradas registradas durante la generación ──
      const tocEntries: { title: string; page: number; level: number }[] = [];
      const getPage = () => (doc as any).internal.getNumberOfPages();

      // ── Constantes de layout de fotos — declaradas aquí para que estén disponibles
      //    cuando addAerialSection (función hoistada) es llamada en la sección 1 ──
      const CAPTION_H = 9;   // altura para leyenda bajo la foto (mm)
      const IMG_ROW_H = 54;  // alto mínimo de la celda de imagen
      const estadoColor = (e: string): [number,number,number] =>
        e === 'Verde' ? [22,101,52] : e === 'Amarillo' ? [161,98,7] : [185,28,28];

      // ── Sección 1: Identificación del centro ──
      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '1   Identificación del centro', page: getPage(), level: 1 });
      sectionTitle('1  Identificación del centro', 14, 30);

      autoTable(doc, {
        startY: 36,
        margin: { top: 25 },
        pageBreak: 'avoid',
        body: [
          ['Empresa',              cc.titular],
          ['Centro',               cc.nombre_centro],
          ['Ubicación',            cc.ubicacion],
          ['Fecha inspección',     g.fechas.inspeccion_terreno],
          ['Formato del módulo',   cc.formato_modulo || '—'],
          ['Tamaño de las jaulas', cc.tamano_jaulas || '—'],
          ['A.C.S',                cc.acs],
          ['Nombre A/N Ensilaje',  cc.nombre_an_ensilaje || '—'],
          ['Coordenadas Ensilaje', cc.coordenadas_ensilaje || '—'],
        ],
        theme: 'striped',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, textColor: AZUL_MARINO } },
        alternateRowStyles: { fillColor: GRIS_FILA },
        styles: { fontSize: 9, cellPadding: 3, lineColor: BORDE_TABLA, lineWidth: 0.1, overflow: 'linebreak' },
      });

      // Fotos de ubicación espacial: justo tras la tabla de identificación
      addAerialSection('Ubicación Espacial');

      // 1.1 Proceso extracción
      // ensureSpace generoso: si hay menos de 115mm disponibles el título se mueve a una página
      // nueva donde cabrá junto con las primeras filas de la tabla (pageBreak: 'auto' = flujo natural).
      ensureSpace(115);
      const y11 = lastY() + 10;
      tocEntries.push({ title: '1.1  Proceso extracción', page: getPage(), level: 2 });
      sectionTitle('1.1  Proceso extracción', 12, y11);

      autoTable(doc, {
        startY: y11 + 5,
        margin: { top: 25 },
        body: [
          [{ content: 'Flujo de Proceso de Extracción', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold', fontSize: 9 } }],
          ['Extracción de mortalidad.', `Mediante sistema ${ext.parametros.sistema_principal} con compresor de aire.`],
          ['Sistema SEM.', `Sistema ${ext.parametros.sistema_principal} se encuentra en módulo / jaulas en simultáneo: ${ext.parametros.jaulas_simultaneas}, módulo de ${ext.parametros.numero_total_jaulas} jaulas tipo metálica en total.`],
          ['Traslado Mortalidad a plataforma de Ensilaje.', `Hacia ${cc.nombre_an_ensilaje || 'A/N Pontón'} por medio de tachos rotulados.`],
          ['Marca.',                 ext.parametros.marca_equipo],
          ['Capacidad nominal',      `${ext.parametros.jaulas_simultaneas} jaulas en simultáneo`],
          ['Marca/modelo equipo de aire.', g.modo_operacion_minima ? 'N/A' : ext.parametros.tipo_compresor],
          ['Potencia Extracción (CFM).', g.modo_operacion_minima ? 'N/A' : `${ext.parametros.potencia_cfm} CFM`],
          ['Ubicación del compresor.', ext.parametros.ubicacion_compresor || '—'],
        ],
        theme: 'striped',
        alternateRowStyles: { fillColor: GRIS_FILA },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold', textColor: AZUL_MARINO } },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
      });

      // 1.2 Información plataforma y circuitos
      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '1.2  Información plataforma y circuitos', page: getPage(), level: 2 });
      sectionTitle('1.2  Información plataforma y circuitos', 12, 30);

      autoTable(doc, {
        startY: 36,
        margin: { top: 25 },
        pageBreak: 'avoid',
        body: [
          [{ content: 'Información Plataforma, Equipos y Circuitos', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold' } }],
          [{ content: 'A/N Pontón.', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Eslora',  sto.infraestructura.eslora_m  ? `${sto.infraestructura.eslora_m} m` : '—'],
          ['Manga',   sto.infraestructura.manga_m   ? `${sto.infraestructura.manga_m} m` : '—'],
          ['Puntual', sto.infraestructura.puntual_m ? `${sto.infraestructura.puntual_m} m` : '—'],
          [{ content: '(Olla trituradora)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Marca', den.equipos.marca_modelo],
          ['Material', den.equipos.material_construccion],
          ['Capacidad de Proceso Nominal', `${den.equipos.velocidad_nominal_kg_hr} Kg/hr`],
          ['Estado (bien, mal, sin fugas)', den.equipos.estado_olla === 'Bueno' ? 'Buen estado, sin fugas.' : den.equipos.estado_olla === 'Regular' ? 'Estado regular, presenta observaciones.' : 'Mal estado, requiere revisión.'],
          ['Señalar si cuenta con prepicador y Recirculación de ácido', (() => {
            const parts: string[] = [];
            if (den.equipos.cuenta_con_prepicador) {
              const mdl = den.equipos.marca_modelo_prepicador ? ` (${den.equipos.marca_modelo_prepicador})` : '';
              const cap = den.equipos.capacidad_prepicador_kg_hr ? `, ${den.equipos.capacidad_prepicador_kg_hr} Kg/Hr` : '';
              parts.push(`Cuenta con prepicador${mdl}${cap}.`);
            }
            if (den.equipos.cuenta_con_recirculacion_acido) parts.push('Cuenta con sistema de recirculación de ácido.');
            return parts.length > 0 ? parts.join(' ') : '—';
          })()],
          [{ content: '(Pretil)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Material', sto.infraestructura.pretil_material],
          ['Estado (bien, mal, sin fugas)', sto.infraestructura.pretil_estado === 'Bueno' ? 'Buen estado sin fugas.' : sto.infraestructura.pretil_estado],
          [{ content: '(Piping)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Material', sto.infraestructura.piping_material],
          ['Diámetro (pulgadas)', sto.infraestructura.piping_diametro],
          ['Válvulas', sto.infraestructura.piping_valvulas],
        ],
        theme: 'grid',
        columnStyles: { 0: { cellWidth: 95 } },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // 1.3 Generación eléctrica
      ensureSpace(65);
      const y13 = lastY() + 10;
      tocEntries.push({ title: '1.3  Capacidad Generación Eléctrica', page: getPage(), level: 2 });
      sectionTitle('1.3  Capacidad Generación Eléctrica', 12, y13);

      if (den.generacion_electrica.length > 0) {
        autoTable(doc, {
          startY: y13 + 5,
          margin: { top: 25 },
          head: [['Tipo', 'Marca', 'Modelo', 'Capacidad (KVA)', 'Ubicación']],
          body: den.generacion_electrica.map(ge => [ge.tipo, ge.marca, ge.modelo, String(ge.capacidad_kva), ge.ubicacion]),
          theme: 'grid',
          headStyles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: GRIS_FILA },
          styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
        });
      } else {
        autoTable(doc, {
          startY: y13 + 5,
          margin: { top: 25 },
          body: [['Sin generadores registrados', '—', '—', '—', '—']],
          theme: 'grid', styles: { fontSize: 8.5, cellPadding: 2.5 },
        });
      }

      // 1.4 Desnaturalización y almacenamiento
      ensureSpace(95);
      const y14 = lastY() + 10;
      tocEntries.push({ title: '1.4  Desnaturalización y almacenamiento', page: getPage(), level: 2 });
      sectionTitle('1.4  Desnaturalización y almacenamiento.', 12, y14);

      autoTable(doc, {
        startY: y14 + 5,
        margin: { top: 25 },
        body: [
          [{ content: 'Equipo de Desnaturalización y capacidades', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold' as const } }],
          ...(den.incinerador.activo ? [['Número de plataformas de desnaturalización.', '2 (Ensilaje + Incinerador)']] : []),
          ['Número ollas trituradoras.', String(den.equipos.cantidad_ollas ?? 1)],
          ['Capacidad de procesamiento Nominal (kg/h).', `${den.equipos.velocidad_nominal_kg_hr} Kg/h`],
          ['Horas de funcionamiento al día.', `${den.equipos.horas_funcionamiento_dia} hrs.`],
          ['Marca.', den.equipos.marca_modelo],
          [{ content: '(Por cada olla trituradora)', colSpan: 2, styles: { fontStyle: 'bold' as const } }],
          ['Material.', den.equipos.material_construccion],
          ['Estado (bien, mal, sin fugas).', 'Buen estado sin fugas y óxido nivel medio.'],
          ['Señalar si cuenta con prepicador y dosificación de ácido.', (() => {
            const parts: string[] = [];
            if (den.equipos.cuenta_con_prepicador) {
              const mdl = den.equipos.marca_modelo_prepicador ? ` (${den.equipos.marca_modelo_prepicador})` : '';
              const cap = den.equipos.capacidad_prepicador_kg_hr ? `, ${den.equipos.capacidad_prepicador_kg_hr} Kg/Hr` : '';
              parts.push(`Cuenta con prepicador${mdl}${cap}.`);
            }
            if (den.equipos.cuenta_con_recirculacion_acido) parts.push('Cuenta con sistema de recirculación de ácido.');
            return parts.length > 0 ? parts.join(' ') : '—';
          })()],
          ...(den.incinerador.activo ? [
            [{ content: 'Sistema Secundario de Desnaturalización (Incinerador)', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold' as const } }],
            ['Marca/Modelo.', den.incinerador.marca_modelo],
            ['Observaciones.', den.incinerador.observaciones || '—'],
          ] : []),
          [{ content: 'Almacenamiento.', colSpan: 2, styles: { fontStyle: 'bold' as const } }],
          ['Capacidad.', `Estanque con capacidad para ${sto.parametros.capacidad_almacenaje_m3} m³ con recirculación.`],
        ],
        theme: 'striped',
        alternateRowStyles: { fillColor: GRIS_FILA },
        columnStyles: { 0: { cellWidth: 95, fontStyle: 'bold', textColor: AZUL_MARINO } },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
      });

      // ── Foto olla trituradora (tras tabla 1.4) si fue subida ──
      {
        const ollaImg = correctedImgs.find(img =>
          img.seccion === 'Desnaturalización' && img.leyenda?.toLowerCase().includes('olla')
        ) ?? correctedImgs.find(img => img.seccion === 'Desnaturalización');
        if (ollaImg?.url) {
          // OH_nat: alto natural de la imagen a OW de ancho (mantiene relación de aspecto)
          const OW = 120;
          let OH_nat = 80;
          try {
            const tmp = new Image();
            tmp.src = ollaImg.url;
            if (tmp.naturalWidth > 0) OH_nat = Math.round(OW * tmp.naturalHeight / tmp.naturalWidth);
          } catch { /* usa OH_nat por defecto */ }
          OH_nat = Math.min(Math.max(OH_nat, 60), 120);

          // OH_cell: altura de la celda — se ajusta al espacio disponible para no crear página vacía
          const CAPTION_OLLA = 9;
          const spaceLeft = CONTENT_BOTTOM - lastY() - 14;
          const OH_cell = spaceLeft >= 40 ? Math.min(OH_nat, spaceLeft) : OH_nat;
          if (spaceLeft < 40) ensureSpace(OH_cell + 22);

          autoTable(doc, {
            startY: lastY() + 8,
            margin: { top: 25, left: (PW - OW) / 2 },
            rowPageBreak: 'avoid',
            body: [[{ content: '', styles: { cellWidth: OW, minCellHeight: OH_cell, cellPadding: 0 } }]],
            theme: 'plain', styles: { fontSize: 0 }, tableWidth: OW,
            didDrawCell: (data: any) => {
              if (data.section !== 'body') return;
              try {
                // Dibujar manteniendo relación de aspecto (letter-box vertical)
                const availW = data.cell.width - 4;
                const availH = data.cell.height - CAPTION_OLLA - 4;
                const scale  = Math.min(availW / OW, availH / OH_nat);
                const dw = OW * scale;
                const dh = OH_nat * scale;
                const dx = data.cell.x + 2 + (availW - dw) / 2;
                const dy = data.cell.y + 2;
                doc.addImage(ollaImg.url, 'JPEG', dx, dy, dw, dh);
                if (ollaImg.leyenda) {
                  doc.setFontSize(7.5); doc.setTextColor(40,40,40); doc.setFont('helvetica','normal');
                  const cl = doc.splitTextToSize(ollaImg.leyenda, data.cell.width - 4);
                  doc.text(cl, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height - CAPTION_OLLA + 3, { align: 'center' });
                }
              } catch { /* skip */ }
            },
          });
        }
      }

      // ── Sección 2: Metodología ──
      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '2   Metodología de trabajo', page: getPage(), level: 1 });
      sectionTitle('2  Metodología de trabajo para la inspección del módulo', 14, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(0,0,0);

      // Párrafos 1 y 2 — texto justificado
      const metPre = [
        'Se procede a la revisión documental y posterior visita de campo al objeto de certificar que los sistemas o equipos de extracción, desnaturalización y almacenamiento de la mortalidad tienen las capacidades indicadas por el mandante.',
        '',
        'Según la Res 1511, los centros de cultivo deberán acreditar: a) una capacidad mínima de extracción diaria de 15 toneladas de mortalidad; b) una capacidad mínima de desnaturalización diaria de 15 toneladas de mortalidad; y c) disponen de un sistema de almacenamiento, con una capacidad mínima diaria de 20 toneladas de biomasa.',
      ];
      let curY = 38;
      for (const line of metPre) {
        if (line === '') { curY += 4; continue; }
        const lines = doc.splitTextToSize(line, 182);
        doc.text(lines, 14, curY, { align: 'justify', maxWidth: 182 });
        curY += lines.length * 6 + 2;
      }
      // Sincronizar lastY con la posición actual del texto manual
      (doc as any).lastAutoTable = { finalY: curY };

      // Imágenes de extracción (Imagen 2, 3, 4) — 1 fila, 3 columnas, centrado
      {
        const ext234 = (() => {
          const byLabel = correctedImgs.filter(img =>
            img.seccion === 'Extracción' &&
            ['Imagen 2','Imagen 3','Imagen 4'].some(t => img.leyenda === t)
          );
          return byLabel.length >= 3 ? byLabel.slice(0,3)
            : correctedImgs.filter(img => img.seccion === 'Extracción').slice(0,3);
        })();
        if (ext234.length > 0) {
          const TOTAL_W = 180;
          const EW = Math.floor(TOTAL_W / 3); // ~60mm cada columna
          const EH = 55;
          const eMargin = (PW - TOTAL_W) / 2;
          ensureSpace(EH + 20);
          autoTable(doc, {
            startY: lastY() + 6,
            margin: { top: 25, left: eMargin },
            rowPageBreak: 'avoid',
            body: [[
              { content: '', styles: { cellWidth: EW, minCellHeight: EH, cellPadding: 0 } },
              { content: '', styles: { cellWidth: EW, minCellHeight: EH, cellPadding: 0 } },
              { content: '', styles: { cellWidth: EW, minCellHeight: EH, cellPadding: 0 } },
            ]],
            theme: 'plain', styles: { fontSize: 0 },
            columnStyles: { 0: { cellWidth: EW }, 1: { cellWidth: EW }, 2: { cellWidth: EW } },
            tableWidth: TOTAL_W,
            didDrawCell: (data: any) => {
              if (data.section !== 'body') return;
              const img = ext234[data.column.index];
              if (!img?.url) return;
              try {
                doc.addImage(img.url, 'JPEG', data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2);
              } catch { /* skip */ }
            },
          });
          // Caption grupal
          ensureSpace(12);
          doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(40,40,40);
          const capText = 'Imagen 2 – 3 – 4. Sistemas de extracción de mortalidad presentes en el módulo de cultivo.';
          doc.text(capText, PW / 2, lastY() + 7, { align: 'center' });
          doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
          curY = lastY() + 14;
          (doc as any).lastAutoTable = { finalY: curY };
        }
      }

      // Párrafo 3
      ensureSpace(50); // espacio para el párrafo + tabla de colores
      curY = lastY() + 6;
      const metPost = 'La metodología utilizada para la certificación de las capacidades de los sistemas o equipos de extracción, desnaturalización y almacenamiento de mortalidad en centros de cultivos de salmones, está en conformidad con el artículo 25 del D.S. Nº 15 de 2011, del Ministerio de Economía, Fomento y Turismo. La información se almacena en plataforma interactiva y se tabula empleando código de colores, como se puede ver en la siguiente tabla:';
      const metPostLines = doc.splitTextToSize(metPost, 182);
      doc.setTextColor(0,0,0);
      doc.text(metPostLines, 14, curY, { align: 'justify', maxWidth: 182 });
      curY += metPostLines.length * 6 + 4;

      autoTable(doc, {
        startY: curY + 2,
        pageBreak: 'avoid',
        body: [
          [{ content: '', styles: { fillColor: [0, 176, 80] as [number,number,number], cellWidth: 12 } }, 'Bueno', 'Sin Observaciones'],
          [{ content: '', styles: { fillColor: [255, 255, 0] as [number,number,number], cellWidth: 12 } }, 'Regular', 'Recomendación'],
          [{ content: '', styles: { fillColor: [255, 0, 0] as [number,number,number], cellWidth: 12 } }, 'Malo', 'Debe ser revisado y solucionado'],
        ],
        theme: 'grid',
        columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 30 } },
        styles: { fontSize: 9, cellPadding: 3 },
        tableWidth: 120,
        margin: { left: 40 },
      });

      // Texto conclusivo tras la tabla de colores
      {
        const concText = '    Las observaciones evaluadas como "Regular" son recomendaciones de mejoras que permiten extender la vida útil de los elementos, y también sirven para la programación de mantenciones. Y para las observaciones evaluadas como "Malo" se recomienda su revisión y corrección.';
        ensureSpace(20);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
        const concLines = doc.splitTextToSize(concText, 182);
        doc.text(concLines, 14, lastY() + 10, { align: 'justify', maxWidth: 182 });
        (doc as any).lastAutoTable = { finalY: lastY() + 10 + concLines.length * 6 };
      }

      // ── Sección 3: Inspección de terreno ──

      /** Tabla con bordes — cabecera azul — foto + leyenda visible */
      const addPhotoSection = (seccion: ImageSeccion) => {
        const imgs = correctedImgs.filter(img => img.seccion === seccion);
        if (imgs.length === 0) {
          ensureSpace(14);
          autoTable(doc, {
            startY: lastY() + 6,
            body: [['Sin imágenes registradas para esta sección.']],
            theme: 'plain', styles: { fontSize: 8.5, textColor: [130,130,130] },
          });
          return;
        }
        for (let i = 0; i < imgs.length; i += 3) {
          const row = imgs.slice(i, i + 3);
          // Saltar de página si no cabe la cabecera + la fila completa
          ensureSpace(IMG_ROW_H + 14);
          autoTable(doc, {
            startY: lastY() + 4,
            margin: { top: 25, left: 8, right: 8 },
            rowPageBreak: 'avoid',
            head: [['DECLARADO / Estado', '#1', '#2', '#3']],
            body: [[
              { content: `${row[0].observacion || 'CUMPLE CON LO DECLARADO'}\n${row[0].estado}`, styles: { valign: 'top', fontSize: 8 } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
            ]],
            theme: 'grid',
            headStyles: { fillColor: [31,73,125] as [number,number,number], textColor: [255,255,255], fontSize: 8.5, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 } },
            didDrawCell: (data: any) => {
              if (data.section === 'body' && data.column.index >= 1) {
                const img = row[data.column.index - 1];
                if (img?.url) {
                  try {
                    const imgAreaH = data.cell.height - CAPTION_H;
                    doc.addImage(img.url, 'JPEG', data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, Math.max(imgAreaH - 1, 2));
                    if (img.leyenda) {
                      doc.setFontSize(6.5);
                      doc.setTextColor(30, 30, 30);
                      doc.setFont('helvetica', 'normal');
                      const captionLines = doc.splitTextToSize(img.leyenda, data.cell.width - 4);
                      doc.text(captionLines, data.cell.x + data.cell.width / 2, data.cell.y + imgAreaH + 4, { align: 'center' });
                    }
                  } catch { /* skip si la imagen falla */ }
                }
              }
              if (data.section === 'body' && data.column.index === 0) {
                // Pastilla semáforo con texto (legible en escala de grises)
                const badgeW = 26, badgeH = 5, badgeR = 1.1;
                const bx = data.cell.x + (data.cell.width - badgeW) / 2;
                const by = data.cell.y + (data.cell.height - badgeH) / 2;
                const est = row[0].estado;
                const [br, bg, bb]: [number,number,number] =
                  est === 'Verde'    ? [26, 122, 60]  :
                  est === 'Amarillo' ? [184, 134, 11] : [139, 26, 26];
                const badgeLabel =
                  est === 'Verde'    ? 'CONFORME'    :
                  est === 'Amarillo' ? 'OBSERVACIÓN' : 'NO CONFORME';
                doc.setFillColor(br, bg, bb);
                doc.roundedRect(bx, by, badgeW, badgeH, badgeR, badgeR, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
                doc.text(badgeLabel, bx + badgeW / 2, by + badgeH - 1.2, { align: 'center' });
                doc.setTextColor(0, 0, 0);
              }
            },
          });
        }
      };

      /**
       * Grilla aérea — layout 2×2:
       *   Fila 0 (full-width): imagen con "estructura" / "módulo" en leyenda
       *   Fila 1 col 0: imagen con "diagonal" / "arreglo"
       *   Fila 1 col 1: imagen con "aérea" / "general" / "contexto"
       */
      // eslint-disable-next-line no-inner-declarations
      function addAerialSection(seccion: ImageSeccion) {
        const imgs = correctedImgs.filter(img => img.seccion === seccion);
        if (imgs.length === 0) {
          autoTable(doc, {
            startY: lastY() + 6,
            body: [['Sin imágenes de ubicación espacial registradas.']],
            theme: 'plain', styles: { fontSize: 8.5, textColor: [130,130,130] },
          });
          return;
        }

        const kw = (img: typeof imgs[0], ...words: string[]) =>
          words.some(w => img.leyenda?.toLowerCase().includes(w.toLowerCase()));

        const bySlot = (slot: 'top' | 'left' | 'right' | 'bottom') => imgs.find(i => i.slotUbicacion === slot);
        const noSlot = imgs.filter(i => !i.slotUbicacion);

        const imgEstructura = bySlot('top')
          ?? noSlot.find(i => kw(i, 'estructura', 'módulo'))
          ?? noSlot[0];

        const imgDiagonal = bySlot('left')
          ?? noSlot.find(i => kw(i, 'diagonal', 'arreglo') && i !== imgEstructura)
          ?? noSlot.find(i => i !== imgEstructura);

        const imgAerea = bySlot('right')
          ?? noSlot.find(i => kw(i, 'aérea', 'general', 'contexto') && i !== imgEstructura && i !== imgDiagonal)
          ?? noSlot.find(i => i !== imgEstructura && i !== imgDiagonal);

        const imgBottom = bySlot('bottom')
          ?? noSlot.find(i => i !== imgEstructura && i !== imgDiagonal && i !== imgAerea);

        const FULL_W = 182, FULL_H = 65;  // reducido para dejar espacio a las tablas de datos
        const HALF_W = FULL_W / 2;  // 91mm — igual que la mitad de la fila superior
        const HALF_H = 50;
        const mLeft = (PW - FULL_W) / 2;

        const drawCaption = (img: typeof imgs[0], cx: number, cy: number, cw: number, cellH: number) => {
          if (!img?.leyenda) return;
          doc.setFontSize(7); doc.setTextColor(40,40,40); doc.setFont('helvetica','normal');
          const cl = doc.splitTextToSize(img.leyenda, cw - 4);
          doc.text(cl, cx + cw / 2, cy + cellH - CAPTION_H + 4, { align: 'center' });
        };

        // Fila 0: imagen estructure / módulo — ancho completo
        // Reservar espacio para AMBAS filas juntas para evitar que la fila 1
        // quede sola en una página nueva (FULL_H + HALF_H + 30 ≈ 168mm ≤ 250mm disponibles).
        if (imgEstructura?.url) {
          ensureSpace(FULL_H + HALF_H + 30);
          autoTable(doc, {
            startY: lastY() + 6,
            margin: { top: 25, left: mLeft },
            rowPageBreak: 'avoid',
            body: [[{ content: '', styles: { cellWidth: FULL_W, minCellHeight: FULL_H, cellPadding: 0 } }]],
            theme: 'plain', styles: { fontSize: 0 }, tableWidth: FULL_W,
            didDrawCell: (data: any) => {
              if (data.section !== 'body') return;
              try {
                // Images are pre-cropped to cover the slot AR — fill the box directly
                const boxW = data.cell.width - 4, boxH = Math.max(data.cell.height - CAPTION_H - 2, 2);
                doc.addImage(imgEstructura.url, 'JPEG', data.cell.x + 2, data.cell.y + 2, boxW, boxH);
                drawCaption(imgEstructura, data.cell.x, data.cell.y, data.cell.width, data.cell.height);
              } catch { /* skip */ }
            },
          });
        }

        // Fila 1: diagonal (izq) + aérea (der)
        const pair: (typeof imgs[0] | undefined)[] = [imgDiagonal, imgAerea];
        ensureSpace(HALF_H + 14);
        autoTable(doc, {
          startY: lastY() + 4,
          margin: { top: 25, left: mLeft },
          rowPageBreak: 'avoid',
          body: [[
            { content: '', styles: { cellWidth: HALF_W, minCellHeight: HALF_H, cellPadding: 0 } },
            { content: '', styles: { cellWidth: HALF_W, minCellHeight: HALF_H, cellPadding: 0 } },
          ]],
          theme: 'plain', styles: { fontSize: 0 }, tableWidth: FULL_W,
          columnStyles: { 0: { cellWidth: HALF_W }, 1: { cellWidth: HALF_W } },
          didDrawCell: (data: any) => {
            if (data.section !== 'body') return;
            const img = pair[data.column.index];
            if (!img?.url) return;
            try {
              const boxW = data.cell.width - 4, boxH = Math.max(data.cell.height - CAPTION_H - 2, 2);
              doc.addImage(img.url, 'JPEG', data.cell.x + 2, data.cell.y + 2, boxW, boxH);
              drawCaption(img, data.cell.x, data.cell.y, data.cell.width, data.cell.height);
            } catch { /* skip */ }
          },
        });

        // Fila 2: foto ancha inferior — ancho completo (igual que fila 0)
        if (imgBottom?.url) {
          ensureSpace(FULL_H + 14);
          autoTable(doc, {
            startY: lastY() + 4,
            margin: { top: 25, left: mLeft },
            rowPageBreak: 'avoid',
            body: [[{ content: '', styles: { cellWidth: FULL_W, minCellHeight: FULL_H, cellPadding: 0 } }]],
            theme: 'plain', styles: { fontSize: 0 }, tableWidth: FULL_W,
            didDrawCell: (data: any) => {
              if (data.section !== 'body') return;
              try {
                const boxW = data.cell.width - 4, boxH = Math.max(data.cell.height - CAPTION_H - 2, 2);
                doc.addImage(imgBottom.url, 'JPEG', data.cell.x + 2, data.cell.y + 2, boxW, boxH);
                drawCaption(imgBottom, data.cell.x, data.cell.y, data.cell.width, data.cell.height);
              } catch { /* skip */ }
            },
          });
        }
      }

      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '3   Inspección de terreno', page: getPage(), level: 1 });
      tocEntries.push({ title: '3.1  Extracción', page: getPage(), level: 2 });
      sectionTitle('3  Inspección de terreno', 14, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(60,60,60);
      doc.text('A continuación, se presentan los resultados de la inspección con desviaciones y observaciones de lo declarado vs lo inspeccionado en terreno.', 14, 38);
      sectionTitle('3.1  Extracción', 12, 46);
      autoTable(doc, { startY: 51, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Extracción');

      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '3.2  Desnaturalización', page: getPage(), level: 2 });
      sectionTitle('3.2  Desnaturalización.', 12, 30);
      autoTable(doc, { startY: 36, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Desnaturalización');

      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '3.3  Almacenamiento', page: getPage(), level: 2 });
      sectionTitle('3.3  Almacenamiento.', 12, 30);
      autoTable(doc, { startY: 36, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Almacenamiento');

      // ── Sección 4: Conclusiones ──
      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '4   Conclusiones inspección de estructuras', page: getPage(), level: 1 });
      sectionTitle('4  Conclusiones inspección de estructuras', 14, 30);

      // Helper para olas decorativas cerca de la firma
      const drawConcWave = (y0: number, amp: number) => {
        doc.setDrawColor(168, 200, 232);
        doc.setLineWidth(0.35);
        const ww = PW / 4;
        doc.lines(
          [[ww*0.38,-amp,ww*0.62,-amp,ww,0],[ww*0.38,amp,ww*0.62,amp,ww,0],
           [ww*0.38,-amp,ww*0.62,-amp,ww,0],[ww*0.38,amp,ww*0.62,amp,ww,0]],
          0, y0, [1, 1], 'S', false
        );
      };

      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      const certifica = calculatedExtraction.cumple_norma && calculatedDenaturation.cumple_norma && calculatedStorage.cumple_norma;
      const concClusion = `Con base en las observaciones encontradas, se puede concluir que los sistemas o equipos de extracción, desnaturalización y almacenamiento de la mortalidad en el centro de cultivo ${cc.nombre_centro ? cc.nombre_centro + '  SIEP – ' + codigo : codigo}, dan cumplimiento a las capacidades mínimas establecidas en el artículo 4° A del D.S. N.º 320 de 2001, del Ministerio de Economía, Fomento y Turismo. Esto fue resuelto una vez realizada tanto la evaluación documental como la verificación en terreno el día ${formatDateES(g.fechas.inspeccion_terreno)}; por lo tanto, ${certifica ? 'ES CERTIFICABLE' : 'NO ES CERTIFICABLE'}.`;
      const cLines = doc.splitTextToSize(concClusion, 182);
      doc.text(cLines, 14, 38, { align: 'justify', maxWidth: 182 });

      // Zona de firma — replicar layout del certificado
      const firmY = 38 + cLines.length * 6 + 28;
      // Ondas decorativas de fondo sobre la firma
      [firmY - 18, firmY - 12, firmY - 6].forEach((y, idx) =>
        drawConcWave(y, 1.0 + idx * 0.3)
      );
      // Línea azul decorativa centrada
      doc.setDrawColor(...(isEngelbert ? [210, 65, 10] as [number,number,number] : [26, 58, 92] as [number,number,number])); doc.setLineWidth(0.5);
      doc.line(55, firmY, PW - 55, firmY);
      // Nombre certificador
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
      doc.text(g.certificador.nombre, PW / 2, firmY + 7, { align: 'center' });
      // RUT | Registro
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(
        `RUT: ${g.certificador.rut}   |   Registro: ${g.certificador.numero_registro}`,
        PW / 2, firmY + 13, { align: 'center' }
      );
      // Fecha de emisión — igual a la fecha de inspección en terreno
      doc.text(
        `Fecha de emisión: ${formatDateES(g.fechas.inspeccion_terreno)}`,
        PW / 2, firmY + 19, { align: 'center' }
      );

      // ── Sección 5: Registro de visita ──
      doc.addPage();
      drawBodyWaves();
      tocEntries.push({ title: '5   Registro de visita', page: getPage(), level: 1 });
      sectionTitle('5  Registro de visita.', 14, 30);

      {
        const snapshots = registroVisitaRef.current ?? [];
        const FRAME_X = 14;
        const FRAME_Y = 37;
        const FRAME_W = PW - 28;
        const FRAME_H = CONTENT_BOTTOM - FRAME_Y;

        if (snapshots.length === 0) {
          autoTable(doc, {
            startY: FRAME_Y + 4,
            body: [['Sin registro de visita adjunto.']],
            theme: 'plain',
            styles: { fontSize: 8.5, textColor: [130, 130, 130] as [number, number, number] },
          });
        } else {
          for (let i = 0; i < snapshots.length; i++) {
            try {
              if (i > 0) {
                doc.addPage();
                drawBodyWaves();
                const FY2 = 25;
                const FH2 = CONTENT_BOTTOM - FY2;
                doc.setDrawColor(...BORDE_TABLA);
                doc.setLineWidth(0.4);
                doc.rect(FRAME_X, FY2, FRAME_W, FH2);
                doc.addImage(snapshots[i], 'JPEG', FRAME_X + 1, FY2 + 1, FRAME_W - 2, FH2 - 2, '', 'FAST');
              } else {
                doc.setDrawColor(...BORDE_TABLA);
                doc.setLineWidth(0.4);
                doc.rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
                doc.addImage(snapshots[i], 'JPEG', FRAME_X + 1, FRAME_Y + 1, FRAME_W - 2, FRAME_H - 2, '', 'FAST');
              }
            } catch { /* página corrupta — se omite sin crashear el PDF */ }
          }
        }
      }


      // ── Insertar página de índice en posición 2 y dibujarla ──
      doc.insertPage(2);
      doc.setPage(2);
      drawBodyWaves();

      const TOC_LEFT  = 18;
      const TOC_RIGHT = PW - 18;
      const PAGE_COL  = TOC_RIGHT;

      // Título
      let tocY = 38;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...AZUL_T);
      doc.text('ÍNDICE DE CONTENIDO', PW / 2, tocY, { align: 'center' });

      // Doble línea decorativa bajo el título
      tocY += 5;
      doc.setDrawColor(...AZUL_H);
      doc.setLineWidth(0.7);
      doc.line(TOC_LEFT, tocY, TOC_RIGHT, tocY);
      doc.setLineWidth(0.15);
      doc.setDrawColor(...AZUL_D);
      doc.line(TOC_LEFT, tocY + 1.8, TOC_RIGHT, tocY + 1.8);
      tocY += 12;

      for (let i = 0; i < tocEntries.length; i++) {
        const entry     = tocEntries[i];
        const finalPage = entry.page + 1; // +1 porque la página de índice fue insertada
        const isL1      = entry.level === 1;
        const indent    = isL1 ? TOC_LEFT : TOC_LEFT + 9;
        const fSize     = isL1 ? 10.5 : 9;

        // Franja de fondo para entradas nivel 1
        if (isL1) {
          doc.setFillColor(...(isEngelbert
            ? [255, 248, 242] as [number,number,number]
            : [245, 248, 254] as [number,number,number]));
          doc.rect(TOC_LEFT - 3, tocY - 5.8, TOC_RIGHT - TOC_LEFT + 6, 9, 'F');
        }

        // Medir anchos con el font correcto antes de dibujar
        doc.setFont('helvetica', isL1 ? 'bold' : 'normal');
        doc.setFontSize(fSize);
        const titleW  = doc.getTextWidth(entry.title);
        const pageStr = String(finalPage);
        const pageW   = doc.getTextWidth(pageStr);

        // Título
        doc.setTextColor(...(isL1 ? AZUL_T : [55, 55, 55] as [number,number,number]));
        doc.text(entry.title, indent, tocY);

        // Número de página (alineado a la derecha)
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...(isL1 ? AZUL_T : [80, 80, 80] as [number,number,number]));
        doc.text(pageStr, PAGE_COL, tocY, { align: 'right' });

        // Guía de puntos entre título y número de página
        const dotsStart = indent + titleW + 3;
        const dotsEnd   = PAGE_COL - pageW - 3;
        doc.setFontSize(8);
        doc.setTextColor(isL1 ? 160 : 195, isL1 ? 160 : 195, isL1 ? 160 : 195);
        const dotW = doc.getTextWidth('.');
        for (let dx = dotsStart; dx < dotsEnd - dotW; dx += dotW + 0.7) {
          doc.text('.', dx, tocY);
        }

        // Separador tenue al pasar de sub-sección a nueva sección principal
        if (entry.level === 2 && i < tocEntries.length - 1 && tocEntries[i + 1].level === 1) {
          tocY += 4;
          doc.setDrawColor(210, 215, 225);
          doc.setLineWidth(0.1);
          doc.line(TOC_LEFT, tocY - 2, TOC_RIGHT, tocY - 2);
        }

        tocY += isL1 ? 12 : 8.5;
      }

      // Añadir frames (header/footer + ondas) a todas las páginas excepto portada
      addInformePageFrame(doc, docCode, logo, 'Informe Técnico');

      const filename = `${codigo}-${formatFileDate(g.fechas.emision_certificado)}-INFORME.pdf`;
      const informeBlob = doc.output('blob');
      doc.save(filename);
      setShowEmailModal(true);
      const informeDocId = ensureDocId();
      uploadDocToStorage(informeBlob, informeDocId, 'informe')
        .then(url => saveToHistorico('informe', url))
        .catch(() => saveToHistorico('informe'));
      logEvento('generar_informe', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
    } finally { setGenerating(null); }
  };

  // useDropzone hoisted here so ReportView can be called as a plain function
  const { getRootProps: dropzoneRootProps, getInputProps: dropzoneInputProps, isDragActive } = useDropzone({
    onDrop: addImage,
    accept: { 'image/*': [] }
  } as any);

  // --- StatsView ---

  const StatsView = () => {
    const [eventos, setEventos] = useState<(EventoUso & { id: string })[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [filtro, setFiltro] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    useEffect(() => {
      // Solo cargar datos cuando el tab está activo
      if (activeTab !== 'stats' || !isAdmin) return;
      setStatsLoading(true);
      import('firebase/firestore').then(async ({ collection, getDocs, orderBy, query, limit }) => {
        const { db } = await import('./firebase');
        const q = query(collection(db, 'eventos_uso'), orderBy('fecha', 'desc'), limit(1000));
        const snap = await getDocs(q);
        setEventos(snap.docs.map(d => ({ id: d.id, ...(d.data() as EventoUso) })));
      }).catch(console.error).finally(() => setStatsLoading(false));
    }, [activeTab, isAdmin]);

    const eventosFiltrados = useMemo(() => {
      if (filtro === 'all') return eventos;
      const dias = filtro === '7d' ? 7 : filtro === '30d' ? 30 : 90;
      const cutoff = Date.now() - dias * 24 * 60 * 60 * 1000;
      return eventos.filter(e => {
        const ts = e.fecha?.toMillis?.() ?? (e.fecha?.seconds ? e.fecha.seconds * 1000 : 0);
        return ts >= cutoff;
      });
    }, [eventos, filtro]);

    const kpis = useMemo(() => {
      const sesiones = eventosFiltrados.filter(e => e.tipo === 'login').length;
      const docs = eventosFiltrados.filter(e => ['generar_certificado','generar_informe','generar_acta'].includes(e.tipo));
      const docsTotal = docs.length;
      const centrosUnicos = new Set(eventosFiltrados.filter(e => e.codigoCentro).map(e => e.codigoCentro)).size;
      const usuariosUnicos = new Set(eventosFiltrados.map(e => e.usuario)).size;
      const certCount = eventosFiltrados.filter(e => e.tipo === 'generar_certificado').length;
      const informeCount = eventosFiltrados.filter(e => e.tipo === 'generar_informe').length;
      const actaCount = eventosFiltrados.filter(e => e.tipo === 'generar_acta').length;
      return { sesiones, docsTotal, centrosUnicos, usuariosUnicos, certCount, informeCount, actaCount };
    }, [eventosFiltrados]);

    const porDia = useMemo(() => {
      const dias = filtro === '7d' ? 7 : filtro === '30d' ? 30 : filtro === '90d' ? 90 : 90;
      const map: Record<string, { cert: number; informe: number; acta: number; otros: number }> = {};
      const now = new Date();
      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        map[key] = { cert: 0, informe: 0, acta: 0, otros: 0 };
      }
      eventosFiltrados.forEach(e => {
        const ts = e.fecha?.toMillis?.() ?? (e.fecha?.seconds ? e.fecha.seconds * 1000 : null);
        if (!ts) return;
        const key = new Date(ts).toISOString().split('T')[0];
        if (!map[key]) return;
        if (e.tipo === 'generar_certificado') map[key].cert++;
        else if (e.tipo === 'generar_informe') map[key].informe++;
        else if (e.tipo === 'generar_acta') map[key].acta++;
        else map[key].otros++;
      });
      return Object.entries(map).map(([fecha, v]) => ({ fecha, ...v, total: v.cert + v.informe + v.acta + v.otros }));
    }, [eventosFiltrados, filtro]);

    const maxBarTotal = useMemo(() => Math.max(...porDia.map(d => d.total), 1), [porDia]);

    const porCentro = useMemo(() => {
      const map: Record<string, { nombreCentro: string; titular: string; cert: number; informe: number; acta: number; ultima: number }> = {};
      eventosFiltrados.filter(e => e.codigoCentro).forEach(e => {
        const k = e.codigoCentro!;
        if (!map[k]) map[k] = { nombreCentro: e.nombreCentro ?? k, titular: e.titular ?? '', cert: 0, informe: 0, acta: 0, ultima: 0 };
        if (e.tipo === 'generar_certificado') map[k].cert++;
        else if (e.tipo === 'generar_informe') map[k].informe++;
        else if (e.tipo === 'generar_acta') map[k].acta++;
        const ts = e.fecha?.toMillis?.() ?? (e.fecha?.seconds ? e.fecha.seconds * 1000 : 0);
        if (ts > map[k].ultima) { map[k].ultima = ts; map[k].titular = e.titular ?? map[k].titular; }
      });
      return Object.entries(map).sort((a, b) => (b[1].cert + b[1].informe + b[1].acta) - (a[1].cert + a[1].informe + a[1].acta));
    }, [eventosFiltrados]);

    const porUsuario = useMemo(() => {
      const map: Record<string, { sesiones: number; docs: number; ultima: number }> = {};
      eventosFiltrados.forEach(e => {
        if (!map[e.usuario]) map[e.usuario] = { sesiones: 0, docs: 0, ultima: 0 };
        if (e.tipo === 'login') map[e.usuario].sesiones++;
        if (['generar_certificado','generar_informe','generar_acta'].includes(e.tipo)) map[e.usuario].docs++;
        const ts = e.fecha?.toMillis?.() ?? (e.fecha?.seconds ? e.fecha.seconds * 1000 : 0);
        if (ts > map[e.usuario].ultima) map[e.usuario].ultima = ts;
      });
      return Object.entries(map).sort((a, b) => b[1].docs - a[1].docs);
    }, [eventosFiltrados]);

    const totalUsuariosConocidos = useMemo(() => new Set(eventos.map(e => e.usuario)).size, [eventos]);
    const usuariosActivosFiltro = useMemo(() => new Set(eventosFiltrados.map(e => e.usuario)).size, [eventosFiltrados]);
    const tasaAdopcion = totalUsuariosConocidos > 0 ? Math.round((usuariosActivosFiltro / totalUsuariosConocidos) * 100) : 0;

    const docsIniciadosTotal = useMemo(() => new Set(
      eventos.filter(e => e.codigoCentro).map(e => e.codigoCentro)
    ).size, [eventos]);
    const docsCompletados = useMemo(() => new Set(
      eventosFiltrados.filter(e => ['generar_certificado','generar_informe','generar_acta'].includes(e.tipo) && e.codigoCentro).map(e => e.codigoCentro)
    ).size, [eventosFiltrados]);
    const tasaCompletitud = docsIniciadosTotal > 0 ? Math.round((docsCompletados / docsIniciadosTotal) * 100) : 0;

    const recenteEventos = eventosFiltrados.slice(0, 100);

    const fmtDate = (ts: any) => {
      const ms = ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : null);
      if (!ms) return '—';
      const d = new Date(ms);
      return `${d.toLocaleDateString('es-CL')} ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const tipoLabel: Record<string, string> = {
      login: 'Acceso',
      generar_certificado: 'Certificado',
      generar_informe: 'Informe',
      generar_acta: 'Acta',
      ver_historico: 'Ver historial',
      abrir_registro: 'Abrir registro',
      crear_registro: 'Nuevo registro',
    };

    const tipoColor: Record<string, string> = {
      login: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      generar_certificado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      generar_informe: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
      generar_acta: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      ver_historico: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
      abrir_registro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      crear_registro: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    };

    // Horario de uso (por hora del día)
    const porHora = useMemo(() => {
      const map: Record<number, number> = {};
      for (let h = 0; h < 24; h++) map[h] = 0;
      eventosFiltrados.forEach(e => {
        const ts = e.fecha?.toMillis?.() ?? (e.fecha?.seconds ? e.fecha.seconds * 1000 : null);
        if (!ts) return;
        map[new Date(ts).getHours()]++;
      });
      return Object.entries(map).map(([h, count]) => ({ hora: Number(h), count }));
    }, [eventosFiltrados]);
    const maxHora = useMemo(() => Math.max(...porHora.map(h => h.count), 1), [porHora]);

    const exportStatsJson = () => {
      const data = {
        exportado: new Date().toISOString(),
        periodo: filtro,
        kpis,
        tasaAdopcion,
        tasaCompletitud,
        porCentro: porCentro.map(([codigo, v]) => ({ codigo, ...v, ultima: fmtDate(v.ultima ? { seconds: v.ultima / 1000 } : null) })),
        porUsuario: porUsuario.map(([usuario, v]) => ({ usuario, ...v, ultima: fmtDate(v.ultima ? { seconds: v.ultima / 1000 } : null) })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `stats-certimar-${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
    };

    // Hooks ya fueron llamados — ahora es seguro retornar null condicionalmente
    if (activeTab !== 'stats' || !isAdmin) return null;
    if (statsLoading) return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400">Cargando estadísticas...</p>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <BarChart2 className="text-indigo-500" size={28} />
              Estadísticas de Uso
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Panel de control para directivos — {eventosFiltrados.length} eventos en el período seleccionado
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {(['7d','30d','90d','all'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={cn("px-3 py-2 transition-colors", filtro === f ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}
                >
                  {f === '7d' ? '7 días' : f === '30d' ? '30 días' : f === '90d' ? '90 días' : 'Todo'}
                </button>
              ))}
            </div>
            <button onClick={exportStatsJson}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              <Download size={14} /> Exportar JSON
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Sesiones', value: kpis.sesiones, icon: Activity, color: 'indigo', desc: 'Accesos al sistema' },
            { label: 'Documentos generados', value: kpis.docsTotal, icon: FileText, color: 'emerald', desc: 'Cert. + Informes + Actas' },
            { label: 'Centros inspeccionados', value: kpis.centrosUnicos, icon: Anchor, color: 'sky', desc: 'Centros únicos con docs' },
            { label: 'Usuarios activos', value: kpis.usuariosUnicos, icon: Users, color: 'violet', desc: 'En el período seleccionado' },
          ].map(({ label, value, icon: Icon, color, desc }) => (
            <div key={label} className={cn(
              "rounded-2xl p-5 border flex flex-col gap-2 bg-white dark:bg-slate-800",
              color === 'indigo' && "border-indigo-100 dark:border-indigo-500/20",
              color === 'emerald' && "border-emerald-100 dark:border-emerald-500/20",
              color === 'sky' && "border-sky-100 dark:border-sky-500/20",
              color === 'violet' && "border-violet-100 dark:border-violet-500/20",
            )}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                color === 'indigo' && "bg-indigo-50 dark:bg-indigo-500/10",
                color === 'emerald' && "bg-emerald-50 dark:bg-emerald-500/10",
                color === 'sky' && "bg-sky-50 dark:bg-sky-500/10",
                color === 'violet' && "bg-violet-50 dark:bg-violet-500/10",
              )}>
                <Icon size={20} className={cn(
                  color === 'indigo' && "text-indigo-500",
                  color === 'emerald' && "text-emerald-500",
                  color === 'sky' && "text-sky-500",
                  color === 'violet' && "text-violet-500",
                )} />
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">{value}</div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicadores pedagógicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <TrendingUp size={16} className="text-emerald-500" />
              Tasa de adopción
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-white">{tasaAdopcion}<span className="text-xl text-slate-500">%</span></div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${tasaAdopcion}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Usuarios activos vs. total registrado ({usuariosActivosFiltro}/{totalUsuariosConocidos})</p>
          </div>

          <div className="rounded-2xl p-5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={16} className="text-sky-500" />
              Tasa de completitud
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-white">{tasaCompletitud}<span className="text-xl text-slate-500">%</span></div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${tasaCompletitud}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Centros con al menos un documento generado ({docsCompletados}/{docsIniciadosTotal})</p>
          </div>

          <div className="rounded-2xl p-5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Award size={16} className="text-violet-500" />
              Documentos por tipo
            </div>
            {[
              { label: 'Certificados', count: kpis.certCount, color: 'emerald' },
              { label: 'Informes técnicos', count: kpis.informeCount, color: 'indigo' },
              { label: 'Actas de inspección', count: kpis.actaCount, color: 'violet' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-36 shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className={cn("h-2 rounded-full transition-all",
                    color === 'emerald' && "bg-emerald-500",
                    color === 'indigo' && "bg-indigo-500",
                    color === 'violet' && "bg-violet-500",
                  )} style={{ width: kpis.docsTotal > 0 ? `${(count / kpis.docsTotal) * 100}%` : '0%' }} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad diaria */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            Actividad diaria
            <span className="text-xs font-normal text-slate-500 dark:text-slate-500 ml-1">— apilado por tipo de documento</span>
          </h2>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {porDia.map(({ fecha, cert, informe, acta, otros }) => {
              const totalBar = cert + informe + acta + otros;
              const heightPct = (totalBar / maxBarTotal) * 100;
              const label = fecha.slice(5); // MM-DD
              return (
                <div key={fecha} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: filtro === 'all' || filtro === '90d' ? '10px' : filtro === '30d' ? '18px' : '32px' }}>
                  <div className="flex flex-col-reverse justify-start w-full" style={{ height: '100px' }}>
                    <div className="w-full flex flex-col-reverse overflow-hidden rounded-sm" style={{ height: `${Math.max(heightPct, totalBar > 0 ? 4 : 0)}%` }}>
                      {cert > 0 && <div className="bg-emerald-500 w-full" style={{ flex: cert }} />}
                      {informe > 0 && <div className="bg-indigo-500 w-full" style={{ flex: informe }} />}
                      {acta > 0 && <div className="bg-violet-500 w-full" style={{ flex: acta }} />}
                      {otros > 0 && <div className="bg-slate-300 dark:bg-slate-600 w-full" style={{ flex: otros }} />}
                    </div>
                  </div>
                  {(filtro === '7d' || (filtro === '30d' && porDia.indexOf(porDia.find(d => d.fecha === fecha)!) % 3 === 0)) && (
                    <span className="text-[8px] text-slate-500 dark:text-slate-500 rotate-45 origin-left w-8">{label}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Certificado</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" /> Informe</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" /> Acta</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> Otras acciones</span>
          </div>
        </div>

        {/* Horario de uso */}
        <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            Horario de uso
            <span className="text-xs font-normal text-slate-500 dark:text-slate-500 ml-1">— distribución de actividad por hora del día</span>
          </h2>
          <div className="flex items-end gap-1 h-20">
            {porHora.map(({ hora, count }) => (
              <div key={hora} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
                  <div className={cn("w-full rounded-sm transition-all", count > 0 ? "bg-amber-400 dark:bg-amber-500" : "bg-slate-100 dark:bg-slate-700")}
                    style={{ height: `${Math.max((count / maxHora) * 100, count > 0 ? 8 : 2)}%` }} />
                </div>
                {hora % 6 === 0 && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-500">{hora}h</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Centros */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Anchor size={16} className="text-sky-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Centros inspeccionados</h2>
              <span className="ml-auto text-xs text-slate-500">{porCentro.length} centros</span>
            </div>
            {porCentro.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-500">Sin datos para el período</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Centro</th>
                      <th className="px-2 py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">Cert</th>
                      <th className="px-2 py-2 text-center font-semibold text-indigo-600 dark:text-indigo-400">Inf</th>
                      <th className="px-2 py-2 text-center font-semibold text-violet-600 dark:text-violet-400">Acta</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-500 dark:text-slate-400">Última actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCentro.slice(0, 15).map(([codigo, v]) => (
                      <tr key={codigo} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{v.nombreCentro}</div>
                          <div className="text-slate-500 dark:text-slate-500">{codigo}</div>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded-md font-bold", v.cert > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "text-slate-300 dark:text-slate-600")}>{v.cert}</span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded-md font-bold", v.informe > 0 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "text-slate-300 dark:text-slate-600")}>{v.informe}</span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded-md font-bold", v.acta > 0 ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : "text-slate-300 dark:text-slate-600")}>{v.acta}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {fmtDate({ seconds: v.ultima / 1000 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actividad por usuario */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Users size={16} className="text-violet-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Actividad por usuario</h2>
              <span className="ml-auto text-xs text-slate-500">{porUsuario.length} usuarios</span>
            </div>
            {porUsuario.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-500">Sin datos para el período</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Usuario</th>
                      <th className="px-2 py-2 text-center font-semibold text-slate-500 dark:text-slate-400">Sesiones</th>
                      <th className="px-2 py-2 text-center font-semibold text-slate-500 dark:text-slate-400">Docs gen.</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-500 dark:text-slate-400">Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porUsuario.map(([usuario, v]) => {
                      const semaforo = v.docs > 5 ? 'verde' : v.docs > 1 ? 'amarillo' : 'rojo';
                      return (
                        <tr key={usuario} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full shrink-0",
                                semaforo === 'verde' && "bg-emerald-500",
                                semaforo === 'amarillo' && "bg-amber-400",
                                semaforo === 'rojo' && "bg-rose-400",
                              )} />
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{usuario}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-200">{v.sesiones}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={cn("px-2 py-0.5 rounded-md font-bold",
                              v.docs > 0 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "text-slate-300 dark:text-slate-600"
                            )}>{v.docs}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {fmtDate({ seconds: v.ultima / 1000 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Log de actividad reciente */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Log de actividad reciente</h2>
            <span className="ml-auto text-xs text-slate-500">Últimos {recenteEventos.length} eventos</span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Usuario</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Acción</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Centro</th>
                </tr>
              </thead>
              <tbody>
                {recenteEventos.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">{fmtDate(e.fecha)}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 max-w-[160px] truncate">{e.usuario}</td>
                    <td className="px-3 py-2">
                      <span className={cn("px-2 py-0.5 rounded-md font-semibold text-[11px]", tipoColor[e.tipo] ?? 'bg-slate-100 text-slate-600')}>
                        {tipoLabel[e.tipo] ?? e.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                      {e.nombreCentro ? <span title={e.codigoCentro}>{e.nombreCentro}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
                {recenteEventos.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-500">Sin actividad en el período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Views ---

  const GeneralView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader
        title="Datos Generales"
        icon={LayoutDashboard}
        description="Información base del centro de cultivo y del certificador a cargo."
      />

      {(isAdmin || isEditor) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {state.registroId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 tracking-wider">
                <Bookmark size={11} />
                {state.registroId}
              </span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-500 italic">Sin registro activo</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={comenzarRegistro}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <PlayCircle size={16} />
              Comenzar Registro
            </button>
            <button
              onClick={async () => {
                if (guardandoSection) return;
                setGuardandoSection('borrador');
                const ok = await persistDraft('manual');
                setGuardandoSection(null);
                if (ok) {
                  setGuardadoSection('borrador');
                  setTimeout(() => setGuardadoSection(null), 2500);
                  setSavedAt(new Date());
                  setSavedBy(state.general.certificador.nombre.trim() || null);
                  setSaveAnim(true);
                  setTimeout(() => setSaveAnim(false), 1800);
                } else {
                  setSaveError('No se pudo guardar el borrador. Verifica tu conexión.');
                  setTimeout(() => setSaveError(null), 4000);
                }
              }}
              disabled={!!guardandoSection || !hasDraftableData()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all"
            >
              {guardandoSection === 'borrador'
                ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={16} /></motion.div> Guardando…</>
                : guardadoSection === 'borrador'
                  ? <><CheckCircle2 size={16} /> Borrador guardado</>
                  : <><Bookmark size={16} /> Guardar borrador</>
              }
            </button>
            <button
              onClick={() => handleGuardar('general')}
              disabled={!!guardandoSection}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/30"
            >
              {guardandoSection === 'general'
                ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={16} /></motion.div> Guardando…</>
                : guardadoSection === 'general'
                  ? <><CheckCircle2 size={16} /> Guardado</>
                  : <><Save size={16} /> Guardar</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Operación Mínima toggle ── */}
      {isAdmin && (
        <FormCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-500" />
                Modo Operación Mínima
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Aplica parámetros regulatorios mínimos (Res. Exenta N°1511/2021): ROV, talla pequeña, 2 jaulas, 2 personas.
              </span>
            </div>
            <button
              onClick={() => {
                const hasParams = state.extraction.parametros.numero_total_jaulas > 0 ||
                  state.denaturation.equipos.id_catalogo_trituradora !== '';
                if (state.general.modo_operacion_minima) {
                  setState(prev => ({ ...prev, general: { ...prev.general, modo_operacion_minima: false } }));
                } else if (hasParams && !window.confirm(
                  'Se sobreescribirán los parámetros de extracción (talla pez, jaulas, personal, sistema) ' +
                  'y el batch de desnaturalización. ¿Continuar?'
                )) {
                  return;
                } else {
                  applyOperacionMinima();
                }
              }}
              className={cn(
                'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border',
                state.general.modo_operacion_minima
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'
              )}
            >
              {state.general.modo_operacion_minima
                ? <><ToggleRight size={18} /> Activo</>
                : <><ToggleLeft size={18} /> Inactivo</>}
            </button>
          </div>
        </FormCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormCard title="Identificación del Centro">
          <div className="space-y-4">
            {centroOperacionMinima && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-300">Centro Operación Mínima</span>
                  <span className="text-amber-600 dark:text-amber-400 ml-1">— {centroOperacionMinima.nota}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CenterCodeAutocomplete
                inputRef={centerCodeRef}
                highlight={state.general.centro_cultivo.codigo_centro === ""}
                label="Código Centro"
                value={state.general.centro_cultivo.codigo_centro}
                onChange={handleCenterCodeChange}
              />
              <InputField 
                label="A.C.S / RNA" 
                value={state.general.centro_cultivo.acs} 
                onChange={(v) => updateGeneral('centro_cultivo.acs', v)} 
                placeholder="26B"
              />
            </div>
            {/* Titular con autocompletado de empresas conocidas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Titular</label>
              <input
                list="titulares-list"
                value={state.general.centro_cultivo.titular}
                onChange={(e) => updateGeneral('centro_cultivo.titular', normalizeCampo(e.target.value))}
                placeholder="Ej. EXPORTADORA LOS FIORDOS LTDA."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="titulares-list">
                {TITULARES_CONOCIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <InputField
              label="Nombre Centro"
              value={state.general.centro_cultivo.nombre_centro}
              onChange={(v) => updateGeneral('centro_cultivo.nombre_centro', normalizeCampo(v))}
              placeholder="Ej. PUNTA LARGA"
            />
            <InputField
              label="Ubicación"
              value={state.general.centro_cultivo.ubicacion}
              onChange={(v) => updateGeneral('centro_cultivo.ubicacion', v)}
              placeholder="Región de Aysén..."
            />

            {/* Formato del módulo con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Formato del Módulo</label>
              <input
                list="formato-modulo-list"
                value={state.general.centro_cultivo.formato_modulo}
                onChange={(e) => updateGeneral('centro_cultivo.formato_modulo', e.target.value)}
                placeholder="24 jaulas, tipo Metálicas"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="formato-modulo-list">
                {FORMATOS_MODULO_CONOCIDOS.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>

            {/* Tamaño de jaulas con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tamaño de Jaulas</label>
              <input
                list="tamano-jaulas-list"
                value={state.general.centro_cultivo.tamano_jaulas}
                onChange={(e) => updateGeneral('centro_cultivo.tamano_jaulas', e.target.value)}
                placeholder="30 x 30 metros"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="tamano-jaulas-list">
                {TAMANOS_JAULAS_CONOCIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            {/* Nombre A/N con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre A/N Ensilaje</label>
              <input
                list="an-ensilaje-list"
                value={state.general.centro_cultivo.nombre_an_ensilaje}
                onChange={(e) => updateGeneral('centro_cultivo.nombre_an_ensilaje', e.target.value)}
                placeholder="A/N Pontón Alimentador"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="an-ensilaje-list">
                {NOMBRES_AN_CONOCIDOS.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            <InputField
              label="Coordenadas Ensilaje"
              value={state.general.centro_cultivo.coordenadas_ensilaje}
              onChange={(v) => updateGeneral('centro_cultivo.coordenadas_ensilaje', v)}
              placeholder="45°27'S 72°51'W"
            />
          </div>
        </FormCard>

        <FormCard title="Fechas y Certificador">
          <div className="space-y-4">
            <DateField
              label="Fecha Inspección Terreno"
              value={state.general.fechas.inspeccion_terreno}
              onChange={(v) => updateGeneral('fechas.inspeccion_terreno', v)}
            />
            <DateField
              label="Fecha Evaluación Documental"
              value={state.general.fechas.evaluacion_documental}
              onChange={(v) => updateGeneral('fechas.evaluacion_documental', v)}
            />
            <DateField
              label="Fecha Emisión Certificado"
              value={state.general.fechas.emision_certificado}
              onChange={(v) => updateGeneral('fechas.emision_certificado', v)}
            />
            <InputField 
              label="Certificador" 
              value={state.general.certificador.nombre} 
              onChange={(v) => updateGeneral('certificador.nombre', v)} 
            />
            <InputField 
              label="RUT Certificador" 
              value={state.general.certificador.rut} 
              onChange={(v) => updateGeneral('certificador.rut', v)} 
            />
            <InputField
              label="N° Registro"
              value={state.general.certificador.numero_registro}
              onChange={(v) => updateGeneral('certificador.numero_registro', v)}
            />
          </div>
        </FormCard>
        <FormCard title="Observaciones Acta (Sección H)">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Observaciones</label>
            <textarea
              value={state.general.observaciones_acta}
              onChange={(e) => updateGeneral('observaciones_acta', e.target.value)}
              rows={4}
              placeholder="Observaciones para la sección H del acta (dejar vacío para N/A)"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium resize-none"
            />
          </div>
        </FormCard>
      </div>

    </div>
  );

  // ─── Toggle helper para ConfigView ───
  const Toggle = ({ value, onChange, label, description, icon: Icon }: {
    value: boolean; onChange: (v: boolean) => void;
    label: string; description?: string; icon?: React.ElementType;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
        value
          ? "border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      {Icon && <Icon size={20} className={value ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"} />}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-sm", value ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200")}>{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className={cn("w-10 h-6 rounded-full transition-all relative shrink-0", value ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700")}>
        <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", value ? "left-4" : "left-0.5")} />
      </div>
    </button>
  );

  const ConfigView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <SectionHeader title="Configuración" icon={Settings2} description="Personaliza el comportamiento y apariencia de la aplicación." />

      {/* ── Apariencia ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} className="text-indigo-500" />
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Apariencia</h2>
        </div>

        {/* Modo oscuro */}
        <Toggle
          value={darkMode}
          onChange={setDarkMode}
          label={darkMode ? "Modo Oscuro activo" : "Modo Claro activo"}
          description="Cambia el esquema de colores de la interfaz"
          icon={darkMode ? Moon : Sun}
        />

        {/* Intensidad de olas en PDF */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Olas en el PDF</p>
              <p className="text-xs text-slate-500 mt-0.5">Intensidad de las líneas decorativas en el informe y certificado</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-10 text-right">
              {Math.round(wavesOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0} max={0.20} step={0.01}
            value={wavesOpacity}
            onChange={e => setWavesOpacity(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Sin olas</span>
            <span>Muy visibles</span>
          </div>
        </div>

        {/* Opacidad logo empresa en portada */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Logo empresa en portada</p>
              <p className="text-xs text-slate-500 mt-0.5">Opacidad de la marca de agua vertical del logo seleccionado</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-10 text-right">
              {Math.round(logoPortadaOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={logoPortadaOpacity}
            onChange={e => setLogoPortadaOpacity(parseFloat(e.target.value))}
            onPointerUp={e => saveLogoPortadaOpacity(parseFloat((e.target as HTMLInputElement).value))}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Invisible</span>
            <span>Opaco</span>
          </div>
        </div>

        {/* Posición y tamaño del logo de marca */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-5 py-4 space-y-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Logo de marca — posición y tamaño</p>

          {/* Vista preliminar */}
          {(() => {
            const PW_MM = 215.9, SHOW_H_MM = 120;
            const sc = (n: number) => `${(n / PW_MM * 100).toFixed(3)}%`;
            const sy = (n: number) => `${(n / SHOW_H_MM * 100).toFixed(3)}%`;
            const logoSrc = tema.logo === 'engelbert' ? '/engelbert-logo.png' : '/certimar-logo.png';
            const gX = Array.from({length: Math.floor(PW_MM / 10)}, (_, i) => (i + 1) * 10);
            const gY = Array.from({length: Math.floor(SHOW_H_MM / 10)}, (_, i) => (i + 1) * 10);
            // Posiciones fijas de referencia (no se mueven con el logo)
            const BAR_Y = 24, TITLE_Y = 50;
            return (
              <div className="relative bg-white border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden w-full shadow-inner"
                   style={{paddingTop: `${(SHOW_H_MM / PW_MM * 100).toFixed(2)}%`}}>
                <div className="absolute inset-0">
                  {/* Grilla cada 10mm */}
                  {gX.map(x => (
                    <div key={`gx${x}`} className="absolute top-0 bottom-0"
                         style={{left: sc(x), width: '1px', background: x % 50 === 0 ? 'rgba(99,120,150,.18)' : 'rgba(99,120,150,.07)'}} />
                  ))}
                  {gY.map(y => (
                    <div key={`gy${y}`} className="absolute left-0 right-0"
                         style={{top: sy(y), height: '1px', background: y % 50 === 0 ? 'rgba(99,120,150,.18)' : 'rgba(99,120,150,.07)'}} />
                  ))}
                  {/* Franja navy */}
                  <div className="absolute left-0 right-0 top-0" style={{height: sy(2), background: '#1B3464'}} />
                  {/* Barra vertical — fija en x=11.5mm, y=BAR_Y */}
                  <div className="absolute" style={{
                    left: sc(11.5), top: sy(BAR_Y),
                    width: sc(1.1), height: sy(55), background: '#4A9BC4', borderRadius: '1px'
                  }} />
                  {/* Título INFORME TÉCNICO — fijo */}
                  <div className="absolute select-none" style={{left: sc(21), top: sy(TITLE_Y)}}>
                    <p style={{fontSize: '9px', fontWeight: 900, color: '#1B3464', margin: 0, lineHeight: 1.15, fontFamily: 'Arial Black, Arial, sans-serif'}}>INFORME</p>
                    <p style={{fontSize: '9px', fontWeight: 900, color: '#1B3464', margin: 0, lineHeight: 1.15, fontFamily: 'Arial Black, Arial, sans-serif'}}>TÉCNICO</p>
                  </div>
                  {/* Logo marca */}
                  <img src={logoSrc} alt="preview logo"
                    style={{position: 'absolute', left: sc(logoMarcaX), top: sy(logoMarcaY), width: sc(logoMarcaW), objectFit: 'contain', display: 'block'}}
                  />
                  {/* Ref y fecha — derecha */}
                  <div className="absolute select-none" style={{right: sc(8), top: sy(9), textAlign: 'right', lineHeight: 1.7}}>
                    <p style={{fontSize: '5.5px', color: '#1B3464', fontFamily: 'monospace', margin: 0}}>110549190226MOR</p>
                    <p style={{fontSize: '5.5px', color: '#5a7a94', margin: 0}}>22 de marzo del 2026</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sliders */}
          {([
            { label: 'X', unit: 'mm', val: logoMarcaX, set: setLogoMarcaX, min: 0, max: 80, step: 0.5 },
            { label: 'Y', unit: 'mm', val: logoMarcaY, set: setLogoMarcaY, min: 2, max: 25, step: 0.5 },
            { label: 'Tamaño', unit: 'mm', val: logoMarcaW, set: setLogoMarcaW, min: 5, max: 60, step: 0.5 },
          ] as const).map(({ label, unit, val, set, min, max, step }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">{label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{val.toFixed(1)} {unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}

          <button
            onClick={saveLogoMarcaSettings}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-colors"
          >
            Guardar posición
          </button>
        </div>

        {/* Posición, tamaño y rotación del watermark logo */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Logo empresa — watermark portada</p>
            <p className="text-xs text-slate-500 mt-0.5">Posición, tamaño y rotación del logo de la empresa</p>
          </div>

          {/* Vista preliminar página completa */}
          {(() => {
            const PW_MM = 215.9, PH_MM = 279.4;
            const scw = (n: number) => `${(n / PW_MM * 100).toFixed(3)}%`;
            const sch = (n: number) => `${(n / PH_MM * 100).toFixed(3)}%`;
            return (
              <div className="relative bg-white border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden w-full shadow-inner"
                   style={{paddingTop: `${(PH_MM / PW_MM * 100).toFixed(2)}%`}}>
                <div className="absolute inset-0">
                  {/* Franja navy */}
                  <div className="absolute left-0 right-0 top-0" style={{height: sch(2), background: '#1B3464'}} />
                  {/* Ondas aprox al fondo */}
                  <div className="absolute left-0 right-0" style={{bottom: 0, height: sch(80), background: 'linear-gradient(to bottom, rgba(107,206,218,.4), rgba(30,71,150,.5))'}} />
                  {/* Barra vertical — referencia fija */}
                  <div className="absolute" style={{left: scw(11.5), top: sch(24), width: scw(1.1), height: sch(55), background: '#4A9BC4'}} />
                  {/* Título — referencia fija */}
                  <div className="absolute select-none" style={{left: scw(21), top: sch(50)}}>
                    <p style={{fontSize: '5px', fontWeight: 900, color: '#1B3464', margin: 0, lineHeight: 1.2, fontFamily: 'Arial Black, Arial, sans-serif'}}>INFORME</p>
                    <p style={{fontSize: '5px', fontWeight: 900, color: '#1B3464', margin: 0, lineHeight: 1.2, fontFamily: 'Arial Black, Arial, sans-serif'}}>TÉCNICO</p>
                  </div>
                  {/* Watermark logo */}
                  {logoClienteUrl ? (
                    <img src={logoClienteUrl} alt="wm preview"
                      style={{
                        position: 'absolute',
                        left: scw(logoWmX), top: sch(logoWmY),
                        width: scw(logoWmW),
                        opacity: logoPortadaOpacity,
                        transform: `rotate(${logoWmRotation}deg)`,
                        transformOrigin: 'top left',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', left: scw(logoWmX), top: sch(logoWmY),
                      width: scw(logoWmW), height: sch(15),
                      background: 'rgba(100,150,200,0.12)', border: '1px dashed rgba(100,150,200,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '4px', color: '#7a9ab4',
                      transform: `rotate(${logoWmRotation}deg)`, transformOrigin: 'top left',
                    }}>logo</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Sliders */}
          {([
            { label: 'X', unit: 'mm', val: logoWmX, set: setLogoWmX, min: 0, max: 210, step: 0.5, decimals: 1 },
            { label: 'Y', unit: 'mm', val: logoWmY, set: setLogoWmY, min: 0, max: 260, step: 0.5, decimals: 1 },
            { label: 'Tamaño', unit: 'mm', val: logoWmW, set: setLogoWmW, min: 5, max: 80, step: 0.5, decimals: 1 },
            { label: 'Rotación', unit: '°', val: logoWmRotation, set: setLogoWmRotation, min: -180, max: 180, step: 1, decimals: 0 },
          ] as const).map(({ label, unit, val, set, min, max, step, decimals }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">{label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{val.toFixed(decimals)} {unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(parseFloat(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          ))}

          <button
            onClick={saveLogoWmSettings}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white transition-colors"
          >
            Guardar watermark
          </button>
        </div>

        {/* Tema / Marca */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-1">Tema / Marca</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { logoKey: 'certimar' as const, paletteKey: 'certimar' as const, label: 'Certimar', logo: '/certimar-logo.png', accent: 'indigo', desc: 'Azul marino — paleta oficial Certimar' },
              { logoKey: 'engelbert' as const, paletteKey: 'engelbert' as const, label: 'Engelbert', logo: '/engelbert-logo.png', accent: 'orange', desc: 'Naranja y negro — Engelbert Aquastructures' },
            ]).map(({ logoKey, paletteKey, label, logo, accent, desc }) => {
              const isActive = tema.logo === logoKey && tema.palette === paletteKey;
              return (
                <button
                  key={logoKey}
                  onClick={() => setTema({ logo: logoKey, palette: paletteKey })}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                    isActive
                      ? accent === 'indigo'
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 shadow-lg shadow-indigo-500/10"
                        : "border-orange-400 bg-orange-50 dark:bg-orange-500/15 shadow-lg shadow-orange-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <img src={logo} alt={label} className="h-14 w-auto object-contain" />
                  <div className="text-center">
                    <p className={cn("font-bold text-sm", isActive
                      ? accent === 'indigo' ? "text-indigo-700 dark:text-indigo-300" : "text-orange-700 dark:text-orange-300"
                      : "text-slate-600 dark:text-slate-300"
                    )}>{label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 leading-tight">{desc}</p>
                  </div>
                  {isActive && (
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      accent === 'indigo' ? "bg-indigo-500 text-white" : "bg-orange-500 text-white"
                    )}>ACTIVO</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Opción personalizada: logo y paleta independientes */}
          {(() => {
            const isMixed = !(tema.logo === tema.palette);
            return (
              <div className={cn(
                "rounded-2xl border-2 p-4 transition-all",
                isMixed
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-500/15 shadow-lg shadow-violet-500/10"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <p className={cn("text-sm font-semibold", isMixed ? "text-violet-700 dark:text-violet-300" : "text-slate-600 dark:text-slate-400")}>
                    Personalizado — logo y paleta independientes
                  </p>
                  {isMixed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white">ACTIVO</span>}
                </div>
                <div className="flex flex-col gap-2">
                  {/* Logo selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12 shrink-0">Logo</span>
                    <div className="flex gap-1.5">
                      {([
                        { key: 'certimar' as const, label: 'Certimar', logo: '/certimar-logo.png' },
                        { key: 'engelbert' as const, label: 'Engelbert', logo: '/engelbert-logo.png' },
                      ]).map(({ key, label, logo }) => (
                        <button
                          key={key}
                          onClick={() => setTema(prev => ({ ...prev, logo: key }))}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                            tema.logo === key
                              ? "border-violet-400 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                              : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                          )}
                        >
                          <img src={logo} alt={label} className="h-4 w-auto object-contain" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Palette selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12 shrink-0">Paleta</span>
                    <div className="flex gap-1.5">
                      {([
                        { key: 'certimar' as const, label: 'Azul', color: '#1a3a5c' },
                        { key: 'engelbert' as const, label: 'Naranja', color: '#d2410a' },
                      ]).map(({ key, label, color }) => (
                        <button
                          key={key}
                          onClick={() => setTema(prev => ({ ...prev, palette: key }))}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                            tema.palette === key
                              ? "border-violet-400 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                              : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                          )}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Desarrollo / Pruebas ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Beaker size={16} className="text-violet-500" />
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Desarrollo</h2>
        </div>

        <Toggle
          value={datosPrueba}
          onChange={(v) => {
            setDatosPrueba(v);
            if (v) {
              setState(prev => ({ ...prev, ...(DATOS_PRUEBA_STATE as Partial<AppState>) }));
            } else {
              setState(prev => ({
                ...prev,
                general: { ...DEFAULT_STATE.general, certificador: prev.general.certificador },
              }));
            }
          }}
          label="Datos de prueba"
          description="Rellena el formulario con datos de ejemplo para probar la generación de documentos"
          icon={TestTube2}
        />

        <Toggle
          value={showHints}
          onChange={setShowHints}
          label="Sugerencias por empresa"
          description="Muestra autocompletado con datos históricos al escribir en campos del formulario"
          icon={Info}
        />

        {/* Normalizar histórico */}
        {isAdmin && (
          <button
            onClick={normalizarHistorico}
            disabled={normalizandoHistorico === 'running'}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-60 disabled:cursor-wait transition-all text-left"
          >
            {normalizandoHistorico === 'running'
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><RefreshCw size={20} className="shrink-0" /></motion.div>
              : <RefreshCw size={20} className="shrink-0" />}
            <div>
              <p className="font-bold text-sm">
                {normalizandoHistorico === 'running' ? 'Normalizando…' : normalizandoHistorico === 'done' ? 'Histórico normalizado ✓' : 'Normalizar Histórico'}
              </p>
              <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-0.5">Aplica MAYÚSCULAS + espacios→_ a todos los registros en Firestore</p>
            </div>
          </button>
        )}

        {/* Recuperar registros huérfanos */}
        {isAdmin && (
          <div className="space-y-3">
            <button
              onClick={verificarRegistrosHuerfanos}
              disabled={recuperandoRegistros === 'running'}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-wait transition-all text-left"
            >
              {recuperandoRegistros === 'running'
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Database size={20} className="shrink-0" /></motion.div>
                : <Database size={20} className="shrink-0" />}
              <div>
                <p className="font-bold text-sm">
                  {recuperandoRegistros === 'running' ? 'Verificando…' : 'Verificar Registros Huérfanos'}
                </p>
                <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">Busca en Firestore/registros documentos que no están en el Histórico</p>
              </div>
            </button>
            {recuperandoRegistros === 'done' && registrosHuerfanos.length === 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 px-1">✓ Todos los registros guardados están en el histórico</p>
            )}
            {registrosHuerfanos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 px-1">{registrosHuerfanos.length} registro(s) encontrado(s) — no están en el histórico:</p>
                {registrosHuerfanos.map(h => (
                  <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 truncate">{h.nombre || '(sin nombre)'}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{h.id} · {h.codigo || '—'} · {h.fecha || 'sin fecha'}</p>
                    </div>
                    <button
                      onClick={() => recuperarRegistroAHistorico(h)}
                      className="shrink-0 text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Recuperar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Borrar borrador — zona peligrosa */}
        {isAdmin && (
          <button
            onClick={resetState}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all text-left"
          >
            <Trash2 size={20} className="shrink-0" />
            <div>
              <p className="font-bold text-sm">Borrar Borrador</p>
              <p className="text-xs text-rose-400 dark:text-rose-500 mt-0.5">Elimina todos los datos del formulario actual</p>
            </div>
          </button>
        )}
      </section>

      {/* ── Logos de Empresas ── */}
      {isAdmin && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-violet-500" />
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logos de Empresas Clientes</h2>
          </div>

          {Object.keys(logosEmpresas).length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-500">Sin logos cargados. Sube los logos de tus empresas clientes para que aparezcan en la portada del informe.</p>
          ) : (() => {
            const portadaEntries = Object.entries(logosEmpresas).filter(([n]) => logosPortada.has(n));
            const restEntries    = Object.entries(logosEmpresas).filter(([n]) => !logosPortada.has(n));

            const LogoCard = ({ name, url }: { name: string; url: string }) => (
              <div key={name} className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-white dark:bg-slate-800",
                logosPortada.has(name)
                  ? "border-violet-300 dark:border-violet-500/50 ring-1 ring-violet-200 dark:ring-violet-500/20"
                  : "border-slate-200 dark:border-slate-700"
              )}>
                <img src={url} alt={name} className="h-10 w-auto object-contain max-w-full" />
                {renamingLogo === name ? (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameLogo(name, renameValue);
                        if (e.key === 'Escape') setRenamingLogo(null);
                      }}
                      className="w-full text-[10px] text-center px-1.5 py-1 rounded border border-indigo-300 dark:border-indigo-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => renameLogo(name, renameValue)} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">Guardar</button>
                      <button onClick={() => setRenamingLogo(null)} className="text-[10px] text-slate-500 hover:text-slate-600 transition-colors">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 text-center break-all leading-tight">{name}</span>
                    <button onClick={() => { setRenamingLogo(name); setRenameValue(name); }} className="text-slate-300 hover:text-indigo-400 transition-colors shrink-0" title="Renombrar">
                      <Pencil size={10} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => toggleLogoPortada(name)}
                    className={cn(
                      "text-[10px] font-semibold transition-colors",
                      logosPortada.has(name)
                        ? "text-violet-500 hover:text-violet-700"
                        : "text-slate-500 hover:text-violet-500"
                    )}
                  >
                    {logosPortada.has(name) ? '★ Portada' : '☆ Portada'}
                  </button>
                  <span className="text-slate-200 dark:text-slate-700 text-[10px]">·</span>
                  <button onClick={() => deleteLogoEmpresa(name)} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                </div>
              </div>
            );

            return (
              <div className="space-y-5">
                {/* Categoría Portada */}
                {portadaEntries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1">
                      <Star size={10} /> Portada del informe
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {portadaEntries.map(([name, url]) => <LogoCard key={name} name={name} url={url} />)}
                    </div>
                  </div>
                )}

                {/* Categoría General */}
                {restEntries.length > 0 && (
                  <div className="space-y-2">
                    {portadaEntries.length > 0 && (
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Todas las empresas</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {restEntries.map(([name, url]) => <LogoCard key={name} name={name} url={url} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-semibold border border-violet-200 dark:border-violet-500/30 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors">
            <Upload size={13} />
            Subir logo de empresa
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={handleUploadLogoEmpresa} />
          </label>
        </section>
      )}

      {/* ── Catálogo de Equipos ── */}
      {isAdmin && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Catálogo de Equipos</h3>
          <CatalogoEquiposAdmin
            catalogoCustom={catalogoCustom}
            onAdd={handleAddEquipo}
            onUpdate={handleUpdateEquipo}
            onDelete={handleDeleteEquipo}
          />
        </div>
      )}

      {/* ── Sistema ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={16} className="text-slate-500" />
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sistema</h2>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-700">
          {[
            { label: 'Registro activo', value: state.registroId ?? 'Sin registro' },
            { label: 'Certificador', value: state.general.certificador.nombre },
            { label: 'N° Registro SERNAPESCA', value: state.general.certificador.numero_registro },
            { label: 'Tema activo', value: `Logo: ${tema.logo === 'engelbert' ? 'Engelbert' : 'Certimar'} · Paleta: ${tema.palette === 'engelbert' ? 'Naranja' : 'Azul'}` },
            { label: 'Último borrador guardado', value: savedAt ? formatSavedAt(savedAt) : '—' },
            { label: 'Última modificación por', value: savedBy ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const HistoryView = () => {
    const StatusChip = ({
      active, onToggle, labelOn, labelOff, colorOn, disabled,
    }: { active: boolean; onToggle: () => void; labelOn: string; labelOff: string; colorOn: string; disabled?: boolean; }) => (
      <button
        onClick={disabled ? undefined : onToggle}
        title={disabled ? 'No disponible en borradores' : (active ? `Marcar como: ${labelOff}` : `Marcar como: ${labelOn}`)}
        disabled={disabled}
        className={cn(
          'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-colors whitespace-nowrap',
          disabled
            ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed'
            : active
              ? colorOn
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-400'
        )}
      >
        {active ? labelOn : labelOff}
      </button>
    );

    const DocBadge = ({ tipo }: { tipo: string }) => {
      const map: Record<string, string> = {
        certificado: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
        informe: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
        acta: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
      };
      return (
        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase', map[tipo] ?? 'bg-slate-100 text-slate-500')}>
          {tipo}
        </span>
      );
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                <History size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Histórico de Certificaciones</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">Registros generados automáticamente al emitir documentos. Haz clic en los estados para actualizarlos.</p>
          </div>
          {canExportCSV && (
            <button
              onClick={exportHistoricoCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {exportingCSV ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                  Exportando…
                </>
              ) : (
                <>
                  <Download size={16} />
                  Exportar CSV
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Filtro de borradores ── */}
        {!historicoLoading && historicoEntries.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {/* Fila 1: tabs de filtro + toggle Grid/Lista */}
            <div className="flex items-center gap-1.5">
              {([
                { id: 'todos' as const, label: 'Todos', n: historicoEntries.length },
                { id: 'borradores' as const, label: 'Borradores', n: historicoEntries.filter(e => e.esBorrador === true).length },
                { id: 'finalizados' as const, label: 'Finalizados', n: historicoEntries.filter(e => e.esBorrador !== true).length },
              ]).map(({ id, label, n }) => (
                <button
                  key={id}
                  onClick={() => setHistoricoFiltro(id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border',
                    historicoFiltro === id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  )}
                >
                  {label} <span className="opacity-70">({n})</span>
                </button>
              ))}
              <div className="flex-1" />
              {/* Toggle Grid / Lista */}
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => { setHistoricoViewMode('grid'); localStorage.setItem('certimar_historico_view', 'grid'); }}
                  title="Vista Grid"
                  className={cn(
                    'px-2.5 py-1.5 text-sm transition-colors',
                    historicoViewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                >
                  ⊞
                </button>
                <button
                  onClick={() => { setHistoricoViewMode('list'); localStorage.setItem('certimar_historico_view', 'list'); }}
                  title="Vista Lista"
                  className={cn(
                    'px-2.5 py-1.5 text-sm transition-colors border-l border-slate-200 dark:border-slate-700',
                    historicoViewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                >
                  ☰
                </button>
              </div>
            </div>
            {/* Fila 2: búsqueda por empresa o centro */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={historicoEmpresaFiltro}
                onChange={e => setHistoricoEmpresaFiltro(e.target.value)}
                placeholder="Filtrar por empresa o centro…"
                className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
              />
              {historicoEmpresaFiltro && (
                <button
                  onClick={() => setHistoricoEmpresaFiltro('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Registros desde Firestore ── */}
        {(() => {
          const entriesFiltradas = historicoEntries
            .filter(e =>
              historicoFiltro === 'todos' ? true :
              historicoFiltro === 'borradores' ? e.esBorrador === true :
              e.esBorrador !== true
            )
            .filter(e => {
              if (!historicoEmpresaFiltro.trim()) return true;
              const q = historicoEmpresaFiltro.toLowerCase();
              return (
                (e.titular?.toLowerCase().includes(q) ?? false) ||
                (e.nombreCentro?.toLowerCase().includes(q) ?? false)
              );
            });

          return (
        <FormCard className="p-0 overflow-hidden">
          {historicoLoading && (
            <div className="flex items-center gap-3 px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
              <span className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
              Cargando histórico…
            </div>
          )}
          {!historicoLoading && historicoEntries.length === 0 && (
            <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-500">
              <History size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aún no hay registros generados.</p>
              <p className="text-xs mt-1 text-slate-500">Aparecerán aquí cuando generes el primer documento.</p>
            </div>
          )}
          {!historicoLoading && historicoEntries.length > 0 && entriesFiltradas.length === 0 && (
            <div className="px-6 py-10 text-center text-slate-500 dark:text-slate-500">
              <Search size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin resultados para «{historicoEmpresaFiltro}».</p>
              <button onClick={() => setHistoricoEmpresaFiltro('')} className="mt-2 text-xs text-indigo-500 hover:underline">Limpiar filtro</button>
            </div>
          )}
          {!historicoLoading && entriesFiltradas.length > 0 && (
            historicoViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {entriesFiltradas.map((entry) => {
                const docs = entry.documentosGenerados ?? [];
                const urls = entry.documentUrls ?? {};
                const m = entry.metricas;
                return (
                  <div key={entry.id} className={cn(
                    'bg-white dark:bg-slate-800 rounded-2xl p-5 flex flex-col gap-3 transition-colors border',
                    entry.esBorrador
                      ? 'border-2 border-dashed border-amber-300 dark:border-amber-500/40 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                  )}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{entry.nombreCentro || '—'}</p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-500">{entry.codigoCentro} · {entry.registroId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {entry.esBorrador && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase border border-amber-300 dark:border-amber-500/50 tracking-wide">Borrador</span>
                        )}
                        {entry.metricas?.modoOperacionMinima && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase">Op. Min.</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{entry.titular || '—'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">{entry.fechaInspeccion || '—'}</p>

                    {/* Compliance badges */}
                    {m && (
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { label: 'Extr.', cumple: m.cumpleExtraccion, val: m.capExtraccion },
                          { label: 'Desn.', cumple: m.cumpleDesnaturalizacion, val: m.capDesnaturalizacion },
                          { label: 'Alm.',  cumple: m.cumpleAlmacenamiento,   val: m.capAlmacenamiento },
                        ]).map(({ label, cumple, val }) => (
                          <span key={label} className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold',
                            cumple
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                          )}>
                            {label} {typeof val === 'number' ? val.toFixed(1) : val}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.esBorrador && (() => {
                      const ds = draftStatus(entry.snapshot, entry.metricas);
                      return (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                            Avance {ds.completados}/{ds.total}
                          </span>
                          {ds.pendientes.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {ds.pendientes.map(p => (
                                <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                  Falta: {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Doc badges — clickeable para descargar con confirmación de Inspector */}
                    <div className="flex gap-1 flex-wrap">
                      {docs.map(d => {
                        const url = urls[d as keyof typeof urls];
                        return (
                          <button
                            key={d}
                            onClick={() => setConfirmDownload({ entry, tipo: d, url: url || undefined })}
                            title={url ? `Descargar ${d}` : `${d} — sin versión guardada`}
                            className={cn(
                              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors',
                              url
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 border border-dashed border-slate-300 dark:border-slate-600'
                            )}
                          >
                            ↓ {d}
                          </button>
                        );
                      })}
                    </div>

                    {/* Status chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <StatusChip active={entry.aprobado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'aprobado', !(entry.aprobado ?? false))} labelOn="Aprobado" labelOff="No aprobado" colorOn="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40" disabled={entry.esBorrador} />
                      <StatusChip active={entry.firmado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'firmado', !(entry.firmado ?? false))} labelOn="Firmado" labelOff="Sin firma" colorOn="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/40" disabled={entry.esBorrador} />
                      <StatusChip active={entry.enviado_sernapesca ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'enviado_sernapesca', !(entry.enviado_sernapesca ?? false))} labelOn="SERNAPESCA" labelOff="Sin enviar" colorOn="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/40" disabled={entry.esBorrador} />
                      <StatusChip active={entry.cliente_notificado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'cliente_notificado', !(entry.cliente_notificado ?? false))} labelOn="Notificado" labelOff="Sin notificar" colorOn="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40" disabled={entry.esBorrador} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setSelectedHistoricoEntry(entry)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                      >
                        Ver detalle
                      </button>
                      <button
                        onClick={() => loadFromHistorico(entry)}
                        title="Cargar datos en el formulario"
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Pencil size={12} />
                        {entry.esBorrador ? 'Continuar' : 'Cargar'}
                      </button>
                      <button
                        onClick={() => { setVersionesModal({ registroId: entry.id!, entry }); loadVersiones(entry.id!); }}
                        title="Historial de versiones"
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                      >
                        <Clock size={12} />
                      </button>
                      <button
                        onClick={() => deleteFromHistorico(entry)}
                        title="Eliminar registro"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-200 dark:border-rose-500/30"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
            <div className="flex flex-col gap-1 p-3">
              {entriesFiltradas.map((entry) => {
                const docs = entry.documentosGenerados ?? [];
                const urls = entry.documentUrls ?? {};
                const m = entry.metricas;
                const ds = entry.esBorrador ? draftStatus(entry.snapshot, entry.metricas) : null;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'bg-white dark:bg-slate-800 rounded-xl p-2.5 transition-colors border',
                      'grid gap-2 items-center',
                      entry.esBorrador
                        ? 'border-2 border-dashed border-amber-300 dark:border-amber-500/40 hover:border-amber-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                    )}
                    style={{ gridTemplateColumns: '200px 1fr 90px' }}
                  >
                    {/* Columna 1 — Identidad */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{entry.nombreCentro || '—'}</p>
                        {entry.esBorrador && (
                          <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase border border-amber-300 dark:border-amber-500/50">BORR.</span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-slate-500 dark:text-slate-500">{entry.codigoCentro} · {entry.registroId}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{entry.titular || '—'}</p>
                      {ds && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          Avance {ds.completados}/{ds.total}{ds.pendientes.length > 0 ? ` · Falta: ${ds.pendientes.join(', ')}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Columna 2 — Métricas + Estado + Documentos */}
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Métricas */}
                      {m && ([
                        { label: 'Extr.', cumple: m.cumpleExtraccion, val: m.capExtraccion },
                        { label: 'Desn.', cumple: m.cumpleDesnaturalizacion, val: m.capDesnaturalizacion },
                        { label: 'Alm.',  cumple: m.cumpleAlmacenamiento,   val: m.capAlmacenamiento },
                      ]).map(({ label, cumple, val }) => (
                        <span key={label} className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-bold',
                          cumple
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        )}>
                          {label} {typeof val === 'number' ? val.toFixed(1) : val}
                        </span>
                      ))}
                      {m && <span className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />}

                      {/* Estado chips (clickeables, igual que en grid) */}
                      <StatusChip
                        active={entry.aprobado ?? false}
                        onToggle={() => updateHistoricoStatus(entry.id!, 'aprobado', !(entry.aprobado ?? false))}
                        labelOn="Aprobado" labelOff="No aprobado"
                        colorOn="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40"
                        disabled={entry.esBorrador}
                      />
                      <StatusChip
                        active={entry.firmado ?? false}
                        onToggle={() => updateHistoricoStatus(entry.id!, 'firmado', !(entry.firmado ?? false))}
                        labelOn="Firmado" labelOff="Sin firma"
                        colorOn="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/40"
                        disabled={entry.esBorrador}
                      />
                      <StatusChip
                        active={entry.enviado_sernapesca ?? false}
                        onToggle={() => updateHistoricoStatus(entry.id!, 'enviado_sernapesca', !(entry.enviado_sernapesca ?? false))}
                        labelOn="SERNAPESCA" labelOff="Sin enviar"
                        colorOn="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/40"
                        disabled={entry.esBorrador}
                      />
                      <StatusChip
                        active={entry.cliente_notificado ?? false}
                        onToggle={() => updateHistoricoStatus(entry.id!, 'cliente_notificado', !(entry.cliente_notificado ?? false))}
                        labelOn="Notificado" labelOff="Sin notificar"
                        colorOn="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40"
                        disabled={entry.esBorrador}
                      />
                      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                      {/* Documentos */}
                      {docs.map(d => {
                        const url = urls[d as keyof typeof urls];
                        return (
                          <button
                            key={d}
                            onClick={() => setConfirmDownload({ entry, tipo: d, url: url || undefined })}
                            title={url ? `Descargar ${d}` : `${d} — sin versión guardada`}
                            className={cn(
                              'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors',
                              url
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400'
                            )}
                          >
                            ↓ {d}
                          </button>
                        );
                      })}
                    </div>

                    {/* Columna 3 — Fecha + Acciones */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{entry.fechaInspeccion || '—'}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedHistoricoEntry(entry)}
                          className="px-2 py-1 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => loadFromHistorico(entry)}
                          title="Cargar datos en el formulario"
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-bold transition-colors border flex items-center gap-1',
                            entry.esBorrador
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          )}
                        >
                          <Pencil size={10} />
                          {entry.esBorrador ? 'Continuar' : 'Cargar'}
                        </button>
                        <button
                          onClick={() => { setVersionesModal({ registroId: entry.id!, entry }); loadVersiones(entry.id!); }}
                          title="Historial de versiones"
                          className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                        >
                          <Clock size={10} />
                        </button>
                        <button
                          onClick={() => deleteFromHistorico(entry)}
                          title="Eliminar registro"
                          className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-200 dark:border-rose-500/30"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )
          )}
        </FormCard>
          );
        })()}

        {/* ── Modal confirmación descarga Inspector ── */}
        {confirmDownload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-slate-900 dark:text-white text-base">Confirmación de revisión — Inspector</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{confirmDownload.tipo} · {confirmDownload.entry.codigoCentro}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  Como Inspector certificado, confirmo que he revisado la estructura del documento y que los datos son correctos antes de descargarlo.
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Centro:</span> {confirmDownload.entry.nombreCentro}<br />
                <span className="font-semibold">Documento:</span> {confirmDownload.tipo.toUpperCase()}
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setConfirmDownload(null)}
                  className="flex-1 py-2 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const { entry, tipo, url } = confirmDownload;
                    setConfirmDownload(null);
                    if (url) {
                      window.open(url, '_blank');
                    } else if (tipo === 'acta') {
                      const actaState: AppState = {
                        ...entry.snapshot,
                        images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
                      };
                      setGenerating('acta');
                      downloadActaPdf(actaState)
                        .catch(err => {
                          console.error('Error generando el acta PDF:', err);
                          alert('No se pudo generar el acta en PDF. Inténtalo nuevamente.');
                        })
                        .finally(() => setGenerating(null));
                    } else {
                      // Sin PDF guardado: cargar snapshot y regenerar automáticamente
                      docIdRef.current = entry.id!;
                      setState({
                        ...entry.snapshot,
                        images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
                        registroId: entry.registroId,
                        docId: entry.id!,
                      });
                      idbGetAll().then(urlMap => {
                        if (Object.keys(urlMap).length > 0) {
                          setState(prev => ({ ...prev, images: prev.images.map(img => ({ ...img, url: urlMap[img.id] ?? img.url, croppedUrl: urlMap[`crop_${img.id}`] ?? img.croppedUrl })) }));
                        }
                      }).catch(() => {}).finally(() => {
                        setPendingGenerate(tipo as 'certificado' | 'informe');
                      });
                      setActiveTab('general');
                    }
                  }}
                  className="flex-1 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Confirmar y descargar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal historial de versiones ── */}
        {versionesModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Clock size={16} className="text-indigo-500" />
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Historial de versiones</p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{versionesModal.entry.nombreCentro} · {versionesModal.entry.registroId}</p>
                </div>
                <button
                  onClick={() => { setVersionesModal(null); setNombreVersionInput(''); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Guardar versión nombrada */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Guardar versión nombrada</p>
                <div className="flex gap-2">
                  <input
                    value={nombreVersionInput}
                    onChange={e => setNombreVersionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') guardarVersionNombrada(); }}
                    placeholder="Ej: Antes de corrección SERNAPESCA"
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={guardarVersionNombrada}
                    disabled={!nombreVersionInput.trim() || nombrandoVersion}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    {nombrandoVersion ? '…' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Lista de versiones */}
              <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
                {versionesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
                    <span className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                    Cargando versiones…
                  </div>
                ) : versiones.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Sin versiones guardadas aún.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Se crean automáticamente al guardar secciones o generar documentos.</p>
                  </div>
                ) : (
                  versiones.map(v => {
                    const isNamed = v.motivo === 'version_nombrada';
                    const fecha = v.savedAt?.toDate ? v.savedAt.toDate().toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                    const motivoLabel = v.motivo === 'guardado_manual' ? 'Guardado manual' : v.motivo === 'documento_generado' ? `Documento: ${v.documentoTipo ?? ''}` : 'Versión nombrada';
                    return (
                      <div
                        key={v.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors',
                          isNamed
                            ? 'border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-500/5'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isNamed
                            ? <Bookmark size={14} className="text-indigo-500" />
                            : <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          {v.nombreVersion && (
                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate mb-0.5">{v.nombreVersion}</p>
                          )}
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">{fecha}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {v.usuario.nombre} · {motivoLabel}
                          </p>
                        </div>
                        <button
                          onClick={() => restaurarVersion(v)}
                          disabled={restaurandoVersion}
                          className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 transition-colors border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restaurandoVersion ? '…' : 'Restaurar'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {versiones.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Se conservan hasta 30 versiones automáticas · Las versiones nombradas (<Bookmark size={9} className="inline" />) se guardan indefinidamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Drawer lateral ── */}
        {selectedHistoricoEntry && (() => {
          const entry = selectedHistoricoEntry;
          const docs = entry.documentosGenerados ?? [];
          const urls = entry.documentUrls ?? {};
          const snap = entry.snapshot;
          const calcExt = calculateExtraction(snap.extraction.parametros);
          const calcDen = calculateDenaturation(
            snap.denaturation.equipos,
            snap.denaturation.parametros_batch,
            snap.denaturation.parametros_incineracion,
            snap.denaturation.incinerador
          );
          const calcSto = calculateStorage(snap.storage.parametros);
          const m = entry.metricas ?? {
            capExtraccion: calcExt.capacidad_diaria_ton,
            capDesnaturalizacion: calcDen.capacidad_diaria_ton,
            capAlmacenamiento: calcSto.capacidad_almacenaje_ton,
            cumpleExtraccion: calcExt.cumple_norma,
            cumpleDesnaturalizacion: calcDen.cumple_norma,
            cumpleAlmacenamiento: calcSto.cumple_norma,
            sistemaExtraccion: snap.extraction.parametros.sistema_principal,
            sistemaDesnaturalizacion: snap.denaturation.equipos.tipo_sistema,
            modoOperacionMinima: snap.general.modo_operacion_minima ?? false,
            numJaulas: snap.extraction.parametros.numero_total_jaulas,
            jaulas_simultaneas: snap.extraction.parametros.jaulas_simultaneas,
            profundidad_m: snap.extraction.parametros.profundidad_operacion_m,
          };
          const ALL_DOC_TYPES = ['certificado', 'informe', 'acta', 'registro_visita'] as const;
          return (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedHistoricoEntry(null)} />
              <div className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-base truncate">{entry.nombreCentro || '—'}</p>
                    <p className="text-xs font-mono text-slate-500">{entry.codigoCentro} · {entry.registroId}</p>
                  </div>
                  <button onClick={() => setSelectedHistoricoEntry(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-6 px-6 py-5 flex-1">
                  {/* Info */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Centro</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Titular:</span> {entry.titular || '—'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Fecha inspección:</span> {entry.fechaInspeccion || '—'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Certificador:</span> {snap.general?.certificador?.nombre || '—'}</p>
                    {m.modoOperacionMinima && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase">Modo Operación Mínima</span>
                    )}
                  </div>

                  {/* Métricas técnicas */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Métricas técnicas</p>
                    <div className="flex flex-col gap-2">
                      {([
                        { label: 'Cap. Extracción',       val: m.capExtraccion,       cumple: m.cumpleExtraccion,       unit: 'TN/día' },
                        { label: 'Cap. Desnaturalización', val: m.capDesnaturalizacion, cumple: m.cumpleDesnaturalizacion, unit: 'TN/día' },
                        { label: 'Cap. Almacenamiento',    val: m.capAlmacenamiento,    cumple: m.cumpleAlmacenamiento,   unit: 'TN'     },
                      ]).map(({ label, val, cumple, unit }) => (
                        <div key={label} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{typeof val === 'number' ? val.toFixed(2) : '—'} {unit}</span>
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', cumple ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400')}>
                              {cumple ? 'CUMPLE' : 'NO CUMPLE'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <p><span className="font-semibold">Sist. extracción:</span> {m.sistemaExtraccion}</p>
                      <p><span className="font-semibold">Sist. desnat.:</span> {m.sistemaDesnaturalizacion}</p>
                      <p><span className="font-semibold">N° jaulas:</span> {m.numJaulas} (simul.: {m.jaulas_simultaneas})</p>
                      <p><span className="font-semibold">Profundidad:</span> {m.profundidad_m} m</p>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Documentos</p>
                    <div className="flex flex-col gap-2">
                      {ALL_DOC_TYPES.filter(d => docs.includes(d)).map(tipo => {
                        const url = urls[tipo];
                        return (
                          <div key={tipo} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                              {tipo === 'registro_visita' ? 'Registro de Visita' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </span>
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                                <ExternalLink size={11} /> Abrir PDF
                              </a>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedHistoricoEntry(null);
                                  loadFromHistorico(entry);
                                  setTimeout(() => alert('Registro cargado. Genera los documentos para subirlos a la nube.'), 300);
                                }}
                                className="text-xs text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                              >
                                Regenerar →
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {docs.length === 0 && <p className="text-xs text-slate-500 italic">Sin documentos generados.</p>}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    onClick={() => { setSelectedHistoricoEntry(null); loadFromHistorico(entry); }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} /> Cargar en formulario
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    );
  };

  const CompanyHint = ({ section }: { section: 'extraccion' | 'desnaturalizacion' | 'almacenamiento' }) => {
    if (!showHints) return null;
    const titular = state.general.centro_cultivo.titular.toUpperCase();
    if (!titular.trim()) return null;
    const hint = EMPRESA_HINTS.find(h => h.keywords.some(k => titular.includes(k)));
    if (!hint) return null;
    const text = hint[section];
    if (!text) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20"
      >
        <Info size={13} className="shrink-0 mt-0.5 text-indigo-400 dark:text-indigo-400" />
        <p className="text-[11px] leading-relaxed text-indigo-700/80 dark:text-indigo-300/70">{text}</p>
      </motion.div>
    );
  };

  const ExtractionView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Sistema de Extracción" 
          icon={Waves} 
          description="Cálculo de capacidad diaria de extracción de mortalidad (Mínimo 15 TN/Día)."
        />
        <StatusBadge status={state.extraction.resultados.cumple_norma} />
      </div>
      <CompanyHint section="extraccion" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormCard title="Métodos y Equipos" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sistemas de Apoyo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckboxField label="Buceo" checked={state.extraction.sistemas_apoyo.buceo} onChange={(v) => updateExtraction('sistemas_apoyo.buceo', v)} />
                <CheckboxField label="ROV" checked={state.extraction.sistemas_apoyo.rov} onChange={(v) => updateExtraction('sistemas_apoyo.rov', v)} />
                <CheckboxField label="Yoma" checked={state.extraction.sistemas_apoyo.succion_yoma} onChange={(v) => updateExtraction('sistemas_apoyo.succion_yoma', v)} />
                <CheckboxField label="Automática" checked={state.extraction.sistemas_apoyo.automatica} onChange={(v) => updateExtraction('sistemas_apoyo.automatica', v)} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Sistema Principal</label>
                <select
                  aria-label="Sistema Principal" value={state.extraction.parametros.sistema_principal}
                  onChange={(e) => updateExtraction('parametros.sistema_principal', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="LIFT-UP">LIFT-UP</option>
                  <option value="Mortex HW">Mortex HW</option>
                  <option value="ROV">ROV</option>
                  <option value="Succión por Yoma">Succión por Yoma</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Talla de Pez</label>
                <select
                  aria-label="Talla de Pez" value={state.extraction.parametros.talla_pez}
                  onChange={(e) => updateExtraction('parametros.talla_pez', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="Pequeño (<1.5kg)">Pequeño (&lt;1.5kg)</option>
                  <option value="Mediano (1.5-4.5kg)">Mediano (1.5-4.5kg)</option>
                  <option value="Grande (>=4.5kg)">Grande (&gt;=4.5kg)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Línea de Extracción (Catálogo)</label>
                <select
                  aria-label="Línea de Extracción (Catálogo)" value={state.extraction.parametros.id_catalogo_equipo}
                  onChange={(e) => handleSelectExtractionSystem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="">Seleccionar equipo...</option>
                  {CATALOGO_EXTRACCION.sistemas.map(s => (
                    <option key={s.id} value={s.id}>{s.marca} {s.modelo}</option>
                  ))}
                </select>
              </div>

              <InputField label="Marca Equipo" value={state.extraction.parametros.marca_equipo} onChange={(v) => updateExtraction('parametros.marca_equipo', v)} />
              {!state.general.modo_operacion_minima && (<>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Equipo de Aire (Catálogo)</label>
                  <select
                    aria-label="Equipo de Aire (Catálogo)" value={state.extraction.parametros.id_catalogo_compresor}
                    onChange={(e) => handleSelectCompressor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                  >
                    <option value="">Seleccionar compresor...</option>
                    {CATALOGO_EXTRACCION.compresores.map(c => (
                      <option key={c.id} value={c.id}>{c.marca} {c.modelo}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Tipo Compresor" value={state.extraction.parametros.tipo_compresor} onChange={(v) => updateExtraction('parametros.tipo_compresor', v)} />
                  <InputField label="Potencia (CFM)" type="number" value={state.extraction.parametros.potencia_cfm} onChange={(v) => updateExtraction('parametros.potencia_cfm', v)} suffix="CFM" />
                </div>
                <InputField
                  label="Ubicación del Compresor"
                  value={state.extraction.parametros.ubicacion_compresor}
                  onChange={(v) => updateExtraction('parametros.ubicacion_compresor', v)}
                  placeholder="Ej. A/N Pontón, cubierta popa"
                />
              </>)}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Parámetros Técnicos</h4>
              <div className={`grid gap-4 ${state.general.modo_operacion_minima ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <InputField label="Total Jaulas" type="number" value={state.extraction.parametros.numero_total_jaulas} onChange={(v) => updateExtraction('parametros.numero_total_jaulas', v)} />
                {!state.general.modo_operacion_minima && (
                  <InputField label="Jaulas Simult." type="number" value={state.extraction.parametros.jaulas_simultaneas} onChange={(v) => updateExtraction('parametros.jaulas_simultaneas', v)} />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Personal Op." type="number" value={state.extraction.parametros.personal_operativo} onChange={(v) => updateExtraction('parametros.personal_operativo', v)} />
                <InputField label="Profundidad" type="number" value={state.extraction.parametros.profundidad_operacion_m} onChange={(v) => updateExtraction('parametros.profundidad_operacion_m', v)} suffix="m" />
              </div>
              <InputField label="Horas Trabajo" type="number" value={state.extraction.parametros.horas_efectivas_trabajo} onChange={(v) => updateExtraction('parametros.horas_efectivas_trabajo', v)} suffix="Hrs" min={0.5} max={24} />
              <InputField label="Ajuste Biomasa" type="number" value={state.extraction.parametros.factor_ajuste_biomasa} onChange={(v) => updateExtraction('parametros.factor_ajuste_biomasa', v)} min={0.01} suffix="× factor" />
              <InputField label="Disponibilidad fd₀" type="number" value={state.extraction.parametros.disponibilidad_base_fd} onChange={(v) => updateExtraction('parametros.disponibilidad_base_fd', v)} min={0.1} max={1.0} />
              {!state.general.modo_operacion_minima && (
                <InputField label="Motocompresores/Jaula" type="number" value={state.extraction.parametros.motocompresores_por_jaula} onChange={(v) => updateExtraction('parametros.motocompresores_por_jaula', v)} />
              )}
              {state.extraction.sistemas_apoyo.buceo && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipo de Buceo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="N° Teams" type="number" value={state.extraction.parametros.n_teams_buceo} onChange={(v) => updateExtraction('parametros.n_teams_buceo', v)} />
                    <InputField label="N° Buzos/Team" type="number" value={state.extraction.parametros.n_buzos_por_team} onChange={(v) => updateExtraction('parametros.n_buzos_por_team', v)} />
                  </div>
                  <InputField label="Periodicidad Buceo" value={state.extraction.parametros.periodicidad_buceo} onChange={(v) => updateExtraction('parametros.periodicidad_buceo', v)} placeholder="Ej: DIARIA" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Observación Sistema</label>
                  <button
                    type="button"
                    onClick={() => updateExtraction('parametros.observacion_sistema', buildObservacionSistema())}
                    className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
                    title="Regenerar glosa automática según sistemas de apoyo seleccionados"
                  >
                    <RefreshCw size={11} />
                    Regenerar
                  </button>
                </div>
                <textarea
                  value={state.extraction.parametros.observacion_sistema}
                  onChange={(e) => updateExtraction('parametros.observacion_sistema', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </FormCard>

        <div className="space-y-6">
          <FormCard title="Resultados" className="bg-indigo-900 border-indigo-800">
            <div className="space-y-6 text-white">
              {!state.general.modo_operacion_minima && (
                <div>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Ciclos por Día</p>
                  <p className="text-4xl font-mono font-bold tracking-tighter">{state.extraction.resultados.ciclos_por_dia}</p>
                </div>
              )}
              <div className={state.general.modo_operacion_minima ? '' : 'pt-6 border-t border-indigo-800'}>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Diaria</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-mono font-bold tracking-tighter text-emerald-400">
                    {state.general.modo_operacion_minima ? 15 : state.extraction.resultados.capacidad_diaria_ton}
                  </p>
                  <p className="text-indigo-300 font-medium">TN/DÍA</p>
                </div>
              </div>
            </div>
          </FormCard>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              La capacidad mínima exigida por la Res. 1511 es de 15 toneladas diarias para sistemas de extracción.
            </p>
          </div>
        </div>
      </div>

      <FormCard title="Equipos de Extracción">
        <div className="space-y-4">
          {(state.extraction.equipos_extraccion ?? []).length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-2">Sin equipos registrados.</p>
          )}
          {(state.extraction.equipos_extraccion ?? []).map((equipo, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipo {idx + 1}</span>
                <button onClick={() => handleRemoveExtractionEquipo(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">✕ Quitar</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
                <select
                  aria-label="Tipo" value={equipo.tipo}
                  onChange={(e) => handleUpdateExtractionEquipo(idx, 'tipo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="Principal">Principal</option>
                  <option value="Apoyo">Apoyo</option>
                  <option value="Backup">Backup</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Línea (Catálogo)</label>
                <select
                  aria-label="Línea (Catálogo)" value={equipo.id_catalogo}
                  onChange={(e) => handleSelectExtractionEquipoItem(idx, e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="">Seleccionar...</option>
                  {CATALOGO_EXTRACCION.sistemas.map(s => (
                    <option key={s.id} value={s.id}>{s.marca} {s.modelo}</option>
                  ))}
                </select>
              </div>
              <InputField label="Marca" value={equipo.marca} onChange={(v) => handleUpdateExtractionEquipo(idx, 'marca', v)} />
              <InputField label="Capacidad" type="number" value={equipo.capacidad_kg_h} onChange={(v) => handleUpdateExtractionEquipo(idx, 'capacidad_kg_h', v)} suffix="Kg/Hr" />
              <div className="md:col-span-2">
                <InputField label="Ubicación" value={equipo.ubicacion} onChange={(v) => handleUpdateExtractionEquipo(idx, 'ubicacion', v)} placeholder="Ej: A/N Pontón, cubierta popa" />
              </div>
            </div>
          ))}
          <button
            onClick={handleAddExtractionEquipo}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm font-medium"
          >
            + Agregar Equipo de Extracción
          </button>
        </div>
      </FormCard>

      {(isAdmin || isEditor) && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('extraction')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'extraction'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'extraction'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const DenaturationView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader
          title={`Desnaturalización (${state.denaturation.equipos.tipo_sistema === 'Incineración' ? 'Incineración Térmica' : 'Ensilaje Químico'})`}
          icon={FlaskConical}
          description={state.denaturation.equipos.tipo_sistema === 'Incineración'
            ? 'Cálculo de capacidad por incineración térmica (Mínimo 15 TN/Día).'
            : 'Cálculo de capacidad por ciclos (Batch) y equipos de trituración (Mínimo 15 TN/Día).'}
        />
        <StatusBadge status={state.denaturation.resultados.cumple_norma} />
      </div>
      <CompanyHint section="desnaturalizacion" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FormCard title="Tipo de Sistema">
            <div className="flex gap-4">
              <button 
                onClick={() => updateDenaturation('equipos.tipo_sistema', 'Ensilaje')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                  state.denaturation.equipos.tipo_sistema === 'Ensilaje' 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                Ensilaje Químico
              </button>
              <button 
                onClick={() => updateDenaturation('equipos.tipo_sistema', 'Incineración')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                  state.denaturation.equipos.tipo_sistema === 'Incineración' 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                Incineración Térmica
              </button>
            </div>
          </FormCard>

          {state.denaturation.equipos.tipo_sistema === 'Ensilaje' ? (
            <>
              <FormCard title="Equipos y Trituración">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Olla Trituradora (Catálogo)</label>
                <select 
                  aria-label="Olla Trituradora (Catálogo)" value={state.denaturation.equipos.id_catalogo_trituradora}
                  onChange={(e) => handleSelectTrituradora(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                      <option value="">Seleccionar trituradora...</option>
                      {CATALOGO_DESNATURALIZACION.trituradoras.map(t => (
                        <option key={t.id} value={t.id}>{t.marca_modelo}</option>
                      ))}
                      {catalogoCustom.filter(c => c.tipo === 'trituradora').length > 0 && (
                        <optgroup label="— Equipos personalizados —">
                          {catalogoCustom.filter(c => c.tipo === 'trituradora').map(c => (
                            <option key={c.marca_modelo} value={c.marca_modelo}>{c.marca_modelo}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <InputField label="Marca/Modelo Olla" value={state.denaturation.equipos.marca_modelo}
                    onChange={(v) => updateDenaturation('equipos.marca_modelo', v)}
                    onBlur={() => checkNuevoEquipo(state.denaturation.equipos.marca_modelo, 'trituradora')}
                  />
                  <InputField label="Material Construcción" value={state.denaturation.equipos.material_construccion} onChange={(v) => updateDenaturation('equipos.material_construccion', v)} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estado Olla Trituradora</label>
                    <select
                      aria-label="Estado Olla Trituradora" value={state.denaturation.equipos.estado_olla}
                      onChange={(e) => updateDenaturation('equipos.estado_olla', e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium text-sm dark:[color-scheme:dark]",
                        state.denaturation.equipos.estado_olla === 'Bueno'
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                          : state.denaturation.equipos.estado_olla === 'Regular'
                          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                          : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
                      )}
                    >
                      <option value="Bueno">Bueno — sin fugas</option>
                      <option value="Regular">Regular — presenta observaciones</option>
                      <option value="Malo">Malo — requiere revisión</option>
                    </select>
                  </div>
                  <InputField label="Velocidad Nominal" type="number" value={state.denaturation.equipos.velocidad_nominal_kg_hr} onChange={(v) => updateDenaturation('equipos.velocidad_nominal_kg_hr', v)} suffix="Kg/Hr" />
                  <InputField label="Horas Operación" type="number" value={state.denaturation.equipos.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('equipos.horas_funcionamiento_dia', v)} suffix="Hrs/Día" />
                  <InputField label="Cantidad Sistemas de Ensilaje" type="number" value={state.denaturation.equipos.cantidad_sistemas ?? 1} onChange={(v) => updateDenaturation('equipos.cantidad_sistemas', v)} suffix="N°" min={1} />
                  <InputField label="Cantidad Ollas Trituradoras" type="number" value={state.denaturation.equipos.cantidad_ollas ?? 1} onChange={(v) => updateDenaturation('equipos.cantidad_ollas', v)} suffix="N° (×capacidad)" min={1} />
                  <div className="md:col-span-2 space-y-4 py-2">
                    <div className="flex items-center gap-8">
                      <CheckboxField label="Prepicador" checked={state.denaturation.equipos.cuenta_con_prepicador} onChange={(v) => updateDenaturation('equipos.cuenta_con_prepicador', v)} />
                      <CheckboxField label="Recirculación Ácido" checked={state.denaturation.equipos.cuenta_con_recirculacion_acido} onChange={(v) => updateDenaturation('equipos.cuenta_con_recirculacion_acido', v)} />
                    </div>
                    {state.denaturation.equipos.cuenta_con_prepicador && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                        <InputField
                          label="Marca / Modelo Prepicador"
                          type="text"
                          value={state.denaturation.equipos.marca_modelo_prepicador}
                          onChange={(v) => updateDenaturation('equipos.marca_modelo_prepicador', v)}
                        />
                        <InputField
                          label="Cantidad Prepicadores"
                          type="number"
                          value={state.denaturation.equipos.cantidad_prepicador}
                          onChange={(v) => updateDenaturation('equipos.cantidad_prepicador', v)}
                          suffix="Unidad(es)"
                          min={1}
                        />
                        <InputField
                          label="Capacidad Prepicador"
                          type="number"
                          value={state.denaturation.equipos.capacidad_prepicador_kg_hr}
                          onChange={(v) => updateDenaturation('equipos.capacidad_prepicador_kg_hr', v)}
                          suffix="Kg/Hr"
                        />
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Factor Eficiencia — {Math.round(state.denaturation.equipos.factor_eficiencia_prepicador * 100)}% del tiempo de proceso
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={5}
                              value={Math.round(state.denaturation.equipos.factor_eficiencia_prepicador * 100)}
                              onChange={(e) => updateDenaturation('equipos.factor_eficiencia_prepicador', parseFloat(e.target.value) / 100)}
                              className="flex-1 accent-indigo-600"
                            />
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 w-10 text-right">
                              {Math.round(state.denaturation.equipos.factor_eficiencia_prepicador * 100)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Reduce el tiempo de procesamiento en un {Math.round((1 - state.denaturation.equipos.factor_eficiencia_prepicador) * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FormCard>

              <FormCard title="Cálculo de Ciclo (Batch)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const tri = CATALOGO_DESNATURALIZACION.trituradoras.find(
                      t => t.id === state.denaturation.equipos.id_catalogo_trituradora
                    );
                    if (!tri?.configuraciones_batch?.length) return null;
                    return (
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Configuración de Batch (Catálogo)</label>
                        <select
                          aria-label="Configuración de Batch (Catálogo)"
                          defaultValue=""
                          key={tri.id}
                          onChange={(e) => {
                            const cfg = tri.configuraciones_batch!.find(c => c.label === e.target.value);
                            if (cfg) {
                              updateDenaturation('parametros_batch.kilos_por_batch', cfg.kilos);
                              updateDenaturation('parametros_batch.tiempo_procesamiento_min', cfg.t_proceso);
                              updateDenaturation('parametros_batch.tiempo_pausa_min', cfg.t_pausa);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="">Seleccionar configuración registrada...</option>
                          {tri.configuraciones_batch.map(c => (
                            <option key={c.label} value={c.label}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  <InputField label="Kilos por Batch" type="number" value={state.denaturation.parametros_batch.kilos_por_batch} onChange={(v) => updateDenaturation('parametros_batch.kilos_por_batch', v)} suffix="Kg" min={1} max={5000} />
                  <InputField label="Tiempo Proceso" type="number" value={state.denaturation.parametros_batch.tiempo_procesamiento_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_procesamiento_min', v)} suffix="Min" min={1} max={240} />
                  <InputField label="Tiempo Pausa" type="number" value={state.denaturation.parametros_batch.tiempo_pausa_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_pausa_min', v)} suffix="Min" min={0} max={120} />
                </div>
              </FormCard>

              <FormCard title="Incinerador Secundario (Sistema Complementario)">
                <div className="space-y-4">
                  <CheckboxField
                    label="¿Centro cuenta con incinerador como sistema secundario?"
                    checked={state.denaturation.incinerador.activo}
                    onChange={(v) => updateDenaturation('incinerador.activo', v)}
                  />
                  {state.denaturation.incinerador.activo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Incinerador (Catálogo)</label>
                        <select
                          aria-label="Incinerador (Catálogo)" value={state.denaturation.incinerador.id_catalogo}
                          onChange={(e) => handleSelectIncineradorSecundario(e.target.value)}
                          className="w-full px-4 py-2.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="">Seleccionar incinerador...</option>
                          <optgroup label="— Catálogo estándar —">
                            {CATALOGO_DESNATURALIZACION.incineradores.map(i => (
                              <option key={i.id} value={i.id}>{i.marca_modelo} — {i.capacidad_carga_kg_h} kg/h</option>
                            ))}
                          </optgroup>
                          {catalogoCustom.filter(c => c.tipo === 'incinerador').length > 0 && (
                            <optgroup label="— Guardados —">
                              {catalogoCustom.filter(c => c.tipo === 'incinerador').map(c => (
                                <option key={c.id} value={`custom:${c.id}`}>{c.marca_modelo} — {c.capacidad_carga_kg_h ?? 0} kg/h</option>
                              ))}
                            </optgroup>
                          )}
                          <option value={ID_NUEVO_INCINERADOR}>➕ Nuevo incinerador (manual)</option>
                        </select>
                      </div>
                      <InputField label="Horas Operación" type="number" value={state.denaturation.incinerador.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('incinerador.horas_funcionamiento_dia', v)} suffix="Hrs/Día" min={1} max={24} />
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Capacidad Calculada</label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {((state.denaturation.incinerador.capacidad_carga_kg_h * state.denaturation.incinerador.horas_funcionamiento_dia) / 1000).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">TN/Día</span>
                        </div>
                      </div>
                      {(state.denaturation.incinerador.id_catalogo || state.denaturation.incinerador.activo) && (
                        <>
                          <InputField label="Marca / Modelo" value={state.denaturation.incinerador.marca_modelo} onChange={(v) => updateDenaturation('incinerador.marca_modelo', v)} />
                          <InputField label="Capacidad Carga" type="number" value={state.denaturation.incinerador.capacidad_carga_kg_h} onChange={(v) => updateDenaturation('incinerador.capacidad_carga_kg_h', v)} suffix="kg/h" min={0} max={5000} />
                          <InputField label="Cámara Primaria (Dimensiones)" value={state.denaturation.parametros_incineracion.camara_primaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_primaria', v)} />
                          <InputField label="N° Quemadores Primaria" type="number" value={state.denaturation.incinerador.num_quemadores_primaria} onChange={(v) => updateDenaturation('incinerador.num_quemadores_primaria', v)} min={0} max={10} />
                          <InputField label="Temp. Cámara Primaria" type="number" value={state.denaturation.incinerador.temperatura_camara_primaria_c} onChange={(v) => updateDenaturation('incinerador.temperatura_camara_primaria_c', v)} suffix="°C" min={0} max={2000} />
                          <InputField label="Cámara Secundaria (Dimensiones)" value={state.denaturation.parametros_incineracion.camara_secundaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_secundaria', v)} />
                          <InputField label="N° Quemadores Secundaria" type="number" value={state.denaturation.incinerador.num_quemadores_secundaria} onChange={(v) => updateDenaturation('incinerador.num_quemadores_secundaria', v)} min={0} max={10} />
                          <InputField label="Temp. Cámara Secundaria" type="number" value={state.denaturation.incinerador.temperatura_camara_secundaria_c} onChange={(v) => updateDenaturation('incinerador.temperatura_camara_secundaria_c', v)} suffix="°C" min={0} max={2000} />
                          <InputField label="Requerimiento Energético" value={state.denaturation.incinerador.requerimiento_energetico} onChange={(v) => updateDenaturation('incinerador.requerimiento_energetico', v)} />
                        </>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Sistema de Carga</label>
                        <select aria-label="Sistema de Carga" value={state.denaturation.incinerador.sistema_carga} onChange={(e) => updateDenaturation('incinerador.sistema_carga', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500">
                          {OPCIONES_INCINERADOR.sistema_carga.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Sistema de Descarga</label>
                        <select aria-label="Sistema de Descarga" value={state.denaturation.incinerador.sistema_descarga} onChange={(e) => updateDenaturation('incinerador.sistema_descarga', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500">
                          {OPCIONES_INCINERADOR.sistema_descarga.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Disposición Final</label>
                        <select aria-label="Disposición Final" value={state.denaturation.incinerador.disposicion_final} onChange={(e) => updateDenaturation('incinerador.disposicion_final', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500">
                          {OPCIONES_INCINERADOR.disposicion_final.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Almacenamiento Gas</label>
                        <select aria-label="Almacenamiento Gas" value={state.denaturation.incinerador.almacenamiento_gas} onChange={(e) => updateDenaturation('incinerador.almacenamiento_gas', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500">
                          {OPCIONES_INCINERADOR.almacenamiento_gas.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <InputField label="Observaciones" value={state.denaturation.incinerador.observaciones} onChange={(v) => updateDenaturation('incinerador.observaciones', v)} />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                        {findIncineradorDuplicado(catalogoCustom, state.denaturation.incinerador.marca_modelo) && (
                          <span className="text-xs text-slate-500">Ya existe: se actualizará el guardado.</span>
                        )}
                        <button
                          type="button"
                          onClick={handleGuardarIncinerador}
                          disabled={guardandoInc === 'guardando' || !state.denaturation.incinerador.marca_modelo.trim()}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {guardandoInc === 'guardando' ? 'Guardando…' : guardandoInc === 'guardado' ? 'Guardado ✓' : 'Guardar en catálogo'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </FormCard>
            </>
          ) : (
            <>
            {(() => {
              // Propuesta D: advertencia solo cuando incineración es el sistema ÚNICO y principal.
              // Si es complementario (tipo_sistema === 'Ensilaje' con incinerador.activo), no aplica.
              const cap_kg_h = state.denaturation.parametros_incineracion.capacidad_carga_kg_h;
              const max_ton_dia = (cap_kg_h * 24) / 1000;
              return cap_kg_h > 0 && max_ton_dia < 15 ? (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-500/40 rounded-xl text-sm">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Capacidad insuficiente:</span> Este incinerador alcanza un máximo de{' '}
                    <span className="font-mono font-bold">{max_ton_dia.toFixed(2)} TN/día</span> operando 24 horas.
                    {' '}El umbral mínimo exigido por la Res. Exenta N°1511/2021 es de <span className="font-semibold">15 TN/día</span>.
                    {' '}Como sistema único principal, no puede certificar cumplimiento normativo.
                    {' '}Considere complementar con un sistema de ensilaje.
                  </div>
                </div>
              ) : null;
            })()}
            <FormCard title="Sistema de Incineración">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Incinerador (Catálogo)</label>
                <select 
                  aria-label="Incinerador (Catálogo)" value={state.denaturation.equipos.id_catalogo_incinerador}
                  onChange={(e) => handleSelectIncinerador(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                    <option value="">Seleccionar incinerador...</option>
                    {CATALOGO_DESNATURALIZACION.incineradores.map(i => (
                      <option key={i.id} value={i.id}>{i.marca_modelo}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Marca/Modelo" value={state.denaturation.equipos.marca_modelo} onChange={(v) => updateDenaturation('equipos.marca_modelo', v)} />
                <InputField label="Horas Operación" type="number" value={state.denaturation.equipos.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('equipos.horas_funcionamiento_dia', v)} suffix="Hrs/Día" />
                <InputField label="Capacidad Carga" type="number" value={state.denaturation.parametros_incineracion.capacidad_carga_kg_h} onChange={(v) => updateDenaturation('parametros_incineracion.capacidad_carga_kg_h', v)} suffix="Kg/Hr" />
                <InputField label="Temp. Operación" value={state.denaturation.parametros_incineracion.temperatura_operacion} onChange={(v) => updateDenaturation('parametros_incineracion.temperatura_operacion', v)} />
                <InputField label="Cámara Primaria" value={state.denaturation.parametros_incineracion.camara_primaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_primaria', v)} />
                <InputField label="Cámara Secundaria" value={state.denaturation.parametros_incineracion.camara_secundaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_secundaria', v)} />
              </div>
            </FormCard>
            </>
          )}

          <FormCard title="Generación Eléctrica">
            <div className="space-y-4">
              {state.denaturation.generacion_electrica.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-2">Sin generadores registrados.</p>
              )}
              {state.denaturation.generacion_electrica.map((gen, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="md:col-span-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generador {idx + 1}</span>
                    <button onClick={() => handleRemoveGenerator(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">✕ Quitar</button>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
                    <select
                      aria-label="Tipo" value={gen.tipo}
                      onChange={(e) => handleUpdateGenerator(idx, 'tipo', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Backup">Backup</option>
                      <option value="Emergencia">Emergencia</option>
                    </select>
                  </div>

                  {/* Catálogo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Modelo (Catálogo)</label>
                    <select
                      aria-label="Modelo (Catálogo)" value={gen.catalogoId || ''}
                      onChange={(e) => handleSelectGenerator(idx, e.target.value)}
                      className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                    >
                      <option value="">Seleccionar...</option>
                      {CATALOGO_GENERADORES.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.id === 'otro' ? 'Otro (Especificar)' : `${g.marca} ${g.modelo} — ${g.kva} kVA`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {gen.catalogoId === 'otro' && (
                    <InputField
                      label="Modelo"
                      value={gen.modelo}
                      onChange={(v) => handleUpdateGenerator(idx, 'modelo', v)}
                      placeholder="Ej: WPG55L2"
                    />
                  )}

                  <InputField label="Marca" value={gen.marca} onChange={(v) => handleUpdateGenerator(idx, 'marca', v)} />
                  <InputField label="Capacidad" type="number" value={gen.capacidad_kva} onChange={(v) => handleUpdateGenerator(idx, 'capacidad_kva', v)} suffix="kVA" />
                  <div className="md:col-span-2">
                    <InputField label="Ubicación" value={gen.ubicacion} onChange={(v) => handleUpdateGenerator(idx, 'ubicacion', v)} placeholder="Ej: Pontón de ensilaje" />
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddGenerator}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm font-medium"
              >
                + Agregar Generador
              </button>
            </div>
          </FormCard>
        </div>

        <div className="space-y-6">
          <FormCard title="Resultados" className="bg-slate-900 border-slate-800">
            <div className="space-y-6 text-white">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Duración Batch</p>
                <p className="text-4xl font-mono font-bold tracking-tighter">{state.denaturation.resultados.duracion_total_batch_min} <span className="text-xl text-slate-500">MIN</span></p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Batches por Día</p>
                <p className="text-4xl font-mono font-bold tracking-tighter">{state.denaturation.resultados.numero_batches_dia}</p>
              </div>
              <div className="pt-6 border-t border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Diaria</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-mono font-bold tracking-tighter text-indigo-400">{state.denaturation.resultados.capacidad_diaria_ton}</p>
                  <p className="text-slate-500 font-medium">TN/DÍA</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Observación Acta (Auto)</p>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-[10px] leading-relaxed text-slate-300 font-mono italic">
                    {state.denaturation.resultados.observacion_automatica}
                  </p>
                </div>
              </div>
            </div>
          </FormCard>
        </div>
      </div>

      {(isAdmin || isEditor) && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('denaturation')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'denaturation'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'denaturation'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const StorageView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Almacenamiento" 
          icon={Database} 
          description="Capacidad de acopio de biomasa desnaturalizada (Mínimo 20 TN)."
        />
        <StatusBadge status={state.storage.resultados.cumple_norma} />
      </div>
      <CompanyHint section="almacenamiento" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FormCard title="Capacidad de Estanques">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Capacidad Estanque (Catálogo)</label>
                <select
                  aria-label="Capacidad Estanque (Catálogo)"
                  value={state.storage.parametros.capacidad_almacenaje_m3}
                  onChange={(e) => updateStorage('parametros.capacidad_almacenaje_m3', parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar m³...</option>
                  {CATALOGO_ALMACENAMIENTO.map(m3 => (
                    <option key={m3} value={m3}>{m3} m³</option>
                  ))}
                </select>
              </div>
              <InputField label="Capacidad Estanque" type="number" value={state.storage.parametros.capacidad_almacenaje_m3} onChange={(v) => updateStorage('parametros.capacidad_almacenaje_m3', v)} suffix="m³" />
              <InputField label="Factor Densidad" type="number" value={state.storage.parametros.factor_densidad} onChange={(v) => updateStorage('parametros.factor_densidad', v)} suffix="TN/m³" min={0.5} max={2.5} />
              <div className="md:col-span-2">
                <InputField label="Observaciones" value={state.storage.parametros.observaciones} onChange={(v) => updateStorage('parametros.observaciones', v)} />
              </div>
            </div>
          </FormCard>

          <FormCard title="Dimensiones A/N Pontón">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cargar desde catálogo</label>
                <select
                  aria-label="Cargar desde catálogo"
                  defaultValue=""
                  onChange={(e) => {
                    const p = CATALOGO_PLATAFORMAS.find(p => p.nombre === e.target.value);
                    if (p) {
                      setState(prev => ({
                        ...prev,
                        storage: {
                          ...prev.storage,
                          infraestructura: {
                            ...prev.storage.infraestructura,
                            eslora_m: p.eslora,
                            manga_m: p.manga,
                            puntual_m: p.puntal,
                          }
                        }
                      }));
                    }
                    e.target.value = '';
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium text-sm"
                >
                  <option value="">Seleccionar plataforma conocida…</option>
                  {CATALOGO_PLATAFORMAS.map(p => (
                    <option key={p.nombre} value={p.nombre}>
                      {p.nombre} — {p.eslora} × {p.manga} × {p.puntal} m
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Eslora" value={state.storage.infraestructura.eslora_m} onChange={(v) => updateStorage('infraestructura.eslora_m', v)} suffix="m" placeholder="25" />
                <InputField label="Manga" value={state.storage.infraestructura.manga_m} onChange={(v) => updateStorage('infraestructura.manga_m', v)} suffix="m" placeholder="8" />
                <InputField label="Puntual" value={state.storage.infraestructura.puntual_m} onChange={(v) => updateStorage('infraestructura.puntual_m', v)} suffix="m" placeholder="1.2" />
              </div>
            </div>
          </FormCard>

          <FormCard title="Infraestructura y Seguridad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Material Pretil</label>
                <select
                  aria-label="Material Pretil"
                  value={OPCIONES_INFRAESTRUCTURA.pretil_material.includes(state.storage.infraestructura.pretil_material) || state.storage.infraestructura.pretil_material === '' ? state.storage.infraestructura.pretil_material : '__otro__'}
                  onChange={(e) => {
                    if (e.target.value !== '__otro__') updateStorage('infraestructura.pretil_material', e.target.value);
                    else updateStorage('infraestructura.pretil_material', '');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.pretil_material.map(o => <option key={o}>{o}</option>)}
                  <option value="__otro__">Otro (especificar)…</option>
                </select>
                {!OPCIONES_INFRAESTRUCTURA.pretil_material.includes(state.storage.infraestructura.pretil_material) && state.storage.infraestructura.pretil_material !== '' && (
                  <input
                    type="text"
                    value={state.storage.infraestructura.pretil_material}
                    onChange={(e) => updateStorage('infraestructura.pretil_material', e.target.value)}
                    placeholder="Especificar material…"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Estado Pretil</label>
                <select
                  aria-label="Estado Pretil" value={state.storage.infraestructura.pretil_estado}
                  onChange={(e) => updateStorage('infraestructura.pretil_estado', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Material Piping</label>
                <select
                  aria-label="Material Piping" value={state.storage.infraestructura.piping_material}
                  onChange={(e) => updateStorage('infraestructura.piping_material', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_material.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Diámetro Piping</label>
                <select
                  aria-label="Diámetro Piping" value={state.storage.infraestructura.piping_diametro}
                  onChange={(e) => updateStorage('infraestructura.piping_diametro', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_diametro.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Válvulas Piping</label>
                <select
                  aria-label="Válvulas Piping" value={state.storage.infraestructura.piping_valvulas}
                  onChange={(e) => updateStorage('infraestructura.piping_valvulas', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_valvulas.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Estado Piping</label>
                <select
                  aria-label="Estado Piping" value={state.storage.infraestructura.piping_estado}
                  onChange={(e) => updateStorage('infraestructura.piping_estado', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
            </div>
          </FormCard>
        </div>

        <div className="space-y-6">
          <FormCard title="Resultado Almacenaje" className="bg-emerald-900 border-emerald-800">
            <div className="space-y-6 text-white">
              <div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Total</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-mono font-bold tracking-tighter text-white">{state.storage.resultados.capacidad_almacenaje_ton}</p>
                  <p className="text-emerald-300 font-medium">TN</p>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest mb-2">Fórmula Aplicada</p>
                <p className="text-xs font-mono">m³ × 1.2 (Densidad Ácido Fórmico)</p>
              </div>
            </div>
          </FormCard>
        </div>
      </div>

      {(isAdmin || isEditor) && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('storage')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'storage'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'storage'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const ReportView = () => {

    const SECCIONES_CONTEO: { label: string; key: string }[] = [
      { label: 'General',          key: 'General' },
      { label: 'Extracción',       key: 'Extracción' },
      { label: 'Desnaturalización',key: 'Desnaturalización' },
      { label: 'Almacenamiento',   key: 'Almacenamiento' },
    ];
    const clasificadas = new Set(SECCIONES_CONTEO.map(s => s.key));
    const sinClasificar = state.images.filter(i => !clasificadas.has(i.seccion)).length;
    const total = state.images.length;

    const toggleFilter = (key: string) =>
      setActiveFilter(prev => (prev === key ? null : key));

    const filteredImages = activeFilter === null
      ? state.images
      : activeFilter === '__sin_clasificar'
        ? state.images.filter(i => !clasificadas.has(i.seccion))
        : state.images.filter(i => i.seccion === activeFilter);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader
          title="Informe Técnico e Imágenes"
          icon={Camera}
          description="Grilla de registro fotográfico. Arrastra imágenes y asigna estados y leyendas."
        />

        {/* ── Logo del cliente para la portada ── */}
        {userRole !== null && Object.keys(logosEmpresas).length > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <Building2 size={18} className="text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Logo en portada del informe</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {logoClienteUrl
                  ? logoManualOverride
                    ? `Logo seleccionado manualmente`
                    : `Auto-seleccionado para "${state.general.centro_cultivo.titular || 'empresa'}"`
                  : 'Sin logo de empresa en portada.'}
              </p>
            </div>
            {logoClienteUrl && (
              <img src={logoClienteUrl} alt="logo cliente" className="h-10 w-auto object-contain max-w-[80px] shrink-0" />
            )}
            <div className="flex flex-col gap-1 shrink-0">
              <select
                aria-label="Logo del cliente" value={logoClienteUrl ?? ''}
                onChange={e => {
                  const url = e.target.value || null;
                  const nombre = url ? (Object.keys(logosEmpresas).find(n => logosEmpresas[n] === url) ?? null) : null;
                  setLogoManualOverride(true);
                  setLogoClienteUrl(url);
                  saveLogoClienteSettings(nombre, true);
                }}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">Sin logo</option>
                {Object.entries(logosEmpresas).map(([name, url]) => (
                  <option key={name} value={url}>{name}</option>
                ))}
              </select>
              {logoManualOverride && (
                <button
                  onClick={() => { setLogoManualOverride(false); saveLogoClienteSettings(null, false); }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors text-right"
                >
                  Volver a auto-selección
                </button>
              )}
              {logoClienteUrl && (
                <button
                  onClick={() => { setLogoManualOverride(true); setLogoClienteUrl(null); saveLogoClienteSettings(null, true); }}
                  className="text-[10px] text-red-400 hover:text-red-600 transition-colors text-right"
                >
                  Quitar logo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contador por sección — sticky */}
        <div className="sticky top-0 z-30 -mx-8 md:-mx-12 px-8 md:px-12 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
            {total} {total === 1 ? 'imagen' : 'imágenes'}
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          {SECCIONES_CONTEO.map(({ label, key }) => {
            const count = state.images.filter(i => i.seccion === key).length;
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30"
                    : count > 0
                      ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-default"
                )}
              >
                {label}
                <span className={cn(
                  "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : count > 0
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
          {sinClasificar > 0 && (
            <button
              onClick={() => toggleFilter('__sin_clasificar')}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                activeFilter === '__sin_clasificar'
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30"
                  : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25 cursor-pointer"
              )}
            >
              Sin clasificar
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                activeFilter === '__sin_clasificar' ? "bg-white/20 text-white" : "bg-amber-500 text-white"
              )}>
                {sinClasificar}
              </span>
            </button>
          )}
          {isAdmin && total > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 ml-auto" />
              <button
                onClick={() => {
                  if (window.confirm(`¿Borrar las ${total} fotos? Esta acción no se puede deshacer.`)) {
                    idbClear();
                    setState(prev => ({ ...prev, images: [] }));
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={11} />
                Borrar fotos
              </button>
            </>
          )}
        </div>

        {/* Adjuntar Registro de Visita PDF */}
        {(isAdmin || isEditor) && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Registro de Visita</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  {registroVisitaProcessing
                    ? `Procesando página… ${registroVisitaProgress}%`
                    : registroVisitaName
                      ? `📄 ${registroVisitaName} — ${registroVisitaRef.current?.length ?? 0} pág.`
                      : 'Adjunta el PDF — se comprimirá e insertará al final del Informe Técnico'}
                </p>
              </div>
              <input
                ref={registroVisitaInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleRegistroVisitaUpload}
              />
              {registroVisitaName && !registroVisitaProcessing && (
                <button
                  onClick={() => { registroVisitaRef.current = null; setRegistroVisitaName(null); idbDeleteRegistroVisita(); }}
                  className="text-rose-500 hover:text-rose-600 transition-colors"
                  title="Quitar PDF"
                >
                  <XCircle size={18} />
                </button>
              )}
              <button
                onClick={() => registroVisitaInputRef.current?.click()}
                disabled={registroVisitaProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold rounded-xl transition-all shrink-0"
              >
                {registroVisitaProcessing
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  : <FileDown size={15} />}
                {registroVisitaProcessing ? `${registroVisitaProgress}%` : registroVisitaName ? 'Cambiar' : 'Adjuntar PDF'}
              </button>
            </div>
            {/* Barra de progreso Registro de Visita */}
            {registroVisitaProcessing && (
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className="h-full bg-indigo-500 rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${registroVisitaProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Barra de progreso carga de imágenes */}
        <AnimatePresence>
          {(imagesRestoring || imagesUploadProgress) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-indigo-300 dark:border-indigo-500/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {imagesRestoring && !imagesUploadProgress
                      ? 'Restaurando imágenes guardadas…'
                      : imagesUploadProgress
                        ? `Procesando imágenes… ${imagesUploadProgress.done} de ${imagesUploadProgress.total}`
                        : ''}
                  </p>
                </div>
                {imagesUploadProgress && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
                    {Math.round((imagesUploadProgress.done / imagesUploadProgress.total) * 100)}%
                  </span>
                )}
              </div>
              {imagesUploadProgress && (
                <div className="h-1 bg-indigo-100 dark:bg-indigo-500/20">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((imagesUploadProgress.done / imagesUploadProgress.total) * 100)}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              )}
              {imagesRestoring && !imagesUploadProgress && (
                <div className="h-1 bg-indigo-100 dark:bg-indigo-500/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-400 rounded-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          {...dropzoneRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
            isDragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
          )}
        >
          <input {...dropzoneInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus size={32} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Añadir Fotografías</p>
              <p className="text-slate-500 dark:text-slate-400">Arrastra archivos aquí o haz clic para seleccionar</p>
            </div>
          </div>
        </div>

        {activeFilter && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 -mt-4">
            <span>Mostrando {filteredImages.length} de {total} {total === 1 ? 'imagen' : 'imágenes'}</span>
            <button onClick={() => setActiveFilter(null)} className="text-indigo-500 hover:text-indigo-700 font-medium underline">
              Ver todas
            </button>
          </div>
        )}

        {/* Vista previa tabla Ubicación Espacial */}
        {(!activeFilter || activeFilter === 'Ubicación Espacial') && (
          <AerialPreview images={state.images} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img) => {
              // Leyendas ya usadas en la misma sección (excluyendo esta imagen)
              const usedLeyendas = state.images
                .filter(i => i.seccion === img.seccion && i.id !== img.id && i.leyenda !== '')
                .map(i => i.leyenda);

              const isPortada  = img.seccion === 'Portada';
              const isPaisaje  = img.seccion === 'Paisaje';
              const isUbicacion = img.seccion === 'Ubicación Espacial';
              const ubicacionCount = state.images.filter(i => i.seccion === 'Ubicación Espacial').length;
              const isTecnica = ['Extracción','Desnaturalización','Almacenamiento','General'].includes(img.seccion);

              return (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm group",
                    isPortada  ? "border-violet-300 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900"
                    : isPaisaje  ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900"
                    : isUbicacion ? "border-sky-300 dark:border-sky-600"
                    : img.enPortada ? "border-violet-200 dark:border-violet-700"
                    : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  {/* Etiqueta superior por tipo */}
                  {(isPortada || isPaisaje || isUbicacion) && (
                    <div className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2",
                      isPortada ? "bg-violet-600" : isPaisaje ? "bg-emerald-700" : "bg-sky-600"
                    )}>
                      {isPortada
                        ? '★ Foto portada principal'
                        : isPaisaje
                        ? '🌄 Paisaje — Fondo de portada'
                        : `Ubicación Espacial ${ubicacionCount > 4 ? '⚠ máx. 4 recomendadas' : `(${ubicacionCount}/4)`}`}
                    </div>
                  )}
                  {img.enPortada && isTecnica && (
                    <div className="px-4 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-semibold flex items-center gap-1.5">
                      <Star size={10} /> También aparece en portada
                    </div>
                  )}

                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 cursor-pointer"
                    onClick={() => setAnnotatingImageId(img.id)}
                  >
                    <img src={img.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute top-3 left-3 p-2 bg-blue-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                      <Pencil size={14} />
                    </div>
                    <div className={cn(
                      "absolute bottom-3 left-3 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white shadow-lg",
                      img.estado === 'Verde' ? "bg-emerald-500" : img.estado === 'Amarillo' ? "bg-amber-500" : "bg-rose-500"
                    )}>
                      {img.estado}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Badge IA */}
                    {(aiClassifying.has(img.id) || aiMeta[img.id]) && (
                      <div className="flex items-center gap-2">
                        {aiClassifying.has(img.id) && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-xs text-violet-600 dark:text-violet-400">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full" />
                            <span>Clasificando…</span>
                          </div>
                        )}
                        {!aiClassifying.has(img.id) && aiMeta[img.id] && (
                          <div
                            title={aiMeta[img.id].justificacion}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-xs font-semibold text-violet-700 dark:text-violet-300 cursor-help"
                          >
                            <Star size={10} className="shrink-0" />
                            IA · {Math.round(aiMeta[img.id].confianza * 100)}%
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Sección</label>
                        <select
                          aria-label="Sección de la foto" value={img.seccion}
                          onChange={(e) => updateImage(img.id, { seccion: e.target.value as ImageSeccion })}
                          className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-slate-900 dark:text-slate-100"
                        >
                          <optgroup label="── Portada ──">
                            <option value="Paisaje">🌄 Paisaje / Fondo portada</option>
                            <option value="Portada">★ Foto portada principal</option>
                          </optgroup>
                          <optgroup label="── Informe ──">
                            <option value="Ubicación Espacial">Ubicación Espacial (4 fotos)</option>
                          </optgroup>
                          <optgroup label="── Secciones técnicas ──">
                            <option value="Extracción">Extracción</option>
                            <option value="Desnaturalización">Desnaturalización</option>
                            <option value="Almacenamiento">Almacenamiento</option>
                            <option value="General">General</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Estado</label>
                        <select
                          aria-label="Estado del equipo" value={img.estado}
                          onChange={(e) => updateImage(img.id, { estado: e.target.value as any })}
                          className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-slate-900 dark:text-slate-100"
                        >
                          <option value="Verde">Bueno (Verde)</option>
                          <option value="Amarillo">Regular (Amarillo)</option>
                          <option value="Rojo">Malo (Rojo)</option>
                        </select>
                      </div>
                    </div>
                    {isUbicacion && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                          Posición en tabla
                        </label>
                        {(() => {
                          const slotOcupado = (slot: string) =>
                            state.images.some(i => i.seccion === 'Ubicación Espacial' && i.id !== img.id && i.slotUbicacion === slot);
                          return (
                            <select
                              aria-label="Ubicación en el informe" value={img.slotUbicacion ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateImage(img.id, { slotUbicacion: (v || undefined) as 'top' | 'left' | 'right' | 'bottom' | undefined });
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/20 dark:[color-scheme:dark]"
                            >
                              <option value="">— Auto (por leyenda) —</option>
                              <option value="top" disabled={slotOcupado('top')}>
                                Arriba (ancho completo){slotOcupado('top') ? ' (ocupado)' : ''}
                              </option>
                              <option value="left" disabled={slotOcupado('left')}>
                                Centro izquierda{slotOcupado('left') ? ' (ocupado)' : ''}
                              </option>
                              <option value="right" disabled={slotOcupado('right')}>
                                Centro derecha{slotOcupado('right') ? ' (ocupado)' : ''}
                              </option>
                              <option value="bottom" disabled={slotOcupado('bottom')}>
                                Abajo (ancho completo){slotOcupado('bottom') ? ' (ocupado)' : ''}
                              </option>
                            </select>
                          );
                        })()}
                      </div>
                    )}
                    {isUbicacion && (
                      <button
                        onClick={() => setCropModalId(img.id)}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          img.croppedUrl
                            ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-200"
                        )}
                      >
                        <SlidersHorizontal size={11} />
                        {img.croppedUrl ? 'Recortada · Editar' : 'Recortar para PDF'}
                      </button>
                    )}
                    {isTecnica && (
                      <button
                        onClick={() => updateImage(img.id, { enPortada: !img.enPortada })}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          img.enPortada
                            ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/40"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 hover:border-violet-200"
                        )}
                      >
                        <Star size={11} />
                        {img.enPortada ? 'En portada · Quitar' : 'Añadir a portada del informe'}
                      </button>
                    )}
                    <LeyendaCombo
                      seccion={img.seccion}
                      value={img.leyenda}
                      onChange={(v) => updateImage(img.id, { leyenda: v })}
                      m3={state.storage.parametros.capacidad_almacenaje_m3}
                      kva={state.denaturation.generacion_electrica[0]?.capacidad_kva ?? 0}
                      usedLeyendas={usedLeyendas}
                      savedOpciones={leyendasExtra[img.seccion] ?? []}
                      onNewLeyenda={saveNewLeyenda}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      {(isAdmin || isEditor) && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('report')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'report'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'report'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
      </div>
    );
  };

  const IssueView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader 
        title="Emitir Certificación" 
        icon={FileText} 
        description="Validación final de cumplimiento y generación de documentos PDF."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormCard title="Checklist de Validación">
          {(() => {
            const required = checklistItems.filter(i => i.required);
            const optional = checklistItems.filter(i => !i.required);
            const doneReq  = required.filter(i => i.ok).length;
            const pct      = Math.round((doneReq / required.length) * 100);
            const grupos   = ['Centro', 'Certificador', 'Capacidades'] as const;
            return (
              <div className="space-y-5">
                {/* Barra de progreso */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Requisitos obligatorios</span>
                    <span className={pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                      {doneReq} / {required.length}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-rose-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Items obligatorios por grupo */}
                {grupos.map(grupo => {
                  const items = required.filter(i => i.grupo === grupo);
                  return (
                    <div key={grupo} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 px-1">{grupo}</p>
                      {items.map(item => (
                        <div key={item.id} className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm',
                          item.ok
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                        )}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.ok
                              ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                              : <AlertCircle  size={15} className="text-rose-500 shrink-0" />}
                            <span className={cn('font-medium truncate', item.ok ? 'text-slate-700 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300')}>
                              {item.label}
                            </span>
                          </div>
                          <span className={cn('text-xs font-mono shrink-0 ml-2', item.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                            {item.ok ? item.detail : item.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Items recomendados */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 px-1">Recomendados</p>
                  {optional.map(item => (
                    <div key={item.id} className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm',
                      item.ok
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                    )}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.ok
                          ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          : <AlertCircle  size={15} className="text-amber-500 shrink-0" />}
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                      </div>
                      <span className={cn('text-xs font-mono shrink-0 ml-2', item.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {item.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </FormCard>

        <div className="flex flex-col justify-center items-center p-12 bg-indigo-600 rounded-2xl text-white text-center space-y-6 shadow-xl shadow-indigo-500/20">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <FileDown size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Generar Documentación</h3>
            <p className="text-indigo-100 text-sm max-w-xs">
              Genera cada documento por separado en formato PDF.
            </p>
          </div>

          {/* Botón Certificado */}
          <button
            disabled={!canEmit || generating !== null || (!isAdmin && !isEditor)}
            onClick={generateCertificadoPDF}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              canEmit && generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'certificado'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando...</>
              : <><FileDown size={20} /> Generar Certificado</>}
          </button>

          {/* Botón Informe */}
          <button
            disabled={!canEmit || generating !== null || (!isAdmin && !isEditor)}
            onClick={generateInformePDF}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              canEmit && generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'informe'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando...</>
              : <><FileText size={20} /> Generar Informe Técnico</>}
          </button>

          {/* Botón Acta */}
          <button
            disabled={generating !== null || (!isAdmin && !isEditor)}
            onClick={async () => {
              setGenerating('acta');
              const actaDocId = ensureDocId();
              try {
                // Genera el PDF real una sola vez: se descarga al usuario y se reutiliza para subirlo.
                const blob = await downloadActaPdf(state);
                setShowEmailModal(true);
                uploadDocToStorage(blob, actaDocId, 'acta')
                  .then(url => saveToHistorico('acta', url))
                  .catch(() => saveToHistorico('acta'));
              } catch (err) {
                console.error('Error generando el acta PDF:', err);
                alert('No se pudo generar el acta en PDF. Inténtalo nuevamente.');
                saveToHistorico('acta');
              } finally {
                setGenerating(null);
              }
              logEvento('generar_acta', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
            }}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'acta'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando PDF...</>
              : <><ShieldCheck size={20} /> Descargar Acta de Inspección</>}
          </button>

          {!canEmit && (
            <div className="text-xs text-indigo-200 space-y-0.5 text-left w-full">
              <p className="font-semibold mb-1">Pendiente para desbloquear:</p>
              {checklistItems.filter(i => i.required && !i.ok).map(i => (
                <p key={i.id} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-300 shrink-0 inline-block" />
                  {i.label}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Correo de notificación inline ── */}
      {showEmailModal && (() => {
        const subject = buildEmailSubject();
        const text = buildEmailText();
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                <Mail size={16} />
                Correo de notificación
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Asunto */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Asunto</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(subject).then(() => { setSubjectCopied(true); setTimeout(() => setSubjectCopied(false), 2000); })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Copy size={11} />
                    {subjectCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                  {subject}
                </div>
              </div>
              {/* Mensaje */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mensaje</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(text).then(() => { setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Copy size={11} />
                    {emailCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
                  {text}
                </pre>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );

  // StatsView llama hooks internamente y DEBE invocarse en cada render, no solo
  // cuando !showWelcome. Si su llamada quedara dentro del bloque {!showWelcome && …},
  // al pasar de la pantalla de bienvenida a la app tras el login aparecerían hooks
  // nuevos a mitad de render ("Rendered more hooks than during the previous render")
  // y, sin error boundary, la app colapsaría a pantalla blanca (obligando a recargar).
  // StatsView retorna null salvo en el tab 'stats' de un admin, así que llamarla
  // siempre es visualmente inocuo y mantiene el orden de hooks estable.
  const statsViewNode = StatsView();

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-500">
      <MarineBackground />
      <AnimatePresence>
        {showWelcome && <WelcomeScreen setUserRole={setUserRole} setShowWelcome={setShowWelcome} setAquaPhase={setLoginAquaPhase} logoProvider={tema.logo} skipSplash={wasLoggedOut} />}
      </AnimatePresence>

      {/* ══ OVERLAY DE TRANSICIÓN LOGIN ══ — vive en App para sobrevivir al desmontaje de WelcomeScreen */}
      <AnimatePresence onExitComplete={() => setLoginAquaPhase('idle')}>
        {loginAquaPhase !== 'idle' && (
          <motion.div
            key="aqua-transition"
            style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-max)', overflow: 'hidden', pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: loginAquaPhase === 'out' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: loginAquaPhase === 'out' ? 0.6 : 0.45, ease: 'easeInOut' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020d1a 0%, #051929 40%, #072840 70%, #0a3354 100%)' }} />
            {[...Array(8)].map((_, i) => (
              <motion.div key={`caustic-${i}`}
                style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(56,189,248,0.06)', filter: 'blur(30px)',
                  width: 120 + i * 40, height: 80 + i * 25,
                  left: `${(i * 17 + 5) % 90}%`, top: `${(i * 13 + 10) % 80}%` }}
                animate={{ scale: [1, 1.3, 0.9, 1.2, 1], opacity: [0.4, 0.8, 0.5, 0.9, 0.4], x: [0, 20, -15, 10, 0], y: [0, -12, 8, -5, 0] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
              />
            ))}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
              {[180, 360, 540, 720, 900, 1080, 1260].map((x, i) => (
                <motion.polygon key={i}
                  points={`${x - 30},0 ${x + 30},0 ${x + 80 + i * 10},900 ${x - 80 - i * 10},900`}
                  fill="rgba(125,211,252,0.9)"
                  animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [1, 1.1, 0.95, 1] }}
                  transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                />
              ))}
            </svg>
            {[
              { bottom: 0,  dur: 6,  fill: 'rgba(7,40,64,0.95)',  dx: [0, -720] as [number,number] },
              { bottom: 30, dur: 9,  fill: 'rgba(5,25,41,0.7)',   dx: [-360, -1080] as [number,number] },
              { bottom: 60, dur: 12, fill: 'rgba(10,51,84,0.5)',  dx: [0, -1440] as [number,number] },
            ].map((w, i) => (
              <motion.svg key={`wave-${i}`}
                style={{ position: 'absolute', bottom: w.bottom, left: 0, width: '200%', height: 80 }}
                viewBox="0 0 2880 80" preserveAspectRatio="none"
                animate={{ x: w.dx }} transition={{ duration: w.dur, repeat: Infinity, ease: 'linear' }}>
                <path d="M0,40 Q90,10 180,40 Q270,70 360,40 Q450,10 540,40 Q630,70 720,40 Q810,10 900,40 Q990,70 1080,40 Q1170,10 1260,40 Q1350,70 1440,40 Q1530,10 1620,40 Q1710,70 1800,40 Q1890,10 1980,40 Q2070,70 2160,40 Q2250,10 2340,40 Q2430,70 2520,40 Q2610,10 2700,40 Q2790,70 2880,40 L2880,80 L0,80Z" fill={w.fill} />
              </motion.svg>
            ))}
            {[...Array(14)].map((_, i) => {
              const dir = i % 2 === 0 ? 1 : -1;
              return (
                <motion.div key={`at-fish-${i}`}
                  style={{ position: 'absolute', top: `${15 + (i * 6) % 70}%`, color: '#7dd3fc', opacity: 0.7 }}
                  initial={{ x: dir > 0 ? '-5vw' : '105vw' }}
                  animate={{ x: dir > 0 ? '110vw' : '-10vw', y: [0, Math.sin(i) * 14, -Math.sin(i) * 9, 0] }}
                  transition={{ duration: 0.9 + (i % 4) * 0.15, ease: 'easeInOut', delay: i * 0.06 }}>
                  <Fish size={10 + (i % 5) * 4} style={{ transform: dir < 0 ? 'scaleX(-1)' : 'none' }} />
                </motion.div>
              );
            })}
            {[...Array(18)].map((_, i) => (
              <motion.div key={`at-bub-${i}`}
                style={{ position: 'absolute', bottom: '-5%', left: `${(i * 19 + 3) % 97}%`,
                  width: 3 + (i % 4) * 2, height: 3 + (i % 4) * 2, borderRadius: '50%',
                  background: 'rgba(125,211,252,0.5)', border: '1px solid rgba(125,211,252,0.3)' }}
                animate={{ y: [0, '-110vh'], opacity: [0, 0.9, 0.9, 0], x: [0, Math.sin(i) * 22, 0] }}
                transition={{ duration: 1.0 + (i % 5) * 0.12, ease: 'easeOut', delay: i * 0.05 }}
              />
            ))}
            <motion.div
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: loginAquaPhase === 'hold' ? 1 : 0, y: loginAquaPhase === 'hold' ? 0 : 20 }}
              transition={{ duration: 0.4 }}
            >
              <Fish size={36} style={{ color: '#7dd3fc', opacity: 0.9 }} />
              <p style={{ color: 'rgba(125,211,252,0.8)', fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                Cargando sistema
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWelcome && (<>
      {/* Backdrop del drawer en móvil */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Sidebar Navigation */}
      <aside className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm dark:shadow-none",
        // Móvil: drawer off-canvas
        "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        // Escritorio: sticky con colapso
        "md:sticky md:top-0 md:h-screen md:max-w-none md:translate-x-0 md:z-40 md:transition-[width] md:duration-500",
        isSidebarCollapsed ? "md:w-24" : "md:w-80"
      )}>
        <div className={cn("p-6 border-b border-slate-100 dark:border-slate-800 relative", isSidebarCollapsed ? "md:px-4 md:py-8" : "md:p-10")}>
          {/* Cerrar drawer (solo móvil) */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden absolute right-3 top-3 w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={22} />
          </button>
          <Logo collapsed={isSidebarCollapsed} tema={tema} />
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-md z-10"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide flex flex-col gap-6">

          {/* ── Grupo 1: Flujo de trabajo ── */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-3 pb-1">Inspección</p>
            )}
            <NavItem active={activeTab === 'general'}      onClick={() => setActiveTab('general')}      icon={LayoutDashboard} label="General"           collapsed={isSidebarCollapsed} />
            <NavItem active={activeTab === 'extraction'}   onClick={() => setActiveTab('extraction')}   icon={Waves}           label="Extracción"        collapsed={isSidebarCollapsed} />
            <NavItem active={activeTab === 'denaturation'} onClick={() => setActiveTab('denaturation')} icon={FlaskConical}    label="Desnaturalización" collapsed={isSidebarCollapsed} />
            <NavItem active={activeTab === 'storage'}      onClick={() => setActiveTab('storage')}      icon={Database}        label="Almacenamiento"    collapsed={isSidebarCollapsed} />
            <NavItem active={activeTab === 'report'}       onClick={() => setActiveTab('report')}       icon={Camera}          label="Informe"           collapsed={isSidebarCollapsed} />
          </div>

          {/* ── Grupo 2: Documentos ── */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-3 pb-1">Documentos</p>
            )}
            <NavItem active={activeTab === 'issue'}   onClick={() => setActiveTab('issue')}   icon={ShieldCheck} label="Certificado" collapsed={isSidebarCollapsed} variant="emerald" />
            <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History}     label="Históricos"  collapsed={isSidebarCollapsed} />
            {isAdmin && (
              <NavItem active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart2} label="Estadísticas" collapsed={isSidebarCollapsed} />
            )}
          </div>

          {/* ── Grupo 3: Gestión de datos ── */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-3 pb-1">Datos</p>
            )}
            <button
              onClick={exportDraft}
              title="Guardar borrador como archivo JSON"
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200", isSidebarCollapsed && "justify-center px-0")}
            >
              <Save size={18} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Guardar Borrador</span>}
            </button>
            <label
              title={isAdmin ? "Cargar borrador desde archivo JSON" : "Solo administradores"}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all", isAdmin ? "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40", isSidebarCollapsed && "justify-center px-0")}
            >
              <input ref={importDraftRef} type="file" accept=".json" className="hidden" disabled={!isAdmin} onChange={importDraft} />
              <input ref={resubirFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleResubirFileChange} />
              <ArrowRight size={18} className="rotate-180" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Cargar Borrador</span>}
            </label>
          </div>

          {/* ── Grupo 4: Sistema ── (al fondo, empuja hacia abajo) */}
          <div className="mt-auto space-y-1 border-t border-slate-100 dark:border-slate-800 pt-4">
            {isAdmin && <NavItem active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={Settings2} label="Configuración" collapsed={isSidebarCollapsed} />}
            <button
              onClick={async () => {
                try { const { signOut } = await import('firebase/auth'); const { auth } = await import('./firebase'); await signOut(auth); } catch {}
                localStorage.removeItem('certimar-session');
                setActiveTab('general'); setWasLoggedOut(true); setUserRole(null); setShowWelcome(true);
              }}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-slate-500 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400", isSidebarCollapsed && "justify-center px-0")}
            >
              <LogOut size={18} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </nav>

        <div className={cn("p-4 border-t border-slate-100 dark:border-slate-800 space-y-4", isSidebarCollapsed ? "text-center" : "px-6")}>
          {/* Acceso rápido modo oscuro */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              isSidebarCollapsed ? "justify-center px-0" : ""
            )}
          >
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
            {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {/* Badge correlativo interno */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 py-1">
              <Bookmark size={11} className={cn("shrink-0", state.registroId ? "text-indigo-400" : "text-slate-500 dark:text-slate-600")} />
              <span className={cn("text-[11px] font-bold tracking-wider", state.registroId ? "text-indigo-400 dark:text-indigo-300" : "text-slate-500 dark:text-slate-600")}>
                {state.registroId ?? 'Sin registro'}
              </span>
            </div>
          )}

          {/* Indicador de guardado en nube */}
          {!isSidebarCollapsed && (
            <motion.div
              animate={saveAnim ? { scale: [1, 1.01, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={cn(
                "rounded-xl px-3 py-2.5 border transition-all duration-500",
                saveAnim
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600/60"
                  : savedAt
                    ? "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <motion.div
                  animate={saveAnim ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Cloud size={12} className={cn(
                    "shrink-0 transition-colors duration-500",
                    saveAnim ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                  )} />
                </motion.div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider transition-colors duration-500",
                  saveAnim ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                )}>
                  {saveAnim ? "Guardado en nube ✓" : "Guardado en nube"}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={savedAt?.getTime() ?? 0}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  className="pl-[22px] flex flex-col gap-0.5"
                >
                  <span className={cn(
                    "text-xs font-mono font-medium transition-colors duration-500",
                    saveAnim ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"
                  )}>
                    {savedAt ? formatSavedAt(savedAt) : 'Sin guardar aún'}
                  </span>
                  {savedBy && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      por {savedBy}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          <p className={cn("text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest", isSidebarCollapsed ? "hidden" : "")}>
            © 2026 Certimar SpA
          </p>
          {!isSidebarCollapsed && (
            <p className="text-[9px] text-slate-300 dark:text-slate-600 tracking-wide">
              Developed by Micorriza 2026 · v{__APP_VERSION__}
            </p>
          )}
          {isSidebarCollapsed && (
            <motion.div
              animate={saveAnim ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Anchor size={16} className={cn(
                "mx-auto transition-colors duration-500",
                saveAnim ? "text-emerald-400" : "text-slate-200 dark:text-slate-700"
              )} />
            </motion.div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 md:p-12 overflow-y-auto relative z-10">
          {/* Barra superior móvil con botón de menú */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileSidebarOpen}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
            >
              <Menu size={22} />
            </button>
            <Logo collapsed tema={tema} />
          </div>
          {/* Toast de error de guardado */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 right-4 z-[var(--z-toast)] flex items-center gap-3 px-5 py-3 bg-rose-600 text-white rounded-2xl shadow-xl font-semibold text-sm"
              >
                <XCircle size={18} />
                {saveError}
              </motion.div>
            )}
          </AnimatePresence>
          {userRole === 'reader' && (
            <div className="sticky top-0 z-40 bg-amber-500 text-amber-950 text-xs font-bold px-6 py-2 flex items-center gap-2">
              <ShieldCheck size={14} />
              MODO LECTURA — No puedes editar ni generar documentos en esta sesión.
            </div>
          )}
          {bloqueoActivo && (
            <div className="sticky top-0 z-40 bg-orange-500 text-white text-xs font-bold px-6 py-2 flex items-center gap-2">
              <ShieldCheck size={14} />
              ⚠️ ATENCIÓN: <span className="font-normal ml-1">{bloqueoActivo.nombre} ({bloqueoActivo.email}) también tiene este registro abierto desde las {bloqueoActivo.desde.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}. Coordinad antes de guardar para evitar sobreescribir cambios.</span>
            </div>
          )}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && GeneralView()}
            {activeTab === 'extraction' && ExtractionView()}
            {activeTab === 'denaturation' && DenaturationView()}
            {activeTab === 'storage' && StorageView()}
            {activeTab === 'report' && ReportView()}
            {activeTab === 'issue' && IssueView()}
            {activeTab === 'history' && HistoryView()}
            {activeTab === 'config' && ConfigView()}
            {statsViewNode}
          </AnimatePresence>
        </div>
      </main>

      {/* ─ Checklist flotante por sección ─ */}
      {isAdmin && (['general','extraction','denaturation','storage','report'] as const).includes(activeTab as any) && (() => {
        const sectionItems = checklistItems.filter(i => i.tab === activeTab);
        const done  = sectionItems.filter(i => i.ok).length;
        const total = sectionItems.length;
        const allOk = done === total;
        const sectionLabel: Record<string, string> = {
          general: 'General', extraction: 'Extracción', denaturation: 'Desnaturalización',
          storage: 'Almacenamiento', report: 'Informe',
        };

        const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
          // No iniciar arrastre desde el botón de minimizar
          if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
          const panel = e.currentTarget.parentElement as HTMLElement | null;
          if (!panel) return;
          const rect = panel.getBoundingClientRect();
          checklistDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
          setChecklistPos({ x: rect.left, y: rect.top });
          e.currentTarget.setPointerCapture(e.pointerId);
        };
        const onHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
          const drag = checklistDragRef.current;
          if (!drag) return;
          const w = 288; // w-72
          const x = Math.min(Math.max(8, e.clientX - drag.dx), window.innerWidth - w - 8);
          const y = Math.min(Math.max(8, e.clientY - drag.dy), window.innerHeight - 48);
          setChecklistPos({ x, y });
        };
        const onHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
          checklistDragRef.current = null;
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
        };

        const dragged = checklistPos !== null;
        const posStyle: React.CSSProperties | undefined = dragged
          ? { left: checklistPos!.x, top: checklistPos!.y, right: 'auto', bottom: 'auto' }
          : undefined;

        return (
          <div
            style={posStyle}
            className={`fixed ${dragged ? '' : 'bottom-6 right-5'} z-50 w-72 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm overflow-hidden select-none`}
          >
            <div
              onPointerDown={onHeaderPointerDown}
              onPointerMove={onHeaderPointerMove}
              onPointerUp={onHeaderPointerUp}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 font-semibold text-white text-xs cursor-move touch-none ${allOk ? 'bg-emerald-600' : 'bg-[#0f2d5e]'}`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Move size={13} className="opacity-60 flex-shrink-0" />
                <span className="truncate">Checklist · {sectionLabel[activeTab]}</span>
              </span>
              <span className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${allOk ? 'bg-emerald-400 text-emerald-900' : 'bg-white/20'}`}>{done}/{total}</span>
                <button
                  data-no-drag
                  type="button"
                  onClick={() => setChecklistMin(m => !m)}
                  title={checklistMin ? 'Expandir checklist' : 'Minimizar checklist'}
                  aria-label={checklistMin ? 'Expandir checklist' : 'Minimizar checklist'}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {checklistMin ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </span>
            </div>
            {!checklistMin && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
                {sectionItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                    <span className={`flex-shrink-0 font-bold text-base leading-none ${item.ok ? 'text-emerald-500' : item.required ? 'text-red-500' : 'text-amber-400'}`}>
                      {item.ok ? '✓' : item.required ? '✗' : '○'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${item.ok ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.label}</p>
                      {!item.ok && <p className="text-[10px] text-slate-500 truncate">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

      {/* ── Popup "Confirmar Revisión" ── */}
      <AnimatePresence>
        {activeTab === 'general' && allGenCritOk && !state.general.revisionConfirmada && (
          <motion.div
            key="revision-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-drawer)] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-5 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Datos generales completos</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Todos los campos requeridos están listos. Confirma que revisaste la información antes de emitir.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide mb-1">Esta información aparecerá en:</p>
                <p>· Acta de Inspección (código, titular, fechas, certificador)</p>
                <p>· Certificado de Verificación (identificación, firmante)</p>
                <p>· Informe Técnico (tabla completa incl. A/N ensilaje y coordenadas)</p>
              </div>

              <button
                onClick={() => updateGeneral('revisionConfirmada', true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/25"
              >
                <CheckCircle2 size={16} />
                He revisado y confirmo los datos
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anotador de imagen */}
      {annotatingImg && (
        <ImageAnnotator
          img={annotatingImg}
          onSave={async (annotatedUrl) => {
            await idbSave(annotatingImg.id, annotatedUrl);
            updateImage(annotatingImg.id, { url: annotatedUrl });
            setAnnotatingImageId(null);
          }}
          onClose={() => setAnnotatingImageId(null)}
        />
      )}
      {/* ── Recortador manual para Ubicación Espacial ── */}
      {cropModalImg && (
        <CropModal
          img={cropModalImg}
          targetAr={
            cropModalImg.slotUbicacion === 'left' || cropModalImg.slotUbicacion === 'right'
              ? 91 / 50   // HALF_W / HALF_H
              : 182 / 65  // FULL_W / FULL_H (top, bottom, o sin slot)
          }
          onSave={(croppedUrl) => {
            updateImage(cropModalImg.id, { croppedUrl });
            idbSave(`crop_${cropModalImg.id}`, croppedUrl).catch(() => {});
            setCropModalId(null);
          }}
          onClose={() => setCropModalId(null)}
        />
      )}
      {/* ── Modal "Novedades" paso a paso ── */}
      {showChangelog && !showWelcome && (() => {
        const closeChangelog = () => { setShowChangelog(false); localStorage.setItem('certimar-changelog-seen', CHANGELOG_VERSION); };
        const neverShowChangelog = () => { localStorage.setItem('certimar-changelog-never', 'true'); closeChangelog(); };
        const steps: { Icon: React.ElementType; color: string; titulo: string; descripcion: string; detalle: string[] }[] = [
          {
            Icon: Database,
            color: '#b91c1c',
            titulo: 'Corrección importante: ya no se pierden registros',
            descripcion: 'Crear un registro nuevo ya no puede sobrescribir ni borrar uno existente. Cada registro tiene ahora un identificador único.',
            detalle: [
              'Antes: el correlativo REG-XXX podía repetirse entre equipos o sesiones, y un registro nuevo pisaba a uno antiguo (parecía un tope de ~15 registros).',
              'Ahora: cada registro recibe un ID único e independiente del correlativo; los registros existentes se siguen editando con normalidad.',
              'El código REG-XXX se mantiene solo como etiqueta visible.',
            ],
          },
          {
            Icon: Settings2,
            color: '#c2410c',
            titulo: 'Incinerador a medida y reutilizable',
            descripcion: 'Ahora puedes ingresar un incinerador llenando todos sus campos y guardarlo en el catálogo para reutilizarlo en otras certificaciones.',
            detalle: [
              'Nuevo: opción "➕ Nuevo incinerador (manual)" en el selector de Incinerador Secundario.',
              'Los campos de detalle (cámaras, temperaturas, quemadores, etc.) son editables.',
              '"Guardar en catálogo" persiste el incinerador; reutilízalo, edítalo o elimínalo desde el panel de equipos.',
            ],
          },
          {
            Icon: FileDown,
            color: '#1f6f43',
            titulo: 'El acta ahora se descarga directamente en PDF',
            descripcion: 'Al generar el acta, el archivo PDF se descarga al instante, sin pasar por el diálogo «Imprimir» del navegador.',
            detalle: [
              'Antes: se abría el diálogo de impresión y había que elegir "Guardar como PDF" y desactivar encabezados/pies.',
              'Ahora: el PDF (tamaño Oficio, una sola página) se genera y descarga automáticamente con el nombre del centro y la fecha.',
              'Incluye el acta completa de la A a la H (certificación y firma); aplica al botón "Generar Acta" y a la re-descarga desde el Histórico.',
            ],
          },
          {
            Icon: AlertTriangle,
            color: '#2d5a8e',
            titulo: 'Corrección: popup de confirmación dejó de interferir',
            descripcion: 'El aviso "Datos generales completos" ya no reaparece cada vez que escribes.',
            detalle: [
              'Antes: tras confirmar, cualquier tecla en Datos Generales reabría el popup.',
              'Ahora: la confirmación se solicita una sola vez al completar los datos.',
              'Editar campos después de confirmar ya no interrumpe la escritura.',
            ],
          },
          {
            Icon: AlertTriangle,
            color: '#2d5a8e',
            titulo: 'Corrección: observaciones de Almacenamiento en el acta',
            descripcion: 'El texto del campo "Observaciones" de Almacenamiento ahora se refleja en la Sección G del acta.',
            detalle: [
              'Antes: el acta mostraba siempre el texto fijo del template, ignorando lo escrito en el formulario.',
              'Ahora: se usa el texto ingresado en Observaciones de Almacenamiento.',
              'Si el campo queda vacío, el acta muestra "N/A".',
            ],
          },
          {
            Icon: ClipboardList,
            color: '#1f497d',
            titulo: 'Glosa del acta según sistema de extracción',
            descripcion: 'El texto de observaciones en la Sección E del acta ahora se genera automáticamente según los sistemas marcados en el formulario.',
            detalle: [
              'Solo Automática → glosa estándar con N° jaulas y equipo.',
              'Automática + ROV → glosa estándar más mención del apoyo con ROV.',
              'Op.Mínima activa → glosa específica con el nombre del centro.',
            ],
          },
          {
            Icon: Settings2,
            color: '#1f3864',
            titulo: 'Formulario simplificado en Operación Mínima',
            descripcion: 'Al activar el modo Operación Mínima, el formulario de Extracción oculta los campos que no aplican a este modo regulatorio.',
            detalle: [
              'Se ocultan: CFM, Jaulas Simultáneas y Motocompresores/Jaula.',
              'La capacidad diaria se fija en 15 TON/DÍA (valor regulatorio).',
              'El panel de resultados muestra el valor fijo en lugar del calculado.',
            ],
          },
          {
            Icon: Download,
            color: '#1a3a5c',
            titulo: 'Descarga directa desde el Histórico',
            descripcion: 'Los badges de documentos en las tarjetas del histórico ahora son botones de descarga.',
            detalle: [
              'Verde → tiene versión guardada → click abre el PDF.',
              'Gris → sin versión guardada → genera el Acta directamente, o indica cargar el formulario para Certificado e Informe.',
              'Siempre aparece un modal de confirmación de revisión del Inspector antes de descargar.',
            ],
          },
          {
            Icon: AlertTriangle,
            color: '#2d5a8e',
            titulo: 'Corrección: glosa estándar del acta',
            descripcion: 'Se corrigió un error donde la glosa de Observaciones de la sección E desaparecía en centros sin texto personalizado.',
            detalle: [
              'Antes: si "Observación Sistema" estaba vacío, el acta mostraba "N/A".',
              'Ahora: si está vacío, se usa la glosa estándar del template con N° jaulas y equipo.',
              'Si tiene texto personalizado, ese texto sigue teniendo prioridad.',
            ],
          },
          {
            Icon: Camera,
            color: '#1f497d',
            titulo: 'Corrección: imágenes visibles entre usuarios',
            descripcion: 'Las imágenes subidas por un usuario ahora son visibles para otros usuarios que carguen el mismo registro desde el historial.',
            detalle: [
              'Antes: las imágenes solo aparecían en el dispositivo de quien las subió.',
              'Ahora: la URL de almacenamiento se guarda junto al registro y es accesible para todos los usuarios de Certimar.',
              'Registros anteriores requieren ser guardados nuevamente para activar la mejora.',
            ],
          },
          {
            Icon: CheckCircle2,
            color: '#1f3864',
            titulo: 'Corrección: glosa se actualiza al marcar ROV / Automática',
            descripcion: 'Se corrigió un error donde marcar o desmarcar los checkboxes ROV y Automática no actualizaba el campo "Observación Sistema".',
            detalle: [
              'Antes: la glosa no cambiaba al activar/desactivar ROV o Automática.',
              'Ahora: el campo se regenera automáticamente al cambiar cualquier sistema de apoyo.',
              'Solo Automática → glosa estándar. Automática + ROV → glosa con mención ROV.',
            ],
          },
          {
            Icon: FileText,
            color: '#0f766e',
            titulo: 'Glosa de extracción según sistemas de apoyo',
            descripcion: 'El campo "Observación Sistema" ahora se genera automáticamente según los sistemas de apoyo marcados, incluyendo Buceo.',
            detalle: [
              'Solo ROV → glosa de extracción por robótica submarina.',
              'Buceo + ROV → glosa combinada buceo y ROV.',
              'ROV + Automática → glosa sistema automático con apoyo ROV.',
              'Buceo + ROV + Automática → glosa completa con ambos apoyos.',
              'El campo sigue siendo editable si necesitas personalizar el texto.',
            ],
          },
          {
            Icon: Database,
            color: '#1e40af',
            titulo: 'Catálogo de equipos actualizado y personalizable',
            descripcion: 'Se agregaron los equipos TERMINATOR VRG 530/515 (Ydra) y Prepicador Doble 7,5 kW. Los administradores pueden agregar equipos personalizados.',
            detalle: [
              'TERMINATOR VRG 530 (22 kW, 3.500 kg/h) y VRG 515 (15 kW, 2.500 kg/h) disponibles en Desnaturalización.',
              'Prepicador Doble 7,5 kW (5.000 kg/h, AISI 304) agregado al catálogo estático.',
              'Panel de administración (Config → Catálogo de Equipos) permite agregar y eliminar equipos personalizados.',
              'Los equipos personalizados son visibles para todos los usuarios autenticados.',
            ],
          },
          {
            Icon: ShieldCheck,
            color: '#b45309',
            titulo: 'Bloqueo de edición simultánea',
            descripcion: 'Si dos usuarios abren el mismo registro al mismo tiempo, ahora aparece un aviso para evitar sobreescribir cambios sin querer.',
            detalle: [
              'Al abrir un registro desde el historial, el sistema verifica si otro usuario lo tiene abierto.',
              'Si hay conflicto, aparece un banner naranja con el nombre y la hora en que el otro usuario lo abrió.',
              'Puedes continuar igual — el aviso es informativo para que coordinéis antes de guardar.',
              'El bloqueo expira automáticamente a las 2 horas o cuando el usuario cierra el registro.',
            ],
          },
          {
            Icon: Crop,
            color: '#0369a1',
            titulo: 'Recorte manual + vista previa de tabla aérea',
            descripcion: 'Las imágenes de Ubicación Espacial ahora se pueden recortar manualmente para cada slot del informe, y el resultado se previsualiza antes de generar el PDF.',
            detalle: [
              'Cada card de Ubicación Espacial tiene un botón "Recortar para PDF" que abre el editor de recorte.',
              'El recuadro se arrastra y redimensiona libremente, con relación de aspecto fija al slot asignado.',
              'Vista previa en 4 celdas (arriba / centro-izq / centro-der / abajo) se muestra encima de las cards.',
              'Sin recorte manual, el PDF aplica un recorte central automático sin deformar la imagen.',
            ],
          },
          {
            Icon: FlaskConical,
            color: '#1f497d',
            titulo: 'Múltiples ollas y N° de sistemas de ensilaje',
            descripcion: 'La capacidad diaria de desnaturalización ahora escala con la cantidad de ollas trituradoras, y el acta detalla por separado el número de sistemas de ensilaje.',
            detalle: [
              'Nuevo campo "Cantidad Ollas Trituradoras" en Desnaturalización: multiplica la capacidad diaria (ollas en paralelo).',
              'Nuevo campo "Cantidad Sistemas de Ensilaje" que alimenta la celda correspondiente del acta.',
              'El acta y el informe muestran ambos valores; la observación automática refleja el factor por ollas.',
              'Por defecto ambos valores son 1, por lo que los cálculos previos no cambian.',
            ],
          },
          {
            Icon: Bookmark,
            color: '#d97706',
            titulo: 'Borradores: guarda y retoma registros sin perder trabajo',
            descripcion: 'Ahora puedes guardar un registro como borrador para avanzar con otro, y retomarlo después desde el Histórico.',
            detalle: [
              'Nuevo botón "Guardar borrador" en Datos Generales.',
              'Al "Comenzar Registro" o "Continuar" otro, el registro actual se guarda automáticamente como borrador (ya no se pierden los cambios).',
              'El Histórico tiene un filtro Todos / Borradores / Finalizados, y las tarjetas de borrador muestran su avance y qué secciones faltan.',
              'El botón de la tarjeta dice "Continuar" en borradores y "Cargar" en registros finalizados.',
            ],
          },
          {
            Icon: LayoutGrid,
            color: '#0f766e',
            titulo: 'Mejoras de uso en móvil, accesibilidad y legibilidad',
            descripcion: 'La herramienta se adapta mejor a tablet y celular para el trabajo en terreno, con textos más legibles y mejor soporte para teclado y lectores de pantalla.',
            detalle: [
              'En celular y tablet el menú lateral se abre como panel deslizable, dejando todo el ancho de la pantalla para los formularios.',
              'Los campos en dos columnas se apilan en una sola columna en pantallas angostas.',
              'Mayor contraste en etiquetas y títulos de sección para leerlos con más facilidad.',
              'Todos los campos y listas desplegables tienen etiqueta accesible y un indicador de foco más visible al navegar con teclado.',
              'Se respeta la preferencia de "movimiento reducido" del dispositivo y la animación de fondo se pausa cuando la pestaña no está visible.',
            ],
          },
          {
            Icon: AlertTriangle,
            color: '#2d5a8e',
            titulo: 'Corrección: pantalla en blanco tras iniciar sesión',
            descripcion: 'Al entrar con Google ya no aparece una pantalla en blanco que obligaba a recargar la página.',
            detalle: [
              'Antes: después del login la aplicación quedaba en blanco y había que recargar manualmente para usarla.',
              'Ahora: la app carga directamente tras iniciar sesión, sin recargar.',
              'Además, si en el futuro ocurriera cualquier error de carga, verás un aviso con un botón para reintentar en lugar de una página vacía.',
            ],
          },
          {
            Icon: Palette,
            color: '#0e7490',
            titulo: 'Texto secundario más legible en modo claro',
            descripcion: 'Subimos el contraste de etiquetas, unidades y textos de apoyo en todas las secciones para leerlos con claridad sobre fondo claro.',
            detalle: [
              'Las etiquetas de sección, unidades (TN/Día, %) y textos de ayuda pasan a un gris más oscuro que cumple el estándar de contraste AA.',
              'El modo oscuro se mantiene igual.',
            ],
          },
        ];
        const step = steps[changelogStep];
        const isLast = changelogStep === steps.length - 1;
        const StepIcon = step.Icon;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[var(--z-modal)] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">

              {/* Header — Certimar navy gradient */}
              <div className="relative overflow-hidden px-8 pt-7 pb-8" style={{ background: `linear-gradient(135deg, #1a3a5c 0%, ${step.color} 55%, #4a76a8 100%)` }}>
                {/* Ola decorativa */}
                <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 480 48" preserveAspectRatio="none">
                  <path d="M0,32 C80,0 160,48 240,24 C320,0 400,48 480,24 L480,48 L0,48 Z" fill="white"/>
                </svg>
                {/* Top row */}
                <div className="flex items-center justify-between mb-6 relative">
                  <div className="flex items-center gap-2.5">
                    <Anchor size={14} className="text-white/60" />
                    <span className="text-xs font-bold text-white/80 uppercase tracking-[0.15em]">Novedades Certimar</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60 font-mono bg-white/5">{CHANGELOG_VERSION}</span>
                  </div>
                  <button onClick={closeChangelog} className="text-white/40 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>
                {/* Icon + title */}
                <div className="flex items-center gap-5 relative">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <StepIcon size={26} className="text-white" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                      {changelogStep + 1} de {steps.length}
                    </p>
                    <h3 className="text-[17px] font-bold text-white leading-snug">{step.titulo}</h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-5">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.descripcion}</p>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {step.detalle.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: step.color }} />
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 pt-1 space-y-4">
                <div className="flex items-center justify-between gap-4">
                {/* Step pills */}
                <div className="flex gap-1.5 items-center">
                  {steps.map((_, i) => (
                    <button key={i} onClick={() => setChangelogStep(i)}
                      className="transition-all duration-300 rounded-full h-2"
                      style={{
                        width: i === changelogStep ? '22px' : '8px',
                        backgroundColor: i === changelogStep ? step.color : '#cbd5e1',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2.5">
                  {changelogStep > 0 && (
                    <button onClick={() => setChangelogStep(s => s - 1)}
                      className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5">
                      <ChevronLeft size={14} /> Anterior
                    </button>
                  )}
                  {isLast ? (
                    <button onClick={closeChangelog}
                      className="px-6 py-2.5 text-sm font-bold rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${step.color}, #4a76a8)` }}>
                      <CheckCircle2 size={15} /> Entendido
                    </button>
                  ) : (
                    <button onClick={() => setChangelogStep(s => s + 1)}
                      className="px-6 py-2.5 text-sm font-bold rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${step.color}, #4a76a8)` }}>
                      Siguiente <ChevronRight size={15} />
                    </button>
                  )}
                </div>
                </div>
                <div className="text-center">
                  <button onClick={neverShowChangelog} className="text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-2">
                    No volver a mostrar novedades
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      </>)}
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label, collapsed, variant = "indigo" }: { active: boolean, onClick: () => void, icon: any, label: string, collapsed: boolean, variant?: "indigo" | "emerald" }) => {
  const colors = {
    indigo: {
      active: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20",
      inactive: "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
      iconActive: "text-indigo-600 dark:text-indigo-400",
      iconInactive: "text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
    },
    emerald: {
      active: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-500/20",
      inactive: "text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400",
      iconActive: "text-emerald-600 dark:text-emerald-400",
      iconInactive: "text-slate-500 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
    }
  };

  const current = colors[variant];

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
        active ? current.active : current.inactive,
        collapsed ? "justify-center px-0" : ""
      )}
    >
      <Icon size={20} className={cn("shrink-0 transition-colors", active ? current.iconActive : current.iconInactive)} />
      {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
      {!collapsed && active && <motion.div layoutId="active-pill" className={cn("ml-auto w-1.5 h-1.5 rounded-full", variant === "indigo" ? "bg-indigo-600" : "bg-emerald-600")} />}
      
      {collapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[var(--z-tooltip)]">
          {label}
        </div>
      )}
    </button>
  );
};
