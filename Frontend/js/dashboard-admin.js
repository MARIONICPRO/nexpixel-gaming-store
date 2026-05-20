// frontend/js/dashboard-admin.js
// ============================================
// DASHBOARD ADMIN - VERSIÓN COMPLETA
// ============================================

let currentTab = 'usuarios';
let searchTimeout;
let lastFocusedInput = null;

// ============================================
// INICIALIZACIÓN
// ============================================
async function cargarDashboardAdmin() {
    console.log('<i class="fa-solid fa-desktop"></i> Cargando dashboard admin...');

    if (!Auth.usuarioActual || Auth.usuarioActual.tipo_usuario !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    await cargarStatsAdmin();
    cambiarTabAdmin('usuarios');
}

async function cargarStatsAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: API.getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('stats-admin').innerHTML = `
                <div class="stat-card"><h4>Usuarios</h4><div class="stat-number">${data.stats.totalUsuarios || 0}</div></div>
                <div class="stat-card"><h4>Productos</h4><div class="stat-number">${data.stats.totalProductos || 0}</div></div>
                <div class="stat-card"><h4>Proveedores</h4><div class="stat-number">${data.stats.totalProveedores || 0}</div></div>
                <div class="stat-card"><h4>Ventas hoy</h4><div class="stat-number">${data.stats.ventasHoy || 0}</div></div>
                <div class="stat-card"><h4>Ingresos hoy</h4><div class="stat-number">$${formatearPrecio(data.stats.ingresosHoy || 0)}</div></div>
            `;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// ============================================
// CAMBIO DE PESTAÑAS
// ============================================
function cambiarTabAdmin(tab) {
    currentTab = tab;
    lastFocusedInput = null;

    const buttons = document.querySelectorAll('.tab-btn');
    const tabIndex = { usuarios: 0, proveedores: 1, productos: 2, ventas: 3, devoluciones: 4 };
    buttons.forEach((btn, i) => btn.classList.toggle('active', i === tabIndex[tab]));

    document.getElementById('admin-content').innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando...</p></div>';

    const tabs = {
        usuarios: () => cargarTablaUsuarios(),
        proveedores: () => cargarTablaProveedores(),
        productos: () => cargarTablaProductosAdmin(),
        ventas: () => cargarTablaVentas(),
        devoluciones: () => cargarTablaDevoluciones()
    };
    if (tabs[tab]) tabs[tab]();
}

// ============================================
// FUNCIÓN DE SEGURIDAD
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// BÚSQUEDA EN TIEMPO REAL (CORREGIDA)
// ============================================
function buscarEnTiempoReal(event) {
    const input = event.target;
    const searchTerm = input.value;
    const tab = currentTab;

    lastFocusedInput = { id: input.id, value: searchTerm };

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        console.log(`🔍 Buscando en ${tab}: "${searchTerm}"`);

        switch (tab) {
            case 'usuarios':
                cargarTablaUsuarios(searchTerm);
                break;
            case 'proveedores':
                cargarTablaProveedores(searchTerm);
                break;
            case 'productos':
                const estado = document.getElementById('filtro-estado')?.value || 'todos';
                cargarTablaProductosAdmin(searchTerm, estado);
                break;
        }

        setTimeout(restaurarFoco, 150);
    }, 500);
}

function restaurarFoco() {
    if (!lastFocusedInput) return;

    const newInput = document.getElementById(lastFocusedInput.id);
    if (newInput) {
        newInput.focus();
        newInput.value = lastFocusedInput.value;
        const len = newInput.value.length;
        newInput.setSelectionRange(len, len);
        
        if (!newInput.hasAttribute('data-live-search')) {
            newInput.setAttribute('data-live-search', 'true');
            newInput.addEventListener('input', buscarEnTiempoReal);
        }
    }
}

document.addEventListener('focusin', (e) => {
    if (e.target.id === 'search-usuario' || 
        e.target.id === 'search-proveedor' || 
        e.target.id === 'search-producto') {
        lastFocusedInput = { id: e.target.id, value: e.target.value };
    }
});

// ============================================
// TABLA DE USUARIOS
// ============================================
async function cargarTablaUsuarios(search = '') {
    try {
        const url = `${API_URL}/admin/usuarios${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="search-bar">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="search-usuario" placeholder="🔍 Buscar por nombre o email..." value="${escapeHtml(search)}" style="flex: 1;" autocomplete="off">
                    <button class="btn-limpiar" onclick="limpiarBusquedaUsuarios()"><i class="fa-solid fa-xmark"></i> Limpiar</button>
                </div>
            </div>`;

        if (!data.success || !data.usuarios?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron usuarios</p>';
            agregarLiveSearch('search-usuario');
            restaurarFoco();
            return;
        }

        html += `
            <div class="table-responsive"><table class="tabla-admin"><thead>
                <tr>
                    <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Cambiar Rol</th><th>Estado</th><th>Verificado</th><th>Registro</th><th>Acciones</th>
                </tr>
            </thead><tbody>`;

        data.usuarios.forEach(u => {
            const estado = u.estado || 'activo';
            const esActivo = estado === 'activo';

            html += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre || '-'}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.tipo_usuario}">${u.tipo_usuario === 'cliente' ? '<i class="fa-solid fa-user"></i> Cliente' : u.tipo_usuario === 'proveedor' ? '<i class="fa-solid fa-gamepad"></i> Proveedor' : '<i class="fa-solid fa-crown"></i> Admin'}</span></td>
                    <td style="min-width: 140px;">
                        <select class="rol-select" data-id="${u.id_usuario}" data-rol-actual="${u.tipo_usuario}" style="background:#1a1a2e;border:1px solid #2d2d44;color:white;padding:6px 10px;border-radius:6px;width:100%;">
                            <option value="cliente" ${u.tipo_usuario === 'cliente' ? 'selected' : ''}>Cliente</option>
                            <option value="proveedor" ${u.tipo_usuario === 'proveedor' ? 'selected' : ''}>Proveedor</option>
                            <option value="admin" ${u.tipo_usuario === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <button class="btn-action btn-primary btn-cambiar-rol" data-id="${u.id_usuario}" style="margin-top:5px;width:100%;"><i class="fa-solid fa-right-left"></i> Cambiar</button>
                    </td>
                    <td><span class="badge badge-${estado}">${esActivo ? '<i class="fa-solid fa-circle-check"></i> Activo' : '<i class="fa-solid fa-circle-xmark"></i> Inactivo'}</span></td>
                    <td>${u.verificado ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>'}</td>
                    <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        ${esActivo
                            ? `<button class="btn-action btn-warning" onclick="inactivarUsuario(${u.id_usuario})" title="Inactivar"><i class="fa-solid fa-ban"></i> Inactivar</button>`
                            : `<button class="btn-action btn-success" onclick="activarUsuario(${u.id_usuario})" title="Activar"><i class="fa-solid fa-lock-open"></i> Activar</button>`
                        }
                        <button class="btn-action btn-delete" onclick="desactivarUsuario(${u.id_usuario})" title="Desactivar"><i class="fa-solid fa-trash"></i> Desactivar</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;

        document.querySelectorAll('.btn-cambiar-rol').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.getAttribute('data-id');
                const select = document.querySelector(`.rol-select[data-id="${userId}"]`);
                const nuevoRol = select.value;
                const rolActual = select.getAttribute('data-rol-actual');
                if (nuevoRol === rolActual) {
                    mostrarNotificacion('El usuario ya tiene ese rol', 'warning');
                    return;
                }
                cambiarRolUsuario(userId, nuevoRol);
            });
        });

        agregarLiveSearch('search-usuario');
        restaurarFoco();

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar usuarios</p>';
    }
}

// ============================================
// TABLA DE PROVEEDORES
// ============================================
async function cargarTablaProveedores(search = '') {
    try {
        const url = `${API_URL}/admin/proveedores${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="search-bar">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="search-proveedor" placeholder="🔍 Buscar por empresa, nombre o email..." value="${escapeHtml(search)}" style="flex: 1;" autocomplete="off">
                    <button class="btn-limpiar" onclick="limpiarBusquedaProveedores()"><i class="fa-solid fa-xmark"></i> Limpiar</button>
                </div>
            </div>`;

        if (!data.success || !data.proveedores?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron proveedores</p>';
            agregarLiveSearch('search-proveedor');
            restaurarFoco();
            return;
        }

        html += `<div class="table-responsive"><table class="tabla-admin"><thead>
                <tr><th>Empresa</th><th>Email</th><th>NIT</th><th>Teléfono</th><th>Verificado</th><th>Estado</th><th>Suspender</th><th>Acciones</th></tr>
            </thead><tbody>`;

        for (const p of data.proveedores) {
            let estadoTexto = '<i class="fa-solid fa-circle-check"></i> Activo';
            let estadoClase = 'badge-success';
            let tiempoRestante = '';

            if (p.suspendido_hasta && new Date(p.suspendido_hasta) > new Date()) {
                const horasRestantes = Math.ceil((new Date(p.suspendido_hasta) - new Date()) / (1000 * 60 * 60));
                estadoTexto = `<i class="fa-solid fa-clock"></i> Suspendido (${horasRestantes}h)`;
                estadoClase = 'badge-warning';
                tiempoRestante = ` hasta ${new Date(p.suspendido_hasta).toLocaleString()}`;
            } else if (p.estado === 'inactivo') {
                estadoTexto = '<i class="fa-solid fa-circle-xmark"></i> Inactivo';
                estadoClase = 'badge-danger';
            }

            html += `
                <tr>
                    <td><strong>${p.empresa || p.nombre || '-'}</strong></td>
                    <td>${p.email}</td><td>${p.nit || '-'}</td><td>${p.telefono || '-'}</td>
                    <td>${p.verificado ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>'}</td>
                    <td><span class="badge ${estadoClase}">${estadoTexto}</span>${tiempoRestante}</td>
                    <td style="min-width:200px;">
                        ${p.estado !== 'inactivo' ? `
                            <select id="suspender-${p.id_usuario}" class="suspender-select" style="padding:5px;border-radius:5px;">
                                <option value="">Seleccionar duración</option>
                                <option value="24">24 horas</option>
                                <option value="168">1 semana</option>
                                <option value="720">1 mes</option>
                                <option value="permanente">Permanente</option>
                            </select>
                            <button class="btn-action btn-warning" onclick="suspenderProveedor(${p.id_usuario})" style="margin-top:5px;"><i class="fa-solid fa-pause"></i> Suspender</button>
                        ` : '<span class="text-muted">Usuario inactivo</span>'}
                    </td>
                    <td>
                        ${!p.verificado && p.estado !== 'inactivo' ? `<button class="btn-action btn-edit" onclick="verificarProveedor(${p.id_usuario})" title="Verificar"><i class="fa-solid fa-check"></i></button>` : ''}
                        ${p.estado !== 'inactivo' ? `<button class="btn-action btn-success" onclick="reactivarProveedor(${p.id_usuario})" title="Reactivar"><i class="fa-solid fa-rotate-left"></i></button>` : ''}
                        <button class="btn-action btn-delete" onclick="desactivarUsuario(${p.id_usuario})" title="Desactivar"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                </tr>`;
        }

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
        agregarLiveSearch('search-proveedor');
        restaurarFoco();

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar proveedores</p>';
    }
}

// ============================================
// TABLA DE PRODUCTOS
// ============================================
async function cargarTablaProductosAdmin(search = '', estado = 'todos') {
    try {
        const url = `${API_URL}/admin/productos?search=${encodeURIComponent(search)}&estado=${estado}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="filtros-bar">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="search-producto" placeholder="🔍 Buscar producto..." value="${escapeHtml(search)}" style="flex: 1;" autocomplete="off">
                    <button class="btn-limpiar" onclick="limpiarBusquedaProductos()"><i class="fa-solid fa-xmark"></i> Limpiar</button>
                </div>
                <select id="filtro-estado" onchange="filtrarPorEstado()">
                    <option value="todos" ${estado === 'todos' ? 'selected' : ''}>Todos</option>
                    <option value="activo" ${estado === 'activo' ? 'selected' : ''}>Activos</option>
                    <option value="inactivo" ${estado === 'inactivo' ? 'selected' : ''}>Inactivos</option>
                </select>
            </div>`;

        if (!data.success || !data.productos?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron productos</p>';
            agregarLiveSearch('search-producto');
            restaurarFoco();
            return;
        }

        html += `<div class="table-responsive"><table class="tabla-admin tabla-productos"><thead>
                <tr><th>Producto</th><th>Tipo</th><th>Plataforma</th><th>Proveedor</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
            </thead><tbody>`;

        data.productos.forEach(p => {
            html += `
                <tr>
                    <td>${p.nombre_producto}</td><td>${p.tipo_producto}</td>
                    <td>${p.plataforma?.nombre_plataforma || '-'}</td>
                    <td>${p.proveedor?.empresa || p.proveedor?.nombre || 'N/A'}</td>
                    <td>$${formatearPrecio(p.precio)}</td><td>${p.stock || 0}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>
                        ${p.estado === 'activo'
                            ? `<button class="btn-action btn-warning" onclick="desactivarProducto(${p.id_producto})" title="Desactivar"><i class="fa-solid fa-lock"></i></button>`
                            : `<button class="btn-action btn-success" onclick="activarProducto(${p.id_producto})" title="Activar"><i class="fa-solid fa-lock-open"></i></button>`
                        }
                        <button class="btn-action btn-edit" onclick="editarProductoAdmin(${p.id_producto})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
        agregarLiveSearch('search-producto');
        restaurarFoco();

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar productos</p>';
    }
}

// ============================================
// FUNCIONES AUXILIARES DE BÚSQUEDA
// ============================================
function agregarLiveSearch(inputId) {
    const input = document.getElementById(inputId);
    if (input && !input.hasAttribute('data-live-search')) {
        input.setAttribute('data-live-search', 'true');
        input.addEventListener('input', buscarEnTiempoReal);
    }
}

function filtrarPorEstado() {
    const searchInput = document.getElementById('search-producto');
    const searchTerm = searchInput ? searchInput.value : '';
    const estado = document.getElementById('filtro-estado')?.value || 'todos';
    cargarTablaProductosAdmin(searchTerm, estado);
}

function limpiarBusquedaUsuarios() {
    const input = document.getElementById('search-usuario');
    if (input) { input.value = ''; lastFocusedInput = { id: 'search-usuario', value: '' }; }
    cargarTablaUsuarios('');
}

function limpiarBusquedaProveedores() {
    const input = document.getElementById('search-proveedor');
    if (input) { input.value = ''; lastFocusedInput = { id: 'search-proveedor', value: '' }; }
    cargarTablaProveedores('');
}

function limpiarBusquedaProductos() {
    const input = document.getElementById('search-producto');
    if (input) { input.value = ''; lastFocusedInput = { id: 'search-producto', value: '' }; }
    const estado = document.getElementById('filtro-estado')?.value || 'todos';
    cargarTablaProductosAdmin('', estado);
}

// ============================================
// TABLA DE VENTAS
// ============================================
async function cargarTablaVentas() {
    try {
        const response = await fetch(`${API_URL}/admin/ventas`, { headers: API.getHeaders() });
        const data = await response.json();
        if (!data.success || !data.ventas?.length) {
            document.getElementById('admin-content').innerHTML = '<p class="empty-message">No hay ventas registradas</p>';
            return;
        }
        let html = `<div class="table-responsive"><table class="tabla-admin"><thead>
            <tr><th>ID</th><th>Fecha</th><th>Usuario</th><th>Total</th><th>Estado</th><th>Método</th><th>Acciones</th></tr>
        </thead><tbody>`;
        data.ventas.forEach(v => {
            html += `<tr>
                <td>#${v.id_compra}</td><td>${new Date(v.fecha_compra).toLocaleDateString()}</td>
                <td>${v.usuario?.email || 'N/A'}</td><td>$${formatearPrecio(v.total)}</td>
                <td><span class="badge badge-${v.estado}">${v.estado}</span></td><td>${v.metodo_pago || '-'}</td>
                <td><select onchange="actualizarEstadoCompra(${v.id_compra}, this.value)">
                    <option value="pendiente" ${v.estado==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="pagado" ${v.estado==='pagado'?'selected':''}>Pagado</option>
                    <option value="enviado" ${v.estado==='enviado'?'selected':''}>Enviado</option>
                    <option value="entregado" ${v.estado==='entregado'?'selected':''}>Entregado</option>
                    <option value="cancelado" ${v.estado==='cancelado'?'selected':''}>Cancelado</option>
                </select></td></tr>`;
        });
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) { document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar ventas</p>'; }
}

// ============================================
// TABLA DE DEVOLUCIONES
// ============================================
async function cargarTablaDevoluciones() {
    try {
        const response = await fetch(`${API_URL}/admin/devoluciones`, { headers: API.getHeaders() });
        const data = await response.json();
        if (!data.success || !data.devoluciones?.length) {
            document.getElementById('admin-content').innerHTML = '<p class="empty-message">No hay devoluciones</p>';
            return;
        }
        let html = `<div class="table-responsive"><table class="tabla-admin"><thead>
            <tr><th>ID</th><th>Fecha</th><th>Usuario</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr>
        </thead><tbody>`;
        data.devoluciones.forEach(d => {
            html += `<tr>
                <td>#${d.id_devolucion}</td><td>${new Date(d.fecha_solicitud).toLocaleDateString()}</td>
                <td>${d.usuario?.email || 'N/A'}</td><td>${d.motivo}</td><td>$${formatearPrecio(d.monto)}</td>
                <td><span class="badge badge-${d.estado}">${d.estado}</span></td>
                <td>${d.estado==='pendiente' ? `
                    <button class="btn-action btn-edit" onclick="aprobarDevolucion(${d.id_devolucion})"><i class="fa-solid fa-check"></i> Aprobar</button>
                    <button class="btn-action btn-delete" onclick="rechazarDevolucion(${d.id_devolucion})"><i class="fa-solid fa-xmark"></i> Rechazar</button>` : '-'}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) { document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar devoluciones</p>'; }
}

// ============================================
// ACCIONES DE USUARIOS
// ============================================
async function cambiarRolUsuario(id, nuevoRol) {
    if (!confirm(`⚠️ ¿Estás seguro de cambiar el rol de este usuario a ${nuevoRol}?`)) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/rol`, { method: 'PUT', headers: { ...API.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo_usuario: nuevoRol }) });
        const data = await res.json();
        if (data.success) { mostrarNotificacion(`✅ Rol cambiado a ${nuevoRol} correctamente`, 'success'); cargarTablaUsuarios(); }
        else { mostrarNotificacion(data.error || 'Error al cambiar rol', 'error'); }
    } catch (error) { mostrarNotificacion('Error de conexión al servidor', 'error'); }
}

async function desactivarUsuario(id) {
    if (!confirm('⚠️ ¿Desactivar este usuario? Podrá ser reactivado más tarde.')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/inactivar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('<i class="fa-solid fa-circle-check"></i> Usuario desactivado correctamente', 'success'); cargarTablaUsuarios(); }
        else { mostrarNotificacion(data.error || 'Error al desactivar usuario', 'error'); }
    } catch (error) { mostrarNotificacion('Error de conexión al servidor', 'error'); }
}

async function inactivarUsuario(id) { await desactivarUsuario(id); }

async function activarUsuario(id) {
    if (!confirm('¿Activar este usuario?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/activar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Usuario activado correctamente', 'success'); cargarTablaUsuarios(); }
    } catch (error) { mostrarNotificacion('Error al activar usuario', 'error'); }
}

// ============================================
// ACCIONES DE PROVEEDORES
// ============================================
async function suspenderProveedor(id) {
    const select = document.getElementById(`suspender-${id}`);
    const duracion = select?.value;
    if (!duracion) { mostrarNotificacion('Selecciona una duración para la suspensión', 'error'); return; }
    const opciones = { '24': [24, '24 horas'], '168': [168, '1 semana'], '720': [720, '1 mes'], 'permanente': [-1, 'permanentemente'] };
    const [horas, mensaje] = opciones[duracion] || [0, ''];
    if (!confirm(`⚠️ ¿Estás seguro de SUSPENDER a este proveedor por ${mensaje}?`)) return;
    try {
        const res = await fetch(`${API_URL}/admin/proveedores/${id}/suspender`, { method: 'PUT', headers: { ...API.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ horas }) });
        const data = await res.json();
        if (data.success) { mostrarNotificacion(`✅ Proveedor suspendido por ${mensaje}`, 'success'); cargarTablaProveedores(); }
        else { mostrarNotificacion(data.error || 'Error al suspender', 'error'); }
    } catch (error) { mostrarNotificacion('Error al suspender proveedor', 'error'); }
}

async function reactivarProveedor(id) {
    if (!confirm('⚠️ ¿Estás seguro de REACTIVAR a este proveedor?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/proveedores/${id}/reactivar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Proveedor reactivado correctamente', 'success'); cargarTablaProveedores(); }
        else { mostrarNotificacion(data.error || 'Error al reactivar', 'error'); }
    } catch (error) { mostrarNotificacion('Error al reactivar proveedor', 'error'); }
}

async function verificarProveedor(id) {
    try {
        const res = await fetch(`${API_URL}/admin/proveedores/${id}/verificar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Proveedor verificado'); cargarTablaProveedores(); }
    } catch (error) { console.error(error); }
}

// ============================================
// ACCIONES DE PRODUCTOS
// ============================================
async function desactivarProducto(id) {
    if (!confirm('¿Desactivar este producto?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/productos/${id}/desactivar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Producto desactivado'); cargarTablaProductosAdmin(); }
    } catch (error) { console.error(error); }
}

async function activarProducto(id) {
    if (!confirm('¿Activar este producto?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/productos/${id}/activar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Producto activado'); cargarTablaProductosAdmin(); }
    } catch (error) { console.error(error); }
}

function editarProductoAdmin(id) { mostrarNotificacion('✏️ Edición - Próximamente', 'info'); }

// ============================================
// ACCIONES DE VENTAS Y DEVOLUCIONES
// ============================================
async function actualizarEstadoCompra(id, estado) {
    try {
        const res = await fetch(`${API_URL}/admin/compras/${id}/estado`, { method: 'PUT', headers: { ...API.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Estado actualizado'); cargarTablaVentas(); }
    } catch (error) { console.error(error); }
}

async function aprobarDevolucion(id) {
    try {
        const res = await fetch(`${API_URL}/admin/devoluciones/${id}/aprobar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('✅ Devolución aprobada'); cargarTablaDevoluciones(); }
    } catch (error) { console.error(error); }
}

async function rechazarDevolucion(id) {
    try {
        const res = await fetch(`${API_URL}/admin/devoluciones/${id}/rechazar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) { mostrarNotificacion('<i class="fa-solid fa-xmark"></i> Devolución rechazada'); cargarTablaDevoluciones(); }
    } catch (error) { console.error(error); }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.cargarDashboardAdmin = cargarDashboardAdmin;
window.cambiarTabAdmin = cambiarTabAdmin;
window.limpiarBusquedaUsuarios = limpiarBusquedaUsuarios;
window.limpiarBusquedaProveedores = limpiarBusquedaProveedores;
window.limpiarBusquedaProductos = limpiarBusquedaProductos;
window.filtrarPorEstado = filtrarPorEstado;
window.cambiarRolUsuario = cambiarRolUsuario;
window.inactivarUsuario = inactivarUsuario;
window.activarUsuario = activarUsuario;
window.desactivarUsuario = desactivarUsuario;
window.suspenderProveedor = suspenderProveedor;
window.reactivarProveedor = reactivarProveedor;
window.verificarProveedor = verificarProveedor;
window.desactivarProducto = desactivarProducto;
window.activarProducto = activarProducto;
window.editarProductoAdmin = editarProductoAdmin;
window.actualizarEstadoCompra = actualizarEstadoCompra;
window.aprobarDevolucion = aprobarDevolucion;
window.rechazarDevolucion = rechazarDevolucion;