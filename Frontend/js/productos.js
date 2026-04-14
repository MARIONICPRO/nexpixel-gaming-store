// ============================================
// PRODUCTOS.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Productos = {
    // ===== CARGAR JUEGOS CON FILTROS =====
    async cargarJuegos(filtros = {}) {
        try {
            const params = {};

            if (filtros.busqueda) params.busqueda = filtros.busqueda;
            if (filtros.tipo) params.tipo = filtros.tipo;
            if (filtros.plataforma) params.plataforma = filtros.plataforma;
            if (filtros.precio_max) params.precio_max = filtros.precio_max;
            if (filtros.precio_min) params.precio_min = filtros.precio_min;
            if (filtros.genero) params.genero = filtros.genero;

            if (!params.tipo) params.tipo = 'Juego';

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

    // ===== RENDERIZAR JUEGOS CON PAGINACIÓN (9 por página) =====
    renderizarJuegos(juegos, containerId, pagina = 1, itemsPorPagina = 9) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!juegos || juegos.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay juegos disponibles</div>';
            return;
        }

        console.log('Juegos a renderizar:', juegos.length);
        console.log('Página:', pagina, 'Items por página:', itemsPorPagina);

        const inicio = (pagina - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const juegosPagina = juegos.slice(inicio, fin);
        const totalPaginas = Math.ceil(juegos.length / itemsPorPagina);

        console.log('Juegos en esta página:', juegosPagina.length);

        // Limpiar el container y agregar los juegos directamente
        container.innerHTML = '';

        juegosPagina.forEach(juego => {
            let nombreProducto = juego.nombre_producto || 'Producto sin nombre';
            if (nombreProducto.length > 40) {
                nombreProducto = nombreProducto.substring(0, 37) + '...';
            }

            const card = document.createElement('div');
            card.className = 'producto-card';
            card.onclick = () => verProducto(juego.id_producto);
            card.innerHTML = `
            <img src="${juego.imagen_url || 'assets/img/default-game.jpg'}" class="producto-img" onerror="this.src='assets/img/default-game.jpg'">
            <div class="producto-info">
                <h3>${nombreProducto}</h3>
                <p class="producto-precio">$${formatearPrecio(juego.precio)}</p>
                <button class="btn-agregar" onclick="event.stopPropagation(); manejarClickCompra(${juego.id_producto})">
                    🛒 Añadir al carrito
                </button>
            </div>
        `;
            container.appendChild(card);
        });

        // PAGINACIÓN
        if (totalPaginas > 1) {
            const paginacionDiv = document.createElement('div');
            paginacionDiv.className = 'paginacion';

            if (pagina > 1) {
                const btnAnterior = document.createElement('button');
                btnAnterior.className = 'btn-paginacion';
                btnAnterior.innerHTML = '◀ Anterior';
                btnAnterior.onclick = () => cambiarPaginaJuegos(pagina - 1);
                paginacionDiv.appendChild(btnAnterior);
            }

            for (let i = 1; i <= totalPaginas; i++) {
                const btnPagina = document.createElement('button');
                btnPagina.className = 'btn-paginacion';
                if (i === pagina) btnPagina.classList.add('active');
                btnPagina.textContent = i;
                if (i !== pagina) {
                    btnPagina.onclick = () => cambiarPaginaJuegos(i);
                }
                paginacionDiv.appendChild(btnPagina);
            }

            if (pagina < totalPaginas) {
                const btnSiguiente = document.createElement('button');
                btnSiguiente.className = 'btn-paginacion';
                btnSiguiente.innerHTML = 'Siguiente ▶';
                btnSiguiente.onclick = () => cambiarPaginaJuegos(pagina + 1);
                paginacionDiv.appendChild(btnSiguiente);
            }

            container.appendChild(paginacionDiv);
        }

        window.juegosActuales = juegos;
        window.paginaActualJuegos = pagina;
    },
// ===== RENDERIZAR TARJETAS CON PAGINACIÓN (9 por página) =====
renderizarTarjetas(tarjetas, containerId, pagina = 1, itemsPorPagina = 9) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!tarjetas || tarjetas.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay tarjetas disponibles</div>';
        return;
    }

    console.log('Tarjetas a renderizar:', tarjetas.length);
    console.log('Página:', pagina, 'Items por página:', itemsPorPagina);

    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const tarjetasPagina = tarjetas.slice(inicio, fin);
    const totalPaginas = Math.ceil(tarjetas.length / itemsPorPagina);

    console.log('Tarjetas en esta página:', tarjetasPagina.length);

    // Limpiar el container
    container.innerHTML = '';

    tarjetasPagina.forEach(tarjeta => {
        let nombreTarjeta = tarjeta.nombre_producto || 'Tarjeta sin nombre';
        if (nombreTarjeta.length > 40) {
            nombreTarjeta = nombreTarjeta.substring(0, 37) + '...';
        }
        
        const card = document.createElement('div');
        card.className = 'tarjeta-card';
        card.onclick = () => verProducto(tarjeta.id_producto);
        card.innerHTML = `
            <img src="${tarjeta.imagen_url || 'assets/img/default-card.jpg'}" class="tarjeta-img" onerror="this.src='assets/img/default-card.jpg'">
            <div class="tarjeta-info">
                <h3>${nombreTarjeta}</h3>
                <p class="producto-precio">$${formatearPrecio(tarjeta.precio)}</p>
                <button class="btn-comprar" onclick="event.stopPropagation(); manejarClickCompra(${tarjeta.id_producto})">
                    🛒 Comprar
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // PAGINACIÓN
    if (totalPaginas > 1) {
        const paginacionDiv = document.createElement('div');
        paginacionDiv.className = 'paginacion';
        
        if (pagina > 1) {
            const btnAnterior = document.createElement('button');
            btnAnterior.className = 'btn-paginacion';
            btnAnterior.innerHTML = '◀ Anterior';
            btnAnterior.onclick = () => cambiarPaginaTarjetas(pagina - 1);
            paginacionDiv.appendChild(btnAnterior);
        }

        for (let i = 1; i <= totalPaginas; i++) {
            const btnPagina = document.createElement('button');
            btnPagina.className = 'btn-paginacion';
            if (i === pagina) btnPagina.classList.add('active');
            btnPagina.textContent = i;
            if (i !== pagina) {
                btnPagina.onclick = () => cambiarPaginaTarjetas(i);
            }
            paginacionDiv.appendChild(btnPagina);
        }

        if (pagina < totalPaginas) {
            const btnSiguiente = document.createElement('button');
            btnSiguiente.className = 'btn-paginacion';
            btnSiguiente.innerHTML = 'Siguiente ▶';
            btnSiguiente.onclick = () => cambiarPaginaTarjetas(pagina + 1);
            paginacionDiv.appendChild(btnSiguiente);
        }
        
        container.appendChild(paginacionDiv);
    }
    
    window.tarjetasActuales = tarjetas;
    window.paginaActualTarjetas = pagina;
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
    async cargarFiltrosPlataformas(containerId, callbackFunc = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(`${API_URL}/productos/plataformas`);
            const data = await response.json();
            const plataformas = data.plataformas || [];

            const onchangeFunc = callbackFunc || 'aplicarFiltros()';

            let html = '<h4>Plataforma</h4>';
            plataformas.forEach(p => {
                html += `
                    <label class="filtro-opcion">
                        <input type="checkbox" value="${p.id_plataforma}" onclick="${onchangeFunc}">
                        ${p.nombre_plataforma}
                    </label>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando plataformas:', error);
            const plataformas = [
                { id_plataforma: 1, nombre_plataforma: 'PlayStation' },
                { id_plataforma: 2, nombre_plataforma: 'Xbox' },
                { id_plataforma: 3, nombre_plataforma: 'Nintendo Switch' },
                { id_plataforma: 4, nombre_plataforma: 'PC' },
                { id_plataforma: 5, nombre_plataforma: 'Steam' }
            ];

            const onchangeFunc = callbackFunc || 'aplicarFiltros()';

            let html = '<h4>Plataforma</h4>';
            plataformas.forEach(p => {
                html += `
                    <label class="filtro-opcion">
                        <input type="checkbox" value="${p.id_plataforma}" onclick="${onchangeFunc}">
                        ${p.nombre_plataforma}
                    </label>
                `;
            });
            container.innerHTML = html;
        }
    }
};

// ============================================
// FORMATEAR PRECIO
// ============================================
if (typeof window.formatearPrecio !== 'function') {
    window.formatearPrecio = function (precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    };
}

// ============================================
// CAMBIAR PÁGINA EN JUEGOS
// ============================================
window.cambiarPaginaJuegos = function (pagina) {
    if (window.juegosActuales) {
        Productos.renderizarJuegos(window.juegosActuales, 'juegos-grid', pagina, 9);
    }
};

// ============================================
// CAMBIAR PÁGINA EN TARJETAS
// ============================================
window.cambiarPaginaTarjetas = function (pagina) {
    if (window.tarjetasActuales) {
        Productos.renderizarTarjetas(window.tarjetasActuales, 'tarjetas-grid', pagina, 9);
    }
};

// ============================================
// APLICAR FILTROS - VERSIÓN MEJORADA (DESKTOP + MÓVIL)
// ============================================
window.aplicarFiltros = async function () {
    try {
        console.log('🎯 aplicarFiltros() ejecutada');

        const isMobile = window.innerWidth <= 768;

        const busquedaTexto = document.getElementById('searchInput')?.value || '';

        let plataformasSeleccionadas = [];
        let generosSeleccionados = [];
        let precioMax = undefined;

        if (isMobile) {
            document.querySelectorAll('#filtro-plataformas-mobile input[type="checkbox"]:checked').forEach(cb => {
                plataformasSeleccionadas.push(cb.value);
            });

            document.querySelectorAll('#filtro-generos-mobile input[type="checkbox"]:checked').forEach(cb => {
                generosSeleccionados.push(cb.value);
            });

            const precioRangeMobile = document.getElementById('precio-range-mobile');
            if (precioRangeMobile && precioRangeMobile.value !== '500000') {
                precioMax = parseInt(precioRangeMobile.value);
            }
        } else {
            document.querySelectorAll('#filtro-plataformas input[type="checkbox"]:checked').forEach(cb => {
                plataformasSeleccionadas.push(cb.value);
            });

            document.querySelectorAll('#filtro-generos input[type="checkbox"]:checked').forEach(cb => {
                generosSeleccionados.push(cb.value);
            });

            const precioRange = document.getElementById('precio-range');
            if (precioRange && precioRange.value !== '500000') {
                precioMax = parseInt(precioRange.value);
            }
        }

        const params = new URLSearchParams();
        params.append('tipo', 'Juego');

        if (busquedaTexto && busquedaTexto.trim() !== '') {
            params.append('busqueda', busquedaTexto.trim());
        }

        if (plataformasSeleccionadas.length > 0) {
            params.append('plataforma', plataformasSeleccionadas.join(','));
        }

        if (precioMax) {
            params.append('precio_max', precioMax);
        }

        const url = `${API_URL}/productos?${params.toString()}`;

        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        if (data.success && data.productos) {
            let juegosFiltrados = data.productos;

            if (generosSeleccionados.length > 0) {
                juegosFiltrados = juegosFiltrados.filter(juego => {
                    if (!juego.genero) return false;
                    const generosJuego = juego.genero.toLowerCase().split(',').map(g => g.trim());
                    return generosSeleccionados.some(genSel =>
                        generosJuego.includes(genSel.toLowerCase())
                    );
                });
            }

            window.juegosActuales = juegosFiltrados;
            Productos.renderizarJuegos(juegosFiltrados, 'juegos-grid', 1, 9);

            const resultadosCount = document.getElementById('resultados-count');
            if (resultadosCount) {
                resultadosCount.textContent = `${juegosFiltrados.length} juegos encontrados`;
            }
        } else {
            window.juegosActuales = [];
            Productos.renderizarJuegos([], 'juegos-grid');
        }

    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
        const grid = document.getElementById('juegos-grid');
        if (grid) {
            grid.innerHTML = '<p class="error-message">Error al cargar los juegos</p>';
        }
    }
};

// ============================================
// APLICAR FILTROS PARA TARJETAS
// ============================================
window.aplicarFiltrosTarjetas = async function () {
    try {
        console.log('🎯 aplicarFiltrosTarjetas() ejecutada');

        const isMobile = window.innerWidth <= 768;

        const busquedaTexto = document.getElementById('searchInputTarjetas')?.value || '';

        let plataformasSeleccionadas = [];
        let precioMax = undefined;

        if (isMobile) {
            document.querySelectorAll('#filtro-plataformas-tarjetas-mobile input[type="checkbox"]:checked').forEach(cb => {
                plataformasSeleccionadas.push(cb.value);
            });

            const precioRangeMobile = document.getElementById('precio-range-tarjetas-mobile');
            if (precioRangeMobile && precioRangeMobile.value !== '500000') {
                precioMax = parseInt(precioRangeMobile.value);
            }
        } else {
            document.querySelectorAll('#filtro-plataformas-tarjetas input[type="checkbox"]:checked').forEach(cb => {
                plataformasSeleccionadas.push(cb.value);
            });

            const precioRange = document.getElementById('precio-range-tarjetas');
            if (precioRange && precioRange.value !== '500000') {
                precioMax = parseInt(precioRange.value);
            }
        }

        const params = new URLSearchParams();
        params.append('tipo', 'Tarjeta regalo');

        if (busquedaTexto && busquedaTexto.trim() !== '') {
            params.append('busqueda', busquedaTexto.trim());
        }

        if (plataformasSeleccionadas.length > 0) {
            params.append('plataforma', plataformasSeleccionadas.join(','));
        }

        if (precioMax) {
            params.append('precio_max', precioMax);
        }

        const url = `${API_URL}/productos?${params.toString()}`;

        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        if (data.success && data.productos) {
            window.tarjetasActuales = data.productos;
            Productos.renderizarTarjetas(data.productos, 'tarjetas-grid', 1, 9);

            const countEl = document.getElementById('resultados-count-tarjetas');
            if (countEl) {
                countEl.textContent = `${data.productos.length} tarjetas encontradas`;
            }
        } else {
            window.tarjetasActuales = [];
            Productos.renderizarTarjetas([], 'tarjetas-grid');
            const countEl = document.getElementById('resultados-count-tarjetas');
            if (countEl) {
                countEl.textContent = '0 tarjetas encontradas';
            }
        }

    } catch (error) {
        console.error('❌ Error aplicando filtros a tarjetas:', error);
        const grid = document.getElementById('tarjetas-grid');
        if (grid) {
            grid.innerHTML = '<p class="error-message">Error al cargar tarjetas</p>';
        }
    }
};

// ============================================
// ACTUALIZAR PRECIO
// ============================================
window.actualizarPrecio = function () {
    const range = document.getElementById('precio-range');
    const precioValor = document.getElementById('precio-valor');
    if (range && precioValor) {
        const valor = parseInt(range.value);
        precioValor.textContent = `$${formatearPrecio(valor)}`;
    }

    const rangeMobile = document.getElementById('precio-range-mobile');
    const valorMobile = document.getElementById('precio-valor-mobile');
    if (rangeMobile && valorMobile) {
        rangeMobile.value = range ? range.value : '500000';
        valorMobile.textContent = `$${formatearPrecio(range ? parseInt(range.value) : 500000)}`;
    }
};

window.actualizarPrecioTarjetas = function () {
    const range = document.getElementById('precio-range-tarjetas');
    const valor = document.getElementById('precio-valor-tarjetas');
    if (range && valor) {
        const valorNum = parseInt(range.value);
        valor.textContent = `$${formatearPrecio(valorNum)}`;
    }

    const rangeMobile = document.getElementById('precio-range-tarjetas-mobile');
    const valorMobile = document.getElementById('precio-valor-tarjetas-mobile');
    if (rangeMobile && valorMobile) {
        rangeMobile.value = range ? range.value : '500000';
        valorMobile.textContent = `$${formatearPrecio(range ? parseInt(range.value) : 500000)}`;
    }

    window.aplicarFiltrosTarjetas();
};

window.actualizarPrecioTarjetasMobile = function () {
    const range = document.getElementById('precio-range-tarjetas-mobile');
    const valor = document.getElementById('precio-valor-tarjetas-mobile');
    if (range && valor) {
        const valorNum = parseInt(range.value);
        valor.textContent = `$${formatearPrecio(valorNum)}`;
    }
    window.aplicarFiltrosTarjetas();
};

// ============================================
// ORDENAR PRODUCTOS
// ============================================
window.ordenarProductos = function () {
    const orden = document.getElementById('ordenar')?.value || 'relevancia';
    const grid = document.getElementById('juegos-grid');
    if (!grid) return;

    if (!window.juegosActuales) return;

    let juegosOrdenados = [...window.juegosActuales];

    switch (orden) {
        case 'precio-asc':
            juegosOrdenados.sort((a, b) => (a.precio || 0) - (b.precio || 0));
            break;
        case 'precio-desc':
            juegosOrdenados.sort((a, b) => (b.precio || 0) - (a.precio || 0));
            break;
        case 'nombre':
            juegosOrdenados.sort((a, b) => (a.nombre_producto || '').localeCompare(b.nombre_producto || ''));
            break;
        default:
            break;
    }

    window.juegosActuales = juegosOrdenados;
    Productos.renderizarJuegos(juegosOrdenados, 'juegos-grid', 1, 9);
};

window.ordenarTarjetas = function () {
    const orden = document.getElementById('ordenar-tarjetas')?.value || 'relevancia';
    const grid = document.getElementById('tarjetas-grid');
    if (!grid) return;

    if (!window.tarjetasActuales) return;

    let tarjetasOrdenadas = [...window.tarjetasActuales];

    switch (orden) {
        case 'precio-asc':
            tarjetasOrdenadas.sort((a, b) => (a.precio || 0) - (b.precio || 0));
            break;
        case 'precio-desc':
            tarjetasOrdenadas.sort((a, b) => (b.precio || 0) - (a.precio || 0));
            break;
        case 'nombre':
            tarjetasOrdenadas.sort((a, b) => (a.nombre_producto || '').localeCompare(b.nombre_producto || ''));
            break;
        default:
            break;
    }

    window.tarjetasActuales = tarjetasOrdenadas;
    Productos.renderizarTarjetas(tarjetasOrdenadas, 'tarjetas-grid', 1, 9);
};

// ============================================
// BUSCAR TARJETAS
// ============================================
window.buscarTarjetas = function () {
    console.log('🔍 buscarTarjetas() ejecutada');
    window.aplicarFiltrosTarjetas();
};

// ============================================
// FUNCIONES PARA MODAL DE TARJETAS
// ============================================

window.abrirModalFiltrosTarjetas = function () {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');

    if (modal) {
        cargarFiltrosTarjetasModal();
        modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.cerrarModalFiltrosTarjetas = function () {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');

    if (modal) {
        modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

async function cargarFiltrosTarjetasModal() {
    try {
        const container = document.getElementById('filtro-plataformas-tarjetas-mobile');
        if (container && container.children.length === 0) {
            const response = await fetch(`${API_URL}/productos/plataformas`);
            const data = await response.json();
            const plataformas = data.plataformas || [];

            let html = '';
            plataformas.forEach(p => {
                html += `
                    <label class="filtro-opcion">
                        <input type="checkbox" value="${p.id_plataforma}" onclick="aplicarFiltrosTarjetas()">
                        ${p.nombre_plataforma}
                    </label>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando filtros de tarjetas:', error);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar juegos
if (document.getElementById('juegos-grid')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.aplicarFiltros(), 200);
        });
    } else {
        setTimeout(() => window.aplicarFiltros(), 200);
    }
}

// Inicializar tarjetas
async function inicializarTarjetas() {
    const isTarjetasPage = document.getElementById('tarjetas-grid') !== null;
    if (isTarjetasPage) {
        console.log('💳 Inicializando página de tarjetas...');

        const containerDesktop = document.getElementById('filtro-plataformas-tarjetas');
        if (containerDesktop) {
            await Productos.cargarFiltrosPlataformas('filtro-plataformas-tarjetas', 'aplicarFiltrosTarjetas()');
        }

        setTimeout(() => window.aplicarFiltrosTarjetas(), 200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTarjetas);
} else {
    inicializarTarjetas();
}

// Función para alternar sidebar de filtros en móvil
window.toggleFiltrosSidebar = function () {
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');

    if (window.innerWidth <= 768) {
        window.abrirModalFiltrosTarjetas();
    } else {
        if (sidebar) {
            sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        }
    }
};

// Cerrar sidebar de filtros al redimensionar
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('filtrosSidebar');
        const overlay = document.getElementById('filtrosOverlay');
        const modal = document.getElementById('filtrosModal');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});
