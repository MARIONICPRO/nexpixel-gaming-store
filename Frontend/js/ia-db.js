// ============================================
// IA-DB.JS - VERSIÓN CORREGIDA (CONTENEDOR CORRECTO)
// ============================================

const API_URL = 'http://localhost:3000/api';

const IARecomendaciones = {
    // ===== CARGAR RECOMENDACIONES GENERALES =====
    async cargarRecomendaciones(containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando recomendaciones...</p></div>';
            
            const usuarioId = Auth.usuarioActual?.id_usuario || null;
            let url = `${API_URL}/ia/recomendaciones?limite=${limite}`;
            if (usuarioId) {
                url += `&usuarioId=${usuarioId}`;
            }
            
            console.log('📡 Cargando recomendaciones:', url);
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('📦 Respuesta IA:', data.success ? '✅' : '❌', data.productos?.length || 0, 'productos');
            
            if (data.success && data.productos && data.productos.length > 0) {
                this.renderizarProductos(data.productos, container, data.razonamiento);
            } else {
                const fallbackRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                const fallbackData = await fallbackRes.json();
                this.renderizarProductos(fallbackData.productos || [], container, '✨ Productos populares en NexPixel');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            container.innerHTML = '<p style="color: #e94560; text-align: center;">⚠️ Error cargando recomendaciones</p>';
        }
    },

    // ===== CARGAR RECOMENDACIONES PARA EL CARRITO =====
    async cargarRecomendacionesCarrito(containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.log('❌ Contenedor no encontrado:', containerId);
            return;
        }

        try {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analizando tu carrito...</p></div>';
            
            const usuarioId = Auth.usuarioActual?.id_usuario || null;
            
            console.log('🛒 Cargando recomendaciones para carrito, usuario:', usuarioId);
            
            const response = await fetch(`${API_URL}/ia/recomendaciones?limite=${limite}&usuarioId=${usuarioId}`);
            const data = await response.json();
            
            if (data.success && data.productos && data.productos.length > 0) {
                console.log('✅ IA cargada:', data.productos.length, 'productos');
                this.renderizarProductos(data.productos, container, data.razonamiento);
                return;
            }
            
            // Fallback a populares
            const popRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
            const popData = await popRes.json();
            this.renderizarProductos(popData.productos || [], container, '✨ Productos populares en NexPixel');
            
        } catch (error) {
            console.error('❌ Error en cargarRecomendacionesCarrito:', error);
            container.innerHTML = '<p style="color: #e94560; text-align: center;">⚠️ Error cargando recomendaciones</p>';
        }
    },

    // ===== CARGAR RECOMENDACIONES PARA PÁGINA DE PRODUCTO =====
    async cargarRecomendacionesProducto(productoId, containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando similares...</p></div>';
            
            console.log('🎮 Cargando similares para producto:', productoId);
            
            const response = await fetch(`${API_URL}/productos/${productoId}/similares?limite=${limite}`);
            const data = await response.json();
            
            if (data.success && data.similares && data.similares.length > 0) {
                const razonamiento = 'Los jugadores que vieron este producto también compraron:';
                this.renderizarProductos(data.similares, container, razonamiento);
            } else {
                const popularRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                const popularData = await popularRes.json();
                this.renderizarProductos(popularData.productos || [], container, '✨ También te puede interesar');
            }
        } catch (error) {
            console.error('❌ Error cargando similares:', error);
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ Descubre más productos</p>';
        }
    },

    // ===== CARGAR PRODUCTOS SIMILARES (legado) =====
    async cargarSimilares(productoId, containerId, limite = 4) {
        await this.cargarRecomendacionesProducto(productoId, containerId, limite);
    },

    // ===== RENDERIZAR PRODUCTOS (ESTILO UNIFICADO) =====
    renderizarProductos(productos, container, razonamiento) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ No hay productos disponibles</p>';
            return;
        }

        let html = '';

        // RAZONAMIENTO
        if (razonamiento && razonamiento !== '') {
            html += `
            <div class="ia-razonamiento-card">
                <div class="ia-header">
                    <span class="ia-icon"><i class="fa-solid fa-brain"></i></span>
                    <h3>¿Por qué te recomendamos esto?</h3>
                    <span class="ia-badge">IA NexPixel</span>
                </div>
                <p class="ia-text">${razonamiento}</p>
                <div class="ia-footer">
                    <i class="fa-solid fa-robot"></i> Recomendación personalizada
                </div>
            </div>
            `;
        }

        // GRID DE PRODUCTOS - MISMA ESTRUCTURA QUE PRODUCTOS.JS
        html += `<div class="productos-grid">`;

        productos.slice(0, 4).forEach(prod => {
            const id = prod.id_producto || prod.id;
            const nombre = prod.nombre_producto || 'Producto';
            const precio = prod.precio || 0;
            const imagen = prod.imagen_url || 'assets/img/default-game.jpg';
            const plataforma = prod.plataforma?.nombre_plataforma || prod.categoria || 'Videojuego';

            html += `
            <div class="producto-card" onclick="verProducto(${id})">
                <div class="producto-img-container">
                    <img src="${imagen}" 
                         alt="${nombre}"
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                </div>
                <div class="producto-info">
                    <h3>${this.truncarTexto(nombre, 30)}</h3>
                    <div class="producto-plataforma">${plataforma}</div>
                    <div class="producto-precio">$${formatearPrecio(precio)}</div>
                    <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${id})">
                        <i class="fa-solid fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    // Alias para compatibilidad
    renderizarRecomendaciones(productos, container, razonamiento) {
        this.renderizarProductos(productos, container, razonamiento);
    },

    renderizarSimilares(productos, container) {
        this.renderizarProductos(productos, container, null);
    },

    // ===== TRUNCAR TEXTO =====
    truncarTexto(texto, maxLength) {
        if (!texto) return '';
        return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
    },

    // ===== REGISTRAR INTERACCIÓN =====
    async registrarInteraccion(productoId, tipo) {
        if (!Auth.usuarioActual) return;
        try {
            await fetch(`${API_URL}/ia/interaccion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: Auth.usuarioActual.id_usuario,
                    productoId: parseInt(productoId),
                    tipoInteraccion: tipo
                })
            });
        } catch (error) {
            console.error('Error registrando interacción:', error);
        }
    }
};

// ===== INICIALIZACIÓN AUTOMÁTICA PARA TODAS LAS PÁGINAS =====
async function inicializarRecomendaciones() {
    const path = window.location.pathname;
    console.log('🎯 Inicializando recomendaciones en:', path);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ============================================
    // PÁGINA DE PRODUCTO
    // ============================================
    if (path.includes('producto.html')) {
        const container = document.getElementById('recomendaciones-ia-container');
        if (container) {
            const urlParams = new URLSearchParams(window.location.search);
            const productoId = urlParams.get('id');
            if (productoId) {
                console.log('🎮 Producto ID:', productoId);
                IARecomendaciones.cargarRecomendacionesProducto(productoId, 'recomendaciones-ia-container', 4);
            }
        }
    }
    
    // ============================================
    // PÁGINA DEL CARRITO
    // ============================================
    if (path.includes('carrito.html')) {
        const container = document.getElementById('recomendaciones-ia-container');
        if (container) {
            console.log('🛒 Cargando recomendaciones para carrito');
            IARecomendaciones.cargarRecomendacionesCarrito('recomendaciones-ia-container', 4);
        } else {
            console.log('❌ Contenedor "recomendaciones-ia-container" no encontrado en carrito');
        }
    }
    
    // ============================================
    // PÁGINA DE JUEGOS/INDEX
    // ============================================
    if (path.includes('juegos.html') || path.includes('index.html') || path === '/' || path.endsWith('/')) {
        const container = document.getElementById('recomendaciones-container') || 
                         document.getElementById('recomendaciones-ia-container');
        if (container) {
            console.log('🏠 Cargando recomendaciones generales');
            IARecomendaciones.cargarRecomendaciones(container.id, 4);
        }
    }
}

// ===== EJECUTAR INICIALIZACIÓN CON MÚLTIPLES INTENTOS =====
document.addEventListener('DOMContentLoaded', inicializarRecomendaciones);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(inicializarRecomendaciones, 300);
}

// Intentos adicionales para asegurar que cargue
setTimeout(inicializarRecomendaciones, 600);
setTimeout(inicializarRecomendaciones, 1000);

// Exponer globalmente
window.IARecomendaciones = IARecomendaciones;