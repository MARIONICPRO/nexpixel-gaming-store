import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db-config.js';

export const authController = {
  // ============================================
  // REGISTRO DE USUARIO
  // ============================================
  async registrar(req, res) {
    try {
      console.log('📝 Registro recibido:', req.body);

      const { nombre, email, password, tipo_usuario, telefono, empresa, nit } = req.body;

      // Validar datos obligatorios
      if (!nombre || !email || !password) {
        console.log('❌ Faltan datos obligatorios');
        return res.status(400).json({ 
          success: false, 
          error: 'Nombre, email y contraseña son obligatorios' 
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato de email inválido' 
        });
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      // Verificar que el email no exista
      const { data: existente, error: errorExistente } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (errorExistente) throw errorExistente;

      if (existente) {
        console.log('❌ Email ya registrado:', email);
        return res.status(400).json({ 
          success: false, 
          error: 'El email ya está registrado' 
        });
      }

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Determinar si el proveedor necesita verificación
      const esProveedor = tipo_usuario === 'proveedor';
      
      // Crear usuario en la base de datos
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .insert([{
          nombre,
          email,
          password_hash,
          tipo_usuario: tipo_usuario || 'cliente',
          telefono: telefono || null,
          empresa: empresa || null,
          nit: nit || null,
          foto_perfil: null,
          verificado: !esProveedor,
          fecha_registro: new Date()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error al insertar usuario:', error);
        throw error;
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: usuario.id_usuario, 
          email: usuario.email,
          tipo: usuario.tipo_usuario 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      console.log('✅ Usuario registrado exitosamente:', email);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          email: usuario.email,
          tipo: usuario.tipo_usuario,
          foto: usuario.foto_perfil,
          telefono: usuario.telefono,
          empresa: usuario.empresa,
          verificado: usuario.verificado
        }
      });

    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al registrar usuario' 
      });
    }
  },

  // ============================================
  // INICIO DE SESIÓN (LOGIN)
  // ============================================
  async login(req, res) {
    try {
      console.log('🔍 Login intentado para:', req.body.email);

      const { email, password } = req.body;

      // Validar datos obligatorios
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email y contraseña son obligatorios' 
        });
      }

      // Buscar usuario por email
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !usuario) {
        console.log('❌ Usuario no encontrado:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciales inválidas' 
        });
      }

      console.log('✅ Usuario encontrado:', usuario.email);

      // Verificar que el usuario tenga contraseña
      if (!usuario.password_hash) {
        console.log('❌ Usuario sin contraseña:', email);
        return res.status(500).json({ 
          success: false, 
          error: 'Error en configuración de usuario' 
        });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      
      if (!passwordValida) {
        console.log('❌ Contraseña incorrecta para:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciales inválidas' 
        });
      }

      // Actualizar última conexión
      await supabase
        .from('usuarios')
        .update({ ultima_conexion: new Date() })
        .eq('id_usuario', usuario.id_usuario);

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: usuario.id_usuario, 
          email: usuario.email,
          tipo: usuario.tipo_usuario 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      console.log('✅ Login exitoso para:', email);

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          email: usuario.email,
          tipo: usuario.tipo_usuario,
          foto: usuario.foto_perfil,
          telefono: usuario.telefono,
          empresa: usuario.empresa,
          verificado: usuario.verificado
        }
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al iniciar sesión' 
      });
    }
  },

  // ============================================
  // OBTENER PERFIL DEL USUARIO ACTUAL
  // ============================================
  async perfil(req, res) {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select(`
          id_usuario,
          nombre,
          email,
          tipo_usuario,
          foto_perfil,
          telefono,
          empresa,
          nit,
          descripcion,
          verificado,
          fecha_registro,
          ultima_conexion
        `)
        .eq('id_usuario', req.usuario.id_usuario)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        usuario
      });

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener perfil' 
      });
    }
  },

  // ============================================
  // ACTUALIZAR PERFIL
  // ============================================
  async actualizarPerfil(req, res) {
    try {
      const { nombre, telefono, descripcion } = req.body;
      const datosActualizar = {};

      if (nombre) datosActualizar.nombre = nombre;
      if (telefono !== undefined) datosActualizar.telefono = telefono;
      if (descripcion !== undefined) datosActualizar.descripcion = descripcion;

      if (Object.keys(datosActualizar).length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No hay datos para actualizar' 
        });
      }

      const { data: usuario, error } = await supabase
        .from('usuarios')
        .update(datosActualizar)
        .eq('id_usuario', req.usuario.id_usuario)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        usuario
      });

    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar perfil' 
      });
    }
  },

  // ============================================
  // CAMBIAR CONTRASEÑA
  // ============================================
  async cambiarPassword(req, res) {
    try {
      const { password_actual, password_nueva } = req.body;

      if (!password_actual || !password_nueva) {
        return res.status(400).json({ 
          success: false, 
          error: 'La contraseña actual y la nueva son obligatorias' 
        });
      }

      if (password_nueva.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'La nueva contraseña debe tener al menos 6 caracteres' 
        });
      }

      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('password_hash')
        .eq('id_usuario', req.usuario.id_usuario)
        .single();

      if (error) throw error;

      const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);
      
      if (!passwordValida) {
        return res.status(401).json({ 
          success: false, 
          error: 'La contraseña actual es incorrecta' 
        });
      }

      const salt = await bcrypt.genSalt(10);
      const nuevaPasswordHash = await bcrypt.hash(password_nueva, salt);

      const { error: errorUpdate } = await supabase
        .from('usuarios')
        .update({ password_hash: nuevaPasswordHash })
        .eq('id_usuario', req.usuario.id_usuario);

      if (errorUpdate) throw errorUpdate;

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al cambiar contraseña' 
      });
    }
  }
};