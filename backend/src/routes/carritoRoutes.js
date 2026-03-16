import express from 'express';
import { carritoController } from '../controllers/carritoController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas del carrito requieren autenticación
router.use(verificarToken);

// Obtener carrito actual
router.get('/', carritoController.obtenerCarrito);

// Obtener solo el conteo (útil para el badge del navbar)
router.get('/conteo', carritoController.obtenerConteo);

// Agregar producto
router.post('/agregar', carritoController.agregarProducto);

// Actualizar cantidad
router.put('/actualizar', carritoController.actualizarCantidad);

// Eliminar item específico
router.delete('/eliminar/:itemId', carritoController.eliminarItem);

// Vaciar carrito completo
router.delete('/vaciar', carritoController.vaciarCarrito);

export default router;