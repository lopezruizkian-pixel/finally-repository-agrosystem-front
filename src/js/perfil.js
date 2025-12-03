// =======================================
// Lógica para la Alerta Personalizada
// =======================================

const alertaOverlay = document.getElementById('alerta-overlay');
const alertaHeader = document.getElementById('alerta-header');
const alertaIcon = document.getElementById('alerta-icon');
const alertaTitle = document.getElementById('alerta-title');
const alertaMessage = document.getElementById('alerta-message');
const alertaFooter = document.getElementById('alerta-footer'); 
const btnAlertaOk = document.getElementById('btn-alerta-ok'); // Botón de alerta simple/Confirmar
const btnAlertaCancel = document.getElementById('btn-alerta-cancel'); // Botón de cancelar

/**
 * Muestra la alerta personalizada.
 * @param {string} tipo - Tipo de alerta ('success', 'error', 'warning', 'info').
 * @param {string} titulo - Título de la alerta.
 * @param {string} mensaje - Mensaje principal de la alerta.
 * @param {object} [opciones] - Opciones para confirmación o callback simple.
 * @param {string} [opciones.confirmText] - Texto para el botón de confirmación (ej: 'Cerrar Sesión').
 * @param {function} [opciones.onConfirm] - Función a ejecutar al presionar el botón de confirmación.
 * @param {function} [opciones.callback] - Función para alertas simples.
 */
function mostrarAlerta(tipo, titulo, mensaje, opciones = {}) {
    if (!alertaOverlay) return; 

    // Limpiar clases y asignar contenido
    alertaHeader.className = 'alerta-header';
    alertaIcon.className = 'alerta-icon fas';
    alertaFooter.className = 'alerta-footer'; 

    alertaHeader.classList.add(tipo);
    alertaTitle.textContent = titulo;
    alertaMessage.textContent = mensaje;

    let iconoClase = '';
    switch (tipo) {
        case 'success': iconoClase = 'fa-check-circle'; break;
        case 'error': iconoClase = 'fa-times-circle'; break;
        case 'warning': iconoClase = 'fa-exclamation-triangle'; break;
        case 'info': iconoClase = 'fa-info-circle'; break;
        default: iconoClase = 'fa-exclamation-circle'; break;
    }
    alertaIcon.classList.add(iconoClase);

    // Determinar si es una Confirmación de doble botón
    const esConfirmacion = opciones.confirmText && opciones.onConfirm;

    if (esConfirmacion) {
        // Modo Confirmación (Doble Botón)
        alertaFooter.classList.add('confirmacion'); 
        btnAlertaOk.textContent = opciones.confirmText;
        btnAlertaOk.classList.remove('btn-alerta-ok');
        btnAlertaOk.classList.add('btn-alerta-confirmacion'); // Usar el estilo rojo
        
        btnAlertaCancel.style.display = 'inline-block';
        btnAlertaOk.style.display = 'inline-block';

        // Manejar Confirmar
        btnAlertaOk.onclick = function() {
            alertaOverlay.classList.remove('active');
            setTimeout(opciones.onConfirm, 300); // Ejecutar callback de confirmación
        };
        // Manejar Cancelar
        btnAlertaCancel.onclick = function() {
            alertaOverlay.classList.remove('active');
        };

    } else {
        // Modo Alerta Simple (Un Botón)
        btnAlertaOk.textContent = 'Aceptar';
        btnAlertaOk.classList.remove('btn-alerta-confirmacion');
        btnAlertaOk.classList.add('btn-alerta-ok'); // Usar el estilo verde/simple
        
        btnAlertaCancel.style.display = 'none';
        btnAlertaOk.style.display = 'inline-block';
        alertaFooter.classList.remove('confirmacion');

        // Manejar Aceptar (Alerta Simple)
        btnAlertaOk.onclick = function() {
            alertaOverlay.classList.remove('active');
            if (opciones.callback) setTimeout(opciones.callback, 300); // Ejecutar callback simple
        };
    }

    // Mostrar la alerta
    alertaOverlay.classList.add('active');
    
    // Cierre al hacer clic fuera del contenedor
    alertaOverlay.onclick = function(event) {
        if (event.target === alertaOverlay) {
            alertaOverlay.classList.remove('active');
        }
    }
}


// =======================================
// Lógica de Autenticación y Carga de Datos
// =======================================

const usuarioGuardado = localStorage.getItem('usuarioAgroSystem');
if (!usuarioGuardado) {
    window.location.href = '../../index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosUsuario();
});

function cargarDatosUsuario() {
    (async () => {
        const datosUsuario = (() => {
            try { return JSON.parse(localStorage.getItem('datosUsuarioAgroSystem')); } catch(e){ return null; }
        })();

        // Intentar obtener perfil desde backend para tener datos más completos
        const perfilServidor = await fetchUsuarioPerfil();

        // Preferir datos del servidor si están disponibles
        const infoCompleta = perfilServidor ? perfilServidor : (datosUsuario || {});

        // Mapear campos con tolerancia a nombres distintos
        const nombreCompleto = infoCompleta.nombreCompleto || infoCompleta.nombreUsuario || infoCompleta.nombre || '';
        const usuarioName = infoCompleta.usuario || infoCompleta.nombreUsuario || (datosUsuario && datosUsuario.usuario) || '';
        const telefono = infoCompleta.telefono || infoCompleta.celular || infoCompleta.phone || '';
        const rolObj = infoCompleta.rol || {};
        const rolTexto = infoCompleta.rolNombre || ((typeof rolObj === 'string') ? rolObj : (rolObj.nombre || (rolObj.idRol === 1 ? 'Administrador' : (rolObj.nombre || ''))));
        const fechaRegistroRaw = infoCompleta.fechaRegistro || infoCompleta.createdAt || infoCompleta.fechaCreacion || null;
        const fechaLoginRaw = infoCompleta.fechaLogin || infoCompleta.ultimoAcceso || null;

        const el = id => document.getElementById(id);
        if (el('nombreUsuario')) el('nombreUsuario').textContent = nombreCompleto || usuarioName || '';
        if (el('rolUsuario')) el('rolUsuario').textContent = (rolTexto === 'admin' || rolTexto === 'Administrador') ? 'Administrador' : capitalize(String(rolTexto || ''));
        if (el('nombreCompleto')) el('nombreCompleto').textContent = nombreCompleto || '';
        if (el('usuario')) el('usuario').textContent = usuarioName || '';
        if (el('cargo')) el('cargo').textContent = (rolTexto === 'admin' || rolTexto === 'Administrador') ? 'Administrador' : capitalize(String(rolTexto || ''));
        if (el('telefono')) el('telefono').textContent = telefono || 'No especificado';

        if (fechaRegistroRaw) {
            try {
                const fechaReg = new Date(fechaRegistroRaw);
                if (!isNaN(fechaReg)) {
                    if (el('fechaRegistro')) el('fechaRegistro').textContent = formatearFecha(fechaReg);
                } else if (el('fechaRegistro')) {
                    el('fechaRegistro').textContent = String(fechaRegistroRaw);
                }
            } catch(e) { if (el('fechaRegistro')) el('fechaRegistro').textContent = 'No disponible'; }
        } else { if (el('fechaRegistro')) el('fechaRegistro').textContent = 'No disponible'; }

        if (fechaLoginRaw) {
            try {
                const fechaLogin = new Date(fechaLoginRaw);
                if (!isNaN(fechaLogin)) {
                    if (el('ultimoAcceso')) el('ultimoAcceso').textContent = formatearFechaHora(fechaLogin);
                } else if (el('ultimoAcceso')) {
                    el('ultimoAcceso').textContent = String(fechaLoginRaw);
                }
            } catch(e) { if (el('ultimoAcceso')) el('ultimoAcceso').textContent = 'Ahora'; }
        } else { if (el('ultimoAcceso')) el('ultimoAcceso').textContent = 'Ahora'; }
    })();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function formatearFechaHora(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function volverHome() {
    window.location.href = './home.html';
}

// --- Helpers para auth y resolución de usuario ---
async function resolveUsuarioId(candidate) {
    if (candidate == null || candidate === '') return '';
    if (!isNaN(Number(candidate))) return Number(candidate);
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
            const uFields = [u.usuario, u.nombreUsuario, u.nombre, u.username, u.email];
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
            idUsuarioCandidate = datos.idUsuario || datos.usuario || datos.id || datos.usuarioId || '';
        } catch (e) {
            idUsuarioCandidate = datosStr;
        }
    }
    const resolved = await resolveUsuarioId(idUsuarioCandidate);
    const idHeader = resolved !== '' ? String(resolved) : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Id-Usuario': idHeader
    };
}

// Obtener perfil de usuario desde API (por id o buscando por nombre)
async function fetchUsuarioPerfil() {
    try {
        const datosStr = localStorage.getItem('datosUsuarioAgroSystem') || sessionStorage.getItem('datosUsuarioAgroSystem') || null;
        if (!datosStr) return null;
        let candidate = '';
        try { const datos = JSON.parse(datosStr); candidate = datos.idUsuario || datos.id || datos.usuario || datos.nombreUsuario || ''; } catch(e) { candidate = datosStr; }

        const headers = await getAuthHeaders();

        // Si candidate es numérico, intentar GET /usuarios/{id}
        if (candidate && !isNaN(Number(candidate))) {
            const id = Number(candidate);
            const res = await fetch(`http://localhost:7002/usuarios/${id}`, { method: 'GET', headers });
            if (res.ok) {
                const obj = await res.json().catch(() => null);
                if (obj) return obj;
            }
        }

        // Si no se obtuvo por id, buscar en la lista
        const resAll = await fetch('http://localhost:7002/usuarios', { method: 'GET', headers });
        if (!resAll.ok) return null;
        const list = await resAll.json().catch(() => null);
        if (!Array.isArray(list)) return null;

        const lower = String(candidate).toLowerCase();
        const found = list.find(u => {
            const uFields = [u.usuario, u.nombreUsuario, u.nombre, u.username, u.email];
            return uFields.some(f => f && String(f).toLowerCase() === lower);
        });
        return found || null;
    } catch (e) {
        console.error('fetchUsuarioPerfil error', e);
        return null;
    }
}

// =======================================
// Función de Cerrar Sesión Modificada (Usa la Confirmación)
// =======================================

function cerrarSesion() {
    // Esto mostrará la alerta con encabezado rojo y doble botón.
    mostrarAlerta(
        'error', 
        'Cerrar Sesión', 
        '¿Estás seguro de que deseas cerrar la sesión actual de AGROSYSTEM?', 
        {
            confirmText: 'Cerrar Sesión', // El texto del botón de acción (rojo)
            onConfirm: () => {
                // Lógica que se ejecuta al presionar "Cerrar Sesión"
                try { localStorage.removeItem('usuarioAgroSystem'); } catch(e){}
                try { localStorage.removeItem('datosUsuarioAgroSystem'); } catch(e){}
                try { sessionStorage.removeItem('datosUsuarioAgroSystem'); } catch(e){}
                try { localStorage.removeItem('token'); } catch(e){}
                try { sessionStorage.removeItem('token'); } catch(e){}
                window.location.href = '../../index.html';
            }
        }
    );
}