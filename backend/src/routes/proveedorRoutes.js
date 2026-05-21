import express from 'express';
import { proveedorController } from '../controllers/proveedorController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';
import { uploadProductMiddleware } from '../middlewares/uploadMiddleware.js';
import { supabase } from '../config/db-config.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de proveedor
router.use(verificarToken);
router.use(verificarRol(['proveedor']));

// Productos
router.get('/productos', proveedorController.obtenerMisProductos);
router.get('/productos/:id', proveedorController.obtenerProductoPorId);
router.post('/productos', uploadProductMiddleware, proveedorController.crearProducto);
router.put('/productos/:id', uploadProductMiddleware, proveedorController.actualizarProducto);
router.delete('/productos/:id', proveedorController.eliminarProducto);

// 🔥 ACTUALIZAR STOCK DE UN PRODUCTO
router.put('/productos/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        const proveedorId = req.usuario.id_usuario;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'El stock debe ser un número mayor o igual a 0' 
            });
        }

        // Verificar que el producto pertenece al proveedor
        const { data: producto, error: errorBusqueda } = await supabase
            .from('producto')
            .select('id_producto, id_proveedor, stock, estado')
            .eq('id_producto', id)
            .eq('id_proveedor', proveedorId)
            .single();

        if (errorBusqueda || !producto) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado o no tienes permiso para modificarlo' 
            });
        }

        const datosActualizar = { 
            stock: parseInt(stock),
            fecha_actualizacion: new Date()
        };

        // Si stock llega a 0, desactivar automáticamente
        if (parseInt(stock) === 0) {
            datosActualizar.estado = 'inactivo';
        } 
        // Si stock > 0 y estaba inactivo, reactivar
        else if (producto.estado === 'inactivo' && parseInt(stock) > 0) {
            datosActualizar.estado = 'activo';
        }

        const { data, error } = await supabase
            .from('producto')
            .update(datosActualizar)
            .eq('id_producto', id)
            .select(`
                *,
                plataforma:id_plataforma(nombre_plataforma),
                categoria:id_categoria(nombre_grupo)
            `);

        if (error) throw error;

        console.log(`📦 Stock actualizado - Producto: ${id}, Nuevo stock: ${stock}, Estado: ${datosActualizar.estado || producto.estado}`);

        res.json({
            success: true,
            message: 'Stock actualizado correctamente',
            producto: data[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando stock:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el stock' 
        });
    }
});

// 🔥 OBTENER ESTADÍSTICAS DE STOCK
router.get('/productos/stock/bajo', async (req, res) => {
    try {
        const proveedorId = req.usuario.id_usuario;
        const limiteBajo = parseInt(req.query.limite) || 5;

        const { data, error, count } = await supabase
            .from('producto')
            .select('*', { count: 'exact' })
            .eq('id_proveedor', proveedorId)
            .eq('estado', 'activo')
            .lte('stock', limiteBajo)
            .gt('stock', 0)
            .order('stock', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            message: count > 0 ? `Tienes ${count} productos con stock bajo` : 'Todos los productos tienen buen stock',
            productos: data || [],
            total: count || 0
        });

    } catch (error) {
        console.error('❌ Error obteniendo stock bajo:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener productos con stock bajo' 
        });
    }
});

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