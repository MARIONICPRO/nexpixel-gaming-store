// ============================================
// DASHBOARD-PROVE.JS - CON SUBIDA DE IMÁGENES
// ============================================

let proveedorActual = null;

// ===== CARGA INICIAL DEL DASHBOARD =====
async function cargarDashboardProveedor() {
    console.log('Cargando dashboard proveedor...');
    proveedorActual = Auth.usuarioActual;

    if (!proveedorActual || proveedorActual.tipo_usuario !== 'proveedor') {
        window.location.href = 'index.html';
        return;
    }

    await cargarStatsProveedor();
    cambiarTabProveedor('productos');
}

// ===== ESTADÍSTICAS =====
async function cargarStatsProveedor() {
    try {
        const response = await fetch(`${API_URL}/proveedor/stats`, {
            headers: API.getHeaders()
        });
        const data = await response.json();

        document.getElementById('stats-proveedor').innerHTML = `
            <div class="stat-card">
                <h4>Mis productos</h4>
                <div class="stat-number">${data.stats?.totalProductos || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Códigos disponibles</h4>
                <div class="stat-number">${data.stats?.totalCodigosDisponibles || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Ventas totales</h4>
                <div class="stat-number">${data.stats?.totalVentas || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Ingresos</h4>
                <div class="stat-number">$${formatearPrecio(data.stats?.ingresosTotales || 0)}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando stats:', error);
        document.getElementById('stats-proveedor').innerHTML = `
            <div class="stat-card"><h4>Mis productos</h4><div class="stat-number">0</div></div>
        `;
    }
}

// ===== CAMBIAR ENTRE PESTAÑAS =====
function cambiarTabProveedor(tab) {
    console.log('Cambiando a pestaña:', tab);
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        if (btn.textContent.includes(
            tab === 'nuevo' ? 'Añadir' :
                tab === 'codigos' ? 'Cargar' :
                    tab === 'ventas' ? 'Mis ventas' : 'Mis productos'
        )) {
            btn.classList.add('active');
        }
    });

    if (tab === 'productos') cargarMisProductos();
    else if (tab === 'nuevo') cargarFormularioNuevoProducto();
    else if (tab === 'codigos') cargarFormularioCodigos();
    else if (tab === 'ventas') cargarMisVentas();
}

// ===== CARGAR PRODUCTOS DEL PROVEEDOR =====
async function cargarMisProductos() {
    try {
        const response = await fetch(`${API_URL}/proveedor/productos`, {
            headers: API.getHeaders()
        });
        const data = await response.json();
        const productos = data.productos || [];
        
        const container = document.getElementById('proveedor-content');

        if (productos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p>No tienes productos aún</p>
                    <button class="btn-nuevo" onclick="cambiarTabProveedor('nuevo')"><i class="fa-solid fa-plus"></i> Añadir producto</button>
                </div>
            `;
            return;
        }

        let html = '<div class="productos-proveedor">';

        for (const p of productos) {
            html += `
                <div class="producto-proveedor-card">
                    <img src="${p.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${p.nombre_producto}" 
                         class="producto-proveedor-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-proveedor-info">
                        <h3>${escapeHtml(p.nombre_producto)}</h3>
                        <p class="producto-proveedor-precio">$${formatearPrecio(p.precio)}</p>
                        <p class="producto-proveedor-stock">Códigos: ${p.codigos_disponibles || 0} disponibles</p>
                        <p class="producto-proveedor-tipo">Tipo: ${p.tipo_producto}</p>
                        <p class="producto-proveedor-ventas">Vendidos: ${p.ventas_totales || 0}</p>
                        <div class="producto-acciones">
                            <button class="btn-editar" onclick="editarProducto(${p.id_producto})">✏️ Editar</button>
                            <button class="btn-eliminar" onclick="eliminarProducto(${p.id_producto})">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('proveedor-content').innerHTML = '<p>Error al cargar productos</p>';
    }
}

// ===== FORMULARIO PARA NUEVO PRODUCTO (CON SUBIDA DE IMAGEN) =====
function cargarFormularioNuevoProducto() {
    document.getElementById('proveedor-content').innerHTML = `
        <h2 style="color: #4d8cff; margin-bottom: 2rem;">➕ Añadir nuevo producto</h2>
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p>Cargando plataformas...</p>
        </div>
    `;

    cargarPlataformasYMostrarFormulario();
}

async function cargarPlataformasYMostrarFormulario() {
    try {
        const response = await fetch(`${API_URL}/proveedor/plataformas`, {
            headers: API.getHeaders()
        });
        const data = await response.json();
        const plataformas = data.plataformas || [];

        let options = '<option value="">Seleccionar plataforma</option>';
        plataformas.forEach(p => {
            options += `<option value="${p.id_plataforma}">${escapeHtml(p.nombre_plataforma)}</option>`;
        });

        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">➕ Añadir nuevo producto</h2>
            <form id="form-nuevo-producto" onsubmit="return guardarNuevoProducto(event)" class="form-producto" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de producto</label>
                        <select id="producto-tipo" required onchange="toggleCamposProducto()">
                            <option value="Juego">Videojuego</option>
                            <option value="Tarjeta regalo">Tarjeta de regalo</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Plataforma</label>
                        <select id="producto-plataforma" required>
                            ${options}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Nombre del producto</label>
                    <input type="text" id="producto-nombre" required placeholder="Ej: God of War Ragnarök">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Precio (COP)</label>
                        <input type="number" id="producto-precio" required min="0" step="1000" placeholder="199900">
                    </div>
                    
                    <div class="form-group">
                        <label>Stock (cantidad de códigos)</label>
                        <input type="number" id="producto-stock" min="0" value="0" placeholder="50">
                    </div>
                </div>
                
                <!-- Campos específicos para JUEGOS -->
                <div id="campos-juego">
                    <h3 style="color: #4d8cff; margin: 1.5rem 0 1rem;">Información del juego</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Género</label>
                            <input type="text" id="juego-genero" placeholder="Ej: Acción, Aventura">
                        </div>
                        
                        <div class="form-group">
                            <label>Edición</label>
                            <input type="text" id="juego-edicion" placeholder="Ej: Estándar, Deluxe">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Desarrollador</label>
                            <input type="text" id="juego-desarrollador" placeholder="Ej: Santa Monica Studio">
                        </div>
                        
                        <div class="form-group">
                            <label>Fecha de lanzamiento</label>
                            <input type="date" id="juego-lanzamiento">
                        </div>
                    </div>
                </div>
                
                <!-- Campos específicos para TARJETAS -->
                <div id="campos-tarjeta" style="display:none;">
                    <h3 style="color: #4d8cff; margin: 1.5rem 0 1rem;">Información de la tarjeta</h3>
                    <div class="form-group">
                        <label>Valor de la tarjeta</label>
                        <input type="number" id="tarjeta-valor" min="0" step="1000" placeholder="50000">
                    </div>
                </div>
                
                <!-- SUBIDA DE IMAGEN (reemplaza URL) -->
                <div class="form-group">
                    <label>Foto del producto</label>
                    <div class="foto-upload-modal" onclick="document.getElementById('producto-foto-input').click()">
                        📷 Seleccionar imagen
                    </div>
                    <input type="file" id="producto-foto-input" name="imagen" accept="image/*" style="display:none;" onchange="previewFotoProductoNuevo(event)">
                    <img id="foto-producto-preview-nuevo" class="foto-preview-modal" style="display:none; max-width: 200px; margin-top: 10px;">
                    <small style="color: #aaccff;">Formatos: JPG, PNG, GIF (máx 5MB)</small>
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="producto-descripcion" rows="4" placeholder="Descripción detallada del producto..."></textarea>
                </div>
                
                <button type="submit" class="btn-nuevo" style="width: 100%; padding: 1.2rem;">Guardar producto</button>
            </form>
        `;
    } catch (error) {
        console.error('Error cargando plataformas:', error);
        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">➕ Añadir nuevo producto</h2>
            <p style="color: #ff6b8b; text-align: center;">Error al cargar plataformas. Intenta de nuevo.</p>
            <button class="btn-nuevo" onclick="cargarFormularioNuevoProducto()" style="margin-top: 1rem;">Reintentar</button>
        `;
    }
}

// Previsualizar foto para nuevo producto
function previewFotoProductoNuevo(event) {
    const preview = document.getElementById('foto-producto-preview-nuevo');
    const file = event.target.files[0];
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Previsualizar foto para edición de producto
function previewFotoProductoEdit(event) {
    const preview = document.getElementById('foto-producto-preview-edit');
    const file = event.target.files[0];
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function toggleCamposProducto() {
    const tipo = document.getElementById('producto-tipo').value;
    document.getElementById('campos-juego').style.display = tipo === 'Juego' ? 'block' : 'none';
    document.getElementById('campos-tarjeta').style.display = tipo === 'Tarjeta regalo' ? 'block' : 'none';
}

// ===== GUARDAR NUEVO PRODUCTO (CON FormData) =====
async function guardarNuevoProducto(event) {
    event.preventDefault();

    try {
        const tipoProducto = document.getElementById('producto-tipo').value;
        const plataformaId = parseInt(document.getElementById('producto-plataforma').value);

        if (!plataformaId) {
            mostrarNotificacion('❌ Debes seleccionar una plataforma', 'error');
            return false;
        }

        // Usar FormData para incluir la imagen
        const formData = new FormData();
        formData.append('id_categoria', tipoProducto === 'Juego' ? 1 : 2);
        formData.append('id_plataforma', plataformaId);
        formData.append('nombre_producto', document.getElementById('producto-nombre').value);
        formData.append('precio', parseFloat(document.getElementById('producto-precio').value));
        formData.append('tipo_producto', tipoProducto);
        formData.append('stock', parseInt(document.getElementById('producto-stock').value) || 0);
        formData.append('descripcion', document.getElementById('producto-descripcion')?.value || '');

        // Agregar imagen si existe
        const fotoInput = document.getElementById('producto-foto-input');
        if (fotoInput && fotoInput.files.length > 0) {
            formData.append('imagen', fotoInput.files[0]);
        }

        if (tipoProducto === 'Juego') {
            formData.append('genero', document.getElementById('juego-genero')?.value || '');
            formData.append('edicion', document.getElementById('juego-edicion')?.value || '');
            formData.append('desarrollador', document.getElementById('juego-desarrollador')?.value || '');
            formData.append('fecha_lanzamiento', document.getElementById('juego-lanzamiento')?.value || '');
        } else if (tipoProducto === 'Tarjeta regalo') {
            formData.append('valor_tarjeta', parseFloat(document.getElementById('tarjeta-valor')?.value) || 0);
        }

        const token = localStorage.getItem('nexpixel_token');
        const response = await fetch(`${API_URL}/proveedor/productos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('✅ Producto guardado correctamente');
            cambiarTabProveedor('productos');
        } else {
            mostrarNotificacion(data.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarNotificacion('Error al guardar el producto', 'error');
    }

    return false;
}

// ===== CARGAR CÓDIGOS =====
function cargarFormularioCodigos() {
    document.getElementById('proveedor-content').innerHTML = `
        <h2 style="color: #4d8cff; margin-bottom: 2rem;">🔑 Cargar códigos digitales</h2>
        <form onsubmit="return guardarCodigos(event)" class="form-producto">
            <div class="form-group">
                <label>Seleccionar producto</label>
                <select id="codigo-producto" required>
                    <option value="">Cargando productos...</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Códigos (uno por línea)</label>
                <textarea id="codigos-lista" rows="10" required placeholder="XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY&#10;ZZZZZ-ZZZZZ-ZZZZZ"></textarea>
            </div>
            
            <button type="submit" class="btn-nuevo">Cargar códigos</button>
        </form>
    `;

    cargarSelectProductos();
}

async function cargarSelectProductos() {
    try {
        const response = await fetch(`${API_URL}/proveedor/productos`, {
            headers: API.getHeaders()
        });
        const data = await response.json();
        const productos = data.productos || [];
        
        const select = document.getElementById('codigo-producto');

        if (productos.length === 0) {
            select.innerHTML = '<option value="">No tienes productos</option>';
            return;
        }

        let options = '<option value="">Seleccionar producto</option>';
        productos.forEach(p => {
            options += `<option value="${p.id_producto}">${escapeHtml(p.nombre_producto)}</option>`;
        });
        select.innerHTML = options;
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

async function guardarCodigos(event) {
    event.preventDefault();

    const productoId = document.getElementById('codigo-producto').value;
    const codigosTexto = document.getElementById('codigos-lista').value;
    const codigos = codigosTexto.split('\n').filter(c => c.trim());

    try {
        const response = await fetch(`${API_URL}/proveedor/productos/${productoId}/codigos`, {
            method: 'POST',
            headers: API.getHeaders(),
            body: JSON.stringify({ codigos })
        });
        
        const data = await response.json();

        if (data.success) {
            mostrarNotificacion(`✅ ${data.message || 'Códigos cargados'}`);
            document.getElementById('codigos-lista').value = '';
        } else {
            mostrarNotificacion(data.error || 'Error al cargar', 'error');
        }
    } catch (error) {
        console.error('Error guardando códigos:', error);
        mostrarNotificacion('Error al cargar códigos', 'error');
    }

    return false;
}

// ===== VENTAS =====
async function cargarMisVentas() {
    try {
        const response = await fetch(`${API_URL}/proveedor/ventas`, {
            headers: API.getHeaders()
        });
        const data = await response.json();
        
        const container = document.getElementById('proveedor-content');

        if (!data.ventas || data.ventas.length === 0) {
            container.innerHTML = '<p style="text-align: center;">No hay ventas aún</p>';
            return;
        }

        let html = '<h3>Mis ventas</h3>';
        html += '<p>Total ingresos: <strong>$' + formatearPrecio(data.totalIngresos || 0) + '</strong></p>';
        html += '<table class="tabla-ventas"><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Total</th></tr>';
        
        data.ventas.forEach(v => {
            html += `
                <tr>
                    <td>${new Date(v.fecha).toLocaleDateString()}</td>
                    <td>${escapeHtml(v.producto)}</td>
                    <td>${v.cantidad}</td>
                    <td>$${formatearPrecio(v.subtotal)}</td>
                </tr>
            `;
        });
        html += '</table>';
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando ventas:', error);
        document.getElementById('proveedor-content').innerHTML = '<p>Error al cargar ventas</p>';
    }
}

// ===== ELIMINAR PRODUCTO =====
async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/proveedor/productos/${id}`, {
            method: 'DELETE',
            headers: API.getHeaders()
        });
        
        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('Producto eliminado');
            cargarMisProductos();
        } else {
            mostrarNotificacion(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

// ===== EDITAR PRODUCTO (CON SUBIDA DE IMAGEN) =====
async function editarProducto(id) {
    console.log('✏️ Editando producto:', id);

    try {
        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">✏️ Editando producto</h2>
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner"></div>
                <p>Cargando datos del producto...</p>
            </div>
        `;

        const response = await fetch(`${API_URL}/proveedor/productos/${id}`, {
            headers: API.getHeaders()
        });
        const data = await response.json();
        const producto = data.producto;

        if (!producto) {
            mostrarNotificacion('Producto no encontrado', 'error');
            return;
        }

        const platResponse = await fetch(`${API_URL}/proveedor/plataformas`, {
            headers: API.getHeaders()
        });
        const platData = await platResponse.json();
        const plataformas = platData.plataformas || [];

        let plataformaOptions = '<option value="">Seleccionar plataforma</option>';
        plataformas.forEach(p => {
            const selected = producto.id_plataforma === p.id_plataforma ? 'selected' : '';
            plataformaOptions += `<option value="${p.id_plataforma}" ${selected}>${escapeHtml(p.nombre_plataforma)}</option>`;
        });

        const container = document.getElementById('proveedor-content');
        container.innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">✏️ Editar producto</h2>
            <form id="form-editar-producto" onsubmit="return guardarEdicionProducto(event, ${id})" class="form-producto" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de producto</label>
                        <select id="edit-producto-tipo" required onchange="toggleEditCamposProducto()">
                            <option value="Juego" ${producto.tipo_producto === 'Juego' ? 'selected' : ''}>Videojuego</option>
                            <option value="Tarjeta regalo" ${producto.tipo_producto === 'Tarjeta regalo' ? 'selected' : ''}>Tarjeta de regalo</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Plataforma</label>
                        <select id="edit-producto-plataforma" required>
                            ${plataformaOptions}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Nombre del producto</label>
                    <input type="text" id="edit-producto-nombre" required value="${escapeHtml(producto.nombre_producto)}">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Precio (COP)</label>
                        <input type="number" id="edit-producto-precio" required min="0" step="1000" value="${producto.precio}">
                    </div>
                    
                    <div class="form-group">
                        <label>Stock (códigos)</label>
                        <input type="number" id="edit-producto-stock" min="0" value="${producto.stock || 0}">
                    </div>
                </div>
                
                <!-- Campos específicos para JUEGOS -->
                <div id="edit-campos-juego" style="display: ${producto.tipo_producto === 'Juego' ? 'block' : 'none'};">
                    <h3 style="color: #4d8cff; margin: 1.5rem 0 1rem;">Información del juego</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Género</label>
                            <input type="text" id="edit-juego-genero" value="${escapeHtml(producto.genero || '')}">
                        </div>
                        
                        <div class="form-group">
                            <label>Edición</label>
                            <input type="text" id="edit-juego-edicion" value="${escapeHtml(producto.edicion || '')}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Desarrollador</label>
                            <input type="text" id="edit-juego-desarrollador" value="${escapeHtml(producto.desarrollador || '')}">
                        </div>
                        
                        <div class="form-group">
                            <label>Fecha de lanzamiento</label>
                            <input type="date" id="edit-juego-lanzamiento" value="${producto.fecha_lanzamiento || ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Campos específicos para TARJETAS -->
                <div id="edit-campos-tarjeta" style="display: ${producto.tipo_producto === 'Tarjeta regalo' ? 'block' : 'none'};">
                    <h3 style="color: #4d8cff; margin: 1.5rem 0 1rem;">Información de la tarjeta</h3>
                    <div class="form-group">
                        <label>Valor de la tarjeta</label>
                        <input type="number" id="edit-tarjeta-valor" min="0" step="1000" value="${producto.valor_tarjeta || producto.precio}">
                    </div>
                </div>
                
                <!-- SUBIDA DE IMAGEN -->
                <div class="form-group">
                    <label>Foto actual</label>
                    <img src="${producto.imagen_url || 'assets/img/default-game.jpg'}" style="max-width: 150px; border-radius: 10px;" onerror="this.src='assets/img/default-game.jpg'">
                </div>
                
                <div class="form-group">
                    <label>Cambiar foto</label>
                    <div class="foto-upload-modal" onclick="document.getElementById('edit-producto-foto-input').click()">
                        📷 Seleccionar nueva imagen
                    </div>
                    <input type="file" id="edit-producto-foto-input" name="imagen" accept="image/*" style="display:none;" onchange="previewFotoProductoEdit(event)">
                    <img id="foto-producto-preview-edit" class="foto-preview-modal" style="display:none; max-width: 200px; margin-top: 10px;">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="edit-producto-descripcion" rows="4">${escapeHtml(producto.descripcion || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" class="btn-nuevo" style="flex: 1;">💾 Guardar cambios</button>
                    <button type="button" class="btn-eliminar" onclick="cambiarTabProveedor('productos')" style="flex: 0.3;">↩️ Cancelar</button>
                </div>
            </form>
        `;
    } catch (error) {
        console.error('Error cargando producto:', error);
        mostrarNotificacion('Error al cargar el producto', 'error');
    }
}

function toggleEditCamposProducto() {
    const tipo = document.getElementById('edit-producto-tipo').value;
    document.getElementById('edit-campos-juego').style.display = tipo === 'Juego' ? 'block' : 'none';
    document.getElementById('edit-campos-tarjeta').style.display = tipo === 'Tarjeta regalo' ? 'block' : 'none';
}

// ===== GUARDAR EDICIÓN DE PRODUCTO (CON FormData) =====
async function guardarEdicionProducto(event, productoId) {
    event.preventDefault();

    try {
        const tipoProducto = document.getElementById('edit-producto-tipo').value;
        const plataformaId = parseInt(document.getElementById('edit-producto-plataforma').value);

        if (!plataformaId) {
            mostrarNotificacion('❌ Debes seleccionar una plataforma', 'error');
            return false;
        }

        const formData = new FormData();
        formData.append('id_categoria', tipoProducto === 'Juego' ? 1 : 2);
        formData.append('id_plataforma', plataformaId);
        formData.append('nombre_producto', document.getElementById('edit-producto-nombre').value);
        formData.append('precio', parseFloat(document.getElementById('edit-producto-precio').value));
        formData.append('tipo_producto', tipoProducto);
        formData.append('stock', parseInt(document.getElementById('edit-producto-stock').value) || 0);
        formData.append('descripcion', document.getElementById('edit-producto-descripcion')?.value || '');
        formData.append('genero', document.getElementById('edit-juego-genero')?.value || '');
        formData.append('edicion', document.getElementById('edit-juego-edicion')?.value || '');
        formData.append('desarrollador', document.getElementById('edit-juego-desarrollador')?.value || '');
        formData.append('fecha_lanzamiento', document.getElementById('edit-juego-lanzamiento')?.value || '');
        formData.append('valor_tarjeta', parseFloat(document.getElementById('edit-tarjeta-valor')?.value) || 0);

        // Agregar nueva imagen si existe
        const fotoInput = document.getElementById('edit-producto-foto-input');
        if (fotoInput && fotoInput.files.length > 0) {
            formData.append('imagen', fotoInput.files[0]);
        }

        const token = localStorage.getItem('nexpixel_token');
        const response = await fetch(`${API_URL}/proveedor/productos/${productoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('✅ Producto actualizado correctamente');
            cambiarTabProveedor('productos');
        } else {
            mostrarNotificacion(data.error || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error actualizando producto:', error);
        mostrarNotificacion('Error al actualizar el producto', 'error');
    }

    return false;
}

// ===== FUNCIÓN PARA ESCAPAR HTML =====
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== UTILIDADES =====
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

// ===== EXPONER FUNCIONES GLOBALMENTE =====
window.cargarDashboardProveedor = cargarDashboardProveedor;
window.cambiarTabProveedor = cambiarTabProveedor;
window.guardarNuevoProducto = guardarNuevoProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.cargarFormularioCodigos = cargarFormularioCodigos;
window.toggleCamposProducto = toggleCamposProducto;
window.toggleEditCamposProducto = toggleEditCamposProducto;
window.previewFotoProductoNuevo = previewFotoProductoNuevo;
window.previewFotoProductoEdit = previewFotoProductoEdit;