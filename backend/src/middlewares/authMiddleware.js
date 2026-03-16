// backend/src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db-config.js';

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token no proporcionado' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', decoded.id)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Error al verificar token' 
    });
  }
};
// backend/src/middlewares/authMiddleware.js
export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado' 
      });
    }

    if (!rolesPermitidos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para esta acción' 
      });
    }

    next();
  };
};