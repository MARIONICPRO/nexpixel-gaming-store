// ============================================
// AUTH.JS - NEXPIXEL (CON REDIRECCIÓN POR ROLES)
// ============================================

const Auth = {
    usuarioActual: null,

    async init() {
        await this.cargarUsuario();
    },

    async cargarUsuario() {
        const token = localStorage.getItem('nexpixel_token');
        const usuarioGuardado = localStorage.getItem('nexpixel_usuario');

        if (token && usuarioGuardado) {
            try {
                const response = await API.getPerfil();
                if (response && response.success) {
                    this.usuarioActual = response.usuario;
                    localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                    console.log('✅ Usuario cargado:', this.usuarioActual.nombre);
                } else {
                    this.cerrarSesion();
                }
            } catch (error) {
                console.error('❌ Error cargando usuario:', error);
                this.cerrarSesion();
            }
        }
    },

    // Función para validar email (case-insensitive)
    validarEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|mx|co|net|org|edu|gov)$/i;
        if (!email) return { valid: false, error: 'El email es obligatorio' };
        if (!emailRegex.test(email)) return { valid: false, error: 'Email inválido. Debe tener un formato válido y dominio .com, .es, .mx, .co, etc.' };
        return { valid: true, email: email.toLowerCase() };
    },

    // Función para validar teléfono (formato Colombia)
    validarTelefono(telefono) {
        if (!telefono) return { valid: false, error: 'El teléfono es obligatorio' };
        const telefonoLimpio = telefono.replace(/\D/g, '');
        if (telefonoLimpio.length !== 10) return { valid: false, error: 'Teléfono inválido. Debe tener 10 dígitos (ej: 3123456789)' };
        if (!telefonoLimpio.startsWith('3')) return { valid: false, error: 'Teléfono inválido. Debe ser un número celular colombiano que empiece con 3' };
        return { valid: true, telefonoLimpio };
    },

    // Función para validar nombre
    validarNombre(nombre) {
        if (!nombre) return { valid: false, error: 'El nombre es obligatorio' };
        if (nombre.length < 3) return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
        if (nombre.length > 100) return { valid: false, error: 'El nombre no puede tener más de 100 caracteres' };
        return { valid: true };
    },

    // Función para validar contraseña (CORREGIDA)
    validarPassword(password) {
        if (!password) return { valid: false, error: 'La contraseña es obligatoria' };
        if (password.length < 6) return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        if (password.length > 50) return { valid: false, error: 'La contraseña no puede tener más de 50 caracteres' };
        
        // Validaciones corregidas
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (!hasUpperCase) {
            return { valid: false, error: 'La contraseña debe contener al menos una mayúscula' };
        }
        if (!hasNumber) {
            return { valid: false, error: 'La contraseña debe contener al menos un número' };
        }
        
        return { valid: true };
    },

// ============================================
// LOGIN CON REDIRECCIÓN POR ROLES (VERSIÓN DEFINITIVA CORREGIDA)
// ============================================
async login(email, password) {
    const emailValidation = this.validarEmail(email);
    if (!emailValidation.valid) {
        mostrarNotificacion(`❌ ${emailValidation.error}`, 'error');
        return { success: false, error: emailValidation.error };
    }
    const emailNormalizado = emailValidation.email;

    try {
        console.log('🔍 Intentando login con:', emailNormalizado);

        const response = await API.login(emailNormalizado, password);

        console.log('📥 Respuesta del servidor:', response);

        // ✅ CASO 1: Login exitoso
        if (response && response.success) {
            this.usuarioActual = response.usuario;
            localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));

            if (typeof Carrito !== 'undefined' && Carrito.sincronizarCarritoLocal) {
                await Carrito.sincronizarCarritoLocal();
            }

            // ✅ SOLO UNA ALERTA DE INICIO DE SESIÓN EXITOSO
            mostrarNotificacion(`✅ ¡Bienvenido ${response.usuario.nombre}! Has iniciado sesión correctamente.`, 'success');
            
            // Actualizar UI
            if (typeof Auth !== 'undefined' && Auth.actualizarUI) {
                Auth.actualizarUI();
            }

            // 🔥 REDIRIGIR SEGÚN ROL
            if (response.redirectUrl) {
                console.log('🔄 Redirigiendo a:', response.redirectUrl);
                setTimeout(() => {
                    window.location.href = response.redirectUrl;
                }, 1500);
                return { success: true, usuario: response.usuario };
            }

            // Para clientes: recargar la página
            setTimeout(() => {
                window.location.reload();
            }, 1500);

            return { success: true, usuario: response.usuario };
        }

        // ✅ CASO 2: Error de credenciales (cuando response tiene error)
        const errorMessage = (response?.error || '').toLowerCase();
        
        if (response?.status === 401 || 
            errorMessage.includes('credencial') ||
            errorMessage.includes('contraseña') ||
            errorMessage.includes('email') ||
            errorMessage.includes('invalid')) {
            mostrarNotificacion('❌ Email o contraseña incorrectos', 'error');
            return { success: false, error: 'Email o contraseña incorrectos' };
        }

        // ✅ CASO 3: Error 403 - Cuenta suspendida/inactiva
        if (response?.status === 403 || errorMessage.includes('suspendida')) {
            mostrarNotificacion(`❌ ${response.error || 'Tu cuenta está suspendida o inactiva.'}`, 'error');
            return { success: false, error: response.error || 'Tu cuenta está suspendida o inactiva.' };
        }

        // ✅ CASO 4: Otros errores
        const errorMsg = response?.error || 'Error al iniciar sesión';
        mostrarNotificacion(`❌ ${errorMsg}`, 'error');
        return { success: false, error: errorMsg };

    } catch (error) {
        console.error('❌ Error en login:', error);
        
        // ✅ CAPTURAR EL ERROR "Credenciales inválidas" de API.js
        const errorMessage = error.message || '';
        const errorString = JSON.stringify(error).toLowerCase();
        
        console.log('🔍 Analizando error:', errorMessage);
        
        // Detectar "Credenciales inválidas" (con o sin mayúsculas)
        if (errorMessage.includes('Credenciales') ||
            errorMessage.toLowerCase().includes('credencial') ||
            errorMessage.toLowerCase().includes('contraseña') ||
            errorMessage.toLowerCase().includes('email') ||
            errorString.includes('401') ||
            errorString.includes('unauthorized')) {
            mostrarNotificacion('❌ Email o contraseña incorrectos', 'error');
            return { success: false, error: 'Email o contraseña incorrectos' };
        }
        
        // Error de conexión genérico
        mostrarNotificacion('❌ Error al conectar con el servidor', 'error');
        return { success: false, error: error.message || 'Error al conectar con el servidor' };
    }
},

    // ============================================
    // REGISTRO CON VALIDACIONES CORREGIDAS
    // ============================================
    async register(datos) {
        try {
            console.log('📝 Registrando usuario:', { ...datos, password: '***' });

            const nombreValidation = this.validarNombre(datos.nombre);
            if (!nombreValidation.valid) {
                mostrarNotificacion(`❌ ${nombreValidation.error}`, 'error');
                return { success: false, error: nombreValidation.error };
            }

            const emailValidation = this.validarEmail(datos.email);
            if (!emailValidation.valid) {
                mostrarNotificacion(`❌ ${emailValidation.error}`, 'error');
                return { success: false, error: emailValidation.error };
            }

            const passwordValidation = this.validarPassword(datos.password);
            if (!passwordValidation.valid) {
                mostrarNotificacion(`❌ ${passwordValidation.error}`, 'error');
                return { success: false, error: passwordValidation.error };
            }

            const telefonoValidation = this.validarTelefono(datos.telefono);
            if (!telefonoValidation.valid) {
                mostrarNotificacion(`❌ ${telefonoValidation.error}`, 'error');
                return { success: false, error: telefonoValidation.error };
            }

            if (!datos.tipo_usuario) {
                mostrarNotificacion('❌ Debes seleccionar un tipo de usuario', 'error');
                return { success: false, error: 'Debes seleccionar un tipo de usuario' };
            }

            const datosRegistro = {
                nombre: datos.nombre.trim(),
                email: datos.email.toLowerCase().trim(),
                password: datos.password,
                tipo_usuario: datos.tipo_usuario,
                telefono: telefonoValidation.telefonoLimpio,
                empresa: datos.empresa || null,
                nit: datos.nit || null
            };

            console.log('📤 Enviando a API:', { ...datosRegistro, password: '***' });

            const response = await API.register(datosRegistro);

            if (response && response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                mostrarNotificacion('✅ Registro exitoso. ¡Bienvenido!', 'success');

                // 🔥 REDIRIGIR SEGÚN ROL
                if (response.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = response.redirectUrl;
                    }, 1500);
                } else {
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 1500);
                }

                return { success: true, usuario: response.usuario };
            }

            if (response?.code === '23505' || (response?.error && response.error.includes('duplicate'))) {
                const errorMsg = 'Este correo electrónico ya está registrado.';
                mostrarNotificacion(`❌ ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
            }

            const errorMsg = response?.error || 'Error al registrar usuario';
            mostrarNotificacion(`❌ ${errorMsg}`, 'error');
            return { success: false, error: errorMsg };

        } catch (error) {
            console.error('❌ Error en registro:', error);
            if (error.message && error.message.includes('duplicate')) {
                const errorMsg = 'Este correo electrónico ya está registrado';
                mostrarNotificacion(`❌ ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
            }
            mostrarNotificacion(`❌ ${error.message || 'Error al conectar con el servidor'}`, 'error');
            return { success: false, error: error.message || 'Error al conectar con el servidor' };
        }
    },

    // ============================================
    // ACTUALIZAR PERFIL
    // ============================================
    async actualizarPerfil(datos) {
        try {
            if (datos.nombre) {
                const nombreValidation = this.validarNombre(datos.nombre);
                if (!nombreValidation.valid) {
                    mostrarNotificacion(`❌ ${nombreValidation.error}`, 'error');
                    return { success: false, error: nombreValidation.error };
                }
            }
            if (datos.email) {
                const emailValidation = this.validarEmail(datos.email);
                if (!emailValidation.valid) {
                    mostrarNotificacion(`❌ ${emailValidation.error}`, 'error');
                    return { success: false, error: emailValidation.error };
                }
            }
            if (datos.telefono) {
                const telefonoValidation = this.validarTelefono(datos.telefono);
                if (!telefonoValidation.valid) {
                    mostrarNotificacion(`❌ ${telefonoValidation.error}`, 'error');
                    return { success: false, error: telefonoValidation.error };
                }
                datos.telefono = telefonoValidation.telefonoLimpio;
            }

            const response = await API.updatePerfil(datos);

            if (response && response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                mostrarNotificacion('✅ Perfil actualizado correctamente', 'success');
                return { success: true };
            }

            const errorMsg = response?.error || 'Error al actualizar';
            mostrarNotificacion(`❌ ${errorMsg}`, 'error');
            return { success: false, error: errorMsg };

        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            mostrarNotificacion(`❌ ${error.message || 'Error al conectar con el servidor'}`, 'error');
            return { success: false, error: error.message || 'Error al conectar con el servidor' };
        }
    },

    // ============================================
    // CAMBIAR CONTRASEÑA
    // ============================================
    async cambiarPassword(passwordActual, passwordNueva) {
        const passwordValidation = this.validarPassword(passwordNueva);
        if (!passwordValidation.valid) {
            mostrarNotificacion(`❌ ${passwordValidation.error}`, 'error');
            return { success: false, error: passwordValidation.error };
        }

        try {
            const response = await fetch(`${API_URL}/auth/cambiar-password`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify({
                    password_actual: passwordActual,
                    password_nueva: passwordNueva
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('✅ Contraseña cambiada exitosamente', 'success');
            } else {
                mostrarNotificacion(`❌ ${data.error || 'Error al cambiar contraseña'}`, 'error');
            }
            return data;

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            mostrarNotificacion('❌ Error al conectar con el servidor', 'error');
            return { success: false, error: 'Error al conectar con el servidor' };
        }
    },

    // ============================================
    // CERRAR SESIÓN CON ALERTA
    // ============================================
    cerrarSesion() {
        // ✅ ALERTA DE CIERRE DE SESIÓN
        const nombreUsuario = this.usuarioActual?.nombre || 'Usuario';
        mostrarNotificacion(`👋 ¡Hasta luego ${nombreUsuario}! Has cerrado sesión correctamente.`, 'info');
        
        // Pequeña pausa para mostrar la notificación antes de redirigir
        setTimeout(() => {
            localStorage.removeItem('nexpixel_token');
            localStorage.removeItem('nexpixel_usuario');
            localStorage.removeItem('nexpixel_carrito');
            API.setToken(null);
            this.usuarioActual = null;
            
            // Redirigir después de cerrar sesión
            window.location.href = '/home';
        }, 1000);
    },

    // ============================================
    // RECARGAR USUARIO ACTUAL
    // ============================================
    async recargarUsuarioActual() {
        try {
            const token = localStorage.getItem('nexpixel_token');
            if (!token) return null;

            const response = await fetch(`${API_URL}/auth/perfil`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success && data.usuario) {
                this.usuarioActual = data.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(data.usuario));
                console.log('🔄 Usuario recargado:', this.usuarioActual.nombre);
                return this.usuarioActual;
            }
        } catch (error) {
            console.error('❌ Error recargando usuario:', error);
        }
        return null;
    }
};