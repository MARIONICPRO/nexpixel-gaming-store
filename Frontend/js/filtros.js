// ============================================
// FILTROS.JS - Filtros para móvil (juegos + tarjetas)
// ============================================

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Para juegos
    if (document.getElementById('filtro-plataformas')) {
        Productos.cargarFiltrosPlataformas('filtro-plataformas', 'aplicarFiltros()');
    }
    // Para tarjetas
    if (document.getElementById('filtro-plataformas-tarjetas')) {
        Productos.cargarFiltrosPlataformas('filtro-plataformas-tarjetas', 'aplicarFiltrosTarjetas()');
    }
});

// ===== FUNCIONES PARA JUEGOS =====
function abrirModalFiltrosJuegos() {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');
    if (!modal) return;
    
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (document.getElementById('filtro-plataformas-mobile')?.children.length === 0) {
        Productos.cargarFiltrosPlataformas('filtro-plataformas-mobile', 'aplicarFiltros()');
    }
    
    sincronizarPrecio('precio-range', 'precio-range-mobile', 'precio-valor-mobile');
}

function cerrarModalFiltrosJuegos() {
    cerrarModal();
}

// ===== FUNCIONES PARA TARJETAS =====
function abrirModalFiltrosTarjetas() {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');
    if (!modal) return;
    
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (document.getElementById('filtro-plataformas-tarjetas-mobile')?.children.length === 0) {
        Productos.cargarFiltrosPlataformas('filtro-plataformas-tarjetas-mobile', 'aplicarFiltrosTarjetas()');
    }
    
    sincronizarPrecio('precio-range-tarjetas', 'precio-range-tarjetas-mobile', 'precio-valor-tarjetas-mobile');
}

function cerrarModalFiltrosTarjetas() {
    cerrarModal();
}

// ===== FUNCIONES COMUNES =====
function cerrarModal() {
    const modal = document.getElementById('filtrosModal');
    const overlay = document.getElementById('filtrosOverlay');
    if (modal) {
        modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function sincronizarPrecio(rangeDesktopId, rangeMobileId, valorMobileId) {
    const rangeDesktop = document.getElementById(rangeDesktopId);
    const rangeMobile = document.getElementById(rangeMobileId);
    if (rangeDesktop && rangeMobile) {
        rangeMobile.value = rangeDesktop.value;
        const valorMobile = document.getElementById(valorMobileId);
        if (valorMobile) {
            valorMobile.textContent = '$' + parseInt(rangeDesktop.value).toLocaleString('es-CO');
        }
    }
}

function actualizarPrecioMobile() {
    actualizarPrecio('precio-range-mobile', 'precio-valor-mobile', 'precio-range', 'precio-valor');
}

function actualizarPrecioTarjetasMobile() {
    actualizarPrecio('precio-range-tarjetas-mobile', 'precio-valor-tarjetas-mobile', 'precio-range-tarjetas', 'precio-valor-tarjetas');
}

function actualizarPrecio(rangeMobileId, valorMobileId, rangeDesktopId, valorDesktopId) {
    const range = document.getElementById(rangeMobileId);
    const valor = document.getElementById(valorMobileId);
    if (range && valor) {
        valor.textContent = '$' + parseInt(range.value).toLocaleString('es-CO');
    }
    const rangeDesktop = document.getElementById(rangeDesktopId);
    if (rangeDesktop && range) {
        rangeDesktop.value = range.value;
        const valorDesktop = document.getElementById(valorDesktopId);
        if (valorDesktop) {
            valorDesktop.textContent = '$' + parseInt(range.value).toLocaleString('es-CO');
        }
    }
}

// ===== EXPONER GLOBALMENTE =====
window.abrirModalFiltrosJuegos = abrirModalFiltrosJuegos;
window.cerrarModalFiltrosJuegos = cerrarModalFiltrosJuegos;
window.abrirModalFiltrosTarjetas = abrirModalFiltrosTarjetas;
window.cerrarModalFiltrosTarjetas = cerrarModalFiltrosTarjetas;
window.actualizarPrecioMobile = actualizarPrecioMobile;
window.actualizarPrecioTarjetasMobile = actualizarPrecioTarjetasMobile;