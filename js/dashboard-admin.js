// ============================================
// DASHBOARD-ADMIN.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

async function cargarDashboardAdmin() {
    if (!Auth.usuarioActual || Auth.usuarioActual.tipo_usuario !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    await cargarStatsAdmin();
    cambiarTabAdmin('usuarios');
}

async function cargarStatsAdmin() {
    try {
        // Obtener estadísticas del backend
        const response = await fetch(`${API_URL}/admin/stats`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stats-admin').innerHTML = `
                <div class="stat-card">
                    <h4>Usuarios</h4>
                    <div class="stat-number">${data.stats.totalUsuarios || 0}</div>
                </div>
                <div class="stat-card">
                    <h4>Productos</h4>
                    <div class="stat-number">${data.stats.totalProductos || 0}</div>
                </div>
                <div class="stat-card">
                    <h4>Proveedores</h4>
                    <div class="stat-number">${data.stats.totalProveedores || 0}</div>
                </div>
                <div class="stat-card">
                    <h4>Ventas hoy</h4>
                    <div class="stat-number">${data.stats.ventasHoy || 0}</div>
                </div>
                <div class="stat-card">
                    <h4>Ingresos hoy</h4>
                    <div class="stat-number">$${formatearPrecio(data.stats.ingresosHoy || 0)}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        document.getElementById('stats-admin').innerHTML = `
            <div class="stat-card"><h4>Error</h4><div class="stat-number">0</div></div>
        `;
    }
}

function cambiarTabAdmin(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    
    if (tab === 'usuarios') cargarTablaUsuarios();
    else if (tab === 'proveedores') cargarTablaProveedores();
    else if (tab === 'productos') cargarTablaProductosAdmin();
    else if (tab === 'ventas') cargarTablaVentas();
    else if (tab === 'devoluciones') cargarTablaDevoluciones();
}

async function cargarTablaUsuarios() {
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success || !data.usuarios?.length) {
            document.getElementById('admin-content').innerHTML = '<p>No hay usuarios registrados</p>';
            return;
        }

        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Verificado</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.usuarios.forEach(u => {
            html += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.tipo_usuario}">${u.tipo_usuario}</span></td>
                    <td>${u.verificado ? '✅ Sí' : '❌ No'}</td>
                    <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editarUsuario(${u.id_usuario})">✏️</button>
                        <button class="btn-action btn-delete" onclick="eliminarUsuario(${u.id_usuario})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        document.getElementById('admin-content').innerHTML = '<p>Error al cargar usuarios</p>';
    }
}

async function cargarTablaProveedores() {
    try {
        const response = await fetch(`${API_URL}/admin/proveedores`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success || !data.proveedores?.length) {
            document.getElementById('admin-content').innerHTML = '<p>No hay proveedores registrados</p>';
            return;
        }

        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Email</th>
                        <th>NIT</th>
                        <th>Teléfono</th>
                        <th>Verificado</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.proveedores.forEach(p => {
            html += `
                <tr>
                    <td><strong>${p.empresa || p.nombre}</strong></td>
                    <td>${p.email}</td>
                    <td>${p.nit || '-'}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.verificado ? '✅ Sí' : '❌ No'}</td>
                    <td>${new Date(p.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        ${!p.verificado ? 
                            `<button class="btn-action btn-edit" onclick="verificarProveedor(${p.id_usuario})">✓ Verificar</button>` : 
                            '<span class="badge badge-success">Verificado</span>'
                        }
                        <button class="btn-action btn-delete" onclick="eliminarUsuario(${p.id_usuario})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error cargando proveedores:', error);
        document.getElementById('admin-content').innerHTML = '<p>Error al cargar proveedores</p>';
    }
}

async function cargarTablaProductosAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/productos`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success || !data.productos?.length) {
            document.getElementById('admin-content').innerHTML = '<p>No hay productos registrados</p>';
            return;
        }

        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Plataforma</th>
                        <th>Proveedor</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Ventas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
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
                    <td>${p.ventas_totales || 0}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editarProductoAdmin(${p.id_producto})">✏️</button>
                        <button class="btn-action btn-delete" onclick="desactivarProducto(${p.id_producto})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('admin-content').innerHTML = '<p>Error al cargar productos</p>';
    }
}

async function cargarTablaVentas() {
    try {
        const response = await fetch(`${API_URL}/admin/ventas`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success || !data.ventas?.length) {
            document.getElementById('admin-content').innerHTML = '<p>No hay ventas registradas</p>';
            return;
        }

        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>ID Compra</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Método Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
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
        
        html += '</tbody></table>';
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error cargando ventas:', error);
        document.getElementById('admin-content').innerHTML = '<p>Error al cargar ventas</p>';
    }
}

async function cargarTablaDevoluciones() {
    try {
        const response = await fetch(`${API_URL}/admin/devoluciones`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success || !data.devoluciones?.length) {
            document.getElementById('admin-content').innerHTML = '<p>No hay devoluciones solicitadas</p>';
            return;
        }

        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Motivo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.devoluciones.forEach(d => {
            html += `
                <tr>
                    <td>#${d.id_devolucion}</td>
                    <td>${new Date(d.fecha_solicitud).toLocaleDateString()}</td>
                    <td>${d.usuario?.email || 'N/A'}</td>
                    <td>${d.motivo}</td>
                    <td>$${formatearPrecio(d.monto)}</td>
                    <td><span class="badge badge-${d.estado}">${d.estado}</span></td>
                    <td>
                        ${d.estado === 'pendiente' ? `
                            <button class="btn-action btn-edit" onclick="aprobarDevolucion(${d.id_devolucion})">✓ Aprobar</button>
                            <button class="btn-action btn-delete" onclick="rechazarDevolucion(${d.id_devolucion})">✗ Rechazar</button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        document.getElementById('admin-content').innerHTML = html;
    } catch (error) {
        console.error('Error cargando devoluciones:', error);
        document.getElementById('admin-content').innerHTML = '<p>Error al cargar devoluciones</p>';
    }
}

// ===== FUNCIONES AUXILIARES =====

async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
            method: 'DELETE',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Usuario eliminado');
            cargarTablaUsuarios();
        } else {
            mostrarNotificacion(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

async function verificarProveedor(id) {
    try {
        const response = await fetch(`${API_URL}/admin/proveedores/${id}/verificar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Proveedor verificado');
            cargarTablaProveedores();
        } else {
            mostrarNotificacion(data.error || 'Error al verificar', 'error');
        }
    } catch (error) {
        console.error('Error verificando proveedor:', error);
        mostrarNotificacion('Error al verificar', 'error');
    }
}

async function desactivarProducto(id) {
    if (!confirm('¿Estás seguro de desactivar este producto?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/productos/${id}/desactivar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Producto desactivado');
            cargarTablaProductosAdmin();
        } else {
            mostrarNotificacion(data.error || 'Error al desactivar', 'error');
        }
    } catch (error) {
        console.error('Error desactivando producto:', error);
        mostrarNotificacion('Error al desactivar', 'error');
    }
}

async function actualizarEstadoCompra(compraId, estado) {
    try {
        const response = await fetch(`${API_URL}/admin/compras/${compraId}/estado`, {
            method: 'PUT',
            headers: API.getHeaders(),
            body: JSON.stringify({ estado })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Estado actualizado');
        } else {
            mostrarNotificacion(data.error || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
        mostrarNotificacion('Error al actualizar', 'error');
    }
}

async function aprobarDevolucion(id) {
    try {
        const response = await fetch(`${API_URL}/admin/devoluciones/${id}/aprobar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Devolución aprobada');
            cargarTablaDevoluciones();
        } else {
            mostrarNotificacion(data.error || 'Error al aprobar', 'error');
        }
    } catch (error) {
        console.error('Error aprobando devolución:', error);
        mostrarNotificacion('Error al aprobar', 'error');
    }
}

async function rechazarDevolucion(id) {
    try {
        const response = await fetch(`${API_URL}/admin/devoluciones/${id}/rechazar`, {
            method: 'PUT',
            headers: API.getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Devolución rechazada');
            cargarTablaDevoluciones();
        } else {
            mostrarNotificacion(data.error || 'Error al rechazar', 'error');
        }
    } catch (error) {
        console.error('Error rechazando devolución:', error);
        mostrarNotificacion('Error al rechazar', 'error');
    }
}

// Funciones placeholder (se implementarán después)
function editarUsuario(id) {
    alert('Función de edición de usuario - Próximamente');
}

function editarProductoAdmin(id) {
    alert('Función de edición de producto - Próximamente');
}