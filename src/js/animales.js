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

// Ocultar grupo rebaño inicialmente
const rebanoGroup = selectRebano ? selectRebano.closest('.form-group') : null;
if (rebanoGroup) {
  rebanoGroup.style.display = 'none';
}

/**
 * Poblar opciones de rebaño según sexo
 */
function populateRebanoOptions(sexo) {
  if (!selectRebano) return;
  const s = String(sexo || '').toUpperCase();
  const opts = [];
  if (s === 'H') {
    opts.push({ v: 'Vaca', t: 'Vaca' });
    opts.push({ v: 'Becerra', t: 'Becerra' });
  } else if (s === 'M') {
    opts.push({ v: 'Toro', t: 'Toro' });
    opts.push({ v: 'Becerro', t: 'Becerro' });
  } else {
    opts.push({ v: 'Vaca', t: 'Vaca' });
    opts.push({ v: 'Toro', t: 'Toro' });
  }

  selectRebano.innerHTML = '';
  opts.forEach(o => {
    const option = document.createElement('option');
    option.value = o.v;
    option.textContent = o.t;
    selectRebano.appendChild(option);
  });

  if (rebanoGroup) rebanoGroup.style.display = '';
}

// Cambio de sexo -> actualizar rebaño
if (selectSexo) {
  selectSexo.addEventListener('change', (e) => {
    populateRebanoOptions(e.target.value);
  });
}

// Modal Visualizar
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

// ===================================
// ROLES Y PERMISOS (MEJORADO)
// ===================================
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try {
    const datos = JSON.parse(datosStr);
    // Intenta obtener el nombre del rol o el ID si es un objeto, o el valor directo
    let role = datos.rolNombre || (datos.rol && datos.rol.nombre) || datos.rol || '';
    
    // Si el rol es un objeto con idRol
    if (datos.rol && datos.rol.idRol) {
        if(datos.rol.idRol === 1) return 'administrador';
        return String(datos.rol.nombre || '').toLowerCase();
    }
    // Si el rol es numérico (1 = admin)
    if (role === 1 || role === '1') return 'administrador';
    
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
    // Se asegura de cubrir todas las variantes de administrador
    return r.includes('admin') || r.includes('administrador') || r === '1'; 
}

// ===================================
// ALERTAS
// ===================================
// (Código de alertas abreviado para no ocupar espacio innecesario, asumiendo que el CSS ya existe o se inyecta)
if (!document.getElementById('estilos-alertas')) {
    const s = document.createElement('style');
    s.id = 'estilos-alertas';
    // Se asume que los estilos de alerta ya están en tu CSS o se cargan aquí
    document.head.appendChild(s);
}

function mostrarAlerta(mensaje, tipo = 'info') {
  // Implementación simple reutilizando tu estructura o creando una nueva si no existe
  let overlay = document.querySelector('.alerta-overlay');
  if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'alerta-overlay';
      overlay.innerHTML = `<div class="alerta-container"><div class="alerta-body"><p id="msgAlerta"></p></div><div class="alerta-footer"><button class="btn-alerta-ok">OK</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('button').onclick = () => { overlay.classList.remove('active'); };
  }
  const p = overlay.querySelector('#msgAlerta') || overlay.querySelector('p');
  if(p) p.textContent = mensaje;
  overlay.classList.add('active');
}


// ===================================
// API
// ===================================
async function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem');
  let idUsuario = '';
  if (datosStr) {
      try { const d = JSON.parse(datosStr); idUsuario = d.idUsuario || d.id || d.usuario || ''; } 
      catch (e) { idUsuario = datosStr; }
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Id-Usuario': String(idUsuario)
  };
}

async function fetchAnimalsFromBackend() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('http://192.168.1.17:7002/animales', { method: 'GET', headers });
    if (!res.ok) throw new Error('Error al cargar animales');
    const list = await res.json();
    
    // MAPEO DE DATOS
    animales = list.map(a => ({
      idAnimal: a.idAnimal || a.id,
      nombreAnimal: a.nombreAnimal || a.nombre || '',
      numArete: a.numArete,
      'rebaño': a['rebaño'] || a.rebano || 'Vaca',
      procedencia: a.procedencia || 'Interno',
      sexo: a.sexo || 'H',
      estado: a.estado || 'Vivo',
      fechaNacimiento: a.fechaNacimiento,
      edad: a.edad,
      pesoInicial: (a.pesoInicial !== undefined) ? a.pesoInicial : (a.peso || null),
      caracteristica: a.caracteristica || a.caracteristicas || '',
      idPadre: a.idPadre,
      idMadre: a.idMadre
    }));
    
    renderizarAnimales();
  } catch (err) {
    console.error(err);
    mostrarAlerta('Error conectando con el servidor', 'error');
  }
}

async function updateAnimalBackend(animal, id) {
    try {
        const headers = await getAuthHeaders();
        const sexoBool = (animal.sexo === 'M');
        const payload = {
            idAnimal: Number(id),
            nombreAnimal: animal.nombre,
            numArete: Number(animal.numArete),
            "rebaño": animal.rebano,
            fechaNacimiento: animal.fechaNacimiento || null,
            pesoInicial: animal.pesoInicial ? Number(animal.pesoInicial) : null,
            caracteristica: animal.caracteristica,
            edad: animal.edad ? Number(animal.edad) : null,
            procedencia: animal.procedencia,
            sexo: sexoBool ? "M" : "H",
            idPadre: animal.padreArete ? Number(animal.padreArete) : null,
            idMadre: animal.madreArete ? Number(animal.madreArete) : null,
            estado: animal.estado
        };
        const res = await fetch(`http://192.168.1.17:7002/animales/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error actualizando');
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}

async function sendAnimalToBackend(animal) {
    try {
        const headers = await getAuthHeaders();
        const sexoBool = (animal.sexo === 'M');
        const payload = {
            nombreAnimal: animal.nombre,
            numArete: Number(animal.numArete),
            "rebaño": animal.rebano,
            fechaNacimiento: animal.fechaNacimiento || null,
            pesoInicial: animal.pesoInicial ? Number(animal.pesoInicial) : null,
            caracteristica: animal.caracteristica,
            edad: animal.edad ? Number(animal.edad) : null,
            procedencia: animal.procedencia,
            sexo: sexoBool ? "M" : "H",
            idPadre: animal.padreArete ? Number(animal.padreArete) : null,
            idMadre: animal.madreArete ? Number(animal.madreArete) : null,
            estado: animal.estado
        };
        const res = await fetch('http://192.168.1.17:7002/animales', {
            method: 'POST', headers, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error creando');
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}

// ===================================
// RENDERIZADO
// ===================================

function renderizarAnimales(lista = animales) {
  tablaAnimales.innerHTML = '';
  if (lista.length === 0) {
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
  
  // Verificar permisos
  const esAdmin = isAdmin();

  lista.forEach(animal => {
    const fila = document.createElement('tr');
    
    // LÓGICA DE BOTONES SOLICITADA:
    // Admin: Ver + Editar (Sin Eliminar)
    // Veterinario: Solo Ver
    let botonesHTML = `
        <button class="btn-ver" title="Ver detalles"><i class="fas fa-eye"></i></button>
    `;
    
    if (esAdmin) {
        botonesHTML += `
            <button class="btn-editar" title="Editar"><i class="fas fa-pen"></i></button>
        `;
    }

    fila.innerHTML = `
      <td>${animal.nombreAnimal || ''}</td>
      <td>${animal.numArete || ''}</td>
      <td>${(animal.sexo === 'M' || animal.sexo === true) ? 'M' : 'H'}</td>
      <td>${animal.estado}</td>
      <td>${botonesHTML}</td>
    `;

    // --- EVENTO VER ---
    fila.querySelector('.btn-ver').addEventListener('click', () => {
        let fecha = '';
        if(Array.isArray(animal.fechaNacimiento)) {
            fecha = animal.fechaNacimiento.slice(0,3).map(n=>String(n).padStart(2,'0')).join('-');
        } else {
            fecha = animal.fechaNacimiento || '';
        }
        
        contenidoAnimal.innerHTML = `
            <div class="detalle-item"><strong>Nombre:</strong> ${animal.nombreAnimal}</div>
            <div class="detalle-item"><strong>Arete:</strong> ${animal.numArete}</div>
            <div class="detalle-item"><strong>Rebaño:</strong> ${animal['rebaño']}</div>
            <div class="detalle-item"><strong>Fecha Nac:</strong> ${fecha}</div>
            <div class="detalle-item"><strong>Edad:</strong> ${animal.edad || ''}</div>
            <div class="detalle-item"><strong>Peso:</strong> ${animal.pesoInicial || ''}</div>
            <div class="detalle-item"><strong>Estado:</strong> ${animal.estado}</div>
            <div class="detalle-item"><strong>Características:</strong> ${animal.caracteristica}</div>
        `;
        modalVisualizar.style.display = 'flex';
    });

    // --- EVENTO EDITAR (Solo si el botón existe) ---
    const btnEdit = fila.querySelector('.btn-editar');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            // 1. Llenar campos básicos (seguros)
            if(inputNombre) inputNombre.value = animal.nombreAnimal || '';
            if(inputNumArete) inputNumArete.value = animal.numArete || '';
            
            // Sexo y Rebaño
            const sVal = (animal.sexo === 'M' || animal.sexo === true) ? 'M' : 'H';
            if(selectSexo) {
                selectSexo.value = sVal;
                populateRebanoOptions(sVal);
            }
            if(selectRebano) selectRebano.value = animal['rebaño'] || 'Vaca';
            if(selectProcedencia) selectProcedencia.value = animal.procedencia || 'Interno';
            if(selectEstado) selectEstado.value = animal.estado || 'Vivo';
            
            // 2. Llenar campos con VALIDACIÓN DE EXISTENCIA (Corrección del TypeError)
            const setIfExist = (id, val) => {
                const el = document.getElementById(id);
                if(el) el.value = (val !== null && val !== undefined) ? val : '';
            };
            
            // Fecha (convertir array a string YYYY-MM-DD)
            let fechaStr = '';
            if(Array.isArray(animal.fechaNacimiento) && animal.fechaNacimiento.length >= 3) {
                 const y = String(animal.fechaNacimiento[0]).padStart(4,'0');
                 const m = String(animal.fechaNacimiento[1]).padStart(2,'0');
                 const d = String(animal.fechaNacimiento[2]).padStart(2,'0');
                 fechaStr = `${y}-${m}-${d}`;
            } else {
                fechaStr = animal.fechaNacimiento || '';
            }
            setIfExist('fechaNacimiento', fechaStr);
            
            setIfExist('edad', animal.edad);
            setIfExist('peso', animal.pesoInicial);
            setIfExist('caracteristicas', animal.caracteristica);
            setIfExist('padreArete', animal.idPadre);
            setIfExist('madreArete', animal.idMadre);

            editIndex = animales.indexOf(animal);
            // Cambiar título del modal
            const tModal = document.getElementById('tituloModal');
            if(tModal) tModal.textContent = 'Editar Animal';
            
            modal.style.display = 'flex';
        });
    }

    tbody.appendChild(fila);
  });
  tablaAnimales.appendChild(tabla);
}

// ===================================
// EVENTOS GLOBALES
// ===================================

// Botón Agregar (Solo visible para Admin)
if (btnAgregar) {
    if (isAdmin()) {
        btnAgregar.style.display = 'flex'; 
        btnAgregar.addEventListener('click', () => {
            limpiarModal();
            const tModal = document.getElementById('tituloModal');
            if(tModal) tModal.textContent = 'Agregar Animal';
            modal.style.display = 'flex';
        });
    } else {
        btnAgregar.style.display = 'none';
    }
}

// Cerrar modales
if (btnCerrarModal) btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
if (btnCerrarVisualizar) btnCerrarVisualizar.addEventListener('click', () => modalVisualizar.style.display = 'none');
window.addEventListener('click', (e) => {
    if(e.target === modal) modal.style.display = 'none';
    if(e.target === modalVisualizar) modalVisualizar.style.display = 'none';
});

function limpiarModal() {
    editIndex = null;
    if(inputNombre) inputNombre.value = '';
    if(inputNumArete) inputNumArete.value = '';
    if(selectSexo) selectSexo.value = '';
    if(selectRebano) selectRebano.innerHTML = '';
    
    const clearIds = ['fechaNacimiento', 'edad', 'peso', 'caracteristicas', 'padreArete', 'madreArete'];
    clearIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

// Guardar
if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
        
        const data = {
            nombre: inputNombre.value.trim(),
            numArete: inputNumArete.value.trim(),
            rebano: selectRebano ? selectRebano.value : '',
            procedencia: selectProcedencia ? selectProcedencia.value : '',
            sexo: selectSexo ? selectSexo.value : '',
            estado: selectEstado ? selectEstado.value : '',
            fechaNacimiento: getVal('fechaNacimiento'),
            edad: getVal('edad'),
            pesoInicial: getVal('peso'),
            caracteristica: getVal('caracteristicas'),
            padreArete: getVal('padreArete'),
            madreArete: getVal('madreArete')
        };

        if (!data.nombre || !data.numArete || !data.sexo) {
            mostrarAlerta('Faltan campos obligatorios', 'warning');
            return;
        }

        if (editIndex !== null) {
            // EDITAR
            const id = animales[editIndex].idAnimal;
            updateAnimalBackend(data, id).then(res => {
                if(res.success) {
                    fetchAnimalsFromBackend();
                    modal.style.display = 'none';
                    mostrarAlerta('Animal editado correctamente', 'success');
                } else {
                    mostrarAlerta('Error al editar', 'error');
                }
            });
        } else {
            // AGREGAR
            sendAnimalToBackend(data).then(res => {
                if(res.success) {
                    fetchAnimalsFromBackend();
                    modal.style.display = 'none';
                    mostrarAlerta('Animal agregado correctamente', 'success');
                } else {
                    mostrarAlerta('Error al agregar', 'error');
                }
            });
        }
    });
}

// Buscador
if (buscador) {
    buscador.addEventListener('input', () => {
        const txt = buscador.value.toLowerCase();
        const filtrados = animales.filter(a => 
            String(a.nombreAnimal).toLowerCase().includes(txt) || 
            String(a.numArete).includes(txt)
        );
        renderizarAnimales(filtrados);
    });
}

// Inicializar
fetchAnimalsFromBackend();