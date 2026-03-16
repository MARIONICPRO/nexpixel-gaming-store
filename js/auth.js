// ============================================
// AUTH.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Auth = {
    usuarioActual: null,

    async init() {
        await this.cargarUsuario();
        // No necesitamos verificarAdmin aquí, el backend lo maneja
    },

    async cargarUsuario() {
        const token = localStorage.getItem('nexpixel_token');
        const usuarioGuardado = localStorage.getItem('nexpixel_usuario');
        
        if (token && usuarioGuardado) {
            try {
                // Verificar que el token sigue siendo válido
                const response = await API.getPerfil();
                if (response.success) {
                    this.usuarioActual = response.usuario;
                    localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                } else {
                    // Token inválido o expirado
                    this.cerrarSesion();
                }
            } catch (error) {
                console.error('Error cargando usuario:', error);
                this.cerrarSesion();
            }
        }
    },

    async login(email, password) {
        try {
            const response = await API.login(email, password);
            
            if (response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                // El token ya se guardó en API.setToken()
                return { success: true, usuario: response.usuario };
            }
            
            return { success: false, error: response.error };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error al conectar con el servidor' };
        }
    },

    async register(datos) {
        try {
            // Preparar datos para enviar al backend
            const datosRegistro = {
                nombre: datos.nombre,
                email: datos.email,
                password: datos.password_hash, // El backend espera 'password'
                tipo_usuario: datos.tipo_usuario,
                telefono: datos.telefono || '',
                empresa: datos.empresa || null,
                nit: datos.nit || null
            };

            const response = await API.register(datosRegistro);
            
            if (response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                return { success: true, usuario: response.usuario };
            }
            
            return { success: false, error: response.error };
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: 'Error al conectar con el servidor' };
        }
    },

    async actualizarPerfil(id, datos) {
        try {
            const response = await API.updatePerfil(datos);
            
            if (response.success) {
                this.usuarioActual = response.usuario;
                localStorage.setItem('nexpixel_usuario', JSON.stringify(response.usuario));
                return { success: true };
            }
            
            return { success: false, error: response.error };
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return { success: false, error: 'Error al conectar con el servidor' };
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
            console.error('Error cambiando contraseña:', error);
            return { success: false, error: 'Error al conectar con el servidor' };
        }
    },

    cerrarSesion() {
        localStorage.removeItem('nexpixel_token');
        localStorage.removeItem('nexpixel_usuario');
        API.setToken(null);
        this.usuarioActual = null;
        window.location.reload();
    },

    // Esta función ya no es necesaria, pero la dejamos por compatibilidad
    async verificarAdmin() {
        // El backend ya tiene un admin por defecto
        console.log('Verificación de admin manejada por el backend');
    }
};