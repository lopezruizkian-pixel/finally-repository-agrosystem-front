const formRegistro = document.getElementById('formRegistro');
const togglePassword = document.getElementById('togglePassword');
const inputContrasena = document.getElementById('contrasena');

togglePassword.addEventListener('click', () => {
    const tipo = inputContrasena.type === 'password' ? 'text' : 'password';
    inputContrasena.type = tipo;
    if (tipo === 'password') {
        togglePassword.classList.remove('fa-eye-slash');
        togglePassword.classList.add('fa-eye');
    } else {
        togglePassword.classList.remove('fa-eye');
        togglePassword.classList.add('fa-eye-slash');
    }
});

function mostrarMensaje(mensaje, tipo) {
    const mensajeAnterior = document.querySelector('.mensaje');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    div.textContent = mensaje;
    
    formRegistro.parentNode.insertBefore(div, formRegistro);
    div.style.display = 'block';

    setTimeout(() => {
        div.style.display = 'none';
    }, 5000);
}

function validarFormulario(datos) {
    if (datos.cargo === '') {
        mostrarMensaje('Por favor selecciona un cargo', 'error');
        return false;
    }

    if (datos.nombreCompleto.trim().length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
        return false;
    }

    if (datos.usuario.trim().length < 4) {
        mostrarMensaje('El usuario debe tener al menos 4 caracteres', 'error');
        return false;
    }

    if (datos.contrasena.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }

    if (datos.telefono.trim().length < 10) {
        mostrarMensaje('Por favor ingresa un teléfono válido', 'error');
        return false;
    }

    // validar correo
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(datos.correo)){
        mostrarMensaje('Por favor ingresa un correo válido', 'error');
        return false;
    }

    return true;
}

function guardarUsuario(usuario) {
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const usuarioExiste = usuarios.some(u => u.usuario === usuario.usuario);
    if (usuarioExiste) {
        mostrarMensaje('Este nombre de usuario ya está registrado', 'error');
        return false;
    }

    usuarios.push(usuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    return true;
}

formRegistro.addEventListener('submit', (e) => {
    e.preventDefault();

    const datosFormulario = {
        cargo: document.getElementById('cargo').value,
        nombreCompleto: document.getElementById('nombreCompleto').value,
        usuario: document.getElementById('usuario').value,
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value,
        telefono: document.getElementById('telefono').value,
        fechaRegistro: new Date().toISOString()
    };

    if (!validarFormulario(datosFormulario)) {
        return;
    }
    // Preparar payload para la API
    const payload = {
        nombreUsuario: datosFormulario.usuario,
        contrasena: datosFormulario.contrasena,
        correo: datosFormulario.correo,
        telefono: datosFormulario.telefono,
        rol: { idRol: 2 }, // idRol por defecto = 2
        activo: true
    };

    // Intentar enviar al backend; si falla, usar fallback local
    (async () => {
        try{
            const res = await fetch('http://100.30.25.253:7000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await res.text();
            let data = null;
            try{ data = text ? JSON.parse(text) : null; }catch(e){ data = text; }
                if(res.ok){
                mostrarMensaje('Registro exitoso. Redirigiendo al inicio de sesión...', 'exito');
                formRegistro.reset();
                window.location.href="/"
                //setTimeout(()=> window.location.href='/', 1400);
                return;
            } else {
                const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `Error ${res.status}`;
                mostrarMensaje(`Registro falló: ${msg}. Se intentará guardar localmente.`, 'error');
                // fallback local
                    if (guardarUsuario(datosFormulario)){
                    mostrarMensaje('Registrado localmente (modo offline).', 'exito');
                    formRegistro.reset();
                    window.location.href='/'
                    //setTimeout(()=> window.location.href='/', 1200);
                }
                return;
            }
        }catch(err){
            console.warn('Error al conectar con backend, guardando localmente', err);
            if (guardarUsuario(datosFormulario)){
                mostrarMensaje('Registrado localmente (sin conexión).', 'exito');
                formRegistro.reset();
                window.location.href='/'
                //setTimeout(()=> win   dow.location.href='/', 1200);
            }
        }
    })();
});

document.getElementById('usuario').addEventListener('blur', function() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuarioExiste = usuarios.some(u => u.usuario === this.value);
    
    if (usuarioExiste && this.value.trim() !== '') {
        mostrarMensaje('Este usuario ya está en uso', 'error');
        this.focus();
    }
});

document.getElementById('telefono').addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 10) {
        valor = valor.substring(0, 10);
    }
    e.target.value = valor;
});