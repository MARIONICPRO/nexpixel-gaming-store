// ============================================
// IA-DB.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const IARecomendaciones = {
    // ===== CARGAR RECOMENDACIONES =====
    async cargarRecomendaciones(containerId, limite = 8) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            let productos = [];
            
            if (Auth.usuarioActual) {
                // Usuario logueado - recomendaciones personalizadas
                // Por ahora, usamos productos populares como fallback
                const response = await API.getProductosPopulares(limite);
                productos = response.productos || [];
                
                // Aquí podrías implementar un endpoint específico para recomendaciones
                // const response = await API.getRecomendaciones(limite);
            } else {
                // Usuario anónimo - productos populares
                const response = await API.getProductosPopulares(limite);
                productos = response.productos || [];
            }

            this.renderizarRecomendaciones(productos, container);
        } catch (error) {
            console.error('Error cargando recomendaciones:', error);
            container.innerHTML = '<p style="color: #e94560; text-align: center;">Error cargando recomendaciones</p>';
        }
    },

    // ===== RENDERIZAR RECOMENDACIONES =====
    renderizarRecomendaciones(productos, container) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center;">No hay recomendaciones disponibles</p>';
            return;
        }

        let html = '';
        productos.forEach(prod => {
            html += `
                <div class="producto-card" onclick="verProducto(${prod.id_producto})">
                    <img src="${prod.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${prod.nombre_producto}" 
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-info">
                        <h3>${prod.nombre_producto}</h3>
                        <p class="producto-precio">$${formatearPrecio(prod.precio)}</p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== CARGAR PRODUCTOS SIMILARES =====
    async cargarSimilares(productoId, containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await API.getProductosSimilares(productoId, limite);
            const similares = response.productos || [];
            this.renderizarRecomendaciones(similares, container);
        } catch (error) {
            console.error('Error cargando productos similares:', error);
            container.innerHTML = '<p style="color: #aaccff; text-align: center;">No hay productos similares</p>';
        }
    },

    // ===== REGISTRAR INTERACCIÓN (vista, click, etc) =====
    async registrarInteraccion(productoId, tipo) {
        if (!Auth.usuarioActual) return;
        
        try {
            await fetch(`${API_URL}/interacciones`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify({
                    productoId,
                    tipo
                })
            });
        } catch (error) {
            console.error('Error registrando interacción:', error);
        }
    }
};

// Asegurarse de que formatearPrecio existe
if (typeof window.formatearPrecio !== 'function') {
    window.formatearPrecio = function(precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    };
}

// Exponer globalmente
window.IARecomendaciones = IARecomendaciones;