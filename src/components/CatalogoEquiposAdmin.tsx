import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';
import { CatalogoCustomEntry, TipoEquipoCatalogo, IncineradorDetalle } from '../types';

const TIPO_LABELS: Record<TipoEquipoCatalogo, string> = {
  trituradora:      'Trituradora / Ensilaje',
  grinder_pump:     'Grinder Pump (continuo)',
  incinerador:      'Incinerador',
  prepicador:       'Prepicador',
  ensilador:        'Ensilador',
  bomba_centrifuga: 'Bomba Centrífuga',
  dosificador:      'Dosificador Químico',
  linea_extraccion: 'Línea de Extracción',
  compresor:        'Compresor',
};

const TIPO_COLOR: Record<TipoEquipoCatalogo, string> = {
  trituradora:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  grinder_pump:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  incinerador:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  prepicador:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ensilador:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  bomba_centrifuga: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  dosificador:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  linea_extraccion: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  compresor:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

interface FormState {
  tipo: TipoEquipoCatalogo;
  marca_modelo: string;
  fabricante: string;
  capacidad_nominal_kg_h: string;
  almacenamiento_l: string;
  capacidad_carga_kg_h: string;
  rendimiento_kg_h: string;
  potencia_kw: string;
  cfm: string;
  material: string;
  notas: string;
  // Detalle incinerador
  horas_funcionamiento: string;
  camara_primaria: string;
  num_quemadores_primaria: string;
  temperatura_camara_primaria_c: string;
  camara_secundaria: string;
  num_quemadores_secundaria: string;
  temperatura_camara_secundaria_c: string;
  requerimiento_energetico: string;
  sistema_carga: string;
  sistema_descarga: string;
  disposicion_final: string;
  almacenamiento_gas: string;
}

const EMPTY_FORM: FormState = {
  tipo: 'trituradora',
  marca_modelo: '',
  fabricante: '',
  capacidad_nominal_kg_h: '',
  almacenamiento_l: '',
  capacidad_carga_kg_h: '',
  rendimiento_kg_h: '',
  potencia_kw: '',
  cfm: '',
  material: '',
  notas: '',
  horas_funcionamiento: '',
  camara_primaria: '',
  num_quemadores_primaria: '',
  temperatura_camara_primaria_c: '',
  camara_secundaria: '',
  num_quemadores_secundaria: '',
  temperatura_camara_secundaria_c: '',
  requerimiento_energetico: '',
  sistema_carga: '',
  sistema_descarga: '',
  disposicion_final: '',
  almacenamiento_gas: '',
};

interface Props {
  catalogoCustom: CatalogoCustomEntry[];
  onAdd: (entry: CatalogoCustomEntry) => void;
  onUpdate: (entry: CatalogoCustomEntry) => void;
  onDelete: (id: string) => void;
}

export function CatalogoEquiposAdmin({ catalogoCustom, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const showCapacity   = form.tipo === 'trituradora' || form.tipo === 'grinder_pump';
  const showStorage    = form.tipo === 'trituradora' || form.tipo === 'grinder_pump' || form.tipo === 'ensilador';
  const showKgH        = form.tipo === 'incinerador';
  const showRendimiento = form.tipo === 'prepicador' || form.tipo === 'linea_extraccion';
  const showPotencia   = ['prepicador','ensilador','bomba_centrifuga','dosificador','linea_extraccion','compresor','grinder_pump'].includes(form.tipo);
  const showCfm        = form.tipo === 'compresor';

  const handleSubmit = async () => {
    if (!form.marca_modelo.trim()) {
      setError('El nombre / marca-modelo es obligatorio.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('../firebase');
      const user = (auth as any).currentUser;

      const payload: Omit<CatalogoCustomEntry, 'id'> = {
        tipo: form.tipo,
        marca_modelo: form.marca_modelo.trim(),
        ...(form.fabricante.trim()               && { fabricante: form.fabricante.trim() }),
        ...(form.material.trim()                 && { material: form.material.trim() }),
        ...(form.notas.trim()                    && { notas: form.notas.trim() }),
        ...(showCapacity   && form.capacidad_nominal_kg_h && { capacidad_nominal_kg_h: Number(form.capacidad_nominal_kg_h) }),
        ...(showStorage    && form.almacenamiento_l       && { almacenamiento_l:       Number(form.almacenamiento_l) }),
        ...(showKgH        && form.capacidad_carga_kg_h   && { capacidad_carga_kg_h:   Number(form.capacidad_carga_kg_h) }),
        ...(showRendimiento && form.rendimiento_kg_h      && { rendimiento_kg_h:        Number(form.rendimiento_kg_h) }),
        ...(showPotencia   && form.potencia_kw            && { potencia_kw:             Number(form.potencia_kw) }),
        ...(showCfm        && form.cfm                    && { cfm:                     Number(form.cfm) }),
        creadoPor: user?.email ?? 'admin',
        __createdAt: serverTimestamp(),
      };

      if (form.tipo === 'incinerador') {
        const detalle: IncineradorDetalle = {
          horas_funcionamiento: Number(form.horas_funcionamiento) || 8,
          camara_primaria: form.camara_primaria.trim(),
          num_quemadores_primaria: Number(form.num_quemadores_primaria) || 0,
          temperatura_camara_primaria_c: Number(form.temperatura_camara_primaria_c) || 0,
          camara_secundaria: form.camara_secundaria.trim(),
          num_quemadores_secundaria: Number(form.num_quemadores_secundaria) || 0,
          temperatura_camara_secundaria_c: Number(form.temperatura_camara_secundaria_c) || 0,
          requerimiento_energetico: form.requerimiento_energetico.trim(),
          sistema_carga: form.sistema_carga.trim() || 'N/A',
          sistema_descarga: form.sistema_descarga.trim() || 'N/A',
          disposicion_final: form.disposicion_final.trim() || 'N/A',
          almacenamiento_gas: form.almacenamiento_gas.trim() || 'N/A',
          observaciones: form.notas.trim(),
        };
        (payload as Omit<CatalogoCustomEntry, 'id'>).incinerador_detalle = detalle;
      }

      if (editingId) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'catalogo_custom', editingId), payload as any);
        onUpdate({ ...payload, id: editingId, __createdAt: new Date() });
      } else {
        const ref = await addDoc(collection(db, 'catalogo_custom'), payload);
        onAdd({ ...payload, id: ref.id, __createdAt: new Date() });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError('Error al guardar. Verifica la conexión y vuelve a intentarlo.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: CatalogoCustomEntry) => {
    if (!entry.id) return;
    if (!confirm(`¿Eliminar "${entry.marca_modelo}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(entry.id);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'catalogo_custom', entry.id));
      onDelete(entry.id);
    } catch (err) {
      alert('Error al eliminar el equipo. Intenta nuevamente.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (entry: CatalogoCustomEntry) => {
    const d = entry.incinerador_detalle;
    setForm({
      ...EMPTY_FORM,
      tipo: entry.tipo,
      marca_modelo: entry.marca_modelo,
      fabricante: entry.fabricante ?? '',
      material: entry.material ?? '',
      notas: entry.tipo === 'incinerador' ? (d?.observaciones ?? '') : (entry.notas ?? ''),
      capacidad_nominal_kg_h: entry.capacidad_nominal_kg_h?.toString() ?? '',
      almacenamiento_l: entry.almacenamiento_l?.toString() ?? '',
      capacidad_carga_kg_h: entry.capacidad_carga_kg_h?.toString() ?? '',
      rendimiento_kg_h: entry.rendimiento_kg_h?.toString() ?? '',
      potencia_kw: entry.potencia_kw?.toString() ?? '',
      cfm: entry.cfm?.toString() ?? '',
      horas_funcionamiento: d?.horas_funcionamiento?.toString() ?? '',
      camara_primaria: d?.camara_primaria ?? '',
      num_quemadores_primaria: d?.num_quemadores_primaria?.toString() ?? '',
      temperatura_camara_primaria_c: d?.temperatura_camara_primaria_c?.toString() ?? '',
      camara_secundaria: d?.camara_secundaria ?? '',
      num_quemadores_secundaria: d?.num_quemadores_secundaria?.toString() ?? '',
      temperatura_camara_secundaria_c: d?.temperatura_camara_secundaria_c?.toString() ?? '',
      requerimiento_energetico: d?.requerimiento_energetico ?? '',
      sistema_carga: d?.sistema_carga ?? '',
      sistema_descarga: d?.sistema_descarga ?? '',
      disposicion_final: d?.disposicion_final ?? '',
      almacenamiento_gas: d?.almacenamiento_gas ?? '',
    });
    setEditingId(entry.id ?? null);
    setShowForm(true);
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all';
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Equipos Personalizados ({catalogoCustom.length})
        </h4>
        <button
          onClick={() => { setShowForm(v => !v); if (showForm) { setEditingId(null); setForm(EMPTY_FORM); } }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {showForm ? <ChevronUp size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancelar' : 'Nuevo equipo'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Agregar equipo al catálogo</p>

          <div>
            <label htmlFor="field-tipo" className={labelCls}>Tipo de equipo *</label>
            <select id="field-tipo" value={form.tipo} onChange={e => set('tipo', e.target.value as TipoEquipoCatalogo)} className={inputCls}>
              {(Object.entries(TIPO_LABELS) as [TipoEquipoCatalogo, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="field-marca-modelo" className={labelCls}>Nombre / Marca-Modelo *</label>
            <input
              id="field-marca-modelo"
              type="text"
              placeholder="Ej. TERMINATOR VRG 530 (Ydra)"
              value={form.marca_modelo}
              onChange={e => set('marca_modelo', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="field-fabricante" className={labelCls}>Fabricante / Proveedor</label>
            <input
              id="field-fabricante"
              type="text"
              placeholder="Ej. Ydra (Noruega)"
              value={form.fabricante}
              onChange={e => set('fabricante', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showCapacity && (
              <div>
                <label htmlFor="field-capacidad-nominal" className={labelCls}>Capacidad nominal (kg/h)</label>
                <input id="field-capacidad-nominal" type="number" min={0} value={form.capacidad_nominal_kg_h} onChange={e => set('capacidad_nominal_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showStorage && (
              <div>
                <label htmlFor="field-almacenamiento" className={labelCls}>Almacenamiento / Volumen (L)</label>
                <input id="field-almacenamiento" type="number" min={0} value={form.almacenamiento_l} onChange={e => set('almacenamiento_l', e.target.value)} className={inputCls} />
              </div>
            )}
            {showKgH && (
              <div>
                <label htmlFor="field-capacidad-carga" className={labelCls}>Capacidad carga (kg/h)</label>
                <input id="field-capacidad-carga" type="number" min={0} value={form.capacidad_carga_kg_h} onChange={e => set('capacidad_carga_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showRendimiento && (
              <div>
                <label htmlFor="field-rendimiento" className={labelCls}>Rendimiento (kg/h)</label>
                <input id="field-rendimiento" type="number" min={0} value={form.rendimiento_kg_h} onChange={e => set('rendimiento_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showPotencia && (
              <div>
                <label htmlFor="field-potencia" className={labelCls}>Potencia (kW)</label>
                <input id="field-potencia" type="number" min={0} step="0.1" value={form.potencia_kw} onChange={e => set('potencia_kw', e.target.value)} className={inputCls} />
              </div>
            )}
            {showCfm && (
              <div>
                <label htmlFor="field-cfm" className={labelCls}>Caudal (CFM)</label>
                <input id="field-cfm" type="number" min={0} value={form.cfm} onChange={e => set('cfm', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="field-material" className={labelCls}>Material</label>
            <input
              id="field-material"
              type="text"
              placeholder="Ej. Acero Inoxidable AISI 316"
              value={form.material}
              onChange={e => set('material', e.target.value)}
              className={inputCls}
            />
          </div>

          {form.tipo === 'incinerador' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inc-horas" className={labelCls}>Horas funcionamiento/día</label>
                <input id="inc-horas" type="number" min={0} max={24} value={form.horas_funcionamiento} onChange={e => set('horas_funcionamiento', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-req" className={labelCls}>Requerimiento energético</label>
                <input id="inc-req" type="text" placeholder="Ej. 390 kWh" value={form.requerimiento_energetico} onChange={e => set('requerimiento_energetico', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-cp" className={labelCls}>Cámara primaria (dim.)</label>
                <input id="inc-cp" type="text" placeholder="Ej. 1.450 m diámetro interior" value={form.camara_primaria} onChange={e => set('camara_primaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-qp" className={labelCls}>N° quemadores primaria</label>
                <input id="inc-qp" type="number" min={0} max={10} value={form.num_quemadores_primaria} onChange={e => set('num_quemadores_primaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-tp" className={labelCls}>Temp. cámara primaria (°C)</label>
                <input id="inc-tp" type="number" min={0} max={2000} value={form.temperatura_camara_primaria_c} onChange={e => set('temperatura_camara_primaria_c', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-cs" className={labelCls}>Cámara secundaria (dim.)</label>
                <input id="inc-cs" type="text" placeholder="Ej. 2 m Diámetro Interior" value={form.camara_secundaria} onChange={e => set('camara_secundaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-qs" className={labelCls}>N° quemadores secundaria</label>
                <input id="inc-qs" type="number" min={0} max={10} value={form.num_quemadores_secundaria} onChange={e => set('num_quemadores_secundaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-ts" className={labelCls}>Temp. cámara secundaria (°C)</label>
                <input id="inc-ts" type="number" min={0} max={2000} value={form.temperatura_camara_secundaria_c} onChange={e => set('temperatura_camara_secundaria_c', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-carga" className={labelCls}>Sistema de carga</label>
                <input id="inc-carga" type="text" placeholder="Ej. CARGA MANUAL TACHOS 60L" value={form.sistema_carga} onChange={e => set('sistema_carga', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-descarga" className={labelCls}>Sistema de descarga</label>
                <input id="inc-descarga" type="text" placeholder="Ej. MANUAL HACIA MAXISACOS" value={form.sistema_descarga} onChange={e => set('sistema_descarga', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-disp" className={labelCls}>Disposición final</label>
                <input id="inc-disp" type="text" placeholder="Ej. VERTEDERO MUNICIPAL PTA ARENAS" value={form.disposicion_final} onChange={e => set('disposicion_final', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-gas" className={labelCls}>Almacenamiento gas</label>
                <input id="inc-gas" type="text" placeholder="Ej. 4000L X 2 = 8.000L GAS GLP" value={form.almacenamiento_gas} onChange={e => set('almacenamiento_gas', e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="field-notas" className={labelCls}>Notas / Especificaciones adicionales</label>
            <textarea
              id="field-notas"
              rows={3}
              placeholder="Ej. Motor 22 kW, 400V/50Hz. Cuchillos Vanax. Brida entrada 10 pulgadas."
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Guardando…' : editingId ? 'Actualizar equipo' : 'Guardar equipo'}
          </button>
        </div>
      )}

      {/* Tabla */}
      {catalogoCustom.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
          No hay equipos personalizados. Agrega el primero con el botón de arriba.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="text-left px-3 py-2" scope="col">Tipo</th>
                <th className="text-left px-3 py-2" scope="col">Nombre / Modelo</th>
                <th className="text-left px-3 py-2" scope="col">Fabricante</th>
                <th className="text-left px-3 py-2" scope="col">Capacidad</th>
                <th className="text-left px-3 py-2" scope="col">Material</th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {catalogoCustom.map((entry, i) => {
                const capacidad = entry.capacidad_nominal_kg_h
                  ? `${entry.capacidad_nominal_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.capacidad_carga_kg_h
                  ? `${entry.capacidad_carga_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.rendimiento_kg_h
                  ? `${entry.rendimiento_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.cfm
                  ? `${entry.cfm} CFM`
                  : entry.almacenamiento_l
                  ? `${entry.almacenamiento_l.toLocaleString('es-CL')} L`
                  : '—';

                return (
                  <tr key={entry.id ?? i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLOR[entry.tipo]}`}>
                        {TIPO_LABELS[entry.tipo] ?? entry.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate" title={entry.marca_modelo}>
                      {entry.marca_modelo}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                      {entry.fabricante ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-xs">
                      {capacidad}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs max-w-[120px] truncate" title={entry.material}>
                      {entry.material ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.id && (
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors mr-1"
                          title="Editar"
                          aria-label={`Editar ${entry.marca_modelo}`}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {entry.id && (
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                          title="Eliminar"
                          aria-label={`Eliminar ${entry.marca_modelo}`}
                        >
                          {deletingId === entry.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
