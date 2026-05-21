import express from 'express';
import { productoController } from '../controllers/productoController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';
import { supabase } from '../config/db-config.js';

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Obtener todos los productos (con filtros) - SOLO CON STOCK > 0
router.get('/', async (req, res) => {
    try {
        const { 
            tipo, plataforma, precio_max, precio_min, 
            busqueda, genero, limite, pagina, orden 
        } = req.query;

        let query = supabase
            .from('producto')
            .select(`
                *,
                plataforma:id_plataforma(nombre_plataforma),
                categoria:id_categoria(nombre_grupo)
            `, { count: 'exact' })
            .eq('estado', 'activo')
            .gt('stock', 0); // 🔥 SOLO productos con stock disponible

        // Filtros opcionales
        if (tipo) {
            query = query.eq('tipo_producto', tipo);
        }

        if (plataforma) {
            const plataformas = plataforma.split(',');
            query = query.in('id_plataforma', plataformas);
        }

        if (precio_max) {
            query = query.lte('precio', parseFloat(precio_max));
        }

        if (precio_min) {
            query = query.gte('precio', parseFloat(precio_min));
        }

        if (busqueda) {
            query = query.ilike('nombre_producto', `%${busqueda}%`);
        }

        if (genero) {
            query = query.ilike('genero', `%${genero}%`);
        }

        // Ordenamiento
        if (orden === 'precio-asc') {
            query = query.order('precio', { ascending: true });
        } else if (orden === 'precio-desc') {
            query = query.order('precio', { ascending: false });
        } else if (orden === 'nombre') {
            query = query.order('nombre_producto', { ascending: true });
        } else {
            query = query.order('fecha_creacion', { ascending: false });
        }

        // Paginación
        if (limite) {
            const limiteNum = parseInt(limite);
            if (pagina) {
                const paginaNum = parseInt(pagina);
                const inicio = (paginaNum - 1) * limiteNum;
                query = query.range(inicio, inicio + limiteNum - 1);
            } else {
                query = query.limit(limiteNum);
            }
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            productos: data || [],
            total: count || data?.length || 0,
            pagina: pagina ? parseInt(pagina) : 1,
            limite: limite ? parseInt(limite) : data?.length || 0
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener productos' 
        });
    }
});

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

// Obtener productos similares (también con stock)
router.get('/:id/similares', async (req, res) => {
    try {
        const { id } = req.params;
        const limite = parseInt(req.query.limite) || 4;

        // Obtener el producto actual para saber su categoría/género
        const { data: producto, error: errorProducto } = await supabase
            .from('producto')
            .select('id_categoria, id_genero, id_plataforma')
            .eq('id_producto', id)
            .single();

        if (errorProducto || !producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        // Buscar similares con stock > 0
        const { data: similares, error } = await supabase
            .from('producto')
            .select(`
                *,
                plataforma:id_plataforma(nombre_plataforma)
            `)
            .neq('id_producto', id)
            .eq('estado', 'activo')
            .gt('stock', 0) // 🔥 Solo con stock
            .or(`id_categoria.eq.${producto.id_categoria},id_plataforma.eq.${producto.id_plataforma}`)
            .limit(limite);

        if (error) throw error;

        res.json({
            success: true,
            similares: similares || []
        });

    } catch (error) {
        console.error('❌ Error obteniendo similares:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener productos similares' 
        });
    }
});

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Crear producto (solo proveedores y admin)
router.post('/', verificarToken, verificarRol(['proveedor', 'admin']), productoController.crearProducto);

// Actualizar producto (solo proveedores y admin)
router.put('/:id', verificarToken, verificarRol(['proveedor', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombre_producto, precio, stock, estado, 
            descripcion, id_categoria, id_plataforma, genero 
        } = req.body;

        const datosActualizar = {};

        if (nombre_producto !== undefined) datosActualizar.nombre_producto = nombre_producto;
        if (precio !== undefined) datosActualizar.precio = parseFloat(precio);
        if (stock !== undefined) datosActualizar.stock = parseInt(stock);
        if (estado !== undefined) datosActualizar.estado = estado;
        if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
        if (id_categoria !== undefined) datosActualizar.id_categoria = id_categoria;
        if (id_plataforma !== undefined) datosActualizar.id_plataforma = id_plataforma;
        if (genero !== undefined) datosActualizar.genero = genero;

        // Si stock llega a 0, cambiar estado automáticamente
        if (stock !== undefined && parseInt(stock) === 0) {
            datosActualizar.estado = 'inactivo';
        }

        const { data, error } = await supabase
            .from('producto')
            .update(datosActualizar)
            .eq('id_producto', id)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Producto actualizado correctamente',
            producto: data[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar producto' 
        });
    }
});

// Actualizar solo el stock de un producto
router.put('/:id/stock', verificarToken, verificarRol(['proveedor', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Stock inválido' 
            });
        }

        const datosActualizar = { 
            stock: parseInt(stock) 
        };

        // Si stock llega a 0, desactivar automáticamente
        if (parseInt(stock) === 0) {
            datosActualizar.estado = 'inactivo';
        } else {
            datosActualizar.estado = 'activo';
        }

        const { data, error } = await supabase
            .from('producto')
            .update(datosActualizar)
            .eq('id_producto', id)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Stock actualizado correctamente',
            producto: data[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando stock:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar stock' 
        });
    }
});

// Eliminar producto (solo proveedores y admin)
router.delete('/:id', verificarToken, verificarRol(['proveedor', 'admin']), productoController.eliminarProducto);

export default router;