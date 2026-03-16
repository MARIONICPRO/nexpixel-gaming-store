import { supabase } from '../config/db-config.js';

export const carritoController = {
  // ============================================
  // OBTENER CARRITO DEL USUARIO
  // ============================================
  async obtenerCarrito(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;

      // Obtener o crear carrito activo
      let { data: carrito, error: errorCarrito } = await supabase
        .from('carrito')
        .select('*')
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'activo')
        .single();

      // Si no existe carrito activo, crear uno nuevo
      if (!carrito) {
        const { data: nuevoCarrito, error: errorCrear } = await supabase
          .from('carrito')
          .insert([{
            id_cuenta: usuarioId,
            estado: 'activo'
          }])
          .select()
          .single();

        if (errorCrear) throw errorCrear;
        carrito = nuevoCarrito;
      }

      // Obtener items del carrito
      const { data: items, error: errorItems } = await supabase
        .from('carrito_items')
        .select(`
          *,
          producto: id_producto (
            id_producto,
            nombre_producto,
            precio,
            imagen_url,
            tipo_producto,
            plataforma: id_plataforma (nombre_plataforma),
            categoria: id_categoria (nombre_grupo),
            stock,
            estado
          )
        `)
        .eq('carrito_id', carrito.id);

      if (errorItems) throw errorItems;

      // Calcular totales
      let subtotal = 0;
      items?.forEach(item => {
        subtotal += (item.precio_unitario * item.cantidad);
      });

      res.json({
        success: true,
        carritoId: carrito.id,
        items: items || [],
        subtotal,
        total: subtotal,
        cantidadItems: items?.reduce((sum, item) => sum + item.cantidad, 0) || 0
      });

    } catch (error) {
      console.error('❌ Error obteniendo carrito:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener el carrito' 
      });
    }
  },

  // ============================================
  // AGREGAR PRODUCTO AL CARRITO
  // ============================================
  async agregarProducto(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;
      const { productoId, cantidad = 1 } = req.body;

      if (!productoId) {
        return res.status(400).json({ 
          success: false, 
          error: 'ID de producto requerido' 
        });
      }

      // Verificar que el producto existe y está activo
      const { data: producto, error: errorProducto } = await supabase
        .from('producto')
        .select('*')
        .eq('id_producto', productoId)
        .eq('estado', 'activo')
        .single();

      if (errorProducto || !producto) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado o no disponible' 
        });
      }

      // Verificar stock disponible
      if (producto.stock < cantidad) {
        return res.status(400).json({ 
          success: false, 
          error: 'No hay suficiente stock disponible' 
        });
      }

      // Obtener carrito activo
      let { data: carrito, error: errorCarrito } = await supabase
        .from('carrito')
        .select('*')
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'activo')
        .single();

      // Si no existe carrito, crear uno
      if (!carrito) {
        const { data: nuevoCarrito, error: errorCrear } = await supabase
          .from('carrito')
          .insert([{
            id_cuenta: usuarioId,
            estado: 'activo'
          }])
          .select()
          .single();

        if (errorCrear) throw errorCrear;
        carrito = nuevoCarrito;
      }

      // Verificar si el producto ya está en el carrito
      const { data: itemExistente, error: errorItem } = await supabase
        .from('carrito_items')
        .select('*')
        .eq('carrito_id', carrito.id)
        .eq('id_producto', productoId)
        .maybeSingle();

      if (errorItem) throw errorItem;

      if (itemExistente) {
        // Actualizar cantidad si ya existe
        const nuevaCantidad = itemExistente.cantidad + cantidad;

        // Verificar stock
        if (producto.stock < nuevaCantidad) {
          return res.status(400).json({ 
            success: false, 
            error: 'No hay suficiente stock disponible' 
          });
        }

        const { error: errorUpdate } = await supabase
          .from('carrito_items')
          .update({ cantidad: nuevaCantidad })
          .eq('id', itemExistente.id);

        if (errorUpdate) throw errorUpdate;
      } else {
        // Insertar nuevo item
        const { error: errorInsert } = await supabase
          .from('carrito_items')
          .insert([{
            carrito_id: carrito.id,
            id_producto: productoId,
            cantidad,
            precio_unitario: producto.precio
          }]);

        if (errorInsert) throw errorInsert;
      }

      // Registrar interacción para IA
      await supabase
        .from('interacciones_usuario')
        .insert([{
          id_usuario: usuarioId,
          id_producto: productoId,
          tipo_interaccion: 'carrito',
          valor: 3
        }]);

      res.json({
        success: true,
        message: 'Producto agregado al carrito'
      });

    } catch (error) {
      console.error('❌ Error agregando producto al carrito:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al agregar producto al carrito' 
      });
    }
  },

  // ============================================
  // ACTUALIZAR CANTIDAD DE UN ITEM
  // ============================================
  async actualizarCantidad(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;
      const { itemId, cantidad } = req.body;

      if (!itemId || cantidad === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'ID de item y cantidad requeridos' 
        });
      }

      if (cantidad < 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'La cantidad no puede ser negativa' 
        });
      }

      // Obtener el item del carrito
      const { data: item, error: errorItem } = await supabase
        .from('carrito_items')
        .select(`
          *,
          carrito!inner (
            id_cuenta
          ),
          producto: id_producto (
            stock
          )
        `)
        .eq('id', itemId)
        .single();

      if (errorItem || !item) {
        return res.status(404).json({ 
          success: false, 
          error: 'Item no encontrado' 
        });
      }

      // Verificar que el carrito pertenece al usuario
      if (item.carrito.id_cuenta !== usuarioId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este carrito' 
        });
      }

      if (cantidad === 0) {
        // Eliminar item si cantidad es 0
        const { error: errorDelete } = await supabase
          .from('carrito_items')
          .delete()
          .eq('id', itemId);

        if (errorDelete) throw errorDelete;

        return res.json({
          success: true,
          message: 'Producto eliminado del carrito'
        });
      }

      // Verificar stock
      if (item.producto.stock < cantidad) {
        return res.status(400).json({ 
          success: false, 
          error: 'No hay suficiente stock disponible' 
        });
      }

      // Actualizar cantidad
      const { error: errorUpdate } = await supabase
        .from('carrito_items')
        .update({ cantidad })
        .eq('id', itemId);

      if (errorUpdate) throw errorUpdate;

      res.json({
        success: true,
        message: 'Cantidad actualizada'
      });

    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar cantidad' 
      });
    }
  },

  // ============================================
  // ELIMINAR ITEM DEL CARRITO
  // ============================================
  async eliminarItem(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;
      const { itemId } = req.params;

      // Verificar que el item existe y pertenece al usuario
      const { data: item, error: errorItem } = await supabase
        .from('carrito_items')
        .select(`
          *,
          carrito!inner (
            id_cuenta
          )
        `)
        .eq('id', itemId)
        .single();

      if (errorItem || !item) {
        return res.status(404).json({ 
          success: false, 
          error: 'Item no encontrado' 
        });
      }

      if (item.carrito.id_cuenta !== usuarioId) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para eliminar este item' 
        });
      }

      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Producto eliminado del carrito'
      });

    } catch (error) {
      console.error('❌ Error eliminando item:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al eliminar producto del carrito' 
      });
    }
  },

  // ============================================
  // VACIAR CARRITO COMPLETAMENTE
  // ============================================
  async vaciarCarrito(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;

      // Obtener carrito activo
      const { data: carrito, error: errorCarrito } = await supabase
        .from('carrito')
        .select('id')
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'activo')
        .single();

      if (!carrito) {
        return res.json({
          success: true,
          message: 'El carrito ya está vacío'
        });
      }

      // Eliminar todos los items del carrito
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('carrito_id', carrito.id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Carrito vaciado correctamente'
      });

    } catch (error) {
      console.error('❌ Error vaciando carrito:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al vaciar el carrito' 
      });
    }
  },

  // ============================================
  // OBTENER CANTIDAD DE ITEMS EN EL CARRITO
  // ============================================
  async obtenerConteo(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;

      const { data: carrito, error: errorCarrito } = await supabase
        .from('carrito')
        .select('id')
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'activo')
        .single();

      if (!carrito) {
        return res.json({
          success: true,
          cantidad: 0
        });
      }

      const { data: items, error: errorItems } = await supabase
        .from('carrito_items')
        .select('cantidad')
        .eq('carrito_id', carrito.id);

      if (errorItems) throw errorItems;

      const cantidadTotal = items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

      res.json({
        success: true,
        cantidad: cantidadTotal
      });

    } catch (error) {
      console.error('❌ Error obteniendo conteo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener conteo del carrito' 
      });
    }
  }
};