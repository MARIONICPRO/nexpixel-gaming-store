// backend/src/controllers/iaController.js
import iaService from '../services/iaService.js';

// Obtener recomendaciones personalizadas
export const getRecomendaciones = async (req, res) => {
  try {
    // Obtener parámetros de la query string
    const usuarioId = req.query.usuarioId || null;
    const limite = parseInt(req.query.limite) || 8;
    
    console.log(`📡 GET /recomendaciones - Usuario: ${usuarioId || 'anónimo'}, Límite: ${limite}`);
    
    // Llamar al servicio de IA
    const recomendaciones = await iaService.getRecomendaciones(usuarioId, limite);
    
    // Responder con los productos recomendados
    res.json({
      success: true,
      productos: recomendaciones,
      fuente: 'IA con jsllm7',
      cantidad: recomendaciones.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en getRecomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo recomendaciones',
      error: error.message
    });
  }
};

// Obtener productos populares (sin IA)
export const getPopulares = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 8;
    
    console.log(`📡 GET /populares - Límite: ${limite}`);
    
    const populares = await iaService.getProductosPopulares(limite);
    
    res.json({
      success: true,
      productos: populares,
      fuente: 'Productos Populares',
      cantidad: populares.length
    });
    
  } catch (error) {
    console.error('❌ Error en getPopulares:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos populares'
    });
  }
};

// Registrar interacción del usuario (click, vista, compra)
export const registrarInteraccion = async (req, res) => {
  try {
    const { productoId, tipoInteraccion, usuarioId } = req.body;
    
    // Validar datos requeridos
    if (!productoId || !tipoInteraccion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: productoId y tipoInteraccion son requeridos'
      });
    }
    
    console.log(`📡 POST /interaccion - Usuario: ${usuarioId || 'anónimo'}, Producto: ${productoId}, Tipo: ${tipoInteraccion}`);
    
    // Si no hay usuario, solo respondemos éxito sin guardar
    if (!usuarioId) {
      return res.json({ 
        success: true, 
        message: 'Usuario anónimo, interacción no registrada' 
      });
    }
    
    // Registrar la interacción
    await iaService.registrarInteraccion(usuarioId, productoId, tipoInteraccion);
    
    res.json({
      success: true,
      message: 'Interacción registrada correctamente'
    });
    
  } catch (error) {
    console.error('❌ Error en registrarInteraccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando interacción',
      error: error.message
    });
  }
};

// Obtener productos similares a uno dado
export const getSimilares = async (req, res) => {
  try {
    const { productoId } = req.params;
    const limite = parseInt(req.query.limite) || 4;
    
    console.log(`📡 GET /productos/${productoId}/similares - Límite: ${limite}`);
    
    const similares = await iaService.getProductosSimilares(productoId, limite);
    
    res.json({
      success: true,
      productos: similares,
      producto_original_id: parseInt(productoId),
      cantidad: similares.length
    });
    
  } catch (error) {
    console.error('❌ Error en getSimilares:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos similares',
      error: error.message
    });
  }
};

// Endpoint de prueba para verificar que la IA funciona
export const testIA = async (req, res) => {
  try {
    console.log('🧪 Ejecutando prueba de IA...');
    
    // Productos de ejemplo para probar
    const productosVistos = [
      { id_producto: 1, nombre_producto: "God of War Ragnarök", categoria: { nombre_grupo: "Acción" } },
      { id_producto: 2, nombre_producto: "Spider-Man 2", categoria: { nombre_grupo: "Acción" } }
    ];
    
    const catalogo = [
      { id_producto: 3, nombre_producto: "Elden Ring", precio: 209900, categoria: { nombre_grupo: "RPG" } },
      { id_producto: 4, nombre_producto: "FIFA 24", precio: 159900, categoria: { nombre_grupo: "Deportes" } },
      { id_producto: 5, nombre_producto: "Call of Duty", precio: 179900, categoria: { nombre_grupo: "Shooter" } },
      { id_producto: 6, nombre_producto: "Mario Kart", precio: 149900, categoria: { nombre_grupo: "Carreras" } }
    ];
    
    const resultado = await iaService.recomendarConIA(productosVistos, catalogo, 3);
    
    res.json({
      success: true,
      message: 'Prueba de IA completada',
      recomendaciones: resultado
    });
    
  } catch (error) {
    console.error('❌ Error en testIA:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba de IA',
      error: error.message
    });
  }
};