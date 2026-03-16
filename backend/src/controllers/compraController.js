import { supabase } from '../config/db-config.js';

export const compraController = {
  // ============================================
  // PROCESAR UNA NUEVA COMPRA
  // ============================================
  async procesarCompra(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;
      const { items, metodo_pago, datos_personales } = req.body;

      // Validaciones básicas
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'El carrito no puede estar vacío' 
        });
      }

      if (!metodo_pago) {
        return res.status(400).json({ 
          success: false, 
          error: 'Debes seleccionar un método de pago' 
        });
      }

      if (!datos_personales?.nombre || !datos_personales?.documento || !datos_personales?.email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Completa todos los datos personales' 
        });
      }

      // Calcular total
      let total = 0;
      for (const item of items) {
        total += item.precio * item.cantidad;
      }

      // Crear la compra
      const { data: compra, error: errorCompra } = await supabase
        .from('compra')
        .insert([{
          id_cuenta: usuarioId,
          total,
          subtotal: total,
          metodo_pago,
          estado: 'pendiente',
          notas: JSON.stringify(datos_personales)
        }])
        .select()
        .single();

      if (errorCompra) throw errorCompra;

      // Procesar cada item
      const detallesCompra = [];
      const codigosAsignados = [];

      for (const item of items) {
        // Obtener códigos disponibles del producto
        const { data: codigos, error: errorCodigos } = await supabase
          .from('inventario_llaves')
          .select('*')
          .eq('id_producto', item.productoId)
          .eq('estado', 'disponible')
          .limit(item.cantidad);

        if (errorCodigos) throw errorCodigos;

        if (!codigos || codigos.length < item.cantidad) {
          // Si no hay suficientes códigos, cancelar la compra
          await supabase
            .from('compra')
            .delete()
            .eq('id_compra', compra.id_compra);

          return res.status(400).json({ 
            success: false, 
            error: `No hay suficientes códigos disponibles para ${item.productoId}` 
          });
        }

        // Crear detalle de compra
        const { data: detalle, error: errorDetalle } = await supabase
          .from('detalle_compra')
          .insert([{
            id_compra: compra.id_compra,
            id_producto: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: item.precio * item.cantidad
          }])
          .select()
          .single();

        if (errorDetalle) throw errorDetalle;

        detallesCompra.push(detalle);

        // Marcar códigos como vendidos
        for (let i = 0; i < item.cantidad; i++) {
          const { error: errorUpdate } = await supabase
            .from('inventario_llaves')
            .update({ 
              estado: 'vendida', 
              id_detalle: detalle.id_detail 
            })
            .eq('id_llave', codigos[i].id_llave);

          if (errorUpdate) throw errorUpdate;

          codigosAsignados.push({
            ...codigos[i],
            id_detalle: detalle.id_detail
          });
        }

        // Actualizar stock y ventas del producto
        await supabase
          .from('producto')
          .update({ 
            stock: supabase.raw(`stock - ${item.cantidad}`),
            ventas_totales: supabase.raw(`ventas_totales + ${item.cantidad}`)
          })
          .eq('id_producto', item.productoId);
      }

      // Registrar el pago
      const { error: errorPago } = await supabase
        .from('pago')
        .insert([{
          id_compra: compra.id_compra,
          id_metodo: metodo_pago,
          monto: total,
          estado_pago: 'completado'
        }]);

      if (errorPago) throw errorPago;

      // Registrar en historial
      await supabase
        .from('historial_ventas')
        .insert([{
          id_cuenta: usuarioId,
          id_compra: compra.id_compra,
          leido: false
        }]);

      // Registrar interacciones para IA
      for (const item of items) {
        await supabase
          .from('interacciones_usuario')
          .insert([{
            id_usuario: usuarioId,
            id_producto: item.productoId,
            tipo_interaccion: 'compra',
            valor: 5
          }]);
      }

      // Vaciar carrito del usuario
      const { data: carrito } = await supabase
        .from('carrito')
        .select('id')
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'activo')
        .single();

      if (carrito) {
        await supabase
          .from('carrito_items')
          .delete()
          .eq('carrito_id', carrito.id);

        await supabase
          .from('carrito')
          .update({ estado: 'convertido' })
          .eq('id', carrito.id);
      }

      // Respuesta exitosa
      res.json({
        success: true,
        message: 'Compra realizada con éxito',
        compra: {
          id: compra.id_compra,
          fecha: compra.fecha_compra,
          total,
          metodo_pago,
          estado: compra.estado
        },
        codigos: codigosAsignados.map(c => ({
          producto: c.id_producto,
          codigo: c.codigo
        }))
      });

    } catch (error) {
      console.error('❌ Error procesando compra:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al procesar la compra' 
      });
    }
  },

  // ============================================
  // OBTENER HISTORIAL DE COMPRAS DEL USUARIO
  // ============================================
  async obtenerHistorial(req, res) {
    try {
      const usuarioId = req.usuario.id_usuario;

      const { data: compras, error } = await supabase
        .from('compra')
        .select(`
          *,
          detalle_compra (
            *,
            producto: id_producto (
              id_producto,
              nombre_producto,
              imagen_url,
              tipo_producto
            )
          ),
          pago (
            id_pago,
            estado_pago,
            id_metodo
          )
        `)
        .eq('id_cuenta', usuarioId)
        .order('fecha_compra', { ascending: false });

      if (error) throw error;

      // Marcar historial como leído
      await supabase
        .from('historial_ventas')
        .update({ leido: true })
        .eq('id_cuenta', usuarioId);

      res.json({
        success: true,
        compras: compras || []
      });

    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener historial de compras' 
      });
    }
  },

  // ============================================
  // OBTENER DETALLE DE UNA COMPRA ESPECÍFICA
  // ============================================
  async obtenerCompraPorId(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id_usuario;

      const { data: compra, error } = await supabase
        .from('compra')
        .select(`
          *,
          detalle_compra (
            *,
            producto: id_producto (
              id_producto,
              nombre_producto,
              imagen_url,
              descripcion,
              tipo_producto,
              plataforma: id_plataforma (nombre_plataforma)
            )
          ),
          pago (
            id_pago,
            estado_pago,
            id_metodo,
            fecha_pago
          )
        `)
        .eq('id_compra', id)
        .single();

      if (error || !compra) {
        return res.status(404).json({ 
          success: false, 
          error: 'Compra no encontrada' 
        });
      }

      // Verificar que la compra pertenece al usuario o es admin
      if (compra.id_cuenta !== usuarioId && req.usuario.tipo_usuario !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para ver esta compra' 
        });
      }

      // Obtener códigos entregados
      const idsDetalle = compra.detalle_compra.map(d => d.id_detail);
      
      const { data: codigos, error: errorCodigos } = await supabase
        .from('inventario_llaves')
        .select('codigo, id_producto, estado')
        .in('id_detalle', idsDetalle);

      if (!errorCodigos && codigos) {
        compra.codigos_entregados = codigos;
      }

      res.json({
        success: true,
        compra
      });

    } catch (error) {
      console.error('❌ Error obteniendo compra:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener la compra' 
      });
    }
  },

  // ============================================
  // SOLICITAR DEVOLUCIÓN DE UNA COMPRA
  // ============================================
  async solicitarDevolucion(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const usuarioId = req.usuario.id_usuario;

      if (!motivo) {
        return res.status(400).json({ 
          success: false, 
          error: 'Debes proporcionar un motivo para la devolución' 
        });
      }

      // Verificar que la compra existe y pertenece al usuario
      const { data: compra, error: errorCompra } = await supabase
        .from('compra')
        .select('*')
        .eq('id_compra', id)
        .eq('id_cuenta', usuarioId)
        .single();

      if (errorCompra || !compra) {
        return res.status(404).json({ 
          success: false, 
          error: 'Compra no encontrada' 
        });
      }

      // Verificar que la compra no esté ya devuelta o cancelada
      if (compra.estado === 'reembolsado' || compra.estado === 'cancelado') {
        return res.status(400).json({ 
          success: false, 
          error: 'Esta compra ya no puede ser devuelta' 
        });
      }

      // Verificar que no haya pasado mucho tiempo (ej: 30 días)
      const fechaCompra = new Date(compra.fecha_compra);
      const hoy = new Date();
      const diasDiferencia = Math.floor((hoy - fechaCompra) / (1000 * 60 * 60 * 24));

      if (diasDiferencia > 30) {
        return res.status(400).json({ 
          success: false, 
          error: 'Solo se pueden solicitar devoluciones dentro de los primeros 30 días' 
        });
      }

      // Verificar si ya existe una solicitud pendiente
      const { data: existente, error: errorExistente } = await supabase
        .from('devolucion')
        .select('*')
        .eq('id_compra', id)
        .eq('estado', 'pendiente')
        .maybeSingle();

      if (errorExistente) throw errorExistente;

      if (existente) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ya existe una solicitud de devolución pendiente para esta compra' 
        });
      }

      // Crear la solicitud de devolución
      const { data: devolucion, error } = await supabase
        .from('devolucion')
        .insert([{
          id_compra: id,
          id_usuario: usuarioId,
          motivo,
          monto: compra.total,
          estado: 'pendiente'
        }])
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Solicitud de devolución creada correctamente',
        devolucion
      });

    } catch (error) {
      console.error('❌ Error solicitando devolución:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al solicitar devolución' 
      });
    }
  },

  // ============================================
  // CANCELAR UNA COMPRA (SOLO SI ESTÁ PENDIENTE)
  // ============================================
  async cancelarCompra(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id_usuario;

      // Verificar que la compra existe y pertenece al usuario
      const { data: compra, error: errorCompra } = await supabase
        .from('compra')
        .select('*')
        .eq('id_compra', id)
        .eq('id_cuenta', usuarioId)
        .eq('estado', 'pendiente')
        .single();

      if (errorCompra || !compra) {
        return res.status(404).json({ 
          success: false, 
          error: 'Compra no encontrada o ya no puede ser cancelada' 
        });
      }

      // Actualizar estado de la compra
      const { error } = await supabase
        .from('compra')
        .update({ estado: 'cancelado' })
        .eq('id_compra', id);

      if (error) throw error;

      // Liberar los códigos (marcarlos como disponibles nuevamente)
      const { data: detalles } = await supabase
        .from('detalle_compra')
        .select('id_detail')
        .eq('id_compra', id);

      if (detalles && detalles.length > 0) {
        const idsDetalle = detalles.map(d => d.id_detail);
        
        await supabase
          .from('inventario_llaves')
          .update({ 
            estado: 'disponible',
            id_detalle: null 
          })
          .in('id_detalle', idsDetalle);
      }

      res.json({
        success: true,
        message: 'Compra cancelada correctamente'
      });

    } catch (error) {
      console.error('❌ Error cancelando compra:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al cancelar la compra' 
      });
    }
  }
};