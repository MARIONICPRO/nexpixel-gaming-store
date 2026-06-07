// backend/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import productoRoutes from './src/routes/productoRoutes.js';
import carritoRoutes from './src/routes/carritoRoutes.js';
import compraRoutes from './src/routes/compraRoutes.js';
import proveedorRoutes from './src/routes/proveedorRoutes.js';
import iaRoutes from './src/routes/iaRoutes.js';
import pagoRoutes from './src/routes/pagoRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://nexpixel-gaming-store.onrender.com'
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 EVITAR CACHÉ DEL NAVEGADOR
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// 🔥 CORRECCIÓN PARA RENDER: Rutas absolutas
const frontendPath = path.resolve(path.join(__dirname, '..', 'Frontend'));
const resourcesPath = path.resolve(path.join(__dirname, '..', 'resources'));

console.log('📂 Frontend path:', frontendPath);
console.log('📂 Resources path:', resourcesPath);

// Servir archivos estáticos del frontend
app.use(express.static(frontendPath, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (filePath.endsWith('.avif')) {
            res.setHeader('Content-Type', 'image/avif');
        } else if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
    }
}));

// Servir la carpeta resources
app.use('/resources', express.static(resourcesPath));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/pagos', pagoRoutes);

// 🔥 Rutas amigables del frontend
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/home', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/juegos', (req, res) => res.sendFile(path.join(frontendPath, 'juegos.html')));
app.get('/tarjetas', (req, res) => res.sendFile(path.join(frontendPath, 'tarjetas.html')));
app.get('/carrito', (req, res) => res.sendFile(path.join(frontendPath, 'carrito.html')));
app.get('/contacto', (req, res) => res.sendFile(path.join(frontendPath, 'contacto.html')));
app.get('/producto', (req, res) => res.sendFile(path.join(frontendPath, 'producto.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'dashboard-admin.html')));
app.get('/proveedor', (req, res) => res.sendFile(path.join(frontendPath, 'dashboard-prove.html')));
app.get('/confirmacion', (req, res) => res.sendFile(path.join(frontendPath, 'confirmacion.html')));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 Servidor de NexPixel funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      productos: '/api/productos',
      carrito: '/api/carrito',
      compras: '/api/compras',
      proveedor: '/api/proveedor',
      ia: '/api/ia',
      pagos: '/api/pagos'
    }
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Servidor de NexPixel iniciado
  📡 Puerto: ${PORT}
  🔗 URL: http://localhost:${PORT}
  📂 Frontend: ${frontendPath}
  📂 Resources: ${resourcesPath}
  📅 ${new Date().toLocaleString()}
  `);
});