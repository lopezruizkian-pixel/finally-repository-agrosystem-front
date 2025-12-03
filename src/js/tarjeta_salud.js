// ============================================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ============================================

// Crear el modal de alerta si no existe
function crearModalAlerta() {
  if (document.getElementById('alertaPersonalizada')) return;
  
  const alertaModal = document.createElement('div');
  alertaModal.id = 'alertaPersonalizada';
  alertaModal.classList.add('alerta-overlay');
  alertaModal.innerHTML = `
    <div class="alerta-container">
      <div class="alerta-header" id="alertaHeader">
        <i class="fas fa-info-circle alerta-icon" id="alertaIcon"></i>
        <h3 class="alerta-title" id="alertaTitle">Alerta</h3>
      </div>
      <div class="alerta-body">
        <p class="alerta-message" id="alertaMessage"></p>
      </div>
      <div class="alerta-footer">
        <button class="btn-alerta-ok" id="btnAlertaOk">
          <i class="fas fa-check"></i> Aceptar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(alertaModal);
  
  // Evento para cerrar
  document.getElementById('btnAlertaOk').addEventListener('click', cerrarAlerta);
  
  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && alertaModal.classList.contains('active')) {
      cerrarAlerta();
    }
  });
}

// Mostrar alerta personalizada
function mostrarAlerta(mensaje, tipo = 'error') {
  crearModalAlerta();
  
  const alertaModal = document.getElementById('alertaPersonalizada');
  const header = document.getElementById('alertaHeader');
  const icon = document.getElementById('alertaIcon');
  const title = document.getElementById('alertaTitle');
  const message = document.getElementById('alertaMessage');
  
  // Limpiar clases previas
  header.classList.remove('error', 'success', 'warning', 'info');
  
  // Configurar según el tipo
  switch(tipo) {
    case 'error':
      header.classList.add('error');
      icon.className = 'fas fa-exclamation-circle alerta-icon';
      title.textContent = 'Error';
      break;
    case 'success':
      header.classList.add('success');
      icon.className = 'fas fa-check-circle alerta-icon';
      title.textContent = 'Éxito';
      break;
    case 'warning':
      header.classList.add('warning');
      icon.className = 'fa-exclamation-circle';
      title.textContent = 'Error';
      break;
    case 'info':
      header.classList.add('info');
      icon.className = 'fas fa-info-circle alerta-icon';
      title.textContent = 'Información';
      break;
  }
  
  message.textContent = mensaje;
  alertaModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Cerrar alerta
function cerrarAlerta() {
  const alertaModal = document.getElementById('alertaPersonalizada');
  if (alertaModal) {
    alertaModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ============================================
// CÓDIGO PRINCIPAL (MODIFICADO)
// ============================================

let tarjetas = [];

const btnAgregar = document.querySelector('.btn-agregar');
const tablaContenedor = document.querySelector('.tabla-tarjetas');

const modal = document.getElementById('modalAgregar');
const btnGuardar = document.getElementById('btnGuardar');
const btnCerrarModal = document.getElementById('btnCerrarModal');

// selects añadidos en el HTML para relacionar tarjeta (declarados más abajo)

const modalVisualizar = document.getElementById('modalVisualizar');
const contenidoVisualizar = document.getElementById('contenidoVisualizar');
const btnCerrarVisualizar = document.getElementById('btnCerrarVisualizar');

const buscador = document.querySelector('.buscador input');

// Selects para relacionar tarjeta
const selectAnimal = document.getElementById('selectAnimal');
const selectEnfermedad = document.getElementById('selectEnfermedad');
const selectTratamiento = document.getElementById('selectTratamiento');

// Optional inputs that may not exist on the simplified modal
const inputNombre = document.getElementById('nombre');
const inputNumArete = document.getElementById('numArete');
const selectSexo = document.getElementById('sexo');
const inputPeso = document.getElementById('peso');
const inputFechaNac = document.getElementById('fechaNac');
const inputRebano = document.getElementById('rebano');
const inputCaract = document.getElementById('caract');

const inputHFecha = document.getElementById('hFecha');
const inputHEvento = document.getElementById('hEvento');
const inputHDiag = document.getElementById('hDiag');
const inputHDesc = document.getElementById('hDesc');
const inputHTrat = document.getElementById('hTrat');
const inputHVet = document.getElementById('hVet');
const inputHEstado = document.getElementById('hEstado');

let editIndex = null;
let tarjetaAEliminar = null;
let currentEditingId = null;

// Role helpers
function getCurrentUserRole(){
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || '';
  if(!datosStr) return '';
  try{ const d = JSON.parse(datosStr); return (d.rolNombre || (d.rol && (d.rol.nombre || (d.rol.idRol===1?'Administrador':''))) || d.rol || '').toString().toLowerCase(); }catch(e){ return String(datosStr).toLowerCase(); }
}
function isVeterinario(){ const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }
function isAdmin(){ const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }

// Crear modal de confirmación de eliminación
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarTarjeta';
modalEliminar.classList.add('modal-overlay');
modalEliminar.innerHTML = `
  <div class="modal-container">
    <div class="modal-header-custom">
      <h2 class="modal-title-custom">
        <i class="fas fa-trash-alt"></i> Eliminar Animal
      </h2>
      <button onclick="cerrarModalEliminar()" class="btn-close-custom">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body-custom">
      <div class="modal-icon-warning" style="background-color: #f8d7da;">
        <i class="fas fa-exclamation-triangle" style="color: #721c24;"></i>
      </div>
      <p class="modal-message">¿Estás seguro de eliminar este animal?</p>
      <p class="modal-submessage" id="mensajeEliminarTarjeta">Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button onclick="confirmarEliminarTarjeta()" class="btn-modal-confirmar">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

// Abrir modal Agregar
if(btnAgregar){
  btnAgregar.addEventListener('click', () => {
    limpiarModal();
    const titulo = document.getElementById('tituloModal');
    if(titulo) titulo.textContent='Agregar Tarjeta de Salud';
    editIndex=null;
    // refrescar listas por si cambiaron
    fetchEnfermedades();
    fetchAnimalesList();
    fetchTratamientos();
    if(modal) modal.style.display='flex';
  });
} else {
  console.warn('tarjeta_salud.js: .btn-agregar not found in DOM');
}

// Mostrar crear solo para veterinario
if (!isVeterinario() && btnAgregar) {
  btnAgregar.style.display = 'none';
}

// Cerrar modal Agregar/Editar
if(btnCerrarModal){
  btnCerrarModal.addEventListener('click',()=>{ if(modal) modal.style.display='none'; currentEditingId = null; editIndex = null; if(btnGuardar) btnGuardar.textContent = 'Guardar'; });
} else { console.warn('tarjeta_salud.js: btnCerrarModal not found'); }
if(window){
  if(modal){
    window.addEventListener('click', e=>{ if(e.target===modal) { modal.style.display='none'; currentEditingId = null; editIndex = null; if(btnGuardar) btnGuardar.textContent='Guardar'; } });
  }
}

// Cerrar modal Visualizar
if(btnCerrarVisualizar){
  btnCerrarVisualizar.addEventListener('click',()=>{ if(modalVisualizar) modalVisualizar.style.display='none'; });
} else { console.warn('tarjeta_salud.js: btnCerrarVisualizar not found'); }
if(window){
  if(modalVisualizar){
    window.addEventListener('click', e=>{ if(e.target===modalVisualizar) modalVisualizar.style.display='none'; });
  }
}

// Limpiar modal
function limpiarModal(){
  if(inputNombre) inputNombre.value='';
  if(inputNumArete) inputNumArete.value='';
  if(selectSexo) selectSexo.value='H';
  if(inputPeso) inputPeso.value='';
  if(inputFechaNac) inputFechaNac.value='';
  if(inputRebano) inputRebano.value='';
  if(inputCaract) inputCaract.value='';
  if(inputHFecha) inputHFecha.value='';
  if(inputHEvento) inputHEvento.value='';
  if(inputHDiag) inputHDiag.value='';
  if(inputHDesc) inputHDesc.value='';
  if(inputHTrat) inputHTrat.value='';
  if(inputHVet) inputHVet.value='';
  if(inputHEstado) inputHEstado.value='';
  // Reset selects if present
  if(selectAnimal) selectAnimal.value = '';
  if(selectEnfermedad) selectEnfermedad.value = '';
  if(selectTratamiento) selectTratamiento.value = '';
}

// Guardar / Editar - MODIFICADO PARA USAR ALERTA PERSONALIZADA
if(btnGuardar){
  btnGuardar.addEventListener('click', async ()=>{
  // Si existen los selects de referencia, construir payload de Tarjeta
  if(selectAnimal || selectEnfermedad || selectTratamiento){
    const selAnimal = selectAnimal ? selectAnimal.value : '';
    const selEnf = selectEnfermedad ? selectEnfermedad.value : '';
    const selTrat = selectTratamiento ? selectTratamiento.value : '';

    // Si al menos uno está seleccionado, consideramos flujo de Tarjeta
    if(selAnimal || selEnf || selTrat){
      // Validaciones mínimas
      if(!selAnimal || !selEnf || !selTrat){
        mostrarAlerta('Seleccione Animal, Enfermedad y Tratamiento para crear la tarjeta.', 'warning');
        return;
      }

      const payload = {
        idAnimal: { idAnimal: Number(selAnimal) },
        idEnfermedad: { idEnfermedad: Number(selEnf) },
        idTratamiento: { idTratamiento: Number(selTrat) }
      };

      // Si estamos editando una tarjeta del backend, hacer PUT
      if(currentEditingId){
        await updateTarjetaBackend(currentEditingId, payload);
        currentEditingId = null;
      } else {
        // Enviar POST al backend
        await sendTarjetaToBackend(payload);
      }
      // restablecer estado de modal/botón
      if(btnGuardar) btnGuardar.textContent = 'Guardar';
      return;
    }
  }
  const animal = {
    nombre: inputNombre.value.trim(),
    numArete: inputNumArete.value.trim(),
    sexo: selectSexo.value,
    peso: inputPeso.value.trim(),
    fechaNac: inputFechaNac.value.trim(),
    rebano: inputRebano.value.trim(),
    caract: inputCaract.value.trim(),
    historial:{
      fecha: inputHFecha.value.trim(),
      evento: inputHEvento.value.trim(),
      diag: inputHDiag.value.trim(),
      desc: inputHDesc.value.trim(),
      trat: inputHTrat.value.trim(),
      vet: inputHVet.value.trim(),
      estado: inputHEstado.value.trim()
    }
  };
  
  // REEMPLAZAR alert() CON mostrarAlerta()
  if(!animal.nombre || !animal.numArete){ 
    mostrarAlerta('El nombre y el número de arete son obligatorios', 'warning');
    return; 
  }

  if(editIndex!==null){
    tarjetas[editIndex]=animal;
    mostrarAlerta('Animal actualizado correctamente', 'success');
  }else{
    tarjetas.push(animal);
    mostrarAlerta('Animal agregado correctamente', 'success');
  }

  modal.style.display='none';
  renderizarTabla();
  });
} else { console.warn('tarjeta_salud.js: btnGuardar not found'); }

// Funciones del modal de eliminar
function abrirModalEliminar(tarjeta) {
  tarjetaAEliminar = tarjeta;
  document.getElementById('mensajeEliminarTarjeta').textContent = 
    `Se eliminará el animal "${tarjeta.nombre}" (Arete: ${tarjeta.numArete}). Esta acción no se puede deshacer.`;
  document.getElementById('modalEliminarTarjeta').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
  document.getElementById('modalEliminarTarjeta').classList.remove('active');
  document.body.style.overflow = 'auto';
  tarjetaAEliminar = null;
}

function confirmarEliminarTarjeta() {
  if (tarjetaAEliminar) {
    // Si es una tarjeta proveniente del backend
    if(tarjetaAEliminar.idTarjeta){
      const id = tarjetaAEliminar.idTarjeta;
      cerrarModalEliminar();
      deleteTarjetaBackend(id);
      tarjetaAEliminar = null;
      return;
    }
    const idx = tarjetas.indexOf(tarjetaAEliminar);
    tarjetas.splice(idx, 1);
    renderizarTabla();
    cerrarModalEliminar();
    mostrarAlerta('Animal eliminado correctamente', 'success');
  }
}

// Renderizar tabla
function renderizarTabla(lista=tarjetas){
  tablaContenedor.innerHTML='';
  if(lista.length===0){
    tablaContenedor.innerHTML='<p>No hay animales registrados.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML=`
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Número de Arete</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = tabla.querySelector('tbody');

  lista.forEach((t,i)=>{
    const fila=document.createElement('tr');
    // Si el registro viene del backend como tarjeta, mostrar info relacionada
    if(t.idTarjeta){
      const nombreAnim = (t.idAnimal && (t.idAnimal.nombreAnimal || t.idAnimal.nombre)) || '';
      const numArete = (t.idAnimal && (t.idAnimal.numArete || '')) || '';
      const nombreEnf = (t.idEnfermedad && (t.idEnfermedad.nombreEnfermedad || '')) || '';
      fila.innerHTML=`
        <td>${nombreAnim}</td>
        <td>${numArete}</td>
        <td>
          <small>${nombreEnf}</small>
              <div>
                <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
                ${ isVeterinario() ? '<button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button><button class="btn-eliminar" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>' : '' }
              </div>
        </td>
      `;
    } else {
      fila.innerHTML=`
        <td>${t.nombre}</td>
        <td>${t.numArete}</td>
        <td>
            <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
              ${ isVeterinario() ? '<button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button><button class="btn-eliminar" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button>' : '' }
        </td>
      `;
    }

    // Ver
    fila.querySelector('.btn-ver').addEventListener('click',()=>{
      if(t.idTarjeta){
        // Mostrar info anidada
        const anim = t.idAnimal || {};
        const enf = t.idEnfermedad || {};
        const trat = t.idTratamiento || {};
        contenidoVisualizar.innerHTML = `
          <div class="detalle-item">
            <h4>Animal</h4>
            <strong>Nombre</strong>
            <p>${anim.nombreAnimal || anim.nombre || ''}</p>
          </div>
          <div class="detalle-item">
            <strong>Arete</strong>
            <p>${anim.numArete || ''}</p>
          </div>
          <div class="detalle-item">
            <h4>Enfermedad</h4>
            <strong>Nombre</strong>
            <p>${enf.nombreEnfermedad || ''}</p>
          </div>
          <div class="detalle-item">
            <strong>Tipo</strong>
            <p>${enf.tipoEnfermedad || ''}</p>
          </div>
          <div class="detalle-item">
            <h4>Tratamiento</h4>
            <strong>Nombre</strong>
            <p>${trat.nombreTratamiento || ''}</p>
          </div>
        `;
      } else {
        contenidoVisualizar.innerHTML= `
          <div class="detalle-item">
            <strong>Nombre</strong>
            <p>${t.nombre}</p>
          </div>
          <div class="detalle-item">
            <strong>Arete</strong>
            <p>${t.numArete}</p>
          </div>
          <div class="detalle-item">
            <strong>Sexo</strong>
            <p>${t.sexo}</p>
          </div>
          <div class="detalle-item">
            <strong>Peso</strong>
            <p>${t.peso}</p>
          </div>
          <div class="detalle-item">
            <strong>Fecha nacimiento</strong>
            <p>${t.fechaNac}</p>
          </div>
          <div class="detalle-item">
            <strong>Rebaño</strong>
            <p>${t.rebano}</p>
          </div>
          <div class="detalle-item">
            <strong>Características</strong>
            <p>${t.caract}</p>
          </div>
          <div class="detalle-item">
            <h4>Historial Médico</h4>
            <strong>Fecha</strong>
            <p>${t.historial.fecha}</p>
          </div>
          <div class="detalle-item">
            <strong>Evento</strong>
            <p>${t.historial.evento}</p>
          </div>
          <div class="detalle-item">
            <strong>Diagnóstico</strong>
            <p>${t.historial.diag}</p>
          </div>
          <div class="detalle-item">
            <strong>Descripción</strong>
            <p>${t.historial.desc}</p>
          </div>
          <div class="detalle-item">
            <strong>Tratamiento</strong>
            <p>${t.historial.trat}</p>
          </div>
          <div class="detalle-item">
            <strong>Veterinario</strong>
            <p>${t.historial.vet}</p>
          </div>
          <div class="detalle-item">
            <strong>Estado</strong>
            <p>${t.historial.estado}</p>
          </div>
        `;
      }
      modalVisualizar.style.display='flex';
    });

    // Editar (si existe): maneja tanto tarjetas backend como locales
    const btnEditar = fila.querySelector('.btn-editar');
    if(btnEditar){
        btnEditar.addEventListener('click', async ()=>{
          if(t.idTarjeta){
            // editar tarjeta proveniente del backend: prefills selects
            try{
              // Esperar a que las listas se carguen y los selects se poblen
              await Promise.all([fetchEnfermedades(), fetchAnimalesList(), fetchTratamientos()]);
              const aid = (t.idAnimal && (t.idAnimal.idAnimal || t.idAnimal.id)) || (t.idAnimal || '');
              const eid = (t.idEnfermedad && (t.idEnfermedad.idEnfermedad || t.idEnfermedad.id)) || (t.idEnfermedad || '');
              const trid = (t.idTratamiento && (t.idTratamiento.idTratamiento || t.idTratamiento.id)) || (t.idTratamiento || '');
              if(selectAnimal && aid) selectAnimal.value = String(aid);
              if(selectEnfermedad && eid) selectEnfermedad.value = String(eid);
              if(selectTratamiento && trid) selectTratamiento.value = String(trid);
            }catch(e){ console.warn('prefill tarjeta edit error', e); }
            currentEditingId = t.idTarjeta;
            editIndex = i;
            const titulo = document.getElementById('tituloModal'); if(titulo) titulo.textContent='Editar Tarjeta de Salud';
            if(btnGuardar) btnGuardar.textContent = 'Actualizar';
            if(modal) modal.style.display='flex';
          } else {
            // local animal editing fallback
            if(inputNombre) inputNombre.value = t.nombre || '';
            if(inputNumArete) inputNumArete.value = t.numArete || '';
            if(selectSexo) selectSexo.value = t.sexo || 'H';
            if(inputPeso) inputPeso.value = t.peso || '';
            if(inputFechaNac) inputFechaNac.value = t.fechaNac || '';
            if(inputRebano) inputRebano.value = t.rebano || '';
            if(inputCaract) inputCaract.value = t.caract || '';
            if(inputHFecha) inputHFecha.value = (t.historial && t.historial.fecha) || '';
            if(inputHEvento) inputHEvento.value = (t.historial && t.historial.evento) || '';
            if(inputHDiag) inputHDiag.value = (t.historial && t.historial.diag) || '';
            if(inputHDesc) inputHDesc.value = (t.historial && t.historial.desc) || '';
            if(inputHTrat) inputHTrat.value = (t.historial && t.historial.trat) || '';
            if(inputHVet) inputHVet.value = (t.historial && t.historial.vet) || '';
            if(inputHEstado) inputHEstado.value = (t.historial && t.historial.estado) || '';
            editIndex=i;
            const titulo = document.getElementById('tituloModal');
            if(titulo) titulo.textContent='Editar Animal';
            if(modal) modal.style.display='flex';
          }
        });
    }

    // Eliminar con modal (comprobar existencia del botón antes de añadir el listener)
    const btnEliminarFila = fila.querySelector('.btn-eliminar');
    if (btnEliminarFila) {
      btnEliminarFila.addEventListener('click', () => {
        // si es tarjeta del backend, llamar al delete del backend
        if (t.idTarjeta) {
          tarjetaAEliminar = t;
          const mensajeEl = document.getElementById('mensajeEliminarTarjeta');
          if (mensajeEl) mensajeEl.textContent = `Se eliminará la tarjeta id ${t.idTarjeta}. Esta acción no se puede deshacer.`;
          const modalEl = document.getElementById('modalEliminarTarjeta');
          if (modalEl) modalEl.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else {
          abrirModalEliminar(t);
        }
      });
    }

    tbody.appendChild(fila);
  });

  tablaContenedor.appendChild(tabla);
}

// Buscador
buscador.addEventListener('input',()=>{
  const texto=buscador.value.toLowerCase();
  const filtrados = tarjetas.filter(t => {
    const byNombre = t.nombre && t.nombre.toLowerCase().includes(texto);
    const byNum = t.numArete && typeof t.numArete === 'string' && t.numArete.toLowerCase().includes(texto);
    const byNested = t.idAnimal && (String(t.idAnimal.numArete || '') + ' ' + (t.idAnimal.nombreAnimal || t.idAnimal.nombre || '')).toLowerCase().includes(texto);
    return Boolean(byNombre || byNum || byNested);
  });
  renderizarTabla(filtrados);
});

// Cerrar modal con ESC o click fuera
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalElim = document.getElementById('modalEliminarTarjeta');
    if (modalElim && modalElim.classList.contains('active')) {
      cerrarModalEliminar();
    }
  }
});

window.addEventListener('click', (e) => {
  const modalElim = document.getElementById('modalEliminarTarjeta');
  if (e.target === modalElim) {
    cerrarModalEliminar();
  }
});

// Inicializar tabla
// Cargar listas de referencia y tarjetas desde backend (si está disponible)
async function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const datosUsuario = localStorage.getItem('datosUsuarioAgroSystem') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(datosUsuario ? { 'Id-Usuario': datosUsuario } : {})
  };
}

async function fetchEnfermedades(){
  try{
    console.debug('GET /enfermedades');
    const res = await fetch('http://localhost:7002/enfermedades', { headers: await getAuthHeaders() });
    const text = await res.text();
    if(!res.ok){ console.error('Error cargando enfermedades', res.status, text); return; }
    let data = [];
    if(text){
      try{ data = JSON.parse(text); }catch(e){ console.warn('fetchEnfermedades: response not JSON', text); return; }
    }
    // poblar select
    if(selectEnfermedad){
      selectEnfermedad.innerHTML = '<option value="">-- Seleccione una enfermedad --</option>';
      (data || []).forEach(e => {
        const o = document.createElement('option');
        o.value = e.idEnfermedad || e.id;
        o.textContent = e.nombreEnfermedad || e.nombre || `Enfermedad ${o.value}`;
        selectEnfermedad.appendChild(o);
      });
    }
    return data;
  }catch(err){ console.error(err); }
}

async function fetchAnimalesList(){
  try{
    console.debug('GET /animales');
    const res = await fetch('http://localhost:7002/animales', { headers: await getAuthHeaders() });
    const text = await res.text();
    if(!res.ok){ console.error('Error cargando animales', res.status, text); return; }
    let data = [];
    if(text){
      try{ data = JSON.parse(text); }catch(e){ console.warn('fetchAnimalesList: response not JSON', text); return; }
    }
    if(selectAnimal){
      selectAnimal.innerHTML = '<option value="">-- Seleccione un animal --</option>';
      (data || []).forEach(a => {
        const id = a.idAnimal || a.id;
        const name = a.nombreAnimal || a.nombre || `Animal ${id}`;
        const o = document.createElement('option');
        o.value = id;
        o.textContent = `${name} (arete ${a.numArete || ''})`;
        selectAnimal.appendChild(o);
      });
    }
    return data;
  }catch(err){ console.error(err); }
}

async function fetchTratamientos(){
  try{
    console.debug('GET /tratamientos');
    const res = await fetch('http://localhost:7002/tratamientos', { headers: await getAuthHeaders() });
    const text = await res.text();
    if(!res.ok){ console.error('Error cargando tratamientos', res.status, text); return; }
    let data = [];
    if(text){
      try{ data = JSON.parse(text); }catch(e){ console.warn('fetchTratamientos: response not JSON', text); return; }
    }
    if(selectTratamiento){
      selectTratamiento.innerHTML = '<option value="">-- Seleccione un tratamiento --</option>';
      (data || []).forEach(t => {
        const id = t.idTratamiento || t.id;
        const nombre = t.nombreTratamiento || t.nombre || `Tratamiento ${id}`;
        const o = document.createElement('option');
        o.value = id;
        o.textContent = nombre;
        selectTratamiento.appendChild(o);
      });
    }
    return data;
  }catch(err){ console.error(err); }
}

async function fetchTarjetasFromBackend(){
  try{
    console.debug('GET /tarjetas');
    const res = await fetch('http://localhost:7002/tarjetas', { headers: await getAuthHeaders() });
    const text = await res.text();
    if(!res.ok){ console.error('Error cargando tarjetas', res.status, text); return; }
    let data = [];
    if(text){
      try{ data = JSON.parse(text); }catch(e){ console.warn('fetchTarjetasFromBackend: response not JSON', text); return; }
    }
    console.debug('GET /tarjetas response', data);
    tarjetas = (data || []).map(item => ({
      idTarjeta: item.idTarjeta || item.id,
      idAnimal: item.idAnimal,
      idEnfermedad: item.idEnfermedad,
      idTratamiento: item.idTratamiento
    }));
    renderizarTabla();
  }catch(err){ console.error(err); }
}

async function sendTarjetaToBackend(payload){
  try{
    console.debug('POST /tarjetas payload', payload);
    const res = await fetch('http://localhost:7002/tarjetas', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let created = null;
    try{ created = JSON.parse(text); } catch(e){ created = text; }
    if(!res.ok){
      console.error('POST /tarjetas error', created);
      mostrarAlerta(`Error creando tarjeta: ${res.status}`, 'error');
      return;
    }
    console.debug('POST /tarjetas response', created);
    // agregar localmente y refrescar
    tarjetas.push({ idTarjeta: created.idTarjeta || created.id, idAnimal: created.idAnimal, idEnfermedad: created.idEnfermedad, idTratamiento: created.idTratamiento });
    renderizarTabla();
    mostrarAlerta('Tarjeta creada correctamente', 'success');
    modal.style.display='none';
    currentEditingId = null;
    if(btnGuardar) btnGuardar.textContent = 'Guardar';
  }catch(err){ console.error(err); mostrarAlerta('Error creando tarjeta', 'error'); }
}

async function updateTarjetaBackend(id, payload){
  try{
    console.debug(`PUT /tarjetas/${id} payload`, payload);
    // Asegurar que el payload incluya el campo idTarjeta (numérico) que coincida con la ruta
    const bodyPayload = Object.assign({}, payload, { idTarjeta: Number(id) });
    const res = await fetch(`http://localhost:7002/tarjetas/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(bodyPayload)
    });
    const text = await res.text();
    let updated = null;
    try{ updated = text ? JSON.parse(text) : null; }catch(e){ updated = text; }
    if(!res.ok){ console.error('PUT /tarjetas error', res.status, updated); mostrarAlerta('Error actualizando tarjeta', 'error'); return; }
    console.debug('PUT /tarjetas response', updated);
    mostrarAlerta('Tarjeta actualizada correctamente', 'success');
    if(modal) modal.style.display='none';
    currentEditingId = null;
    if(btnGuardar) btnGuardar.textContent = 'Guardar';
    await fetchTarjetasFromBackend();
  }catch(err){ console.error(err); mostrarAlerta('Error actualizando tarjeta', 'error'); }
}

async function deleteTarjetaBackend(id){
  try{
    console.debug(`DELETE /tarjetas/${id}`);
    const res = await fetch(`http://localhost:7002/tarjetas/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    if(!res.ok) throw new Error('DELETE failed');
    const idx = tarjetas.findIndex(t => t.idTarjeta === id);
    if(idx !== -1) tarjetas.splice(idx,1);
    renderizarTabla();
    mostrarAlerta('Tarjeta eliminada', 'success');
  }catch(err){ console.error(err); mostrarAlerta('No se pudo eliminar la tarjeta', 'error'); }
}

// Inicializar referencias y datos
fetchEnfermedades();
fetchAnimalesList();
fetchTratamientos();
fetchTarjetasFromBackend();
