import { supabase } from '../config/db-config.js';

// ============================================
// FUNCIONES DE SUPABASE STORAGE PARA PRODUCTOS
// ============================================

async function subirImagenProducto(file, nombreProducto, idProducto) {
    try {
        const extension = file.originalname.split('.').pop();
        const nombreLimpio = nombreProducto
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .substring(0, 50);
        
        const fileName = `productos/${nombreLimpio}-${idProducto}-${Date.now()}.${extension}`;
        
        const { data, error } = await supabase.storage
            .from('avatars') // 👈 CAMBIA A TU BUCKET
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        console.error('❌ Error subiendo imagen a Supabase:', error);
        throw error;
    }
}

async function eliminarImagenProducto(urlImagen) {
    try {
        if (!urlImagen) return;
        
        const pathParts = urlImagen.split('/avatars/');
        if (pathParts.length < 2) return;
        
        const filePath = pathParts[1];
        
        const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);
            
        if (error) console.error('Error eliminando imagen antigua:', error);
    } catch (error) {
        console.error('❌ Error eliminando imagen:', error);
    }
}

export const proveedorController = {
  // ============================================
  // OBTENER PRODUCTOS DEL PROVEEDOR
  // ============================================
  async obtenerMisProductos(req, res) {
    try {
      const proveedorId = req.usuario.id_usuario;

      const { data: productos, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (nombre_grupo),
          plataforma: id_plataforma (nombre_plataforma)
        `)
        .eq('id_proveedor', proveedorId)
        .eq('estado', 'activo')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const productosConCodigos = await Promise.all(
        (productos || []).map(async (producto) => {
          const { count } = await supabase
            .from('inventario_llaves')
            .select('*', { count: 'exact', head: true })
            .eq('id_producto', producto.id_producto)
            .eq('estado', 'disponible');

          return {
            ...producto,
            codigos_disponibles: count || 0
          };
        })
      );

      res.json({
        success: true,
        productos: productosConCodigos
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos del proveedor:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener productos' 
      });
    }
  },

  // ============================================
  // CREAR PRODUCTO (PROVEEDOR) - CON SUBIDA DE IMAGEN
  // ============================================
  async crearProducto(req, res) {
    try {
      // 🔥 DEBUG
      console.log('===== DEBUG CREAR PRODUCTO =====');
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);
      console.log('===============================');

      // Los campos vienen en req.body gracias a multer
      const {
        id_categoria,
        id_plataforma,
        nombre_producto,
        descripcion,
        precio,
        tipo_producto,
        stock,
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

      if (!id_plataforma) {
        return res.status(400).json({ 
          success: false, 
          error: 'Debes seleccionar una plataforma' 
        });
      }

      // 1. Crear el producto primero (sin imagen)
      const nuevoProducto = {
        id_proveedor: req.usuario.id_usuario,
        id_categoria: id_categoria || null,
        id_plataforma: parseInt(id_plataforma),
        nombre_producto,
        descripcion: descripcion || '',
        precio: parseFloat(precio),
        tipo_producto,
        stock: stock ? parseInt(stock) : 0,
        imagen_url: null,
        genero: genero || null,
        edicion: edicion || null,
        desarrollador: desarrollador || null,
        fecha_lanzamiento: fecha_lanzamiento || null,
        valor_tarjeta: valor_tarjeta ? parseFloat(valor_tarjeta) : null,
        estado: 'activo',
        fecha_creacion: new Date()
      };

      const { data: producto, error } = await supabase
        .from('producto')
        .insert([nuevoProducto])
        .select()
        .single();

      if (error) throw error;

      // 2. Si hay imagen, subir a Supabase y actualizar producto
      let imagen_url = null;
      if (req.file) {
        imagen_url = await subirImagenProducto(
          req.file, 
          nombre_producto, 
          producto.id_producto
        );
        
        const { error: updateError } = await supabase
          .from('producto')
          .update({ imagen_url: imagen_url })
          .eq('id_producto', producto.id_producto);
          
        if (updateError) throw updateError;
        
        producto.imagen_url = imagen_url;
      }

      // 3. Si hay stock, crear códigos automáticamente
      const stockNum = stock ? parseInt(stock) : 0;
      if (stockNum > 0 && producto) {
        const codigos = [];
        for (let i = 0; i < stockNum; i++) {
          codigos.push({
            id_producto: producto.id_producto,
            codigo: `COD-${producto.id_producto}-${i + 1}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            estado: 'disponible'
          });
        }

        await supabase
          .from('inventario_llaves')
          .insert(codigos);
      }

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        producto
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
  // ACTUALIZAR PRODUCTO - CON IMAGEN
  // ============================================
  async actualizarProducto(req, res) {
    try {
      const { id } = req.params;
      const proveedorId = req.usuario.id_usuario;
      const datosActualizar = { ...req.body };

      // Verificar que el producto pertenece al proveedor
      const { data: productoExistente, error: errorExistente } = await supabase
        .from('producto')
        .select('id_proveedor, imagen_url')
        .eq('id_producto', id)
        .single();

      if (errorExistente || !productoExistente) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      if (productoExistente.id_proveedor !== proveedorId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este producto' 
        });
      }

      // Si se subió una nueva imagen
      if (req.file) {
        // Eliminar imagen anterior si existe
        if (productoExistente.imagen_url) {
          await eliminarImagenProducto(productoExistente.imagen_url);
        }
        
        // Subir nueva imagen
        const nuevaImagenUrl = await subirImagenProducto(
          req.file, 
          datosActualizar.nombre_producto || 'producto', 
          id
        );
        datosActualizar.imagen_url = nuevaImagenUrl;
      }

      // Eliminar campos que no se deben actualizar
      delete datosActualizar.id_producto;
      delete datosActualizar.id_proveedor;
      delete datosActualizar.fecha_creacion;
      delete datosActualizar.ventas_totales;

      // Convertir números
      if (datosActualizar.precio) datosActualizar.precio = parseFloat(datosActualizar.precio);
      if (datosActualizar.stock) datosActualizar.stock = parseInt(datosActualizar.stock);
      if (datosActualizar.valor_tarjeta) datosActualizar.valor_tarjeta = parseFloat(datosActualizar.valor_tarjeta);
      if (datosActualizar.id_plataforma) datosActualizar.id_plataforma = parseInt(datosActualizar.id_plataforma);

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
      const proveedorId = req.usuario.id_usuario;

      const { data: productoExistente, error: errorExistente } = await supabase
        .from('producto')
        .select('id_proveedor, imagen_url')
        .eq('id_producto', id)
        .single();

      if (errorExistente || !productoExistente) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      if (productoExistente.id_proveedor !== proveedorId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para eliminar este producto' 
        });
      }

      // Eliminar imagen de Supabase si existe
      if (productoExistente.imagen_url) {
        await eliminarImagenProducto(productoExistente.imagen_url);
      }

      const { error } = await supabase
        .from('producto')
        .update({ estado: 'inactivo' })
        .eq('id_producto', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Producto eliminado correctamente'
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
  // OBTENER PRODUCTO POR ID (PROVEEDOR)
  // ============================================
  async obtenerProductoPorId(req, res) {
    try {
      const { id } = req.params;
      const proveedorId = req.usuario.id_usuario;

      const { data: producto, error } = await supabase
        .from('producto')
        .select(`
          *,
          categoria: id_categoria (nombre_grupo),
          plataforma: id_plataforma (nombre_plataforma)
        `)
        .eq('id_producto', id)
        .eq('id_proveedor', proveedorId)
        .single();

      if (error || !producto) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }

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
  // OBTENER CÓDIGOS DE UN PRODUCTO
  // ============================================
  async obtenerCodigos(req, res) {
    try {
      const { id } = req.params;
      const proveedorId = req.usuario.id_usuario;

      const { data: producto, error: errorProducto } = await supabase
        .from('producto')
        .select('id_proveedor')
        .eq('id_producto', id)
        .single();

      if (errorProducto || !producto) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      if (producto.id_proveedor !== proveedorId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para ver estos códigos' 
        });
      }

      const { data: codigos, error } = await supabase
        .from('inventario_llaves')
        .select('*')
        .eq('id_producto', id)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const disponibles = codigos?.filter(c => c.estado === 'disponible').length || 0;
      const vendidos = codigos?.filter(c => c.estado === 'vendida').length || 0;

      res.json({
        success: true,
        codigos: codigos || [],
        stats: {
          total: codigos?.length || 0,
          disponibles,
          vendidos
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo códigos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener códigos' 
      });
    }
  },

  // ============================================
  // AGREGAR CÓDIGOS A UN PRODUCTO
  // ============================================
  async agregarCodigos(req, res) {
    try {
      const { id } = req.params;
      const { codigos, fecha_vencimiento } = req.body;
      const proveedorId = req.usuario.id_usuario;

      if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Debes proporcionar al menos un código' 
        });
      }

      const { data: producto, error: errorProducto } = await supabase
        .from('producto')
        .select('id_proveedor, stock')
        .eq('id_producto', id)
        .single();

      if (errorProducto || !producto) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      if (producto.id_proveedor !== proveedorId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este producto' 
        });
      }

      const codigosParaInsertar = codigos.map(codigo => ({
        id_producto: parseInt(id),
        codigo: codigo.trim(),
        estado: 'disponible',
        fecha_vencimiento: fecha_vencimiento || null
      }));

      const { data, error } = await supabase
        .from('inventario_llaves')
        .insert(codigosParaInsertar)
        .select();

      if (error) throw error;

      await supabase
        .from('producto')
        .update({ stock: (producto.stock || 0) + codigos.length })
        .eq('id_producto', id);

      res.json({
        success: true,
        message: `${codigos.length} códigos agregados correctamente`,
        codigos: data
      });

    } catch (error) {
      console.error('❌ Error agregando códigos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al agregar códigos' 
      });
    }
  },

  // ============================================
  // OBTENER ESTADÍSTICAS DEL PROVEEDOR
  // ============================================
  async obtenerStats(req, res) {
    try {
      const proveedorId = req.usuario.id_usuario;

      const { count: totalProductos, error: errorProductos } = await supabase
        .from('producto')
        .select('*', { count: 'exact', head: true })
        .eq('id_proveedor', proveedorId)
        .eq('estado', 'activo');

      if (errorProductos) throw errorProductos;

      const { data: productos, error: errorProductosList } = await supabase
        .from('producto')
        .select('id_producto')
        .eq('id_proveedor', proveedorId);

      if (errorProductosList) throw errorProductosList;

      let totalCodigosDisponibles = 0;
      if (productos && productos.length > 0) {
        const idsProductos = productos.map(p => p.id_producto);
        
        const { count, error: errorCodigos } = await supabase
          .from('inventario_llaves')
          .select('*', { count: 'exact', head: true })
          .in('id_producto', idsProductos)
          .eq('estado', 'disponible');

        if (!errorCodigos) {
          totalCodigosDisponibles = count || 0;
        }
      }

      let totalVentas = 0;
      let ingresosTotales = 0;

      if (productos && productos.length > 0) {
        const idsProductos = productos.map(p => p.id_producto);

        const { data: ventas, error: errorVentas } = await supabase
          .from('detalle_compra')
          .select(`
            cantidad,
            precio_unitario
          `)
          .in('id_producto', idsProductos);

        if (!errorVentas && ventas) {
          totalVentas = ventas.reduce((sum, v) => sum + (v.cantidad || 1), 0);
          ingresosTotales = ventas.reduce((sum, v) => sum + (v.precio_unitario * (v.cantidad || 1)), 0);
        }
      }

      res.json({
        success: true,
        stats: {
          totalProductos: totalProductos || 0,
          totalCodigosDisponibles,
          totalVentas,
          ingresosTotales
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener estadísticas' 
      });
    }
  },

  // ============================================
  // OBTENER VENTAS DEL PROVEEDOR
  // ============================================
  async obtenerVentas(req, res) {
    try {
      const proveedorId = req.usuario.id_usuario;

      const { data: productos, error: errorProductos } = await supabase
        .from('producto')
        .select('id_producto, nombre_producto')
        .eq('id_proveedor', proveedorId);

      if (errorProductos) throw errorProductos;

      if (!productos || productos.length === 0) {
        return res.json({
          success: true,
          ventas: [],
          totalVentas: 0,
          totalIngresos: 0
        });
      }

      const idsProductos = productos.map(p => p.id_producto);

      const { data: ventas, error: errorVentas } = await supabase
        .from('detalle_compra')
        .select(`
          *,
          compra: id_compra (
            id_compra,
            fecha_compra,
            id_cuenta,
            estado
          ),
          producto: id_producto (
            id_producto,
            nombre_producto,
            precio
          )
        `)
        .in('id_producto', idsProductos)
        .order('id_detail', { ascending: false });

      if (errorVentas) throw errorVentas;

      const ventasPorProducto = {};
      let totalIngresos = 0;

      (ventas || []).forEach(venta => {
        const productoId = venta.id_producto;
        const producto = productos.find(p => p.id_producto === productoId);
        const subtotal = venta.precio_unitario * (venta.cantidad || 1);
        
        totalIngresos += subtotal;

        if (!ventasPorProducto[productoId]) {
          ventasPorProducto[productoId] = {
            producto: producto?.nombre_producto || 'Producto',
            cantidad: 0,
            ingresos: 0,
            ventas: []
          };
        }

        ventasPorProducto[productoId].cantidad += venta.cantidad || 1;
        ventasPorProducto[productoId].ingresos += subtotal;
        ventasPorProducto[productoId].ventas.push({
          id: venta.id_detail,
          fecha: venta.compra?.fecha_compra,
          cantidad: venta.cantidad || 1,
          precio: venta.precio_unitario,
          subtotal
        });
      });

      res.json({
        success: true,
        ventas: ventas || [],
        ventasPorProducto: Object.values(ventasPorProducto),
        totalVentas: ventas?.length || 0,
        totalIngresos
      });

    } catch (error) {
      console.error('❌ Error obteniendo ventas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener ventas' 
      });
    }
  },

  // ============================================
  // OBTENER PLATAFORMAS (para selectores)
  // ============================================
  async obtenerPlataformas(req, res) {
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
  },

  // ============================================
  // OBTENER CATEGORÍAS (para selectores)
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
  }
};