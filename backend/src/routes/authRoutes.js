// backend/src/routes/authRoutes.js
import express from 'express';
import { authController } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

export default router;