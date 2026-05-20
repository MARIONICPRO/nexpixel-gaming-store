import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db-config.js';

export const authController = {
    // ============================================
    // REGISTRO DE USUARIO
    // ============================================
    async registrar(req, res) {
        try {
            console.log('📝 Registro recibido - Body:', req.body);

            const { nombre, email, password, tipo_usuario, telefono, empresa, nit } = req.body;

            if (!nombre || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre, email y contraseña son obligatorios'
                });
            }

            const emailLower = email.toLowerCase();

            const { data: existente, error: errorExistente } = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', emailLower)
                .maybeSingle();

            if (existente) {
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const { data: usuario, error } = await supabase
                .from('usuarios')
                .insert([{
                    nombre,
                    email: emailLower,
                    password_hash,
                    tipo_usuario: tipo_usuario || 'cliente',
                    telefono: telefono || null,
                    empresa: empresa || null,
                    nit: nit || null,
                    foto_perfil: null,
                    estado: 'activo',
                    verificado: tipo_usuario === 'proveedor' ? false : true,
                    fecha_registro: new Date()
                }])
                .select()
                .single();

            if (error) {
                console.log('='.repeat(60));
                console.log('❌ ERROR DE SUPABASE:');
                console.log('Código:', error.code);
                console.log('Mensaje:', error.message);
                console.log('Detalles:', error.details);
                console.log('='.repeat(60));
                
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                    details: error.details
                });
            }

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

            // 🔥 URL de redirección según rol
            let redirectUrl = '/Frontend/index.html';
            if (usuario.tipo_usuario === 'admin') {
                redirectUrl = '/Frontend/dashboard-admin.html';
            } else if (usuario.tipo_usuario === 'proveedor') {
                redirectUrl = '/Frontend/dashboard-prove.html';
            }

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                redirectUrl,
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
    // LOGIN DE USUARIO (CON VALIDACIÓN DE ESTADO + REDIRECCIÓN)
    // ============================================
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña son obligatorios'
                });
            }

            const emailLower = email.toLowerCase();

            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', emailLower)
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

            // ============================================
            // 🔥 VALIDAR ESTADO DEL USUARIO
            // ============================================

            if (usuario.estado === 'inactivo') {
                console.log(`🚫 Login bloqueado: ${usuario.email} está INACTIVO`);
                return res.status(403).json({ 
                    success: false, 
                    error: '⚠️ Tu cuenta está inactiva. Contacta al administrador para reactivarla.' 
                });
            }

            if (usuario.estado === 'suspendido') {
                console.log(`🚫 Login bloqueado: ${usuario.email} está SUSPENDIDO`);
                
                if (usuario.suspendido_hasta) {
                    const fechaFin = new Date(usuario.suspendido_hasta);
                    
                    if (fechaFin <= new Date()) {
                        console.log(`✅ Suspensión vencida para ${usuario.email}. Reactivando...`);
                        await supabase
                            .from('usuarios')
                            .update({ 
                                estado: 'activo', 
                                suspendido_hasta: null 
                            })
                            .eq('id_usuario', usuario.id_usuario);
                    } else {
                        const fechaFinStr = fechaFin.toLocaleString();
                        return res.status(403).json({ 
                            success: false, 
                            error: `⚠️ Tu cuenta está suspendida hasta ${fechaFinStr}. Contacta al administrador.` 
                        });
                    }
                } else {
                    return res.status(403).json({ 
                        success: false, 
                        error: '⚠️ Tu cuenta ha sido suspendida. Contacta al administrador para más información.' 
                    });
                }
            }

            if (usuario.tipo_usuario === 'proveedor' && usuario.verificado === false) {
                console.log(`⏳ Login bloqueado: proveedor ${usuario.email} no verificado`);
                return res.status(403).json({ 
                    success: false, 
                    error: '⚠️ Tu cuenta de proveedor está pendiente de verificación. Te notificaremos cuando sea aprobada.' 
                });
            }

            // ============================================
            // ✅ USUARIO VÁLIDO - GENERAR TOKEN
            // ============================================

            await supabase
                .from('usuarios')
                .update({ ultima_conexion: new Date() })
                .eq('id_usuario', usuario.id_usuario);

            const token = jwt.sign(
                { id: usuario.id_usuario, email: usuario.email, tipo: usuario.tipo_usuario },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // 🔥 DETERMINAR URL DE REDIRECCIÓN SEGÚN ROL
            let redirectUrl = '/Frontend/index.html';
            if (usuario.tipo_usuario === 'admin') {
                redirectUrl = '/Frontend/dashboard-admin.html';
            } else if (usuario.tipo_usuario === 'proveedor') {
                redirectUrl = '/Frontend/dashboard-prove.html';
            }

            console.log('✅ Login exitoso:', usuario.email, '- Tipo:', usuario.tipo_usuario, '- Redirect:', redirectUrl);

            res.json({
                success: true,
                message: 'Login exitoso',
                token,
                redirectUrl,
                usuario: {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    tipo: usuario.tipo_usuario,
                    foto: usuario.foto_perfil,
                    telefono: usuario.telefono,
                    empresa: usuario.empresa,
                    verificado: usuario.verificado,
                    estado: usuario.estado
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
    // OBTENER PERFIL
    // ============================================
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

    // ============================================
    // ACTUALIZAR PERFIL
    // ============================================
    async actualizarPerfil(req, res) {
        try {
            console.log('='.repeat(60));
            console.log('🔍 ACTUALIZAR PERFIL');
            console.log('1️⃣ Usuario ID:', req.usuario?.id_usuario);

            if (!req.usuario || !req.usuario.id_usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }

            const datosActualizar = {};

            if (req.body) {
                const nombre = req.body.nombre;
                const telefono = req.body.telefono;
                const descripcion = req.body.descripcion;

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

            let passwordCambiada = false;
            if (req.body && req.body.password_actual && req.body.password_nueva) {
                const { password_actual, password_nueva } = req.body;

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

                const salt = await bcrypt.genSalt(10);
                const nuevaPasswordHash = await bcrypt.hash(password_nueva, salt);
                datosActualizar.password_hash = nuevaPasswordHash;
                passwordCambiada = true;
            }

            if (req.file) {
                try {
                    const timestamp = Date.now();
                    const randomString = Math.random().toString(36).substring(7);
                    const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
                    const fileName = `avatar-${req.usuario.id_usuario}-${timestamp}-${randomString}.${fileExtension}`;

                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('avatars')
                        .upload(fileName, req.file.buffer, {
                            contentType: req.file.mimetype,
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase
                        .storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    datosActualizar.foto_perfil = urlData.publicUrl;

                } catch (uploadError) {
                    console.error('❌ Error subiendo foto:', uploadError);
                    return res.status(400).json({
                        success: false,
                        error: 'Error al subir la foto'
                    });
                }
            }

            if (Object.keys(datosActualizar).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No hay datos para actualizar'
                });
            }

            const { data: usuarioActualizado, error } = await supabase
                .from('usuarios')
                .update(datosActualizar)
                .eq('id_usuario', req.usuario.id_usuario)
                .select();

            if (error) throw error;

            res.json({
                success: true,
                message: passwordCambiada ? 'Perfil y contraseña actualizados' : 'Perfil actualizado correctamente',
                usuario: usuarioActualizado[0]
            });

        } catch (error) {
            console.error('❌ Error general:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
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
            console.error('❌ Error en cambiarPassword:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar la contraseña'
            });
        }
    },

    // ============================================
    // ELIMINAR CUENTA
    // ============================================
    async eliminarCuenta(req, res) {
        try {
            console.log('🗑️ ELIMINAR CUENTA');
            console.log('1️⃣ Usuario ID:', req.usuario.id_usuario);

            const { data: usuario, error: errorBusqueda } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id_usuario', req.usuario.id_usuario)
                .single();

            if (errorBusqueda || !usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            if (usuario.foto_perfil) {
                try {
                    const fileName = usuario.foto_perfil.split('/').pop();
                    if (fileName) {
                        await supabase.storage.from('avatars').remove([fileName]);
                    }
                } catch (storageError) {
                    console.warn('⚠️ Error eliminando foto:', storageError);
                }
            }

            const { data: carrito } = await supabase
                .from('carrito')
                .select('id')
                .eq('id_cuenta', usuario.id_usuario)
                .maybeSingle();

            if (carrito) {
                await supabase.from('carrito_items').delete().eq('carrito_id', carrito.id);
                await supabase.from('carrito').delete().eq('id', carrito.id);
            }

            const { data: compras } = await supabase
                .from('compra')
                .select('id_compra')
                .eq('id_cuenta', usuario.id_usuario);

            if (compras && compras.length > 0) {
                const compraIds = compras.map(c => c.id_compra);
                await supabase.from('detalle_compra').delete().in('id_compra', compraIds);
                await supabase.from('pago').delete().in('id_compra', compraIds);
                await supabase.from('compra').delete().in('id_compra', compraIds);
            }

            await supabase.from('devolucion').delete().eq('id_usuario', usuario.id_usuario);
            await supabase.from('historial_ventas').delete().eq('id_cuenta', usuario.id_usuario);
            await supabase.from('interacciones_usuario').delete().eq('id_usuario', usuario.id_usuario);
            await supabase.from('preferencias_usuario').delete().eq('id_usuario', usuario.id_usuario);
            await supabase.from('busquedas_usuario').delete().eq('id_usuario', usuario.id_usuario);
            await supabase.from('recomendacion').delete().eq('id_usuario', usuario.id_usuario);

            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id_usuario', usuario.id_usuario);

            if (error) throw error;

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