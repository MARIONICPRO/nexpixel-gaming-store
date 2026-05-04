// =============================================
// FUNCIONES DE VALIDACIÓN
// =============================================

function validarNombreModal(nombre) {
    if (!nombre || nombre.trim() === '') {
        return { valid: false, error: 'El nombre es obligatorio' };
    }
    
    if (nombre.trim().length < 3) {
        return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
    }
    
    if (nombre.trim().length > 100) {
        return { valid: false, error: 'El nombre no puede tener más de 100 caracteres' };
    }
    
    return { valid: true };
}

function validarEmailModal(email) {
    if (!email) {
        return { valid: false, error: 'El email es obligatorio' };
    }
    
    email = email.trim();
    
    if (!email.includes('@')) {
        return { valid: false, error: 'Email inválido. Debe contener un @' };
    }
    
    const partes = email.split('@');
    if (partes.length !== 2) {
        return { valid: false, error: 'Email inválido. Formato: usuario@dominio.com' };
    }
    
    const local = partes[0];
    const dominio = partes[1];
    
    if (!local) {
        return { valid: false, error: 'Email inválido. Falta el nombre de usuario' };
    }
    
    if (!dominio || !dominio.includes('.')) {
        return { valid: false, error: 'Email inválido. El dominio debe contener un punto (ej: @gmail.com)' };
    }
    
    if (dominio.startsWith('.') || dominio.endsWith('.')) {
        return { valid: false, error: 'Email inválido. El dominio no puede comenzar o terminar con punto' };
    }
    
    const ultimoPunto = dominio.lastIndexOf('.');
    const extension = dominio.substring(ultimoPunto + 1);
    
    if (extension.length < 2) {
        return { valid: false, error: 'Email inválido. La extensión debe tener al menos 2 caracteres (ej: .com, .es)' };
    }
    
    return { valid: true };
}

function validarTelefonoModal(telefono) {
    if (!telefono) {
        return { valid: false, error: 'El teléfono es obligatorio' };
    }
    
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    if (telefonoLimpio.length !== 10) {
        return { valid: false, error: 'Teléfono inválido. Debe tener 10 dígitos (ej: 3123456789)' };
    }
    
    if (!telefonoLimpio.startsWith('3')) {
        return { valid: false, error: 'Teléfono inválido. Debe ser un celular colombiano que empiece con 3' };
    }
    
    return { valid: true, telefonoLimpio };
}

function validarPasswordModal() {
    const password = document.getElementById('reg-password')?.value || '';
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');

    const lengthValid = password.length >= 6;
    const uppercaseValid = /[A-Z]/.test(password);
    const numberValid = /[0-9]/.test(password);

    if (reqLength) {
        reqLength.className = lengthValid ? 'requirement valid' : 'requirement invalid';
    }
    if (reqUppercase) {
        reqUppercase.className = uppercaseValid ? 'requirement valid' : 'requirement invalid';
    }
    if (reqNumber) {
        reqNumber.className = numberValid ? 'requirement valid' : 'requirement invalid';
    }
    
    const isValid = lengthValid && uppercaseValid && numberValid;
    
    return {
        valid: isValid,
        error: isValid ? '' : 'La contraseña debe tener al menos 6 caracteres, una mayúscula y un número'
    };
}

// =============================================
// FUNCIONES DE MODALES
// =============================================

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');

    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
function cerrarModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function cerrarModalPerfil() {
    document.getElementById('perfil-modal').classList.remove('active');
}

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
                    <div class="form-group password-container">
                        <input type="password" id="login-password" placeholder="Contraseña" required>
                        <button type="button" onclick="togglePassword('login-password', this)">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <button type="submit" class="btn-modal">Entrar</button>
                </form>
                <div class="modal-switch">
                    ¿No tienes cuenta? <a onclick="cambiarTabModal('registro')">Regístrate</a>
                </div>
            </div>

            <div class="modal-form" id="registro-form">
                <h2>Crear Cuenta</h2>
                <form onsubmit="return registrarUsuarioModal(event)">
                    <div class="form-group">
                        <input type="text" id="reg-nombre" placeholder="Nombre completo" required>
                    </div>
                    <div class="form-group">
                        <input type="email" id="reg-email" placeholder="Email (ejemplo@dominio.com)" required>
                        <small id="email-error" style="color: #e94560; font-size: 0.8rem; display: none;"></small>
                    </div>
                    <div class="form-group password-container">
                        <input type="password" id="reg-password" placeholder="Contraseña" required oninput="validarPasswordModal()">
                        <button type="button" onclick="togglePassword('reg-password', this)">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="password-requirements" id="password-requirements">
                        <p>Requisitos:</p>
                        <div class="requirement" id="req-length">✓ 6+ caracteres</div>
                        <div class="requirement" id="req-uppercase">✓ 1 mayúscula</div>
                        <div class="requirement" id="req-number">✓ 1 número</div>
                    </div>
                    <div class="form-group">
                        <input type="tel" id="reg-telefono" placeholder="Teléfono (ej: 3123456789)" required>
                        <small id="telefono-error" style="color: #e94560; font-size: 0.8rem; display: none;"></small>
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

function abrirModalRegistro() {
    console.log('Abriendo modal de registro');
    abrirModalLogin();
    cambiarTabModal('registro');
}

// =============================================
// REGISTRO DE USUARIO (VERSIÓN CORREGIDA)
// =============================================
async function registrarUsuarioModal(event) {
    event.preventDefault();
    console.log('📝 INICIO DE REGISTRO');

    const nombre = document.getElementById('reg-nombre')?.value;
    const email = document.getElementById('reg-email')?.value;
    const password = document.getElementById('reg-password')?.value;
    const telefono = document.getElementById('reg-telefono')?.value;
    const fotoInput = document.getElementById('reg-foto');

    if (!nombre || !email || !password || !telefono) {
        mostrarNotificacion('Todos los campos son obligatorios', 'error');
        return false;
    }

    const telefonoLimpio = telefono.replace(/\D/g, '');
    const telefonoNumero = parseInt(telefonoLimpio, 10);
    
    if (isNaN(telefonoNumero)) {
        mostrarNotificacion('Teléfono inválido. Debe contener solo números', 'error');
        return false;
    }

    // ✅ USAR FormData (NO JSON)
    const formData = new FormData();
    formData.append('nombre', nombre.trim());
    formData.append('email', email.toLowerCase().trim());
    formData.append('password', password);
    formData.append('tipo_usuario', 'cliente');
    formData.append('telefono', telefonoNumero);

    // ✅ Agregar foto si existe
    if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
        console.log('📸 Foto seleccionada:', fotoInput.files[0].name);
        formData.append('foto', fotoInput.files[0]);
    } else {
        console.log('📸 No se seleccionó foto');
    }

    console.log('📤 Enviando FormData...');

    try {
        const response = await fetch('http://localhost:3000/api/auth/registro', {
            method: 'POST',
            body: formData  // 👈 NO USAR JSON, ENVIAR FormData
        });

        const data = await response.json();
        console.log('📥 Respuesta:', data);

        if (response.ok && data.success) {
            if (data.token) API.setToken(data.token);
            Auth.usuarioActual = data.usuario;
            localStorage.setItem('nexpixel_usuario', JSON.stringify(data.usuario));
            cerrarModal();
            await renderizarSidebar();
            mostrarNotificacion('✅ Cuenta creada exitosamente', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al registrar', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    }

    return false;
}

// =============================================
// INICIO DE SESIÓN (VERSIÓN CORREGIDA)
// =============================================
async function iniciarSesionModal(event) {
    event.preventDefault();
    console.log('🚀 Iniciando sesión...');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const emailValidation = validarEmailModal(email);
    if (!emailValidation.valid) {
        mostrarNotificacion(emailValidation.error, 'error');
        return false;
    }

    const result = await Auth.login(email, password);

    if (result.success) {
        console.log('✅ Login exitoso');
        cerrarModal();
        
        // 🔥 FORZAR RECARGA DE DATOS DEL USUARIO DESDE EL SERVIDOR
        await Auth.recargarUsuarioActual();
        
        // 🔥 ESPERAR UN MOMENTO Y RENDERIZAR SIDEBAR
        setTimeout(() => {
            if (typeof renderizarSidebar === 'function') {
                renderizarSidebar();
            }
            
            // 🔥 SI ESTÁS EN EL DASHBOARD, RECARGAR LOS DATOS ESPECÍFICOS
            if (window.location.pathname.includes('dashboard-proveedor')) {
                if (typeof cargarDashboardProveedor === 'function') {
                    cargarDashboardProveedor();
                }
            } else if (window.location.pathname.includes('dashboard-admin')) {
                if (typeof cargarDashboardAdmin === 'function') {
                    cargarDashboardAdmin();
                }
            }
        }, 100);
        
        if (typeof Carrito !== 'undefined' && Carrito.sincronizarCarritoLocal) {
            await Carrito.sincronizarCarritoLocal();
        }
        
        mostrarNotificacion('✅ Sesión iniciada correctamente', 'success');
    } else {
        mostrarNotificacion(result.error || 'Error al iniciar sesión', 'error');
    }

    return false;
}
// =============================================
// PERFIL
// =============================================
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
                    <label>Nombre completo</label>
                    <input type="text" id="perfil-nombre" value="${usuario.nombre || ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="perfil-email" value="${usuario.email || ''}" >
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" id="perfil-telefono" value="${usuario.telefono || ''}">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="perfil-descripcion" rows="3">${usuario.descripcion || ''}</textarea>
                </div>
                
                <h3 style="color:#4d8cff; margin:20px 0 10px;">🔐 Cambiar contraseña</h3>
                <div class="form-group password-container">
                    <label>Contraseña actual</label>
                    <input type="password" id="perfil-password-actual" placeholder="Ingresa tu contraseña actual">
                    <button type="button" onclick="togglePassword('perfil-password-actual', this)">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="form-group password-container">
                    <label>Nueva contraseña</label>
                    <input type="password" id="perfil-password-nueva" placeholder="Mínimo 6 caracteres">
                    <button type="button" onclick="togglePassword('perfil-password-nueva', this)">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="form-group password-container">
                    <label>Confirmar nueva contraseña</label>
                    <input type="password" id="perfil-password-confirmar" placeholder="Repite la nueva contraseña">
                    <button type="button" onclick="togglePassword('perfil-password-confirmar', this)">
                        <i class="fa-solid fa-eye"></i>
                    </button>
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

async function guardarPerfil(event) {
    event.preventDefault();
    console.log('📝 Guardando perfil...');

    const usuario = Auth.usuarioActual;
    if (!usuario) {
        mostrarNotificacion('No hay usuario logueado', 'error');
        return false;
    }

    const formData = new FormData();

    const nombre = document.getElementById('perfil-nombre')?.value;
    if (nombre) formData.append('nombre', nombre);

    const telefono = document.getElementById('perfil-telefono')?.value;
    if (telefono) formData.append('telefono', telefono);

    const descripcion = document.getElementById('perfil-descripcion')?.value;
    if (descripcion) formData.append('descripcion', descripcion);

    const fotoInput = document.getElementById('perfil-foto');
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        formData.append('foto', fotoInput.files[0]);
    }

    const passwordActual = document.getElementById('perfil-password-actual')?.value;
    const passwordNueva = document.getElementById('perfil-password-nueva')?.value;
    const passwordConfirmar = document.getElementById('perfil-password-confirmar')?.value;

    if (passwordActual || passwordNueva || passwordConfirmar) {
        if (!passwordActual || !passwordNueva || !passwordConfirmar) {
            mostrarNotificacion('Para cambiar la contraseña, completa todos los campos', 'error');
            return false;
        }

        if (passwordNueva !== passwordConfirmar) {
            mostrarNotificacion('Las contraseñas nuevas no coinciden', 'error');
            return false;
        }

        if (passwordNueva.length < 6) {
            mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return false;
        }

        formData.append('password_actual', passwordActual);
        formData.append('password_nueva', passwordNueva);
    }

    try {
        const response = await fetch(`${API_URL}/auth/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('nexpixel_token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            Auth.usuarioActual = data.usuario;
            localStorage.setItem('nexpixel_usuario', JSON.stringify(data.usuario));
            cerrarModalPerfil();
            await renderizarSidebar();
            mostrarNotificacion('✅ Perfil actualizado correctamente');
            if (passwordNueva) {
                mostrarNotificacion('🔑 Contraseña actualizada', 'success');
            }
        } else {
            mostrarNotificacion(data.error || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    }

    return false;
}

async function eliminarCuenta() {
    console.log('🗑️ Iniciando proceso de eliminación de cuenta...');

    const token = localStorage.getItem('nexpixel_token');
    if (!token) {
        alert('Error: No has iniciado sesión correctamente');
        return;
    }

    if (!confirm('⚠️ ¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/eliminar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('✅ Cuenta eliminada correctamente');
            Auth.cerrarSesion();
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo eliminar la cuenta'));
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al conectar con el servidor: ' + error.message);
    }
}

async function cambiarPasswordModal() {
    const passwordNueva = prompt('Ingresa la nueva contraseña (mínimo 6 caracteres):');
    if (!passwordNueva) return;

    if (passwordNueva.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    const passwordActual = prompt('Ingresa tu contraseña actual para confirmar:');
    if (!passwordActual) return;

    const result = await Auth.cambiarPassword(passwordActual, passwordNueva);

    if (result.success) {
        alert('✅ Contraseña actualizada correctamente');
    } else {
        alert('❌ Error: ' + (result.error || 'No se pudo cambiar la contraseña'));
    }
}

// =============================================
// EXPORTAR FUNCIONES GLOBALMENTE
// =============================================
window.abrirModalLogin = abrirModalLogin;
window.abrirModalRegistro = abrirModalRegistro;
window.abrirModalPerfil = abrirModalPerfil;
window.cerrarModal = cerrarModal;
window.cerrarModalPerfil = cerrarModalPerfil;
window.cambiarTabModal = cambiarTabModal;
window.previewFotoModal = previewFotoModal;
window.previewFotoPerfil = previewFotoPerfil;
window.iniciarSesionModal = iniciarSesionModal;
window.registrarUsuarioModal = registrarUsuarioModal;
window.guardarPerfil = guardarPerfil;
window.eliminarCuenta = eliminarCuenta;
window.validarEmailModal = validarEmailModal;
window.validarTelefonoModal = validarTelefonoModal;
window.validarNombreModal = validarNombreModal;
window.validarPasswordModal = validarPasswordModal;
window.togglePassword = togglePassword;
window.cambiarPasswordModal = cambiarPasswordModal;