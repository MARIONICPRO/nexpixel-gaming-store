// =============================================
// RENDERIZADO DE LA BARRA LATERAL
// =============================================
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
    let dashboardButtons = ''; // 👈 NUEVO: Botones de dashboard

    if (usuario) {
        // Usuario logueado - mostrar perfil
        const fotoUrl = usuario.foto_perfil || 'assets/img/default-avatar.png';
        const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U';

        // 👇 NUEVO: Botones según tipo de usuario
        if (usuario.tipo_usuario === 'admin') {
            dashboardButtons = `
                <a href="dashboard-admin.html" class="menu-item" onclick="cerrarSidebar()">
                    <span class="menu-icon">👑</span> Panel Administrador
                </a>
            `;
        } else if (usuario.tipo_usuario === 'proveedor') {
            dashboardButtons = `
                <a href="dashboard-prove.html" class="menu-item" onclick="cerrarSidebar()">
                    <span class="menu-icon">🏢</span> Panel Proveedor
                </a>
            `;
        }

        // En la sección de la imagen del perfil
        perfilHTML = `
    <div class="user-profile-sidebar">
        <button class="close-sidebar show-on-mobile" onclick="cerrarSidebar()">✕</button>
        <div class="user-avatar-large">
            ${usuario.foto_perfil ?
                `<img src="${usuario.foto_perfil}?t=${Date.now()}" alt="${usuario.nombre}" 
                      onerror="this.src='assets/img/default-avatar.png'">` :
                `<div class="avatar-placeholder">${inicial}</div>`
            }
        </div>
        <div class="user-name">${usuario.nombre}</div>
        <div class="user-email">${usuario.email}</div>
        <div class="user-role">${usuario.tipo_usuario === 'admin' ? '👑 Administrador' :
                usuario.tipo_usuario === 'proveedor' ? '🏢 Proveedor' : '👤 Cliente'
            }</div>
        <button class="btn-editar-perfil" onclick="abrirModalPerfil()">✏️ Editar perfil</button>
        <button class="btn-sidebar-logout" onclick="cerrarSesion()">🚪 Cerrar sesión</button>
    </div>
`;
    } else {
        // Usuario no logueado - mostrar botones de autenticación
        perfilHTML = `
            <div class="user-profile-sidebar">
                <button class="close-sidebar show-on-mobile" onclick="cerrarSidebar()">✕</button>
                <div class="auth-buttons-sidebar">
                    <button class="btn-sidebar btn-sidebar-login" onclick="abrirModalLogin()">Iniciar Sesión</button>
                    <button class="btn-sidebar btn-sidebar-register" onclick="abrirModalRegistro()">Crear Cuenta</button>
                </div>
            </div>
        `;
    }

    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <h1>NexPixel</h1>
            <p>Videojuegos Digitales</p>
        </div>
        ${perfilHTML}
        <div class="sidebar-menu">
            <a href="index.html" class="menu-item ${paginaActual === 'index.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon">🏠</span> Inicio
            </a>
            <a href="juegos.html" class="menu-item ${paginaActual === 'juegos.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon">🎮</span> Juegos
            </a>
            <a href="tarjetas.html" class="menu-item ${paginaActual === 'tarjetas.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon">💳</span> Tarjetas
            </a>
            <a href="contacto.html" class="menu-item ${paginaActual === 'contacto.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon">📞</span> Contacto
            </a>
            <a href="carrito.html" class="menu-item ${paginaActual === 'carrito.html' ? 'active' : ''}" onclick="cerrarSidebar()">
                <span class="menu-icon">🛒</span> Carrito
                <span class="carrito-badge" id="sidebar-carrito-contador">${Carrito?.items?.length || 0}</span>
            </a>
            ${dashboardButtons} <!-- 👈 NUEVO: Botones insertados aquí -->
        </div>
    `;

    console.log('Sidebar renderizada correctamente');
}

// Función para cerrar sidebar en móvil
function cerrarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
    }
}

// Exponer funciones globalmente
window.renderizarSidebar = renderizarSidebar;
window.cerrarSidebar = cerrarSidebar;