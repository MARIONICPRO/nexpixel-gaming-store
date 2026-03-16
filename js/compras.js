// ============================================
// COMPRAS.JS - VERSIÓN PARA NODE.JS (USA API)
// ============================================

const Compras = {
    async procesarPago(datosPago) {
        if (!Auth.usuarioActual) {
            abrirModalLogin();
            return false;
        }

        if (Carrito.items.length === 0) {
            mostrarNotificacion('❌ El carrito está vacío', 'error');
            return false;
        }

        // Validar método de pago
        if (!datosPago || !datosPago.metodo) {
            mostrarNotificacion('❌ Selecciona un método de pago', 'error');
            return false;
        }

        // Validar campos comunes
        const nombre = document.getElementById('pago-nombre')?.value;
        const documento = document.getElementById('pago-documento')?.value;
        const email = document.getElementById('pago-email')?.value;

        if (!nombre || !documento || !email) {
            mostrarNotificacion('❌ Completa todos los datos personales', 'error');
            return false;
        }

        // Validar campos específicos según método
        if (datosPago.metodo === 'visa' || datosPago.metodo === 'tarjeta') {
            const tarjetaNumero = document.getElementById('tarjeta-numero')?.value;
            const tarjetaExp = document.getElementById('tarjeta-expiracion')?.value;
            const tarjetaCvv = document.getElementById('tarjeta-cvv')?.value;
            
            if (!tarjetaNumero || tarjetaNumero.length < 15) {
                mostrarNotificacion('❌ Número de tarjeta inválido', 'error');
                return false;
            }
        }

        try {
            // Preparar datos de la compra
            const datosCompra = {
                items: Carrito.items.map(item => ({
                    productoId: item.id_producto || item.productoId,
                    cantidad: item.cantidad || 1,
                    precio: item.precio_unitario
                })),
                total: Carrito.calcularTotal(),
                metodo_pago: datosPago.metodo,
                datos_personales: {
                    nombre,
                    documento,
                    email
                }
            };

            // Enviar al backend
            const response = await fetch(`${API_URL}/compras/procesar`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify(datosCompra)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Vaciar carrito después de la compra
                await Carrito.vaciar();
                
                // Mostrar mensaje según método de pago
                let mensaje = '✅ ¡Compra realizada con éxito!';
                if (datosPago.metodo === 'efecty') {
                    mensaje = '✅ ¡Código de pago en Efecty generado!';
                } else if (datosPago.metodo === 'nequi' || datosPago.metodo === 'daviplata') {
                    mensaje = `✅ Hemos enviado un código a tu ${datosPago.metodo}`;
                }
                
                mostrarNotificacion(mensaje);
                
                // Redirigir a inicio después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
                return true;
            } else {
                mostrarNotificacion(data.error || 'Error al procesar el pago', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('Error procesando pago:', error);
            mostrarNotificacion('❌ Error al conectar con el servidor', 'error');
            return false;
        }
    },

    async obtenerHistorial() {
        if (!Auth.usuarioActual) return [];
        
        try {
            const response = await fetch(`${API_URL}/compras/historial`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            
            const data = await response.json();
            return data.success ? data.compras : [];
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            return [];
        }
    },

    async renderizarHistorial(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const historial = await this.obtenerHistorial();
        
        if (!historial || historial.length === 0) {
            container.innerHTML = '<p class="text-center">No hay compras realizadas</p>';
            return;
        }

        let html = '<div class="historial-grid">';
        historial.forEach(compra => {
            html += `
                <div class="historial-card">
                    <div class="historial-header">
                        <span>Compra #${compra.id_compra}</span>
                        <span class="badge badge-${compra.estado}">${compra.estado}</span>
                    </div>
                    <div class="historial-fecha">${new Date(compra.fecha_compra).toLocaleDateString()}</div>
                    <div class="historial-total">Total: $${formatearPrecio(compra.total)}</div>
                    <div class="historial-productos">
                        ${compra.detalle_compra?.map(d => `
                            <div>• ${d.producto?.nombre_producto} x${d.cantidad || 1}</div>
                        `).join('') || 'Sin productos'}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
};

// Exponer globalmente
window.Compras = Compras;