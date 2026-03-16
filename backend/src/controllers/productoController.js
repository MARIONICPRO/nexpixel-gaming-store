import { supabase } from '../config/db-config.js';

export const productoController = {
  // ============================================
  // OBTENER TODOS LOS PRODUCTOS (CON FILTROS)
  // ============================================
  async obtenerProductos(req, res) {
    try {
      const { 
        tipo, 
        plataforma, 
        precio_min, 
        precio_max, 
        categoria,
        proveedor,
        busqueda,
        limite = 20,
        pagina = 1 
      } = req.query;

      let query = supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (id_categoria, nombre_grupo),
          plataforma: id_plataforma (id_plataforma, nombre_plataforma)
        `, { count: 'exact' })
        .eq('estado', 'activo');

      // Aplicar filtros
      if (tipo) query = query.eq('tipo_producto', tipo);
      if (plataforma) query = query.eq('id_plataforma', plataforma);
      if (categoria) query = query.eq('id_categoria', categoria);
      if (proveedor) query = query.eq('id_proveedor', proveedor);
      if (precio_min) query = query.gte('precio', precio_min);
      if (precio_max) query = query.lte('precio', precio_max);
      
      // Búsqueda por texto
      if (busqueda) {
        query = query.ilike('nombre_producto', `%${busqueda}%`);
      }

      // Paginación
      const from = (pagina - 1) * limite;
      const to = from + limite - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        productos: data || [],
        paginacion: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total: count,
          paginas: Math.ceil(count / limite)
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener productos' 
      });
    }
  },

  // ============================================
  // OBTENER JUEGOS RECIENTES
  // ============================================
  async obtenerJuegosRecientes(req, res) {
    try {
      const { limite = 8 } = req.query;

      const { data, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (nombre_grupo),
          plataforma: id_plataforma (nombre_plataforma)
        `)
        .eq('tipo_producto', 'Juego')
        .eq('estado', 'activo')
        .order('fecha_creacion', { ascending: false })
        .limit(limite);

      if (error) throw error;

      res.json({
        success: true,
        productos: data || []
      });

    } catch (error) {
      console.error('❌ Error obteniendo juegos recientes:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener juegos recientes' 
      });
    }
  },

  // ============================================
  // OBTENER PRODUCTOS POPULARES (MÁS VENDIDOS)
  // ============================================
  async obtenerProductosPopulares(req, res) {
    try {
      const { limite = 10 } = req.query;

      const { data, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (nombre_grupo),
          plataforma: id_plataforma (nombre_plataforma)
        `)
        .eq('estado', 'activo')
        .order('ventas_totales', { ascending: false })
        .limit(limite);

      if (error) throw error;

      res.json({
        success: true,
        productos: data || []
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos populares:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener productos populares' 
      });
    }
  },

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================
  async obtenerProductoPorId(req, res) {
    try {
      const { id } = req.params;

      const { data: producto, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (id_categoria, nombre_grupo),
          plataforma: id_plataforma (id_plataforma, nombre_plataforma),
          proveedor: id_proveedor (id_usuario, nombre, email, empresa)
        `)
        .eq('id_producto', id)
        .eq('estado', 'activo')
        .single();

      if (error || !producto) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      // Incrementar visitas (async, no esperamos respuesta)
      supabase
        .from('producto')
        .update({ visitas: (producto.visitas || 0) + 1 })
        .eq('id_producto', id)
        .then()
        .catch(err => console.error('Error incrementando visitas:', err));

      res.json({
        success: true,
        producto
      });

    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener producto' 
      });
    }
  },

  // ============================================
  // OBTENER PRODUCTOS SIMILARES
  // ============================================
  async obtenerProductosSimilares(req, res) {
    try {
      const { id } = req.params;
      const { limite = 4 } = req.query;

      // Primero obtener el producto actual
      const { data: producto, error: errorProducto } = await supabase
        .from('producto')
        .select('id_categoria')
        .eq('id_producto', id)
        .single();

      if (errorProducto || !producto) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      // Buscar productos de la misma categoría
      const { data, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (nombre_grupo),
          plataforma: id_plataforma (nombre_plataforma)
        `)
        .eq('id_categoria', producto.id_categoria)
        .eq('estado', 'activo')
        .neq('id_producto', id)
        .limit(limite);

      if (error) throw error;

      res.json({
        success: true,
        productos: data || []
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos similares:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener productos similares' 
      });
    }
  },

  // ============================================
  // CREAR PRODUCTO (PARA PROVEEDORES)
  // ============================================
  async crearProducto(req, res) {
    try {
      const {
        id_categoria,
        id_plataforma,
        nombre_producto,
        descripcion,
        precio,
        tipo_producto,
        stock,
        imagen_url,
        genero,
        edicion,
        desarrollador,
        fecha_lanzamiento,
        valor_tarjeta
      } = req.body;

      // Validar campos obligatorios
      if (!nombre_producto || !precio || !tipo_producto) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nombre, precio y tipo son obligatorios' 
        });
      }

      const nuevoProducto = {
        id_proveedor: req.usuario.id_usuario,
        id_categoria: id_categoria || null,
        id_plataforma: id_plataforma || null,
        nombre_producto,
        descripcion: descripcion || '',
        precio,
        tipo_producto,
        stock: stock || 0,
        imagen_url: imagen_url || null,
        genero: genero || null,
        edicion: edicion || null,
        desarrollador: desarrollador || null,
        fecha_lanzamiento: fecha_lanzamiento || null,
        valor_tarjeta: valor_tarjeta || null,
        estado: 'activo',
        fecha_creacion: new Date()
      };

      const { data, error } = await supabase
        .from('producto')
        .insert([nuevoProducto])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        producto: data
      });

    } catch (error) {
      console.error('❌ Error creando producto:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al crear producto' 
      });
    }
  },

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  async actualizarProducto(req, res) {
    try {
      const { id } = req.params;
      const datosActualizar = req.body;

      // Verificar que el producto existe y pertenece al proveedor (o es admin)
      const { data: productoExistente, error: errorExistente } = await supabase
        .from('producto')
        .select('id_proveedor')
        .eq('id_producto', id)
        .single();

      if (errorExistente || !productoExistente) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      // Verificar permisos (solo el propietario o admin puede modificar)
      if (productoExistente.id_proveedor !== req.usuario.id_usuario && 
          req.usuario.tipo_usuario !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este producto' 
        });
      }

      // Eliminar campos que no se deben actualizar
      delete datosActualizar.id_producto;
      delete datosActualizar.id_proveedor;
      delete datosActualizar.fecha_creacion;
      delete datosActualizar.ventas_totales;

      const { data, error } = await supabase
        .from('producto')
        .update(datosActualizar)
        .eq('id_producto', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Producto actualizado correctamente',
        producto: data
      });

    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar producto' 
      });
    }
  },

  // ============================================
  // ELIMINAR PRODUCTO (DESACTIVAR)
  // ============================================
  async eliminarProducto(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el producto existe
      const { data: productoExistente, error: errorExistente } = await supabase
        .from('producto')
        .select('id_proveedor')
        .eq('id_producto', id)
        .single();

      if (errorExistente || !productoExistente) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      // Verificar permisos
      if (productoExistente.id_proveedor !== req.usuario.id_usuario && 
          req.usuario.tipo_usuario !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para eliminar este producto' 
        });
      }

      // Desactivar producto (no eliminar físicamente)
      const { error } = await supabase
        .from('producto')
        .update({ estado: 'inactivo' })
        .eq('id_producto', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Producto desactivado correctamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al eliminar producto' 
      });
    }
  },

  // ============================================
  // OBTENER CATEGORÍAS
  // ============================================
  async obtenerCategorias(req, res) {
    try {
      const { data, error } = await supabase
        .from('categoria')
        .select('*')
        .order('id_categoria');

      if (error) throw error;

      res.json({
        success: true,
        categorias: data || []
      });

    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener categorías' 
      });
    }
  },

  // ============================================
  // OBTENER PLATAFORMAS
  // ============================================
  async obtenerPlataformas(req, res) {
    try {
      const { data, error } = await supabase
        .from('plataforma')
        .select('*')
        .order('id_plataforma');

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
  }
};