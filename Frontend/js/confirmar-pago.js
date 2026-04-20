// ============================================
// CONFIRMAR-PAGO.JS - Maneja el evento de compra
// ============================================

async function confirmarPago() {
    const nombre = document.getElementById('pago-nombre')?.value;
    const documento = document.getElementById('pago-documento')?.value;
    const email = document.getElementById('pago-email')?.value;
    
    if (!nombre || !documento || !email) {
        mostrarNotificacion('Por favor completa todos los campos', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarNotificacion('Por favor ingresa un correo electrónico válido', 'error');
        return;
    }
    
    if (Carrito.items.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    if (!Auth.usuarioActual) {
        mostrarNotificacion('Debes iniciar sesión para completar la compra', 'error');
        abrirModalLogin();
        return;
    }
    
    await Carrito.sincronizarCarritoLocal();
    await Pagos.procesarPago();
}

// Exponer globalmente
window.confirmarPago = confirmarPago;

console.log('✅ confirmarPago.js cargado - Función confirmarPago disponible');