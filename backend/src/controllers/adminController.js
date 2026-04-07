// backend/src/controllers/adminController.js
import { supabase } from '../config/db-config.js';

export const adminController = {
  // ============================================
  // ESTADÍSTICAS
  // ============================================
  async getStats(req, res) {
    try {
      const { count: totalUsuarios } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      const { count: totalProductos } = await supabase
        .from('producto')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

      const { count: totalProveedores } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_usuario', 'proveedor');

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const { data: ventasHoy } = await supabase
        .from('compra')
        .select('total')
        .gte('fecha_compra', hoy.toISOString())
        .lt('fecha_compra', manana.toISOString());

      const ventasHoyCount = ventasHoy?.length || 0;
      const ingresosHoy = ventasHoy?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

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
      console.error('Error en getStats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ============================================
  // USUARIOS
  // ============================================
  async getUsuarios(req, res) {
    try {
      const { search = '' } = req.query;
      
      let query = supabase
        .from('usuarios')
        .select('id_usuario, nombre, email, tipo_usuario, foto_perfil, telefono, empresa, nit, verificado, fecha_registro, ultima_conexion, estado')
        .order('fecha_registro', { ascending: false });
      
      if (search) {
        query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data: usuarios, error } = await query;
      if (error) throw error;
      
      res.json({ success: true, usuarios: usuarios || [] });
    } catch (error) {
      console.error('Error en getUsuarios:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async inactivarUsuario(req, res) {
    try {
      const { id } = req.params;
      
      if (req.usuario.id_usuario === parseInt(id)) {
        return res.status(400).json({ success: false, error: 'No puedes inactivarte a ti mismo' });
      }
      
      const { data, error } = await supabase
        .from('usuarios')
        .update({ estado: 'inactivo' })
        .eq('id_usuario', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      res.json({ success: true, message: 'Usuario inactivado correctamente' });
    } catch (error) {
      console.error('Error inactivando usuario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async activarUsuario(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('usuarios')
        .update({ estado: 'activo' })
        .eq('id_usuario', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      res.json({ success: true, message: 'Usuario activado correctamente' });
    } catch (error) {
      console.error('Error activando usuario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async cambiarRolAdmin(req, res) {
    try {
      const { id } = req.params;
      
      if (req.usuario.id_usuario === parseInt(id)) {
        return res.status(400).json({ success: false, error: 'No puedes cambiar tu propio rol' });
      }
      
      const { data, error } = await supabase
        .from('usuarios')
        .update({ tipo_usuario: 'admin' })
        .eq('id_usuario', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      res.json({ success: true, message: 'Usuario ahora es administrador' });
    } catch (error) {
      console.error('Error cambiando rol:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;
      
      if (req.usuario.id_usuario === parseInt(id)) {
        return res.status(400).json({ success: false, error: 'No puedes eliminarte a ti mismo' });
      }
      
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id_usuario', id);
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ============================================
  // PROVEEDORES
  // ============================================
  async getProveedores(req, res) {
    try {
      const { search = '' } = req.query;
      
      let query = supabase
        .from('usuarios')
        .select('*')
        .eq('tipo_usuario', 'proveedor')
        .order('fecha_registro', { ascending: false });
      
      if (search) {
        query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,empresa.ilike.%${search}%`);
      }
      
      const { data: proveedores, error } = await query;
      if (error) throw error;
      
      res.json({ success: true, proveedores: proveedores || [] });
    } catch (error) {
      console.error('Error en getProveedores:', error);
      res.status(500).json({ success: false, error: error.message });
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
        return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
      }
      
      res.json({ success: true, message: 'Proveedor verificado correctamente' });
    } catch (error) {
      console.error('Error verificando proveedor:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ============================================
  // PRODUCTOS
  // ============================================
  async getProductos(req, res) {
    try {
      const { search = '', estado = 'todos' } = req.query;
      
      let query = supabase
        .from('producto')
        .select(`
          *,
          plataforma:id_plataforma (nombre_plataforma),
          categoria:id_categoria (nombre_grupo),
          proveedor:id_proveedor (nombre, email, empresa)
        `)
        .order('fecha_creacion', { ascending: false });
      
      if (estado !== 'todos') {
        query = query.eq('estado', estado);
      }
      
      if (search) {
        query = query.ilike('nombre_producto', `%${search}%`);
      }
      
      const { data: productos, error } = await query;
      if (error) throw error;
      
      res.json({ success: true, productos: productos || [] });
    } catch (error) {
      console.error('Error en getProductos:', error);
      res.status(500).json({ success: false, error: error.message });
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
        return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      }
      
      res.json({ success: true, message: 'Producto desactivado correctamente' });
    } catch (error) {
      console.error('Error desactivando producto:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async activarProducto(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('producto')
        .update({ estado: 'activo' })
        .eq('id_producto', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      }
      
      res.json({ success: true, message: 'Producto activado correctamente' });
    } catch (error) {
      console.error('Error activando producto:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ============================================
  // VENTAS
  // ============================================
  async getVentas(req, res) {
    try {
      const { data: ventas, error } = await supabase
        .from('compra')
        .select(`
          *,
          usuario:id_cuenta (email, nombre),
          detalle_compra (*, producto:id_producto (nombre_producto))
        `)
        .order('fecha_compra', { ascending: false });
      
      if (error) throw error;
      
      res.json({ success: true, ventas: ventas || [] });
    } catch (error) {
      console.error('Error en getVentas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async actualizarEstadoCompra(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const estadosPermitidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado', 'reembolsado'];
      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado no válido' });
      }
      
      const { data, error } = await supabase
        .from('compra')
        .update({ estado })
        .eq('id_compra', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Compra no encontrada' });
      }
      
      res.json({ success: true, message: 'Estado actualizado correctamente' });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ============================================
  // DEVOLUCIONES
  // ============================================
  async getDevoluciones(req, res) {
    try {
      const { data: devoluciones, error } = await supabase
        .from('devolucion')
        .select(`
          *,
          usuario:id_usuario (email, nombre),
          compra:id_compra (total, fecha_compra)
        `)
        .order('fecha_solicitud', { ascending: false });
      
      if (error) throw error;
      
      res.json({ success: true, devoluciones: devoluciones || [] });
    } catch (error) {
      console.error('Error en getDevoluciones:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async aprobarDevolucion(req, res) {
    try {
      const { id } = req.params;
      
      const { data: devolucion, error: errorGet } = await supabase
        .from('devolucion')
        .select('*')
        .eq('id_devolucion', id)
        .single();
      
      if (errorGet || !devolucion) {
        return res.status(404).json({ success: false, error: 'Devolución no encontrada' });
      }
      
      if (devolucion.estado !== 'pendiente') {
        return res.status(400).json({ success: false, error: 'Esta devolución ya fue procesada' });
      }
      
      await supabase
        .from('devolucion')
        .update({ estado: 'aprobada', fecha_resolucion: new Date() })
        .eq('id_devolucion', id);
      
      await supabase
        .from('compra')
        .update({ estado: 'reembolsado' })
        .eq('id_compra', devolucion.id_compra);
      
      res.json({ success: true, message: 'Devolución aprobada correctamente' });
    } catch (error) {
      console.error('Error aprobando devolución:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async rechazarDevolucion(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('devolucion')
        .update({ estado: 'rechazada', fecha_resolucion: new Date() })
        .eq('id_devolucion', id)
        .eq('estado', 'pendiente')
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'Devolución no encontrada o ya procesada' });
      }
      
      res.json({ success: true, message: 'Devolución rechazada correctamente' });
    } catch (error) {
      console.error('Error rechazando devolución:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};