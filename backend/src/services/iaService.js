// backend/src/services/iaService.js
import jsllm7 from 'jsllm7';
import { supabase } from '../config/db-config.js';

class IAService {
  
  // Obtener recomendaciones para el usuario
  async getRecomendaciones(usuarioId = null, limite = 8) {
    try {
      console.log(`🤖 Generando recomendaciones para usuario: ${usuarioId || 'anónimo'}`);
      
      if (!usuarioId) {
        return await this.getProductosPopulares(limite);
      }
      
      const productosVistos = await this.getProductosVistos(usuarioId);
      
      if (productosVistos.length === 0) {
        console.log('📊 Usuario nuevo, mostrando productos populares');
        return await this.getProductosPopulares(limite);
      }
      
      const catalogo = await this.getCatalogoDisponible();
      
      if (catalogo.length === 0) {
        return [];
      }
      
      const recomendaciones = await this.recomendarConIA(productosVistos, catalogo, limite);
      
      return recomendaciones.length > 0 ? recomendaciones : await this.getProductosPopulares(limite);
      
    } catch (error) {
      console.error('❌ Error en recomendaciones:', error);
      return await this.getProductosPopulares(limite);
    }
  }
  
  // Obtener productos que el usuario ya ha visto o comprado
  async getProductosVistos(usuarioId) {
    try {
      console.log(`📝 Obteniendo historial del usuario ${usuarioId}`);
      
      // Obtener compras
      const { data: compras, error: errorCompras } = await supabase
        .from('detalle_compra')
        .select(`
          id_producto,
          producto (
            id_producto,
            nombre_producto,
            precio,
            categoria (nombre_grupo)
          )
        `)
        .eq('compra.id_cuenta', parseInt(usuarioId));
      
      if (errorCompras) {
        console.log('⚠️ Error en compras:', errorCompras.message);
      }
      
      // Obtener interacciones
      const { data: interacciones, error: errorInter } = await supabase
        .from('interacciones_usuario')
        .select(`
          id_producto,
          tipo_interaccion,
          producto (
            id_producto,
            nombre_producto,
            precio,
            categoria (nombre_grupo)
          )
        `)
        .eq('id_usuario', parseInt(usuarioId))
        .order('fecha', { ascending: false })
        .limit(30);
      
      if (errorInter) {
        console.log('⚠️ Error en interacciones:', errorInter.message);
      }
      
      // Combinar productos vistos
      const productosMap = new Map();
      
      if (compras) {
        compras.forEach(item => {
          if (item.producto) {
            productosMap.set(item.producto.id_producto, item.producto);
          }
        });
      }
      
      if (interacciones) {
        interacciones.forEach(item => {
          if (item.producto) {
            productosMap.set(item.producto.id_producto, item.producto);
          }
        });
      }
      
      const productos = Array.from(productosMap.values());
      console.log(`📊 Encontrados ${productos.length} productos vistos/comprados`);
      
      return productos;
      
    } catch (error) {
      console.error('❌ Error obteniendo productos vistos:', error);
      return [];
    }
  }
  
  // Obtener productos populares (CORREGIDO - sin descripcion_corta)
  async getProductosPopulares(limite) {
    try {
      console.log(`📊 Obteniendo ${limite} productos populares`);
      
      const { data, error } = await supabase
        .from('producto')
        .select(`
          id_producto,
          nombre_producto,
          precio,
          descripcion,
          imagen_url,
          stock,
          categoria (nombre_grupo)
        `)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .order('ventas_totales', { ascending: false, nullsLast: true })
        .limit(limite);
      
      if (error) throw error;
      
      const productos = (data || []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        descripcion: p.descripcion || '',
        imagen_url: p.imagen_url || '/assets/img/default-game.jpg',
        stock: p.stock,
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
      console.log(`✅ Encontrados ${productos.length} productos populares`);
      return productos;
      
    } catch (error) {
      console.error('❌ Error obteniendo productos populares:', error);
      return [];
    }
  }
  
  // Obtener catálogo disponible
  async getCatalogoDisponible() {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select(`
          id_producto,
          nombre_producto,
          precio,
          categoria (nombre_grupo)
        `)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .limit(50);
      
      if (error) throw error;
      
      console.log(`📚 Catálogo obtenido: ${data?.length || 0} productos`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Error obteniendo catálogo:', error);
      return [];
    }
  }
  
  // Recomendar usando IA
  async recomendarConIA(productosVistos, catalogo, limite) {
    try {
      // Filtrar productos que no ha visto
      const idsVistos = new Set(productosVistos.map(p => p.id_producto));
      const catalogoFiltrado = catalogo.filter(p => !idsVistos.has(p.id_producto));
      
      if (catalogoFiltrado.length === 0) {
        return [];
      }
      
      // Limitar catálogo para no sobrecargar
      const catalogoLimitado = catalogoFiltrado.slice(0, 40);
      
      // Preparar nombres de productos vistos
      const nombresVistos = productosVistos.slice(0, 8).map(p => p.nombre_producto).join(', ');
      
      const catalogoTexto = catalogoLimitado.map(p => 
        `${p.id_producto}: ${p.nombre_producto} (${p.categoria?.nombre_grupo || 'General'}) - $${p.precio}`
      ).join('\n');
      
      const prompt = `Eres un recomendador de videojuegos para NexPixel.

El usuario ha visto/comprado: ${nombresVistos}

Catálogo disponible (elige SOLO de aquí):
${catalogoTexto}

Recomienda ${limite} juegos de este catálogo.
Devuelve SOLO los IDs separados por coma.
Ejemplo: "5,12,8,3"`;
      
      console.log('🤖 Consultando IA...');
      const respuestaIA = await jsllm7(prompt);
      console.log('💬 Respuesta IA:', respuestaIA);
      
      // Extraer IDs
      const ids = respuestaIA.match(/\d+/g) || [];
      const idsNumeros = ids.map(Number).slice(0, limite);
      
      // Filtrar productos
      const recomendados = catalogoLimitado.filter(p => idsNumeros.includes(p.id_producto));
      
      // Si faltan, completar
      if (recomendados.length < limite) {
        const restantes = catalogoLimitado
          .filter(p => !idsNumeros.includes(p.id_producto))
          .slice(0, limite - recomendados.length);
        recomendados.push(...restantes);
      }
      
      const resultados = recomendados.map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        imagen_url: '/assets/img/default-game.jpg',
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
      console.log(`✨ IA recomendó ${resultados.length} productos`);
      return resultados;
      
    } catch (error) {
      console.error('❌ Error en IA:', error);
      return [];
    }
  }
  
  // Registrar interacción del usuario
  async registrarInteraccion(usuarioId, productoId, tipo) {
    if (!usuarioId) return;
    
    try {
      const { error } = await supabase
        .from('interacciones_usuario')
        .insert({
          id_usuario: parseInt(usuarioId),
          id_producto: parseInt(productoId),
          tipo_interaccion: tipo,
          fecha: new Date(),
          valor: tipo === 'compra' ? 10 : (tipo === 'carrito' ? 3 : 1)
        });
      
      if (error) throw error;
      console.log(`✅ Interacción registrada: ${tipo} - Producto ${productoId}`);
      
    } catch (error) {
      console.error('❌ Error registrando interacción:', error);
    }
  }
  
  // Obtener productos similares
  async getProductosSimilares(productoId, limite = 4) {
    try {
      const { data: productoOriginal, error: prodError } = await supabase
        .from('producto')
        .select('id_categoria')
        .eq('id_producto', parseInt(productoId))
        .single();
      
      if (prodError) throw prodError;
      
      let query = supabase
        .from('producto')
        .select(`
          id_producto,
          nombre_producto,
          precio,
          descripcion,
          imagen_url,
          categoria (nombre_grupo)
        `)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .neq('id_producto', parseInt(productoId))
        .limit(limite);
      
      if (productoOriginal?.id_categoria) {
        query = query.eq('id_categoria', productoOriginal.id_categoria);
      }
      
      const { data: similares, error } = await query;
      
      if (error) throw error;
      
      return (similares || []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        imagen_url: p.imagen_url || '/assets/img/default-game.jpg',
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo similares:', error);
      return [];
    }
  }
}

export default new IAService();