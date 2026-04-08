// backend/src/services/iaService.js
import jsllm7 from 'jsllm7';
import { supabase } from '../config/db-config.js';

class IAService {
  
// 🔥 MODIFICADO: Obtener recomendaciones CON RAZONAMIENTO
async getRecomendaciones(usuarioId = null, limite = 8) {
  try {
    console.log(`🤖 Generando recomendaciones para usuario: ${usuarioId || 'anónimo'}`);
    
    if (!usuarioId) {
      const productos = await this.getProductosPopulares(limite);
      productos.razonamiento = 'Mostrando productos más populares de la tienda';
      return productos;
    }
    
    const productosVistos = await this.getProductosVistos(usuarioId);
    
    if (productosVistos.length === 0) {
      console.log('📊 Usuario nuevo, mostrando productos populares');
      const productos = await this.getProductosPopulares(limite);
      productos.razonamiento = 'Eres nuevo en NexPixel. Te mostramos nuestros juegos más vendidos';
      return productos;
    }
    
    const catalogo = await this.getCatalogoDisponible();
    
    if (catalogo.length === 0) {
      return [];
    }
    
    const recomendaciones = await this.recomendarConIA(productosVistos, catalogo, limite);
    
    if (recomendaciones.length > 0) {
      return recomendaciones;
    }
    
    const populares = await this.getProductosPopulares(limite);
    populares.razonamiento = 'No pudimos generar recomendaciones personalizadas. Mostrando productos populares';
    return populares;
    
  } catch (error) {
    console.error('❌ Error en recomendaciones:', error);
    const populares = await this.getProductosPopulares(limite);
    populares.razonamiento = 'Error en el sistema de recomendaciones. Mostrando productos populares';
    return populares;
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
            productosMap.set(item.producto.id_producto, {
              id_producto: item.producto.id_producto,
              nombre_producto: item.producto.nombre_producto,
              precio: item.producto.precio,
              categoria: item.producto.categoria?.nombre_grupo || 'General'
            });
          }
        });
      }
      
      if (interacciones) {
        interacciones.forEach(item => {
          if (item.producto && !productosMap.has(item.producto.id_producto)) {
            productosMap.set(item.producto.id_producto, {
              id_producto: item.producto.id_producto,
              nombre_producto: item.producto.nombre_producto,
              precio: item.producto.precio,
              categoria: item.producto.categoria?.nombre_grupo || 'General'
            });
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
  
  // 🔥 CORREGIDO: Obtener productos populares (SIN default-game.jpg)
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
      
      // 🔥 CAMBIO IMPORTANTE: usar null en lugar de la ruta problemática
      const productos = (data || []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        descripcion: p.descripcion || '',
        imagen_url: p.imagen_url || null,  // ✅ null, no string
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
  
  // Obtener catálogo disponible (incluye imagen_url)
  async getCatalogoDisponible() {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select(`
          id_producto,
          nombre_producto,
          precio,
          imagen_url,
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
  
  // 🔥 CORREGIDO: Recomendar usando IA (SIN default-game.jpg)
// 🔥 MODIFICADO: Recomendar usando IA CON RAZONAMIENTO
async recomendarConIA(productosVistos, catalogo, limite) {
  try {
    // Filtrar productos que no ha visto
    const idsVistos = new Set(productosVistos.map(p => p.id_producto));
    const catalogoFiltrado = catalogo.filter(p => !idsVistos.has(p.id_producto));
    
    if (catalogoFiltrado.length === 0) {
      console.log('⚠️ No hay productos nuevos para recomendar');
      return [];
    }
    
    // Limitar catálogo para no sobrecargar
    const catalogoLimitado = catalogoFiltrado.slice(0, 40);
    
    // Preparar nombres de productos vistos
    const nombresVistos = productosVistos.slice(0, 8).map(p => p.nombre_producto).join(', ');
    
    const catalogoTexto = catalogoLimitado.map(p => 
      `${p.id_producto}: ${p.nombre_producto} (${p.categoria?.nombre_grupo || 'General'}) - $${p.precio}`
    ).join('\n');
    
    // 🔥 NUEVO PROMPT CON RAZONAMIENTO
    const prompt = `Eres un recomendador de videojuegos para NexPixel.

El usuario ha visto/comprado: ${nombresVistos}

Catálogo disponible (elige SOLO de aquí):
${catalogoTexto}

Recomienda ${limite} juegos DIFERENTES a los que ya ha visto.

Formato de respuesta (OBLIGATORIO):
PRIMERO: Los IDs separados por coma
LUEGO: Un "|"
DESPUÉS: Tu razonamiento explicando POR QUÉ recomiendas esos juegos

Ejemplo correcto:
"15,23,42,67 | El usuario juega RPG y acción, por eso le recomiendo Elden Ring (RPG desafiante), Spider-Man 2 (acción+mundo abierto), God of War (acción narrativa) y Horizon (mundo abierto+acción)"`;

    console.log('🤖 Consultando IA con razonamiento...');
    const respuestaIA = await jsllm7(prompt);
    console.log('💬 Respuesta IA completa:', respuestaIA);
    
    // 🔥 EXTRAER IDs Y RAZONAMIENTO
    let ids = [];
    let razonamiento = '';
    
    if (respuestaIA.includes('|')) {
      const [idsPart, razonamientoPart] = respuestaIA.split('|');
      ids = idsPart.match(/\d+/g) || [];
      razonamiento = razonamientoPart.trim();
    } else {
      // Fallback si no usa el formato correcto
      ids = respuestaIA.match(/\d+/g) || [];
      razonamiento = 'Recomendaciones basadas en tu historial de juegos';
    }
    
    const idsNumeros = ids.map(Number).slice(0, limite);
    
    // Filtrar productos
    let recomendados = catalogoLimitado.filter(p => idsNumeros.includes(p.id_producto));
    
    // Si faltan, completar
    if (recomendados.length < limite) {
      const restantes = catalogoLimitado
        .filter(p => !idsNumeros.includes(p.id_producto))
        .slice(0, limite - recomendados.length);
      recomendados.push(...restantes);
    }
    
    // 🔥 RESULTADOS CON RAZONAMIENTO INCLUIDO
    const resultados = recomendados.map(p => ({
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto,
      precio: p.precio,
      imagen_url: p.imagen_url || null,
      categoria: p.categoria?.nombre_grupo || 'General'
    }));
    
    // 🔥 AÑADIR RAZONAMIENTO A LOS RESULTADOS
    resultados.razonamiento = razonamiento;
    
    console.log(`✨ IA recomendó ${resultados.length} productos`);
    console.log(`🧠 Razonamiento: ${razonamiento}`);
    
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
  
  // 🔥 CORREGIDO: Obtener productos similares (SIN default-game.jpg)
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
      
      // 🔥 CAMBIO IMPORTANTE: usar null en lugar de la ruta problemática
      return (similares || []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        imagen_url: p.imagen_url || null,  // ✅ null, no string
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo similares:', error);
      return [];
    }
  }
}

export default new IAService();