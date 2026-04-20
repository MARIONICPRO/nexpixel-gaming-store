import express from 'express';
import crypto from 'crypto';
import { supabase } from '../config/db-config.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configuración de PayU desde variables de entorno
const PAYU_CONFIG = {
    merchantId: process.env.PAYU_MERCHANT_ID,
    accountId: process.env.PAYU_ACCOUNT_ID,
    apiKey: process.env.PAYU_API_KEY,
    currency: process.env.PAYU_CURRENCY || 'COP',
    test: process.env.PAYU_TEST === 'true',
    responseUrl: process.env.PAYU_RESPONSE_URL || 'http://localhost:5500/Frontend/confirmacion.html',
    confirmationUrl: process.env.PAYU_CONFIRMATION_URL || 'http://localhost:3000/api/pagos/ipn'
};

// ============================================
// ENDPOINT IPN - Notificación silenciosa de PayU
// ============================================
router.post('/ipn', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const {
            reference_sale,
            state_pol,
            value,
            sign,
            transaction_id,
            payment_method_name,
            buyer_email,
            response_message_pol
        } = req.body;

        console.log('📥 IPN PayU recibida:', {
            reference_sale,
            state_pol,
            value,
            transaction_id,
            payment_method_name
        });

        // 1. Validar firma de seguridad
        const firmaCalculada = generarFirmaIPN(reference_sale, value, state_pol);
        
        if (sign !== firmaCalculada) {
            console.error('❌ Firma IPN inválida');
            return res.status(400).send('Invalid signature');
        }

        console.log('✅ Firma IPN válida');

        // 2. Buscar la compra en la base de datos
        const { data: compra, error: errorCompra } = await supabase
            .from('compra')
            .select('*')
            .eq('comprobante_pago', reference_sale)
            .single();

        if (errorCompra || !compra) {
            console.error('❌ Compra no encontrada con referencia:', reference_sale);
            return res.status(404).send('Order not found');
        }

        // 3. Actualizar estado según respuesta de PayU
        let nuevoEstado;
        switch (state_pol) {
            case '4': nuevoEstado = 'aprobado'; break;
            case '6': nuevoEstado = 'rechazado'; break;
            case '7': nuevoEstado = 'pendiente'; break;
            case '5': nuevoEstado = 'expirado'; break;
            default: nuevoEstado = 'pendiente';
        }

        // 4. Actualizar compra en DB
        const { error: errorUpdate } = await supabase
            .from('compra')
            .update({
                estado: nuevoEstado,
                metodo_pago: payment_method_name,
                notas: `Transacción PayU: ${transaction_id} | ${response_message_pol || ''}`
            })
            .eq('id_compra', compra.id_compra);

        if (errorUpdate) throw errorUpdate;

        console.log(`📝 Compra ${compra.id_compra} actualizada a: ${nuevoEstado}`);

        // 5. Si el pago fue aprobado
        if (state_pol === '4') {
            console.log('🎮 Procesando entrega para compra:', compra.id_compra);
            
            const { data: items, error: errorItems } = await supabase
                .from('detalle_compra')
                .select(`
                    id_detail,
                    id_compra,
                    id_producto,
                    cantidad,
                    precio_unitario,
                    subtotal,
                    producto:producto (
                        id_producto,
                        nombre_producto,
                        imagen_url
                    )
                `)
                .eq('id_compra', compra.id_compra);

            if (!errorItems) {
                console.log(`✅ ${items?.length || 0} items listos para entrega`);
                items?.forEach(item => {
                    console.log(`  📦 ${item.cantidad}x ${item.producto?.nombre_producto} - $${item.subtotal}`);
                });
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error procesando IPN:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ============================================
// ENDPOINT: Obtener configuración para frontend
// ============================================
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            merchantId: PAYU_CONFIG.merchantId,
            accountId: PAYU_CONFIG.accountId,
            currency: PAYU_CONFIG.currency,
            test: PAYU_CONFIG.test,
            responseUrl: PAYU_CONFIG.responseUrl,
            confirmationUrl: PAYU_CONFIG.confirmationUrl
        }
    });
});

// ============================================
// ENDPOINT: Crear compra antes de redirigir a PayU
// ============================================
router.post('/crear-pedido', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;
        const { items, total, referencia } = req.body;

        console.log('🛒 Creando compra para usuario:', usuarioId);
        console.log('📦 Items:', items.length, 'Total:', total);

        // 1. Insertar compra
        const { data: compra, error: errorCompra } = await supabase
            .from('compra')
            .insert([{
                id_cuenta: usuarioId,
                total: total,
                subtotal: total,
                impuestos: 0,
                descuento_total: 0,
                estado: 'pendiente',
                comprobante_pago: referencia,
                notas: `Compra creada - Pendiente de pago PayU`
            }])
            .select()
            .single();

        if (errorCompra) throw errorCompra;

        console.log('✅ Compra creada con ID:', compra.id_compra);

        // 2. Insertar items en detalle_compra
        const itemsParaInsertar = items.map(item => ({
            id_compra: compra.id_compra,
            id_producto: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.precio_unitario * item.cantidad,
            descuento_aplicado: 0,
            id_llave: null
        }));

        const { error: errorItems } = await supabase
            .from('detalle_compra')
            .insert(itemsParaInsertar);

        if (errorItems) throw errorItems;

        console.log(`✅ ${itemsParaInsertar.length} items guardados`);

        // 3. Vaciar carrito
        const { data: carrito } = await supabase
            .from('carrito')
            .select('id')
            .eq('id_cuenta', usuarioId)
            .eq('estado', 'activo')
            .single();

        if (carrito) {
            await supabase
                .from('carrito_items')
                .delete()
                .eq('carrito_id', carrito.id);
            
            console.log('🛒 Carrito vaciado');
        }

        res.json({
            success: true,
            pedido: {
                id: compra.id_compra,
                referencia: referencia,
                total: compra.total,
                estado: compra.estado
            }
        });

    } catch (error) {
        console.error('❌ Error creando compra:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear la compra: ' + error.message
        });
    }
});

// ============================================
// ENDPOINT: Verificar estado de compra
// ============================================
router.get('/pedido/:referencia', verificarToken, async (req, res) => {
    try {
        const { referencia } = req.params;
        const usuarioId = req.usuario.id_usuario;

        const { data: compra, error } = await supabase
            .from('compra')
            .select('*')
            .eq('comprobante_pago', referencia)
            .eq('id_cuenta', usuarioId)
            .single();

        if (error || !compra) {
            return res.status(404).json({
                success: false,
                error: 'Compra no encontrada'
            });
        }

        const { data: items } = await supabase
            .from('detalle_compra')
            .select(`
                cantidad,
                precio_unitario,
                subtotal,
                producto:producto (
                    nombre_producto,
                    imagen_url
                )
            `)
            .eq('id_compra', compra.id_compra);

        res.json({
            success: true,
            pedido: {
                id: compra.id_compra,
                referencia: compra.comprobante_pago,
                estado: compra.estado,
                total: compra.total,
                fecha_creacion: compra.fecha_compra,
                items: items || []
            }
        });

    } catch (error) {
        console.error('Error consultando compra:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar la compra'
        });
    }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function generarFirmaIPN(reference_sale, value, state_pol) {
    const { apiKey, merchantId, currency } = PAYU_CONFIG;
    const firmaString = `${apiKey}~${merchantId}~${reference_sale}~${value}~${currency}~${state_pol}`;
    return crypto.createHash('md5').update(firmaString).digest('hex');
}

export default router;