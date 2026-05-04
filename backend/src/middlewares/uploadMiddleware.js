import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Middleware para productos - PROCESA FORM DATA CORRECTAMENTE
export const uploadProductMiddleware = (req, res, next) => {
    console.log('🔄 Procesando FormData...');
    
    // Usar array de fields para capturar todo
    upload.fields([{ name: 'imagen', maxCount: 1 }])(req, res, (err) => {
        if (err) {
            console.error('❌ Error en multer:', err);
            return res.status(400).json({ success: false, error: err.message });
        }
        
        console.log('✅ Multer procesado');
        console.log('📦 req.body (raw):', req.body);
        
        // 🔥 IMPORTANTE: Los campos de texto vienen en req.body
        // pero si hay algún problema, los extraemos manualmente
        
        // Asegurar que req.body sea un objeto
        if (!req.body) req.body = {};
        
        // Si req.body es un string, parsearlo
        if (typeof req.body === 'string') {
            try {
                const parsed = JSON.parse(req.body);
                req.body = parsed;
            } catch (e) {
                // No es JSON, mantener como está
            }
        }
        
        console.log('📦 req.body (después):', req.body);
        console.log('📸 req.files:', req.files);
        
        // Poner req.file para compatibilidad con el controlador
        if (req.files && req.files['imagen']) {
            req.file = req.files['imagen'][0];
        }
        
        next();
    });
};

export const uploadMiddleware = upload.single('foto');