import express from 'express';
import { productoController } from '../controllers/productoController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';
import { supabase } from '../config/db-config.js';

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Obtener todos los productos (con filtros)
router.get('/', productoController.obtenerProductos);

// Obtener juegos recientes
router.get('/recientes', productoController.obtenerJuegosRecientes);

// Obtener productos populares
router.get('/populares', productoController.obtenerProductosPopulares);

// Obtener plataformas (para filtros)
router.get('/plataformas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('plataforma')
            .select('*')
            .order('nombre_plataforma');
        
        if (error) throw error;
        
        res.json({
            success: true,
            plataformas: data || []
        });
    } catch (error) {
        console.error('❌ Error obteniendo plataformas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener plataformas' 
        });
    }
});

// Obtener producto por ID
router.get('/:id', productoController.obtenerProductoPorId);

// Obtener productos similares
router.get('/:id/similares', productoController.obtenerProductosSimilares);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Crear producto (solo proveedores y admin)
router.post('/', verificarToken, verificarRol(['proveedor', 'admin']), productoController.crearProducto);

// Actualizar producto (solo proveedores y admin)
router.put('/:id', verificarToken, verificarRol(['proveedor', 'admin']), productoController.actualizarProducto);

// Eliminar producto (solo proveedores y admin)
router.delete('/:id', verificarToken, verificarRol(['proveedor', 'admin']), productoController.eliminarProducto);

export default router;