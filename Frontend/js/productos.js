// ============================================
// PRODUCTOS.JS - VERSIÓN COMPLETA CORREGIDA
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

        const inicio = (pagina - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const juegosPagina = juegos.slice(inicio, fin);
        const totalPaginas = Math.ceil(juegos.length / itemsPorPagina);

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
            <div class="producto-img-container">
                <img src="${juego.imagen_url || 'assets/img/default-game.jpg'}" 
                     class="producto-img" 
                     loading="lazy"
                     onerror="this.src='assets/img/default-game.jpg'">
            </div>
            <div class="producto-info">
                <h3>${nombreProducto}</h3>
                <p class="producto-precio">$${formatearPrecio(juego.precio)}</p>
                <button class="btn-agregar" onclick="event.stopPropagation(); manejarClickCompra(${juego.id_producto})">
                    <i class="fas fa-shopping-cart"></i> Añadir al carrito
                </button>
            </div>
        `;
            container.appendChild(card);
        });

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

        const inicio = (pagina - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const tarjetasPagina = tarjetas.slice(inicio, fin);
        const totalPaginas = Math.ceil(tarjetas.length / itemsPorPagina);

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
            <div class="tarjeta-img-container">
                <img src="${tarjeta.imagen_url || 'assets/img/default-card.jpg'}" 
                     class="tarjeta-img" 
                     loading="lazy"
                     onerror="this.src='assets/img/default-card.jpg'">
            </div>
            <div class="tarjeta-info">
                <h3>${nombreTarjeta}</h3>
                <p class="producto-precio">$${formatearPrecio(tarjeta.precio)}</p>
                <button class="btn-comprar" onclick="event.stopPropagation(); manejarClickCompra(${tarjeta.id_producto})">
                    <i class="fas fa-shopping-cart"></i> Comprar
                </button>
            </div>
        `;
            container.appendChild(card);
        });

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
                         loading="lazy"
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
                         class="producto-detalle-img"
                         loading="eager"
                         onerror="this.src='assets/img/default-game.jpg'">
                </div>
                <div class="producto-detalle-info">
                    <h1 class="producto-nombre">${producto.nombre_producto}</h1>
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
                        <i class="fas fa-shopping-cart"></i> Añadir al carrito
                    </button>
                </div>
            </div>
        `;

        // 🔥 CARGAR TIPS CON GROQ
        if (producto.nombre_producto) {
            cargarTipsDelJuego(producto.nombre_producto);
        }
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

            let html = '';
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
// CARGAR TIPS DEL JUEGO CON GROQ - TARJETAS SEPARADAS
// ============================================
async function cargarTipsDelJuego(nombreJuego) {
    const section = document.getElementById('tipsSection');
    const container = document.getElementById('tipsContainer');
    const resumen = document.getElementById('tipsResumen');

    if (!section || !container || !nombreJuego) return;

    section.style.display = 'block';
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Buscando los mejores consejos...</p></div>';

    try {
        const res = await fetch(`${API_URL}/ia/tips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ juego: nombreJuego })
        });

        const data = await res.json();
        console.log('📦 Datos recibidos:', data);

        if (data.success) {
            // Mostrar resumen
            if (data.resumen) {
                resumen.innerHTML = `<p>${data.resumen}</p>`;
                resumen.style.display = 'block';
            } else {
                resumen.style.display = 'none';
            }

            let html = '';

            // 🔥 TRUCOS - Cada uno en su propia tarjeta
            if (data.trucos && data.trucos.length > 0) {
                html += '<h3 style="color:white;margin:1.2rem 0 0.8rem;font-family:Orbitron;">🎯 Trucos</h3>';
                html += '<div class="tips-grid">';
                data.trucos.forEach(tip => {
                    html += `
                        <div class="tip-card">
                            <h3>${tip.titulo || 'Truco'}</h3>
                            <p>${tip.descripcion || ''}</p>
                            <div class="tip-meta">
                                ${tip.categoria ? `<span class="tip-categoria">${tip.categoria}</span>` : ''}
                                ${tip.dificultad ? `<span class="tip-dificultad">${tip.dificultad}</span>` : ''}
                            </div>
                        </div>`;
                });
                html += '</div>';
            }

            // 🔥 CONSEJOS PRO - Cada uno en su propia tarjeta
            if (data.consejos_pro && data.consejos_pro.length > 0) {
                html += '<h3 style="color:white;margin:1.2rem 0 0.8rem;font-family:Orbitron;">💡 Consejos Pro</h3>';
                html += '<div class="tips-grid">';
                data.consejos_pro.forEach(tip => {
                    html += `
                        <div class="tip-card">
                            <h3>${tip.titulo || 'Consejo'}</h3>
                            <p>${tip.descripcion || ''}</p>
                        </div>`;
                });
                html += '</div>';
            }

            // 🔥 SECRETOS - Cada uno en su propia tarjeta
            if (data.secretos && data.secretos.length > 0) {
                html += '<h3 style="color:white;margin:1.2rem 0 0.8rem;font-family:Orbitron;">🔒 Secretos</h3>';
                html += '<div class="tips-grid">';
                data.secretos.forEach(tip => {
                    html += `
                        <div class="tip-card">
                            <h3>${tip.titulo || 'Secreto'}</h3>
                            <p>${tip.descripcion || ''}</p>
                            <div class="tip-meta">
                                ${tip.ubicacion ? `<span class="tip-ubicacion">📍 ${tip.ubicacion}</span>` : ''}
                            </div>
                        </div>`;
                });
                html += '</div>';
            }

            container.innerHTML = html || '<p style="color:#aaccff;">No se encontraron tips para este juego.</p>';

        } else {
            container.innerHTML = '<p style="color:#ff6b6b;">Error al cargar los consejos.</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p style="color:#ff6b6b;">Error de conexión.</p>';
    }
}

// ============================================
// PREGUNTAR A GROQ
// ============================================
document.addEventListener('click', async (e) => {
    if (e.target.id === 'tipsPreguntarBtn' || e.target.closest('#tipsPreguntarBtn')) {
        const pregunta = document.getElementById('tipsPregunta')?.value;
        const juego = document.querySelector('.producto-nombre')?.textContent ||
                      document.querySelector('h1')?.textContent;

        if (!pregunta || !juego) return;

        const respuestaDiv = document.getElementById('tipsRespuesta');
        respuestaDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Groq está pensando...</p></div>';

        try {
            const res = await fetch(`${API_URL}/ia/tips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juego, pregunta })
            });

            const data = await res.json();

            if (data.success) {
                respuestaDiv.innerHTML = `<p style="color:#c0d0ff;">${data.respuesta}</p>`;
            } else {
                respuestaDiv.innerHTML = '<p style="color:#ff6b6b;">No se pudo obtener respuesta.</p>';
            }
        } catch (error) {
            respuestaDiv.innerHTML = '<p style="color:#ff6b6b;">Error al consultar.</p>';
        }
    }
});

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
// APLICAR FILTROS
// ============================================
window.aplicarFiltros = async function () {
    try {
        const isMobile = window.innerWidth <= 768;
        const busquedaTexto = document.getElementById('searchInput')?.value || '';
        let plataformasSeleccionadas = [];
        let generosSeleccionados = [];
        let precioMax = undefined;

        if (isMobile) {
            document.querySelectorAll('#filtro-plataformas-mobile input[type="checkbox"]:checked').forEach(cb => plataformasSeleccionadas.push(cb.value));
            document.querySelectorAll('#filtro-generos-mobile input[type="checkbox"]:checked').forEach(cb => generosSeleccionados.push(cb.value));
            const precioRangeMobile = document.getElementById('precio-range-mobile');
            if (precioRangeMobile && precioRangeMobile.value !== '500000') precioMax = parseInt(precioRangeMobile.value);
        } else {
            document.querySelectorAll('#filtro-plataformas input[type="checkbox"]:checked').forEach(cb => plataformasSeleccionadas.push(cb.value));
            document.querySelectorAll('#filtro-generos input[type="checkbox"]:checked').forEach(cb => generosSeleccionados.push(cb.value));
            const precioRange = document.getElementById('precio-range');
            if (precioRange && precioRange.value !== '500000') precioMax = parseInt(precioRange.value);
        }

        const params = new URLSearchParams();
        params.append('tipo', 'Juego');
        if (busquedaTexto && busquedaTexto.trim() !== '') params.append('busqueda', busquedaTexto.trim());
        if (plataformasSeleccionadas.length > 0) params.append('plataforma', plataformasSeleccionadas.join(','));
        if (precioMax) params.append('precio_max', precioMax);

        const url = `${API_URL}/productos?${params.toString()}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        if (data.success && data.productos) {
            let juegosFiltrados = data.productos;
            if (generosSeleccionados.length > 0) {
                juegosFiltrados = juegosFiltrados.filter(juego => {
                    if (!juego.genero) return false;
                    const generosJuego = juego.genero.toLowerCase().split(',').map(g => g.trim());
                    return generosSeleccionados.some(genSel => generosJuego.includes(genSel.toLowerCase()));
                });
            }
            window.juegosActuales = juegosFiltrados;
            Productos.renderizarJuegos(juegosFiltrados, 'juegos-grid', 1, 9);
            const resultadosCount = document.getElementById('resultados-count');
            if (resultadosCount) resultadosCount.textContent = `${juegosFiltrados.length} juegos encontrados`;
        } else {
            window.juegosActuales = [];
            Productos.renderizarJuegos([], 'juegos-grid');
        }
    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
    }
};

// ============================================
// APLICAR FILTROS PARA TARJETAS
// ============================================
window.aplicarFiltrosTarjetas = async function () {
    try {
        const isMobile = window.innerWidth <= 768;
        const busquedaTexto = document.getElementById('searchInputTarjetas')?.value || '';
        let plataformasSeleccionadas = [];
        let precioMax = undefined;

        if (isMobile) {
            document.querySelectorAll('#filtro-plataformas-tarjetas-mobile input[type="checkbox"]:checked').forEach(cb => plataformasSeleccionadas.push(cb.value));
            const precioRangeMobile = document.getElementById('precio-range-tarjetas-mobile');
            if (precioRangeMobile && precioRangeMobile.value !== '500000') precioMax = parseInt(precioRangeMobile.value);
        } else {
            document.querySelectorAll('#filtro-plataformas-tarjetas input[type="checkbox"]:checked').forEach(cb => plataformasSeleccionadas.push(cb.value));
            const precioRange = document.getElementById('precio-range-tarjetas');
            if (precioRange && precioRange.value !== '500000') precioMax = parseInt(precioRange.value);
        }

        const params = new URLSearchParams();
        params.append('tipo', 'Tarjeta regalo');
        if (busquedaTexto && busquedaTexto.trim() !== '') params.append('busqueda', busquedaTexto.trim());
        if (plataformasSeleccionadas.length > 0) params.append('plataforma', plataformasSeleccionadas.join(','));
        if (precioMax) params.append('precio_max', precioMax);

        const url = `${API_URL}/productos?${params.toString()}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        if (data.success && data.productos) {
            window.tarjetasActuales = data.productos;
            Productos.renderizarTarjetas(data.productos, 'tarjetas-grid', 1, 9);
        } else {
            window.tarjetasActuales = [];
            Productos.renderizarTarjetas([], 'tarjetas-grid');
        }
    } catch (error) {
        console.error('❌ Error aplicando filtros a tarjetas:', error);
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.getElementById('juegos-grid')) {
    setTimeout(() => window.aplicarFiltros(), 200);
}

async function inicializarTarjetas() {
    if (document.getElementById('tarjetas-grid')) {
        const containerDesktop = document.getElementById('filtro-plataformas-tarjetas');
        if (containerDesktop) {
            await Productos.cargarFiltrosPlataformas('filtro-plataformas-tarjetas', 'aplicarFiltrosTarjetas()');
        }
        setTimeout(() => window.aplicarFiltrosTarjetas(), 200);
    }
}
inicializarTarjetas();

// ============================================
// MANEJAR CLIC EN COMPRA
// ============================================
window.manejarClickCompra = async function (productoId) {
    try {
        const producto = await Productos.buscarProducto(productoId);
        if (!producto) return;

        const resultado = await agregarAlCarrito(productoId, 1);
        if (resultado && resultado.success !== false) {
            const token = localStorage.getItem('nexpixel_token');
            const usuario = Auth.usuarioActual;
            if (token && usuario && usuario.id_usuario) {
                await fetch(`${API_URL}/ia/interaccion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ usuarioId: usuario.id_usuario, productoId, tipoInteraccion: 'carrito' })
                });
            }
            mostrarNotificacion(`✅ ${producto.nombre_producto} agregado al carrito`, 'success');
        }
    } catch (error) {
        console.error('Error en manejarClickCompra:', error);
    }
};

// ============================================
// EXPONER GLOBALMENTE
// ============================================
window.Productos = Productos;
window.cargarTipsDelJuego = cargarTipsDelJuego;