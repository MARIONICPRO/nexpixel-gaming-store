// ============================================
// MAIN.JS - NEXPIXEL (VERSIÓN CORREGIDA)
// ============================================

// ===== VARIABLES GLOBALES =====
let posicionCarrusel = 0;
let metodoSeleccionado = '';
let filtrosVisibles = true;

// ===== INICIALIZACIÓN =====
async function inicializarApp() {
    console.log('🚀 Inicializando NexPixel...');

    await Auth.init();
    await Carrito.inicializar();
    await renderizarSidebar();

    const path = window.location.pathname;
    console.log('📄 Página actual:', path);

    if (path.includes('index.html') || path === '/') {
        try {
            const track = document.getElementById('carrusel-recientes');

            try {
                const response = await API.getJuegosRecientes(8);
                const juegosRecientes = response.productos || [];

                if (!juegosRecientes.length) {
                    mostrarCarruselVacio(track);
                } else {
                    Productos.renderizarCarrusel(juegosRecientes, 'carrusel-recientes');
                }

            } catch (error) {
                console.error('Error cargando juegos recientes:', error);
                mostrarCarruselError(track);
            }
        } catch (error) {
            console.error('Error cargando juegos recientes:', error);
        }

        if (typeof IARecomendaciones !== 'undefined') {
            IARecomendaciones.cargarRecomendaciones('recomendaciones-container', 4);
        }
    }

    if (path.includes('juegos.html')) {
        // Cargar filtros de plataformas
        await Productos.cargarFiltrosPlataformas('filtro-plataformas');

        // Cargar filtros de plataformas para móvil también
        const containerMobile = document.getElementById('filtro-plataformas-mobile');
        if (containerMobile) {
            await Productos.cargarFiltrosPlataformas('filtro-plataformas-mobile', 'aplicarFiltros()');
        }

        // Inicializar filtros (para recordar estado)
        inicializarFiltros();

        // 👇 IMPORTANTE: Cargar los juegos iniciales
        // Esperar un poco para que los filtros se carguen
        setTimeout(() => {
            if (typeof aplicarFiltros === 'function') {
                aplicarFiltros();
            } else {
                console.error('aplicarFiltros no está definida');
            }
        }, 100);
    }
    if (path.includes('tarjetas.html')) {
        const tarjetas = await Productos.cargarTarjetas();
        Productos.renderizarTarjetas(tarjetas, 'tarjetas-grid');
        inicializarFiltros();
    }

    if (path.includes('contacto.html')) {
        // Solo sidebar
    }

    if (path.includes('carrito.html')) {
        if (!Auth.usuarioActual) {
            mostrarNotificacion('Debes iniciar sesión', 'error');
            setTimeout(() => abrirModalLogin(), 500);
        } else {
            Carrito.renderizarCarrito();
        }
        if (typeof IARecomendaciones !== 'undefined') {
            IARecomendaciones.cargarRecomendaciones('recomendaciones-container', 4);
        }
    }

    if (path.includes('producto.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productoId = urlParams.get('id');
        if (productoId) {
            const producto = await Productos.buscarProducto(productoId);
            if (producto) {
                Productos.renderizarProducto(producto, 'producto-container');

                if (typeof IARecomendaciones !== 'undefined' && IARecomendaciones.cargarSimilares) {
                    await IARecomendaciones.cargarRecomendaciones('recomendaciones-ia-container', 4);
                }
            }
        }
    }

    if (path.includes('dashboard-admin.html')) {
        cargarDashboardAdmin();
    }

    if (path.includes('dashboard-prove.html')) {
        cargarDashboardProveedor();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            if (typeof cerrarModalPerfil === 'function') cerrarModalPerfil();
        }
    });
}

// ===== FUNCIONES DE PRODUCTOS =====
async function verProducto(id) {
    if (Auth.usuarioActual) {
        console.log('Vista de producto:', id);
    }
    window.location.href = `producto.html?id=${id}`;
}

async function agregarAlCarrito(id) {
    await Carrito.agregar(id);
}

async function manejarClickCompra(productoId) {
    await agregarAlCarrito(productoId);
}

// ===== UTILIDADES =====
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.createElement('div');
    notif.className = `notificacion ${tipo}`;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function cerrarSesion() {
    Auth.cerrarSesion();
}

// ===== CARRUSEL =====
function moverCarrusel(direccion) {
    const track = document.getElementById('carrusel-recientes');
    const items = document.querySelectorAll('.carrusel-item');
    if (!track || items.length === 0) return;

    const itemWidth = items[0].offsetWidth + 20;
    const maxPosicion = Math.max(0, items.length - 4);

    posicionCarrusel += direccion;
    if (posicionCarrusel < 0) posicionCarrusel = 0;
    if (posicionCarrusel > maxPosicion) posicionCarrusel = maxPosicion;

    track.style.transform = `translateX(-${posicionCarrusel * itemWidth}px)`;
}

// ===== RESPONSIVE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function toggleFiltros() {
    const filtros = document.querySelector('.filtros');
    if (filtros) filtros.classList.toggle('active');
}

function cerrarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');

        const filtros = document.querySelector('.filtros');
        if (filtros) filtros.classList.remove('active');
    }
});

document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (window.innerWidth <= 768 && sidebar && menuToggle) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// ===== FILTROS OCULTABLES =====
function toggleFiltrosPanel() {
    const filtrosPanel = document.getElementById('filtrosPanel');
    const container = document.querySelector('.juegos-container, .tarjetas-container');
    const toggleBtn = document.getElementById('toggleFiltrosBtn');

    if (!filtrosPanel) return;

    filtrosVisibles = !filtrosVisibles;

    if (filtrosVisibles) {
        filtrosPanel.classList.remove('hidden');
        container?.classList.remove('without-filters');
        container?.classList.add('with-filters');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            const icon = toggleBtn.querySelector('.filter-icon');
            if (icon) icon.textContent = '▼';
        }
        localStorage.setItem('filtrosVisibles', 'true');
    } else {
        filtrosPanel.classList.add('hidden');
        container?.classList.remove('with-filters');
        container?.classList.add('without-filters');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            const icon = toggleBtn.querySelector('.filter-icon');
            if (icon) icon.textContent = '▶';
        }
        localStorage.setItem('filtrosVisibles', 'false');
    }

    window.dispatchEvent(new Event('resize'));
}

function inicializarFiltros() {
    if (!window.location.pathname.includes('juegos.html') &&
        !window.location.pathname.includes('tarjetas.html')) {
        return;
    }

    const guardado = localStorage.getItem('filtrosVisibles');

    if (guardado === null) {
        filtrosVisibles = window.innerWidth > 768;
    } else {
        filtrosVisibles = guardado === 'true';
    }

    const filtrosPanel = document.getElementById('filtrosPanel');
    const container = document.querySelector('.juegos-container, .tarjetas-container');
    const toggleBtn = document.getElementById('toggleFiltrosBtn');

    if (!filtrosPanel) return;

    if (!filtrosVisibles) {
        filtrosPanel.classList.add('hidden');
        container?.classList.remove('with-filters');
        container?.classList.add('without-filters');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            const icon = toggleBtn.querySelector('.filter-icon');
            if (icon) icon.textContent = '▶';
        }
    } else {
        filtrosPanel.classList.remove('hidden');
        container?.classList.remove('without-filters');
        container?.classList.add('with-filters');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            const icon = toggleBtn.querySelector('.filter-icon');
            if (icon) icon.textContent = '▼';
        }
    }
}

function adaptarFiltrosAResolucion() {
    if (window.innerWidth <= 768) {
        const filtrosPanel = document.getElementById('filtrosPanel');
        const container = document.querySelector('.juegos-container, .tarjetas-container');
        const toggleBtn = document.getElementById('toggleFiltrosBtn');

        if (filtrosPanel) {
            filtrosPanel.classList.add('hidden');
            container?.classList.remove('with-filters');
            container?.classList.add('without-filters');
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                const icon = toggleBtn.querySelector('.filter-icon');
                if (icon) icon.textContent = '▶';
            }
            filtrosVisibles = false;
        }
    } else {
        inicializarFiltros();
    }
}

// ===== MÉTODOS DE PAGO =====
function seleccionarMetodo(metodo) {
    console.log('Método seleccionado:', metodo);

    document.querySelectorAll('.metodo-pago').forEach(el => {
        el.classList.remove('seleccionado');
    });

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('seleccionado');
    }

    metodoSeleccionado = metodo;
    mostrarCamposEspecificos(metodo);
}

function mostrarCamposEspecificos(metodo) {
    const contenedor = document.getElementById('campos-especificos');
    if (!contenedor) return;

    let html = '';

    switch (metodo) {
        case 'visa':
            html = `
                <h4>💳 Información de la tarjeta</h4>
                <div class="form-group">
                    <label>Número de tarjeta</label>
                    <input type="text" id="tarjeta-numero" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatearNumeroTarjeta(this)">
                </div>
                <div class="campos-tarjeta-grid">
                    <div class="form-group">
                        <label>Fecha de expiración</label>
                        <input type="text" id="tarjeta-expiracion" placeholder="MM/AA" maxlength="5" oninput="formatearExpiracion(this)">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" id="tarjeta-cvv" placeholder="123" maxlength="4">
                    </div>
                </div>
                <div class="form-group">
                    <label>Nombre en la tarjeta</label>
                    <input type="text" id="tarjeta-nombre" placeholder="Como aparece en la tarjeta">
                </div>
                <div class="form-group">
                    <label>Número de cuotas</label>
                    <select id="tarjeta-cuotas" class="filtro-select">
                        <option value="1">1 cuota</option>
                        <option value="3">3 cuotas</option>
                        <option value="6">6 cuotas</option>
                        <option value="12">12 cuotas</option>
                    </select>
                </div>
            `;
            break;
        case 'nequi':
            html = `
                <h4>📱 Pago con Nequi</h4>
                <div class="form-group">
                    <label>Número de celular</label>
                    <input type="tel" id="nequi-celular" placeholder="300 123 4567">
                </div>
                <div class="form-group">
                    <label>Documento del titular</label>
                    <input type="text" id="nequi-documento" placeholder="Documento de identidad">
                </div>
                <p style="color: #ccc; font-size: 0.9rem;">Te enviaremos un código de confirmación a tu celular.</p>
            `;
            break;
        case 'daviplata':
            html = `
                <h4>📱 Pago con Daviplata</h4>
                <div class="form-group">
                    <label>Número de celular</label>
                    <input type="tel" id="daviplata-celular" placeholder="300 123 4567">
                </div>
                <div class="form-group">
                    <label>Documento del titular</label>
                    <input type="text" id="daviplata-documento" placeholder="Documento de identidad">
                </div>
                <p style="color: #ccc; font-size: 0.9rem;">Te enviaremos un código de confirmación a tu celular.</p>
            `;
            break;
        case 'efecty':
            html = `
                <h4>🏦 Pago en Efecty</h4>
                <div class="form-group">
                    <label>Nombre del pagador</label>
                    <input type="text" id="efecty-nombre" placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <label>Documento del pagador</label>
                    <input type="text" id="efecty-documento" placeholder="Documento de identidad">
                </div>
                <p style="color: #e94560; font-size: 0.9rem; padding: 1rem; background: rgba(233,69,96,0.1); border-radius: 8px;">
                    <strong>Instrucciones:</strong> Después de confirmar, recibirás un código con el que podrás pagar en cualquier punto Efecty.
                </p>
            `;
            break;
        default:
            html = '';
    }
    contenedor.innerHTML = html;
}

function formatearNumeroTarjeta(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = valor.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = valor.trim();
}

function formatearExpiracion(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    input.value = valor;
}

function validarCamposPago() {
    if (!metodoSeleccionado) {
        mostrarNotificacion('Selecciona un método de pago', 'error');
        return false;
    }

    const nombre = document.getElementById('pago-nombre')?.value;
    const documento = document.getElementById('pago-documento')?.value;
    const email = document.getElementById('pago-email')?.value;

    if (!nombre || !documento || !email) {
        mostrarNotificacion('Completa todos los datos personales', 'error');
        return false;
    }

    switch (metodoSeleccionado) {
        case 'visa':
            const tarjetaNumero = document.getElementById('tarjeta-numero')?.value.replace(/\s/g, '');
            const tarjetaExp = document.getElementById('tarjeta-expiracion')?.value;
            const tarjetaCvv = document.getElementById('tarjeta-cvv')?.value;
            const tarjetaNombre = document.getElementById('tarjeta-nombre')?.value;
            if (!tarjetaNumero || tarjetaNumero.length < 15) {
                mostrarNotificacion('Número de tarjeta inválido', 'error');
                return false;
            }
            if (!tarjetaExp || tarjetaExp.length < 4) {
                mostrarNotificacion('Fecha de expiración inválida', 'error');
                return false;
            }
            if (!tarjetaCvv || tarjetaCvv.length < 3) {
                mostrarNotificacion('CVV inválido', 'error');
                return false;
            }
            if (!tarjetaNombre) {
                mostrarNotificacion('Ingresa el nombre en la tarjeta', 'error');
                return false;
            }
            break;
        case 'nequi':
        case 'daviplata':
            const celular = document.getElementById(`${metodoSeleccionado}-celular`)?.value;
            const doc = document.getElementById(`${metodoSeleccionado}-documento`)?.value;
            if (!celular || celular.length < 10) {
                mostrarNotificacion('Número de celular inválido', 'error');
                return false;
            }
            if (!doc) {
                mostrarNotificacion('Ingresa tu documento', 'error');
                return false;
            }
            break;
        case 'efecty':
            const efectyNombre = document.getElementById('efecty-nombre')?.value;
            const efectyDoc = document.getElementById('efecty-documento')?.value;
            if (!efectyNombre) {
                mostrarNotificacion('Ingresa el nombre del pagador', 'error');
                return false;
            }
            if (!efectyDoc) {
                mostrarNotificacion('Ingresa el documento', 'error');
                return false;
            }
            break;
    }
    return true;
}

async function confirmarPago() {
    if (!Auth.usuarioActual) {
        abrirModalLogin();
        return;
    }
    if (!validarCamposPago()) {
        return;
    }
    let mensaje = '';
    switch (metodoSeleccionado) {
        case 'visa': mensaje = '✅ Pago con tarjeta procesado'; break;
        case 'nequi': mensaje = '✅ Código enviado a tu Nequi'; break;
        case 'daviplata': mensaje = '✅ Código enviado a tu Daviplata'; break;
        case 'efecty': mensaje = '✅ Código de pago en Efecty generado'; break;
        default: mensaje = '✅ Pago confirmado';
    }
    mostrarNotificacion(mensaje);
    if (typeof Carrito !== 'undefined' && Carrito.vaciar) {
        await Carrito.vaciar();
    }
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ===== CONTACTO =====
function enviarMensaje(event) {
    event.preventDefault();
    mostrarNotificacion('Mensaje enviado correctamente');
    document.getElementById('form-contacto')?.reset();
    return false;
}

// ===== CARRUSEL MENSAJES =====
function mostrarCarruselVacio(track) {
    if (!track) return;

    track.innerHTML = `
        <div class="carrusel-mensaje vacio">
            <i class="fa-solid fa-box-open"></i>
            <p>No hay juegos recientes disponibles</p>
        </div>
    `;

    ocultarBotonesCarrusel();
}

function mostrarCarruselError(track) {
    if (!track) return;

    track.innerHTML = `
        <div class="carrusel-mensaje error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Error al cargar los juegos</p>
        </div>
    `;

    ocultarBotonesCarrusel();
}

function ocultarBotonesCarrusel() {
    document.querySelectorAll('.carrusel-btn').forEach(btn => {
        btn.style.display = 'none';
    });
}

// ===== AJUSTAR VIEWPORT =====
function ajustarViewport() {
    const ancho = window.innerWidth;
    let escala = 1;

    if (ancho <= 480) {
        escala = 0.7;
    } else if (ancho <= 768) {
        escala = 0.85;
    } else {
        escala = 1;
    }

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', `width=device-width, initial-scale=${escala}, maximum-scale=${escala}, user-scalable=yes`);
    }
}

// ============================================
// FUNCIONES PARA MODAL DE FILTROS EN MÓVIL
// ============================================

function abrirModalFiltros() {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');
    if (modal) {
        modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalFiltros() {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');
    if (modal) {
        modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function actualizarPrecioMobile() {
    const range = document.getElementById('precio-range-mobile');
    const valor = document.getElementById('precio-valor-mobile');
    const rangeDesktop = document.getElementById('precio-range');

    if (range && valor) {
        const valorNum = parseInt(range.value);
        valor.textContent = `$${formatearPrecio(valorNum)}`;
        if (rangeDesktop) {
            rangeDesktop.value = valorNum;
            const valorDesktop = document.getElementById('precio-valor');
            if (valorDesktop) valorDesktop.textContent = `$${formatearPrecio(valorNum)}`;
        }
    }
}

function sincronizarFiltrosMobile() {
    const checkboxesDesktop = document.querySelectorAll('#filtro-plataformas input[type="checkbox"]');
    const checkboxesMobile = document.querySelectorAll('#filtro-plataformas-mobile input[type="checkbox"]');

    checkboxesDesktop.forEach((cb, index) => {
        if (checkboxesMobile[index]) {
            checkboxesMobile[index].checked = cb.checked;
        }
    });

    const generosDesktop = document.querySelectorAll('#filtro-generos input[type="checkbox"]');
    const generosMobile = document.querySelectorAll('#filtro-generos-mobile input[type="checkbox"]');

    generosDesktop.forEach((cb, index) => {
        if (generosMobile[index]) {
            generosMobile[index].checked = cb.checked;
        }
    });
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', inicializarApp);

window.addEventListener('resize', function () {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(adaptarFiltrosAResolucion, 250);
});

window.addEventListener('resize', ajustarViewport);
document.addEventListener('DOMContentLoaded', ajustarViewport);

setTimeout(inicializarFiltros, 500);

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

// Funciones de productos
window.verProducto = verProducto;
window.agregarAlCarrito = agregarAlCarrito;
window.manejarClickCompra = manejarClickCompra;

// Utilidades
window.cerrarSesion = cerrarSesion;
window.moverCarrusel = moverCarrusel;
window.enviarMensaje = enviarMensaje;

// Modales
window.abrirModalLogin = abrirModalLogin;
window.abrirModalRegistro = abrirModalRegistro;
window.abrirModalPerfil = abrirModalPerfil;

// Sidebar y filtros
window.toggleSidebar = toggleSidebar;
window.toggleFiltros = toggleFiltros;
window.cerrarSidebar = cerrarSidebar;
window.toggleFiltrosPanel = toggleFiltrosPanel;

// Métodos de pago
window.seleccionarMetodo = seleccionarMetodo;
window.formatearNumeroTarjeta = formatearNumeroTarjeta;
window.formatearExpiracion = formatearExpiracion;
window.confirmarPago = confirmarPago;

// Modal de filtros móvil
window.abrirModalFiltros = abrirModalFiltros;
window.cerrarModalFiltros = cerrarModalFiltros;
window.actualizarPrecioMobile = actualizarPrecioMobile;
window.sincronizarFiltrosMobile = sincronizarFiltrosMobile;