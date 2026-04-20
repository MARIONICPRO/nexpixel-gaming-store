// ============================================
// IA-DB.JS - VERSIÓN CORREGIDA Y FUNCIONAL
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
                this.renderizarRecomendaciones(data.productos, container, data.razonamiento);
            } else {
                const fallbackRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                const fallbackData = await fallbackRes.json();
                this.renderizarRecomendaciones(fallbackData.productos || [], container, '✨ Productos populares en NexPixel');
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
            
            const productosEnCarrito = Carrito.items.map(item => ({
                id: item.productoId || item.id_producto,
                nombre: item.producto?.nombre_producto || item.nombre
            }));
            
            console.log('🛒 Productos en carrito:', productosEnCarrito.length);
            
            // ============================================
            // CASO 1: CARRITO VACÍO - USAR IA GENERAL
            // ============================================
            if (productosEnCarrito.length === 0) {
                console.log('📭 Carrito vacío, usando IA general');
                
                const usuarioId = Auth.usuarioActual?.id_usuario || null;
                
                try {
                    const response = await fetch(`${API_URL}/ia/recomendaciones?limite=${limite}&usuarioId=${usuarioId}`);
                    const data = await response.json();
                    
                    if (data.success && data.productos && data.productos.length > 0) {
                        console.log('✅ IA general cargada:', data.productos.length, 'productos');
                        this.renderizarRecomendaciones(data.productos, container, data.razonamiento);
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error cargando IA general:', error);
                }
                
                // Fallback a populares
                try {
                    const popRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                    const popData = await popRes.json();
                    this.renderizarRecomendaciones(popData.productos || [], container, '✨ Productos populares en NexPixel');
                } catch (e) {
                    console.error('❌ Error en fallback:', e);
                    container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ Explora nuestro catálogo</p>';
                }
                return;
            }
            
            // ============================================
            // CASO 2: CARRITO CON PRODUCTOS
            // ============================================
            console.log('🛒 Buscando similares a productos del carrito');
            
            // Usar el primer producto como referencia
            const primerProducto = productosEnCarrito[0];
            
            try {
                const response = await fetch(`${API_URL}/productos/${primerProducto.id}/similares?limite=${limite}`);
                const data = await response.json();
                
                if (data.success && data.similares && data.similares.length > 0) {
                    const nombres = productosEnCarrito.map(p => p.nombre).slice(0, 2).join(' y ');
                    const razonamiento = `Como agregaste "${nombres}" al carrito, también te podría gustar:`;
                    this.renderizarRecomendaciones(data.similares, container, razonamiento);
                    return;
                }
            } catch (error) {
                console.log('⚠️ Error buscando similares:', error);
            }
            
            // Fallback: IA general
            const usuarioId = Auth.usuarioActual?.id_usuario || null;
            try {
                const iaRes = await fetch(`${API_URL}/ia/recomendaciones?limite=${limite}&usuarioId=${usuarioId}`);
                const iaData = await iaRes.json();
                if (iaData.success && iaData.productos) {
                    this.renderizarRecomendaciones(iaData.productos, container, iaData.razonamiento);
                    return;
                }
            } catch (e) {
                console.log('⚠️ Error IA fallback:', e);
            }
            
            // Último recurso: populares
            const popRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
            const popData = await popRes.json();
            this.renderizarRecomendaciones(popData.productos || [], container, '✨ Completa tu colección');
            
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
            
            const response = await fetch(`${API_URL}/productos/${productoId}/similares?limite=${limite}`);
            const data = await response.json();
            
            if (data.success && data.similares && data.similares.length > 0) {
                const razonamiento = 'Los jugadores que vieron este producto también compraron:';
                this.renderizarRecomendaciones(data.similares, container, razonamiento);
            } else {
                const popularRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
                const popularData = await popularRes.json();
                this.renderizarRecomendaciones(popularData.productos || [], container, '✨ También te puede interesar');
            }
        } catch (error) {
            console.error('❌ Error cargando similares:', error);
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ Descubre más productos</p>';
        }
    },

    // ===== CARGAR PRODUCTOS SIMILARES =====
    async cargarSimilares(productoId, containerId, limite = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando productos similares...</p></div>';
            
            const response = await fetch(`${API_URL}/productos/${productoId}/similares?limite=${limite}`);
            const data = await response.json();
            
            if (data.success && data.similares && data.similares.length > 0) {
                this.renderizarSimilares(data.similares, container);
            } else {
                container.innerHTML = '<p style="text-align: center; color: #aaccff;">No hay productos similares disponibles</p>';
            }
        } catch (error) {
            console.error('❌ Error cargando similares:', error);
            container.innerHTML = '<p style="text-align: center; color: #e94560;">Error al cargar productos similares</p>';
        }
    },

    // ===== RENDERIZAR RECOMENDACIONES CON RAZONAMIENTO =====
    renderizarRecomendaciones(productos, container, razonamiento) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ No hay recomendaciones disponibles</p>';
            return;
        }

        let html = '<div class="recomendaciones-wrapper">';

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

        // GRID DE PRODUCTOS
        html += `<div class="productos-grid">`;

        productos.slice(0, 4).forEach(prod => {
            let imagenUrl = prod.imagen_url || 'assets/img/default-game.jpg';
            const nombreProducto = prod.nombre_producto || 'Producto';
            const precio = prod.precio || 0;
            const categoria = prod.categoria || prod.plataforma?.nombre_plataforma || 'Videojuego';

            html += `
            <div class="producto-card" onclick="verProducto(${prod.id_producto})">
                <div class="producto-img-container">
                    <img src="${imagenUrl}" 
                         alt="${nombreProducto}"
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                </div>
                <div class="producto-info">
                    <h3>${this.truncarTexto(nombreProducto, 30)}</h3>
                    <div class="producto-plataforma">${categoria}</div>
                    <div class="producto-precio">$${formatearPrecio(precio)}</div>
                    <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${prod.id_producto})">
                        <i class="fa-solid fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },

    // ===== RENDERIZAR SIMILARES (sin razonamiento) =====
    renderizarSimilares(productos, container) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">No hay productos similares</p>';
            return;
        }

        let html = '<div class="productos-grid">';
        
        productos.slice(0, 4).forEach(prod => {
            let imagenUrl = prod.imagen_url;
            if (!imagenUrl || imagenUrl === '' || imagenUrl === 'default-game.jpg') {
                imagenUrl = 'assets/img/default-game.jpg';
            }
            
            html += `
                <div class="producto-card" onclick="verProducto(${prod.id_producto})">
                    <img src="${imagenUrl}" 
                         alt="${prod.nombre_producto}" 
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-info">
                        <h3>${this.truncarTexto(prod.nombre_producto, 30)}</h3>
                        <div class="producto-plataforma">${prod.categoria || 'Videojuego'}</div>
                        <div class="producto-precio">$${formatearPrecio(prod.precio)}</div>
                        <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${prod.id_producto})">
                            <i class="fa-solid fa-cart-plus"></i> Agregar
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
            console.error('Error registrando interacción:', error);
        }
    }
};

// ===== INICIALIZACIÓN AUTOMÁTICA CORREGIDA =====
async function inicializarRecomendacionesCarrito() {
    console.log('🎯 Inicializando recomendaciones del carrito');
    
    // Esperar a que el DOM y Carrito estén listos
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Asegurar que Carrito esté inicializado
    if (typeof Carrito !== 'undefined' && typeof Carrito.inicializar === 'function') {
        if (!Carrito.items || Carrito.items.length === undefined) {
            await Carrito.inicializar();
        }
    }
    
    console.log('📦 Carrito items:', Carrito.items?.length || 0);
    
    const container = document.getElementById('recomendaciones-container');
    if (!container) {
        console.log('❌ Contenedor "recomendaciones-container" no encontrado');
        return;
    }
    
    const usuarioId = Auth.usuarioActual?.id_usuario;
    
    // SIEMPRE usar IA general cuando el carrito está vacío
    if (!Carrito.items || Carrito.items.length === 0) {
        console.log('📭 Carrito vacío, cargando IA general directamente');
        
        try {
            const response = await fetch(`${API_URL}/ia/recomendaciones?limite=4&usuarioId=${usuarioId}`);
            const data = await response.json();
            
            if (data.success && data.productos && data.productos.length > 0) {
                console.log('✅ IA general cargada:', data.productos.length, 'productos');
                IARecomendaciones.renderizarRecomendaciones(data.productos, container, data.razonamiento);
                return;
            }
        } catch (error) {
            console.error('❌ Error cargando IA general:', error);
        }
        
        // Fallback a populares solo si IA falla
        try {
            const popRes = await fetch(`${API_URL}/ia/populares?limite=4`);
            const popData = await popRes.json();
            IARecomendaciones.renderizarRecomendaciones(popData.productos || [], container, '✨ Productos populares en NexPixel');
        } catch (e) {
            console.error('❌ Error en fallback:', e);
        }
    } else {
        // Carrito con productos - usar lógica de similares
        console.log('🛒 Carrito con productos, buscando similares');
        IARecomendaciones.cargarRecomendacionesCarrito('recomendaciones-container', 4);
    }
}

// ===== EJECUTAR INICIALIZACIÓN =====
if (window.location.pathname.includes('carrito.html')) {
    document.addEventListener('DOMContentLoaded', inicializarRecomendacionesCarrito);
    // Backup por si el DOMContentLoaded ya pasó
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(inicializarRecomendacionesCarrito, 300);
    }
}

// Exponer globalmente
window.IARecomendaciones = IARecomendaciones;
window.cargarRecomendacionesCarrito = () => IARecomendaciones.cargarRecomendacionesCarrito('recomendaciones-container', 4);