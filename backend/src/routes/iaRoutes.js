// backend/src/routes/iaRoutes.js
import express from 'express';
import geminiTipsService from '../services/geminiTipsService.js';
import {
  getRecomendaciones,
  getPopulares,
  registrarInteraccion,
  getSimilares,
  testIA
} from '../controllers/iaController.js';

const router = express.Router();
router.post('/tips', async (req, res) => {
    try {
        const { juego, pregunta } = req.body;
        
        if (!juego) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nombre del juego requerido' 
            });
        }
        
        if (pregunta) {
            // Pregunta específica
            const resultado = await geminiTipsService.buscarConsejoRapido(juego, pregunta);
            return res.json(resultado);
        } else {
            // Búsqueda completa
            const resultado = await geminiTipsService.buscarConsejos(juego);
            return res.json(resultado);
        }
        
    } catch (error) {
        console.error('Error en tips:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al buscar consejos' 
        });
    }
});

// Rutas públicas (no requieren autenticación)
router.get('/recomendaciones', getRecomendaciones);
router.get('/populares', getPopulares);
router.get('/test', testIA);  // Ruta para probar que funciona
router.get('/productos/:productoId/similares', getSimilares);
router.post('/interaccion', registrarInteraccion);

export default router;