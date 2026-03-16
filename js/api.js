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
        const config = {
            ...options,
            headers: this.getHeaders(),
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/registro', {
            method: 'POST',
            body: JSON.stringify(userData),
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

    // Productos
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
    // ===== EN api.js - Agrega estos métodos =====

    // Productos populares
    async getProductosPopulares(limite = 10) {
        return this.request(`/productos/populares?limite=${limite}`);
    }

    // (Opcional) Recomendaciones personalizadas
    async getRecomendaciones(limite = 8) {
        return this.request(`/recomendaciones?limite=${limite}`);
    }
}


// Instancia global
const API = new ApiClient();