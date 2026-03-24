// ============================================
// CARRITO-DB.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Carrito = {
    items: [],
    carritoId: null,
    async inicializar() {
        // Si hay usuario logueado, cargar del backend
        if (Auth.usuarioActual) {
            await this.cargarItems();
        } else {
            // Si no hay usuario, cargar carrito local
            this.items = this.obtenerCarritoLocal();
            await this.cargarProductosLocales(this.items);
            this.actualizarUI();
        }
    },

    async cargarItems() {
        if (!Auth.usuarioActual) return;

        try {
            // Obtener items del carrito desde el backend
            const response = await fetch(`${API_URL}/carrito`, {
                method: 'GET',
                headers: API.getHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.items = data.items || [];
                this.carritoId = data.carritoId;
                this.actualizarUI();
            }
        } catch (error) {
            console.error('Error cargando items del carrito:', error);
        }
    },

    async agregar(productoId, cantidad = 1) {
        // ELIMINADA la verificación de login - cualquier usuario puede agregar

        try {
            // Si hay usuario logueado, usar el backend
            if (Auth.usuarioActual) {
                const response = await fetch(`${API_URL}/carrito/agregar`, {
                    method: 'POST',
                    headers: API.getHeaders(),
                    body: JSON.stringify({
                        productoId,
                        cantidad
                    })
                });

                const data = await response.json();

                if (data.success) {
                    await this.cargarItems();
                    // NOTIFICACIÓN ELIMINADA
                    return true;
                } else {
                    mostrarNotificacion(data.error || 'Error al añadir', 'error');
                    return false;
                }
            } else {
                // Usuario no logueado - guardar en localStorage
                return this.agregarLocal(productoId, cantidad);
            }
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            mostrarNotificacion('❌ Error al conectar con el servidor', 'error');
            return false;
        }
    },

    // Nuevo método para carrito local sin login
    agregarLocal(productoId, cantidad = 1) {
        try {
            // Obtener carrito actual del localStorage
            let carritoLocal = this.obtenerCarritoLocal();

            // Buscar si el producto ya existe
            const index = carritoLocal.findIndex(item => item.productoId === productoId);

            if (index !== -1) {
                // Actualizar cantidad si ya existe
                carritoLocal[index].cantidad += cantidad;
            } else {
                // Crear item temporal con la información básica
                carritoLocal.push({
                    id: Date.now(), // ID temporal
                    productoId: productoId,
                    cantidad: cantidad,
                    producto: null // Se cargará después
                });
            }

            // Guardar en localStorage
            localStorage.setItem('carrito_local', JSON.stringify(carritoLocal));

            // Cargar información de productos
            this.cargarProductosLocales(carritoLocal);

            // Actualizar UI
            this.items = carritoLocal;
            this.actualizarUI();

            // SIN NOTIFICACIÓN
            return true;

        } catch (error) {
            console.error('Error agregando al carrito local:', error);
            return false;
        }
    },

    async cargarProductosLocales(carritoLocal) {
        // Cargar información completa de cada producto
        for (let item of carritoLocal) {
            if (!item.producto) {
                try {
                    const response = await fetch(`${API_URL}/productos/${item.productoId}`);
                    const data = await response.json();
                    item.producto = data.producto || data;
                    item.nombre = item.producto.nombre_producto;
                    item.precio_unitario = item.producto.precio;
                } catch (error) {
                    console.error('Error cargando producto:', error);
                }
            }
        }
        localStorage.setItem('carrito_local', JSON.stringify(carritoLocal));
        this.items = carritoLocal;
        this.actualizarUI();
    },

    obtenerCarritoLocal() {
        const carritoGuardado = localStorage.getItem('carrito_local');
        return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    },

    guardarCarritoLocal() {
        localStorage.setItem('carrito_local', JSON.stringify(this.items));
    },

    async actualizarCantidad(itemId, nuevaCantidad) {
        try {
            if (nuevaCantidad <= 0) {
                await this.eliminar(itemId);
                return;
            }

            const response = await fetch(`${API_URL}/carrito/actualizar`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify({
                    itemId,
                    cantidad: nuevaCantidad
                })
            });

            const data = await response.json();

            if (data.success) {
                await this.cargarItems();
                mostrarNotificacion('Cantidad actualizada');
            } else {
                mostrarNotificacion(data.error || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error actualizando cantidad:', error);
            mostrarNotificacion('Error al actualizar cantidad', 'error');
        }
    },

    async eliminar(itemId) {
        try {
            const response = await fetch(`${API_URL}/carrito/eliminar/${itemId}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });

            const data = await response.json();

            if (data.success) {
                await this.cargarItems();
                mostrarNotificacion('Producto eliminado del carrito');
            } else {
                mostrarNotificacion(data.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Error eliminando item:', error);
            mostrarNotificacion('Error al eliminar', 'error');
        }
    },

    async vaciar() {
        if (!Auth.usuarioActual) return;

        try {
            const response = await fetch(`${API_URL}/carrito/vaciar`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.items = [];
                this.actualizarUI();
                mostrarNotificacion('Carrito vaciado');
            }
        } catch (error) {
            console.error('Error vaciando carrito:', error);
            mostrarNotificacion('Error al vaciar carrito', 'error');
        }
    },

    calcularTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.precio_unitario * (item.cantidad || 1));
        }, 0);
    },

    actualizarUI() {
        // Actualizar contador en sidebar
        const contadorSidebar = document.getElementById('sidebar-carrito-contador');
        if (contadorSidebar) contadorSidebar.textContent = this.items.length;

        // Actualizar contador flotante
        const contadorFlotante = document.getElementById('cartCount');
        if (contadorFlotante) contadorFlotante.textContent = this.items.length;

        // Si estamos en la página del carrito, renderizar
        if (window.location.pathname.includes('carrito.html')) {
            this.renderizarCarrito();
        }
    },
    renderizarCarrito() {
        const container = document.getElementById('carrito-items');
        const totalSpan = document.getElementById('total-pagar');

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
            <div class="carrito-vacio">
                <p>Tu carrito está vacío</p>
                <a href="juegos.html" class="btn-ir-tienda">Ir a la tienda</a>
            </div>
        `;
            if (totalSpan) totalSpan.textContent = '$0';
            // Ocultar botón de compra si existe
            const btnComprar = document.getElementById('btn-confirmar-compra');
            if (btnComprar) btnComprar.style.display = 'none';
            return;
        }

        let html = '';
        let total = 0;

        this.items.forEach(item => {
            const producto = item.producto || item;
            if (!producto) return;

            const subtotal = (item.precio_unitario || producto.precio) * (item.cantidad || 1);
            total += subtotal;

            html += `
            <div class="carrito-item" data-id="${item.id}">
                <div class="carrito-item-imagen">
                    <img src="${producto.imagen_url || 'assets/img/default-game.jpg'}" 
                         alt="${producto.nombre_producto}"
                         onerror="this.src='assets/img/default-game.jpg'">
                </div>
                <div class="carrito-item-info">
                    <h3>${producto.nombre_producto}</h3>
                    <p class="carrito-item-plataforma">${producto.plataforma?.nombre_plataforma || 'Digital'}</p>
                    ${producto.edicion ? `<p class="carrito-item-edicion">Edición: ${producto.edicion}</p>` : ''}
                    ${producto.genero ? `<p class="carrito-item-genero">Género: ${producto.genero}</p>` : ''}
                    <p class="carrito-item-precio-unitario">Precio: $${formatearPrecio(item.precio_unitario || producto.precio)}</p>
                    
                    <div class="carrito-item-controles">
                        <div class="carrito-item-cantidad">
                            <button class="btn-cantidad" onclick="Carrito.actualizarCantidad(${item.id}, ${(item.cantidad || 1) - 1})" 
                                ${(item.cantidad || 1) <= 1 ? 'disabled' : ''}>-</button>
                            <span>${item.cantidad || 1}</span>
                            <button class="btn-cantidad" onclick="Carrito.actualizarCantidad(${item.id}, ${(item.cantidad || 1) + 1})">+</button>
                        </div>
                        <span class="carrito-item-subtotal">$${formatearPrecio(subtotal)}</span>
                        <button class="btn-eliminar-item" onclick="Carrito.eliminar(${item.id})">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
        if (totalSpan) totalSpan.textContent = '$' + formatearPrecio(total);

        // Agregar el evento de compra con verificación de login
        this.agregarEventoCompra();
    },

    agregarEventoCompra() {
        const btnComprar = document.getElementById('btn-confirmar-compra');
        if (!btnComprar) return;

        // Remover event listeners anteriores
        const nuevoBtn = btnComprar.cloneNode(true);
        btnComprar.parentNode.replaceChild(nuevoBtn, btnComprar);

        nuevoBtn.style.display = 'block';
        nuevoBtn.addEventListener('click', () => {
            // VERIFICAR LOGIN AL CONFIRMAR COMPRA
            if (!Auth.usuarioActual) {
                mostrarNotificacion('Debes iniciar sesión para completar la compra', 'error');
                abrirModalLogin();
                return;
            }

            // Si está logueado, sincronizar carrito local con backend primero
            this.sincronizarCarritoLocal().then(() => {
                // Proceder con el pago
                if (typeof confirmarPago === 'function') {
                    confirmarPago();
                } else {
                    console.error('Función confirmarPago no encontrada');
                    mostrarNotificacion('Error al procesar la compra', 'error');
                }
            });
        });
    },

    async sincronizarCarritoLocal() {
        // Si hay carrito local y usuario logueado, sincronizar
        const carritoLocal = this.obtenerCarritoLocal();
        if (carritoLocal.length > 0 && Auth.usuarioActual) {
            for (const item of carritoLocal) {
                await this.agregar(item.productoId, item.cantidad);
            }
            // Limpiar carrito local después de sincronizar
            localStorage.removeItem('carrito_local');
            await this.cargarItems();
        }
    }
};

// Asegurarse de que la función formatearPrecio existe
if (typeof formatearPrecio !== 'function') {
    window.formatearPrecio = function (precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    };
}

// Exponer globalmente
window.Carrito = Carrito;