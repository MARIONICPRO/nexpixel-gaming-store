// ============================================
// PRODUCTOS.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Productos = {
    // ===== CARGAR JUEGOS CON FILTROS =====
    async cargarJuegos(filtros = {}) {
        try {
            // Convertir filtros al formato que espera la API
            const params = {};
            if (filtros.tipo) params.tipo = filtros.tipo;
            if (filtros.plataforma) params.plataforma = filtros.plataforma;
            if (filtros.precio_max) params.precio_max = filtros.precio_max;
            if (filtros.precio_min) params.precio_min = filtros.precio_min;
            
            // Agregar tipo específico para juegos
            params.tipo = 'Juego';
            
            const response = await API.getProductos(params);
            return response.productos || [];
        } catch (error) {
            console.error('Error cargando juegos:', error);
            return [];
        }
    },

    // ===== CARGAR TARJETAS CON FILTROS =====
    async cargarTarjetas(filtros = {}) {
        try {
            const params = {};
            if (filtros.tipo) params.tipo = filtros.tipo;
            if (filtros.plataforma) params.plataforma = filtros.plataforma;
            if (filtros.precio_max) params.precio_max = filtros.precio_max;
            
            // Agregar tipo específico para tarjetas
            params.tipo = 'Tarjeta regalo';
            
            const response = await API.getProductos(params);
            return response.productos || [];
        } catch (error) {
            console.error('Error cargando tarjetas:', error);
            return [];
        }
    },

    // ===== BUSCAR PRODUCTO POR ID =====
    async buscarProducto(id) {
        try {
            const response = await API.getProductoById(id);
            return response.producto || null;
        } catch (error) {
            console.error('Error buscando producto:', error);
            return null;
        }
    },

    // ===== RENDERIZAR JUEGOS =====
    renderizarJuegos(juegos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!juegos || juegos.length === 0) {
            container.innerHTML = '<p style="text-align: center;">No hay juegos disponibles</p>';
            return;
        }

        let html = '';
        juegos.forEach(juego => {
            html += `
                <div class="producto-card" onclick="verProducto(${juego.id_producto})">
                    <img src="${juego.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${juego.nombre_producto}" 
                         class="producto-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-info">
                        <h3>${juego.nombre_producto}</h3>
                        <p class="producto-precio">$${formatearPrecio(juego.precio)}</p>
                        <button class="btn-agregar" onclick="event.stopPropagation(); manejarClickCompra(${juego.id_producto})">
                            Añadir al carrito
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== RENDERIZAR TARJETAS =====
    renderizarTarjetas(tarjetas, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!tarjetas || tarjetas.length === 0) {
            container.innerHTML = '<p style="text-align: center;">No hay tarjetas disponibles</p>';
            return;
        }

        let html = '';
        tarjetas.forEach(tarjeta => {
            html += `
                <div class="tarjeta-card" onclick="verProducto(${tarjeta.id_producto})">
                    <img src="${tarjeta.imagen_url || 'assets/img/default-card.jpg'}" 
                         alt="${tarjeta.nombre_producto}" 
                         class="tarjeta-img"
                         onerror="this.src='assets/img/default-card.jpg'">
                    <div class="tarjeta-info">
                        <h3>${tarjeta.nombre_producto}</h3>
                        <p class="producto-precio">$${formatearPrecio(tarjeta.precio)}</p>
                        <button class="btn-comprar" onclick="event.stopPropagation(); manejarClickCompra(${tarjeta.id_producto})">
                            Comprar
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== RENDERIZAR CARRUSEL =====
    renderizarCarrusel(juegos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!juegos || juegos.length === 0) {
            container.innerHTML = '<p>No hay juegos recientes</p>';
            return;
        }

        let html = '';
        juegos.forEach(juego => {
            html += `
                <div class="carrusel-item" onclick="verProducto(${juego.id_producto})">
                    <img src="${juego.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${juego.nombre_producto}" 
                         class="carrusel-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="carrusel-info">
                        <h3>${juego.nombre_producto}</h3>
                        <p class="carrusel-precio">$${formatearPrecio(juego.precio)}</p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== RENDERIZAR PRODUCTO INDIVIDUAL =====
    renderizarProducto(producto, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!producto) {
            container.innerHTML = '<p style="text-align: center;">Producto no encontrado</p>';
            return;
        }

        container.innerHTML = `
            <div class="producto-detalle">
                <div class="producto-detalle-imagen">
                    <img src="${producto.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${producto.nombre_producto}"
                         onerror="this.src='assets/img/default-game.jpg'">
                </div>
                <div class="producto-detalle-info">
                    <h1>${producto.nombre_producto}</h1>
                    <p class="producto-detalle-precio">$${formatearPrecio(producto.precio)}</p>
                    <p class="producto-detalle-descripcion">${producto.descripcion || 'Sin descripción disponible'}</p>
                    
                    <div class="producto-detalle-metadata">
                        <p><strong>Plataforma:</strong> ${producto.plataforma?.nombre_plataforma || 'Digital'}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria?.nombre_grupo || 'General'}</p>
                        ${producto.genero ? `<p><strong>Género:</strong> ${producto.genero}</p>` : ''}
                        ${producto.edicion ? `<p><strong>Edición:</strong> ${producto.edicion}</p>` : ''}
                        ${producto.desarrollador ? `<p><strong>Desarrollador:</strong> ${producto.desarrollador}</p>` : ''}
                        ${producto.fecha_lanzamiento ? `<p><strong>Lanzamiento:</strong> ${new Date(producto.fecha_lanzamiento).toLocaleDateString()}</p>` : ''}
                    </div>
                    
                    <button class="btn-agregar" onclick="manejarClickCompra(${producto.id_producto})">
                        Añadir al carrito
                    </button>
                </div>
            </div>
        `;
    },

    // ===== CARGAR FILTROS DE PLATAFORMAS =====
    async cargarFiltrosPlataformas(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Obtener plataformas desde la API
            const response = await fetch(`${API_URL}/productos/plataformas`);
            const data = await response.json();
            
            const plataformas = data.plataformas || [];
            
            let html = '<h4>Plataforma</h4>';
            plataformas.forEach(p => {
                html += `
                    <label class="filtro-opcion">
                        <input type="checkbox" value="${p.id_plataforma}" onchange="aplicarFiltros()">
                        ${p.nombre_plataforma}
                    </label>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando plataformas:', error);
            // Fallback con datos estáticos si la API falla
            const plataformas = [
                { id_plataforma: 1, nombre_plataforma: 'PlayStation' },
                { id_plataforma: 2, nombre_plataforma: 'Xbox' },
                { id_plataforma: 3, nombre_plataforma: 'Nintendo Switch' },
                { id_plataforma: 4, nombre_plataforma: 'PC' },
                { id_plataforma: 5, nombre_plataforma: 'Steam' }
            ];
            
            let html = '<h4>Plataforma</h4>';
            plataformas.forEach(p => {
                html += `
                    <label class="filtro-opcion">
                        <input type="checkbox" value="${p.id_plataforma}" onchange="aplicarFiltros()">
                        ${p.nombre_plataforma}
                    </label>
                `;
            });
            container.innerHTML = html;
        }
    }
};

// Asegurarse de que formatearPrecio existe
if (typeof window.formatearPrecio !== 'function') {
    window.formatearPrecio = function(precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    };
}