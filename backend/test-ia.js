// backend/test-ia.js
import iaService from './src/services/iaService.js';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  console.log('🧪 Probando servicio de IA...\n');
  
  // Probar conexión a Supabase
  console.log('1️⃣ Probando conexión a Supabase...');
  const populares = await iaService.getProductosPopulares(3);
  
  if (populares.length > 0) {
    console.log('✅ Conexión exitosa!');
    console.log('\n📊 Productos populares:');
    populares.forEach(p => {
      console.log(`   - ${p.nombre_producto} ($${p.precio})`);
    });
  } else {
    console.log('⚠️ No se encontraron productos o hay error de conexión');
  }
  
  // Probar recomendaciones con IA (si hay productos)
  if (populares.length > 0) {
    console.log('\n2️⃣ Probando IA (esto puede tomar unos segundos)...');
    const recomendaciones = await iaService.getRecomendaciones(null, 4);
    console.log('✅ Recomendaciones generadas:', recomendaciones.length);
  }
  
  console.log('\n✅ Prueba completada');
}

test().catch(console.error);