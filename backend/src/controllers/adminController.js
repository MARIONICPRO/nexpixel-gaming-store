import { supabase } from '../config/db-config.js';

export const adminController = {
  // ============================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ============================================
  async getStats(req, res) {
    try {
      // Obtener total de usuarios
      const { count: totalUsuarios, error: errorUsuarios } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      if (errorUsuarios) throw errorUsuarios;

      // Obtener total de productos
      const { count: totalProductos, error: errorProductos } = await supabase
        .from('producto')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

      if (errorProductos) throw errorProductos;

      // Obtener total de proveedores
      const { count: totalProveedores, error: errorProveedores } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_usuario', 'proveedor');

      if (errorProveedores) throw errorProveedores;

      // Obtener ventas de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const { data: ventasHoy, error: errorVentas } = await supabase
        .from('compra')
        .select('total')
        .gte('fecha_compra', hoy.toISOString())
        .lt('fecha_compra', manana.toISOString());

      if (errorVentas) throw errorVentas;

      const ventasHoyCount = ventasHoy?.length || 0;
      const ingresosHoy = ventasHoy?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;

      res.json({
        success: true,
        stats: {
          totalUsuarios: totalUsuarios || 0,
          totalProductos: totalProductos || 0,
          totalProveedores: totalProveedores || 0,
          ventasHoy: ventasHoyCount,
          ingresosHoy
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener estadísticas' 
      });
    }
  },

  // ============================================
  // GESTIÓN DE USUARIOS
  // ============================================
  async getUsuarios(req, res) {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select(`
          id_usuario,
          nombre,
          email,
          tipo_usuario,
          foto_perfil,
          telefono,
          empresa,
          nit,
          verificado,
          fecha_registro,
          ultima_conexion
        `)
        .order('fecha_registro', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        usuarios: usuarios || []
      });

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener usuarios' 
      });
    }
  },

  async getProveedores(req, res) {
    try {
      const { data: proveedores, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo_usuario', 'proveedor')
        .order('fecha_registro', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        proveedores: proveedores || []
      });

    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener proveedores' 
      });
    }
  },

  async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;

      // Verificar que no sea el propio admin
      if (req.usuario.id_usuario === parseInt(id)) {
        return res.status(400).json({ 
          success: false, 
          error: 'No puedes eliminarte a ti mismo' 
        });
      }

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id_usuario', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });

    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al eliminar usuario' 
      });
    }
  },

  async verificarProveedor(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('usuarios')
        .update({ verificado: true })
        .eq('id_usuario', id)
        .eq('tipo_usuario', 'proveedor')
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Proveedor no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Proveedor verificado correctamente'
      });

    } catch (error) {
      console.error('Error verificando proveedor:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al verificar proveedor' 
      });
    }
  },

  // ============================================
  // GESTIÓN DE PRODUCTOS
  // ============================================
  async getProductos(req, res) {
    try {
      const { data: productos, error } = await supabase
        .from('producto')
        .select(`
          *,
          plataforma: id_plataforma (nombre_plataforma),
          categoria: id_categoria (nombre_grupo),
          proveedor: id_proveedor (nombre, email, empresa)
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        productos: productos || []
      });

    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener productos' 
      });
    }
  },

  async desactivarProducto(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('producto')
        .update({ estado: 'inactivo' })
        .eq('id_producto', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Producto desactivado correctamente'
      });

    } catch (error) {
      console.error('Error desactivando producto:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al desactivar producto' 
      });
    }
  },

  // ============================================
  // GESTIÓN DE COMPRAS
  // ============================================
  async getVentas(req, res) {
    try {
      const { data: ventas, error } = await supabase
        .from('compra')
        .select(`
          *,
          usuario: id_cuenta (email, nombre),
          detalle_compra (
            *,
            producto: id_producto (nombre_producto)
          )
        `)
        .order('fecha_compra', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        ventas: ventas || []
      });

    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener ventas' 
      });
    }
  },

  async actualizarEstadoCompra(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const estadosPermitidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
      
      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Estado no válido' 
        });
      }

      const { data, error } = await supabase
        .from('compra')
        .update({ estado })
        .eq('id_compra', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Compra no encontrada' 
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente'
      });

    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar estado' 
      });
    }
  },

  // ============================================
  // GESTIÓN DE DEVOLUCIONES
  // ============================================
  async getDevoluciones(req, res) {
    try {
      const { data: devoluciones, error } = await supabase
        .from('devolucion')
        .select(`
          *,
          usuario: id_usuario (email, nombre),
          compra: id_compra (total, fecha_compra)
        `)
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        devoluciones: devoluciones || []
      });

    } catch (error) {
      console.error('Error obteniendo devoluciones:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener devoluciones' 
      });
    }
  },

  async aprobarDevolucion(req, res) {
    try {
      const { id } = req.params;

      // Obtener la devolución
      const { data: devolucion, error: errorDevolucion } = await supabase
        .from('devolucion')
        .select('*')
        .eq('id_devolucion', id)
        .single();

      if (errorDevolucion || !devolucion) {
        return res.status(404).json({ 
          success: false, 
          error: 'Devolución no encontrada' 
        });
      }

      if (devolucion.estado !== 'pendiente') {
        return res.status(400).json({ 
          success: false, 
          error: 'Esta devolución ya fue procesada' 
        });
      }

      // Actualizar estado de la devolución
      const { error: errorUpdate } = await supabase
        .from('devolucion')
        .update({ 
          estado: 'aprobada',
          fecha_resolucion: new Date()
        })
        .eq('id_devolucion', id);

      if (errorUpdate) throw errorUpdate;

      // Actualizar estado de la compra
      await supabase
        .from('compra')
        .update({ estado: 'reembolsado' })
        .eq('id_compra', devolucion.id_compra);

      res.json({
        success: true,
        message: 'Devolución aprobada correctamente'
      });

    } catch (error) {
      console.error('Error aprobando devolución:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al aprobar devolución' 
      });
    }
  },

  async rechazarDevolucion(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('devolucion')
        .update({ 
          estado: 'rechazada',
          fecha_resolucion: new Date()
        })
        .eq('id_devolucion', id)
        .eq('estado', 'pendiente')
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Devolución no encontrada o ya procesada' 
        });
      }

      res.json({
        success: true,
        message: 'Devolución rechazada correctamente'
      });

    } catch (error) {
      console.error('Error rechazando devolución:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al rechazar devolución' 
      });
    }
  }
};