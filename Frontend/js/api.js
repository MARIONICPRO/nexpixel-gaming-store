// ============================================
// API Client para NexPixel
// ============================================

const API_URL = 'http://localhost:3000/api';

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
        console.log('📌 Headers:', this.getHeaders());
        if (options.body) {
            console.log('📌 Body:', options.body);
        }

        const config = {
            ...options,
            headers: this.getHeaders(),
        };

        try {
            console.log('📤 Enviando petición...');
            const response = await fetch(url, config);
            console.log('📥 Status respuesta:', response.status);
            console.log('📥 Status text:', response.statusText);

            const data = await response.json();
            console.log('📥 Datos recibidos:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }

            console.log('✅ Petición exitosa');
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // EN api.js - Método login
    async login(email, password) {
        // ✅ CONVERTIR EMAIL A MINÚSCULAS ANTES DE ENVIAR
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

    // Método register
    async register(userData) {
        // ✅ CONVERTIR EMAIL A MINÚSCULAS ANTES DE ENVIAR
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

    // 👇 NUEVO: Método para eliminar cuenta
    async eliminarCuenta() {
        return this.request('/auth/eliminar', {
            method: 'DELETE'
        });
    }

    // ===== PRODUCTOS =====
    async getProductos(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        return this.request(`/productos${params ? '?' + params : ''}`);
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

    // ===== RECOMENDACIONES =====
    async getRecomendaciones(limite = 8) {
        return this.request(`/recomendaciones?limite=${limite}`);
    }
}

// Instancia global
const API = new ApiClient();