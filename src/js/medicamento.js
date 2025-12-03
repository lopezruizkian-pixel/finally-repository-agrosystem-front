// Arreglo para almacenar medicamentos
let medicamentos = [];

// Selección de elementos
const modal = document.getElementById('modalMedicamento');
const btnGuardar = document.getElementById('btnGuardarMedicamento');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAgregar = document.querySelector('.btn-agregar');
const tablaMedicamentos = document.querySelector('.tabla-medicamentos');
const buscador = document.querySelector('.buscador input');

// Inputs del formulario
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

// ===================================
// ROLES Y PERMISOS
// ===================================
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try {
    const datos = JSON.parse(datosStr);
    let role = datos.rolNombre || (datos.rol && datos.rol.nombre) || datos.rol || '';
    
    if (datos.rol && datos.rol.idRol) {
        if (datos.rol.idRol === 1) return 'administrador';
        if (datos.rol.idRol === 2) return 'veterinario';
        return String(datos.rol.nombre || '').toLowerCase();
    }
    
    if (role === 1 || role === '1') return 'administrador';
    if (role === 2 || role === '2') return 'veterinario';

    return String(role).toLowerCase();
  } catch (e) {
    return String(datosStr).toLowerCase();
  }
}

function isVeterinario() { 
    const r = getCurrentUserRole(); 
    return r.includes('veterinario') || r.includes('vet'); 
}

function isAdmin() { 
    const r = getCurrentUserRole(); 
    return r.includes('admin') || r.includes('administrador'); 
}

// ===================================
// SISTEMA DE ALERTAS
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
  alertaHeader.className = 'alerta-header ' + tipo;
  
  const config = {
    error: { icon: 'fa-exclamation-circle', title: 'Error' },
    success: { icon: 'fa-check-circle', title: 'Éxito' },
    warning: { icon: 'fa-exclamation-triangle', title: 'Advertencia' },
    info: { icon: 'fa-info-circle', title: 'Información' }
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
// MODAL DE ELIMINAR
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

// ⭐ VALIDACIÓN DE PERMISOS: Ocultar botón Agregar si NO es Admin
if (!isAdmin() && btnAgregar) {
  btnAgregar.style.display = 'none';
}

// Cerrar modales
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { 
  if(e.target === modal) modal.style.display = 'none'; 
});

btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', e => { 
  if(e.target === modalVisualizar) modalVisualizar.style.display = 'none'; 
});

// Limpiar modal
function limpiarModal() {
  if(inputNombre) inputNombre.value = '';
  // Verificaciones de seguridad para evitar el error de "set properties of null"
  if(inputFormaFarmaceutica) inputFormaFarmaceutica.value = '';
  if(inputFormaFarmaceuticaOtro) {
      inputFormaFarmaceuticaOtro.value = '';
      inputFormaFarmaceuticaOtro.style.display = 'none';
  }
  if(inputContenido) inputContenido.value = '';
  if(inputContenidoOtro) {
      inputContenidoOtro.value = '';
      inputContenidoOtro.style.display = 'none';
  }
  if(inputUnidadDosis) inputUnidadDosis.value = '';
  if(inputValorDosis) inputValorDosis.value = '';
  if(inputVia) inputVia.value = '';
  if(inputViaOtra) {
      inputViaOtra.value = '';
      inputViaOtra.style.display = 'none';
  }
  if(inputComposicion) inputComposicion.value = '';
  if(inputCaducidad) inputCaducidad.value = '';
  if(inputFrecuencia) inputFrecuencia.value = '';
  if(inputDuracion) inputDuracion.value = '';
  if(inputIndicaciones) inputIndicaciones.value = '';
  
  editIndex = null;
}

// Guardar medicamento
btnGuardar.addEventListener('click', async () => {
  const nombre = inputNombre.value.trim();
  
  // Safe access to inputs
  const formaFarmaceutica = (inputFormaFarmaceutica && inputFormaFarmaceutica.value === 'otro')
    ? (inputFormaFarmaceuticaOtro ? inputFormaFarmaceuticaOtro.value.trim() : '')
    : (inputFormaFarmaceutica ? inputFormaFarmaceutica.value : '');

  const contenido = (inputContenido && inputContenido.value === 'otro')
    ? (inputContenidoOtro ? inputContenidoOtro.value.trim() : '')
    : (inputContenido ? inputContenido.value : '');

  const presentacion = `${formaFarmaceutica} - ${contenido}`;

  const unidadDosis = inputUnidadDosis ? inputUnidadDosis.value : '';
  const valorDosis = inputValorDosis ? inputValorDosis.value.trim() : '';
  const dosis = `${valorDosis} ${unidadDosis}`;

  const via = (inputVia && inputVia.value === 'otra')
    ? (inputViaOtra ? inputViaOtra.value.trim() : '')
    : (inputVia ? inputVia.value : '');

  const composicion = inputComposicion ? inputComposicion.value : '';
  const caducidad = inputCaducidad ? inputCaducidad.value : '';
  const frecuencia = inputFrecuencia ? inputFrecuencia.value : '';
  const duracion = inputDuracion ? inputDuracion.value : '';
  const frecuenciaCompleta = `${frecuencia} - ${duracion}`;
  const indicaciones = inputIndicaciones ? inputIndicaciones.value.trim() : '';

  if(!nombre) {
    mostrarAlerta('El nombre es obligatorio.', 'error');
    return;
  }

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
      const id = medicamentos[editIndex].idMedicamento || medicamentos[editIndex].id;
      await updateMedicamentoBackend(medData, id);
    } else {
      await sendMedicamentoToBackend(medData);
    }
  } catch (err) {
    console.error(err);
    mostrarAlerta(err.message || 'Error en la operación.', 'error');
  }
});

// Renderizar tabla
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
    
    // Botones disponibles solo para Admin
    const isUserAdmin = isAdmin();
    const botonesHTML = isUserAdmin ? `
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
        <button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button>
        <button class="btn-eliminar" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>
    ` : `
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
    `;

    fila.innerHTML = `
      <td>${med.nombre || med.nombreMedicamento || ''}</td>
      <td>${med.presentacion || med.solucion || ''}</td>
      <td>
        ${botonesHTML}
      </td>
    `;

    // Visualizar
    fila.querySelector('.btn-ver').addEventListener('click', () => {
      contenidoMedicamento.innerHTML = `
        <div class="detalle-item"><strong>Nombre</strong><p>${med.nombre || med.nombreMedicamento || ''}</p></div>
        <div class="detalle-item"><strong>Presentación</strong><p>${med.presentacion || med.solucion || ''}</p></div>
        <div class="detalle-item"><strong>Dosis</strong><p>${med.dosis ?? 'No especificada'}</p></div>
        <div class="detalle-item"><strong>Vía de Administración</strong><p>${med.via || med.viaAdministracion || 'No especificada'}</p></div>
        <div class="detalle-item"><strong>Composición</strong><p>${med.composicion || ''}</p></div>
        <div class="detalle-item"><strong>Caducidad</strong><p>${med.caducidad || (med.caducidadMs ? new Date(med.caducidadMs).toLocaleDateString() : 'No especificada')}</p></div>
        <div class="detalle-item"><strong>Frecuencia de Aplicación</strong><p>${med.frecuenciaCompleta || med.frecuencia || ''}</p></div>
        <div class="detalle-item"><strong>Indicaciones</strong><p>${med.indicaciones || ''}</p></div>
      `;
      modalVisualizar.style.display = 'flex';
    });

    // Editar (solo si existe botón)
    const btnEdit = fila.querySelector('.btn-editar');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        inputNombre.value = med.nombre || med.nombreMedicamento || '';
        if(inputFormaFarmaceutica) inputFormaFarmaceutica.value = '';
        if(inputContenido) inputContenido.value = '';
        if(inputUnidadDosis) inputUnidadDosis.value = '';
        if(inputValorDosis) inputValorDosis.value = med.dosis ? String(med.dosis).split(' ')[0] : '';
        if(inputVia) inputVia.value = med.via || med.viaAdministracion || '';
        if(inputComposicion) inputComposicion.value = med.composicion || '';
        if(inputCaducidad) inputCaducidad.value = med.caducidad || (med.caducidadMs ? new Date(med.caducidadMs).toISOString().slice(0,10) : '');
        if(inputFrecuencia) inputFrecuencia.value = '';
        if(inputDuracion) inputDuracion.value = '';
        if(inputIndicaciones) inputIndicaciones.value = med.indicaciones || '';
        editIndex = medicamentos.indexOf(med);
        
        // Cambiar título
        const tModal = modal.querySelector('h2');
        if(tModal) tModal.textContent = 'Editar Medicamento';
        
        modal.style.display = 'flex';
      });
    }
    
    // Eliminar (solo si existe botón)
    const btnEliminar = fila.querySelector('.btn-eliminar');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => { abrirModalEliminar(med); });
    }

    tbody.appendChild(fila);
  });

  tablaMedicamentos.appendChild(tabla);
}

// Buscar
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const resultados = medicamentos.filter(m =>
    (m.nombre || '').toLowerCase().includes(texto) ||
    (m.presentacion || '').toLowerCase().includes(texto)
  );
  renderizarMedicamentos(resultados);
});

// Cerrar modales con ESC y Click
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalAlerta.classList.contains('active')) cerrarAlerta();
    if (modalEliminar.classList.contains('active')) cerrarModalEliminar();
  }
});

window.addEventListener('click', (e) => {
  if (e.target === modalEliminar) cerrarModalEliminar();
  if (e.target === modalAlerta) cerrarAlerta();
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
  return iso.replace('.000','');
}

function msToDateInput(ms) {
  if(!ms) return '';
  try{ return new Date(Number(ms)).toISOString().slice(0,10); }catch(e){ return ''; }
}

async function fetchMedicamentosFromBackend(){
  try{
    const res = await fetch('http://192.168.1.17:7002/medicamento', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if(!res.ok) throw new Error(`GET medicamentos: ${res.status}`);
    const data = await res.json();
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
    mostrarAlerta('No se pudieron cargar los medicamentos.', 'error');
  }
}

async function sendMedicamentoToBackend(med){
  const nombreMedicamento = med.nombre;
  const solucion = med.presentacion;
  const dosis = med.dosis !== undefined && med.dosis !== '' ? Number(med.dosis.split(' ')[0]) : null;
  const caducidad = med.caducidad ? formatDateToISO(med.caducidad) : null;
  const viaAdministracion = med.via;
  const composicion = med.composicion;
  const indicaciones = med.indicaciones;
  const frecuenciaAplicacion = med.frecuenciaCompleta;

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

  const res = await fetch('http://192.168.1.17:7002/medicamento', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  
  if(!res.ok){
    throw new Error(`POST medicamento: ${res.status}`);
  }
  
  await fetchMedicamentosFromBackend();
  mostrarAlerta(`Medicamento registrado exitosamente.`, 'success');
}

async function updateMedicamentoBackend(med, id){
  if(!id) throw new Error('ID requerido para actualizar medicamento');
  const dosisVal = med.dosis ? Number(String(med.dosis).split(' ')[0]) : null;
  
  const payload = {
    idMedicamento: id,
    nombreMedicamento: med.nombre,
    solucion: med.presentacion,
    dosis: isNaN(dosisVal) ? null : dosisVal,
    caducidad: med.caducidad ? formatDateToISO(med.caducidad) : null,
    viaAdministracion: med.via,
    composicion: med.composicion,
    indicaciones: med.indicaciones,
    frecuenciaAplicacion: med.frecuenciaCompleta
  };
  
  const res = await fetch(`http://192.168.1.17:7002/medicamento/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  
  if(!res.ok) throw new Error(`PUT medicamento: ${res.status}`);
  
  await fetchMedicamentosFromBackend();
  mostrarAlerta(`Medicamento actualizado exitosamente.`, 'success');
}

async function deleteMedicamentoBackend(id){
  if(!id) return;
  try{
    const res = await fetch(`http://192.168.1.17:7002/medicamento/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if(!res.ok) throw new Error(`DELETE medicamento: ${res.status}`);
    
    await fetchMedicamentosFromBackend();
    mostrarAlerta(`Medicamento eliminado exitosamente.`, 'success');
  }catch(err){
    console.error(err);
    mostrarAlerta('No se pudo eliminar el medicamento.', 'error');
  }
}

fetchMedicamentosFromBackend();

// ===================================
// EVENTOS PARA MOSTRAR CAMPOS "OTRO"
// ===================================
if(inputFormaFarmaceutica){
    inputFormaFarmaceutica.addEventListener('change', () => {
      if (inputFormaFarmaceutica.value === 'otro') {
        inputFormaFarmaceuticaOtro.style.display = 'block';
      } else {
        inputFormaFarmaceuticaOtro.style.display = 'none';
        inputFormaFarmaceuticaOtro.value = '';
      }
    });
}

if(inputContenido){
    inputContenido.addEventListener('change', () => {
      if (inputContenido.value === 'otro') {
        inputContenidoOtro.style.display = 'block';
      } else {
        inputContenidoOtro.style.display = 'none';
        inputContenidoOtro.value = '';
      }
    });
}

if(inputVia){
    inputVia.addEventListener('change', () => {
      if (inputVia.value === 'otra') {
        inputViaOtra.style.display = 'block';
      } else {
        inputViaOtra.style.display = 'none';
        inputViaOtra.value = '';
      }
    });
}