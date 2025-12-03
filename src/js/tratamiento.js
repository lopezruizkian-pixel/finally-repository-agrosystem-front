// Arreglo para almacenar tratamientos
let tratamientos = [];
let animalesList = [];
let reportesList = [];
let medicamentosList = [];
let enfermedadesList = []; // NUEVA: lista de enfermedades

// Selección de elementos
const modal = document.getElementById('modalAgregarTratamiento');
const btnGuardar = document.getElementById('btnGuardarTratamiento');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAgregar = document.querySelector('.btn-agregar');
const tablaTratamientos = document.querySelector('.tabla-animales');
const inputNumArete = document.getElementById('numArete');
const inputNombreTratamiento = document.getElementById('nombreTratamiento');
const inputFechaInicio = document.getElementById('fechaInicio');
const inputFechaFin = document.getElementById('fechaFin');
const inputEnfermedad = document.getElementById('enfermedad');
const inputMedicamentos = document.getElementById('medicamentos');
const selectAnimalTratamiento = document.getElementById('selectAnimalTratamiento');
const selectReporteTratamiento = document.getElementById('selectReporteTratamiento');
const selectMedicamentoTratamiento = document.getElementById('selectMedicamentoTratamiento');
const inputDosis = document.getElementById('dosis');
const inputUnidadDosis = document.getElementById('unidadDosis');
const selectVia = document.getElementById('via');
const inputFrecuencia = document.getElementById('frecuencia');
const inputDuracion = document.getElementById('duracion');
const inputVeterinario = document.getElementById('veterinario');
const selectEstado = document.getElementById('estado');
const inputObservaciones = document.getElementById('observaciones');
const buscador = document.querySelector('.buscador input');

// Helper: normaliza distintas representaciones de fecha a 'YYYY-MM-DD' para inputs type=date
function formatDateForInput(d){
  if(!d && d !== 0) return '';
  try{
    if(Array.isArray(d)){
      const [y, m, day] = d;
      const mm = String(m).padStart(2,'0');
      const dd = String(day).padStart(2,'0');
      return `${y}-${mm}-${dd}`;
    }
    if(typeof d === 'number'){
      const dt = new Date(d);
      if(isNaN(dt)) return '';
      return dt.toISOString().slice(0,10);
    }
    if(typeof d === 'string'){
      const s = d.trim();
      // numeric string -> treat as ms
      if(/^\d+$/.test(s)){
        const dt = new Date(Number(s)); if(isNaN(dt)) return '';
        return dt.toISOString().slice(0,10);
      }
      // if already in YYYY-MM-DD format or ISO, try Date parsing
      const dt = new Date(s);
      if(!isNaN(dt)) return dt.toISOString().slice(0,10);
      // fallback: take first 10 chars (common when backend returns 'YYYY-MM-DDTHH:mm:ss')
      if(s.length >= 10) return s.substring(0,10);
    }
  }catch(e){ console.warn('formatDateForInput error', e); }
  return '';
}

// Modal de visualización
const modalVisualizar = document.getElementById('modalVisualizarTratamiento');
const contenidoTratamiento = document.getElementById('contenidoTratamiento');
const btnCerrarVisualizar = document.getElementById('btnCerrarVisualizar');

let editIndex = null;
let tratamientoAEliminar = null;

// ========== SISTEMA DE ALERTAS PERSONALIZADAS ==========
function mostrarAlerta(mensaje, tipo = 'info') {
  // Crear overlay si no existe
  let alertaOverlay = document.getElementById('alertaOverlay');
  if (!alertaOverlay) {
    alertaOverlay = document.createElement('div');
    alertaOverlay.id = 'alertaOverlay';
    alertaOverlay.className = 'alerta-overlay';
    document.body.appendChild(alertaOverlay);
  }

  // Configurar iconos y títulos según el tipo
  const configuracion = {
    error: { icono: 'fa-exclamation-circle', titulo: 'Error', color: '#dc3545' },
    success: { icono: 'fa-check-circle', titulo: 'Éxito', color: '#28a745' },
    warning: { icono: 'fa-exclamation-circle', titulo: 'Error', color: '#ffc107' },
    info: { icono: 'fa-info-circle', titulo: 'Información', color: '#17a2b8' }
  };

  const config = configuracion[tipo] || configuracion.info;

  // Crear contenido de la alerta
  alertaOverlay.innerHTML = `
    <div class="alerta-container">
      <div class="alerta-header ${tipo}">
        <i class="fas ${config.icono} alerta-icon"></i>
        <h3 class="alerta-title">${config.titulo}</h3>
      </div>
      <div class="alerta-body">
        <p class="alerta-message">${mensaje}</p>
      </div>
      <div class="alerta-footer">
        <button class="btn-alerta-ok" onclick="cerrarAlerta()">
          <i class="fas fa-check"></i> Aceptar
        </button>
      </div>
    </div>
  `;

  // Mostrar alerta
  alertaOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Cerrar con ESC
  const cerrarConEsc = (e) => {
    if (e.key === 'Escape') {
      cerrarAlerta();
      document.removeEventListener('keydown', cerrarConEsc);
    }
  };
  document.addEventListener('keydown', cerrarConEsc);

  // Cerrar al hacer clic fuera
  alertaOverlay.onclick = (e) => {
    if (e.target === alertaOverlay) {
      cerrarAlerta();
    }
  };
}

// helper headers (token + Id-Usuario) - prefer numeric id if available
async function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
  let idUsuarioHeader = '';
  if (datosUsuarioRaw) {
    try {
      const parsed = JSON.parse(datosUsuarioRaw);
      if (parsed && (parsed.idUsuario || parsed.id)) idUsuarioHeader = String(parsed.idUsuario || parsed.id);
      else if (parsed && parsed.usuario) idUsuarioHeader = String(parsed.usuario);
    } catch (e) { idUsuarioHeader = String(datosUsuarioRaw); }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(idUsuarioHeader ? { 'Id-Usuario': idUsuarioHeader } : {})
  };
}

// Resolve username to numeric id via /usuarios
async function resolveUsuarioId(usuarioString){
  if(!usuarioString) return null;
  try{
    const res = await fetch('http://localhost:7002/usuarios', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.warn('resolveUsuarioId failed', res.status, text); return null; }
    let list = [];
    if(text){ try{ list = JSON.parse(text); }catch(e){ console.warn('resolveUsuarioId: not JSON', text); return null; } }
    const found = (list || []).find(u => { const uname = u.usuario || u.nombreUsuario || u.correo || ''; return String(uname).toLowerCase() === String(usuarioString).toLowerCase(); });
    if(found) return found.idUsuario || found.id || null;
    return null;
  }catch(e){ console.error(e); return null; }
}

// Role helpers
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try { const datos = JSON.parse(datosStr); return (datos.rolNombre || (datos.rol && (datos.rol.nombre || (datos.rol.idRol === 1 ? 'Administrador' : ''))) || datos.rol || '').toString().toLowerCase(); } catch(e){ return String(datosStr).toLowerCase(); }
}
function isVeterinario(){ const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }
function isAdmin(){ const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }

// Fetch enfermedades desde backend
async function fetchEnfermedades(){
  try{
    console.debug('GET /enfermedades');
    const res = await fetch('http://localhost:7002/enfermedades', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando enfermedades', res.status, text); return; }
    enfermedadesList = text ? JSON.parse(text) : [];
    console.debug('enfermedades loaded', enfermedadesList);
    // Poblar select de enfermedades
    if(inputEnfermedad){
      inputEnfermedad.innerHTML = '<option value="">Seleccionar enfermedad...</option>';
      (enfermedadesList || []).forEach(e => {
        const nombre = e.nombreEnfermedad || e.nombre || '';
        const tipo = e.tipoEnfermedad || e.tipo || '';
        const o = document.createElement('option');
        o.value = nombre;
        o.textContent = `${nombre} (${tipo})`;
        inputEnfermedad.appendChild(o);
      });
    }
  }catch(e){ console.error(e); }
}

// Fetch animals, reportes, medicamentos and tratamientos
async function fetchAnimales(){
  try{
    console.debug('GET /animales');
    const res = await fetch('http://localhost:7002/animales', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando animales', res.status, text); return; }
    animalesList = text ? JSON.parse(text) : [];
    console.debug('animales loaded', animalesList);
    // populate select if exists
    if(selectAnimalTratamiento){
      selectAnimalTratamiento.innerHTML = '<option value="">-- Seleccione un animal --</option>';
      (animalesList || []).forEach(a => {
        const id = a.idAnimal || a.id;
        const name = a.nombreAnimal || a.nombre || `Animal ${id}`;
        const o = document.createElement('option'); o.value = id; o.textContent = `${name} (arete ${a.numArete || ''})`; selectAnimalTratamiento.appendChild(o);
      });
    }
  }catch(e){ console.error(e); }
}

async function fetchReportes(){
  try{
    console.debug('GET /reportes');
    const res = await fetch('http://localhost:7002/reportes', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando reportes', res.status, text); return; }
    reportesList = text ? JSON.parse(text) : [];
    console.debug('reportes loaded', reportesList);
    if(selectReporteTratamiento){
      selectReporteTratamiento.innerHTML = '<option value="">-- Seleccione un reporte (opcional) --</option>';
      (reportesList || []).forEach(r => {
        const id = r.idReporte || r.id;
        const anim = r.idAnimales || r.idAnimal || {};
        const arete = anim.numArete || '';
        const fecha = Array.isArray(r.fecha)? r.fecha.join('-') : r.fecha || '';
        const o = document.createElement('option'); o.value = id; o.textContent = `#${id} - ${fecha} (arete ${arete})`; selectReporteTratamiento.appendChild(o);
      });
    }
  }catch(e){ console.error(e); }
}

async function fetchMedicamentos(){
  try{
    console.debug('GET /medicamento');
    const res = await fetch('http://localhost:7002/medicamento', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando medicamentos', res.status, text); return; }
    medicamentosList = text ? JSON.parse(text) : [];
    console.debug('medicamentos loaded', medicamentosList);
    if(selectMedicamentoTratamiento){
      selectMedicamentoTratamiento.innerHTML = '<option value="">-- Seleccione un medicamento --</option>';
      (medicamentosList || []).forEach(m => { const id = m.idMedicamento || m.id; const name = m.nombreMedicamento || m.nombre || `Medicamento ${id}`; const o = document.createElement('option'); o.value = id; o.textContent = `${name}`; selectMedicamentoTratamiento.appendChild(o); });
    }
  }catch(e){ console.error(e); }
}

async function fetchTratamientosFromBackend(){
  try{
    console.debug('GET /tratamientos');
    const res = await fetch('http://localhost:7002/tratamientos', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando tratamientos', res.status, text); return; }
    const data = text ? JSON.parse(text) : [];
    // Map backend objects into a normalized array for rendering
    tratamientos = (data || []).map(t => ({
      idTratamiento: t.idTratamiento || t.id,
      idAnimal: t.idAnimal || t.idAnimales || t.idAnimal || null,
      idReporte: t.idReporte || (t.idReporte ? t.idReporte : null),
      idUsuario: t.idUsuario || null,
      idMedicamento: t.idMedicamento || t.idMedicamento || null,
      nombreTratamiento: t.nombreTratamiento || t.nombre || '',
      fechaInicio: formatDateForInput(t.fechaInicio || t.fechaInicioMillis || t.fecha_inicio || t.fecha),
      fechaFin: formatDateForInput(t.fechaFinal || t.fecha_final || t.fechaFin || t.fechaFinalMillis),
      // copy medication/dosing/via info if present
      medicamentos: t.medicamentos || (t.idMedicamento && (t.idMedicamento.nombreMedicamento || '')) || '',
      dosis: t.dosis || (t.idMedicamento && t.idMedicamento.dosis) || '',
      via: t.via || (t.idMedicamento && t.idMedicamento.viaAdministracion) || '',
      frecuencia: t.frecuencia || t.frecuenciaAplicacion || '',
      duracion: t.duracion || '',
      veterinario: t.veterinario || '',
      // derive numArete from nested animal object if present
      numArete: String((t.idAnimal && (t.idAnimal.numArete || t.idAnimal.numArete === 0) ? t.idAnimal.numArete : (t.idAnimales && t.idAnimales.numArete ? t.idAnimales.numArete : (t.numArete || '')))),
      // derive enfermedad from nested reporte if available
      enfermedad: (t.idReporte && (t.idReporte.diagnosticoPresuntivo || t.idReporte.diagnosticoDefinitivo)) ? (t.idReporte.diagnosticoPresuntivo || t.idReporte.diagnosticoDefinitivo) : (t.enfermedad || ''),
      // estado may be provided by backend, otherwise fallback
      estado: t.estado || t.estadoTratamiento || 'N/A',
      observaciones: t.observaciones || t.observacion || ''
    }));
    console.debug('tratamientos mapped', tratamientos);
    renderizarTratamientos(tratamientos);
    // If report select is empty (no /reportes or it returned empty), try to populate it from nested idReporte in tratamientos
    try{
      if(selectReporteTratamiento && selectReporteTratamiento.options.length <= 1){
        const seen = new Set();
        tratamientos.forEach(t => {
          const r = t.idReporte || null;
          const rid = r && (r.idReporte || r.id) ? (r.idReporte || r.id) : null;
          if(rid && !seen.has(rid)){
            seen.add(rid);
            const fecha = (r && Array.isArray(r.fecha)) ? r.fecha.join('-') : (r && r.fecha) || '';
            const anim = (r && r.idAnimales) || (r && r.idAnimal) || {};
            const arete = anim.numArete || '';
            const o = document.createElement('option'); o.value = rid; o.textContent = `#${rid} - ${fecha} (arete ${arete})`;
            selectReporteTratamiento.appendChild(o);
          }
        });
        console.debug('selectReporteTratamiento populated from tratamientos fallback');
      }
    }catch(e){ console.warn('Error populating selectReporteTratamiento from tratamientos', e); }
  }catch(e){ console.error(e); }
}

// Update existing tratamiento via PUT /tratamientos/{id}
async function updateTratamientoBackend(idTratamiento, payload, idUsuarioHeaderOverride){
  try{
    if(!idTratamiento) throw new Error('Missing idTratamiento for update');
    payload.idTratamiento = Number(idTratamiento);
    console.debug(`PUT /tratamientos/${idTratamiento} payload`, payload);
    const headers = await getAuthHeaders();
    if(idUsuarioHeaderOverride) headers['Id-Usuario'] = String(idUsuarioHeaderOverride);
    const res = await fetch(`http://localhost:7002/tratamientos/${idTratamiento}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
    const text = await res.text(); let body = text? ((()=>{ try{return JSON.parse(text);}catch(e){return text;} })()):null;
    if(!res.ok){ console.error('PUT /tratamientos error', res.status, body); mostrarAlerta('Error actualizando tratamiento (ver consola)','error'); return false; }
    console.debug('PUT /tratamientos response', body);
    mostrarAlerta('Tratamiento actualizado correctamente.', 'success');
    modal.style.display = 'none';
    editIndex = null;
    await fetchTratamientosFromBackend();
    return true;
  }catch(e){ console.error(e); mostrarAlerta('Error actualizando tratamiento','error'); return false; }
}

// Delete tratamiento via DELETE /tratamientos/{id}
async function deleteTratamientoBackend(idTratamiento){
  try{
    if(!idTratamiento) throw new Error('Missing idTratamiento for delete');
    // resolve idUsuario header numeric
    const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
    let idUsuario = null;
    if(datosUsuarioRaw){ try{ const parsed = JSON.parse(datosUsuarioRaw); if(parsed && (parsed.idUsuario||parsed.id)) idUsuario = parsed.idUsuario||parsed.id; else if(parsed && parsed.usuario) idUsuario = parsed.usuario; }catch(e){ idUsuario = datosUsuarioRaw; } }
    let resolvedIdForHeader = null;
    if(typeof idUsuario === 'number' && idUsuario>0) resolvedIdForHeader = idUsuario;
    else if(typeof idUsuario === 'string' && idUsuario.trim()){ const resolved = await resolveUsuarioId(idUsuario); if(resolved) resolvedIdForHeader = resolved; }
    if(!resolvedIdForHeader){ mostrarAlerta('No se pudo determinar Id-Usuario numérico para eliminar el tratamiento','warning'); return false; }

    const headers = await getAuthHeaders(); headers['Id-Usuario'] = String(resolvedIdForHeader);
    console.debug(`DELETE /tratamientos/${idTratamiento}`);
    const res = await fetch(`http://localhost:7002/tratamientos/${idTratamiento}`, { method: 'DELETE', headers });
    const text = await res.text(); let body = text? ((()=>{ try{return JSON.parse(text);}catch(e){return text;} })()):null;
    if(!res.ok){ console.error('DELETE /tratamientos error', res.status, body); mostrarAlerta('No se pudo eliminar el tratamiento (ver consola)','error'); return false; }
    console.debug('DELETE /tratamientos response', body);
    mostrarAlerta('Tratamiento eliminado correctamente.', 'success');
    await fetchTratamientosFromBackend();
    return true;
  }catch(e){ console.error(e); mostrarAlerta('Error eliminando tratamiento','error'); return false; }
}

function cerrarAlerta() {
  const alertaOverlay = document.getElementById('alertaOverlay');
  if (alertaOverlay) {
    alertaOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ========== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ==========
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarTratamiento';
modalEliminar.classList.add('modal-overlay');
modalEliminar.innerHTML = `
  <div class="modal-container">
    <div class="modal-header-custom">
      <h2 class="modal-title-custom">
        <i class="fas fa-trash-alt"></i> Eliminar Tratamiento
      </h2>
      <button onclick="cerrarModalEliminar()" class="btn-close-custom">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body-custom">
      <div class="modal-icon-warning" style="background-color: #f8d7da;">
        <i class="fas fa-exclamation-triangle" style="color: #721c24;"></i>
      </div>
      <p class="modal-message">¿Estás seguro de eliminar este tratamiento?</p>
      <p class="modal-submessage" id="mensajeEliminarTratamiento">Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button onclick="confirmarEliminarTratamiento()" class="btn-modal-confirmar">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

// Abrir modal de agregar/editar
btnAgregar.addEventListener('click', () => {
  limpiarModal();
  // ensure modal shows in 'Agregar' mode
  const hdr = modal && modal.querySelector('h2'); if(hdr) hdr.textContent = 'Agregar Tratamiento';
  if(btnGuardar) btnGuardar.textContent = 'Guardar';
  modal.style.display = 'flex';
});

// Mostrar crear solo para veterinario (admin no tiene CRUD aquí)
if (!isVeterinario() && btnAgregar) {
  btnAgregar.style.display = 'none';
}

// Cerrar modal de agregar/editar
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

// Cerrar modal de visualizar
btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modalVisualizar) modalVisualizar.style.display = 'none';
});

// Limpiar modal
function limpiarModal() {
  if(inputNumArete) inputNumArete.value = '';
  if(selectAnimalTratamiento) { selectAnimalTratamiento.value = ''; selectAnimalTratamiento.disabled = false; }
  inputNombreTratamiento.value = '';
  inputFechaInicio.value = '';
  inputFechaFin.value = '';
  if(inputEnfermedad) inputEnfermedad.value = '';
  inputMedicamentos.value = '';
  inputDosis.value = '';
  if(inputUnidadDosis) inputUnidadDosis.value = '';
  selectVia.value = 'Oral';
  inputFrecuencia.value = '';
  inputDuracion.value = '';
  inputVeterinario.value = '';
  selectEstado.value = 'En curso';
  inputObservaciones.value = '';
  // enable all fields by default when opening modal for adding
  if(selectReporteTratamiento) selectReporteTratamiento.disabled = false;
  if(selectMedicamentoTratamiento) selectMedicamentoTratamiento.disabled = false;
  if(inputFechaInicio) inputFechaInicio.disabled = false;
  if(inputFechaFin) inputFechaFin.disabled = false;
  if(inputDosis) inputDosis.disabled = false;
  if(selectVia) selectVia.disabled = false;
  if(inputFrecuencia) inputFrecuencia.disabled = false;
  if(inputDuracion) inputDuracion.disabled = false;
  if(inputVeterinario) inputVeterinario.disabled = false;
  if(inputObservaciones) inputObservaciones.disabled = false;
  if(inputNombreTratamiento) inputNombreTratamiento.disabled = false;
  if(selectEstado) selectEstado.disabled = false;
  if(inputEnfermedad) inputEnfermedad.disabled = false;
  if(inputMedicamentos) inputMedicamentos.disabled = false;
  // Ensure previously-hidden fields are visible again when opening for adding
  const restoreDisplay = (el) => { try{ if(!el) return; el.style.display = ''; const lab = el.previousElementSibling; if(lab && lab.tagName === 'LABEL') lab.style.display = ''; }catch(e){/*ignore*/} };
  restoreDisplay(selectEstado);
  restoreDisplay(inputFrecuencia);
  restoreDisplay(inputDuracion);
  restoreDisplay(inputVeterinario);
  editIndex = null;
}

// Guardar tratamiento (agregar o editar)
btnGuardar.addEventListener('click', () => {
  (async () => {
  const numArete = inputNumArete ? inputNumArete.value.trim() : (selectAnimalTratamiento && selectAnimalTratamiento.value ? String(selectAnimalTratamiento.value) : '');
  const nombreTratamiento = inputNombreTratamiento.value.trim();
  const fechaInicio = inputFechaInicio.value.trim();
  const fechaFin = inputFechaFin.value.trim();
  const enfermedad = inputEnfermedad ? inputEnfermedad.value.trim() : '';
  const medicamentos = inputMedicamentos.value.trim();
  // CAMBIO: capturar dosis como valor + unidad
  const dosisValor = inputDosis.value.trim();
  const dosisUnidad = inputUnidadDosis ? inputUnidadDosis.value.trim() : '';
  const dosis = dosisValor && dosisUnidad ? `${dosisValor} ${dosisUnidad}` : dosisValor;
  const via = selectVia.value;
  const frecuencia = inputFrecuencia.value.trim();
  const duracion = inputDuracion.value.trim();
  const veterinario = inputVeterinario.value.trim();
  const estado = selectEstado.value;
  const observaciones = inputObservaciones.value.trim();

  // Validación con alerta personalizada
  const camposFaltantes = [];
  if (!numArete) camposFaltantes.push('Animal (Num. Arete)');
  if (!nombreTratamiento) camposFaltantes.push('Nombre del Tratamiento');
  if (!fechaInicio) camposFaltantes.push('Fecha de Inicio');
  if (!enfermedad) camposFaltantes.push('Enfermedad/Condición');
  if (!dosisValor || !dosisUnidad) camposFaltantes.push('Dosis (Valor y Unidad)');
  if (!frecuencia) camposFaltantes.push('Frecuencia');
  if (!duracion) camposFaltantes.push('Duración');

  if (camposFaltantes.length > 0) {
    const mensaje = camposFaltantes.length === 1 
      ? `Por favor complete el campo obligatorio: ${camposFaltantes[0]}.`
      : `Por favor complete los siguientes campos obligatorios: ${camposFaltantes.join(', ')}.`;
    mostrarAlerta(mensaje, 'warning');
    return;
  }
  // Ensure reference lists are loaded
  await Promise.all([fetchAnimales(), fetchReportes(), fetchMedicamentos()]);

  // Use selected animal if available (prefer), else fall back to searching by numArete
  let idAnimal = null;
  if(selectAnimalTratamiento && selectAnimalTratamiento.value) idAnimal = selectAnimalTratamiento.value;
  else {
    const animal = (animalesList || []).find(a => String(a.numArete) === String(numArete) );
    if(!animal){ mostrarAlerta('No se encontró un animal con ese número de arete. Carga animales o verifica el valor.', 'warning'); return; }
    idAnimal = animal.idAnimal || animal.id;
  }

  // Resolve selected reporte if provided, else try to match by animal+fecha or fallback to latest
  let matchedReporte = null;
  if(selectReporteTratamiento && selectReporteTratamiento.value) {
    const sel = selectReporteTratamiento.value; matchedReporte = (reportesList||[]).find(r => String(r.idReporte||r.id) === String(sel));
  }
  if(!matchedReporte && fechaInicio){
    matchedReporte = (reportesList || []).find(r => { const rid = (r.idAnimales && (r.idAnimales.idAnimal || r.idAnimales.id)) || (r.idAnimal && (r.idAnimal.idAnimal || r.idAnimal.id)); const rfecha = Array.isArray(r.fecha) ? r.fecha.join('-') : r.fecha; return String(rid) === String(idAnimal) && String(rfecha) === String(fechaInicio); });
  }
  if(!matchedReporte){
    const reportsForAnimal = (reportesList || []).filter(r => { const rid = (r.idAnimales && (r.idAnimales.idAnimal || r.idAnimales.id)) || (r.idAnimal && (r.idAnimal.idAnimal || r.idAnimal.id)); return String(rid) === String(idAnimal); });
    if(reportsForAnimal.length>0){ matchedReporte = reportsForAnimal.sort((a,b)=>{ const fa = Array.isArray(a.fecha)?a.fecha.join('-'):a.fecha; const fb = Array.isArray(b.fecha)?b.fecha.join('-'):b.fecha; return fa<fb?1:-1; })[0]; }
  }

  if(!matchedReporte){
    // Fallback: if the /reportes list is empty but the reporte select has options (populated from tratamientos fallback),
    // use the selected option or the first available non-empty option.
    let fallbackReporteId = null;
    if(selectReporteTratamiento){
      if(selectReporteTratamiento.value) fallbackReporteId = selectReporteTratamiento.value;
      else {
        const firstOpt = Array.from(selectReporteTratamiento.options).find(o => o.value && o.value !== '');
        if(firstOpt) fallbackReporteId = firstOpt.value;
      }
    }
    if(fallbackReporteId){
      // try to find in reportesList by id
      matchedReporte = (reportesList || []).find(r => String(r.idReporte || r.id) === String(fallbackReporteId));
      if(!matchedReporte){
        // try to recover a nested reporte object from tratamientos data
        for(const t of (tratamientos || [])){
          const r = t.idReporte || null;
          const rid = r && (r.idReporte || r.id) ? (r.idReporte || r.id) : null;
          if(rid && String(rid) === String(fallbackReporteId)){
            matchedReporte = { idReporte: Number(rid), fecha: (r && r.fecha) || t.fechaInicio || '', idAnimales: (r && r.idAnimales) || (t.idAnimal ? { idAnimal: t.idAnimal } : null) };
            break;
          }
        }
      }
    }
  }
  if(!matchedReporte){ mostrarAlerta('No se encontró un reporte asociado al animal. Crea un reporte primero o selecciona uno disponible.', 'warning'); return; }
  const idReporte = matchedReporte.idReporte || matchedReporte.id;
  

  // Resolve medicamento: prefer selected medication, else try to match by text
  let matchedMed = null;
  if(selectMedicamentoTratamiento && selectMedicamentoTratamiento.value) matchedMed = (medicamentosList||[]).find(m => String(m.idMedicamento||m.id) === String(selectMedicamentoTratamiento.value));
  if(!matchedMed && medicamentos){ matchedMed = (medicamentosList || []).find(m => (m.nombreMedicamento || m.nombre || '').toLowerCase().includes(medicamentos.toLowerCase().split(/\s|,|;/)[0])); }
  if(!matchedMed){
    // If none found, try to use first medication as fallback
    matchedMed = (medicamentosList || [])[0] || null;
  }
  const idMedicamento = matchedMed ? (matchedMed.idMedicamento || matchedMed.id) : null;

  // resolve idUsuario numeric for header and payload
  const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
  let idUsuario = null;
  if(datosUsuarioRaw){ try{ const parsed = JSON.parse(datosUsuarioRaw); if(parsed && (parsed.idUsuario||parsed.id)) idUsuario = parsed.idUsuario||parsed.id; else if(parsed && parsed.usuario) idUsuario = parsed.usuario; }catch(e){ idUsuario = datosUsuarioRaw; } }
  let resolvedIdForHeader = null;
  if(typeof idUsuario === 'number' && idUsuario>0) resolvedIdForHeader = idUsuario;
  else if(typeof idUsuario === 'string' && idUsuario.trim()){ const resolved = await resolveUsuarioId(idUsuario); if(resolved) resolvedIdForHeader = resolved; }
  if(!resolvedIdForHeader){ mostrarAlerta('No se pudo determinar un Id de usuario numérico para enviar la petición.','warning'); return; }

  // Build payload
  const payload = {
    idAnimal: { idAnimal: Number(idAnimal) },
    idReporte: { idReporte: Number(idReporte) },
    idUsuario: { idUsuario: Number(resolvedIdForHeader) },
    nombreTratamiento: nombreTratamiento,
    fechaInicio: fechaInicio,
    fechaFinal: fechaFin || undefined,
    idMedicamento: idMedicamento ? { idMedicamento: Number(idMedicamento) } : null,
    observaciones: observaciones || ''
  };

  if(editIndex !== null){
    // Update existing tratamiento via PUT
    const existing = tratamientos[editIndex];
    const idTratamiento = existing && (existing.idTratamiento || existing.id);
    if(!idTratamiento){ mostrarAlerta('No se encontró id del tratamiento a actualizar','warning'); return; }
    // Build payload using existing (locked) fields and only override allowed editable ones
    const existingIdAnimal = (existing.idAnimal && (existing.idAnimal.idAnimal || existing.idAnimal.id)) || (existing.idAnimales && (existing.idAnimales.idAnimal || existing.idAnimales.id)) || null;
    const existingIdReporte = (existing.idReporte && (existing.idReporte.idReporte || existing.idReporte.id)) || null;
    const existingIdMedicamento = (existing.idMedicamento && (existing.idMedicamento.idMedicamento || existing.idMedicamento.id)) || null;
    // Build update payload restricted to backend-accepted fields only.
    const payloadUpdate = {
      idAnimal: { idAnimal: Number(existingIdAnimal || idAnimal) },
      idReporte: { idReporte: Number(existingIdReporte || idReporte) },
      idUsuario: { idUsuario: Number(resolvedIdForHeader) },
      nombreTratamiento: nombreTratamiento,
      fechaInicio: existing.fechaInicio || fechaInicio,
      fechaFinal: existing.fechaFin || fechaFin || undefined,
      idMedicamento: existingIdMedicamento ? { idMedicamento: Number(existingIdMedicamento) } : (idMedicamento ? { idMedicamento: Number(idMedicamento) } : null),
      observaciones: existing.observaciones || observaciones || ''
    };
    const ok = await updateTratamientoBackend(idTratamiento, payloadUpdate, resolvedIdForHeader);
    if(ok){ modal.style.display = 'none'; }
  } else {
    try{
      const headers = await getAuthHeaders(); headers['Id-Usuario'] = String(resolvedIdForHeader);
      console.debug('POST /tratamientos payload', payload);
      const res = await fetch('http://localhost:7002/tratamientos', { method: 'POST', headers, body: JSON.stringify(payload) });
      const text = await res.text(); let body = text? ((()=>{ try{return JSON.parse(text);}catch(e){return text;} })()):null;
      if(!res.ok){ console.error('POST /tratamientos error', res.status, body); mostrarAlerta('Error creando tratamiento (ver consola)', 'error'); return; }
      console.debug('POST /tratamientos response', body);
      mostrarAlerta('Tratamiento creado correctamente.', 'success');
      modal.style.display = 'none';
      // refresh lists
      await fetchTratamientosFromBackend();
    }catch(e){ console.error(e); mostrarAlerta('Error creando tratamiento', 'error'); }
  }

  })();
});

// Funciones del modal de eliminar
function abrirModalEliminar(tratamiento) {
  tratamientoAEliminar = tratamiento;
  document.getElementById('mensajeEliminarTratamiento').textContent = 
    `Se eliminará el tratamiento "${tratamiento.nombreTratamiento}" del animal ${tratamiento.numArete}. Esta acción no se puede deshacer.`;
  document.getElementById('modalEliminarTratamiento').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
  document.getElementById('modalEliminarTratamiento').classList.remove('active');
  document.body.style.overflow = 'auto';
  tratamientoAEliminar = null;
}

function confirmarEliminarTratamiento() {
  (async () => {
  if (tratamientoAEliminar) {
    const id = tratamientoAEliminar.idTratamiento || tratamientoAEliminar.id;
    if(id){
      const ok = await deleteTratamientoBackend(id);
      if(ok){
        cerrarModalEliminar();
        // fetchTratamientosFromBackend will refresh the table
      }
    } else {
      // fallback local removal
      const globalIndex = tratamientos.indexOf(tratamientoAEliminar);
      if(globalIndex>-1) tratamientos.splice(globalIndex, 1);
      renderizarTratamientos();
      cerrarModalEliminar();
      mostrarAlerta('Tratamiento eliminado correctamente.', 'success');
    }
  }
  })();
}

// Renderizar tratamientos en la tabla
function renderizarTratamientos(lista = tratamientos) {
  tablaTratamientos.innerHTML = '';

  if (lista.length === 0) {
    tablaTratamientos.innerHTML = '<p>No hay tratamientos registrados.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Num. Arete</th>
        <th>Tratamiento</th>
        <th>Enfermedad</th>
        <th>Fecha Inicio</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = tabla.querySelector('tbody');

  lista.forEach((tratamiento) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${tratamiento.numArete}</td>
      <td>${tratamiento.nombreTratamiento}</td>
      <td>${tratamiento.enfermedad}</td>
      <td>${tratamiento.fechaInicio}</td>
      <td>${tratamiento.estado}</td>
      <td>
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
        ${ isVeterinario() ? '<button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button><button class="btn-eliminar" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>' : '' }
      </td>
    `;

    // Visualizar detalle completo
    const btnVer = fila.querySelector('.btn-ver');
    if (btnVer) btnVer.addEventListener('click', () => {
      contenidoTratamiento.innerHTML = `
      <div class="detalle-item">
        <strong>Animal (Num. Arete)</strong>
        <p>${tratamiento.numArete}</p>
      </div>
      <div class="detalle-item">
        <strong>Nombre del Tratamiento</strong>
        <p>${tratamiento.nombreTratamiento}</p>
      </div>
      <div class="detalle-item">
        <strong>Fecha de Inicio</strong>
        <p>${tratamiento.fechaInicio}</p>
      </div>
      <div class="detalle-item">
        <strong>Fecha de Fin</strong>
        <p>${tratamiento.fechaFin || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Enfermedad/Condición</strong>
        <p>${tratamiento.enfermedad}</p>
      </div>
      <div class="detalle-item">
        <strong>Medicamentos</strong>
        <p>${tratamiento.medicamentos || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Dosis</strong>
        <p>${tratamiento.dosis || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Vía de Administración</strong>
        <p>${tratamiento.via}</p>
      </div>
      <div class="detalle-item">
        <strong>Frecuencia</strong>
        <p>${tratamiento.frecuencia || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Duración</strong>
        <p>${tratamiento.duracion || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Veterinario</strong>
        <p>${tratamiento.veterinario || 'N/A'}</p>
      </div>
      <div class="detalle-item">
        <strong>Estado</strong>
        <p>${tratamiento.estado}</p>
      </div>
      <div class="detalle-item">
        <strong>Observaciones</strong>
        <p>${tratamiento.observaciones || 'N/A'}</p>
      </div>
      `;
      modalVisualizar.style.display = 'flex';
    });

    // Editar (si existe y si el usuario tiene permiso)
    const btnEditar = fila.querySelector('.btn-editar');
    if (btnEditar) btnEditar.addEventListener('click', async () => {
      console.debug('Editar clicked, tratamiento:', tratamiento);
      // Ensure reference lists are loaded before prefill
      await Promise.all([fetchAnimales(), fetchReportes(), fetchMedicamentos(), fetchEnfermedades()]);
      console.debug('select counts:', { animals: selectAnimalTratamiento ? selectAnimalTratamiento.options.length : 0, reportes: selectReporteTratamiento? selectReporteTratamiento.options.length:0, meds: selectMedicamentoTratamiento? selectMedicamentoTratamiento.options.length:0 });
      
      // Prefill selects/inputs safely
      // Animal select
      try{
        if(selectAnimalTratamiento){
          let aid = null;
          if(tratamiento.idAnimal){ aid = tratamiento.idAnimal.idAnimal || tratamiento.idAnimal.id || tratamiento.idAnimal; }
          else if(tratamiento.idAnimales){ aid = tratamiento.idAnimales.idAnimal || tratamiento.idAnimales.id; }
          if(aid) selectAnimalTratamiento.value = String(aid);
          else {
            // try match by arete text
            const opt = Array.from(selectAnimalTratamiento.options).find(o => o.textContent.includes(tratamiento.numArete));
            if(opt) selectAnimalTratamiento.value = opt.value;
          }
        }
        if(selectReporteTratamiento){
          let rid = null;
          if(tratamiento.idReporte){ rid = tratamiento.idReporte.idReporte || tratamiento.idReporte.id || tratamiento.idReporte; }
          if(rid) selectReporteTratamiento.value = String(rid);
          else {
            // try to match by fecha
            const fecha = tratamiento.fechaInicio || '';
            const opt = Array.from(selectReporteTratamiento.options).find(o => o.textContent.includes(fecha));
            if(opt) selectReporteTratamiento.value = opt.value;
          }
        }
      }catch(e){ console.warn('prefill reporte select error', e); }

      // Medicamento select
      try{
        if(selectMedicamentoTratamiento){
          let mid = null;
          if(tratamiento.idMedicamento){ mid = tratamiento.idMedicamento.idMedicamento || tratamiento.idMedicamento.id || tratamiento.idMedicamento; }
          if(mid) selectMedicamentoTratamiento.value = String(mid);
          else {
            const opt = Array.from(selectMedicamentoTratamiento.options).find(o => (tratamiento.medicamentos || '').toLowerCase().includes(o.textContent.toLowerCase()));
            if(opt) selectMedicamentoTratamiento.value = opt.value;
          }
        }
      }catch(e){ console.warn('prefill medicamento select error', e); }

      // Other inputs - CAMBIO: parsear dosis en valor + unidad
      if(inputNombreTratamiento) inputNombreTratamiento.value = tratamiento.nombreTratamiento || '';
      if(inputFechaInicio) inputFechaInicio.value = formatDateForInput(tratamiento.fechaInicio || '');
      if(inputFechaFin) inputFechaFin.value = tratamiento.fechaFin || '';
      
      // CAMBIO: prefill enfermedad desde select
      if(inputEnfermedad) inputEnfermedad.value = tratamiento.enfermedad || '';
      
      if(inputMedicamentos) inputMedicamentos.value = tratamiento.medicamentos || '';
      
      // CAMBIO: parsear dosis en valor + unidad
      if(inputDosis && tratamiento.dosis){
        const parts = String(tratamiento.dosis).split(/\s+/);
        inputDosis.value = parts[0] || '';
        if(inputUnidadDosis && parts.length > 1){
          const unidad = parts.slice(1).join(' ');
          inputUnidadDosis.value = unidad;
        }
      } else {
        if(inputDosis) inputDosis.value = '';
        if(inputUnidadDosis) inputUnidadDosis.value = '';
      }
      
      if(selectVia) selectVia.value = tratamiento.via || 'Oral';
      
      // CAMBIO: prefill frecuencia desde select
      if(inputFrecuencia) inputFrecuencia.value = tratamiento.frecuencia || '';
      
      // CAMBIO: prefill duración desde select
      if(inputDuracion) inputDuracion.value = tratamiento.duracion || '';
      
      if(inputVeterinario) inputVeterinario.value = tratamiento.veterinario || '';
      if(selectEstado) selectEstado.value = tratamiento.estado || 'En curso';
      if(inputObservaciones) inputObservaciones.value = tratamiento.observaciones || '';

      editIndex = tratamientos.indexOf(tratamiento);
      const hdr = modal && modal.querySelector('h2'); if(hdr) hdr.textContent = 'Editar Tratamiento';
      if(btnGuardar) btnGuardar.textContent = 'Actualizar';
      
      // In edit mode: hide fields not allowed to edit (Estado, Frecuencia, Duración, Veterinario)
      try{
        if(selectAnimalTratamiento) selectAnimalTratamiento.disabled = true;
        if(selectReporteTratamiento) selectReporteTratamiento.disabled = true;
        if(selectMedicamentoTratamiento) selectMedicamentoTratamiento.disabled = true;
        if(inputFechaInicio) inputFechaInicio.disabled = true;
        if(inputFechaFin) inputFechaFin.disabled = true;
        if(inputDosis) inputDosis.disabled = true;
        if(inputUnidadDosis) inputUnidadDosis.disabled = true;
        if(selectVia) selectVia.disabled = true;
        if(inputObservaciones) inputObservaciones.disabled = true;
        const hideField = (el) => { try{ if(!el) return; el.style.display = 'none'; const lab = el.previousElementSibling; if(lab && lab.tagName === 'LABEL') lab.style.display = 'none'; }catch(e){} };
        hideField(inputVeterinario);
        hideField(selectEstado);
        // allow editing these
        if(inputNombreTratamiento) inputNombreTratamiento.disabled = false;
        if(inputEnfermedad) inputEnfermedad.disabled = false;
      }catch(e){ console.warn('error setting edit-mode state', e); }
      modal.style.display = 'flex';
    });

    // Eliminar con modal (si existe)
    const btnEliminarFila = fila.querySelector('.btn-eliminar');
    if (btnEliminarFila) {
      btnEliminarFila.addEventListener('click', () => { abrirModalEliminar(tratamiento); });
    }

    tbody.appendChild(fila);
  });

  tablaTratamientos.appendChild(tabla);
}

// Buscar tratamientos
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const resultados = tratamientos.filter(t =>
    t.numArete.toLowerCase().includes(texto) ||
    t.nombreTratamiento.toLowerCase().includes(texto) ||
    t.enfermedad.toLowerCase().includes(texto)
  );
  renderizarTratamientos(resultados);
});

// Cerrar modal con ESC o click fuera
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalElim = document.getElementById('modalEliminarTratamiento');
    if (modalElim && modalElim.classList.contains('active')) {
      cerrarModalEliminar();
    }
  }
});

window.addEventListener('click', (e) => {
  const modalElim = document.getElementById('modalEliminarTratamiento');
  if (e.target === modalElim) {
    cerrarModalEliminar();
  }
});

// Inicializar tabla
// Load reference lists and backend tratamientos on init
(async function init(){
  await Promise.all([fetchAnimales(), fetchReportes(), fetchMedicamentos(), fetchEnfermedades(), fetchTratamientosFromBackend()]);
})();

// ===================================
// EVENTOS PARA MOSTRAR CAMPOS "OTRO" EN MEDICAMENTO (si aplica)
// ===================================

// Badge de riesgo (si aplica en tratamiento)
function getBadgeClass(riesgo) {
  const clases = {
    'Leve': 'badge-leve',
    'Moderado': 'badge-moderado',
    'Grave': 'badge-grave',
    'Crítico': 'badge-critico'
  };
  return clases[riesgo] || 'badge-leve';
}

console.log('✅ Sistema de tratamientos cargado correctamente');