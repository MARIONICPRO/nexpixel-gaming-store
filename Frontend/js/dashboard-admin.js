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
// TABLA DE USUARIOS
// ============================================
async function cargarTablaUsuarios(search = '') {
    try {
        const url = `${API_URL}/admin/usuarios${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();
        
        if (!data.success || !data.usuarios?.length) {
            document.getElementById('admin-content').innerHTML = '<p class="empty-message">No hay usuarios registrados</p>';
            return;
        }
        
        let html = `
            <div class="search-bar"><input type="text" id="search-usuario" placeholder="🔍 Buscar..." value="${search}" onkeyup="buscarUsuarios()"></div>
            <div class="table-responsive"><table class="tabla-admin"><thead><tr>
                <th>ID</th><th>Nombre</th><th>Email</th><th>Tipo</th><th>Estado</th><th>Verificado</th><th>Registro</th><th>Acciones</th>
            </tr></thead><tbody>
        `;
        
        data.usuarios.forEach(u => {
            const estado = u.estado || 'activo';
            html += `<tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre || '-'}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.tipo_usuario}">${u.tipo_usuario}</span></td>
                <td><span class="badge badge-${estado}">${estado}</span></td>
                <td>${u.verificado ? '✅' : '❌'}</td>
                <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
                <td>
                    ${estado === 'activo' ? `<button class="btn-action btn-warning" onclick="inactivarUsuario(${u.id_usuario})" title="Inactivar">🔒</button>` : `<button class="btn-action btn-success" onclick="activarUsuario(${u.id_usuario})" title="Activar">🔓</button>`}
                    ${u.tipo_usuario !== 'admin' ? `<button class="btn-action btn-primary" onclick="cambiarRolAdmin(${u.id_usuario})" title="Hacer Admin">👑</button>` : ''}
                    <button class="btn-action btn-delete" onclick="eliminarUsuario(${u.id_usuario})" title="Eliminar">🗑️</button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar usuarios</p>';
    }
}

async function buscarUsuarios() {
    const search = document.getElementById('search-usuario')?.value || '';
    await cargarTablaUsuarios(search);
}

// ============================================
// TABLA DE PROVEEDORES
// ============================================
async function cargarTablaProveedores(search = '') {
    try {
        const url = `${API_URL}/admin/proveedores${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();
        
        if (!data.success || !data.proveedores?.length) {
            document.getElementById('admin-content').innerHTML = '<p class="empty-message">No hay proveedores registrados</p>';
            return;
        }
        
        let html = `
            <div class="search-bar"><input type="text" id="search-proveedor" placeholder="🔍 Buscar..." value="${search}" onkeyup="buscarProveedores()"></div>
            <div class="table-responsive"><table class="tabla-admin"><thead><tr>
                <th>Empresa</th><th>Email</th><th>NIT</th><th>Teléfono</th><th>Verificado</th><th>Estado</th><th>Acciones</th>
            </tr></thead><tbody>
        `;
        
        data.proveedores.forEach(p => {
            const estado = p.estado || 'activo';
            html += `<tr>
                <td><strong>${p.empresa || p.nombre || '-'}</strong></td>
                <td>${p.email}</td>
                <td>${p.nit || '-'}</td>
                <td>${p.telefono || '-'}</td>
                <td>${p.verificado ? '✅ Sí' : '❌ No'}</td>
                <td><span class="badge badge-${estado}">${estado}</span></td>
                <td>
                    ${!p.verificado ? `<button class="btn-action btn-edit" onclick="verificarProveedor(${p.id_usuario})" title="Verificar">✓</button>` : '<span class="badge-success">✓</span>'}
                    ${estado === 'activo' ? `<button class="btn-action btn-warning" onclick="inactivarUsuario(${p.id_usuario})" title="Inactivar">🔒</button>` : `<button class="btn-action btn-success" onclick="activarUsuario(${p.id_usuario})" title="Activar">🔓</button>`}
                    <button class="btn-action btn-delete" onclick="eliminarUsuario(${p.id_usuario})" title="Eliminar">🗑️</button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar proveedores</p>';
    }
}

async function buscarProveedores() {
    const search = document.getElementById('search-proveedor')?.value || '';
    await cargarTablaProveedores(search);
}

// ============================================
// TABLA DE PRODUCTOS
// ============================================
async function cargarTablaProductosAdmin(search = '', estado = 'todos') {
    try {
        const url = `${API_URL}/admin/productos?search=${encodeURIComponent(search)}&estado=${estado}`;
        const response = await fetch(url, { headers: API.getHeaders() });
        const data = await response.json();
        
        if (!data.success || !data.productos?.length) {
            document.getElementById('admin-content').innerHTML = '<p class="empty-message">No hay productos registrados</p>';
            return;
        }
        
        let html = `
            <div class="filtros-bar">
                <input type="text" id="search-producto" placeholder="🔍 Buscar..." value="${search}" onkeyup="buscarProductos()">
                <select id="filtro-estado" onchange="buscarProductos()">
                    <option value="todos" ${estado === 'todos' ? 'selected' : ''}>Todos</option>
                    <option value="activo" ${estado === 'activo' ? 'selected' : ''}>Activos</option>
                    <option value="inactivo" ${estado === 'inactivo' ? 'selected' : ''}>Inactivos</option>
                </select>
            </div>
            <div class="table-responsive"><table class="tabla-admin"><thead><tr>
                <th>Producto</th><th>Tipo</th><th>Plataforma</th><th>Proveedor</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
            </tr></thead><tbody>
        `;
        
        data.productos.forEach(p => {
            html += `<tr>
                <td>${p.nombre_producto}</td>
                <td>${p.tipo_producto}</td>
                <td>${p.plataforma?.nombre_plataforma || '-'}</td>
                <td>${p.proveedor?.empresa || p.proveedor?.nombre || 'N/A'}</td>
                <td>$${formatearPrecio(p.precio)}</td>
                <td>${p.stock || 0}</td>
                <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                <td>
                    ${p.estado === 'activo' ? `<button class="btn-action btn-warning" onclick="desactivarProducto(${p.id_producto})" title="Desactivar">🔒</button>` : `<button class="btn-action btn-success" onclick="activarProducto(${p.id_producto})" title="Activar">🔓</button>`}
                    <button class="btn-action btn-edit" onclick="editarProductoAdmin(${p.id_producto})" title="Editar">✏️</button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar productos</p>';
    }
}

async function buscarProductos() {
    const search = document.getElementById('search-producto')?.value || '';
    const estado = document.getElementById('filtro-estado')?.value || 'todos';
    await cargarTablaProductosAdmin(search, estado);
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
        
        let html = `<div class="table-responsive"><table class="tabla-admin"><thead><tr>
            <th>ID</th><th>Fecha</th><th>Usuario</th><th>Total</th><th>Estado</th><th>Método</th><th>Acciones</th>
        </tr></thead><tbody>`;
        
        data.ventas.forEach(v => {
            html += `<tr>
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
            </tr>`;
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
        
        let html = `<div class="table-responsive"><table class="tabla-admin"><thead><tr>
            <th>ID</th><th>Fecha</th><th>Usuario</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acciones</th>
        </tr></thead><tbody>`;
        
        data.devoluciones.forEach(d => {
            html += `<tr>
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
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-content').innerHTML = '<p class="error-message">Error al cargar devoluciones</p>';
    }
}

// ============================================
// ACCIONES
// ============================================
async function inactivarUsuario(id) {
    if (!confirm('¿Inactivar este usuario?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/inactivar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Usuario inactivado');
            currentTab === 'usuarios' ? cargarTablaUsuarios() : cargarTablaProveedores();
        }
    } catch (error) { console.error(error); }
}

async function activarUsuario(id) {
    if (!confirm('¿Activar este usuario?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/activar`, { method: 'PUT', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Usuario activado');
            currentTab === 'usuarios' ? cargarTablaUsuarios() : cargarTablaProveedores();
        }
    } catch (error) { console.error(error); }
}

async function eliminarUsuario(id) {
    if (!confirm('⚠️ ¿Eliminar permanentemente este usuario?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}`, { method: 'DELETE', headers: API.getHeaders() });
        const data = await res.json();
        if (data.success) {
            mostrarNotificacion('✅ Usuario eliminado');
            currentTab === 'usuarios' ? cargarTablaUsuarios() : cargarTablaProveedores();
        }
    } catch (error) { console.error(error); }
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

function editarProductoAdmin(id) {
    mostrarNotificacion('✏️ Edición - Próximamente', 'info');
}

// Exponer funciones globales
window.cargarDashboardAdmin = cargarDashboardAdmin;
window.cambiarTabAdmin = cambiarTabAdmin;
window.buscarUsuarios = buscarUsuarios;
window.buscarProveedores = buscarProveedores;
window.buscarProductos = buscarProductos;
window.inactivarUsuario = inactivarUsuario;
window.activarUsuario = activarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.cambiarRolAdmin = cambiarRolAdmin;
window.verificarProveedor = verificarProveedor;
window.desactivarProducto = desactivarProducto;
window.activarProducto = activarProducto;
window.actualizarEstadoCompra = actualizarEstadoCompra;
window.aprobarDevolucion = aprobarDevolucion;
window.rechazarDevolucion = rechazarDevolucion;
window.editarProductoAdmin = editarProductoAdmin;