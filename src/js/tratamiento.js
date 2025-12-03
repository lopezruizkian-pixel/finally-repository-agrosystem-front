// Arreglo para almacenar tratamientos
let tratamientos = [];
let animalesList = [];
let reportesList = [];
let medicamentosList = [];
let enfermedadesList = []; 

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

// Helper: normaliza fechas
function formatDateForInput(d){
  if(!d && d !== 0) return '';
  try{
    if(Array.isArray(d)){
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    if(typeof d === 'number'){
      const dt = new Date(d);
      return isNaN(dt) ? '' : dt.toISOString().slice(0,10);
    }
    if(typeof d === 'string'){
      const s = d.trim();
      if(/^\d+$/.test(s)){
        const dt = new Date(Number(s)); 
        return isNaN(dt) ? '' : dt.toISOString().slice(0,10);
      }
      const dt = new Date(s);
      if(!isNaN(dt)) return dt.toISOString().slice(0,10);
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
  let alertaOverlay = document.getElementById('alertaOverlay');
  if (!alertaOverlay) {
    alertaOverlay = document.createElement('div');
    alertaOverlay.id = 'alertaOverlay';
    alertaOverlay.className = 'alerta-overlay';
    document.body.appendChild(alertaOverlay);
  }

  const configuracion = {
    error: { icono: 'fa-exclamation-circle', titulo: 'Error', color: '#dc3545' },
    success: { icono: 'fa-check-circle', titulo: 'Éxito', color: '#28a745' },
    warning: { icono: 'fa-exclamation-circle', titulo: 'Error', color: '#ffc107' },
    info: { icono: 'fa-info-circle', titulo: 'Información', color: '#17a2b8' }
  };

  const config = configuracion[tipo] || configuracion.info;

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
  alertaOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarAlerta() {
  const alertaOverlay = document.getElementById('alertaOverlay');
  if (alertaOverlay) {
    alertaOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Headers helper
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

// Resolve username ID
async function resolveUsuarioId(usuarioString){
  if(!usuarioString) return null;
  try{
    const res = await fetch('http://192.168.1.17:7002/usuarios', { headers: await getAuthHeaders() });
    // Manejo seguro de respuesta vacía
    const text = await res.text();
    if(!res.ok) return null;
    const list = text ? JSON.parse(text) : [];
    
    const found = (list || []).find(u => { const uname = u.usuario || u.nombreUsuario || u.correo || ''; return String(uname).toLowerCase() === String(usuarioString).toLowerCase(); });
    return found ? (found.idUsuario || found.id) : null;
  }catch(e){ return null; }
}

// Role helpers
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try { const datos = JSON.parse(datosStr); return (datos.rolNombre || (datos.rol && (datos.rol.nombre || (datos.rol.idRol === 1 ? 'Administrador' : ''))) || datos.rol || '').toString().toLowerCase(); } catch(e){ return String(datosStr).toLowerCase(); }
}
// Try to extract numeric role id (1,2...) from stored user data
function getCurrentUserRoleId(){
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if(!datosStr) return null;
  try{
    const datos = JSON.parse(datosStr);
    if(!datos) return null;
    if(typeof datos.rol === 'number') return datos.rol;
    if(typeof datos.rol === 'string' && /^\d+$/.test(datos.rol)) return Number(datos.rol);
    if(typeof datos.rol === 'object'){
      if(typeof datos.rol.idRol === 'number') return datos.rol.idRol;
      if(typeof datos.rol.id === 'number') return datos.rol.id;
      if(typeof datos.rol.idRol === 'string' && /^\d+$/.test(datos.rol.idRol)) return Number(datos.rol.idRol);
      if(typeof datos.rol.id === 'string' && /^\d+$/.test(datos.rol.id)) return Number(datos.rol.id);
    }
    return null;
  }catch(e){ return null; }
}

function isVeterinario(){ const r = getCurrentUserRole(); const id = getCurrentUserRoleId(); return id === 2 || r.includes('veterinario') || r.includes('vet'); }
function isAdmin(){ const r = getCurrentUserRole(); const id = getCurrentUserRoleId(); return id === 1 || r.includes('admin') || r.includes('administrador'); }

// Fetch data functions (Animals, Reportes, Medicamentos, Enfermedades)
async function fetchEnfermedades(){
  try{
    const res = await fetch('http://192.168.1.17:7002/enfermedades', { headers: await getAuthHeaders() });
    if(res.ok) {
        const text = await res.text();
        enfermedadesList = text ? JSON.parse(text) : [];
        if(inputEnfermedad){
          inputEnfermedad.innerHTML = '<option value="">Seleccionar enfermedad...</option>';
          (enfermedadesList || []).forEach(e => {
            const o = document.createElement('option');
            o.value = e.nombreEnfermedad || e.nombre;
            o.textContent = `${o.value} (${e.tipoEnfermedad || e.tipo})`;
            inputEnfermedad.appendChild(o);
          });
        }
    }
  }catch(e){ console.error(e); }
}

async function fetchAnimales(){
  try{
    const res = await fetch('http://192.168.1.17:7002/animales', { headers: await getAuthHeaders() });
    if(res.ok){
        const text = await res.text();
        animalesList = text ? JSON.parse(text) : [];
        if(selectAnimalTratamiento){
          selectAnimalTratamiento.innerHTML = '<option value="">-- Seleccione un animal --</option>';
          (animalesList || []).forEach(a => {
            const id = a.idAnimal || a.id;
            const o = document.createElement('option'); o.value = id; o.textContent = `${a.nombreAnimal || a.nombre} (arete ${a.numArete})`; selectAnimalTratamiento.appendChild(o);
          });
        }
    }
  }catch(e){ console.error(e); }
}

async function fetchReportes(){
  try{
    const res = await fetch('http://192.168.1.17:7002/reportes', { headers: await getAuthHeaders() });
    if(res.ok){
        const text = await res.text();
        reportesList = text ? JSON.parse(text) : [];
        if(selectReporteTratamiento){
          selectReporteTratamiento.innerHTML = '<option value="">-- Seleccione un reporte (opcional) --</option>';
          (reportesList || []).forEach(r => {
            const id = r.idReporte || r.id;
            const fecha = Array.isArray(r.fecha)? r.fecha.join('-') : r.fecha || '';
            const o = document.createElement('option'); o.value = id; o.textContent = `#${id} - ${fecha}`; selectReporteTratamiento.appendChild(o);
          });
        }
    }
  }catch(e){ console.error(e); }
}

async function fetchMedicamentos(){
  try{
    const res = await fetch('http://192.168.1.17:7002/medicamento', { headers: await getAuthHeaders() });
    if(res.ok){
        const text = await res.text();
        medicamentosList = text ? JSON.parse(text) : [];
        if(selectMedicamentoTratamiento){
          selectMedicamentoTratamiento.innerHTML = '<option value="">-- Seleccione un medicamento --</option>';
          (medicamentosList || []).forEach(m => { 
              const id = m.idMedicamento || m.id; 
              const o = document.createElement('option'); o.value = id; o.textContent = m.nombreMedicamento || m.nombre; 
              selectMedicamentoTratamiento.appendChild(o); 
          });
        }
    }
  }catch(e){ console.error(e); }
}

// ⭐ CORRECCIÓN PRINCIPAL AQUÍ: Lectura segura del JSON
async function fetchTratamientosFromBackend(){
  try{
    const res = await fetch('http://192.168.1.17:7002/tratamientos', { headers: await getAuthHeaders() });
    if(res.ok){
        // Leemos como texto primero para evitar el error "Unexpected end of JSON input"
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        
        tratamientos = data.map(t => ({
          idTratamiento: t.idTratamiento || t.id,
          idAnimal: t.idAnimal, 
          idReporte: t.idReporte,
          idMedicamento: t.idMedicamento,
          nombreTratamiento: t.nombreTratamiento || t.nombre,
          fechaInicio: formatDateForInput(t.fechaInicio),
          fechaFin: formatDateForInput(t.fechaFinal),
          medicamentos: t.medicamentos,
          veterinario: t.veterinario,
          observaciones: t.observaciones,
          estado: t.estado,
          // Campos visuales derivados
          numArete: (t.idAnimal && t.idAnimal.numArete) ? String(t.idAnimal.numArete) : (t.numArete || 'N/A'),
          enfermedad: (t.idReporte && (t.idReporte.diagnosticoPresuntivo || t.idReporte.diagnosticoDefinitivo)) || 'N/A'
        }));
        renderizarTratamientos(tratamientos);
    }
  }catch(e){ console.error(e); }
}

// ===========================
// LOGICA DE GUARDADO
// ===========================
btnGuardar.addEventListener('click', () => {
  (async () => {
  const idAnimal = selectAnimalTratamiento.value;
  const nombreTratamiento = inputNombreTratamiento.value.trim();
  const fechaInicio = inputFechaInicio.value.trim();
  const fechaFin = inputFechaFin.value.trim();
  const idReporte = selectReporteTratamiento.value;
  const idMedicamento = selectMedicamentoTratamiento.value;
  const observaciones = inputObservaciones.value.trim();

  // Validaciones básicas
  if (!idAnimal || !nombreTratamiento || !fechaInicio) {
    mostrarAlerta('Complete los campos obligatorios: Animal, Nombre y Fecha Inicio', 'warning');
    return;
  }

  // Resolver usuario actual
  const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem');
  let idUsuario = null;
  if(datosUsuarioRaw){
     try { const p = JSON.parse(datosUsuarioRaw); idUsuario = p.idUsuario || p.id || p.usuario; } 
     catch(e) { idUsuario = datosUsuarioRaw; }
  }
  let finalUserId = await resolveUsuarioId(idUsuario);
  if(!finalUserId && !isNaN(Number(idUsuario))) finalUserId = Number(idUsuario);

  // CONSTRUCCIÓN DEL PAYLOAD PLANO (CORREGIDO ANTERIORMENTE)
  const payload = {
    idAnimal: Number(idAnimal),
    idReporte: idReporte ? Number(idReporte) : null,
    idUsuario: Number(finalUserId),
    nombreTratamiento: nombreTratamiento,
    fechaInicio: fechaInicio,
    fechaFinal: fechaFin || null,
    idMedicamento: idMedicamento ? Number(idMedicamento) : null,
    observaciones: observaciones || 'NADA'
  };

  console.log("Payload a enviar:", payload);

  try {
      let url = 'http://192.168.1.17:7002/tratamientos';
      let method = 'POST';
      
      if (editIndex !== null) {
          const idTratamiento = tratamientos[editIndex].idTratamiento;
          url += `/${idTratamiento}`;
          method = 'PUT';
          payload.idTratamiento = idTratamiento; 
      }

      const headers = await getAuthHeaders();
      if(finalUserId) headers['Id-Usuario'] = String(finalUserId);

      const res = await fetch(url, {
          method: method,
          headers: headers,
          body: JSON.stringify(payload)
      });

      if (res.ok) {
          mostrarAlerta(`Tratamiento ${editIndex !== null ? 'actualizado' : 'creado'} correctamente`, 'success');
          modal.style.display = 'none';
          fetchTratamientosFromBackend();
      } else {
          const txt = await res.text();
          console.error('Error servidor:', txt);
          mostrarAlerta('Error al guardar tratamiento', 'error');
      }
  } catch (err) {
      console.error(err);
      mostrarAlerta('Error de conexión', 'error');
  }

  })();
});

// Funciones de Modal Eliminar y Visualizar (similares a otros módulos)
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarTratamiento';
modalEliminar.classList.add('modal-overlay');
modalEliminar.innerHTML = `
  <div class="modal-container">
    <div class="modal-header-custom">
      <h2 class="modal-title-custom"><i class="fas fa-trash-alt"></i> Eliminar Tratamiento</h2>
      <button onclick="cerrarModalEliminar()" class="btn-close-custom"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body-custom">
      <p class="modal-message">¿Estás seguro de eliminar este tratamiento?</p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">Cancelar</button>
      <button onclick="confirmarEliminarTratamiento()" class="btn-modal-confirmar">Eliminar</button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

function abrirModalEliminar(tratamiento) {
  tratamientoAEliminar = tratamiento;
  document.getElementById('modalEliminarTratamiento').classList.add('active');
}
function cerrarModalEliminar() {
  document.getElementById('modalEliminarTratamiento').classList.remove('active');
}
async function confirmarEliminarTratamiento() {
   // Permission check: only veterinario (role 2) can delete
   if(!isVeterinario()){ mostrarAlerta('No tiene permisos para eliminar tratamientos', 'warning'); cerrarModalEliminar(); return; }
   if(tratamientoAEliminar && tratamientoAEliminar.idTratamiento) {
     try {
       const res = await fetch(`http://192.168.1.17:7002/tratamientos/${tratamientoAEliminar.idTratamiento}`, {
         method: 'DELETE', headers: await getAuthHeaders()
       });
       if(res.ok) {
         mostrarAlerta('Eliminado correctamente', 'success');
         fetchTratamientosFromBackend();
       } else { mostrarAlerta('Error al eliminar', 'error'); }
     } catch(e) { mostrarAlerta('Error de conexión', 'error'); }
   }
   cerrarModalEliminar();
}

// Renderizado
function renderizarTratamientos(lista) {
  tablaTratamientos.innerHTML = '';
  if (lista.length === 0) {
    tablaTratamientos.innerHTML = '<p>No hay tratamientos.</p>';
    return;
  }
  const tabla = document.createElement('table');
  tabla.innerHTML = `<thead><tr><th>Animal</th><th>Tratamiento</th><th>Inicio</th><th>Fin</th><th>Acciones</th></tr></thead><tbody></tbody>`;
  const tbody = tabla.querySelector('tbody');
  
  lista.forEach((t, index) => {
     const tr = document.createElement('tr');
     // Try to include animal name when available
     let animalLabel = t.numArete || 'N/A';
     try{
       const aid = (t.idAnimal && (t.idAnimal.idAnimal || t.idAnimal)) || null;
       const found = animalesList.find(a => (a.idAnimal || a.id) == aid);
       if(found){ const aName = found.nombreAnimal || found.nombre || ''; animalLabel = `${aName} (arete ${t.numArete || 'N/A'})`; }
     }catch(e){ /* ignore */ }

     tr.innerHTML = `
       <td>${animalLabel}</td>
       <td>${t.nombreTratamiento}</td>
       <td>${t.fechaInicio}</td>
       <td>${t.fechaFin || '-'}</td>
       <td>
         <button class="btn-ver"><i class="fas fa-eye"></i></button>
         ${isVeterinario() ? '<button class="btn-editar"><i class="fas fa-pen"></i></button><button class="btn-eliminar"><i class="fas fa-trash"></i></button>' : ''}
       </td>
     `;
     // Eventos
     tr.querySelector('.btn-ver').onclick = () => {
         contenidoTratamiento.innerHTML = `
            <p><strong>Animal:</strong> ${t.numArete}</p>
            <p><strong>Tratamiento:</strong> ${t.nombreTratamiento}</p>
            <p><strong>Observaciones:</strong> ${t.observaciones}</p>
         `;
         modalVisualizar.style.display = 'flex';
     };
     if(isVeterinario()){
         tr.querySelector('.btn-editar').onclick = () => {
             editIndex = index;
             // Pre-llenar formulario
             selectAnimalTratamiento.value = t.idAnimal && t.idAnimal.idAnimal ? t.idAnimal.idAnimal : (t.idAnimal || '');
             inputNombreTratamiento.value = t.nombreTratamiento;
             inputFechaInicio.value = t.fechaInicio;
             inputFechaFin.value = t.fechaFin;
             if(t.idReporte) selectReporteTratamiento.value = t.idReporte.idReporte || t.idReporte;
             if(t.idMedicamento) selectMedicamentoTratamiento.value = t.idMedicamento.idMedicamento || t.idMedicamento;
             inputObservaciones.value = t.observaciones;
             
             const hdr = modal.querySelector('h2'); if(hdr) hdr.textContent = 'Editar Tratamiento';
             modal.style.display = 'flex';
         };
         tr.querySelector('.btn-eliminar').onclick = () => abrirModalEliminar(t);
     }
     tbody.appendChild(tr);
  });
  tablaTratamientos.appendChild(tabla);
}

// Inicializar
// Control de visibilidad del botón Agregar según rol numérico
const _roleId_now = getCurrentUserRoleId();
if(_roleId_now === 1 && btnAgregar) { btnAgregar.style.display = 'none'; }
if(_roleId_now === 2 && btnAgregar) { btnAgregar.style.display = ''; }
if(btnAgregar) btnAgregar.onclick = () => { 
  if(!isVeterinario()){ mostrarAlerta('No tiene permisos para crear tratamientos', 'warning'); return; }
  editIndex = null; 
  // Limpiar form
  inputNombreTratamiento.value = ''; inputObservaciones.value = '';
  modal.style.display = 'flex'; 
};
if(btnCerrarModal) btnCerrarModal.onclick = () => modal.style.display = 'none';
if(btnCerrarVisualizar) btnCerrarVisualizar.onclick = () => modalVisualizar.style.display = 'none';

// Buscador: filtrar tratamientos por nombre de animal o número de arete
if(buscador){
  buscador.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim().toLowerCase();
    if(!q) { renderizarTratamientos(tratamientos); return; }
    const filtered = (tratamientos || []).filter(t => {
      const numArete = (t.numArete || '').toString().toLowerCase();
      let animalName = '';
      try{
        const aid = (t.idAnimal && (t.idAnimal.idAnimal || t.idAnimal)) || null;
        const found = (animalesList || []).find(a => (a.idAnimal || a.id) == aid);
        animalName = found ? (found.nombreAnimal || found.nombre || '') : '';
      }catch(e){ animalName = ''; }
      animalName = String(animalName).toLowerCase();
      return numArete.includes(q) || animalName.includes(q);
    });
    renderizarTratamientos(filtered);
  });
}

// Carga inicial
(async function init(){
  await Promise.all([fetchAnimales(), fetchReportes(), fetchMedicamentos(), fetchEnfermedades(), fetchTratamientosFromBackend()]);
})();