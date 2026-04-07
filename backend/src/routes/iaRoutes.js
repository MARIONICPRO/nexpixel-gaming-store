// backend/src/routes/iaRoutes.js
import express from 'express';
import {
  getRecomendaciones,
  getPopulares,
  registrarInteraccion,
  getSimilares,
  testIA
} from '../controllers/iaController.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.get('/recomendaciones', getRecomendaciones);
router.get('/populares', getPopulares);
router.get('/test', testIA);  // Ruta para probar que funciona
router.get('/productos/:productoId/similares', getSimilares);
router.post('/interaccion', registrarInteraccion);

export default router;