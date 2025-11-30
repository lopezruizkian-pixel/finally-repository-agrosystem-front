let medicamentos = [];

const modal = document.getElementById('modalMedicamento');
const btnGuardar = document.getElementById('btnGuardarMedicamento');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAgregar = document.querySelector('.btn-agregar');
const tablaMedicamentos = document.querySelector('.tabla-medicamentos');
const buscador = document.querySelector('.buscador input');

const inputNombre = document.getElementById('nombre');
const inputFormaFarmaceutica = document.getElementById('formaFarmaceutica');
const inputFormaFarmaceuticaOtro = document.getElementById('formaFarmaceuticaOtro');
const inputContenido = document.getElementById('contenido');
const inputContenidoOtro = document.getElementById('contenidoOtro');
const inputUnidadDosis = document.getElementById('unidadDosis');
const inputValorDosis = document.getElementById('valorDosis');
const inputVia = document.getElementById('via');
const inputViaOtra = document.getElementById('viaOtra');
const inputComposicion = document.getElementById('composicion');
const inputCaducidad = document.getElementById('caducidad');
const inputFrecuencia = document.getElementById('frecuencia');
const inputDuracion = document.getElementById('duracion');
const inputIndicaciones = document.getElementById('indicaciones');

// Modal de visualización
const modalVisualizar = document.getElementById('modalVisualizarMedicamento');
const contenidoMedicamento = document.getElementById('contenidoMedicamento');
const btnCerrarVisualizar = document.getElementById('btnCerrarVisualizar');

let editIndex = null;
let medicamentoAEliminar = null;
let isLoading = false;

// Rol helpers
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try { const datos = JSON.parse(datosStr); return (datos.rolNombre || (datos.rol && (datos.rol.nombre || (datos.rol.idRol === 1 ? 'Administrador' : ''))) || datos.rol || '').toString().toLowerCase(); } catch(e){ return String(datosStr).toLowerCase(); }
}
function isVeterinario(){ const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }
function isAdmin(){ const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }

// ===================================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ===================================
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

// ===================================
// MODAL DE ELIMINAR (estructura estandarizada igual a animales)
// ===================================
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarMedicamento';
modalEliminar.classList.add('modal-overlay');
modalEliminar.innerHTML = `
  <div class="modal-container">
    <div class="modal-header-custom">
      <h2 class="modal-title-custom">
        <i class="fas fa-trash-alt"></i> Eliminar Medicamento
      </h2>
      <button onclick="cerrarModalEliminar()" class="btn-close-custom">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body-custom">
      <div class="modal-icon-warning" style="background-color: #f8d7da;">
        <i class="fas fa-exclamation-triangle" style="color: #721c24;"></i>
      </div>
      <p class="modal-message">¿Estás seguro de eliminar este medicamento?</p>
      <p class="modal-submessage" id="mensajeEliminarMedicamento">Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button onclick="confirmarEliminarMedicamento()" class="btn-modal-confirmar">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

// ===================================
// FUNCIONES DEL MODAL DE ELIMINAR
// ===================================
function abrirModalEliminar(medicamento) {
  medicamentoAEliminar = medicamento;
  const nombreMostrar = medicamento.nombre || medicamento.nombreMedicamento || 'sin nombre';
  document.getElementById('mensajeEliminarMedicamento').textContent = 
    `Se eliminará el medicamento "${nombreMostrar}".`;
  modalEliminar.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
  modalEliminar.classList.remove('active');
  document.body.style.overflow = 'auto';
  medicamentoAEliminar = null;
}

function confirmarEliminarMedicamento() {
  if (medicamentoAEliminar) {
    const id = medicamentoAEliminar.idMedicamento || medicamentoAEliminar.id;
    cerrarModalEliminar();
    deleteMedicamentoBackend(id);
  }
}

// El modal de eliminar usa atributos onclick en sus botones (cerrarModalEliminar / confirmarEliminarMedicamento)
// por lo que no es necesario añadir event listeners aquí.

// ===================================
// FUNCIONES PRINCIPALES
// ===================================

// Abrir modal
if (btnAgregar) {
  btnAgregar.addEventListener('click', () => {
    limpiarModal();
    modal.style.display = 'flex';
  });
}

// Mostrar acciones CRUD sólo para admin en medicamentos
if (!isAdmin() && btnAgregar) {
  btnAgregar.style.display = 'none';
}

// Cerrar modal agregar/editar
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { 
  if(e.target === modal) modal.style.display = 'none'; 
});

// Cerrar modal visualizar
btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', e => { 
  if(e.target === modalVisualizar) modalVisualizar.style.display = 'none'; 
});

// Limpiar modal
function limpiarModal() {
  inputNombre.value = '';
  inputFormaFarmaceutica.value = '';
  inputFormaFarmaceuticaOtro.value = '';
  inputFormaFarmaceuticaOtro.style.display = 'none';
  inputContenido.value = '';
  inputContenidoOtro.value = '';
  inputContenidoOtro.style.display = 'none';
  inputUnidadDosis.value = '';
  inputValorDosis.value = '';
  inputVia.value = '';
  inputViaOtra.value = '';
  inputViaOtra.style.display = 'none';
  inputComposicion.value = '';
  inputCaducidad.value = '';
  inputFrecuencia.value = '';
  inputDuracion.value = '';
  inputIndicaciones.value = '';
  editIndex = null;
}

// Guardar medicamento (agregar o editar)
btnGuardar.addEventListener('click', async () => {
  const nombre = inputNombre.value.trim();
  
  // Presentación: forma + contenido
  const formaFarmaceutica = inputFormaFarmaceutica.value === 'otro' 
    ? inputFormaFarmaceuticaOtro.value.trim() 
    : inputFormaFarmaceutica.value;
  const contenido = inputContenido.value === 'otro' 
    ? inputContenidoOtro.value.trim() 
    : inputContenido.value;
  const presentacion = `${formaFarmaceutica} - ${contenido}`;

  // Dosis: unidad + valor
  const unidadDosis = inputUnidadDosis.value;
  const valorDosis = inputValorDosis.value.trim();
  const dosis = `${valorDosis} ${unidadDosis}`;

  // Vía
  const via = inputVia.value === 'otra' 
    ? inputViaOtra.value.trim() 
    : inputVia.value;

  // Composición
  const composicion = inputComposicion.value;

  // Caducidad
  const caducidad = inputCaducidad.value;

  // Frecuencia + Duración
  const frecuencia = inputFrecuencia.value;
  const duracion = inputDuracion.value;
  const frecuenciaCompleta = `${frecuencia} - ${duracion}`;

  // Indicaciones
  const indicaciones = inputIndicaciones.value.trim();

  console.debug('medicamento form values:', { nombre, presentacion, dosis, via, composicion, caducidad, frecuenciaCompleta, indicaciones });

  if(!nombre || !formaFarmaceutica || !contenido || !unidadDosis || !valorDosis || !via || !composicion || !caducidad || !frecuencia || !duracion) {
    mostrarAlerta('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }

  // Crear objeto con todos los datos
  const medData = { 
    nombre,
    presentacion,
    dosis,
    via,
    composicion,
    caducidad,
    frecuenciaCompleta,
    indicaciones
  };

  modal.style.display = 'none';

  try {
    if(editIndex !== null){
      // Update existing
      const id = medicamentos[editIndex].idMedicamento || medicamentos[editIndex].id;
      await updateMedicamentoBackend(medData, id);
    } else {
      // Create new
      await sendMedicamentoToBackend(medData);
    }
  } catch (err) {
    console.error(err);
    const mensaje = err && err.message ? err.message : 'Ocurrió un error en la operación con el servidor.';
    mostrarAlerta(mensaje, 'error');
  }
});

// Renderizar tabla de medicamentos
function renderizarMedicamentos(lista = medicamentos){
  tablaMedicamentos.innerHTML = '';

  if(lista.length === 0){
    tablaMedicamentos.innerHTML = '<p>No hay medicamentos registrados.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Presentación</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = tabla.querySelector('tbody');

  lista.forEach((med) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${med.nombre || med.nombreMedicamento || ''}</td>
      <td>${med.presentacion || med.solucion || ''}</td>
      <td>
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
        <button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button>
        <button class="btn-eliminar" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>
      </td>
    `;

    // Visualizar
    fila.querySelector('.btn-ver').addEventListener('click', () => {
      contenidoMedicamento.innerHTML = `
        <div class="detalle-item">
          <strong>Nombre</strong>
          <p>${med.nombre || med.nombreMedicamento || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Presentación</strong>
          <p>${med.presentacion || med.solucion || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Dosis</strong>
          <p>${med.dosis ?? 'No especificada'}</p>
        </div>
        <div class="detalle-item">
          <strong>Vía de Administración</strong>
          <p>${med.via || med.viaAdministracion || 'No especificada'}</p>
        </div>
        <div class="detalle-item">
          <strong>Composición</strong>
          <p>${med.composicion || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Caducidad</strong>
          <p>${med.caducidad || (med.caducidadMs ? new Date(med.caducidadMs).toLocaleDateString() : 'No especificada')}</p>
        </div>
        <div class="detalle-item">
          <strong>Frecuencia de Aplicación</strong>
          <p>${med.frecuenciaCompleta || med.frecuencia || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Indicaciones</strong>
          <p>${med.indicaciones || ''}</p>
        </div>
      `;
      modalVisualizar.style.display = 'flex';
    });

    // Editar / Eliminar según rol
    if (!isAdmin()) {
      const be = fila.querySelector('.btn-editar'); if (be) be.style.display = 'none';
      const bd = fila.querySelector('.btn-eliminar'); if (bd) bd.style.display = 'none';
    } else {
      const beEl = fila.querySelector('.btn-editar');
      if (beEl) beEl.addEventListener('click', () => {
        inputNombre.value = med.nombre || med.nombreMedicamento || '';
        inputFormaFarmaceutica.value = '';
        inputContenido.value = '';
        inputUnidadDosis.value = '';
        inputValorDosis.value = med.dosis ? med.dosis.split(' ')[0] : '';
        inputVia.value = med.via || med.viaAdministracion || '';
        inputComposicion.value = med.composicion || '';
        inputCaducidad.value = med.caducidad || (med.caducidadMs ? new Date(med.caducidadMs).toISOString().slice(0,10) : '');
        inputFrecuencia.value = '';
        inputDuracion.value = '';
        inputIndicaciones.value = med.indicaciones || '';
        editIndex = medicamentos.indexOf(med);
        modal.style.display = 'flex';
      });
      const bdEl = fila.querySelector('.btn-eliminar'); if (bdEl) bdEl.addEventListener('click', () => { abrirModalEliminar(med); });
    }

    tbody.appendChild(fila);
  });

  tablaMedicamentos.appendChild(tabla);
}

// Buscar medicamentos
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const resultados = medicamentos.filter(m =>
    m.nombre.toLowerCase().includes(texto) ||
    m.presentacion.toLowerCase().includes(texto)
  );
  renderizarMedicamentos(resultados);
});

// Cerrar modales con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalAlerta.classList.contains('active')) {
      cerrarAlerta();
    }
    if (modalEliminar.classList.contains('active')) {
      cerrarModalEliminar();
    }
  }
});

// Cerrar modal de eliminar con click fuera
window.addEventListener('click', (e) => {
  if (e.target === modalEliminar) {
    cerrarModalEliminar();
  }
  if (e.target === modalAlerta) {
    cerrarAlerta();
  }
});

// ---------------------------
// Helpers y funciones de red
// ---------------------------

function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const datosUsuario = localStorage.getItem('datosUsuarioAgroSystem') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(datosUsuario ? { 'Id-Usuario': datosUsuario } : {})
  };
}

function formatDateToISO(dateStr) {
  if(!dateStr) return null;
  const parts = dateStr.split('-');
  let iso = '';
  if(parts.length === 3){
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    iso = new Date(Date.UTC(y, m, d)).toISOString();
  } else {
    iso = new Date(dateStr).toISOString();
  }
  // Remove milliseconds to match server example: 2026-01-01T00:00:00Z
  return iso.replace('.000','');
}

function msToDateInput(ms) {
  if(!ms) return '';
  try{
    return new Date(Number(ms)).toISOString().slice(0,10);
  }catch(e){
    return '';
  }
}

async function fetchMedicamentosFromBackend(){
  try{
    console.debug('GET /medicamento — iniciando petición');
    const res = await fetch('http://100.30.25.253:7000/medicamento', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if(!res.ok) throw new Error(`GET medicamentos: ${res.status}`);
    const data = await res.json();
    console.debug('GET /medicamento response', data);
    medicamentos = (data || []).map(item => ({
      idMedicamento: item.idMedicamento,
      nombre: item.nombreMedicamento,
      nombreMedicamento: item.nombreMedicamento,
      presentacion: item.solucion,
      solucion: item.solucion,
      dosis: item.dosis,
      caducidadMs: item.caducidad,
      caducidad: item.caducidad ? msToDateInput(item.caducidad) : '',
      via: item.viaAdministracion,
      viaAdministracion: item.viaAdministracion,
      composicion: item.composicion,
      indicaciones: item.indicaciones,
      frecuencia: item.frecuenciaAplicacion,
      frecuenciaAplicacion: item.frecuenciaAplicacion
    }));
    renderizarMedicamentos();
  }catch(err){
    console.error(err);
    mostrarAlerta('No se pudieron cargar los medicamentos desde el servidor.', 'error');
  }
}

async function sendMedicamentoToBackend(med){
  // Validate required fields according to API
  const nombreMedicamento = med.nombre;
  const solucion = med.presentacion || med.solucion;
  const dosis = med.dosis !== undefined && med.dosis !== '' ? Number(med.dosis) : null;
  const caducidad = med.caducidad ? formatDateToISO(med.caducidad) : null;
  const viaAdministracion = med.via;
  const composicion = med.composicion;
  const indicaciones = med.indicaciones;
  const frecuenciaAplicacion = med.frecuencia || med.frecuenciaAplicacion;

  const missing = [];
  if(!nombreMedicamento) missing.push('nombreMedicamento');
  if(!solucion) missing.push('solucion');
  if(dosis === null || Number.isNaN(dosis)) missing.push('dosis');
  if(!caducidad) missing.push('caducidad');
  if(!viaAdministracion) missing.push('viaAdministracion');
  if(!composicion) missing.push('composicion');
  if(!indicaciones) missing.push('indicaciones');
  if(!frecuenciaAplicacion) missing.push('frecuenciaAplicacion');
  if(missing.length){
    const msg = `Faltan campos requeridos: ${missing.join(', ')}`;
    console.debug('sendMedicamentoToBackend - med object:', med);
    console.warn(msg);
    mostrarAlerta(msg, 'error');
    throw new Error(msg);
  }

  const payload = {
    nombreMedicamento,
    solucion,
    dosis,
    caducidad,
    viaAdministracion,
    composicion,
    indicaciones,
    frecuenciaAplicacion
  };

  console.debug('POST /medicamento payload', payload);
  const res = await fetch('http://100.30.25.253:7000/medicamento', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  let created;
  try{
    const text = await res.text();
    try{ created = JSON.parse(text); } catch(e){ created = text; }
  }catch(e){ created = null; }
  if(!res.ok){
    console.error('POST /medicamento error response', created);
    throw new Error(`POST medicamento: ${res.status} - ${JSON.stringify(created)}`);
  }
  console.debug('POST /medicamento response', created);
  const mapped = {
    idMedicamento: created.idMedicamento || created.id || null,
    nombre: created.nombreMedicamento || payload.nombreMedicamento,
    presentacion: created.solucion || payload.solucion,
    dosis: created.dosis ?? payload.dosis,
    caducidadMs: created.caducidad ?? null,
    caducidad: created.caducidad ? msToDateInput(created.caducidad) : (payload.caducidad ? med.caducidad : ''),
    via: created.viaAdministracion || payload.viaAdministracion,
    composicion: created.composicion || payload.composicion,
    indicaciones: created.indicaciones || payload.indicaciones,
    frecuencia: created.frecuenciaAplicacion || payload.frecuenciaAplicacion
  };
  medicamentos.push(mapped);
  renderizarMedicamentos();
  mostrarAlerta(`El medicamento "${mapped.nombre}" ha sido registrado exitosamente.`, 'success');
}

async function updateMedicamentoBackend(med, id){
  if(!id) throw new Error('ID requerido para actualizar medicamento');
  const payload = {
    idMedicamento: id,
    nombreMedicamento: med.nombre,
    solucion: med.presentacion,
    dosis: med.dosis ? Number(med.dosis) : null,
    caducidad: med.caducidad ? formatDateToISO(med.caducidad) : null,
    viaAdministracion: med.via,
    composicion: med.composicion,
    indicaciones: med.indicaciones,
    frecuenciaAplicacion: med.frecuencia || med.frecuenciaAplicacion
  };
  console.debug(`PUT /medicamento/${id} payload`, payload);
  const res = await fetch(`http://100.30.25.253:7000/medicamento/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error(`PUT medicamento: ${res.status}`);
  const updated = await res.json();
  console.debug(`PUT /medicamento/${id} response`, updated);
  const idx = medicamentos.findIndex(m => (m.idMedicamento || m.id) === id);
  const mapped = {
    idMedicamento: updated.idMedicamento || id,
    nombre: updated.nombreMedicamento || payload.nombreMedicamento,
    presentacion: updated.solucion || payload.solucion,
    dosis: updated.dosis ?? payload.dosis,
    caducidadMs: updated.caducidad ?? null,
    caducidad: updated.caducidad ? msToDateInput(updated.caducidad) : (payload.caducidad ? med.caducidad : ''),
    via: updated.viaAdministracion || payload.viaAdministracion,
    composicion: updated.composicion || payload.composicion,
    indicaciones: updated.indicaciones || payload.indicaciones,
    frecuencia: updated.frecuenciaAplicacion || payload.frecuenciaAplicacion
  };
  if(idx !== -1) medicamentos[idx] = mapped;
  renderizarMedicamentos();
  mostrarAlerta(`El medicamento "${mapped.nombre}" ha sido actualizado exitosamente.`, 'success');
}

async function deleteMedicamentoBackend(id){
  if(!id) return;
  try{
    console.debug(`DELETE /medicamento/${id}`);
    const res = await fetch(`http://100.30.25.253:7000/medicamento/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if(!res.ok) throw new Error(`DELETE medicamento: ${res.status}`);
    const idx = medicamentos.findIndex(m => (m.idMedicamento || m.id) === id);
    const nombre = idx !== -1 ? (medicamentos[idx].nombre || medicamentos[idx].nombreMedicamento) : '';
    if(idx !== -1) medicamentos.splice(idx,1);
    renderizarMedicamentos();
    mostrarAlerta(`El medicamento "${nombre}" ha sido eliminado exitosamente.`, 'success');
  }catch(err){
    console.error(err);
    mostrarAlerta('No se pudo eliminar el medicamento en el servidor.', 'error');
  }
}

// Cargar inicialmente desde backend
fetchMedicamentosFromBackend();

console.log('✅ Sistema de medicamentos cargado correctamente');

// ===================================
// EVENTOS PARA MOSTRAR CAMPOS "OTRO"
// ===================================

// Forma Farmacéutica - mostrar input de "otro"
inputFormaFarmaceutica.addEventListener('change', () => {
  if (inputFormaFarmaceutica.value === 'otro') {
    inputFormaFarmaceuticaOtro.style.display = 'block';
  } else {
    inputFormaFarmaceuticaOtro.style.display = 'none';
    inputFormaFarmaceuticaOtro.value = '';
  }
});

// Contenido - mostrar input de "otro"
inputContenido.addEventListener('change', () => {
  if (inputContenido.value === 'otro') {
    inputContenidoOtro.style.display = 'block';
  } else {
    inputContenidoOtro.style.display = 'none';
    inputContenidoOtro.value = '';
  }
});

// Vía - mostrar input de "otra"
inputVia.addEventListener('change', () => {
  if (inputVia.value === 'otra') {
    inputViaOtra.style.display = 'block';
  } else {
    inputViaOtra.style.display = 'none';
    inputViaOtra.value = '';
  }
});