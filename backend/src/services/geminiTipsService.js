// ============================================
// GEMINI TIPS SERVICE - CONSEJOS Y TRUCOS CON IA
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiTipsService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBhuOLxzdfbt1EO6j07Pvc34h0Rr5DrIHA';
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    /**
     * Buscar consejos y trucos para un juego específico
     */
    async buscarConsejos(gameName) {
        console.log('🎮 Gemini buscando consejos para:', gameName);
        
        try {
            const prompt = `Eres un experto gamer que da consejos y trucos para videojuegos.

JUEGO: "${gameName}"

Por favor, proporciona EXACTAMENTE esta estructura JSON sin texto adicional:
{
    "trucos": [
        {
            "titulo": "título corto del truco",
            "descripcion": "explicación detallada de cómo hacerlo",
            "dificultad": "fácil|medio|difícil",
            "categoria": "combate|exploración|recursos|secretos|logros"
        }
    ],
    "consejos_pro": [
        {
            "titulo": "título del consejo",
            "descripcion": "consejo profesional explicado"
        }
    ],
    "secretos": [
        {
            "titulo": "nombre del secreto",
            "descripcion": "cómo encontrarlo o activarlo",
            "ubicacion": "dónde está (si aplica)"
        }
    ],
    "mejores_armas": [
        {
            "nombre": "nombre del arma/equipo",
            "porque": "por qué es buena"
        }
    ],
    "resumen": "breve resumen de 2 líneas sobre lo mejor del juego"
}

Reglas:
- Si el juego no existe o no lo conoces, responde con tips genéricos para juegos de ese estilo.
- Máximo 3 items por categoría.
- NO uses markdown, solo JSON puro.`;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            
            console.log('✅ Respuesta Gemini recibida');
            
            // Intentar parsear el JSON
            try {
                // Limpiar posibles backticks de markdown
                const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const data = JSON.parse(cleanText);
                
                return {
                    success: true,
                    juego: gameName,
                    fuente: 'Gemini AI',
                    ...data
                };
            } catch (parseError) {
                console.error('Error parseando JSON de Gemini:', parseError);
                // Si falla el parseo, devolver el texto como consejo
                return {
                    success: true,
                    juego: gameName,
                    fuente: 'Gemini AI',
                    trucos: [],
                    consejos_pro: [{
                        titulo: 'Consejos de Gemini',
                        descripcion: text.substring(0, 500)
                    }],
                    secretos: [],
                    mejores_armas: [],
                    resumen: text.substring(0, 200)
                };
            }
            
        } catch (error) {
            console.error('❌ Error con Gemini:', error);
            return this.obtenerFallback(gameName);
        }
    }

    /**
     * Buscar consejos rápidos (respuesta corta)
     */
    async buscarConsejoRapido(gameName, pregunta) {
        console.log('🎮 Gemini pregunta rápida:', pregunta);
        
        try {
            const prompt = `Eres un experto en videojuegos. Responde esta pregunta sobre "${gameName}": ${pregunta}
            
Responde en máximo 3 líneas, directo y útil. No uses markdown.`;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            
            return {
                success: true,
                juego: gameName,
                pregunta: pregunta,
                respuesta: text,
                fuente: 'Gemini AI'
            };
        } catch (error) {
            console.error('❌ Error Gemini rápido:', error);
            return {
                success: false,
                error: 'No pude encontrar esa información'
            };
        }
    }

    /**
     * Fallback cuando Gemini falla
     */
    obtenerFallback(gameName) {
        const tipsGenerales = {
            trucos: [
                {
                    titulo: 'Explora cada rincón',
                    descripcion: 'Muchos juegos esconden secretos en zonas poco visibles. Revisa detrás de cascadas, paredes falsas y techos.',
                    dificultad: 'fácil',
                    categoria: 'exploración'
                },
                {
                    titulo: 'Guarda partida frecuentemente',
                    descripcion: 'Usa múltiples slots de guardado para poder volver atrás si algo sale mal.',
                    dificultad: 'fácil',
                    categoria: 'recursos'
                }
            ],
            consejos_pro: [
                {
                    titulo: 'Aprende los patrones',
                    descripcion: 'Observa los patrones de ataque de los enemigos y jefes. Siempre tienen una ventana de vulnerabilidad.'
                },
                {
                    titulo: 'Gestiona tus recursos',
                    descripcion: 'No malgastes objetos curativos al inicio. Guárdalos para las fases finales o jefes difíciles.'
                }
            ],
            resumen: `Para ${gameName}, te recomiendo explorar a fondo, guardar frecuentemente y aprender los patrones enemigos. ¡Disfruta la experiencia!`
        };
        
        return {
            success: true,
            juego: gameName,
            fuente: 'NexPixel Tips (offline)',
            ...tipsGenerales
        };
    }
}

export default new GeminiTipsService();