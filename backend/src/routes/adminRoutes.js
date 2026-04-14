// backend/src/routes/adminRoutes.js
import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);
router.use(verificarRol(['admin']));

// Estadísticas
router.get('/stats', adminController.getStats);

// Usuarios
// backend/src/routes/adminRoutes.js

// Agregar esta línea con las otras rutas de usuarios
router.put('/usuarios/:id/rol', adminController.cambiarRolUsuario);
router.get('/usuarios', adminController.getUsuarios);
router.put('/usuarios/:id/inactivar', adminController.inactivarUsuario);
router.put('/usuarios/:id/activar', adminController.activarUsuario);
router.put('/usuarios/:id/cambiar-rol-admin', adminController.cambiarRolAdmin);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Proveedores
router.get('/proveedores', adminController.getProveedores);
router.put('/proveedores/:id/verificar', adminController.verificarProveedor);
router.put('/proveedores/:id/suspender', adminController.suspenderProveedor);   // ✅ NUEVA
router.put('/proveedores/:id/reactivar', adminController.reactivarProveedor);   // ✅ NUEVA

// Productos
router.get('/productos', adminController.getProductos);
router.put('/productos/:id/desactivar', adminController.desactivarProducto);
router.put('/productos/:id/activar', adminController.activarProducto);

// Ventas
router.get('/ventas', adminController.getVentas);
router.put('/compras/:id/estado', adminController.actualizarEstadoCompra);

// Devoluciones
router.get('/devoluciones', adminController.getDevoluciones);
router.put('/devoluciones/:id/aprobar', adminController.aprobarDevolucion);
router.put('/devoluciones/:id/rechazar', adminController.rechazarDevolucion);

export default router;