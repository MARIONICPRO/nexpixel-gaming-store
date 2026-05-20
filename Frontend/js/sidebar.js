// ============================================
// SIDEBAR.JS - VERSIÓN COMPLETA CORREGIDA
// ============================================

// =============================================
// FUNCIONES TOGGLE SIDEBAR
// =============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebar) return;
    
    const isOpen = sidebar.classList.contains('open') || sidebar.classList.contains('active');
    
    if (isOpen) {
        cerrarSidebar();
    } else {
        abrirSidebar();
    }
}

function abrirSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('sidebarToggle');
    
    if (sidebar) {
        sidebar.classList.add('open', 'active');
        document.body.classList.add('sidebar-open');
        
        if (toggle) {
            toggle.querySelector('i').className = 'fa-solid fa-times';
        }
        
        if (overlay) {
            overlay.classList.add('active');
        }
    }
}

function cerrarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('sidebarToggle');
    
    if (sidebar) {
        sidebar.classList.remove('open', 'active');
        document.body.classList.remove('sidebar-open');
        
        if (toggle) {
            toggle.querySelector('i').className = 'fa-solid fa-bars';
        }
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// =============================================
// CREAR ELEMENTOS AUTOMÁTICAMENTE
// =============================================
function crearSidebarOverlay() {
    // Eliminar overlay existente si hay
    const existingOverlay = document.getElementById('sidebarOverlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', cerrarSidebar);
    document.body.appendChild(overlay);
}

function crearBotonToggle() {
    // 🔥 ELIMINAR CUALQUIER BOTÓN EXISTENTE
    const existingToggle = document.getElementById('sidebarToggle');
    const existingMenuToggle = document.querySelector('.menu-toggle');
    
    if (existingToggle) existingToggle.remove();
    if (existingMenuToggle) existingMenuToggle.remove();
    
    // Crear UN SOLO botón
    const btn = document.createElement('button');
    btn.id = 'sidebarToggle';
    btn.className = 'sidebar-toggle';
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    btn.onclick = toggleSidebar;
    btn.setAttribute('aria-label', 'Abrir menú');
    document.body.prepend(btn);
}

// =============================================
// RENDERIZADO DE LA BARRA LATERAL
// =============================================
async function renderizarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('No se encontró el elemento sidebar');
        return;
    }

    const usuario = Auth?.usuarioActual;
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

    let perfilHTML = '';
    let dashboardButtons = '';

    if (usuario) {
        // Usuario logueado
        const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U';

        if (usuario.tipo_usuario === 'admin') {
            dashboardButtons = `
                <a href="dashboard-admin.html" class="menu-item" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-crown"></i></span> Panel Administrador
                </a>
            `;
        } else if (usuario.tipo_usuario === 'proveedor') {
            dashboardButtons = `
                <a href="dashboard-prove.html" class="menu-item" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-building"></i></span> Panel Proveedor
                </a>
            `;
        }

        perfilHTML = `
            <div class="user-profile-sidebar">
                <div class="user-avatar-large">
                    ${usuario.foto_perfil ?
                        `<img src="${usuario.foto_perfil}?t=${Date.now()}" alt="${usuario.nombre}" 
                              onerror="this.src='assets/img/default-avatar.png'">` :
                        `<div class="avatar-placeholder">${inicial}</div>`
                    }
                </div>
                <div class="user-name">${usuario.nombre}</div>
                <div class="user-email">${usuario.email}</div>
                <div class="user-role">
                    ${usuario.tipo_usuario === 'admin' ? '<i class="fa-solid fa-crown"></i> Administrador' :
                      usuario.tipo_usuario === 'proveedor' ? '<i class="fa-solid fa-building"></i> Proveedor' : 
                      '<i class="fa-solid fa-user"></i> Cliente'}
                </div>
                <button class="btn-editar-perfil" onclick="abrirModalPerfil()">
                    <i class="fa-solid fa-pen"></i> Editar perfil
                </button>
                <button class="btn-sidebar-logout" onclick="Auth.cerrarSesion()">
                    <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                </button>
            </div>
        `;
    } else {
        // Usuario no logueado
        perfilHTML = `
            <div class="user-profile-sidebar">
                <div class="auth-buttons-sidebar">
                    <button class="btn-sidebar btn-sidebar-login" onclick="abrirModalLogin()">
                        <i class="fa-solid fa-right-to-bracket icon-gradient"></i> Iniciar Sesión
                    </button>
                    <button class="btn-sidebar btn-sidebar-register" onclick="abrirModalRegistro()">
                        <i class="fa-solid fa-user-plus icon-gradient"></i> Crear Cuenta
                    </button>
                </div>
            </div>
        `;
    }

    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <h1><span class="nex">Nex</span><span class="pixel">Pixel</span></h1>
            <p>Videojuegos Digitales</p>
        </div>
        
        ${perfilHTML}
        
        <nav class="sidebar-menu" aria-label="Menú principal">
            <a href="index.html" class="menu-item ${paginaActual === 'index.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-house icon-gradient"></i></span> Inicio
            </a>
            <a href="juegos.html" class="menu-item ${paginaActual === 'juegos.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-gamepad icon-gradient"></i></span> Juegos
            </a>
            <a href="tarjetas.html" class="menu-item ${paginaActual === 'tarjetas.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-credit-card icon-gradient"></i></span> Tarjetas
            </a>
            <a href="contacto.html" class="menu-item ${paginaActual === 'contacto.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-headset icon-gradient"></i></span> Contacto
            </a>
            <a href="carrito.html" class="menu-item ${paginaActual === 'carrito.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-cart-shopping icon-gradient"></i></span> Carrito
                <span class="carrito-badge" id="sidebar-carrito-contador">${Carrito?.items?.length || 0}</span>
            </a>
            ${dashboardButtons}
        </nav>
        
        <div class="sidebar-footer">
            <p>&copy; 2026 NexPixel</p>
        </div>
    `;

    console.log('✅ Sidebar renderizada correctamente');
}

// =============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// =============================================
function actualizarContadorCarrito(cantidad) {
    const contador = document.getElementById('sidebar-carrito-contador');
    if (contador) {
        contador.textContent = cantidad || 0;
    }
}

// =============================================
// EVENTOS
// =============================================

// Cerrar sidebar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarSidebar();
    }
});

// Cerrar sidebar al hacer clic fuera (en el overlay)
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && sidebar.classList.contains('active')) {
        // Si el clic NO fue en el sidebar ni en el botón toggle
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
            cerrarSidebar();
        }
    }
});

// Prevenir que clics dentro del sidebar cierren el overlay
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.contains(e.target)) {
        e.stopPropagation();
    }
});

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    crearBotonToggle();
    crearSidebarOverlay();
    renderizarSidebar();
});

// También inicializar si el DOM ya está listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        crearBotonToggle();
        crearSidebarOverlay();
        renderizarSidebar();
    }, 100);
}

// =============================================
// EXPONER FUNCIONES GLOBALMENTE
// =============================================
window.toggleSidebar = toggleSidebar;
window.abrirSidebar = abrirSidebar;
window.cerrarSidebar = cerrarSidebar;
window.renderizarSidebar = renderizarSidebar;
window.actualizarContadorCarrito = actualizarContadorCarrito;