// ============================================
// IA-DB.JS - RECOMENDACIONES INTELIGENTES
// Versión corregida con personalización real
// ============================================

const API_URL = 'http://localhost:3000/api';

const IARecomendaciones = {
    // Cache para evitar múltiples llamadas iguales
    cache: new Map(),

    async cargarRecomendacionesUniversal({
        containerId,
        tipo = "general",
        productoId = null,
        limite = 4,
        forceRefresh = false
    }) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`⚠️ Container no encontrado: ${containerId}`);
            return;
        }

        // Buscar contenedor de razonamiento (puede estar separado o dentro)
        let razonamientoContainer = document.getElementById("ia-razonamiento");
        let tieneRazonamientoSeparado = !!razonamientoContainer;

        // Si no hay contenedor separado, usaremos el mismo container para todo
        if (!tieneRazonamientoSeparado) {
            razonamientoContainer = container;
        }

        // Mostrar loading
        if (tieneRazonamientoSeparado) {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando recomendaciones...</p></div>';
            razonamientoContainer.innerHTML = '';
        } else {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando recomendaciones personalizadas...</p></div>';
        }

        try {
            // Obtener usuario logeado
            const usuarioId = Auth.usuarioActual?.id_usuario || null;
            
            // Log para debugging
            console.log(`🔍 IA: Cargando recomendaciones - Tipo: ${tipo}, Usuario: ${usuarioId || 'anónimo'}, Producto: ${productoId || 'ninguno'}`);

            let url = '';
            let razonamientoBase = '';

            // Construir URL según el tipo
            if (tipo === "producto" && productoId) {
                url = `${API_URL}/productos/${productoId}/similares?limite=${limite}`;
                razonamientoBase = '🎮 Los jugadores que vieron este producto también compraron:';
                console.log(`📦 Buscando productos similares al ID: ${productoId}`);
            } else {
                // PARA GENERAL: SIEMPRE intentar personalizado primero
                url = `${API_URL}/ia/recomendaciones?limite=${limite}`;
                if (usuarioId) {
                    url += `&usuarioId=${usuarioId}`;
                    razonamientoBase = '🎯 Basado en tus compras y visitas recientes:';
                    console.log(`👤 Recomendaciones personalizadas para usuario: ${usuarioId}`);
                } else {
                    razonamientoBase = '🔥 Productos populares del momento:';
                    console.log(`🌍 Recomendaciones generales (usuario no logueado)`);
                }
            }

            // Verificar caché para evitar llamadas repetidas
            const cacheKey = `${url}_${tipo}`;
            if (!forceRefresh && this.cache.has(cacheKey)) {
                console.log(`💾 Usando caché para: ${cacheKey}`);
                const cached = this.cache.get(cacheKey);
                this.renderizarRecomendaciones(cached.productos, container, razonamientoContainer, cached.razonamiento, tieneRazonamientoSeparado);
                return;
            }

            // Hacer petición al backend
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📡 Respuesta del backend:`, data);

            let productos = [];
            let razonamiento = razonamientoBase;

            // Procesar respuesta según tipo
            if (tipo === "producto") {
                productos = data.similares || [];
                if (productos.length === 0) {
                    razonamiento = '⚠️ No encontramos productos similares, pero estos te pueden interesar:';
                }
            } else {
                productos = data.productos || [];
                
                // Usar el razonamiento del backend si existe
                if (data.razonamiento) {
                    razonamiento = data.razonamiento;
                }
                
                // Verificar si realmente son personalizados o son populares
                if (usuarioId && productos.length > 0) {
                    // Revisar si el backend nos dio personalizados o fallback
                    const esPersonalizado = data.es_personalizado !== undefined ? data.es_personalizado : true;
                    if (!esPersonalizado) {
                        razonamiento = '🎯 No tenemos suficientes datos sobre ti, pero estos productos populares pueden interesarte:';
                        console.log(`⚠️ Backend retornó fallback (populares) para usuario ${usuarioId}`);
                    } else {
                        console.log(`✅ Recomendaciones PERSONALIZADAS cargadas para usuario ${usuarioId}`);
                    }
                }
            }

            // Si no hay productos, usar fallback de populares
            if (!productos || productos.length === 0) {
                console.log(`⚠️ Sin resultados, cargando productos populares como fallback...`);
                const fallbackUrl = `${API_URL}/ia/populares?limite=${limite}`;
                const fallbackResponse = await fetch(fallbackUrl);
                const fallbackData = await fallbackResponse.json();
                productos = fallbackData.productos || [];
                razonamiento = '<i class="fas fa-gamepad"></i>   Productos más populares en NexPixel';
                console.log(`🔄 Fallback: ${productos.length} productos populares cargados`);
            }

            // Guardar en caché
            this.cache.set(cacheKey, { productos, razonamiento });

            // Renderizar
            this.renderizarRecomendaciones(productos, container, razonamientoContainer, razonamiento, tieneRazonamientoSeparado);

        } catch (error) {
            console.error('❌ Error en IARecomendaciones:', error);
            
            // Mostrar error amigable
            if (tieneRazonamientoSeparado) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <p>No pudimos cargar las recomendaciones</p>
                        <button onclick="IARecomendaciones.cargarRecomendacionesUniversal({containerId: '${containerId}', tipo: '${tipo}', productoId: ${productoId}, forceRefresh: true})" class="btn-reintentar">
                            <i class="fa-solid fa-rotate-right"></i> Reintentar
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <p>Error cargando recomendaciones</p>
                        <button onclick="location.reload()" class="btn-reintentar">Reintentar</button>
                    </div>
                `;
            }
        }
    },

    renderizarRecomendaciones(productos, container, razonamientoContainer, razonamiento, tieneRazonamientoSeparado) {
        if (!productos.length) {
            const msg = '<p class="empty-message">No hay productos para mostrar</p>';
            if (tieneRazonamientoSeparado) {
                container.innerHTML = msg;
            } else {
                container.innerHTML = msg;
            }
            return;
        }

        // Renderizar razonamiento
        if (razonamiento && razonamientoContainer) {
            razonamientoContainer.innerHTML = `
                <div class="ia-razonamiento-card">
                    <div class="ia-header">
                        <div class="ia-icon">
                            <i class="fa-solid fa-brain"></i>
                        </div>
                        <h3>IA NexPixel Recomienda</h3>
                        <div class="ia-badge">Personalizado</div>
                    </div>
                    <div class="ia-text">
                        <i class="fa-solid fa-quote-left"></i> ${razonamiento}
                    </div>
                    <div class="ia-footer">
                        <i class="fa-regular fa-clock"></i> Basado en tu actividad reciente
                    </div>
                </div>
            `;
        }

        // Renderizar productos
        let html = `<div class="productos-grid">`;

        productos.forEach(prod => {
            const id = prod.id_producto || prod.id;
            const nombre = prod.nombre_producto || 'Producto';
            const precio = prod.precio || 0;
            const imagen = prod.imagen_url || 'assets/img/default-game.jpg';
            const plataforma = prod.plataforma || 'Multiplataforma';

            html += `
            <div class="producto-card" data-id="${id}" onclick="verProducto(${id})">
                <img src="${imagen}" class="producto-img" alt="${nombre}" loading="lazy" onerror="this.src='assets/img/default-game.jpg'">
                <div class="producto-info">
                    <h3>${this.truncarTexto(nombre, 50)}</h3>
                    <div class="producto-plataforma">
                        <i class="fa-solid fa-desktop"></i> ${plataforma}
                    </div>
                    <div class="producto-precio">
                        $${formatearPrecio(precio)}
                    </div>
                    <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${id})">
                        <i class="fa-solid fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
            `;
        });

        html += `</div>`;
        
        if (tieneRazonamientoSeparado) {
            container.innerHTML = html;
        } else {
            container.innerHTML = razonamiento ? 
                `<div class="ia-razonamiento-card-inline">${razonamiento}</div>${html}` : 
                html;
        }
    },

    truncarTexto(texto, maxLength) {
        if (!texto) return '';
        return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
    }
};

// ============================================
// INICIALIZACIÓN SEGÚN LA PÁGINA
// ============================================

async function inicializarRecomendaciones() {
    const path = window.location.pathname;
    console.log(`🚀 Inicializando IA en: ${path}`);

    // Esperar a que Auth esté listo (importante!)
    let esperas = 0;
    while (!Auth?.usuarioActual && esperas < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        esperas++;
    }
    
    if (Auth?.usuarioActual) {
        console.log(`✅ Usuario logueado: ${Auth.usuarioActual.id_usuario} (${Auth.usuarioActual.nombre})`);
    } else {
        console.log(`👤 Usuario no logueado - recomendaciones generales`);
    }

    // Pequeña pausa para asegurar que todo esté listo
    await new Promise(resolve => setTimeout(resolve, 200));

    if (path.includes('producto.html')) {
        // Página de detalle de producto
        const params = new URLSearchParams(window.location.search);
        const productoId = params.get('id');
        
        if (productoId) {
            console.log(`🎮 Producto ID: ${productoId} - Cargando recomendaciones similares`);
            IARecomendaciones.cargarRecomendacionesUniversal({
                containerId: 'recomendaciones-ia-container',
                tipo: 'producto',
                productoId: productoId,
                limite: 4
            });
        } else {
            console.warn('⚠️ No se encontró ID de producto, usando recomendaciones generales');
            IARecomendaciones.cargarRecomendacionesUniversal({
                containerId: 'recomendaciones-ia-container',
                tipo: 'general',
                limite: 4
            });
        }

    } else if (path.includes('carrito.html')) {
        // Carrito - usa contenedor con razonamiento separado
        console.log('🛒 Carrito - Cargando recomendaciones personalizadas');
        IARecomendaciones.cargarRecomendacionesUniversal({
            containerId: 'recomendaciones-ia-container',
            tipo: 'general',
            limite: 4
        });

    } else {
        // Index y cualquier otra página
        console.log('🏠 Index - Cargando recomendaciones personalizadas');
        IARecomendaciones.cargarRecomendacionesUniversal({
            containerId: 'recomendaciones-container',
            tipo: 'general',
            limite: 4
        });
    }
}

// Estilos para el botón de reintento (agregar al CSS)
const styleReintentar = document.createElement('style');
styleReintentar.textContent = `
    .btn-reintentar {
        background: linear-gradient(135deg, #2a6fdb, #1a4f9f);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 12px;
        transition: all 0.3s ease;
    }
    .btn-reintentar:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(42, 111, 219, 0.4);
    }
    .error-message {
        text-align: center;
        padding: 2rem;
        color: #ff6b6b;
    }
    .empty-message {
        text-align: center;
        padding: 2rem;
        color: #aaccff;
    }
    .ia-razonamiento-card-inline {
        background: rgba(10, 26, 47, 0.85);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid rgba(77, 140, 255, 0.25);
        color: #cfe3ff;
    }
`;
document.head.appendChild(styleReintentar);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarRecomendaciones);
} else {
    inicializarRecomendaciones();
}

// También inicializar después de que Auth cargue (por si acaso)
setTimeout(() => {
    if (!window._recomendacionesInicializadas) {
        window._recomendacionesInicializadas = true;
        inicializarRecomendaciones();
    }
}, 800);

// Exportar para uso global
window.IARecomendaciones = IARecomendaciones;