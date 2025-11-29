// Verificar usuario
const usuarioGuardado = localStorage.getItem('usuarioAgroSystem');
if (!usuarioGuardado) {
    window.location.href = '../../index.html';
}

// Elementos del DOM
const listaVacas = document.getElementById('listaVacas');
const btnIrEstadisticas = document.getElementById('btnIrEstadisticas');
// filtros
const filtroSexo = document.getElementById('filtroSexo');
const filtroRebano = document.getElementById('filtroRebano');

// Arreglo de vacas (nombre + sexo)
// Each animal may have: { nombre, sexo, rebano }
let vacas = [];

// Helper to include auth headers if token exists
function getAuthHeadersLocal(){
  const token = localStorage.getItem('token') || '';
  const datosUsuario = localStorage.getItem('datosUsuarioAgroSystem') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(datosUsuario ? { 'Id-Usuario': datosUsuario } : {})
  };
}

// Fetch animals from backend and map to local shape
async function fetchAnimalesBackend(){
  try{
    const res = await fetch('http://100.30.25.253:7000/animales', { headers: getAuthHeadersLocal() });
    const text = await res.text();
    if(!res.ok){ console.error('Error cargando animales', res.status, text); return []; }
    let data = [];
    if(text){
      try{ data = JSON.parse(text); }catch(e){ console.warn('fetchAnimalesBackend: response not JSON', text); return []; }
    }
    // Map backend shape to local shape
    const mapped = (data || []).map(a => ({
      idAnimal: a.idAnimal || a.id,
      nombre: a.nombreAnimal || a.nombre || '',
      numArete: a.numArete || a.numArete === 0 ? String(a.numArete) : '',
      rebano: a['rebaño'] || a.rebano || '',
      fechaNacimiento: Array.isArray(a.fechaNacimiento) ? a.fechaNacimiento.join('-') : (a.fechaNacimiento || ''),
      pesoInicial: a.pesoInicial || a.peso || a.pesoInicial === 0 ? a.pesoInicial : '',
      caracteristica: a.caracteristica || a.característica || '',
      edad: a.edad || '',
      procedencia: a.procedencia || a.procedencia || '',
      sexo: (typeof a.sexo === 'boolean') ? (a.sexo ? 'Macho' : 'Hembra') : (a.sexo || '')
    }));
    vacas = mapped;
    aplicarFiltros();
    return mapped;
  }catch(err){ console.error(err); return []; }
}

// ===================================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ===================================

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

// ===================================
// FIN SISTEMA DE ALERTAS
// ===================================

// Mostrar nombre del usuario en el header
document.addEventListener('DOMContentLoaded', function() {
  const datosUsuario = JSON.parse(localStorage.getItem('datosUsuarioAgroSystem'));
  if (datosUsuario) {
    const bienvenidaElement = document.getElementById('bienvenidaUsuario');
    if (bienvenidaElement) {
      bienvenidaElement.textContent = `Bienvenido, ${datosUsuario.nombre}`;
    }
  }
});

// Función para renderizar lista de vacas
function renderizarLista(lista = vacas) {
  if(!listaVacas) return;
  listaVacas.innerHTML = '';
  if(!lista || lista.length === 0){
    listaVacas.innerHTML = '<div class="no-data">No hay animales para mostrar.</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  lista.forEach((vaca) => {
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${vaca.nombre || '—'}</h3>
        <span class="card-arete">Arete: ${vaca.numArete || '—'}</span>
      </div>
      <div class="card-body">
        <p><strong>Sexo:</strong> ${vaca.sexo || '—'}</p>
        <p><strong>Rebaño:</strong> ${vaca.rebano || '—'}</p>
        <p><strong>Edad:</strong> ${vaca.edad || '—'}</p>
        <p><strong>Peso inicial:</strong> ${vaca.pesoInicial || '—'}</p>
        <p class="card-desc">${vaca.caracteristica || ''}</p>
      </div>
    `;
    fragment.appendChild(card);
  });
  listaVacas.appendChild(fragment);
}

// Quitar funcionalidad de agregar en Home: el botón fue eliminado en el HTML

// Botón para ir a estadísticas
btnIrEstadisticas.addEventListener('click', () => {
  localStorage.setItem('vacas', JSON.stringify(vacas));
  window.location.href = './estadisticas.html';
});

// Función para ir al perfil
function irPerfil() {
  window.location.href = './perfil.html';
}

// Funciones del modal de cerrar sesión
function abrirModalCerrarSesion() {
  const modal = document.getElementById('modalCerrarSesion');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalCerrarSesion() {
  const modal = document.getElementById('modalCerrarSesion');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function confirmarCerrarSesion() {
  localStorage.removeItem('usuarioAgroSystem');
  localStorage.removeItem('datosUsuarioAgroSystem');
  window.location.href = '../../index.html';
}

// Cerrar modal al hacer clic fuera o con ESC
window.addEventListener('click', (event) => {
  const modal = document.getElementById('modalCerrarSesion');
  if (event.target === modal) cerrarModalCerrarSesion();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const modal = document.getElementById('modalCerrarSesion');
    if (modal.classList.contains('active')) cerrarModalCerrarSesion();
  }
});

// Aplicar filtros y renderizar inicialmente
function aplicarFiltros(){
  const sexoSel = filtroSexo ? filtroSexo.value : 'Todos';
  const rebanoSel = filtroRebano ? filtroRebano.value : 'Todos';

  let filtrados = vacas.slice();
  if(sexoSel && sexoSel !== 'Todos'){
    filtrados = filtrados.filter(v => String(v.sexo).toLowerCase() === String(sexoSel).toLowerCase());
  }
  if(rebanoSel && rebanoSel !== 'Todos'){
    filtrados = filtrados.filter(v => String(v.rebano).toLowerCase() === String(rebanoSel).toLowerCase());
  }
  renderizarLista(filtrados);
}

// Listeners para filtros
if(filtroSexo) filtroSexo.addEventListener('change', aplicarFiltros);
if(filtroRebano) filtroRebano.addEventListener('change', aplicarFiltros);

// Inicial: cargar animales desde backend
fetchAnimalesBackend();