// ============================================
// IA-DB.JS - RECOMENDACIONES INTELIGENTES
// VERSIÓN UNIFICADA - MISMO SISTEMA EN TODAS LAS PÁGINAS
// ============================================

const API_URL = 'http://localhost:3000/api';

const IARecomendaciones = {
    cache: new Map(),

    // ============================================
    // FUNCIÓN PRINCIPAL UNIFICADA
    // ============================================
    async cargarRecomendaciones({
        containerId,
        limite = 4,
        forceRefresh = false
    }) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container no encontrado: ${containerId}`);
            return;
        }

        // Buscar contenedor de razonamiento
        let razonamientoContainer = document.getElementById("ia-razonamiento");
        let tieneRazonamientoSeparado = !!razonamientoContainer;

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
            const usuarioId = Auth.usuarioActual?.id_usuario || null;
            
            console.log(`Cargando recomendaciones - Usuario: ${usuarioId || 'anonimo'}`);

            // 🔥 TODAS LAS PÁGINAS USAN EL MISMO ENDPOINT
            let url = `${API_URL}/ia/recomendaciones?limite=${limite}`;
            
            if (usuarioId) {
                url += `&usuarioId=${usuarioId}`;
                console.log(`Recomendaciones personalizadas para usuario ${usuarioId}`);
            } else {
                console.log(`Recomendaciones generales para usuario anonimo`);
            }

            const cacheKey = url;
            if (!forceRefresh && this.cache.has(cacheKey)) {
                console.log(`Usando cache`);
                const cached = this.cache.get(cacheKey);
                this.renderizar(cached.productos, container, razonamientoContainer, cached.razonamiento, tieneRazonamientoSeparado);
                return;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Respuesta del backend:`, data);

            let productos = data.productos || [];
            let razonamiento = data.razonamiento || '';

            // Si no hay productos, usar populares
            if (productos.length === 0) {
                console.log(`Sin productos, usando populares`);
                const fallbackUrl = `${API_URL}/ia/populares?limite=${limite}`;
                const fallbackResponse = await fetch(fallbackUrl);
                const fallbackData = await fallbackResponse.json();
                productos = fallbackData.productos || [];
                razonamiento = 'Los juegos más populares del momento en NexPixel';
            }

            this.cache.set(cacheKey, { productos, razonamiento });
            this.renderizar(productos, container, razonamientoContainer, razonamiento, tieneRazonamientoSeparado);

        } catch (error) {
            console.error('Error en IARecomendaciones:', error);
            
            try {
                const fallbackUrl = `${API_URL}/ia/populares?limite=${limite}`;
                const fallbackResponse = await fetch(fallbackUrl);
                const fallbackData = await fallbackResponse.json();
                const productos = fallbackData.productos || [];
                const razonamiento = 'Productos populares de NexPixel';
                this.renderizar(productos, container, razonamientoContainer, razonamiento, tieneRazonamientoSeparado);
            } catch (fallbackError) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>No pudimos cargar las recomendaciones</p>
                        <button onclick="location.reload()" class="btn-reintentar">Reintentar</button>
                    </div>
                `;
            }
        }
    },

    // ============================================
    // RENDERIZAR (igual para todas las páginas)
    // ============================================
    renderizar(productos, container, razonamientoContainer, razonamiento, tieneRazonamientoSeparado) {
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay productos para mostrar</p>';
            return;
        }

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

        let html = `<div class="productos-grid">`;

        productos.forEach(prod => {
            const id = prod.id_producto;
            const nombre = prod.nombre_producto || 'Producto';
            const precio = prod.precio || 0;
            const imagen = prod.imagen_url || 'assets/img/default-game.jpg';

            html += `
            <div class="producto-card" data-id="${id}" onclick="verProducto(${id})">
                <img src="${imagen}" class="producto-img" alt="${nombre}" loading="lazy" onerror="this.src='assets/img/default-game.jpg'">
                <div class="producto-info">
                    <h3>${this.truncarTexto(nombre, 50)}</h3>
                    <div class="producto-precio">
                        $${this.formatearPrecio(precio)}
                    </div>
                    <button class="btn-agregar" onclick="event.stopPropagation(); manejarClickCompra(${id})">
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
    },

    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    }
};

// ============================================
// INICIALIZACIÓN UNIFICADA
// ============================================

async function inicializarRecomendaciones() {
    const path = window.location.pathname;
    console.log(`Inicializando IA en: ${path}`);

    // Esperar a que Auth esté listo
    let esperas = 0;
    while (!Auth?.usuarioActual && esperas < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        esperas++;
    }
    
    if (Auth?.usuarioActual) {
        console.log(`Usuario logueado: ${Auth.usuarioActual.id_usuario}`);
    } else {
        console.log(`Usuario no logueado - recomendaciones generales`);
    }

    // 🔥 MISMO CONTAINER PARA TODAS LAS PÁGINAS (usar siempre 'recomendaciones-container')
    // o crear un contenedor específico si no existe
    let containerId = '';
    
    // Detectar qué contenedor existe en la página actual
    if (document.getElementById('recomendaciones-ia-container')) {
        containerId = 'recomendaciones-ia-container';
    } else if (document.getElementById('recomendaciones-container')) {
        containerId = 'recomendaciones-container';
    } else {
        console.log('No se encontró contenedor para recomendaciones');
        return;
    }

    console.log(`Usando container: ${containerId}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    IARecomendaciones.cargarRecomendaciones({
        containerId: containerId,
        limite: 4
    });
}

// Estilos
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
    .ia-razonamiento-card {
        background: rgba(10, 26, 47, 0.95);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(77, 140, 255, 0.3);
    }
    .ia-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .ia-icon {
        font-size: 1.8rem;
        color: #4d8cff;
    }
    .ia-header h3 {
        margin: 0;
        color: #4d8cff;
    }
    .ia-badge {
        background: linear-gradient(135deg, #2a6fdb, #1a4f9f);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.7rem;
        color: white;
    }
    .ia-text {
        font-style: italic;
        color: #cfe3ff;
        padding: 1rem;
        border-left: 3px solid #4d8cff;
        background: rgba(77, 140, 255, 0.05);
        border-radius: 8px;
    }
    .ia-footer {
        margin-top: 1rem;
        font-size: 0.75rem;
        color: #8ba8d4;
        text-align: right;
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

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarRecomendaciones);
} else {
    inicializarRecomendaciones();
}

window.IARecomendaciones = IARecomendaciones;