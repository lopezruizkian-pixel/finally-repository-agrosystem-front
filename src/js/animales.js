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

// Función para poblar opciones de rebaño según sexo
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
// ROLES Y PERMISOS
// ===================================
function getCurrentUserRole() {
  const datosStr = sessionStorage.getItem('datosUsuarioAgroSystem') || localStorage.getItem('datosUsuarioAgroSystem') || null;
  if (!datosStr) return '';
  try {
    const datos = JSON.parse(datosStr);
    let role = datos.rolNombre || (datos.rol && datos.rol.nombre) || datos.rol || '';
    if (datos.rol && datos.rol.idRol) {
        if(datos.rol.idRol === 1) return 'administrador';
        return String(datos.rol.nombre || '').toLowerCase();
    }
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
    return r.includes('admin') || r.includes('administrador') || r === '1'; 
}

// ===================================
// ALERTAS
// ===================================
if (!document.querySelector('.alerta-overlay')) {
    const modalAlerta = document.createElement('div');
    modalAlerta.classList.add('alerta-overlay');
    modalAlerta.innerHTML = `
      <div class="alerta-container">
        <div class="alerta-header" id="alertaHeader">
          <i class="fas fa-info-circle alerta-icon" id="alertaIcon"></i>
          <h3 class="alerta-title" id="alertaTitle">Alerta</h3>
        </div>
        <div class="alerta-body"><p class="alerta-message" id="alertaMessage"></p></div>
        <div class="alerta-footer"><button class="btn-alerta-ok" id="btnAlertaOk">Aceptar</button></div>
      </div>
    `;
    document.body.appendChild(modalAlerta);
    
    const btnOk = modalAlerta.querySelector('#btnAlertaOk');
    if(btnOk) btnOk.addEventListener('click', () => {
        modalAlerta.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const overlay = document.querySelector('.alerta-overlay');
    const header = document.getElementById('alertaHeader');
    const msg = document.getElementById('alertaMessage');
    
    if (header) {
        header.className = 'alerta-header ' + tipo;
        // Iconos simples basados en clase
        const icon = document.getElementById('alertaIcon');
        if(icon) {
            icon.className = 'fas alerta-icon ' + (tipo === 'success' ? 'fa-check-circle' : (tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'));
        }
    }
    if (msg) msg.textContent = mensaje;
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        alert(mensaje);
    }
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
    // IMPORTANTE: cache: 'no-store' para evitar datos viejos
    const res = await fetch('http://192.168.1.17:7002/animales', { 
        method: 'GET', 
        headers,
        cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error('Error al cargar animales');
    const list = await res.json();
    
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
        
        // Construimos el payload asegurando tipos
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
        
        console.log("Enviando UPDATE:", payload); // Depuración

        const res = await fetch(`http://192.168.1.17:7002/animales/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Servidor respondió: ${txt}`);
        }
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
  
  const esAdmin = isAdmin();

  lista.forEach(animal => {
    const fila = document.createElement('tr');
    
    // LÓGICA: Admin (Ver + Editar), Otros (Ver)
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

    // EVENTO VER
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

    // EVENTO EDITAR
    const btnEdit = fila.querySelector('.btn-editar');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            // Llenar campos
            if (inputNombre) inputNombre.value = animal.nombreAnimal || '';
            if (inputNumArete) inputNumArete.value = animal.numArete || '';
            
            const sexoVal = (animal.sexo === 'M' || animal.sexo === true) ? 'M' : 'H';
            if (selectSexo) {
                selectSexo.value = sexoVal;
                populateRebanoOptions(sexoVal);
            }
            
            // setTimeout pequeño para asegurar que las opciones de rebaño se pintaron
            setTimeout(() => {
                if (selectRebano) selectRebano.value = animal['rebaño'] || 'Vaca';
            }, 0);

            if (selectProcedencia) selectProcedencia.value = animal.procedencia || 'Interno';
            if (selectEstado) selectEstado.value = animal.estado || 'Vivo';
            
            // Validar existencia de elementos del modal antes de asignar
            const setIf = (id, val) => {
                const el = document.getElementById(id);
                if(el) el.value = (val !== null && val !== undefined) ? val : '';
            };
            
            // Fecha
            let fechaStr = '';
            if(Array.isArray(animal.fechaNacimiento) && animal.fechaNacimiento.length >= 3) {
                 const y = String(animal.fechaNacimiento[0]).padStart(4,'0');
                 const m = String(animal.fechaNacimiento[1]).padStart(2,'0');
                 const d = String(animal.fechaNacimiento[2]).padStart(2,'0');
                 fechaStr = `${y}-${m}-${d}`;
            } else {
                fechaStr = animal.fechaNacimiento || '';
            }
            setIf('fechaNacimiento', fechaStr);
            setIf('edad', animal.edad);
            setIf('peso', animal.pesoInicial);
            setIf('caracteristicas', animal.caracteristica);
            setIf('padreArete', animal.idPadre);
            setIf('madreArete', animal.idMadre);

            editIndex = animales.indexOf(animal);
            const tModal = document.getElementById('tituloModal');
            if(tModal) tModal.textContent = 'Editar Animal';
            
            modal.style.display = 'flex';
        });
    }

    tbody.appendChild(fila);
  });
  tablaAnimales.appendChild(tabla);
}

// ===========================
// MANEJO DEL MODAL
// ===========================

// Botón Agregar (Admin)
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
    // Limpiar inputs seguros
    const clear = id => { const el = document.getElementById(id); if(el) el.value = ''; };
    clear('fechaNacimiento');
    clear('edad');
    clear('peso');
    clear('caracteristicas');
    clear('padreArete');
    clear('madreArete');
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
            const id = animales[editIndex].idAnimal;
            updateAnimalBackend(data, id).then(res => {
                if(res.success) {
                    modal.style.display = 'none';
                    mostrarAlerta('Animal editado correctamente', 'success');
                    // Esperar un poco antes de recargar para asegurar que el backend procesó
                    setTimeout(() => fetchAnimalsFromBackend(), 300);
                } else {
                    mostrarAlerta('Error: ' + res.error, 'error');
                }
            });
        } else {
            sendAnimalToBackend(data).then(res => {
                if(res.success) {
                    modal.style.display = 'none';
                    mostrarAlerta('Animal agregado correctamente', 'success');
                    setTimeout(() => fetchAnimalsFromBackend(), 300);
                } else {
                    mostrarAlerta('Error: ' + res.error, 'error');
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