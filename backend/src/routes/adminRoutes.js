// backend/src/routes/adminRoutes.js
import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(verificarToken);
router.use(verificarRol(['admin']));

// ============================================
// ESTADÍSTICAS
// ============================================
router.get('/stats', adminController.getStats);

// ============================================
// USUARIOS
// ============================================
router.get('/usuarios', adminController.getUsuarios);
router.put('/usuarios/:id/inactivar', adminController.inactivarUsuario);
router.put('/usuarios/:id/activar', adminController.activarUsuario);
router.put('/usuarios/:id/cambiar-rol-admin', adminController.cambiarRolAdmin);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// ============================================
// PROVEEDORES
// ============================================
router.get('/proveedores', adminController.getProveedores);
router.put('/proveedores/:id/verificar', adminController.verificarProveedor);

// ============================================
// PRODUCTOS
// ============================================
router.get('/productos', adminController.getProductos);
router.put('/productos/:id/desactivar', adminController.desactivarProducto);
router.put('/productos/:id/activar', adminController.activarProducto);

// ============================================
// VENTAS
// ============================================
router.get('/ventas', adminController.getVentas);
router.put('/compras/:id/estado', adminController.actualizarEstadoCompra);

// ============================================
// DEVOLUCIONES
// ============================================
router.get('/devoluciones', adminController.getDevoluciones);
router.put('/devoluciones/:id/aprobar', adminController.aprobarDevolucion);
router.put('/devoluciones/:id/rechazar', adminController.rechazarDevolucion);

export default router;