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
    
    // Validar que tenga @
    if (!email.includes('@')) {
        return { valid: false, error: 'Email inválido. Debe contener un @' };
    }
    
    // Separar local y dominio
    const partes = email.split('@');
    if (partes.length !== 2) {
        return { valid: false, error: 'Email inválido. Formato: usuario@dominio.com' };
    }
    
    const local = partes[0];
    const dominio = partes[1];
    
    // Validar que local no esté vacío
    if (!local) {
        return { valid: false, error: 'Email inválido. Falta el nombre de usuario' };
    }
    
    // Validar que el dominio tenga al menos un punto
    if (!dominio || !dominio.includes('.')) {
        return { valid: false, error: 'Email inválido. El dominio debe contener un punto (ej: @gmail.com)' };
    }
    
    // Validar que el punto no esté al inicio o final del dominio
    if (dominio.startsWith('.') || dominio.endsWith('.')) {
        return { valid: false, error: 'Email inválido. El dominio no puede comenzar o terminar con punto' };
    }
    
    // Validar que después del último punto haya al menos 2 caracteres
    const ultimoPunto = dominio.lastIndexOf('.');
    const extension = dominio.substring(ultimoPunto + 1);
    
    if (extension.length < 2) {
        return { valid: false, error: 'Email inválido. La extensión debe tener al menos 2 caracteres (ej: .com, .es)' };
    }
    
    return { valid: true };
}

// Validar teléfono (obligatorio, 10 dígitos, empieza con 3)
function validarTelefonoModal(telefono) {
    if (!telefono) {
        return { valid: false, error: 'El teléfono es obligatorio' };
    }
    
    // Eliminar espacios, guiones, paréntesis
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    if (telefonoLimpio.length !== 10) {
        return { valid: false, error: 'Teléfono inválido. Debe tener 10 dígitos (ej: 3123456789)' };
    }
    
    if (!telefonoLimpio.startsWith('3')) {
        return { valid: false, error: 'Teléfono inválido. Debe ser un celular colombiano que empiece con 3' };
    }
    
    return { valid: true, telefonoLimpio };
}

// Validar contraseña (devuelve objeto con valid y error)
function validarPasswordModal() {
    const password = document.getElementById('reg-password')?.value || '';
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');

    const lengthValid = password.length >= 6;
    const uppercaseValid = /[A-Z]/.test(password);
    const numberValid = /[0-9]/.test(password);

    // Actualizar UI
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
                    <div class="form-group">
                        <select id="reg-tipo" onchange="toggleProveedorCampos()" required>
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

// Registrar usuario desde modal - VERSIÓN CON VALIDACIONES COMPLETAS
// Registrar usuario desde modal - VERSIÓN CORREGIDA
async function registrarUsuarioModal(event) {
    event.preventDefault();
    console.log('📝 INICIO DE REGISTRO');

    // Limpiar errores previos
    const emailError = document.getElementById('email-error');
    const telefonoError = document.getElementById('telefono-error');
    if (emailError) emailError.style.display = 'none';
    if (telefonoError) telefonoError.style.display = 'none';
    
    // 1. VALIDAR NOMBRE
    const nombre = document.getElementById('reg-nombre').value;
    const nombreValidation = validarNombreModal(nombre);
    if (!nombreValidation.valid) {
        mostrarNotificacion(nombreValidation.error, 'error');
        return false;
    }
    
    // 2. VALIDAR EMAIL
    const email = document.getElementById('reg-email').value;
    const emailValidation = validarEmailModal(email);
    console.log('📧 Validación email:', emailValidation); // Debug
    if (!emailValidation.valid) {
        if (emailError) {
            emailError.textContent = emailValidation.error;
            emailError.style.display = 'block';
        }
        mostrarNotificacion(emailValidation.error, 'error');
        return false;
    }
    
    // 3. VALIDAR CONTRASEÑA
    const passwordValidation = validarPasswordModal();
    console.log('🔐 Validación contraseña:', passwordValidation); // Debug
    if (!passwordValidation.valid) {
        mostrarNotificacion(passwordValidation.error, 'error');
        return false;
    }
    const password = document.getElementById('reg-password').value;
    
    // 4. VALIDAR TELÉFONO
    const telefono = document.getElementById('reg-telefono').value;
    const telefonoValidation = validarTelefonoModal(telefono);
    console.log('📱 Validación teléfono:', telefonoValidation); // Debug
    if (!telefonoValidation.valid) {
        if (telefonoError) {
            telefonoError.textContent = telefonoValidation.error;
            telefonoError.style.display = 'block';
        }
        mostrarNotificacion(telefonoValidation.error, 'error');
        return false;
    }
    
    // 5. VALIDAR TIPO DE USUARIO
    const tipoUsuario = document.getElementById('reg-tipo').value;
    if (!tipoUsuario) {
        mostrarNotificacion('Debes seleccionar un tipo de usuario', 'error');
        return false;
    }
    
    // 6. Si es proveedor, validar empresa y NIT
    if (tipoUsuario === 'proveedor') {
        const empresa = document.getElementById('reg-empresa')?.value;
        const nit = document.getElementById('reg-nit')?.value;
        
        if (!empresa || empresa.trim() === '') {
            mostrarNotificacion('Para registrarte como proveedor, debes ingresar el nombre de la empresa', 'error');
            return false;
        }
        
        if (!nit || nit.trim() === '') {
            mostrarNotificacion('Para registrarte como proveedor, debes ingresar el NIT', 'error');
            return false;
        }
    }

    // Crear FormData
    const formData = new FormData();

    // Agregar campos validados
    formData.append('nombre', nombre.trim());
    formData.append('email', email.toLowerCase().trim());
    formData.append('password', password);
    formData.append('tipo_usuario', tipoUsuario);
    formData.append('telefono', telefonoValidation.telefonoLimpio);

    if (tipoUsuario === 'proveedor') {
        const empresa = document.getElementById('reg-empresa')?.value;
        const nit = document.getElementById('reg-nit')?.value;
        if (empresa) formData.append('empresa', empresa.trim());
        if (nit) formData.append('nit', nit.trim());
    }

    // Agregar foto si existe
    const fotoInput = document.getElementById('reg-foto');
    if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
        console.log('📸 Foto seleccionada:', fotoInput.files[0].name);
        formData.append('foto', fotoInput.files[0]);
    }

    console.log('📤 Enviando petición a:', `${API_URL}/auth/registro`);

    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            body: formData
        });

        console.log('📥 Respuesta status:', response.status);

        const data = await response.json();
        console.log('📥 Respuesta data:', data);

        if (response.ok && data.success) {
            if (data.token) API.setToken(data.token);

            Auth.usuarioActual = data.usuario;
            localStorage.setItem('nexpixel_usuario', JSON.stringify(data.usuario));

            cerrarModal();
            await renderizarSidebar();
            mostrarNotificacion('✅ Cuenta creada exitosamente', 'success');
        } else {
            // Manejar error de email duplicado
            if (data.code === '23505' || (data.error && data.error.includes('duplicate'))) {
                mostrarNotificacion('❌ Este correo electrónico ya está registrado. Por favor inicia sesión o usa otro email.', 'error');
                // Opcional: cambiar a la pestaña de login
                setTimeout(() => {
                    cambiarTabModal('login');
                    const loginEmail = document.getElementById('login-email');
                    if (loginEmail) loginEmail.value = email;
                }, 2000);
            } else {
                mostrarNotificacion(data.error || 'Error al registrar', 'error');
            }
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    }

    return false;
}

// Iniciar sesión desde modal - VERSIÓN CON VALIDACIÓN
async function iniciarSesionModal(event) {
    event.preventDefault();
    console.log('🚀 Iniciando sesión...');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Validar email
    const emailValidation = validarEmailModal(email);
    if (!emailValidation.valid) {
        mostrarNotificacion(emailValidation.error, 'error');
        return false;
    }

    const result = await Auth.login(email, password);

    if (result.success) {
        console.log('✅ Login exitoso, actualizando sidebar...');
        cerrarModal();
        
        // Actualizar sidebar y carrito
        await renderizarSidebar();
        if (typeof Carrito !== 'undefined' && Carrito.sincronizarCarritoLocal) {
            await Carrito.sincronizarCarritoLocal();
        }
        
        mostrarNotificacion('✅ Sesión iniciada correctamente', 'success');
        console.log('🎉 Todo listo!');
    } else {
        mostrarNotificacion(result.error || 'Error al iniciar sesión', 'error');
    }

    return false;
}

// Función para mostrar/ocultar contraseña
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

// Resto de las funciones (abrirModalRegistro, abrirModalPerfil, etc.) se mantienen igual...
// ... pero asegúrate de exportar las nuevas funciones


// Abrir modal de registro directamente
function abrirModalRegistro() {
    console.log('Abriendo modal de registro');
    abrirModalLogin();
    cambiarTabModal('registro');
}

// Abrir modal de editar perfil - VERSIÓN CON CAMPOS DE CONTRASEÑA
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
                    <input type="email" id="perfil-email" value="${usuario.email || ''}" readonly>
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
// Iniciar sesión desde modal - VERSIÓN CORREGIDA


// Registrar usuario desde modal - VERSIÓN CORREGIDA


// Guardar cambios de perfil - VERSIÓN CON FOTO
// Guardar cambios de perfil - VERSIÓN CON CAMBIO DE CONTRASEÑA
// Guardar cambios de perfil - VERSIÓN CORREGIDA
async function guardarPerfil(event) {
    event.preventDefault();
    console.log('📝 Guardando perfil...');

    const usuario = Auth.usuarioActual;
    if (!usuario) {
        mostrarNotificacion('No hay usuario logueado', 'error');
        return false;
    }

    // Crear FormData
    const formData = new FormData();

    // Agregar nombre
    const nombre = document.getElementById('perfil-nombre')?.value;
    if (nombre) formData.append('nombre', nombre);

    // Agregar teléfono si existe
    const telefono = document.getElementById('perfil-telefono')?.value;
    if (telefono) formData.append('telefono', telefono);

    // Agregar descripción si existe
    const descripcion = document.getElementById('perfil-descripcion')?.value;
    if (descripcion) formData.append('descripcion', descripcion);

    // Agregar foto si se seleccionó
    const fotoInput = document.getElementById('perfil-foto');
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        console.log('📸 Foto seleccionada:', fotoInput.files[0].name);
        formData.append('foto', fotoInput.files[0]);
    }

    // Verificar cambio de contraseña
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
        console.log('📤 Enviando petición...');

        const response = await fetch(`${API_URL}/auth/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('nexpixel_token')}`
            },
            body: formData
        });

        const data = await response.json();
        console.log('📥 Respuesta:', data);

        if (data.success) {
            // Actualizar usuario en memoria
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
// Eliminar cuenta - VERSIÓN CORREGIDA CON /eliminar
async function eliminarCuenta() {
    console.log('🗑️ Iniciando proceso de eliminación de cuenta...');

    const token = localStorage.getItem('nexpixel_token');
    if (!token) {
        console.error('❌ No hay token de autenticación');
        alert('Error: No has iniciado sesión correctamente');
        return;
    }

    if (!confirm('⚠️ ¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        return;
    }

    console.log('🗑️ Eliminando cuenta con token:', token.substring(0, 20) + '...');

    try {
        // 👇 VERIFICA QUE ESTA LÍNEA SEA /eliminar
        const response = await fetch(`${API_URL}/auth/eliminar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Status:', response.status);

        const data = await response.json();
        console.log('📥 Respuesta:', data);

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

// Exponer funciones globalmente
window.abrirModalLogin = abrirModalLogin;
window.abrirModalRegistro = abrirModalRegistro;
window.abrirModalPerfil = abrirModalPerfil;
window.cerrarModal = cerrarModal;
window.cerrarModalPerfil = cerrarModalPerfil;
window.cambiarTabModal = cambiarTabModal;
window.toggleProveedorCampos = toggleProveedorCampos;
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

// Cambiar contraseña desde el perfil
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