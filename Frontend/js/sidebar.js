// ============================================
// SIDEBAR.JS - VERSIÓN COMPLETA CORREGIDA
// ============================================

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
    if (sidebar) {
        sidebar.classList.add('open', 'active');
        document.body.classList.add('sidebar-open');
        if (overlay) overlay.classList.add('active');
    }
}

function cerrarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
        sidebar.classList.remove('open', 'active');
        document.body.classList.remove('sidebar-open');
    }
    if (overlay) overlay.classList.remove('active');
}

function crearSidebarOverlay() {
    if (!document.getElementById('sidebarOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', cerrarSidebar);
        document.body.appendChild(overlay);
    }
}

function crearBotonToggle() {
    const existingToggle = document.getElementById('sidebarToggle');
    const existingMenuToggle = document.querySelector('.menu-toggle');
    if (existingToggle) existingToggle.remove();
    if (existingMenuToggle) existingMenuToggle.remove();
    
    if (!document.getElementById('sidebarToggle')) {
        const btn = document.createElement('button');
        btn.id = 'sidebarToggle';
        btn.className = 'sidebar-toggle';
        btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        btn.onclick = toggleSidebar;
        btn.setAttribute('aria-label', 'Abrir menú');
        document.body.prepend(btn);
    }
}

// ============================================
// RENDERIZAR SIDEBAR ADAPTATIVO POR ROL
// ============================================
async function renderizarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('No se encontró el elemento sidebar');
        return;
    }

    const usuario = Auth?.usuarioActual;
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

    let perfilHTML = '';
    let menuHTML = '';

    if (usuario) {
        const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U';

        // ============================================
        // PERFIL DEL USUARIO (TODOS LOS ROLES)
        // ============================================
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
                
                <!-- 🔥 EDITAR PERFIL PARA TODOS LOS ROLES -->
                <button class="btn-editar-perfil" onclick="abrirModalPerfil()">
                    <i class="fa-solid fa-pen"></i> Editar perfil
                </button>
                
                <button class="btn-sidebar-logout" onclick="Auth.cerrarSesion()">
                    <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                </button>
            </div>
        `;

        // ============================================
        // MENÚ SEGÚN ROL
        // ============================================
        if (usuario.tipo_usuario === 'admin') {
            // 🔥 ADMIN: Solo panel de administración
            menuHTML = `
                <a href="dashboard-admin.html" class="menu-item ${paginaActual === 'dashboard-admin.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-crown"></i></span> Panel Administrador
                </a>
            `;
        } else if (usuario.tipo_usuario === 'proveedor') {
            // 🔥 PROVEEDOR: Solo panel de proveedor
            menuHTML = `
                <a href="dashboard-prove.html" class="menu-item ${paginaActual === 'dashboard-prove.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-building"></i></span> Panel Proveedor
                </a>
            `;
        } else {
            // 🔥 CLIENTE: Tienda completa
            menuHTML = `
                <a href="index.html" class="menu-item ${paginaActual === 'index.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-house"></i></span> Inicio
                </a>
                <a href="juegos.html" class="menu-item ${paginaActual === 'juegos.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-gamepad"></i></span> Juegos
                </a>
                <a href="tarjetas.html" class="menu-item ${paginaActual === 'tarjetas.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-credit-card"></i></span> Tarjetas
                </a>
                <a href="contacto.html" class="menu-item ${paginaActual === 'contacto.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-headset"></i></span> Contacto
                </a>
                <a href="carrito.html" class="menu-item ${paginaActual === 'carrito.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                    <span class="menu-icon"><i class="fa-solid fa-cart-shopping"></i></span> Carrito
                    <span class="carrito-badge" id="sidebar-carrito-contador">${Carrito?.items?.length || 0}</span>
                </a>
            `;
        }
    } else {
        // ============================================
        // NO LOGUEADO
        // ============================================
        perfilHTML = `
            <div class="user-profile-sidebar">
                <div class="auth-buttons-sidebar">
                    <button class="btn-sidebar btn-sidebar-login" onclick="abrirModalLogin()">
                        <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                    </button>
                    <button class="btn-sidebar btn-sidebar-register" onclick="abrirModalRegistro()">
                        <i class="fa-solid fa-user-plus"></i> Crear Cuenta
                    </button>
                </div>
            </div>
        `;
        
        menuHTML = `
            <a href="index.html" class="menu-item ${paginaActual === 'index.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-house"></i></span> Inicio
            </a>
            <a href="juegos.html" class="menu-item ${paginaActual === 'juegos.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-gamepad"></i></span> Juegos
            </a>
            <a href="tarjetas.html" class="menu-item ${paginaActual === 'tarjetas.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-credit-card"></i></span> Tarjetas
            </a>
            <a href="contacto.html" class="menu-item ${paginaActual === 'contacto.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon"><i class="fa-solid fa-headset"></i></span> Contacto
            </a>
        `;
    }

    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <h1><span class="nex">Nex</span><span class="pixel">Pixel</span></h1>
            <p>Videojuegos Digitales</p>
        </div>
        ${perfilHTML}
        <nav class="sidebar-menu" aria-label="Menú principal">
            ${menuHTML}
        </nav>
        <div class="sidebar-footer">
            <p>&copy; 2024 NexPixel</p>
        </div>
    `;

    console.log('✅ Sidebar renderizada para:', usuario?.tipo_usuario || 'invitado');
}

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================
function actualizarContadorCarrito(cantidad) {
    const contador = document.getElementById('sidebar-carrito-contador');
    if (contador) {
        contador.textContent = cantidad || 0;
    }
}

// ============================================
// EVENTOS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarSidebar();
});

window.addEventListener('resize', () => {
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth > 768 && overlay) {
        overlay.classList.remove('active');
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    crearBotonToggle();
    crearSidebarOverlay();
    renderizarSidebar();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        crearBotonToggle();
        crearSidebarOverlay();
        renderizarSidebar();
    }, 100);
}

// ============================================
// EXPONER GLOBALMENTE
// ============================================
window.toggleSidebar = toggleSidebar;
window.abrirSidebar = abrirSidebar;
window.cerrarSidebar = cerrarSidebar;
window.renderizarSidebar = renderizarSidebar;
window.actualizarContadorCarrito = actualizarContadorCarrito;