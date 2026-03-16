// ============================================
// CARRITO-DB.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Carrito = {
    items: [],
    carritoId: null,

    async inicializar() {
        if (!Auth.usuarioActual) return;
        // El carrito ahora se maneja en el backend
        await this.cargarItems();
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
        if (!Auth.usuarioActual) {
            mostrarNotificacion('Debes iniciar sesión', 'error');
            abrirModalLogin();
            return false;
        }

        try {
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
                mostrarNotificacion('✅ Producto añadido al carrito');
                return true;
            } else {
                mostrarNotificacion(data.error || 'Error al añadir', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            mostrarNotificacion('❌ Error al conectar con el servidor', 'error');
            return false;
        }
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
    }
};

// Asegurarse de que la función formatearPrecio existe
if (typeof formatearPrecio !== 'function') {
    window.formatearPrecio = function(precio) {
        return new Intl.NumberFormat('es-CO').format(precio);
    };
}

// Exponer globalmente
window.Carrito = Carrito;