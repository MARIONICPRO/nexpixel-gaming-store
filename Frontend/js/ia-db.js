// ============================================
// IA-DB.JS - VERSIÓN CON RAZONAMIENTO DE IA
// ============================================

const API_URL = 'http://localhost:3000/api';

const IARecomendaciones = {
    // ===== CARGAR RECOMENDACIONES =====
  // js/ia-db.js - Modifica la función cargarRecomendaciones

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
        
        console.log('📦 Respuesta completa:', data); // 🔥 VER EN CONSOLA
        console.log('🧠 Razonamiento recibido:', data.razonamiento); // 🔥 VER RAZONAMIENTO
        
        if (data.success && data.productos) {
            // Pasar productos Y razonamiento
            this.renderizarRecomendaciones(data.productos, container, data.razonamiento);
        } else {
            const fallbackRes = await fetch(`${API_URL}/ia/populares?limite=${limite}`);
            const fallbackData = await fallbackRes.json();
            this.renderizarRecomendaciones(fallbackData.productos || [], container, null);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        container.innerHTML = '<p style="color: #e94560; text-align: center;">⚠️ Error cargando recomendaciones</p>';
    }
},

    // ===== RENDERIZAR RECOMENDACIONES CON RAZONAMIENTO =====
    renderizarRecomendaciones(productos, container, razonamiento) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaccff;">✨ No hay recomendaciones disponibles</p>';
            return;
        }

        let html = '';

        // 🔥 SECCIÓN DE RAZONAMIENTO DE LA IA (si existe)
        if (razonamiento && razonamiento !== '') {
            html += `
                <div class="ia-razonamiento-card" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                ">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 28px;"><i class="fa-solid fa-brain"></i></span>
                        <h3 style="color: white; margin: 0; font-size: 18px;">¿Por qué te recomendamos esto?</h3>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: white;">IA Generativa</span>
                    </div>
                    <p style="color: white; margin: 0; line-height: 1.6; font-size: 15px;">${razonamiento}</p>
                    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 13px; color: rgba(255,255,255,0.8);">
                        <i class="fa-brands fa-think-peaks"></i> Basado en tu historial de compras y visualizaciones
                    </div>
                </div>
            `;
        }

        // PRODUCTOS RECOMENDADOS
        html += '<div class="productos-grid">';
        
        productos.slice(0, 4).forEach(prod => {
            // Manejar imagen con fallback
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
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
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
                this.renderizarSimilares(data.productos, container);
            } else {
                container.innerHTML = '<p style="text-align: center; color: #aaccff;">No hay productos similares disponibles</p>';
            }
        } catch (error) {
            console.error('❌ Error cargando similares:', error);
            container.innerHTML = '<p style="text-align: center; color: #e94560;">Error al cargar productos similares</p>';
        }
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