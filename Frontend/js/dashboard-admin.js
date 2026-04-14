// frontend/js/dashboard-admin.js
// ============================================
// DASHBOARD ADMIN - VERSIÓN COMPLETA
// ============================================

let currentTab = 'usuarios';

// ============================================
// INICIALIZACIÓN
// ============================================
async function cargarDashboardAdmin() {
    console.log('🖥️ Cargando dashboard admin...');

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

    const buttons = document.querySelectorAll('.tab-btn');
    const tabIndex = { usuarios: 0, proveedores: 1, productos: 2, ventas: 3, devoluciones: 4 };
    buttons.forEach((btn, i) => btn.classList.toggle('active', i === tabIndex[tab]));

    document.getElementById('admin-content').innerHTML = '<div class="loading">Cargando...</div>';

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
// TABLA DE USUARIOS CON BOTÓN DE BÚSQUEDA
// ============================================
async function cargarTablaUsuarios(search = '') {
    try {
        const url = `${API_URL}/admin/usuarios${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="search-bar">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="search-usuario" placeholder="🔍 Buscar por nombre o email..." value="${escapeHtml(search)}" style="flex: 1;">
                    <button class="btn-buscar" onclick="buscarUsuarios()">🔍 Buscar</button>
                    <button class="btn-limpiar" onclick="limpiarBusquedaUsuarios()">✖ Limpiar</button>
                </div>
            </div>`;

        if (!data.success || !data.usuarios?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron usuarios</p>';
            document.getElementById('search-usuario')?.addEventListener('keypress', e => { if (e.key === 'Enter') buscarUsuarios(); });
            return;
        }

        html += `
            <div class="table-responsive"><table class="tabla-admin"><thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Cambiar Rol</th>
                    <th>Estado</th>
                    <th>Verificado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                </tr>
            </thead><tbody>
        `;

        data.usuarios.forEach(u => {
            const estado = u.estado || 'activo';
            const esActivo = estado === 'activo';

            const opcionesRol = `
                <option value="cliente" ${u.tipo_usuario === 'cliente' ? 'selected' : ''}>Cliente</option>
                <option value="proveedor" ${u.tipo_usuario === 'proveedor' ? 'selected' : ''}>Proveedor</option>
                <option value="admin" ${u.tipo_usuario === 'admin' ? 'selected' : ''}>Admin</option>
            `;

            html += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre || '-'}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.tipo_usuario}">${u.tipo_usuario === 'cliente' ? '👤 Cliente' : u.tipo_usuario === 'proveedor' ? '🏪 Proveedor' : '👑 Admin'}</span></td>
                    <td style="min-width: 140px;">
                        <select class="rol-select" data-id="${u.id_usuario}" data-rol-actual="${u.tipo_usuario}" style="background: #1a1a2e; border: 1px solid #2d2d44; color: white; padding: 6px 10px; border-radius: 6px; width: 100%;">
                            ${opcionesRol}
                        </select>
                        <button class="btn-action btn-primary btn-cambiar-rol" data-id="${u.id_usuario}" style="margin-top: 5px; width: 100%;">🔄 Cambiar</button>
                    </td>
                    <td><span class="badge badge-${estado}">${estado === 'activo' ? '✅ Activo' : '❌ Inactivo'}</span></td>
                    <td>${u.verificado ? '✅' : '❌'}</td>
                    <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        ${esActivo
                            ? `<button class="btn-action btn-warning" onclick="inactivarUsuario(${u.id_usuario})" title="Inactivar">🔒 Inactivar</button>`
                            : `<button class="btn-action btn-success" onclick="activarUsuario(${u.id_usuario})" title="Activar">🔓 Activar</button>`
                        }
                        <button class="btn-action btn-delete" onclick="desactivarUsuario(${u.id_usuario})" title="Desactivar">🗑️</button>
                    </td>
                </tr>
            `;
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

        const searchInput = document.getElementById('search-usuario');
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') buscarUsuarios();
            });
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar usuarios</p>';
    }
}

function buscarUsuarios() {
    const searchInput = document.getElementById('search-usuario');
    const searchTerm = searchInput ? searchInput.value : '';
    console.log('🔍 Buscando usuarios:', searchTerm);
    cargarTablaUsuarios(searchTerm);
}

function limpiarBusquedaUsuarios() {
    const searchInput = document.getElementById('search-usuario');
    if (searchInput) searchInput.value = '';
    cargarTablaUsuarios('');
}

// ============================================
// TABLA DE PROVEEDORES CON BOTÓN DE BÚSQUEDA
// ============================================
async function cargarTablaProveedores(search = '') {
    try {
        const url = `${API_URL}/admin/proveedores${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="search-bar">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="search-proveedor" placeholder="🔍 Buscar por empresa, nombre o email..." value="${escapeHtml(search)}" style="flex: 1;">
                    <button class="btn-buscar" onclick="buscarProveedores()">🔍 Buscar</button>
                    <button class="btn-limpiar" onclick="limpiarBusquedaProveedores()">✖ Limpiar</button>
                </div>
            </div>`;

        if (!data.success || !data.proveedores?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron proveedores</p>';
            document.getElementById('search-proveedor')?.addEventListener('keypress', e => { if (e.key === 'Enter') buscarProveedores(); });
            return;
        }

        html += `<div class="table-responsive">
                <table class="tabla-admin">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Email</th>
                            <th>NIT</th>
                            <th>Teléfono</th>
                            <th>Verificado</th>
                            <th>Estado</th>
                            <th>Suspender</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const p of data.proveedores) {
            let estadoTexto = '✅ Activo';
            let estadoClase = 'badge-success';
            let tiempoRestante = '';

            if (p.suspendido_hasta && new Date(p.suspendido_hasta) > new Date()) {
                const horasRestantes = Math.ceil((new Date(p.suspendido_hasta) - new Date()) / (1000 * 60 * 60));
                estadoTexto = `⏳ Suspendido (${horasRestantes} horas)`;
                estadoClase = 'badge-warning';
                tiempoRestante = ` hasta ${new Date(p.suspendido_hasta).toLocaleString()}`;
            } else if (p.estado === 'inactivo') {
                estadoTexto = '❌ Inactivo';
                estadoClase = 'badge-danger';
            }

            html += `
                <tr>
                    <td><strong>${p.empresa || p.nombre || '-'}</strong></td>
                    <td>${p.email}</td>
                    <td>${p.nit || '-'}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.verificado ? '✅ Sí' : '❌ No'}</td>
                    <td><span class="badge ${estadoClase}">${estadoTexto}</span>${tiempoRestante}</td>
                    <td style="min-width: 200px;">
                        ${p.estado !== 'inactivo' ? `
                            <select id="suspender-${p.id_usuario}" class="suspender-select" style="padding: 5px; border-radius: 5px;">
                                <option value="">Seleccionar duración</option>
                                <option value="24">24 horas</option>
                                <option value="168">1 semana</option>
                                <option value="720">1 mes</option>
                                <option value="permanente">Permanente</option>
                            </select>
                            <button class="btn-action btn-warning" onclick="suspenderProveedor(${p.id_usuario})" style="margin-top: 5px;">⏸ Suspender</button>
                        ` : '<span class="text-muted">Usuario inactivo</span>'}
                    </td>
                    <td>
                        ${!p.verificado && p.estado !== 'inactivo' ? `<button class="btn-action btn-edit" onclick="verificarProveedor(${p.id_usuario})" title="Verificar">✓</button>` : ''}
                        ${p.estado !== 'inactivo' ? `<button class="btn-action btn-success" onclick="reactivarProveedor(${p.id_usuario})" title="Reactivar">🔄</button>` : ''}
                        <button class="btn-action btn-delete" onclick="desactivarUsuario(${p.id_usuario})" title="Desactivar">🗑️</button>
                    </td>
                </tr>
            `;
        }

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;

        const searchInput = document.getElementById('search-proveedor');
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') buscarProveedores();
            });
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar proveedores</p>';
    }
}

function buscarProveedores() {
    const searchInput = document.getElementById('search-proveedor');
    const searchTerm = searchInput ? searchInput.value : '';
    console.log('🔍 Buscando proveedores:', searchTerm);
    cargarTablaProveedores(searchTerm);
}

function limpiarBusquedaProveedores() {
    const searchInput = document.getElementById('search-proveedor');
    if (searchInput) searchInput.value = '';
    cargarTablaProveedores('');
}

// ============================================
// TABLA DE PRODUCTOS CON BOTÓN DE BÚSQUEDA
// ============================================
async function cargarTablaProductosAdmin(search = '', estado = 'todos') {
    try {
        const url = `${API_URL}/admin/productos?search=${encodeURIComponent(search)}&estado=${estado}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();

        let html = `
            <div class="filtros-bar">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="search-producto" placeholder="🔍 Buscar producto..." value="${escapeHtml(search)}" style="flex: 1;">
                    <button class="btn-buscar" onclick="buscarProductos()">🔍 Buscar</button>
                    <button class="btn-limpiar" onclick="limpiarBusquedaProductos()">✖ Limpiar</button>
                </div>
                <select id="filtro-estado" onchange="buscarProductos()">
                    <option value="todos" ${estado === 'todos' ? 'selected' : ''}>Todos</option>
                    <option value="activo" ${estado === 'activo' ? 'selected' : ''}>Activos</option>
                    <option value="inactivo" ${estado === 'inactivo' ? 'selected' : ''}>Inactivos</option>
                </select>
            </div>`;

        if (!data.success || !data.productos?.length) {
            document.getElementById('admin-content').innerHTML = html + '<p class="empty-message">No se encontraron productos</p>';
            document.getElementById('search-producto')?.addEventListener('keypress', e => { if (e.key === 'Enter') buscarProductos(); });
            return;
        }

        html += `<div class="table-responsive"><table class="tabla-admin tabla-productos"><thead>
                <tr>
                    <th>Producto</th><th>Tipo</th><th>Plataforma</th><th>Proveedor</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
                </tr>
            </thead><tbody>
        `;

        data.productos.forEach(p => {
            html += `
                <tr>
                    <td>${p.nombre_producto}</td>
                    <td>${p.tipo_producto}</td>
                    <td>${p.plataforma?.nombre_plataforma || '-'}</td>
                    <td>${p.proveedor?.empresa || p.proveedor?.nombre || 'N/A'}</td>
                    <td>$${formatearPrecio(p.precio)}</td>
                    <td>${p.stock || 0}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>
                        ${p.estado === 'activo'
                            ? `<button class="btn-action btn-warning" onclick="desactivarProducto(${p.id_producto})" title="Desactivar">🔒</button>`
                            : `<button class="btn-action btn-success" onclick="activarProducto(${p.id_producto})" title="Activar">🔓</button>`
                        }
                        <button class="btn-action btn-edit" onclick="editarProductoAdmin(${p.id_producto})" title="Editar">✏️</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;

        const searchInput = document.getElementById('search-producto');
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') buscarProductos();
            });
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar productos</p>';
    }
}

function buscarProductos() {
    const searchInput = document.getElementById('search-producto');
    const searchTerm = searchInput ? searchInput.value : '';
    const estado = document.getElementById('filtro-estado')?.value || 'todos';
    console.log('🔍 Buscando productos:', searchTerm);
    cargarTablaProductosAdmin(searchTerm, estado);
}

function limpiarBusquedaProductos() {
    const searchInput = document.getElementById('search-producto');
    if (searchInput) searchInput.value = '';
    const estado = document.getElementById('filtro-estado')?.value || 'todos';
    cargarTablaProductosAdmin('', estado);
}

// ============================================
// SUSPENSIÓN DE PROVEEDORES
// ============================================
async function suspenderProveedor(id) {
    const select = document.getElementById(`suspender-${id}`);
    const duracion = select.value;

    if (!duracion) {
        mostrarNotificacion('Selecciona una duración para la suspensión', 'error');
        return;
    }

    let horas = 0;
    let mensaje = '';

    switch (duracion) {
        case '24':    horas = 24;   mensaje = '24 horas';       break;
        case '168':   horas = 168;  mensaje = '1 semana';        break;
        case '720':   horas = 720;  mensaje = '1 mes';           break;
        case 'permanente': horas = -1; mensaje = 'permanentemente'; break;
    }

    if (!confirm(`⚠️ ¿Estás seguro de SUSPENDER a este proveedor por ${mensaje}?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/proveedores/${id}/suspender`, {
            method: 'PUT',
            headers: { ...API.getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ horas })
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion(`✅ Proveedor suspendido por ${mensaje}`, 'success');
            cargarTablaProveedores();
        } else {
            mostrarNotificacion(data.error || 'Error al suspender', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al suspender proveedor', 'error');
    }
}

async function reactivarProveedor(id) {
    if (!confirm('⚠️ ¿Estás seguro de REACTIVAR a este proveedor?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/proveedores/${id}/reactivar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('✅ Proveedor reactivado correctamente', 'success');
            cargarTablaProveedores();
        } else {
            mostrarNotificacion(data.error || 'Error al reactivar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al reactivar proveedor', 'error');
    }
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
            <tr>
                <th>ID</th><th>Fecha</th><th>Usuario</th><th>Total</th><th>Estado</th><th>Método</th><th>Acciones</th>
            </tr>
        </thead><tbody>`;

        data.ventas.forEach(v => {
            html += `
                <tr>
                    <td>#${v.id_compra}</td>
                    <td>${new Date(v.fecha_compra).toLocaleDateString()}</td>
                    <td>${v.usuario?.email || 'N/A'}</td>
                    <td>$${formatearPrecio(v.total)}</td>
                    <td><span class="badge badge-${v.estado}">${v.estado}</span></td>
                    <td>${v.metodo_pago || '-'}</td>
                    <td>
                        <select onchange="actualizarEstadoCompra(${v.id_compra}, this.value)">
                            <option value="pendiente" ${v.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="pagado" ${v.estado === 'pagado' ? 'selected' : ''}>Pagado</option>
                            <option value="enviado" ${v.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                            <option value="entregado" ${v.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${v.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar ventas</p>';
    }
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
            <tr>
                <th>ID</th><th>Fecha</th><th>Usuario</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acciones</th>
            </tr>
        </thead><tbody>`;

        data.devoluciones.forEach(d => {
            html += `
                <tr>
                    <td>#${d.id_devolucion}</td>
                    <td>${new Date(d.fecha_solicitud).toLocaleDateString()}</td>
                    <td>${d.usuario?.email || 'N/A'}</td>
                    <td>${d.motivo}</td>
                    <td>$${formatearPrecio(d.monto)}</td>
                    <td><span class="badge badge-${d.estado}">${d.estado}</span></td>
                    <td>${d.estado === 'pendiente' ? `
                        <button class="btn-action btn-edit" onclick="aprobarDevolucion(${d.id_devolucion})">✓ Aprobar</button>
                        <button class="btn-action btn-delete" onclick="rechazarDevolucion(${d.id_devolucion})">✗ Rechazar</button>
                    ` : '-'}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar devoluciones</p>';
    }
}

// ============================================
// ACCIONES DE USUARIOS
// ============================================
async function cambiarRolUsuario(id, nuevoRol) {
    if (!confirm(`⚠️ ¿Estás seguro de cambiar el rol de este usuario a ${nuevoRol}?`)) return;

    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/rol`, {
            method: 'PUT',
            headers: { ...API.getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo_usuario: nuevoRol })
        });

        const data = await res.json();

        if (data.success) {
            mostrarNotificacion(`✅ Rol cambiado a ${nuevoRol} correctamente`, 'success');
            if (currentTab === 'usuarios') await cargarTablaUsuarios();
            else if (currentTab === 'proveedores') await cargarTablaProveedores();
        } else {
            mostrarNotificacion(data.error || 'Error al cambiar rol', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al servidor', 'error');
    }
}

async function desactivarUsuario(id) {
    if (!confirm('⚠️ ¿Desactivar este usuario? Podrá ser reactivado más tarde.')) return;

    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/inactivar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });

        const data = await res.json();

        if (data.success) {
            mostrarNotificacion('✅ Usuario desactivado correctamente', 'success');
            if (currentTab === 'usuarios') await cargarTablaUsuarios();
            else if (currentTab === 'proveedores') await cargarTablaProveedores();
        } else {
            mostrarNotificacion(data.error || 'Error al desactivar usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al servidor', 'error');
    }
}

async function inactivarUsuario(id) {
    await desactivarUsuario(id);
}

async function activarUsuario(id) {
    if (!confirm('¿Activar este usuario?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/activar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });

        const data = await res.json();

        if (data.success) {
            mostrarNotificacion('✅ Usuario activado correctamente', 'success');
            if (currentTab === 'usuarios') await cargarTablaUsuarios();
            else if (currentTab === 'proveedores') await cargarTablaProveedores();
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error al activar usuario', 'error');
    }
}

async function eliminarUsuario(id) {
    await desactivarUsuario(id);
}

async function cambiarRolAdmin(id) {
    if (!confirm('¿Convertir este usuario en ADMINISTRADOR?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/cambiar-rol-admin`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('👑 Usuario ahora es admin');
            cargarTablaUsuarios();
        }
    } catch (error) { console.error(error); }
}

// ============================================
// ACCIONES DE PROVEEDORES
// ============================================
async function verificarProveedor(id) {
    try {
        const res = await fetch(`${API_URL}/admin/proveedores/${id}/verificar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Proveedor verificado');
            cargarTablaProveedores();
        }
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
        if (data.success) {
            mostrarNotificacion('✅ Producto desactivado');
            cargarTablaProductosAdmin();
        }
    } catch (error) { console.error(error); }
}

async function activarProducto(id) {
    if (!confirm('¿Activar este producto?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/productos/${id}/activar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Producto activado');
            cargarTablaProductosAdmin();
        }
    } catch (error) { console.error(error); }
}

function editarProductoAdmin(id) {
    mostrarNotificacion('✏️ Edición - Próximamente', 'info');
}

// ============================================
// ACCIONES DE VENTAS
// ============================================
async function actualizarEstadoCompra(id, estado) {
    try {
        const res = await fetch(`${API_URL}/admin/compras/${id}/estado`, {
            method: 'PUT',
            headers: { ...API.getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Estado actualizado');
            cargarTablaVentas();
        }
    } catch (error) { console.error(error); }
}

// ============================================
// ACCIONES DE DEVOLUCIONES
// ============================================
async function aprobarDevolucion(id) {
    try {
        const res = await fetch(`${API_URL}/admin/devoluciones/${id}/aprobar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Devolución aprobada');
            cargarTablaDevoluciones();
        }
    } catch (error) { console.error(error); }
}

async function rechazarDevolucion(id) {
    try {
        const res = await fetch(`${API_URL}/admin/devoluciones/${id}/rechazar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('❌ Devolución rechazada');
            cargarTablaDevoluciones();
        }
    } catch (error) { console.error(error); }
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.cargarDashboardAdmin = cargarDashboardAdmin;
window.cambiarTabAdmin = cambiarTabAdmin;
window.buscarUsuarios = buscarUsuarios;
window.buscarProveedores = buscarProveedores;
window.buscarProductos = buscarProductos;
window.limpiarBusquedaUsuarios = limpiarBusquedaUsuarios;
window.limpiarBusquedaProveedores = limpiarBusquedaProveedores;
window.limpiarBusquedaProductos = limpiarBusquedaProductos;
window.cambiarRolUsuario = cambiarRolUsuario;
window.inactivarUsuario = inactivarUsuario;
window.activarUsuario = activarUsuario;
window.desactivarUsuario = desactivarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.cambiarRolAdmin = cambiarRolAdmin;
window.verificarProveedor = verificarProveedor;
window.suspenderProveedor = suspenderProveedor;
window.reactivarProveedor = reactivarProveedor;
window.desactivarProducto = desactivarProducto;
window.activarProducto = activarProducto;
window.actualizarEstadoCompra = actualizarEstadoCompra;
window.aprobarDevolucion = aprobarDevolucion;
window.rechazarDevolucion = rechazarDevolucion;
window.editarProductoAdmin = editarProductoAdmin;