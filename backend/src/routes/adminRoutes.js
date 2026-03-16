import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de admin requieren autenticación y rol de administrador
router.use(verificarToken);
router.use(verificarRol(['admin']));

// Estadísticas
router.get('/stats', adminController.getStats);

// Usuarios
router.get('/usuarios', adminController.getUsuarios);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Proveedores
router.get('/proveedores', adminController.getProveedores);
router.put('/proveedores/:id/verificar', adminController.verificarProveedor);

// Productos
router.get('/productos', adminController.getProductos);
router.put('/productos/:id/desactivar', adminController.desactivarProducto);

// Ventas
router.get('/ventas', adminController.getVentas);
router.put('/compras/:id/estado', adminController.actualizarEstadoCompra);

// Devoluciones
router.get('/devoluciones', adminController.getDevoluciones);
router.put('/devoluciones/:id/aprobar', adminController.aprobarDevolucion);
router.put('/devoluciones/:id/rechazar', adminController.rechazarDevolucion);

export default router;