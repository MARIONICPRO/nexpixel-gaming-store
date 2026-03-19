import express from 'express';
import { authController } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/registro', uploadMiddleware, authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, uploadMiddleware, authController.actualizarPerfil);
router.delete('/eliminar', verificarToken, authController.eliminarCuenta); // ✅ DEBE SER /eliminar
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

export default router;