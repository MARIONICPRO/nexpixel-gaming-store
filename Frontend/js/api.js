// ============================================
// API Client para NexPixel
// ============================================

// ✅ URL CORRECTA PARA RENDER - DETECCIÓN AUTOMÁTICA
// Si estamos en localhost, usar localhost:3000
// Si estamos en Render, usar la URL de Render
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://nexpixel-gaming-store.onrender.com/api'; // 🔴 CAMBIA POR TU URL REAL DE RENDER

console.log('🔗 API_URL configurada:', API_URL);

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('nexpixel_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('nexpixel_token', token);
        } else {
            localStorage.removeItem('nexpixel_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        console.log('🔵 ===== API.REQUEST INICIADO =====');
        console.log('📌 Endpoint:', endpoint);
        console.log('📌 URL completa:', url);
        console.log('📌 Método:', options.method || 'GET');

        const config = {
            ...options,
            headers: this.getHeaders(),
        };

        try {
            console.log('📤 Enviando petición...');
            const response = await fetch(url, config);
            console.log('📥 Status respuesta:', response.status);

            const data = await response.json();
            console.log('📥 Datos recibidos:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }

            console.log('✅ Petición exitosa');
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            console.error('❌ URL intentada:', url);
            throw error;
        }
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: email.toLowerCase(),
                password
            }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/registro', {
            method: 'POST',
            body: JSON.stringify({
                ...userData,
                email: userData.email.toLowerCase()
            }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async getPerfil() {
        return this.request('/auth/perfil');
    }

    async updatePerfil(datos) {
        return this.request('/auth/perfil', {
            method: 'PUT',
            body: JSON.stringify(datos),
        });
    }

    async eliminarCuenta() {
        return this.request('/auth/eliminar', {
            method: 'DELETE'
        });
    }

    async getProductos(filtros = {}) {
        const params = new URLSearchParams();
        Object.keys(filtros).forEach(key => {
            if (filtros[key] && filtros[key] !== '') {
                params.append(key, filtros[key]);
            }
        });

        const response = await fetch(`${API_URL}/productos?${params.toString()}`, {
            headers: this.getHeaders()
        });

        return response.json();
    }

    async getJuegosRecientes(limite = 8) {
        return this.request(`/productos/recientes?limite=${limite}`);
    }

    async getProductoById(id) {
        return this.request(`/productos/${id}`);
    }

    async getProductosSimilares(id, limite = 4) {
        return this.request(`/productos/${id}/similares?limite=${limite}`);
    }

    async getProductosPopulares(limite = 10) {
        return this.request(`/productos/populares?limite=${limite}`);
    }

    async getRecomendaciones(limite = 8) {
        return this.request(`/recomendaciones?limite=${limite}`);
    }
}

// Instancia global
const API = new ApiClient();

console.log('✅ api.js cargado correctamente');
console.log('🔗 API_URL final:', API_URL);
console.log('🔍 Instancia API creada:', typeof API);