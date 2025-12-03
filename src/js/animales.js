// Arreglo para almacenar animales
let animales = [];

// Selección de elementos
const modal = document.getElementById('modalAgregarAnimal');
const btnGuardar = document.getElementById('btnGuardarAnimal');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAgregar = document.querySelector('.btn-agregar');
const tablaAnimales = document.querySelector('.tabla-animales');
const inputNombre = document.getElementById('nombre');
const inputNumArete = document.getElementById('numArete');
const selectRebano = document.getElementById('rebano');
const selectProcedencia = document.getElementById('procedencia');
const selectSexo = document.getElementById('sexo');
const selectEstado = document.getElementById('estado');
const buscador = document.querySelector('.buscador input');

// Modal y contenido de visualización
let modalVisualizar = document.getElementById('modalVisualizarAnimal');
if (!modalVisualizar) {
  modalVisualizar = document.createElement('div');
  modalVisualizar.id = 'modalVisualizarAnimal';
  modalVisualizar.classList.add('modal');
  modalVisualizar.innerHTML = `
    <div class="modal-contenido" style="width: 450px;">
      <h2>Detalle del Animal</h2>
      <div id="contenidoAnimal"></div>
      <div class="botones">
        <button id="btnCerrarVisualizar">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalVisualizar);
}
const contenidoAnimal = document.getElementById('contenidoAnimal');
const btnCerrarVisualizar = document.getElementById('btnCerrarVisualizar');

let editIndex = null;
let animalAEliminar = null;

// Rol actual (utilidades)
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try {
    const datos = JSON.parse(datosStr);
    return (datos.rolNombre || (datos.rol && (datos.rol.nombre || (datos.rol.idRol === 1 ? 'Administrador' : ''))) || datos.rol || '').toString().toLowerCase();
  } catch (e) {
    return String(datosStr).toLowerCase();
  }
}

function isVeterinario() { const r = getCurrentUserRole(); return r.includes('veterinario') || r.includes('vet'); }
function isAdmin() { const r = getCurrentUserRole(); return r.includes('admin') || r.includes('administrador'); }

// ===================================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ===================================

// Agregar estilos CSS si no existen
if (!document.getElementById('estilos-alertas')) {
  const estilosAlerta = document.createElement('style');
  estilosAlerta.id = 'estilos-alertas';
  estilosAlerta.textContent = `
    .alerta-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    }
    .alerta-overlay.active {
      display: flex !important;
    }
    .alerta-container {
      background: white;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: alertaSlideIn 0.3s ease;
    }
    @keyframes alertaSlideIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    .alerta-header {
      padding: 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 15px;
      color: white;
    }
    .alerta-header.error {
      background-color: #dc3545;
    }
    .alerta-header.success {
      background-color: #28a745;
    }
    .alerta-header.warning {
      background-color: #ffc107;
      color: #333;
    }
    .alerta-header.info {
      background-color: #17a2b8;
    }
    .alerta-icon {
      font-size: 2rem;
    }
    .alerta-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: bold;
    }
    .alerta-body {
      padding: 25px;
      text-align: center;
    }
    .alerta-message {
      font-size: 1rem;
      color: #333;
      line-height: 1.6;
    }
    .alerta-footer {
      padding: 15px 20px;
      display: flex;
      justify-content: center;
      border-top: 1px solid #e0e0e0;
    }
    .btn-alerta-ok {
      padding: 10px 30px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.95rem;
      background-color: rgba(114, 158, 100, 1);
      color: white;
      transition: all 0.3s ease;
    }
    .btn-alerta-ok:hover {
      background-color: rgba(94, 138, 80, 1);
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(estilosAlerta);
}

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

// Helper: resolver Id-Usuario numérico y construir cabeceras de autenticación
async function resolveUsuarioId(candidate) {
  if (candidate == null || candidate === '') return '';
  // si ya es numérico, devolver número
  if (!isNaN(Number(candidate))) return Number(candidate);

  // intentar obtener lista de usuarios y buscar coincidencia
  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('http://localhost:7002/usuarios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    if (!res.ok) return '';
    const list = await res.json().catch(() => null);
    if (!Array.isArray(list)) return '';

    const lower = String(candidate).toLowerCase();
    const found = list.find(u => {
      const uFields = [u.usuario, u.nombre, u.nombreUsuario, u.username, u.email];
      return uFields.some(f => f && String(f).toLowerCase() === lower);
    });
    if (!found) return '';
    return found.idUsuario || found.id || found.usuarioId || '';
  } catch (e) {
    console.debug('resolveUsuarioId error', e);
    return '';
  }
}

async function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const datosStr = localStorage.getItem('datosUsuarioAgroSystem') || sessionStorage.getItem('datosUsuarioAgroSystem') || null;
  let idUsuarioCandidate = '';
  if (datosStr) {
    try {
      const datos = JSON.parse(datosStr);
      idUsuarioCandidate = datos.usuario || datos.usuarioId || datos.idUsuario || datos.id || '';
    } catch (e) {
      // si no es JSON, intentar usar valor crudo
      idUsuarioCandidate = datosStr;
    }
  }

  // resolver a un valor numérico si es necesario
  const resolved = await resolveUsuarioId(idUsuarioCandidate);
  const idHeader = resolved !== '' ? String(resolved) : '';

  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Id-Usuario': idHeader
  };
}

// Enviar animal al backend
async function sendAnimalToBackend(animal) {
  try {
    const headers = await getAuthHeaders();

    const sexoBool = (() => {
      const s = (animal.sexo || '').toString().toLowerCase();
      if (s === 'm' || s === 'macho' || s === 'male' || s === 'masculino' || s === 'true' || s === '1') return "M";
      return "H";
    })();

    const payload = {
      nombreAnimal: animal.nombre || '',
      numArete: animal.numArete ? Number(animal.numArete) : animal.numArete,
      "rebaño": animal.rebano || '',
      fechaNacimiento: animal.fechaNacimiento || null,
      pesoInicial: (animal.pesoInicial != null) ? Number(animal.pesoInicial) : (animal.peso ? Number(animal.peso) : 0),
      caracteristica: animal.caracteristica || animal.caracteristicas || '',
      edad: animal.edad ? Number(animal.edad) : null,
      procedencia: animal.procedencia || '',
      sexo: sexoBool,
      idPadre: (animal.padreArete !== undefined && animal.padreArete !== null && String(animal.padreArete).trim() !== '' && !isNaN(Number(animal.padreArete))) ? Number(animal.padreArete) : null,
      idMadre: (animal.madreArete !== undefined && animal.madreArete !== null && String(animal.madreArete).trim() !== '' && !isNaN(Number(animal.madreArete))) ? Number(animal.madreArete) : null,
      estado: animal.estado || 'Vivo'
    };

    console.debug('POST /animales payload', payload);

    const res = await fetch('http://localhost:7002/animales', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Error del servidor');
    }

    const data = await res.json().catch(() => null);
    console.debug('POST /animales response', data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

// Obtener lista de animales desde el backend y mapear al formato local
async function fetchAnimalsFromBackend() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('http://localhost:7002/animales', {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Error al obtener animales');
    }

    const list = await res.json();
    console.debug('GET /animales response', list);
    if (!Array.isArray(list)) {
      throw new Error('Respuesta del servidor no es una lista');
    }

    animales = list;
    renderizarAnimales();
  } catch (err) {
    console.error('fetchAnimalsFromBackend error:', err);
    mostrarAlerta(`No se pudieron cargar los animales: ${err.message || err}`, 'error');
    renderizarAnimales();
  }
}

// Actualizar animal en backend (PUT)
async function updateAnimalBackend(animalTemp, routeId) {
  try {
    const headers = await getAuthHeaders();
    const id = routeId || animalTemp.idAnimal || animalTemp.id;
    if (!id) throw new Error('Falta idAnimal para actualizar');

    const payload = {
      idAnimal: Number(id),
      nombreAnimal: animalTemp.nombre || '',
      numArete: animalTemp.numArete ? Number(animalTemp.numArete) : null,
      "rebaño": animalTemp.rebano || '',
      fechaNacimiento: animalTemp.fechaNacimiento || null,
      pesoInicial: (animalTemp.pesoInicial != null) ? Number(animalTemp.pesoInicial) : (animalTemp.peso ? Number(animalTemp.peso) : null),
      caracteristica: animalTemp.caracteristica || animalTemp.caracteristicas || '',
      edad: animalTemp.edad ? Number(animalTemp.edad) : null,
      procedencia: animalTemp.procedencia || '',
      sexo: (animalTemp.sexo && (animalTemp.sexo === 'M' || animalTemp.sexo === 'm' || animalTemp.sexo === 'true')) ? "M" : "H",
      idPadre: (animalTemp.padreArete !== undefined && animalTemp.padreArete !== null && String(animalTemp.padreArete).trim() !== '' && !isNaN(Number(animalTemp.padreArete))) ? Number(animalTemp.padreArete) : null,
      idMadre: (animalTemp.madreArete !== undefined && animalTemp.madreArete !== null && String(animalTemp.madreArete).trim() !== '' && !isNaN(Number(animalTemp.madreArete))) ? Number(animalTemp.madreArete) : null,
      estado: animalTemp.estado || 'Vivo'
    };

    console.debug('PUT /animales/' + id + ' payload', payload);

    const res = await fetch(`http://localhost:7002/animales/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Error al actualizar animal');
    }

    const data = await res.json().catch(() => null);
    console.debug('PUT /animales response', data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

// Eliminar animal en backend (DELETE)
async function deleteAnimalBackend(id) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`http://localhost:7002/animales/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Error al eliminar');
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

// Cerrar alerta with ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalAlerta.classList.contains('active')) {
    cerrarAlerta();
  }
});

// ===================================
// MODAL ADICIONAL SEGÚN REBAÑO
// ===================================
let modalSecundario = document.createElement('div');
modalSecundario.classList.add('modal');
modalSecundario.id = 'modalSecundario';
modalSecundario.innerHTML = `
  <div class="modal-contenido">
    <h2>Datos adicionales</h2>
    <div id="camposSecundarios"></div>
    <div class="botones">
      <button id="btnGuardarSecundario">Guardar</button>
      <button id="btnCerrarSecundario">Cancelar</button>
    </div>
  </div>
`;
document.body.appendChild(modalSecundario);

const camposSecundarios = document.getElementById('camposSecundarios');
const btnGuardarSecundario = document.getElementById('btnGuardarSecundario');
const btnCerrarSecundario = document.getElementById('btnCerrarSecundario');

let animalTemp = {};

// ===================================
// MODAL DE ELIMINAR
// ===================================
const modalEliminar = document.createElement('div');
modalEliminar.id = 'modalEliminarAnimal';
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
      <p class="modal-submessage" id="mensajeEliminarAnimal">Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-footer-custom">
      <button onclick="cerrarModalEliminar()" class="btn-modal-cancelar">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button onclick="confirmarEliminarAnimal()" class="btn-modal-confirmar">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  </div>
`;
document.body.appendChild(modalEliminar);

// ===================================
// FUNCIONES DE MODALES
// ===================================

// Abrir modal principal
btnAgregar.addEventListener('click', () => {
  limpiarModal();
  modal.style.display = 'flex';
});

// Mostrar acciones CRUD sólo para admin en animales
if (!isAdmin() && btnAgregar) {
  btnAgregar.style.display = 'none';
}

// Cerrar modal principal
btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

// Cerrar modal de visualizar
btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modalVisualizar) modalVisualizar.style.display = 'none';
});

// Cerrar modal secundario
btnCerrarSecundario.addEventListener('click', () => modalSecundario.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modalSecundario) modalSecundario.style.display = 'none';
});

// Limpiar modal principal
function limpiarModal() {
  inputNombre.value = '';
  inputNumArete.value = '';
  selectRebano.value = 'Vaca';
  selectProcedencia.value = 'Interno';
  selectSexo.value = 'H';
  selectEstado.value = 'Vivo';
  document.getElementById('fechaNacimiento').value = '';
  document.getElementById('edad').value = '';
  document.getElementById('peso').value = '';
  document.getElementById('caracteristicas').value = '';
  document.getElementById('padreArete').value = '';
  document.getElementById('madreArete').value = '';
  editIndex = null;
}

// ===================================
// GUARDAR ANIMAL (MODAL ÚNICO - SIN MODAL SECUNDARIO)
// ===================================
btnGuardar.addEventListener('click', () => {
  const nombre = inputNombre.value.trim();
  const numArete = inputNumArete.value.trim();
  const rebano = selectRebano.value;
  const procedencia = selectProcedencia.value;
  const sexo = selectSexo.value;
  const estado = selectEstado.value;
  const fechaNacimiento = document.getElementById('fechaNacimiento').value;
  const edad = document.getElementById('edad').value;
  const peso = document.getElementById('peso').value;
  const caracteristicas = document.getElementById('caracteristicas').value;
  const padreArete = document.getElementById('padreArete').value;
  const madreArete = document.getElementById('madreArete').value;

  if (!nombre || !numArete || !sexo) {
    mostrarAlerta('Por favor complete todos los campos obligatorios: Nombre, Número de Arete y Sexo.', 'error');
    return;
  }

  // Crear objeto con todos los datos
  animalTemp = {
    nombre,
    numArete,
    rebano,
    procedencia,
    sexo,
    estado,
    fechaNacimiento,
    edad,
    pesoInicial: peso,
    caracteristica: caracteristicas,
    padreArete,
    madreArete
  };

  // Procesar directamente sin modal secundario
  if (editIndex !== null) {
    // Actualizar en backend
    const animalOriginal = animales[editIndex];
    animalTemp.idAnimal = animalOriginal.idAnimal || animalOriginal.id;
    
    const routeId = animalTemp.idAnimal;
    
    updateAnimalBackend(animalTemp, routeId)
      .then(resp => {
        if (resp.success) {
          // Recargar la lista desde el backend para asegurar consistencia
          fetchAnimalsFromBackend();
          mostrarAlerta(`El animal "${animalTemp.nombre}" ha sido actualizado exitosamente.`, 'success');
          modal.style.display = 'none';
        } else {
          mostrarAlerta(`Error al actualizar en servidor: ${resp.error}`, 'error');
        }
      })
      .catch(err => {
        mostrarAlerta(`Error en la petición: ${err.message || err}`, 'error');
      });
  } else {
    // Guardar nuevo animal
    sendAnimalToBackend(animalTemp)
      .then(resp => {
        if (resp.success) {
          // Recargar la lista desde el backend
          fetchAnimalsFromBackend();
          mostrarAlerta(`El animal "${animalTemp.nombre}" ha sido registrado exitosamente.`, 'success');
          modal.style.display = 'none';
        } else {
          mostrarAlerta(`Error al registrar en servidor: ${resp.error}`, 'error');
        }
      })
      .catch(err => {
        mostrarAlerta(`Error en la petición: ${err.message || err}`, 'error');
      });
  }
});

// ===================================
// FUNCIONES DEL MODAL DE ELIMINAR
// ===================================
function abrirModalEliminar(animal) {
  animalAEliminar = animal;
  document.getElementById('mensajeEliminarAnimal').textContent = 
    `Se eliminará el animal "${animal.nombreAnimal || ''}" (Arete: ${animal.numArete || ''}).`;
  document.getElementById('modalEliminarAnimal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
  document.getElementById('modalEliminarAnimal').classList.remove('active');
  document.body.style.overflow = 'auto';
  animalAEliminar = null;
}

function confirmarEliminarAnimal() {
  if (animalAEliminar) {
    const id = animalAEliminar.idAnimal || animalAEliminar.id || null;
    if (id) {
      deleteAnimalBackend(id)
        .then(resp => {
          if (resp.success) {
            const nombreAlert = animalAEliminar.nombreAnimal || animalAEliminar.nombre || '';
            const areteAlert = animalAEliminar.numArete || '';
            fetchAnimalsFromBackend();
            cerrarModalEliminar();
            mostrarAlerta(`El animal "${nombreAlert}" (Arete: ${areteAlert}) ha sido eliminado exitosamente.`, 'success');
          } else {
            mostrarAlerta(`Error al eliminar en servidor: ${resp.error}`, 'error');
          }
        })
        .catch(err => mostrarAlerta(`Error en la petición: ${err.message || err}`, 'error'));
    } else {
      const nombreAlert = animalAEliminar.nombreAnimal || animalAEliminar.nombre || '';
      const areteAlert = animalAEliminar.numArete || '';
      const idx = animales.indexOf(animalAEliminar);
      if (idx > -1) animales.splice(idx, 1);
      renderizarAnimales();
      cerrarModalEliminar();
      mostrarAlerta(`El animal "${nombreAlert}" (Arete: ${areteAlert}) ha sido eliminado localmente.`, 'success');
    }
  }
}

// ===================================
// RENDERIZAR ANIMALES
// ===================================
function renderizarAnimales(lista = animales){
  tablaAnimales.innerHTML = '';

  if(lista.length === 0){
    tablaAnimales.innerHTML = '<p>No hay animales registrados.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Número de Arete</th>
        <th>Sexo</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = tabla.querySelector('tbody');
  lista.forEach(animal => {
    const fila = document.createElement('tr');
    const estadoActual = animal.estado || 'Vivo';
    
    fila.innerHTML = `
      <td>${animal.nombreAnimal || ''}</td>
      <td>${animal.numArete || ''}</td>
      <td>${animal.sexo === 'M' || animal.sexo === true ? 'M' : 'H'}</td>
      <td>${animal.estado}</td>
      <td>
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye" aria-hidden="true"></i></button>
        <button class="btn-editar" title="Editar"><i class="fas fa-pen" aria-hidden="true"></i></button>
      </td>
    `;

    // VISUALIZAR
    fila.querySelector('.btn-ver').addEventListener('click', () => {
      const f = animal.fechaNacimiento;
      let fecha = '';
      if (Array.isArray(f) && f.length >= 3) {
        const y = String(f[0]).padStart(4,'0');
        const m = String(f[1]).padStart(2,'0');
        const d = String(f[2]).padStart(2,'0');
        fecha = `${y}-${m}-${d}`;
      } else {
        fecha = f || '';
      }

      console.debug('View animal:', animal);
      let html = `
        <div class="detalle-item">
          <strong>Nombre</strong>
          <p>${animal.nombreAnimal || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Número de Arete</strong>
          <p>${animal.numArete || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Sexo</strong>
          <p>${animal.sexo === 'M' || animal.sexo === true ? 'M' : 'H'}</p>
        </div>
        <div class="detalle-item">
          <strong>Estado</strong>
          <p>${animal.estado || 'Vivo'}</p>
        </div>
        <div class="detalle-item">
          <strong>Rebaño</strong>
          <p>${animal['rebaño'] || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Procedencia</strong>
          <p>${animal.procedencia || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Fecha Nacimiento</strong>
          <p>${fecha}</p>
        </div>
        <div class="detalle-item">
          <strong>Edad</strong>
          <p>${animal.edad != null ? animal.edad : ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Peso</strong>
          <p>${animal.pesoInicial != null ? animal.pesoInicial : ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Características</strong>
          <p>${animal.caracteristica || ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Padre (id)</strong>
          <p>${animal.idPadre != null ? animal.idPadre : ''}</p>
        </div>
        <div class="detalle-item">
          <strong>Madre (id)</strong>
          <p>${animal.idMadre != null ? animal.idMadre : ''}</p>
        </div>
      `;

      contenidoAnimal.innerHTML = html;
      modalVisualizar.style.display = 'flex';
    });

    // EDITAR
    fila.querySelector('.btn-editar').addEventListener('click', () => {
      console.debug('Editando animal:', animal);
      
      inputNombre.value = animal.nombreAnimal || '';
      inputNumArete.value = animal.numArete != null ? String(animal.numArete) : '';
      selectRebano.value = animal['rebaño'] || 'Vaca';
      selectProcedencia.value = animal.procedencia || 'Interno';
      selectSexo.value = (animal.sexo === 'M' || animal.sexo === true) ? 'M' : 'H';
      selectEstado.value = animal.estado || 'Vivo';
      
      editIndex = animales.indexOf(animal);

      // Manejar fecha de nacimiento
      const f = animal.fechaNacimiento;
      if (Array.isArray(f) && f.length >= 3) {
        const y = String(f[0]).padStart(4,'0');
        const m = String(f[1]).padStart(2,'0');
        const d = String(f[2]).padStart(2,'0');
        document.getElementById('fechaNacimiento').value = `${y}-${m}-${d}`;
      } else {
        document.getElementById('fechaNacimiento').value = f || '';
      }
      
      document.getElementById('edad').value = animal.edad != null ? animal.edad : '';
      document.getElementById('peso').value = animal.pesoInicial != null ? animal.pesoInicial : '';
      document.getElementById('caracteristicas').value = animal.caracteristica || '';
      document.getElementById('padreArete').value = animal.idPadre != null ? String(animal.idPadre) : '';
      document.getElementById('madreArete').value = animal.idMadre != null ? String(animal.idMadre) : '';

      modal.style.display = 'flex';
    });

    // Mostrar/ocultar botones según rol
    if (!isAdmin()) {
      const btnEdit = fila.querySelector('.btn-editar'); 
      if (btnEdit) btnEdit.style.display = 'none';
      const selectEst = fila.querySelector('.select-estado'); 
      if (selectEst) selectEst.style.display = 'none';
    }

    // Event listener para el select de estado
    const selectEstado = fila.querySelector('.select-estado');
    if (selectEstado) {
      selectEstado.addEventListener('change', async (e) => {
        const nuevoEstado = e.target.value;
        const idAnimal = animal.idAnimal || animal.id;
        
        if (!idAnimal) {
          mostrarAlerta('No se puede actualizar el estado sin ID del animal', 'error');
          return;
        }

        const payload = {
          idAnimal: Number(idAnimal),
          nombreAnimal: animal.nombreAnimal || '',
          numArete: animal.numArete ? Number(animal.numArete) : null,
          "rebaño": animal['rebaño'] || '',
          fechaNacimiento: animal.fechaNacimiento || null,
          pesoInicial: animal.pesoInicial != null ? Number(animal.pesoInicial) : null,
          caracteristica: animal.caracteristica || '',
          edad: animal.edad ? Number(animal.edad) : null,
          procedencia: animal.procedencia || '',
          sexo: animal.sexo === 'M' || animal.sexo === true ? "M" : "H",
          idPadre: animal.idPadre || null,
          idMadre: animal.idMadre || null,
          estado: nuevoEstado
        };

        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`http://localhost:7002/animales/${idAnimal}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Error al actualizar estado');
          }

          animal.estado = nuevoEstado;
          mostrarAlerta(`Estado actualizado a "${nuevoEstado}"`, 'success');
        } catch (err) {
          mostrarAlerta(`Error actualizando estado: ${err.message}`, 'error');
          selectEstado.value = estadoActual;
        }
      });
    }

    tbody.appendChild(fila);
  });

  tablaAnimales.appendChild(tabla);
}

// ===================================
// BUSCAR ANIMALES
// ===================================
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const resultados = animales.filter(a =>
    String(a.nombreAnimal || '').toLowerCase().includes(texto) ||
    String(a.numArete || '').toLowerCase().includes(texto)
  );
  renderizarAnimales(resultados);
});

// Cerrar modal de eliminar con ESC o click fuera
window.addEventListener('click', (e) => {
  const modalElim = document.getElementById('modalEliminarAnimal');
  if (e.target === modalElim) {
    cerrarModalEliminar();
  }
});

// Inicializar tabla: cargar desde backend
fetchAnimalsFromBackend();