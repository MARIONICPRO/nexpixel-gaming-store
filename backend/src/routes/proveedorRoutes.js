import express from 'express';
import { proveedorController } from '../controllers/proveedorController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de proveedor
router.use(verificarToken);
router.use(verificarRol(['proveedor']));

// Productos
router.get('/productos', proveedorController.obtenerMisProductos);
router.post('/productos', proveedorController.crearProducto);
router.put('/productos/:id', proveedorController.actualizarProducto);
router.delete('/productos/:id', proveedorController.eliminarProducto);

// Códigos
router.get('/productos/:id/codigos', proveedorController.obtenerCodigos);
router.post('/productos/:id/codigos', proveedorController.agregarCodigos);

// Estadísticas y ventas
router.get('/stats', proveedorController.obtenerStats);
router.get('/ventas', proveedorController.obtenerVentas);

// Utilidades para formularios
router.get('/plataformas', proveedorController.obtenerPlataformas);
router.get('/categorias', proveedorController.obtenerCategorias);

export default router;