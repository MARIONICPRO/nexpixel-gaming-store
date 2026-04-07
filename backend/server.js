// backend/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import productoRoutes from './src/routes/productoRoutes.js';
import carritoRoutes from './src/routes/carritoRoutes.js';
import compraRoutes from './src/routes/compraRoutes.js';
import proveedorRoutes from './src/routes/proveedorRoutes.js';
import iaRoutes from './src/routes/iaRoutes.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/ia', iaRoutes); 

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
      ia: '/api/ia' 
    }
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `Ruta ${req.method} ${req.originalUrl} no encontrada` 
  });
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
  📅 ${new Date().toLocaleString()}
  `);
});