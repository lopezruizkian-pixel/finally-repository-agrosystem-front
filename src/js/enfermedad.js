// ===========================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ===========================

// Crear modal de alerta al cargar
const modalAlerta = document.createElement('div');
modalAlerta.classList.add('alerta-overlay');
modalAlerta.innerHTML = `
  <div class="alerta-container">
    <div class="alerta-header" id="alertaHeader">
      <i class="fas fa-info-circle alerta-icon" id="alertaIcon"></i>
      <h3 class="alerta-title" id="alertaTitle">Alerta</h3>
    </div>
    <div class="alerta-body">
      <p class="alerta-message" id="alertaMessage"></p>
    </div>
    <div class="alerta-footer">
      <button class="btn-alerta-ok" id="btnAlertaOk">Aceptar</button>
    </div>
  </div>
`;
document.body.appendChild(modalAlerta);

const alertaHeader = document.getElementById('alertaHeader');
const alertaIcon = document.getElementById('alertaIcon');
const alertaTitle = document.getElementById('alertaTitle');
const alertaMessage = document.getElementById('alertaMessage');
const btnAlertaOk = document.getElementById('btnAlertaOk');

function mostrarAlerta(mensaje, tipo = 'info') {
  // Configurar según el tipo de alerta
  alertaHeader.className = 'alerta-header ' + tipo;
  
  const config = {
    error: {
      icon: 'fa-exclamation-circle',
      title: 'Error'
    },
    success: {
      icon: 'fa-check-circle',
      title: 'Éxito'
    },
    warning: {
      icon: 'fa-exclamation-triangle',
      title: 'Advertencia'
    },
    info: {
      icon: 'fa-info-circle',
      title: 'Información'
    }
  };

  const tipoConfig = config[tipo] || config.info;
  alertaIcon.className = `fas ${tipoConfig.icon} alerta-icon`;
  alertaTitle.textContent = tipoConfig.title;
  alertaMessage.textContent = mensaje;
  
  modalAlerta.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarAlerta() {
  modalAlerta.classList.remove('active');
  document.body.style.overflow = 'auto';
}

btnAlertaOk.addEventListener('click', cerrarAlerta);

// Cerrar alerta con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalAlerta.classList.contains('active')) {
    cerrarAlerta();
  }
});

// ===========================
// CÓDIGO ORIGINAL CON ALERTAS PERSONALIZADAS
// ===========================

// Arreglo para almacenar enfermedades
let enfermedades = [];

// Selección de elementos
const modal = document.getElementById('modalAgregarEnfermedad');
const btnGuardar = document.getElementById('btnGuardarEnfermedad');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAgregar = document.querySelector('.btn-agregar');
const tablaEnfermedades = document.querySelector('.tabla-animales');
const inputNombre = document.getElementById('nombre');
const inputTipo = document.getElementById('tipo');
const inputSintomas = document.getElementById('sintomas');
const inputDuracion = document.getElementById('duracion');
const inputTratamientos = document.getElementById('tratamientos');
const selectRiesgo = document.getElementById('riesgo');
const inputTransmision = document.getElementById('transmision');
const buscador = document.querySelector('.buscador input');

// Modal de visualizar
const modalVisualizar = document.getElementById('modalVisualizarEnfermedad');
const contenidoEnfermedad = document.getElementById('contenidoEnfermedad');
const btnCerrarVisualizar = document.getElementById('btnCerrarVisualizar');

// Modal de eliminar
let enfermedadAEliminar = null;
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarEnfermedad';
modalEliminar.classList.add('modal-overlay');
modalEliminar.innerHTML = `
  <div class="modal-container">
    <div class="modal-header-custom">
      <h2 class="modal-title-custom">
        <i class="fas fa-trash-alt"></i> Eliminar Enfermedad
      </h2>
      <button onclick="cerrarModalEliminar()" class="btn-close-custom">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body-custom">
      <div class="modal-icon-warning" style="background-color: #f8d7da;">
        <i class="fas fa-exclamation-triangle" style="color: #721c24;"></i>
      </div>
      <p class="modal-message">¿Estás seguro de eliminar esta enfermedad?</p>
      <p class="modal-submessage" id="mensajeEliminarEnfermedad">
        Esta acción no se puede deshacer.
      </p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button onclick="confirmarEliminarEnfermedad()" class="btn-modal-confirmar">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

// helper headers (token + Id-Usuario)
async function getAuthHeaders(){
  const token = localStorage.getItem('token') || '';
  const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
  let idUsuarioHeader = '';
  if(datosUsuarioRaw){
    try{ const parsed = JSON.parse(datosUsuarioRaw); if(parsed && (parsed.idUsuario||parsed.id)) idUsuarioHeader = String(parsed.idUsuario||parsed.id); else if(parsed && parsed.usuario) idUsuarioHeader = String(parsed.usuario); }
    catch(e){ idUsuarioHeader = String(datosUsuarioRaw); }
  }
  return {
    'Content-Type': 'application/json',
    ...(token? { 'Authorization': `Bearer ${token}` } : {}),
    ...(idUsuarioHeader? { 'Id-Usuario': idUsuarioHeader } : {})
  };
}

// API integration: /enfermedades
async function fetchEnfermedadesFromBackend(){
  try{
    console.debug('GET /enfermedades');
    const res = await fetch('http://100.30.25.253:7000/enfermedades', { headers: await getAuthHeaders() });
    const text = await res.text(); if(!res.ok){ console.error('Error cargando enfermedades', res.status, text); mostrarAlerta('Error cargando enfermedades (ver consola)','error'); return; }
    const data = text? JSON.parse(text) : [];
    enfermedades = (data || []).map(e => ({
      idEnfermedad: e.idEnfermedad || e.id || null,
      nombre: e.nombreEnfermedad || e.nombre || '',
      tipo: e.tipoEnfermedad || e.tipo || '',
      sintomas: e.sintomas || '',
      duracion: e.duracionEstimada || e.duracion || e.duracion_estimada || '',
      tratamientos: e.tratamientosRecomendados || e.tratamientos || '',
      riesgo: e.nivelRiesgo || e.riesgo || '',
      transmision: e.modoTransmision || e.transmision || '',
      idMedicamento: e.idMedicamento || null,
      raw: e
    }));
    renderizarEnfermedades(enfermedades);
  }catch(err){ console.error(err); mostrarAlerta('Error comunicando con el servidor de enfermedades','error'); }
}

async function createEnfermedadBackend(payload){
  try{
    const headers = await getAuthHeaders();
    console.debug('POST /enfermedades payload', payload);
    const res = await fetch('http://100.30.25.253:7000/enfermedades', { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await res.text(); const body = text? (()=>{ try{return JSON.parse(text);}catch(e){return text;} })() : null;
    if(!res.ok){ console.error('POST /enfermedades error', res.status, body); mostrarAlerta('Error creando enfermedad (ver consola)','error'); return false; }
    mostrarAlerta('Enfermedad creada correctamente','success');
    await fetchEnfermedadesFromBackend();
    return true;
  }catch(e){ console.error(e); mostrarAlerta('Error creando enfermedad','error'); return false; }
}

async function updateEnfermedadBackend(idEnfermedad, payload){
  try{
    if(!idEnfermedad) throw new Error('Missing idEnfermedad');
    const headers = await getAuthHeaders();
    console.debug(`PUT /enfermedades/${idEnfermedad} payload`, payload);
    const res = await fetch(`http://100.30.25.253:7000/enfermedades/${idEnfermedad}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
    const text = await res.text(); const body = text? (()=>{ try{return JSON.parse(text);}catch(e){return text;} })() : null;
    if(!res.ok){ console.error('PUT /enfermedades error', res.status, body); mostrarAlerta('Error actualizando enfermedad (ver consola)','error'); return false; }
    mostrarAlerta('Enfermedad actualizada correctamente','success');
    await fetchEnfermedadesFromBackend();
    return true;
  }catch(e){ console.error(e); mostrarAlerta('Error actualizando enfermedad','error'); return false; }
}

async function deleteEnfermedadBackend(idEnfermedad){
  try{
    if(!idEnfermedad) throw new Error('Missing idEnfermedad');
    const headers = await getAuthHeaders();
    const res = await fetch(`http://100.30.25.253:7000/enfermedades/${idEnfermedad}`, { method: 'DELETE', headers });
    const text = await res.text(); const body = text? (()=>{ try{return JSON.parse(text);}catch(e){return text;} })() : null;
    if(!res.ok){ console.error('DELETE /enfermedades error', res.status, body); mostrarAlerta('Error eliminando enfermedad (ver consola)','error'); return false; }
    mostrarAlerta('Enfermedad eliminada correctamente','success');
    await fetchEnfermedadesFromBackend();
    return true;
  }catch(e){ console.error(e); mostrarAlerta('Error eliminando enfermedad','error'); return false; }
}

let editIndex = null;

// -------------------------
// ABRIR MODAL
// -------------------------
if (btnAgregar) {
  btnAgregar.addEventListener('click', () => {
    limpiarModal();
    modal.style.display = 'flex';
  });
}

// Role helpers: veterinario cannot CRUD on enfermedades
function getCurrentUserRole(){
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
  if(!datosStr) return '';
  try{ const d = JSON.parse(datosStr); return (d.rolNombre || (d.rol && (d.rol.nombre || (d.rol.idRol===1?'Administrador':''))) || d.rol || '').toString().toLowerCase(); }catch(e){ return String(datosStr).toLowerCase(); }
}
function isVeterinario(){ const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }
function isAdmin(){ const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }

// Quitar el botón agregar a admin (solo veterinario puede CRUD aquí)
if(isAdmin() && btnAgregar){ btnAgregar.style.display = 'none'; }

// Cerrar modal agregar/editar
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { 
  if (e.target === modal) modal.style.display = 'none'; 
});

// Cerrar modal visualizar
btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', (e) => { 
  if (e.target === modalVisualizar) modalVisualizar.style.display = 'none'; 
});

// -------------------------
// LIMPIAR MODAL
// -------------------------
function limpiarModal() {
  inputNombre.value = '';
  inputTipo.value = '';
  inputSintomas.value = '';
  inputDuracion.value = '';
  inputTratamientos.value = '';
  selectRiesgo.value = 'Leve';
  inputTransmision.value = '';
  editIndex = null;
}

// Badge de riesgo
function getBadgeClass(riesgo) {
  const clases = {
    'Leve': 'badge-leve',
    'Moderado': 'badge-moderado',
    'Grave': 'badge-grave',
    'Crítico': 'badge-critico'
  };
  return clases[riesgo] || 'badge-leve';
}

// -------------------------
// GUARDAR ENFERMEDAD
// -------------------------
btnGuardar.addEventListener('click', async () => {
  const nombre = inputNombre.value.trim();
  const tipo = inputTipo.value.trim();
  
  // VALIDACIÓN CON ALERTA PERSONALIZADA
  if (!nombre || !tipo) {
    mostrarAlerta('Por favor complete todos los campos obligatorios: Nombre y Tipo de la enfermedad.', 'error');
    return;
  }

  // Build payload according to API contract
  const payload = {
    nombreEnfermedad: nombre,
    tipoEnfermedad: tipo,
    sintomas: inputSintomas.value.trim() || undefined,
    duracionEstimada: inputDuracion.value ? Number(inputDuracion.value) : undefined,
    tratamientosRecomendados: inputTratamientos.value.trim() || undefined,
    nivelRiesgo: selectRiesgo.value || undefined,
    modoTransmision: inputTransmision.value.trim() || undefined,
    idMedicamento: null,
  };

  // Attempt to set idMedicamento if the raw object exists in current edit
  if(editIndex !== null){
    const existing = enfermedades[editIndex];
    if(existing && existing.idMedicamento) payload.idMedicamento = Number(existing.idMedicamento);
  }

  if(editIndex !== null){
    // Update
    const existing = enfermedades[editIndex];
    const idEnfermedad = existing && existing.idEnfermedad;
    if(!idEnfermedad){ mostrarAlerta('No se encontró id de enfermedad para actualizar','error'); return; }
    // Ensure payload includes idEnfermedad matching the route
    payload.idEnfermedad = Number(idEnfermedad);
    const ok = await updateEnfermedadBackend(idEnfermedad, payload);
    if(ok){ modal.style.display = 'none'; editIndex = null; }
  } else {
    // Create
    const ok = await createEnfermedadBackend(payload);
    if(ok){ modal.style.display = 'none'; }
  }
});

// -------------------------
// MODAL DE ELIMINAR
// -------------------------
function abrirModalEliminar(enfermedad) {
  enfermedadAEliminar = enfermedad;
  document.getElementById('mensajeEliminarEnfermedad').textContent =
    `Se eliminará la enfermedad "${enfermedad.nombre}".`;
  document.getElementById('modalEliminarEnfermedad').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
  document.getElementById('modalEliminarEnfermedad').classList.remove('active');
  document.body.style.overflow = 'auto';
  enfermedadAEliminar = null;
}

function confirmarEliminarEnfermedad() {
  (async ()=>{
    if(enfermedadAEliminar){
      const id = enfermedadAEliminar.idEnfermedad || (enfermedadAEliminar.raw && (enfermedadAEliminar.raw.idEnfermedad||enfermedadAEliminar.raw.id));
      if(id){
        const ok = await deleteEnfermedadBackend(id);
        if(ok) cerrarModalEliminar();
      } else {
        const nombreEnfermedad = enfermedadAEliminar.nombre;
        const idx = enfermedades.indexOf(enfermedadAEliminar);
        if(idx>-1) enfermedades.splice(idx,1);
        renderizarEnfermedades();
        cerrarModalEliminar();
        mostrarAlerta(`La enfermedad "${nombreEnfermedad}" ha sido eliminada exitosamente.`, 'success');
      }
    }
  })();
}

// -------------------------
// RENDERIZAR TABLA
// -------------------------
function renderizarEnfermedades(lista = enfermedades) {
  tablaEnfermedades.innerHTML = '';
  
  if (lista.length === 0) {
    tablaEnfermedades.innerHTML = '<p>No hay enfermedades registradas.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Tipo</th>
        <th>Riesgo</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabla.querySelector('tbody');
  lista.forEach(enfermedad => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${enfermedad.nombre}</td>
      <td>${enfermedad.tipo}</td>
      <td><span class="badge-riesgo ${getBadgeClass(enfermedad.riesgo)}">${enfermedad.riesgo}</span></td>
      <td>
        <button class="btn-ver"><i class="fas fa-eye" aria-hidden="true"></i></button>
        <button class="btn-editar"><i class="fas fa-pen" aria-hidden="true"></i></button>
        <button class="btn-eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>
      </td>
    `;

    // VISUALIZAR
    fila.querySelector('.btn-ver').addEventListener('click', () => {
      contenidoEnfermedad.innerHTML = `
        <div class="detalle-item"><strong>Nombre</strong><p>${enfermedad.nombre}</p></div>
        <div class="detalle-item"><strong>Tipo</strong><p>${enfermedad.tipo}</p></div>
        <div class="detalle-item"><strong>Síntomas</strong><p>${enfermedad.sintomas}</p></div>
        <div class="detalle-item"><strong>Duración estimada</strong><p>${enfermedad.duracion}</p></div>
        <div class="detalle-item"><strong>Tratamientos</strong><p>${enfermedad.tratamientos}</p></div>
        <div class="detalle-item"><strong>Riesgo</strong><p><span class="badge-riesgo ${getBadgeClass(enfermedad.riesgo)}">${enfermedad.riesgo}</span></p></div>
        <div class="detalle-item"><strong>Transmisión</strong><p>${enfermedad.transmision}</p></div>
      `;
      modalVisualizar.style.display = 'flex';
    });

    // EDITAR / ELIMINAR: ocultar a usuarios que no sean veterinario (admin pierde CRUD)
    if(!isVeterinario()){
      const be = fila.querySelector('.btn-editar'); if(be) be.style.display = 'none';
      const bd = fila.querySelector('.btn-eliminar'); if(bd) bd.style.display = 'none';
    }
    // Adjuntar listeners si existen los botones
    const be = fila.querySelector('.btn-editar'); if(be){
      be.addEventListener('click', () => {
        inputNombre.value = enfermedad.nombre;
        inputTipo.value = enfermedad.tipo;
        inputSintomas.value = enfermedad.sintomas;
        inputDuracion.value = enfermedad.duracion;
        inputTratamientos.value = enfermedad.tratamientos;
        selectRiesgo.value = enfermedad.riesgo;
        inputTransmision.value = enfermedad.transmision;
        editIndex = enfermedades.indexOf(enfermedad);
        modal.style.display = 'flex';
      });
    }
    const bd = fila.querySelector('.btn-eliminar'); if(bd){ bd.addEventListener('click', () => abrirModalEliminar(enfermedad)); }

    tbody.appendChild(fila);
  });

  tablaEnfermedades.appendChild(tabla);
}

// -------------------------
// BUSCADOR
// -------------------------
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const resultados = enfermedades.filter(e =>
    e.nombre.toLowerCase().includes(texto) ||
    e.tipo.toLowerCase().includes(texto)
  );
  renderizarEnfermedades(resultados);
});

// Inicializar tabla (cargar desde backend)
fetchEnfermedadesFromBackend();