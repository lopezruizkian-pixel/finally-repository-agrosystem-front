// =====================
// SISTEMA DE ALERTAS PERSONALIZADAS
// =====================
function mostrarAlerta(tipo, titulo, mensaje) {
    const overlay = document.createElement("div");
    overlay.classList.add("alerta-overlay", "active");

    overlay.innerHTML = `
        <div class="alerta-container">
            <div class="alerta-header ${tipo}">
                <span class="alerta-icon">⚠️</span>
                <h3 class="alerta-title">${titulo}</h3>
            </div>
            <div class="alerta-body">
                <p class="alerta-message">${mensaje}</p>
            </div>
            <div class="alerta-footer">
                <button class="btn-alerta-ok">Aceptar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".btn-alerta-ok").addEventListener("click", () => {
        overlay.remove();
    });
}

// Mostrar confirmación con botones Sí / No. Devuelve Promise<boolean>.
function mostrarConfirmacion(titulo, mensaje) {
    return new Promise(resolve => {
        // build a modal matching the animals' delete modal style
        const overlay = document.createElement('div');
        overlay.classList.add('modal-overlay', 'active');
        overlay.id = 'modalConfirmacionTemp';
        overlay.innerHTML = `
            <div class="modal-container">
              <div class="modal-header-custom">
                <h2 class="modal-title-custom"><i class="fas fa-exclamation-triangle"></i> ${titulo}</h2>
                <button class="btn-close-custom" id="_closeConfirmTemp"><i class="fas fa-times"></i></button>
              </div>
              <div class="modal-body-custom">
                <div class="modal-icon-warning" style="background-color: #fff3cd;">
                  <i class="fas fa-exclamation-circle" style="color: #856404;"></i>
                </div>
                <p class="modal-message">${mensaje}</p>
              </div>
              <div class="modal-footer-custom">
                <button class="btn-modal-cancelar" id="_confirmNo">No</button>
                <button class="btn-modal-confirmar" id="_confirmYes">Sí</button>
              </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const cleanup = () => {
            const el = document.getElementById('modalConfirmacionTemp');
            if (el && el.parentNode) el.parentNode.removeChild(el);
            document.body.style.overflow = 'auto';
        };

        const yes = document.getElementById('_confirmYes');
        const no = document.getElementById('_confirmNo');
        const close = document.getElementById('_closeConfirmTemp');

        const onYes = () => { cleanup(); resolve(true); };
        const onNo = () => { cleanup(); resolve(false); };

        if (yes) yes.addEventListener('click', onYes);
        if (no) no.addEventListener('click', onNo);
        if (close) close.addEventListener('click', onNo);

        // close on ESC
        const escHandler = (e) => { if (e.key === 'Escape') { onNo(); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        // clicking outside
        overlay.addEventListener('click', (e) => { if (e.target === overlay) onNo(); });
    });
}



// =====================
// VARIABLES
// =====================
const btnAgregar = document.querySelector(".btn-agregar");
const modalAgregar = document.getElementById("modalAgregarReporte");
const modalVisualizar = document.getElementById("modalVisualizarReporte");

const btnCerrarAgregar = document.getElementById("btnCerrarModal");
const btnCerrarVisualizar = document.getElementById("btnCerrarVisualizar");
const btnGuardar = document.getElementById("btnGuardarReporte");

const tabla = document.querySelector(".tabla-animales");

// selects y elementos nuevos
const selectAnimalReporte = document.getElementById('selectAnimalReporte');
const selectTratamiento = document.getElementById('tratamiento');
const selectMedicamentos = document.getElementById('medicamentos');

// helper headers
async function getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    // prefer sessionStorage for user session data, fallback to localStorage
    const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
    let idUsuarioHeader = '';
    if (datosUsuarioRaw) {
        try {
            const parsed = JSON.parse(datosUsuarioRaw);
            // prefer numeric id fields if available
            if (parsed && (parsed.idUsuario || parsed.id)) {
                idUsuarioHeader = String(parsed.idUsuario || parsed.id);
            } else if (parsed && parsed.usuario) {
                // fallback to username string if no numeric id
                idUsuarioHeader = String(parsed.usuario);
            }
        } catch (e) {
            // raw string stored
            idUsuarioHeader = String(datosUsuarioRaw);
        }
    }
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(idUsuarioHeader ? { 'Id-Usuario': idUsuarioHeader } : {})
    };
}

// Role helpers
function getCurrentUserRole() {
    const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
    if (!datosStr) return '';
    try { const d = JSON.parse(datosStr); return (d.rolNombre || (d.rol && (d.rol.nombre || (d.rol.idRol===1?'Administrador':''))) || d.rol || '').toString().toLowerCase(); } catch(e){ return String(datosStr).toLowerCase(); }
}
function isAdmin(){ const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }
function isVeterinario(){ const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }

// Fetch animales to populate select
async function fetchAnimalesForSelect(){
    try{
        console.debug('GET /animales for select');
        const res = await fetch('http://192.168.1.17:7002/animales', { headers: await getAuthHeaders() });
        const text = await res.text();
        if(!res.ok){ console.error('Error cargando animales', res.status, text); return; }
        let data = [];
        if(text){ try{ data = JSON.parse(text); }catch(e){ console.warn('fetchAnimalesForSelect: not JSON', text); return; } }
        if(selectAnimalReporte){
            selectAnimalReporte.innerHTML = '<option value="">-- Seleccione un animal --</option>';
            (data || []).forEach(a => {
                const id = a.idAnimal || a.id;
                const name = a.nombreAnimal || a.nombre || `Animal ${id}`;
                const o = document.createElement('option');
                o.value = id;
                o.textContent = `${name} (arete ${a.numArete || ''})`;
                selectAnimalReporte.appendChild(o);
            });
        }
    }catch(err){ console.error(err); }
}

// ===================================
// FETCH TRATAMIENTOS PARA SELECT
// ===================================
async function fetchTratamientosForSelect(){
    try{
        console.debug('GET /tratamientos for select');
        const res = await fetch('http://192.168.1.17:7002/tratamientos', { headers: await getAuthHeaders() });
        const text = await res.text();
        if(!res.ok){ console.error('Error cargando tratamientos', res.status, text); return; }
        let data = [];
        if(text){ try{ data = JSON.parse(text); }catch(e){ console.warn('fetchTratamientosForSelect: not JSON', text); return; } }
        if(selectTratamiento){
            selectTratamiento.innerHTML = '<option value="">-- Seleccione un tratamiento --</option>';
            (data || []).forEach(t => {
                const id = t.idTratamiento || t.id;
                const nombre = t.nombreTratamiento || t.nombre || `Tratamiento ${id}`;
                const o = document.createElement('option');
                o.value = nombre;
                o.textContent = nombre;
                selectTratamiento.appendChild(o);
            });
        }
    }catch(err){ console.error(err); }
}

// ===================================
// FETCH MEDICAMENTOS PARA SELECT
// ===================================
async function fetchMedicamentosForSelect(){
    try{
        console.debug('GET /medicamento for select');
        const res = await fetch('http://192.168.1.17:7002/medicamento', { headers: await getAuthHeaders() });
        const text = await res.text();
        if(!res.ok){ console.error('Error cargando medicamentos', res.status, text); return; }
        let data = [];
        if(text){ try{ data = JSON.parse(text); }catch(e){ console.warn('fetchMedicamentosForSelect: not JSON', text); return; } }
        if(selectMedicamentos){
            selectMedicamentos.innerHTML = '<option value="">-- Seleccione un medicamento --</option>';
            (data || []).forEach(m => {
                const id = m.idMedicamento || m.id;
                const nombre = m.nombreMedicamento || m.nombre || `Medicamento ${id}`;
                const o = document.createElement('option');
                o.value = nombre;
                o.textContent = nombre;
                selectMedicamentos.appendChild(o);
            });
        }
    }catch(err){ console.error(err); }
}

// Fetch reportes from backend
async function fetchReportes(){
    try{
        console.debug('GET /reportes');
        const res = await fetch('http://192.168.1.17:7002/reportes', { headers: await getAuthHeaders() });
        const text = await res.text();
        if(!res.ok){ console.error('Error cargando reportes', res.status, text); return; }
        let data = [];
        if(text){ try{ data = JSON.parse(text); }catch(e){ console.warn('fetchReportes: not JSON', text); return; } }
        console.debug('GET /reportes response', data);
        // map into local reportes array
        reportes = (data || []).map(item => ({
            idReporte: item.idReporte || item.id,
            idAnimales: item.idAnimales,
            idUsuario: item.idUsuario,
            temperatura: item.temperatura,
            condicionCorporal: item.condicionCorporal,
            veterinario: item.veterinario || item.nombreVeterinario || '',
            frecuenciaRespiratoria: item.frecuenciaRespiratoria,
            fecha: Array.isArray(item.fecha) ? item.fecha.join('-') : item.fecha,
            diagnosticoPresuntivo: item.diagnosticoPresuntivo,
            diagnosticoDefinitivo: item.diagnosticoDefinitivo,
            sintomas: item.sintomas || item.sintomasObservados || '',
            tratamiento: item.tratamiento || item.tratamientoAplicado || '',
            medicamentos: item.medicamentos || '',
            observaciones: item.observaciones || ''
        }));
        mostrarTabla();
    }catch(err){ console.error(err); }
}

// Send POST to create reporte
async function sendReporteToBackend(payload, idUsuarioHeaderOverride){
    try{
        console.debug('POST /reportes payload', payload);
        const baseHeaders = await getAuthHeaders();
        // override Id-Usuario header if caller resolved a numeric id
        if(idUsuarioHeaderOverride){
            baseHeaders['Id-Usuario'] = String(idUsuarioHeaderOverride);
        }
        const res = await fetch('http://192.168.1.17:7002/reportes', {
            method: 'POST',
            headers: baseHeaders,
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        let created = null;
        if(text){ try{ created = JSON.parse(text); }catch(e){ created = text; } }
        if(!res.ok){ console.error('POST /reportes error', res.status, created); mostrarAlerta('warning','Error','No se pudo crear el reporte.'); return; }
        console.debug('POST /reportes response', created);
        mostrarAlerta('success','Creado','Reporte médico creado correctamente.');
        if(modalAgregar) modalAgregar.style.display = 'none';
        // refresh
        fetchReportes();
    }catch(err){ console.error(err); mostrarAlerta('warning','Error','Error creando reporte'); }
}

// Update existing reporte via PUT /reportes/{id}
async function updateReporteBackend(payload, id, idUsuarioHeaderOverride){
    try{
        if(!id) throw new Error('Missing id for update');
        // ensure payload contains idReporte matching route
        payload.idReporte = Number(id);
        console.debug(`PUT /reportes/${id} payload`, payload);
        const baseHeaders = await getAuthHeaders();
        if(idUsuarioHeaderOverride){ baseHeaders['Id-Usuario'] = String(idUsuarioHeaderOverride); }
        const res = await fetch(`http://192.168.1.17:7002/reportes/${id}`, {
            method: 'PUT',
            headers: baseHeaders,
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        let updated = null;
        if(text){ try{ updated = JSON.parse(text); }catch(e){ updated = text; } }
        if(!res.ok){ console.error('PUT /reportes error', res.status, updated); mostrarAlerta('warning','Error','No se pudo actualizar el reporte.'); return; }
        console.debug('PUT /reportes response', updated);
        mostrarAlerta('success','Actualizado','Reporte médico actualizado correctamente.');
        if(modalAgregar) modalAgregar.style.display = 'none';
        currentEditingId = null;
        // restore modal title/button
        const hdr = modalAgregar && modalAgregar.querySelector('h2'); if(hdr) hdr.textContent = 'Agregar Reporte Médico';
        if(btnGuardar) btnGuardar.textContent = 'Guardar';
        // refresh
        fetchReportes();
    }catch(err){ console.error(err); mostrarAlerta('warning','Error','Error actualizando reporte'); }
}

// Try to resolve a username/string to numeric user id by querying /usuarios
async function resolveUsuarioId(usuarioString){
    if(!usuarioString) return null;
    try{
        console.debug('Resolving usuario id for', usuarioString);
        const res = await fetch('http://192.168.1.17:7002/usuarios', { headers: await getAuthHeaders() });
        const text = await res.text();
        if(!res.ok){ console.warn('Could not fetch usuarios to resolve id', res.status, text); return null; }
        let list = [];
        if(text){ try{ list = JSON.parse(text); }catch(e){ console.warn('resolveUsuarioId: usuarios response not JSON', text); return null; } }
        // try to find by 'usuario' or 'nombreUsuario' or 'correo'
        const found = (list || []).find(u => {
            const uname = u.usuario || u.nombreUsuario || u.correo || '';
            return String(uname).toLowerCase() === String(usuarioString).toLowerCase();
        });
        if(found){
            return found.idUsuario || found.id || null;
        }
        return null;
    }catch(e){ console.error(e); return null; }
}

// Reportes almacenados
let reportes = [];

// Para identificar si estamos editando
let editIndex = -1;
// id del reporte que estamos editando (null cuando es nuevo)
let currentEditingId = null;


// =====================
// ABRIR MODAL AGREGAR
// =====================
if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
        // refrescar lista de animales, tratamientos y medicamentos antes de abrir
        fetchAnimalesForSelect();
        fetchTratamientosForSelect();
        fetchMedicamentosForSelect();
        modalAgregar.style.display = "flex";
        limpiarCampos();
        editIndex = -1; 
    });
}
// Ocultar crear para admin (solo veterinario puede crear aquí)
if (isAdmin() && btnAgregar) {
    btnAgregar.style.display = 'none';
}


// =====================
// CERRAR MODAL AGREGAR
// =====================
btnCerrarAgregar.addEventListener("click", () => {
    modalAgregar.style.display = "none";
    currentEditingId = null;
    const hdr = modalAgregar && modalAgregar.querySelector('h2'); if(hdr) hdr.textContent = 'Agregar Reporte Médico';
    if(btnGuardar) btnGuardar.textContent = 'Guardar';
});

// =====================
// CERRAR MODAL VISUALIZAR
// =====================
btnCerrarVisualizar.addEventListener("click", () => {
    modalVisualizar.style.display = "none";
});

// =====================
// FUNCIONES HELPER PARA CHECKBOXES
// ===================================

// Obtener valores seleccionados de checkboxes
function getCheckboxValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

// Establecer checkboxes según un array de valores
function setCheckboxValues(name, values) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(cb => {
    cb.checked = values && values.includes(cb.value);
  });
}

// ===================================
// GUARDAR (AGREGAR O EDITAR) - ACTUALIZADO
// ===================================
btnGuardar.addEventListener("click", async () => {
    // Construir payload para backend
    const selectedAnimal = selectAnimalReporte ? selectAnimalReporte.value : '';
    const fecha = document.getElementById("fecha").value;
    const temperatura = document.getElementById("temperatura").value; // Ahora es select
    const condicionCorporal = document.getElementById("condicionCorporal").value; // Ahora es select
    const frecuenciaRespiratoria = document.getElementById("frecuenciaRespiratoria").value; // Ahora es select
    
    // Obtener síntomas como array de checkboxes
    const sintomasArray = getCheckboxValues('sintomas');
    const sintomas = sintomasArray.join(', ');
    
    const diagnosticoPresuntivo = document.getElementById("diagnosticoPresuntivo").value;
    const diagnosticoDefinitivo = document.getElementById("diagnosticoDefinitivo").value;

    if(!selectedAnimal || !fecha || !temperatura || !condicionCorporal || !frecuenciaRespiratoria || sintomasArray.length === 0){
        mostrarAlerta('warning','Campos incompletos','Seleccione un animal, fecha, temperatura, condición corporal, frecuencia respiratoria y al menos un síntoma.');
        return;
    }

    // obtener idUsuario desde sessionStorage (preferido) o localStorage
    const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
    let idUsuario = null;
    if(datosUsuarioRaw){
        try{
            const parsed = JSON.parse(datosUsuarioRaw);
            if(parsed && (parsed.idUsuario || parsed.id)) idUsuario = parsed.idUsuario || parsed.id;
            else if(parsed && parsed.usuario) idUsuario = parsed.usuario;
        }catch(e){
            idUsuario = datosUsuarioRaw;
        }
    }
    const idUsuarioForPayload = (!isNaN(Number(idUsuario)) && idUsuario !== null) ? Number(idUsuario) : idUsuario || 0;
    console.debug('Using idUsuario for payload/header:', idUsuarioForPayload);

    const payload = {
        idAnimales: { idAnimal: Number(selectedAnimal) },
        idUsuario: { idUsuario: idUsuarioForPayload },
        temperatura: temperatura, // Mantener como string (categoría)
        condicionCorporal: condicionCorporal, // Mantener como string
        frecuenciaRespiratoria: frecuenciaRespiratoria, // Mantener como string (categoría)
        fecha: fecha,
        diagnosticoPresuntivo: diagnosticoPresuntivo || '',
        diagnosticoDefinitivo: diagnosticoDefinitivo || ''
    };

    let resolvedIdForHeader = null;
    if(typeof idUsuarioForPayload === 'number' && idUsuarioForPayload > 0){
        resolvedIdForHeader = idUsuarioForPayload;
    } else if(typeof idUsuarioForPayload === 'string' && idUsuarioForPayload.trim()){ 
        const resolved = await resolveUsuarioId(idUsuarioForPayload);
        if(resolved){
            resolvedIdForHeader = resolved;
            payload.idUsuario.idUsuario = resolved;
        }
    }

    if(!resolvedIdForHeader){
        mostrarAlerta('warning','Usuario no válido','No se pudo determinar un id de usuario numérico.');
        return;
    }

    if(currentEditingId){
        await updateReporteBackend(payload, currentEditingId, resolvedIdForHeader);
    } else {
        await sendReporteToBackend(payload, resolvedIdForHeader);
    }
});

// =====================
// MOSTRAR TABLA
// =====================
function mostrarTabla() {
        if (reportes.length === 0) {
                tabla.innerHTML = "<p>No hay reportes registrados.</p>";
                return;
        }

        let html = `
            <table border="1" class="tabla-estilo">
                <tr>
                    <th>Arete</th>
                    <th>Nombre</th>
                    <th>Fecha</th>
                    <th>Temperatura</th>
                    <th>Acciones</th>
                </tr>
        `;

        reportes.forEach((r, index) => {
                const arete = (r.idAnimales && (r.idAnimales.numArete || r.idAnimales.numArete === 0)) ? r.idAnimales.numArete : '';
                const nombre = (r.idAnimales && (r.idAnimales.nombreAnimal || r.idAnimales.nombre)) ? (r.idAnimales.nombreAnimal || r.idAnimales.nombre) : '';
                html += `
                <tr>
                    <td>${arete}</td>
                    <td>${nombre}</td>
                    <td>${r.fecha}</td>
                    <td>${r.temperatura}</td>
                        <td>
                        <button onclick="verReporte(${index})"><i class="fas fa-eye" aria-hidden="true"></i></button>
                        ${ isVeterinario() ? `<button onclick="editarReporte(${index})"><i class="fas fa-pen" aria-hidden="true"></i></button><button onclick="eliminarReporte(${index})"><i class="fas fa-trash" aria-hidden="true"></i></button>` : '' }
                    </td>
                </tr>
            `;
        });

        html += "</table>";
        tabla.innerHTML = html;
}


// =====================
// VISUALIZAR REPORTE
// =====================
function verReporte(i) {
        const r = reportes[i];
        const anim = r.idAnimales || {};
                const contenido = `
                <div class="detalle-item">
                    <strong>Arete</strong>
                    <p>${anim.numArete || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Nombre</strong>
                    <p>${anim.nombreAnimal || anim.nombre || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Fecha</strong>
                    <p>${r.fecha || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Temperatura</strong>
                    <p>${r.temperatura || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Condición Corporal</strong>
                    <p>${r.condicionCorporal || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Frecuencia Respiratoria</strong>
                    <p>${r.frecuenciaRespiratoria || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Síntomas Observados</strong>
                    <p>${r.sintomas || r.sintomasObservados || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Diagnóstico Presuntivo</strong>
                    <p>${r.diagnosticoPresuntivo || ''}</p>
                </div>
                <div class="detalle-item">
                    <strong>Diagnóstico Definitivo</strong>
                    <p>${r.diagnosticoDefinitivo || ''}</p>
                </div>
                `;

                const cont = document.getElementById("contenidoReporte");
                if (cont) cont.innerHTML = contenido;
                if (modalVisualizar) modalVisualizar.style.display = "flex";
}


// =====================
// EDITAR REPORTE - ACTUALIZADO
// =====================
function editarReporte(i) {
    const r = reportes[i];
    editIndex = i;
    currentEditingId = r.idReporte || null;
    if(selectAnimalReporte && r.idAnimales && (r.idAnimales.idAnimal || r.idAnimales.id)){
        selectAnimalReporte.value = r.idAnimales.idAnimal || r.idAnimales.id;
    }
    const hdr = modalAgregar && modalAgregar.querySelector('h2'); 
    if(hdr) hdr.textContent = 'Editar Reporte Médico';
    if(btnGuardar) btnGuardar.textContent = 'Actualizar';
    if(document.getElementById("fecha")) document.getElementById("fecha").value = r.fecha || '';
    if(document.getElementById("temperatura")) document.getElementById("temperatura").value = r.temperatura || '';
    if(document.getElementById("condicionCorporal")) document.getElementById("condicionCorporal").value = r.condicionCorporal || '';
    if(document.getElementById("frecuenciaRespiratoria")) document.getElementById("frecuenciaRespiratoria").value = r.frecuenciaRespiratoria || '';
    
    const sintomasArray = r.sintomas || r.sintomasObservados
      ? (r.sintomas || r.sintomasObservados).split(',').map(s => s.trim())
      : [];
    setCheckboxValues('sintomas', sintomasArray);
    
    if(document.getElementById("veterinario")) document.getElementById("veterinario").value = r.veterinario || '';
    if(document.getElementById("diagnosticoPresuntivo")) document.getElementById("diagnosticoPresuntivo").value = r.diagnosticoPresuntivo || '';
    if(document.getElementById("diagnosticoDefinitivo")) document.getElementById("diagnosticoDefinitivo").value = r.diagnosticoDefinitivo || '';
    // CAMBIO: setear select de tratamiento
    if(selectTratamiento) selectTratamiento.value = r.tratamiento || '';
    // CAMBIO: setear select de medicamentos
    if(selectMedicamentos) selectMedicamentos.value = r.medicamentos || '';
    if(document.getElementById("observaciones")) document.getElementById("observaciones").value = r.observaciones || '';
    if(modalAgregar) modalAgregar.style.display = "flex";
}


// =====================
// ELIMINAR REPORTE
// =====================
async function eliminarReporte(i) {
    // Abrir modal de confirmación persistente (se maneja en confirmarEliminarReporte)
    const r = reportes[i];
    if(!r){ mostrarAlerta('warning','Error','Reporte no encontrado'); return; }
    reporteAEliminarIndex = i;
    abrirModalEliminarReporte(r);
}

// =====================
// MODAL PERSISTENTE DE ELIMINAR (Reporte Médico)
// =====================
let reporteAEliminarIndex = null;
// crear modal una sola vez
if (!document.getElementById('modalEliminarReporte')) {
    const modalEliminar = document.createElement('div');
    modalEliminar.id = 'modalEliminarReporte';
    modalEliminar.classList.add('modal-overlay');
    modalEliminar.innerHTML = `
      <div class="modal-container">
        <div class="modal-header-custom">
          <h2 class="modal-title-custom"><i class="fas fa-trash-alt"></i> Eliminar reporte</h2>
          <button class="btn-close-custom" id="_closeEliminarReporte"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body-custom">
          <div class="modal-icon-warning" style="background-color: #f8d7da;">
            <i class="fas fa-exclamation-triangle" style="color: #721c24;"></i>
          </div>
          <p class="modal-message">¿Estás seguro de eliminar este reporte?</p>
          <p class="modal-submessage" id="mensajeEliminarReporte">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer-custom">
          <button class="btn-modal-cancelar" id="btnCancelarEliminarReporte"><i class="fas fa-times"></i> Cancelar</button>
          <button class="btn-modal-confirmar" id="btnConfirmarEliminarReporte"><i class="fas fa-trash-alt"></i> Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEliminar);

    // handlers
    document.getElementById('_closeEliminarReporte').addEventListener('click', cerrarModalEliminarReporte);
    document.getElementById('btnCancelarEliminarReporte').addEventListener('click', cerrarModalEliminarReporte);
    document.getElementById('btnConfirmarEliminarReporte').addEventListener('click', confirmarEliminarReporte);

    // cerrar con ESC
    document.addEventListener('keydown', (e) => {
      const el = document.getElementById('modalEliminarReporte');
      if (e.key === 'Escape' && el && el.classList.contains('active')) cerrarModalEliminarReporte();
    });

    // click fuera para cerrar
    document.getElementById('modalEliminarReporte').addEventListener('click', (e) => {
      if (e.target && e.target.id === 'modalEliminarReporte') cerrarModalEliminarReporte();
    });
}

function abrirModalEliminarReporte(reporte) {
    const el = document.getElementById('modalEliminarReporte');
    if (!el) return;
    const mensajeEl = document.getElementById('mensajeEliminarReporte');
    if (mensajeEl) {
        const arete = (reporte.idAnimales && (reporte.idAnimales.numArete || reporte.idAnimales.numArete === 0)) ? reporte.idAnimales.numArete : '';
        const nombre = (reporte.idAnimales && (reporte.idAnimales.nombreAnimal || reporte.idAnimales.nombre)) ? (reporte.idAnimales.nombreAnimal || reporte.idAnimales.nombre) : '';
        mensajeEl.textContent = `Se eliminará el reporte de ${nombre} (Arete: ${arete}). Esta acción no se puede deshacer.`;
    }
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModalEliminarReporte() {
    const el = document.getElementById('modalEliminarReporte');
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = 'auto';
    reporteAEliminarIndex = null;
}

async function confirmarEliminarReporte() {
    const i = reporteAEliminarIndex;
    if (i === null || typeof i === 'undefined') { cerrarModalEliminarReporte(); return; }
    const r = reportes[i];
    if(!r){ mostrarAlerta('warning','Error','Reporte no encontrado'); cerrarModalEliminarReporte(); return; }

    // Obtener idUsuario válido para header (preferir numérico)
    const datosUsuarioRaw = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
    let idUsuario = null;
    if(datosUsuarioRaw){
        try{
            const parsed = JSON.parse(datosUsuarioRaw);
            if(parsed && (parsed.idUsuario || parsed.id)) idUsuario = parsed.idUsuario || parsed.id;
            else if(parsed && parsed.usuario) idUsuario = parsed.usuario; // may be username
        }catch(e){ idUsuario = datosUsuarioRaw; }
    }

    let resolvedIdForHeader = null;
    if(typeof idUsuario === 'number' && idUsuario > 0) resolvedIdForHeader = idUsuario;
    else if(typeof idUsuario === 'string' && idUsuario.trim()){
        const resolved = await resolveUsuarioId(idUsuario);
        if(resolved) resolvedIdForHeader = resolved;
    }

    if(!resolvedIdForHeader){
        mostrarAlerta('warning','Usuario no válido','No se pudo determinar un id de usuario numérico para realizar la eliminación.');
        cerrarModalEliminarReporte();
        return;
    }

    try{
        const headers = await getAuthHeaders();
        // override Id-Usuario header con id numérico resuelto
        headers['Id-Usuario'] = String(resolvedIdForHeader);
        console.debug(`DELETE /reportes/${r.idReporte}`, { headers });
        const res = await fetch(`http://192.168.1.17:7002/reportes/${r.idReporte}`, { method: 'DELETE', headers });
        const text = await res.text();
        let body = null;
        if(text){ try{ body = JSON.parse(text); }catch(e){ body = text; } }
        if(!res.ok){ console.error('DELETE /reportes error', res.status, body); mostrarAlerta('warning','Error','No se pudo eliminar el reporte (ver consola).'); cerrarModalEliminarReporte(); return; }
        // éxito: actualizar UI
        reportes.splice(i,1);
        mostrarTabla();
        mostrarAlerta('success','Eliminado','El reporte se eliminó correctamente.');
    }catch(err){ console.error(err); mostrarAlerta('warning','Error','Error eliminando reporte'); }
    cerrarModalEliminarReporte();
}


// =====================
// LIMPIAR CAMPOS - ACTUALIZADO
// =====================
function limpiarCampos() {
    const el = id => document.getElementById(id);
    if(el('selectAnimalReporte')) el('selectAnimalReporte').value = '';
    if(el('fecha')) el('fecha').value = '';
    if(el('veterinario')) el('veterinario').value = '';
    if(el('temperatura')) el('temperatura').value = '';
    if(el('condicionCorporal')) el('condicionCorporal').value = '';
    if(el('frecuenciaRespiratoria')) el('frecuenciaRespiratoria').value = '';
    if(el('diagnosticoPresuntivo')) el('diagnosticoPresuntivo').value = '';
    if(el('diagnosticoDefinitivo')) el('diagnosticoDefinitivo').value = '';
    // Limpiar checkboxes de síntomas
    document.querySelectorAll('input[name="sintomas"]').forEach(cb => cb.checked = false);
    // CAMBIO: limpiar selects de tratamiento y medicamentos
    if(selectTratamiento) selectTratamiento.value = '';
    if(selectMedicamentos) selectMedicamentos.value = '';
    if(el('observaciones')) el('observaciones').value = '';
}


// =====================
// HACER FUNCIONES GLOBALES
// =====================
window.verReporte = verReporte;
window.editarReporte = editarReporte;
window.eliminarReporte = eliminarReporte;

// =====================
// INICIALIZAR DATOS
// =====================
fetchAnimalesForSelect();
fetchTratamientosForSelect();
fetchMedicamentosForSelect();
fetchReportes();
