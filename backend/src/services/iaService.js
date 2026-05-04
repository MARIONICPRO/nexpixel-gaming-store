// backend/src/services/iaService.js
import jsllm7 from 'jsllm7';
import { supabase } from '../config/db-config.js';

class IAService {
  
  async getRecomendaciones(usuarioId = null, limite = 8) {
    try {
      console.log(`Generando recomendaciones para usuario: ${usuarioId || 'anonimo'}`);
      
      if (!usuarioId) {
        const productos = await this.getProductosPopulares(limite);
        productos.razonamiento = '🔥 Los juegos mas populares del momento en NexPixel';
        return productos;
      }
      
      const productosVistos = await this.getProductosVistos(usuarioId);
      
      console.log('🎮 Productos en historial del usuario:');
      productosVistos.forEach(p => {
        console.log(`   - ${p.nombre_producto} (${p.categoria})`);
      });
      
      if (productosVistos.length === 0) {
        console.log('👤 Usuario nuevo sin historial, mostrando productos populares');
        const productos = await this.getProductosPopulares(limite);
        productos.razonamiento = '🎉 ¡Bienvenido a NexPixel! Estos son nuestros juegos mas populares para comenzar tu aventura';
        return productos;
      }
      
      const catalogo = await this.getCatalogoDisponible();
      
      if (catalogo.length === 0) {
        return [];
      }
      
      const recomendaciones = await this.recomendarConIA(productosVistos, catalogo, limite);
      
      if (recomendaciones && recomendaciones.length > 0) {
        return recomendaciones;
      }
      
      const populares = await this.getProductosPopulares(limite);
      populares.razonamiento = '✨ Te mostramos nuestros juegos mas vendidos mientras personalizamos tu experiencia';
      return populares;
      
    } catch (error) {
      console.error('Error en recomendaciones:', error);
      const populares = await this.getProductosPopulares(limite);
      populares.razonamiento = '🎮 Productos populares de NexPixel - ¡Descubre tus próximos juegos favoritos!';
      return populares;
    }
  }
  
  async getProductosVistos(usuarioId) {
    try {
      console.log(`Obteniendo historial del usuario ${usuarioId}`);
      
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
        .eq('id_usuario', parseInt(usuarioId)); 
      
      if (errorCompras) {
        console.log('Error en compras:', errorCompras.message);
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
        console.log('Error en interacciones:', errorInter.message);
      }
      
      const productosMap = new Map();
      
      if (compras && compras.length > 0) {
        console.log(`📦 Compras encontradas: ${compras.length}`);
        for (const item of compras) {
          if (item.producto && item.producto.nombre_producto) {
            console.log(`   ✅ Comprado: ${item.producto.nombre_producto}`);
            productosMap.set(item.producto.id_producto, {
              id_producto: item.producto.id_producto,
              nombre_producto: item.producto.nombre_producto,
              precio: item.producto.precio,
              categoria: item.producto.categoria?.nombre_grupo || 'General'
            });
          }
        }
      }
      
      if (interacciones && interacciones.length > 0) {
        console.log(`👁️ Interacciones encontradas: ${interacciones.length}`);
        for (const item of interacciones) {
          if (item.producto && item.producto.nombre_producto && !productosMap.has(item.producto.id_producto)) {
            console.log(`   👀 Visto: ${item.producto.nombre_producto} (${item.tipo_interaccion})`);
            productosMap.set(item.producto.id_producto, {
              id_producto: item.producto.id_producto,
              nombre_producto: item.producto.nombre_producto,
              precio: item.producto.precio,
              categoria: item.producto.categoria?.nombre_grupo || 'General'
            });
          }
        }
      }
      
      const productos = Array.from(productosMap.values());
      console.log(`📊 Total productos en historial: ${productos.length}`);
      
      return productos;
      
    } catch (error) {
      console.error('Error obteniendo productos vistos:', error);
      return [];
    }
  }
  
  async getProductosPopulares(limite) {
    try {
      console.log(`Obteniendo ${limite} productos populares`);
      
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
        imagen_url: p.imagen_url || null,
        stock: p.stock,
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
      console.log(`✅ ${productos.length} productos populares encontrados`);
      return productos;
      
    } catch (error) {
      console.error('Error obteniendo productos populares:', error);
      return [];
    }
  }
  
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
      
      console.log(`📚 Catalogo obtenido: ${data?.length || 0} productos`);
      
      return data || [];
      
    } catch (error) {
      console.error('Error obteniendo catalogo:', error);
      return [];
    }
  }
  
  async recomendarConIA(productosVistos, catalogo, limite) {
    try {
      if (!productosVistos || productosVistos.length === 0) {
        console.log('No hay productos vistos');
        return [];
      }
      
      const idsVistos = new Set(productosVistos.map(p => p.id_producto));
      const catalogoFiltrado = catalogo.filter(p => !idsVistos.has(p.id_producto));
      
      if (catalogoFiltrado.length === 0) {
        console.log('No hay productos nuevos para recomendar');
        return [];
      }
      
      const catalogoLimitado = catalogoFiltrado.slice(0, 30);
      
      // 🔥 MEJORAR PRESENTACION DEL HISTORIAL
      const historialDetallado = productosVistos.map((p, i) => 
        `${i + 1}. ${p.nombre_producto} - ${p.categoria || 'Videojuego'}`
      ).join('\n');
      
      const nombresVistos = productosVistos.map(p => p.nombre_producto).join(', ');
      
      // 🔥 MEJORAR PRESENTACION DEL CATALOGO
      const catalogoTexto = catalogoLimitado.map(p => 
        `ID:${p.id_producto} | ${p.nombre_producto} | ${p.categoria || 'General'}`
      ).join('\n');
      
      // 🔥 PROMPT MEJORADO PARA RAZONAMIENTO DE CALIDAD
      const prompt = `Eres un experto recomendador de videojuegos para NexPixel, una tienda especializada en entretenimiento digital.

## 📋 REGLAS IMPORTANTES:
1. SOLO recomienda juegos que estén EXPLÍCITAMENTE en el catálogo que te doy
2. NO inventes juegos, usa SOLO los IDs y nombres del catálogo
3. Basa tu recomendación en los juegos que el usuario ya ha visto o agregado al carrito
4. Responde en español, de forma natural, entusiasta y amigable

## 🎮 HISTORIAL DEL USUARIO (juegos que ha visto/agregado al carrito):
${historialDetallado}

## 🛒 CATÁLOGO DISPONIBLE (juegos que SÍ existen en la tienda):
${catalogoTexto}

## 🎯 TAREA:
Recomienda ${limite} juegos diferentes a los que el usuario ya ha visto.

## 📝 FORMATO DE RESPUESTA (OBLIGATORIO):
Primera línea: Los IDs separados por coma (ejemplo: "15,23,42,67")
Segunda línea: Un "|"
Tercera línea: Tu razonamiento. DEBE incluir:
- Por qué estos juegos son similares a los que le gustaron
- Qué características comparten (género, estilo, jugabilidad, temática)
- Una invitación cordial y entusiasta a probarlos

## 💡 EJEMPLO de respuesta CORRECTA:
"15,23,42,67 |
🎯 ¡Excelente elección! Como has disfrutado de juegos de acción como Pepsiman y carreras como Forza, hemos seleccionado estos títulos que combinan adrenalina y diversión. God of War te sumergirá en una épica historia nórdica con combates intensos, mientras que Spider-Man 2 te hará balancearte por Nueva York con mecánicas ágiles. ¡Estamos seguros de que te encantarán! 🚀"

RESPONDE AHORA SIGUIENDO EXACTAMENTE EL FORMATO:`;

      console.log('🤖 Consultando IA mejorada...');
      
      let respuestaIA = '';
      try {
        respuestaIA = await jsllm7(prompt);
      } catch (iaError) {
        console.error('Error llamando a jsllm7:', iaError);
        return this.getRecomendacionesPorCategoria(productosVistos, catalogoLimitado, limite);
      }
      
      console.log('💬 Respuesta IA:', respuestaIA);
      
      let ids = [];
      let razonamiento = '';
      
      if (respuestaIA && respuestaIA.includes('|')) {
        const parts = respuestaIA.split('|');
        const idsPart = parts[0];
        razonamiento = parts.slice(1).join('|').trim();
        const idMatches = idsPart.match(/\d+/g);
        ids = idMatches || [];
      } else if (respuestaIA) {
        const idMatches = respuestaIA.match(/\d+/g);
        ids = idMatches || [];
        // Razonamiento mejorado por defecto
        const juegosInteres = productosVistos.map(p => p.nombre_producto).join(', ');
        const categoriaInteres = productosVistos[0]?.categoria || 'videojuegos';
        razonamiento = `🎯 ¡Genial! Basado en tu interés por ${juegosInteres}, hemos analizado nuestro catálogo y seleccionado estos ${categoriaInteres} que comparten mecánicas, estilo narrativo y esa misma emoción que tanto te gusta. ¡Prepárate para nuevas aventuras épicas! 🎮✨`;
      }
      
      const idsNumeros = ids.map(Number).slice(0, limite);
      const idsValidos = catalogoLimitado.filter(p => idsNumeros.includes(p.id_producto));
      
      let recomendados = idsValidos;
      
      if (recomendados.length < limite && productosVistos.length > 0) {
        const categoriaInteres = productosVistos[0]?.categoria;
        const mismosGenero = catalogoLimitado
          .filter(p => !idsNumeros.includes(p.id_producto) && p.categoria === categoriaInteres)
          .slice(0, limite - recomendados.length);
        recomendados.push(...mismosGenero);
      }
      
      if (recomendados.length < limite) {
        const restantes = catalogoLimitado
          .filter(p => !recomendados.some(r => r.id_producto === p.id_producto))
          .slice(0, limite - recomendados.length);
        recomendados.push(...restantes);
      }
      
      const resultados = recomendados.map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        imagen_url: p.imagen_url || null,
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
      resultados.razonamiento = razonamiento;
      
      console.log(`✨ IA recomendo: ${resultados.map(p => p.nombre_producto).join(', ')}`);
      console.log(`📝 Razonamiento: ${razonamiento.substring(0, 100)}...`);
      
      return resultados;
      
    } catch (error) {
      console.error('Error en IA:', error);
      return this.getRecomendacionesPorCategoria(productosVistos, catalogo, limite);
    }
  }
  
  async getRecomendacionesPorCategoria(productosVistos, catalogo, limite) {
    if (!productosVistos || productosVistos.length === 0 || !catalogo || catalogo.length === 0) {
      return [];
    }
    
    const categoriaInteres = productosVistos[0]?.categoria;
    const idsVistos = new Set(productosVistos.map(p => p.id_producto));
    const juegosInteres = productosVistos.map(p => p.nombre_producto).join(', ');
    
    let recomendados = catalogo
      .filter(p => !idsVistos.has(p.id_producto) && p.categoria === categoriaInteres)
      .slice(0, limite);
    
    if (recomendados.length < limite) {
      const restantes = catalogo
        .filter(p => !idsVistos.has(p.id_producto) && p.categoria !== categoriaInteres)
        .slice(0, limite - recomendados.length);
      recomendados.push(...restantes);
    }
    
    const resultados = recomendados.map(p => ({
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto,
      precio: p.precio,
      imagen_url: p.imagen_url || null,
      categoria: p.categoria?.nombre_grupo || 'General'
    }));
    
    // 🔥 RAZONAMIENTOS MEJORADOS para el fallback
    const mensajesRazonamiento = [
      `🎯 ¡Excelente elección! Como te gustan juegos como ${juegosInteres}, hemos seleccionado estos títulos que comparten la misma esencia y emoción. ¡Dale una oportunidad a estos juegazos que te harán vibrar! 🚀`,
      `🎮 Basado en tu interés por ${juegosInteres}, te recomendamos esta selección especial de ${categoriaInteres || 'videojuegos'} que combinan acción, aventura y horas de diversión asegurada. ¡No te arrepentirás! ⚡`,
      `✨ ¡Genial! Sabemos que has disfrutado de ${juegosInteres}, así que preparamos esta lista con juegos que te harán vivir experiencias aún más épicas. ¡Prepárate para nuevas aventuras! 🎉`,
      `🔥 ¡Acertaste! Basado en tu historial, estos juegos son perfectos para ti. Comparten la calidad, la jugabilidad y la emoción que ya conoces y amas. ¡A jugar se ha dicho! 🎮💪`
    ];
    
    const randomIndex = Math.floor(Math.random() * mensajesRazonamiento.length);
    resultados.razonamiento = mensajesRazonamiento[randomIndex];
    
    console.log(`Fallback por categoria: ${resultados.map(p => p.nombre_producto).join(', ')}`);
    
    return resultados;
  }
  
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
      console.log(`✅ Interaccion registrada: ${tipo} - Producto ${productoId}`);
      
    } catch (error) {
      console.error('Error registrando interaccion:', error);
    }
  }
  
  async getProductosSimilares(productoId, limite = 4) {
    try {
      console.log(`Buscando productos similares al ID: ${productoId}`);
      
      const { data: productoOriginal, error: prodError } = await supabase
        .from('producto')
        .select('id_producto, nombre_producto, id_categoria, categoria (nombre_grupo)')
        .eq('id_producto', parseInt(productoId))
        .single();
      
      if (prodError) {
        console.error('Error obteniendo producto original:', prodError);
        return [];
      }
      
      console.log(`Producto original: ${productoOriginal.nombre_producto}, Categoria ID: ${productoOriginal.id_categoria}`);
      
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
      
      const resultados = (similares || []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        precio: p.precio,
        imagen_url: p.imagen_url || null,
        categoria: p.categoria?.nombre_grupo || 'General'
      }));
      
      console.log(`Encontrados ${resultados.length} productos similares`);
      
      return resultados;
      
    } catch (error) {
      console.error('Error obteniendo similares:', error);
      return [];
    }
  }
}

export default new IAService();