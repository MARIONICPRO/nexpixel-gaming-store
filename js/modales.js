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
                <div class="form-group">
                    <label>Contraseña actual</label>
                    <input type="password" id="perfil-password-actual" placeholder="Ingresa tu contraseña actual">
                </div>
                <div class="form-group">
                    <label>Nueva contraseña</label>
                    <input type="password" id="perfil-password-nueva" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="form-group">
                    <label>Confirmar nueva contraseña</label>
                    <input type="password" id="perfil-password-confirmar" placeholder="Repite la nueva contraseña">
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
// Iniciar sesión desde modal - VERSIÓN CORREGIDA
async function iniciarSesionModal(event) {
    event.preventDefault();
    console.log('🚀 Iniciando sesión...');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await Auth.login(email, password);

    if (result.success) {
        console.log('✅ Login exitoso, actualizando sidebar...');
        cerrarModal();
        
        // 👇 FORZAR ACTUALIZACIÓN DE LA SIDEBAR
        await renderizarSidebar();
        await Carrito.inicializar();
        
        mostrarNotificacion('Sesión iniciada correctamente');
        console.log('🎉 Todo listo!');
    } else {
        mostrarNotificacion(result.error || 'Error al iniciar sesión', 'error');
    }

    return false;
}

// Registrar usuario desde modal - VERSIÓN CORREGIDA
async function registrarUsuarioModal(event) {
    event.preventDefault();
    console.log('📝 INICIO DE REGISTRO');

    const password = document.getElementById('reg-password').value;

    if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres, una mayúscula y un número', 'error');
        return false;
    }

    // Crear FormData
    const formData = new FormData();

    // Agregar campos
    formData.append('nombre', document.getElementById('reg-nombre').value);
    formData.append('email', document.getElementById('reg-email').value);
    formData.append('password', password);
    formData.append('tipo_usuario', document.getElementById('reg-tipo').value);

    const telefono = document.getElementById('reg-telefono')?.value;
    if (telefono) formData.append('telefono', telefono);

    if (document.getElementById('reg-tipo').value === 'proveedor') {
        const empresa = document.getElementById('reg-empresa')?.value;
        const nit = document.getElementById('reg-nit')?.value;
        if (empresa) formData.append('empresa', empresa);
        if (nit) formData.append('nit', nit);
    }

    // 👇 CORREGIDO: Obtener la foto directamente del input
    const fotoInput = document.getElementById('reg-foto');
    console.log('3️⃣ Input de foto:', fotoInput);

    if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
        console.log('4️⃣ Foto encontrada:', fotoInput.files[0].name);
        console.log('4️⃣ Tamaño:', fotoInput.files[0].size);
        console.log('4️⃣ Tipo:', fotoInput.files[0].type);
        formData.append('foto', fotoInput.files[0]);
    } else {
        console.log('4️⃣ No hay foto seleccionada');
        // Mostrar advertencia pero continuar
        mostrarNotificacion('No se seleccionó foto de perfil', 'info');
    }

    console.log('5️⃣ Enviando petición a:', `${API_URL}/auth/registro`);

    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            body: formData
        });

        console.log('6️⃣ Respuesta status:', response.status);

        const data = await response.json();
        console.log('7️⃣ Respuesta data:', data);

        if (data.success) {
            if (data.token) API.setToken(data.token);

            Auth.usuarioActual = data.usuario;
            localStorage.setItem('nexpixel_usuario', JSON.stringify(data.usuario));

            cerrarModal();
            await renderizarSidebar();
            mostrarNotificacion('✅ Cuenta creada exitosamente');
        } else {
            mostrarNotificacion(data.error || 'Error al registrar', 'error');
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    }

    return false;
}

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
            
            // 👇 FORZAR ACTUALIZACIÓN DE LA SIDEBAR
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
window.validarPasswordModal = validarPasswordModal;
window.previewFotoModal = previewFotoModal;
window.previewFotoPerfil = previewFotoPerfil;
window.iniciarSesionModal = iniciarSesionModal;
window.registrarUsuarioModal = registrarUsuarioModal;
window.guardarPerfil = guardarPerfil;
window.eliminarCuenta = eliminarCuenta;
// 👇 CÓDIGO TEMPORAL PARA DEPURAR
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔍 Buscando botón de login...');

    // Buscar el botón por su texto o clase
    const botones = document.querySelectorAll('.btn-modal');
    console.log('Botones encontrados:', botones.length);

    botones.forEach((btn, i) => {
        console.log(`Botón ${i}:`, btn.textContent);
        if (btn.textContent.includes('Entrar')) {
            console.log('✅ Botón "Entrar" encontrado');
            btn.addEventListener('click', function (e) {
                console.log('👆 Click en botón "Entrar"');
                e.preventDefault();
                iniciarSesionModal(e);
            });
        }
    });
});
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