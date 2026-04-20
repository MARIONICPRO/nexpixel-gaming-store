// ============================================
// PAGOS.JS - INTEGRACIÓN PAYU WEBCHECKOUT
// ============================================

const Pagos = {
    config: null,

    async inicializar() {
        try {
            const response = await fetch(`${API_URL}/pagos/config`);
            const data = await response.json();
            
            if (data.success) {
                this.config = data.config;
                console.log('✅ Configuración PayU cargada');
            }
        } catch (error) {
            console.error('Error cargando configuración PayU:', error);
        }
    },

    generarReferencia() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const userId = Auth.usuarioActual?.id_usuario || 'guest';
        return `NXP-${userId}-${timestamp}-${random}`;
    },

    generarFirma(referenceCode, amount, apiKey) {
        const firmaString = `${apiKey}~${this.config.merchantId}~${referenceCode}~${amount}~${this.config.currency}`;
        
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.MD5(firmaString).toString();
        }
        
        console.error('CryptoJS no está cargado');
        return '';
    },

    async crearPedido(datosPago) {
        try {
            const response = await fetch(`${API_URL}/pagos/crear-pedido`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify({
                    items: Carrito.items.map(item => ({
                        productoId: item.productoId || item.id_producto,
                        cantidad: item.cantidad || 1,
                        precio_unitario: item.precio_unitario
                    })),
                    total: Carrito.calcularTotal(),
                    referencia: datosPago.referenceCode
                })
            });

            const data = await response.json();
            return data.success ? data.pedido : null;
        } catch (error) {
            console.error('Error creando pedido:', error);
            return null;
        }
    },

    async procesarPago() {
        const total = Carrito.calcularTotal();
        
        if (total <= 0) {
            mostrarNotificacion('El carrito está vacío', 'error');
            return false;
        }

        if (!this.config) {
            await this.inicializar();
        }

        this.mostrarLoaderPago();

        try {
            const referenceCode = this.generarReferencia();
            const amount = total.toFixed(2);
            const apiKey = '4Vj8eK4rloUd272L48hsrarnUA';
            const signature = this.generarFirma(referenceCode, amount, apiKey);
            
            const buyerEmail = Auth.usuarioActual?.email || 
                              document.getElementById('pago-email')?.value || 
                              'cliente@nexpixel.com';
            
            const buyerFullName = Auth.usuarioActual?.nombre || 
                                 document.getElementById('pago-nombre')?.value || 
                                 'Cliente Nexpixel';

            const pedido = await this.crearPedido({
                referenceCode,
                amount,
                buyerEmail,
                buyerFullName
            });

            if (!pedido) {
                throw new Error('No se pudo crear el pedido');
            }

            sessionStorage.setItem('ultimo_pedido_ref', referenceCode);
            sessionStorage.setItem('ultimo_pedido_id', pedido.id);

            this.enviarFormularioPayU({
                referenceCode,
                amount,
                signature,
                buyerEmail,
                buyerFullName,
                description: `Compra Nexpixel - ${Carrito.items.length} productos`
            });

            return true;
        } catch (error) {
            console.error('Error procesando pago:', error);
            this.ocultarLoaderPago();
            mostrarNotificacion('Error al procesar el pago', 'error');
            return false;
        }
    },

    enviarFormularioPayU(datos) {
        const payuUrl = this.config.test 
            ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/'
            : 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payuUrl;
        form.style.display = 'none';

        const campos = {
            merchantId: this.config.merchantId,
            accountId: this.config.accountId,
            description: datos.description,
            referenceCode: datos.referenceCode,
            amount: datos.amount,
            tax: '0',
            taxReturnBase: '0',
            currency: this.config.currency,
            signature: datos.signature,
            test: this.config.test ? '1' : '0',
            buyerEmail: datos.buyerEmail,
            buyerFullName: datos.buyerFullName,
            responseUrl: this.config.responseUrl,
            confirmationUrl: this.config.confirmationUrl
        };

        Object.entries(campos).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    },

    mostrarLoaderPago() {
        const loader = document.createElement('div');
        loader.id = 'pago-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
        `;
        loader.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner"></div>
                <p style="margin-top: 20px;">Conectando con la pasarela de pago...</p>
            </div>
            <style>
                .spinner {
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid #8A2BE2;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    },

    ocultarLoaderPago() {
        const loader = document.getElementById('pago-loader');
        if (loader) loader.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Pagos.inicializar();
});

window.Pagos = Pagos;