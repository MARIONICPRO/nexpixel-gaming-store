// ============================================
// MAIN.JS - NEXPIXEL (VERSIÓN COMPLETA)
// ============================================

// ===== VARIABLES GLOBALES =====
let posicionCarrusel = 0;
let metodoSeleccionado = '';
let filtrosVisibles = true;

// ===== INICIALIZACIÓN =====
async function inicializarApp() {
    console.log('🚀 Inicializando NexPixel...');

    // 🔥 BLOQUEO INMEDIATO — lee localStorage de forma sincrónica
    // antes de hacer cualquier await, para que el botón "atrás" no funcione
    const tokenGuardado = localStorage.getItem('nexpixel_token');
    const usuarioGuardado = localStorage.getItem('nexpixel_usuario');
    if (tokenGuardado && usuarioGuardado) {
        try {
            const u = JSON.parse(usuarioGuardado);
            const path = window.location.pathname;
            if (u.tipo_usuario === 'admin' && path !== '/admin') {
                window.location.replace('/admin');
                return;
            }
            if (u.tipo_usuario === 'proveedor' && path !== '/proveedor') {
                window.location.replace('/proveedor');
                return;
            }
            if (u.tipo_usuario === 'cliente' && (path === '/admin' || path === '/proveedor')) {
                window.location.replace('/home');
                return;
            }
        } catch(e) {
            console.warn('⚠️ Error leyendo usuario del localStorage:', e);
        }
    }

    // 🔥 Forzar ajuste responsive al cargar
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }

    await Auth.init();
    await Carrito.inicializar();
    await renderizarSidebar();

    // Proteger rutas por rol (segunda verificación con datos frescos del servidor)
    protegerRutas();

    const path = window.location.pathname;
    console.log('📄 Página actual:', path);

    if (path === '/' || path === '/home') {
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

    if (path === '/juegos') {
        await Productos.cargarFiltrosPlataformas('filtro-plataformas');
        const containerMobile = document.getElementById('filtro-plataformas-mobile');
        if (containerMobile) {
            await Productos.cargarFiltrosPlataformas('filtro-plataformas-mobile', 'aplicarFiltros()');
        }
        inicializarFiltros();
        setTimeout(() => {
            if (typeof aplicarFiltros === 'function') {
                aplicarFiltros();
            }
        }, 100);
    }

    if (path === '/tarjetas') {
        const tarjetas = await Productos.cargarTarjetas();
        Productos.renderizarTarjetas(tarjetas, 'tarjetas-grid');
        inicializarFiltros();
    }

    if (path === '/contacto') {
        // Solo sidebar
    }

    if (path === '/carrito') {
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

    if (path === '/producto') {
        const urlParams = new URLSearchParams(window.location.search);
        const productoId = urlParams.get('id');
        if (productoId) {
            const producto = await Productos.buscarProducto(productoId);
            if (producto) {
                Productos.renderizarProducto(producto, 'producto-container');
                if (typeof IARecomendaciones !== 'undefined') {
                    await IARecomendaciones.cargarRecomendaciones('recomendaciones-ia-container', 4);
                }
            }
        }
    }

    if (path === '/admin') {
        cargarDashboardAdmin();
    }

    if (path === '/proveedor') {
        cargarDashboardProveedor();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            if (typeof cerrarModalPerfil === 'function') cerrarModalPerfil();
        }
    });
}

// ============================================
// PROTECCIÓN DE RUTAS POR ROL
// (segunda verificación con datos frescos del servidor)
// ============================================
function protegerRutas() {
    const usuario = Auth?.usuarioActual;
    if (!usuario) return;

    const path = window.location.pathname;

    if (usuario.tipo_usuario === 'admin' && path !== '/admin') {
        console.log('🚫 Admin redirigido a su panel desde:', path);
        window.location.replace('/admin');
        return;
    }

    if (usuario.tipo_usuario === 'proveedor' && path !== '/proveedor') {
        console.log('🚫 Proveedor redirigido a su panel desde:', path);
        window.location.replace('/proveedor');
        return;
    }

    if (usuario.tipo_usuario === 'cliente' && (path === '/admin' || path === '/proveedor')) {
        console.log('🚫 Cliente redirigido al inicio');
        window.location.replace('/home');
        return;
    }
}

// ============================================
// PANTALLA DE BIENVENIDA NEXPIXEL
// ============================================

function crearParticulas() {
    const container = document.getElementById('welcomeParticles');
    if (!container) return;
    
    const colores = ['#4d8cff', '#8A2BE2', '#00C9A7', '#FFD700', '#FF1493'];
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'welcome-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
        particle.style.animationDelay = (Math.random() * 5) + 's';
        particle.style.background = colores[Math.floor(Math.random() * colores.length)];
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

function cerrarBienvenida() {
    const screen = document.getElementById('welcome-screen');
    if (screen) {
        screen.classList.add('hidden');
        setTimeout(() => {
            if (screen.parentNode) {
                screen.parentNode.removeChild(screen);
            }
        }, 800);
    }
    sessionStorage.setItem('welcomeShown', 'true');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const screen = document.getElementById('welcome-screen');
        if (screen && !screen.classList.contains('hidden')) {
            e.preventDefault();
            cerrarBienvenida();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const alreadyShown = sessionStorage.getItem('welcomeShown');
    
    if (!alreadyShown) {
        crearParticulas();
    } else {
        const screen = document.getElementById('welcome-screen');
        if (screen) {
            screen.style.display = 'none';
        }
    }
});

document.addEventListener('click', (e) => {
    const screen = document.getElementById('welcome-screen');
    if (screen && !screen.classList.contains('hidden')) {
        if (!e.target.closest('#welcomeBtn')) {
            cerrarBienvenida();
        }
    }
});

// ===== FUNCIONES DE PRODUCTOS =====
async function verProducto(id) {
    if (Auth.usuarioActual) {
        console.log('Vista de producto:', id);
    }
    window.location.href = `/producto?id=${id}`;
}

async function agregarAlCarrito(id) {
    const resultado = await Carrito.agregar(id);
    if (resultado) {
        mostrarNotificacion('✅ Producto agregado al carrito', 'success');
    }
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
    if (window.location.pathname !== '/juegos' && window.location.pathname !== '/tarjetas') return;

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
        if (toggleBtn) toggleBtn.classList.remove('active');
    } else {
        filtrosPanel.classList.remove('hidden');
        container?.classList.remove('without-filters');
        container?.classList.add('with-filters');
        if (toggleBtn) toggleBtn.classList.add('active');
    }
}

function adaptarFiltrosAResolucion() {
    if (window.innerWidth <= 768) {
        const filtrosPanel = document.getElementById('filtrosPanel');
        const container = document.querySelector('.juegos-container, .tarjetas-container');
        if (filtrosPanel) {
            filtrosPanel.classList.add('hidden');
            container?.classList.remove('with-filters');
            container?.classList.add('without-filters');
            filtrosVisibles = false;
        }
    } else {
        inicializarFiltros();
    }
}

// ===== MÉTODOS DE PAGO =====
function seleccionarMetodo(metodo) {
    document.querySelectorAll('.metodo-pago').forEach(el => el.classList.remove('seleccionado'));
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
            html = `<h4>💳 Información de la tarjeta</h4>
                <div class="form-group"><label>Número de tarjeta</label><input type="text" id="tarjeta-numero" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatearNumeroTarjeta(this)"></div>
                <div class="campos-tarjeta-grid">
                    <div class="form-group"><label>Fecha de expiración</label><input type="text" id="tarjeta-expiracion" placeholder="MM/AA" maxlength="5" oninput="formatearExpiracion(this)"></div>
                    <div class="form-group"><label>CVV</label><input type="text" id="tarjeta-cvv" placeholder="123" maxlength="4"></div>
                </div>
                <div class="form-group"><label>Nombre en la tarjeta</label><input type="text" id="tarjeta-nombre" placeholder="Como aparece en la tarjeta"></div>`;
            break;
        case 'nequi':
            html = `<h4>📱 Pago con Nequi</h4><div class="form-group"><label>Número de celular</label><input type="tel" id="nequi-celular" placeholder="300 123 4567"></div>`;
            break;
        case 'daviplata':
            html = `<h4>📱 Pago con Daviplata</h4><div class="form-group"><label>Número de celular</label><input type="tel" id="daviplata-celular" placeholder="300 123 4567"></div>`;
            break;
        case 'efecty':
            html = `<h4>🏦 Pago en Efecty</h4><p style="color:#e94560;padding:1rem;background:rgba(233,69,96,0.1);border-radius:8px;">Recibirás un código para pagar en cualquier punto Efecty.</p>`;
            break;
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
    if (valor.length >= 2) valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    input.value = valor;
}

async function confirmarPago() {
    if (!Auth.usuarioActual) {
        abrirModalLogin();
        return;
    }
    mostrarNotificacion('✅ Pago confirmado');
    if (typeof Carrito !== 'undefined' && Carrito.vaciar) {
        await Carrito.vaciar();
    }
}

// ===== CARRUSEL MENSAJES =====
function mostrarCarruselVacio(track) {
    if (!track) return;
    track.innerHTML = `<div class="carrusel-mensaje vacio"><i class="fa-solid fa-box-open"></i><p>No hay juegos recientes disponibles</p></div>`;
    ocultarBotonesCarrusel();
}

function mostrarCarruselError(track) {
    if (!track) return;
    track.innerHTML = `<div class="carrusel-mensaje error"><i class="fa-solid fa-triangle-exclamation"></i><p>Error al cargar los juegos</p></div>`;
    ocultarBotonesCarrusel();
}

function ocultarBotonesCarrusel() {
    document.querySelectorAll('.carrusel-btn').forEach(btn => btn.style.display = 'none');
}

// ===== MODAL DE FILTROS MÓVIL =====
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

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', inicializarApp);

window.addEventListener('resize', function () {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(adaptarFiltrosAResolucion, 250);
});

setTimeout(inicializarFiltros, 500);

// 🔥 POPSTATE CORREGIDO — bloquea navegación "atrás" para roles restringidos
window.addEventListener('popstate', async () => {
    const token = localStorage.getItem('nexpixel_token');
    const raw = localStorage.getItem('nexpixel_usuario');
    if (token && raw) {
        try {
            const u = JSON.parse(raw);
            const path = window.location.pathname;
            if (u.tipo_usuario === 'admin' && path !== '/admin') {
                window.location.replace('/admin');
                return;
            }
            if (u.tipo_usuario === 'proveedor' && path !== '/proveedor') {
                window.location.replace('/proveedor');
                return;
            }
            if (u.tipo_usuario === 'cliente' && (path === '/admin' || path === '/proveedor')) {
                window.location.replace('/home');
                return;
            }
        } catch(e) {
            console.warn('⚠️ Error en popstate:', e);
        }
    }
    inicializarApp();
});

document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/"]');
    if (link && !link.getAttribute('target')) {
        // Permitir navegación normal
    }
});
// ============================================
// EXPORTAR FUNCIONES GLOBALES - SOLO LAS DE MAIN.JS
// ============================================

// ✅ Funciones definidas en main.js
window.verProducto            = verProducto;
window.agregarAlCarrito       = agregarAlCarrito;
window.manejarClickCompra     = manejarClickCompra;
window.cerrarSesion           = cerrarSesion;
window.moverCarrusel          = moverCarrusel;
window.toggleSidebar          = toggleSidebar;
window.toggleFiltros          = toggleFiltros;
window.cerrarSidebar          = cerrarSidebar;
window.toggleFiltrosPanel     = toggleFiltrosPanel;
window.seleccionarMetodo      = seleccionarMetodo;
window.formatearNumeroTarjeta = formatearNumeroTarjeta;
window.formatearExpiracion    = formatearExpiracion;
window.confirmarPago          = confirmarPago;
window.abrirModalFiltros      = abrirModalFiltros;
window.cerrarModalFiltros     = cerrarModalFiltros;
window.formatearPrecio        = formatearPrecio;
window.mostrarNotificacion    = mostrarNotificacion;
window.cerrarBienvenida       = cerrarBienvenida;

// ✅ Funciones que vienen de modales.js - NO SOBRESCRIBIR
// window.abrirModalLogin      = abrirModalLogin;  // ❌ ELIMINAR
// window.abrirModalRegistro   = abrirModalRegistro; // ❌ ELIMINAR
// window.abrirModalPerfil     = abrirModalPerfil; // ❌ ELIMINAR
// window.cerrarModal          = cerrarModal; // ❌ ELIMINAR
// window.cerrarModalPerfil    = cerrarModalPerfil; // ❌ ELIMINAR

console.log('✅ main.js cargado correctamente');

// Verificar que las funciones de modales están disponibles
console.log('🔍 abrirModalLogin:', typeof window.abrirModalLogin);
console.log('🔍 abrirModalRegistro:', typeof window.abrirModalRegistro);
console.log('🔍 abrirModalPerfil:', typeof window.abrirModalPerfil);