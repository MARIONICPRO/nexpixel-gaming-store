import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db-config.js';

export const authController = {
  async registrar(req, res) {
    try {
        console.log('📝 Registro recibido - Body:', req.body);
        console.log('📸 Archivo recibido:', req.file);

        const { nombre, email, password, tipo_usuario, telefono, empresa, nit } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nombre, email y contraseña son obligatorios' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

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
                verificado: tipo_usuario === 'proveedor' ? false : true,
                fecha_registro: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        let fotoUrl = null;
        if (req.file) {
            try {
                const fileName = `avatar-${usuario.id_usuario}-${Date.now()}.jpg`;
                
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('avatars')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600'
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase
                    .storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                fotoUrl = urlData.publicUrl;

                await supabase
                    .from('usuarios')
                    .update({ foto_perfil: fotoUrl })
                    .eq('id_usuario', usuario.id_usuario);

                usuario.foto_perfil = fotoUrl;
            } catch (uploadError) {
                console.error('Error subiendo foto:', uploadError);
            }
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email, tipo: usuario.tipo_usuario },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

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

  async login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email y contraseña son obligatorios' 
            });
        }

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }

        if (!usuario.password_hash) {
            return res.status(500).json({ 
                success: false, 
                error: 'Error en configuración de usuario' 
            });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }

        await supabase
            .from('usuarios')
            .update({ ultima_conexion: new Date() })
            .eq('id_usuario', usuario.id_usuario);

        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email, tipo: usuario.tipo_usuario },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log('✅ Login exitoso. Foto:', usuario.foto_perfil ? '✅' : '❌');

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo_usuario,
                foto: usuario.foto_perfil, // 👈 ESTO ES CRUCIAL
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

  async perfil(req, res) {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
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

 async actualizarPerfil(req, res) {
    try {
        console.log('='.repeat(60));
        console.log('🔍 ACTUALIZAR PERFIL CON CONTRASEÑA');
        console.log('1️⃣ Usuario ID:', req.usuario?.id_usuario);
        console.log('2️⃣ req.body:', req.body);
        console.log('3️⃣ req.file:', req.file ? '✅ SÍ' : '❌ NO');
        
        if (!req.usuario || !req.usuario.id_usuario) {
            return res.status(401).json({ 
                success: false, 
                error: 'No autorizado' 
            });
        }

        const datosActualizar = {};
        
        // Procesar datos de texto del perfil
        if (req.body) {
            const nombre = req.body.nombre;
            const telefono = req.body.telefono;
            const descripcion = req.body.descripcion;
            
            console.log('4️⃣ Datos de perfil:', { nombre, telefono, descripcion });
            
            if (nombre && nombre.trim() !== '') {
                datosActualizar.nombre = nombre.trim();
            }
            
            if (telefono && telefono.trim() !== '') {
                datosActualizar.telefono = telefono.trim();
            }
            
            if (descripcion && descripcion.trim() !== '') {
                datosActualizar.descripcion = descripcion.trim();
            }
        }

        // Procesar cambio de contraseña si viene
        let passwordCambiada = false;
        if (req.body && req.body.password_actual && req.body.password_nueva) {
            console.log('5️⃣ Procesando cambio de contraseña...');
            
            const { password_actual, password_nueva } = req.body;

            if (password_nueva.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'La nueva contraseña debe tener al menos 6 caracteres' 
                });
            }

            // Verificar contraseña actual
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('password_hash')
                .eq('id_usuario', req.usuario.id_usuario)
                .single();

            if (error || !usuario) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Usuario no encontrado' 
                });
            }

            const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);
            
            if (!passwordValida) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'La contraseña actual es incorrecta' 
                });
            }

            // Hashear nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const nuevaPasswordHash = await bcrypt.hash(password_nueva, salt);
            datosActualizar.password_hash = nuevaPasswordHash;
            passwordCambiada = true;
            console.log('6️⃣ Contraseña actualizada correctamente');
        }

        // Procesar foto si existe
        if (req.file) {
            console.log('7️⃣ Procesando foto...');
            
            try {
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(7);
                const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
                const fileName = `avatar-${req.usuario.id_usuario}-${timestamp}-${randomString}.${fileExtension}`;
                
                console.log('8️⃣ Subiendo como:', fileName);
                
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('avatars')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('❌ Error en upload:', uploadError);
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Error al subir la foto: ' + uploadError.message 
                    });
                }
                
                console.log('9️⃣ Upload exitoso:', uploadData);

                const { data: urlData } = supabase
                    .storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                datosActualizar.foto_perfil = urlData.publicUrl;
                console.log('🔟 URL generada:', datosActualizar.foto_perfil);

            } catch (uploadError) {
                console.error('❌ Error en proceso de foto:', uploadError);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Error al procesar la foto' 
                });
            }
        }

        // Verificar si hay datos para actualizar
        if (Object.keys(datosActualizar).length === 0) {
            console.log('⚠️ No hay datos para actualizar');
            return res.status(400).json({ 
                success: false, 
                error: 'No hay datos para actualizar' 
            });
        }

        console.log('📦 Datos a actualizar:', datosActualizar);

        // Actualizar en la base de datos
        const { data: usuarioActualizado, error } = await supabase
            .from('usuarios')
            .update(datosActualizar)
            .eq('id_usuario', req.usuario.id_usuario)
            .select();

        if (error) {
            console.error('❌ Error en update:', error);
            return res.status(400).json({ 
                success: false, 
                error: 'Error al actualizar datos: ' + error.message 
            });
        }

        console.log('✅ Usuario actualizado:', usuarioActualizado);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: passwordCambiada ? 'Perfil y contraseña actualizados' : 'Perfil actualizado correctamente',
            usuario: usuarioActualizado[0]
        });

    } catch (error) {
        console.error('❌ Error general:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
},

async cambiarPassword(req, res) {
    try {
        console.log('='.repeat(60));
        console.log('🔑 CAMBIAR CONTRASEÑA');
        console.log('1️⃣ Usuario ID:', req.usuario?.id_usuario);
        
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

        // Obtener usuario actual
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('password_hash')
            .eq('id_usuario', req.usuario.id_usuario)
            .single();

        if (error || !usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ 
                success: false, 
                error: 'La contraseña actual es incorrecta' 
            });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const nuevaPasswordHash = await bcrypt.hash(password_nueva, salt);

        // Actualizar en la base de datos
        const { error: errorUpdate } = await supabase
            .from('usuarios')
            .update({ password_hash: nuevaPasswordHash })
            .eq('id_usuario', req.usuario.id_usuario);

        if (errorUpdate) {
            console.error('❌ Error en update:', errorUpdate);
            throw errorUpdate;
        }

        console.log('✅ Contraseña actualizada correctamente');
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('❌ Error en cambiarPassword:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al cambiar la contraseña' 
        });
    }
},
async eliminarCuenta(req, res) {
    try {
        console.log('='.repeat(60));
        console.log('🗑️ ELIMINAR CUENTA');
        console.log('1️⃣ Usuario ID:', req.usuario.id_usuario);
        
        // Verificar que el usuario existe
        const { data: usuario, error: errorBusqueda } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .single();

        if (errorBusqueda || !usuario) {
            console.log('❌ Usuario no encontrado');
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        console.log('2️⃣ Usuario encontrado:', usuario.email);

        // Eliminar foto si existe
        if (usuario.foto_perfil) {
            try {
                const fileName = usuario.foto_perfil.split('/').pop();
                if (fileName) {
                    await supabase.storage.from('avatars').remove([fileName]);
                    console.log('✅ Foto eliminada');
                }
            } catch (storageError) {
                console.warn('⚠️ Error eliminando foto:', storageError);
            }
        }

        console.log('3️⃣ Eliminando datos relacionados...');

        // 1. Eliminar items del carrito
        const { data: carrito } = await supabase
            .from('carrito')
            .select('id')
            .eq('id_cuenta', usuario.id_usuario)
            .maybeSingle();

        if (carrito) {
            await supabase
                .from('carrito_items')
                .delete()
                .eq('carrito_id', carrito.id);
            
            await supabase
                .from('carrito')
                .delete()
                .eq('id', carrito.id);
            
            console.log('✅ Carrito eliminado');
        }

        // 2. Obtener y eliminar compras
        const { data: compras } = await supabase
            .from('compra')
            .select('id_compra')
            .eq('id_cuenta', usuario.id_usuario);

        if (compras && compras.length > 0) {
            const compraIds = compras.map(c => c.id_compra);
            
            // Eliminar detalles de compra
            await supabase
                .from('detalle_compra')
                .delete()
                .in('id_compra', compraIds);
            
            // Eliminar pagos
            await supabase
                .from('pago')
                .delete()
                .in('id_compra', compraIds);
            
            // Eliminar compras
            await supabase
                .from('compra')
                .delete()
                .in('id_compra', compraIds);
            
            console.log('✅ Compras eliminadas');
        }

        // 3. Eliminar otros registros
        await supabase.from('devolucion').delete().eq('id_usuario', usuario.id_usuario);
        await supabase.from('historial_ventas').delete().eq('id_cuenta', usuario.id_usuario);
        await supabase.from('interacciones_usuario').delete().eq('id_usuario', usuario.id_usuario);
        await supabase.from('preferencias_usuario').delete().eq('id_usuario', usuario.id_usuario);
        await supabase.from('busquedas_usuario').delete().eq('id_usuario', usuario.id_usuario);
        await supabase.from('recomendacion').delete().eq('id_usuario', usuario.id_usuario);

        console.log('✅ Otros registros eliminados');

        // 4. Finalmente eliminar el usuario
        console.log('4️⃣ Eliminando usuario...');
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id_usuario', usuario.id_usuario);

        if (error) throw error;

        console.log('5️⃣ Usuario eliminado correctamente');
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });

    } catch (error) {
        console.error('❌ Error en eliminarCuenta:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error al eliminar la cuenta' 
        });
    }
}
};