import express from 'express';
import { compraController } from '../controllers/compraController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de compra requieren autenticación
router.use(verificarToken);

// Procesar nueva compra
router.post('/procesar', compraController.procesarCompra);

// Historial de compras
router.get('/historial', compraController.obtenerHistorial);

// Detalle de una compra específica
router.get('/:id', compraController.obtenerCompraPorId);

// Cancelar compra (solo si está pendiente)
router.post('/:id/cancelar', compraController.cancelarCompra);

// Solicitar devolución
router.post('/:id/devolucion', compraController.solicitarDevolucion);

export default router;