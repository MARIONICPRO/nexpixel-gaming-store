let proveedorActual = null;

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

async function cargarStatsProveedor() {
    try {
        const productos = await ProductoDB.getAll({ proveedor: proveedorActual.id_usuario });

        document.getElementById('stats-proveedor').innerHTML = `
            <div class="stat-card">
                <h4>Mis productos</h4>
                <div class="stat-number">${productos?.length || 0}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando stats:', error);
        document.getElementById('stats-proveedor').innerHTML = `
            <div class="stat-card">
                <h4>Mis productos</h4>
                <div class="stat-number">0</div>
            </div>
        `;
    }
}

// ===== FUNCIÓN CORREGIDA - ya no usa event =====
function cambiarTabProveedor(tab) {
    // Remover clase active de todos los tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Activar el tab correspondiente según el texto
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

    // Navegar a la pestaña correspondiente
    if (tab === 'productos') cargarMisProductos();
    else if (tab === 'nuevo') cargarFormularioNuevoProducto();
    else if (tab === 'codigos') cargarFormularioCodigos();
    else if (tab === 'ventas') cargarMisVentas();
}

async function cargarMisProductos() {
    try {
        const productos = await ProductoDB.getAll({ proveedor: proveedorActual.id_usuario });
        const container = document.getElementById('proveedor-content');

        if (!productos?.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p>No tienes productos aún</p>
                    <button class="btn-nuevo" onclick="cambiarTabProveedor('nuevo')">➕ Añadir producto</button>
                </div>
            `;
            return;
        }

        let html = '<div class="productos-proveedor">';

        for (const p of productos) {
            // Obtener códigos disponibles
            let codigosDisponibles = 0;
            try {
                codigosDisponibles = await InventarioDB.contarDisponibles(p.id_producto) || 0;
            } catch (error) {
                console.error('Error obteniendo códigos:', error);
            }

            html += `
                <div class="producto-proveedor-card">
                    <img src="${p.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${p.nombre_producto}" 
                         class="producto-proveedor-img"
                         onerror="this.src='assets/img/default-game.jpg'">
                    <div class="producto-proveedor-info">
                        <h3>${p.nombre_producto}</h3>
                        <p class="producto-proveedor-precio">$${formatearPrecio(p.precio)}</p>
                        <p class="producto-proveedor-stock">Códigos: ${codigosDisponibles} disponibles</p>
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

function cargarFormularioNuevoProducto() {
    // Primero mostrar un loading
    document.getElementById('proveedor-content').innerHTML = `
        <h2 style="color: #4d8cff; margin-bottom: 2rem;">➕ Añadir nuevo producto</h2>
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p>Cargando plataformas...</p>
        </div>
    `;

    // Cargar plataformas de la base de datos
    cargarPlataformasYMostrarFormulario();
}

// ===== NUEVA FUNCIÓN - Agrégala DESPUÉS de la anterior =====
async function cargarPlataformasYMostrarFormulario() {
    try {
        // Obtener plataformas de la base de datos
        const plataformas = await PlataformaDB.getAll();

        // Generar opciones del select
        let options = '<option value="">Seleccionar plataforma</option>';
        plataformas.forEach(p => {
            options += `<option value="${p.id_plataforma}">${p.nombre_plataforma}</option>`;
        });

        // Mostrar el formulario completo con las plataformas cargadas
        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">➕ Añadir nuevo producto</h2>
            <form onsubmit="return guardarNuevoProducto(event)" class="form-producto">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de producto</label>
                        <select id="producto-tipo" required onchange="toggleCamposProducto()">
                            <option value="Juego">Videojuego</option>
                            <option value="Tarjeta regalo">Tarjeta de regalo</option>
                            <option value="Suscripcion">Suscripción</option>
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
                
                <div class="form-group">
                    <label>URL de la imagen</label>
                    <input type="url" id="producto-imagen" placeholder="https://ejemplo.com/imagen.jpg">
                    <small style="color: #aaccff;">Deja en blanco para usar imagen por defecto</small>
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

function toggleCamposProducto() {
    const tipo = document.getElementById('producto-tipo').value;
    document.getElementById('campos-juego').style.display = tipo === 'Juego' ? 'block' : 'none';
    document.getElementById('campos-tarjeta').style.display = tipo === 'Tarjeta regalo' ? 'block' : 'none';
}

async function guardarNuevoProducto(event) {
    event.preventDefault();

    try {
        const producto = {
            id_proveedor: proveedorActual.id_usuario,
            id_categoria: document.getElementById('producto-tipo').value === 'Juego' ? 1 : 2,
            id_plataforma: parseInt(document.getElementById('producto-plataforma').value),
            nombre_producto: document.getElementById('producto-nombre').value,
            precio: parseFloat(document.getElementById('producto-precio').value),
            tipo_producto: document.getElementById('producto-tipo').value,
            stock: parseInt(document.getElementById('producto-stock').value) || 0,
            descripcion: document.getElementById('producto-descripcion')?.value || '',
            imagen_url: document.getElementById('producto-imagen').value || 'assets/img/default-game.jpg',
            estado: 'activo',
            fecha_creacion: new Date()
        };

        // Campos específicos según tipo
        if (producto.tipo_producto === 'Juego') {
            producto.genero = document.getElementById('juego-genero')?.value || '';
            producto.edicion = document.getElementById('juego-edicion')?.value || '';
            producto.desarrollador = document.getElementById('juego-desarrollador')?.value || '';
            producto.fecha_lanzamiento = document.getElementById('juego-lanzamiento')?.value || null;
        } else if (producto.tipo_producto === 'Tarjeta regalo') {
            producto.valor_tarjeta = parseFloat(document.getElementById('tarjeta-valor')?.value) || producto.precio;
        }

        const nuevoProducto = await ProductoDB.crear(producto);

        // Si hay stock, crear códigos automáticamente
        if (producto.stock > 0 && nuevoProducto) {
            const codigos = [];
            for (let i = 0; i < producto.stock; i++) {
                codigos.push(`COD-${nuevoProducto.id_producto}-${i + 1}-${Math.random().toString(36).substring(7).toUpperCase()}`);
            }
            await InventarioDB.agregarCodigos(nuevoProducto.id_producto, codigos);
        }

        mostrarNotificacion('✅ Producto guardado correctamente');
        cambiarTabProveedor('productos');
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarNotificacion('Error al guardar el producto', 'error');
    }

    return false;
}

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
        const productos = await ProductoDB.getAll({ proveedor: proveedorActual.id_usuario });
        const select = document.getElementById('codigo-producto');

        if (!productos?.length) {
            select.innerHTML = '<option value="">No tienes productos</option>';
            return;
        }

        let options = '<option value="">Seleccionar producto</option>';
        productos.forEach(p => {
            options += `<option value="${p.id_producto}">${p.nombre_producto}</option>`;
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
        const cantidad = await InventarioDB.agregarCodigos(productoId, codigos);
        mostrarNotificacion(`✅ ${cantidad} códigos cargados correctamente`);
        document.getElementById('codigos-lista').value = '';
    } catch (error) {
        console.error('Error guardando códigos:', error);
        mostrarNotificacion('Error al cargar códigos', 'error');
    }

    return false;
}

async function cargarMisVentas() {
    try {
        const productos = await ProductoDB.getAll({ proveedor: proveedorActual.id_usuario });
        
        if (!productos?.length) {
            document.getElementById('proveedor-content').innerHTML = '<p style="text-align: center;">No hay ventas aún</p>';
            return;
        }
        
        // 👇 MEJOR: Crear una función en CompraDB para esto
        // Por ahora, usamos supabaseClient pero deberías moverlo a CompraDB
        const idsProductos = productos.map(p => p.id_producto);
        
        const { data: ventas, error } = await supabaseClient
            .from('detalle_compra')
            .select(`
                *,
                compra: id_compra (fecha_compra),
                producto: id_producto (nombre_producto, precio)
            `)
            .in('id_producto', idsProductos)
            .order('id_detail', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('proveedor-content');
        
        if (!ventas?.length) {
            container.innerHTML = '<p style="text-align: center;">No hay ventas aún</p>';
            return;
        }
        
        let html = '<h3>Mis ventas</h3><table class="tabla-ventas"><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Total</th></tr>';
        ventas.forEach(v => {
            html += `
                <tr>
                    <td>${v.compra ? new Date(v.compra.fecha_compra).toLocaleDateString() : 'N/A'}</td>
                    <td>${v.producto?.nombre_producto || 'Producto'}</td>
                    <td>${v.cantidad || 1}</td>
                    <td>$${formatearPrecio(v.precio_unitario * (v.cantidad || 1))}</td>
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

// ===== FUNCIÓN PARA ELIMINAR PRODUCTO =====
async function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            await ProductoDB.eliminar(id);
            mostrarNotificacion('Producto eliminado');
            cargarMisProductos();
        } catch (error) {
            console.error('Error eliminando producto:', error);
            mostrarNotificacion('Error al eliminar', 'error');
        }
    }
}

// ===== FUNCIÓN PARA EDITAR PRODUCTO (ÚNICA) =====
// ===== FUNCIÓN PARA EDITAR PRODUCTO (CON PLATAFORMAS DINÁMICAS) =====
async function editarProducto(id) {
    console.log('✏️ Editando producto:', id);
    
    try {
        // Mostrar loading mientras carga
        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">✏️ Editando producto</h2>
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner"></div>
                <p>Cargando datos del producto...</p>
            </div>
        `;

        // Obtener datos del producto y plataformas
        const producto = await ProductoDB.getById(id);
        const plataformas = await PlataformaDB.getAll();
        
        if (!producto) {
            mostrarNotificacion('Producto no encontrado', 'error');
            return;
        }

        // Generar opciones de plataforma con la seleccionada
        let plataformaOptions = '<option value="">Seleccionar plataforma</option>';
        plataformas.forEach(p => {
            const selected = producto.id_plataforma === p.id_plataforma ? 'selected' : '';
            plataformaOptions += `<option value="${p.id_plataforma}" ${selected}>${p.nombre_plataforma}</option>`;
        });

        // Mostrar formulario de edición
        const container = document.getElementById('proveedor-content');
        container.innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">✏️ Editar producto</h2>
            <form onsubmit="return guardarEdicionProducto(event, ${id})" class="form-producto">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de producto</label>
                        <select id="edit-producto-tipo" required onchange="toggleEditCamposProducto()">
                            <option value="Juego" ${producto.tipo_producto === 'Juego' ? 'selected' : ''}>Videojuego</option>
                            <option value="Tarjeta regalo" ${producto.tipo_producto === 'Tarjeta regalo' ? 'selected' : ''}>Tarjeta de regalo</option>
                            <option value="Suscripcion" ${producto.tipo_producto === 'Suscripcion' ? 'selected' : ''}>Suscripción</option>
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
                    <input type="text" id="edit-producto-nombre" required value="${producto.nombre_producto}">
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
                            <input type="text" id="edit-juego-genero" value="${producto.genero || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Edición</label>
                            <input type="text" id="edit-juego-edicion" value="${producto.edicion || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Desarrollador</label>
                            <input type="text" id="edit-juego-desarrollador" value="${producto.desarrollador || ''}">
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
                
                <div class="form-group">
                    <label>URL de la imagen</label>
                    <input type="url" id="edit-producto-imagen" value="${producto.imagen_url || ''}">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="edit-producto-descripcion" rows="4">${producto.descripcion || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" class="btn-nuevo" style="flex: 1;">💾 Guardar cambios</button>
                    <button type="button" class="btn-eliminar" onclick="cambiarTabProveedor('productos')" style="flex: 0.3;">↩️ Cancelar</button>
                </div>
            </form>
        `;
    } catch (error) {
        console.error('Error cargando producto para editar:', error);
        document.getElementById('proveedor-content').innerHTML = `
            <h2 style="color: #4d8cff; margin-bottom: 2rem;">✏️ Editar producto</h2>
            <p style="color: #ff6b8b; text-align: center;">Error al cargar el producto. Intenta de nuevo.</p>
            <button class="btn-nuevo" onclick="cambiarTabProveedor('productos')" style="margin-top: 1rem;">Volver a productos</button>
        `;
    }
}

// Función para mostrar/ocultar campos en edición
function toggleEditCamposProducto() {
    const tipo = document.getElementById('edit-producto-tipo').value;
    document.getElementById('edit-campos-juego').style.display = tipo === 'Juego' ? 'block' : 'none';
    document.getElementById('edit-campos-tarjeta').style.display = tipo === 'Tarjeta regalo' ? 'block' : 'none';
}

// Función para guardar cambios de edición
async function guardarEdicionProducto(event, productoId) {
    event.preventDefault();

    try {
        const tipoProducto = document.getElementById('edit-producto-tipo').value;
        const plataformaId = parseInt(document.getElementById('edit-producto-plataforma').value);

        if (!plataformaId) {
            mostrarNotificacion('❌ Debes seleccionar una plataforma', 'error');
            return false;
        }

        // Determinar categoría según tipo
        let idCategoria = 1;
        if (tipoProducto === 'Tarjeta regalo') idCategoria = 2;
        else if (tipoProducto === 'Suscripcion') idCategoria = 3;

        const productoActualizado = {
            id_categoria: idCategoria,
            id_plataforma: plataformaId,
            nombre_producto: document.getElementById('edit-producto-nombre').value,
            precio: parseFloat(document.getElementById('edit-producto-precio').value),
            tipo_producto: tipoProducto,
            stock: parseInt(document.getElementById('edit-producto-stock').value) || 0,
            descripcion: document.getElementById('edit-producto-descripcion')?.value || '',
            imagen_url: document.getElementById('edit-producto-imagen').value || 'assets/img/default-game.jpg',
            genero: document.getElementById('edit-juego-genero')?.value || null,
            edicion: document.getElementById('edit-juego-edicion')?.value || null,
            desarrollador: document.getElementById('edit-juego-desarrollador')?.value || null,
            fecha_lanzamiento: document.getElementById('edit-juego-lanzamiento')?.value || null,
            valor_tarjeta: parseFloat(document.getElementById('edit-tarjeta-valor')?.value) || null
        };

        console.log('📦 Actualizando producto:', productoActualizado);

        await ProductoDB.actualizar(productoId, productoActualizado);

        mostrarNotificacion('✅ Producto actualizado correctamente');
        cambiarTabProveedor('productos');
    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        mostrarNotificacion('Error al actualizar el producto', 'error');
    }

    return false;
}

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

// Exponer funciones globalmente
window.cargarDashboardProveedor = cargarDashboardProveedor;
window.cambiarTabProveedor = cambiarTabProveedor;
window.guardarNuevoProducto = guardarNuevoProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.cargarFormularioCodigos = cargarFormularioCodigos;