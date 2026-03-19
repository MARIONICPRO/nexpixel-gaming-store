// ============================================
// AUTH.JS - VERSIÓN PARA FRONTEND (USA API)
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

    async login(email, password) {
        try {
            console.log('🔍 Intentando login con:', email);
            
            const response = await API.login(email, password);
            
            console.log('📥 Respuesta del servidor:', response);
            
            if (response && response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                return { success: true, usuario: response.usuario };
            }
            
            return { success: false, error: response?.error || 'Error al iniciar sesión' };
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            return { success: false, error: error.message || 'Error al conectar con el servidor' };
        }
    },

    async register(datos) {
        try {
            console.log('📝 Registrando usuario:', datos);

            const datosRegistro = {
                nombre: datos.nombre,
                email: datos.email,
                password: datos.password,
                tipo_usuario: datos.tipo_usuario,
                telefono: datos.telefono || '',
                empresa: datos.empresa || null,
                nit: datos.nit || null
            };

            console.log('📤 Enviando a API:', datosRegistro);

            const response = await API.register(datosRegistro);

            if (response && response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                return { success: true, usuario: response.usuario };
            }

            return { success: false, error: response?.error || 'Error al registrar' };
            
        } catch (error) {
            console.error('❌ Error en registro:', error);
            return { success: false, error: error.message || 'Error al conectar con el servidor' };
        }
    },

    async actualizarPerfil(datos) {
        try {
            const response = await API.updatePerfil(datos);

            if (response && response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                return { success: true };
            }

            return { success: false, error: response?.error || 'Error al actualizar' };
            
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            return { success: false, error: error.message || 'Error al conectar con el servidor' };
        }
    },

    async cambiarPassword(passwordActual, passwordNueva) {
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
            return data;
            
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            return { success: false, error: 'Error al conectar con el servidor' };
        }
    },

    cerrarSesion() {
        localStorage.removeItem('nexpixel_token');
        localStorage.removeItem('nexpixel_usuario');
        API.setToken(null);
        this.usuarioActual = null;
        window.location.href = 'index.html';
    }
};