// =============================================
// MODALES DE LOGIN, REGISTRO Y PERFIL
// =============================================

// Abrir modal de login
function abrirModalLogin() {
    console.log('Abriendo modal de login');
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('No se encontró el elemento auth-modal');
        return;
    }

    modal.innerHTML = `
        <div class="modal">
            <button class="modal-close" onclick="cerrarModal()">✕</button>
            <div class="modal-tabs">
                <div class="modal-tab active" onclick="cambiarTabModal('login')">Iniciar Sesión</div>
                <div class="modal-tab" onclick="cambiarTabModal('registro')">Crear Cuenta</div>
            </div>

            <div class="modal-form active" id="login-form">
                <h2>Iniciar Sesión</h2>
                <form onsubmit="return iniciarSesionModal(event)">
                    <div class="form-group">
                        <input type="email" id="login-email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="login-password" placeholder="Contraseña" required>
                    </div>
                    <button type="submit" class="btn-modal">Entrar</button>
                </form>
                <div class="modal-switch">
                    ¿No tienes cuenta? <a onclick="cambiarTabModal('registro')">Regístrate</a>
                </div>
            </div>

            // DENTRO DE abrirModalLogin, en la sección de registro-form
<div class="modal-form" id="registro-form">
    <h2>Crear Cuenta</h2>
    <form onsubmit="return registrarUsuarioModal(event)">
        <div class="form-group">
            <input type="text" id="reg-nombre" placeholder="Nombre completo" required>
        </div>
        <div class="form-group">
            <input type="email" id="reg-email" placeholder="Email" required>
        </div>
        <div class="form-group">
            <input type="password" id="reg-password" placeholder="Contraseña" required oninput="validarPasswordModal()">
        </div>
        <div class="password-requirements" id="password-requirements">
            <p>Requisitos:</p>
            <div class="requirement" id="req-length">✓ 6+ caracteres</div>
            <div class="requirement" id="req-uppercase">✓ 1 mayúscula</div>
            <div class="requirement" id="req-number">✓ 1 número</div>
        </div>
        <div class="form-group">
            <input type="tel" id="reg-telefono" placeholder="Teléfono (opcional)"> // 👈 NUEVO
        </div>
        <div class="form-group">
            <select id="reg-tipo" onchange="toggleProveedorCampos()">
                <option value="cliente">Cliente</option>
                <option value="proveedor">Proveedor</option>
            </select>
        </div>
        <div id="proveedor-campos" style="display:none;">
            <div class="form-group">
                <input type="text" id="reg-empresa" placeholder="Nombre de empresa">
            </div>
            <div class="form-group">
                <input type="text" id="reg-nit" placeholder="NIT">
            </div>
        </div>
        <div class="foto-upload-modal" onclick="document.getElementById('reg-foto').click()">
            📷 Subir foto de perfil
        </div>
        <input type="file" id="reg-foto" accept="image/*" style="display:none;" onchange="previewFotoModal(event)">
        <img id="foto-preview-modal" class="foto-preview-modal">
        <button type="submit" class="btn-modal">Crear Cuenta</button>
    </form>
    <div class="modal-switch">
        ¿Ya tienes cuenta? <a onclick="cambiarTabModal('login')">Inicia sesión</a>
    </div>
</div>
        </div>
    `;
    modal.classList.add('active');
}

// Abrir modal de registro directamente
function abrirModalRegistro() {
    console.log('Abriendo modal de registro');
    abrirModalLogin();
    cambiarTabModal('registro');
}

// Abrir modal de editar perfil
function abrirModalPerfil() {
    console.log('Abriendo modal de perfil');
    const modal = document.getElementById('perfil-modal');
    const usuario = Auth.usuarioActual;
    if (!usuario) {
        console.error('No hay usuario logueado');
        return;
    }

    modal.innerHTML = `
        <div class="modal">
            <button class="modal-close" onclick="cerrarModalPerfil()">✕</button>
            <h2>Editar Perfil</h2>
            <form onsubmit="return guardarPerfil(event)">
                <div class="form-group">
                    <input type="text" id="perfil-nombre" value="${usuario.nombre || ''}" required>
                </div>
                <div class="form-group">
                    <input type="email" id="perfil-email" value="${usuario.email || ''}" readonly>
                </div>
                <div class="form-group">
                    <input type="password" id="perfil-password" placeholder="Nueva contraseña (opcional)">
                </div>
                <div class="foto-upload-modal" onclick="document.getElementById('perfil-foto').click()">
                    📷 Cambiar foto
                </div>
                <input type="file" id="perfil-foto" accept="image/*" style="display:none;" onchange="previewFotoPerfil(event)">
                <img id="foto-perfil-preview" class="foto-preview-modal" src="${usuario.foto_perfil || ''}">
                <button type="submit" class="btn-modal">Guardar cambios</button>
                <button type="button" class="btn-modal" style="background:#f44336;" onclick="eliminarCuenta()">Eliminar cuenta</button>
            </form>
        </div>
    `;
    modal.classList.add('active');
}

// Cerrar modales
function cerrarModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function cerrarModalPerfil() {
    document.getElementById('perfil-modal').classList.remove('active');
}

// Cambiar entre pestañas del modal
function cambiarTabModal(tab) {
    const tabs = document.querySelectorAll('.modal-tab');
    const forms = document.querySelectorAll('.modal-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelector('.modal-tab').classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.modal-tab')[1].classList.add('active');
        document.getElementById('registro-form').classList.add('active');
    }
}

// Mostrar/ocultar campos de proveedor
function toggleProveedorCampos() {
    const tipo = document.getElementById('reg-tipo').value;
    const campos = document.getElementById('proveedor-campos');
    if (campos) {
        campos.style.display = tipo === 'proveedor' ? 'block' : 'none';
    }
}

// Validar contraseña en tiempo real
function validarPasswordModal() {
    const password = document.getElementById('reg-password').value;
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');

    if (reqLength) {
        reqLength.className = password.length >= 6 ? 'requirement valid' : 'requirement invalid';
    }
    if (reqUppercase) {
        reqUppercase.className = /[A-Z]/.test(password) ? 'requirement valid' : 'requirement invalid';
    }
    if (reqNumber) {
        reqNumber.className = /[0-9]/.test(password) ? 'requirement valid' : 'requirement invalid';
    }
}

// Previsualizar foto de perfil
function previewFotoModal(event) {
    const preview = document.getElementById('foto-preview-modal');
    const file = event.target.files[0];

    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

function previewFotoPerfil(event) {
    const preview = document.getElementById('foto-perfil-preview');
    const file = event.target.files[0];

    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// Iniciar sesión desde modal
async function iniciarSesionModal(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await Auth.login(email, password);

    if (result.success) {
        cerrarModal();
        await renderizarSidebar();
        await Carrito.inicializar();
        mostrarNotificacion('Sesión iniciada correctamente');
    } else {
        mostrarNotificacion(result.error || 'Error al iniciar sesión', 'error');
    }

    return false;
}

// Registrar usuario desde modal
async function registrarUsuarioModal(event) {
    event.preventDefault();

    const password = document.getElementById('reg-password').value;

    if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres, una mayúscula y un número', 'error');
        return false;
    }

    const usuario = {
        nombre: document.getElementById('reg-nombre').value,
        email: document.getElementById('reg-email').value,
        password: password,  // 👈 Cambiado de password_hash a password
        tipo_usuario: document.getElementById('reg-tipo').value,
        telefono: document.getElementById('reg-telefono')?.value || ''
    };

    if (usuario.tipo_usuario === 'proveedor') {
        usuario.empresa = document.getElementById('reg-empresa')?.value || '';
        usuario.nit = document.getElementById('reg-nit')?.value || '';
    }

    const fotoPreview = document.getElementById('foto-preview-modal');
    if (fotoPreview && fotoPreview.src && fotoPreview.style.display !== 'none') {
        usuario.foto = fotoPreview.src;
    }

    const result = await Auth.register(usuario);
    
    if (result.success) {
        cerrarModal();
        await renderizarSidebar();
        mostrarNotificacion('✅ Cuenta creada exitosamente');
    } else {
        mostrarNotificacion(result.error || 'Error al registrar', 'error');
    }
    
    return false;
}

// Guardar cambios de perfil
async function guardarPerfil(event) {
    event.preventDefault();

    const usuario = Auth.usuarioActual;
    if (!usuario) return false;

    const datos = {
        nombre: document.getElementById('perfil-nombre').value
    };

    const fotoPreview = document.getElementById('foto-perfil-preview');
    if (fotoPreview && fotoPreview.src && fotoPreview.style.display !== 'none' && fotoPreview.src !== usuario.foto_perfil) {
        datos.foto_perfil = fotoPreview.src;
    }

    const result = await Auth.actualizarPerfil(usuario.id_usuario, datos);

    if (result.success) {
        cerrarModalPerfil();
        await renderizarSidebar();
        mostrarNotificacion('Perfil actualizado');
    } else {
        mostrarNotificacion(result.error || 'Error al actualizar', 'error');
    }

    return false;
}

// Eliminar cuenta
async function eliminarCuenta() {
    if (!confirm('¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        return;
    }

    const result = await Auth.eliminarCuenta(Auth.usuarioActual.id_usuario);

    if (result.success) {
        cerrarModalPerfil();
        mostrarNotificacion('Cuenta eliminada');
    } else {
        mostrarNotificacion(result.error || 'Error al eliminar', 'error');
    }
}

// Exponer funciones globalmente
window.abrirModalLogin = abrirModalLogin;
window.abrirModalRegistro = abrirModalRegistro;
window.abrirModalPerfil = abrirModalPerfil;
window.cerrarModal = cerrarModal;
window.cerrarModalPerfil = cerrarModalPerfil;
window.cambiarTabModal = cambiarTabModal;
window.toggleProveedorCampos = toggleProveedorCampos;
window.validarPasswordModal = validarPasswordModal;
window.previewFotoModal = previewFotoModal;
window.previewFotoPerfil = previewFotoPerfil;
window.iniciarSesionModal = iniciarSesionModal;
window.registrarUsuarioModal = registrarUsuarioModal;
window.guardarPerfil = guardarPerfil;
window.eliminarCuenta = eliminarCuenta;