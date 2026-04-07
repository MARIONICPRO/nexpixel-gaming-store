// ============================================
// IA-DB.JS - VERSIÓN CON CLASES DE TU CSS GLOBAL
// ============================================

const API_URL = 'http://localhost:3000/api';

const IARecomendaciones = {
    // ===== CARGAR RECOMENDACIONES =====
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
            
            if (data.success && data.productos) {
                this.renderizarRecomendaciones(data.productos, container);
            } else {
                const fallbackRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                const fallbackData = await fallbackRes.json();
                this.renderizarRecomendaciones(fallbackData.productos || [], container);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            container.innerHTML = '<p style="color: #e94560; text-align: center;">⚠️ Error cargando recomendaciones</p>';
        }
    },

    // ===== CARGAR PRODUCTOS SIMILARES =====
    async cargarSimilares(productoId, containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando productos similares...</p></div>';
            
            const response = await fetch(`${API_URL}/ia/productos/${productoId}/similares?limite=${limite}`);
            const data = await response.json();
            
            if (data.success && data.productos && data.productos.length > 0) {
                this.renderizarRecomendaciones(data.productos, container);
            } else {
                container.innerHTML = '<p style="text-align: center; color: #aaccff;">No hay productos similares disponibles</p>';
            }
        } catch (error) {
            console.error('❌ Error cargando similares:', error);
            container.innerHTML = '<p style="text-align: center; color: #e94560;">Error al cargar productos similares</p>';
        }
    },

    // ===== RENDERIZAR RECOMENDACIONES (USANDO CLASES DE TU CSS) =====
    renderizarRecomendaciones(productos, container) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ No hay recomendaciones disponibles</p>';
            return;
        }

        // Usar la clase 'productos-grid' de tu CSS
        let html = '<div class="productos-grid">';
        
        productos.slice(0, 4).forEach(prod => {
            html += `
                <div class="producto-card" onclick="verProducto(${prod.id_producto})">
                    <img src="${prod.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${prod.nombre_producto}" 
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-info">
                        <h3>${this.truncarTexto(prod.nombre_producto, 30)}</h3>
                        <div class="producto-plataforma">${prod.categoria || 'Videojuego'}</div>
                        <div class="producto-precio">$${formatearPrecio(prod.precio)}</div>
                        <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${prod.id_producto})">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
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
            console.error('Error:', error);
        }
    }
};

// Exponer globalmente
window.IARecomendaciones = IARecomendaciones;