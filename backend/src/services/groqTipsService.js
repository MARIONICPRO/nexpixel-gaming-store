// ============================================
// GROQ TIPS SERVICE - CON FALLBACK POR CATEGORÍA
// ============================================
import Groq from 'groq-sdk';

class GroqTipsService {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY || 'TU_API_KEY_DE_GROQ'
        });
        
        this.tipsLocales = this.cargarTipsLocales();
        this.tipsPorCategoria = this.cargarTipsPorCategoria();
    }

    cargarTipsLocales() {
        return {
            'resident evil 4': {
                trucos: [
                    { titulo: 'Munición infinita', descripcion: 'Completa el juego en Profesional con rango S+.', dificultad: 'difícil', categoria: 'recursos' },
                    { titulo: 'Cuchillo indestructible', descripcion: 'Destruye los 16 muñecos mecánicos.', dificultad: 'medio', categoria: 'secretos' },
                    { titulo: 'Armas infinitas', descripcion: 'Compra el bono de mejora exclusiva.', dificultad: 'difícil', categoria: 'combate' }
                ],
                consejos_pro: [
                    { titulo: 'Ahorra munición', descripcion: 'Usa pistola y cuchillo las primeras 2 horas.' },
                    { titulo: 'El cuchillo es clave', descripcion: 'Apunta a rodillas y remata con cuchillo.' },
                    { titulo: 'Aprende parry', descripcion: 'Presiona L1 justo antes del ataque enemigo.' }
                ],
                secretos: [
                    { titulo: 'Huevo de oro', descripcion: 'Pesca en el lago, véndelo por 10,000 pesetas.', ubicacion: 'Lago, antes del castillo' },
                    { titulo: 'Accesorio puntería', descripcion: 'Completa en Difícil o superior.', ubicacion: 'Recompensa' },
                    { titulo: 'Traje especial', descripcion: 'Completa en Profesional.', ubicacion: 'Recompensa final' }
                ],
                resumen: 'Resident Evil 4 Remake: administra recursos, usa el cuchillo y aprende parry.'
            }
        };
    }

    cargarTipsPorCategoria() {
        return {
            'accion': {
                trucos: [
                    { titulo: 'Domina el combate', descripcion: 'Aprende los combos básicos y practica el timing de esquivas y bloqueos.', dificultad: 'medio', categoria: 'combate' },
                    { titulo: 'Mejora tus armas', descripcion: 'Prioriza mejorar el daño y la velocidad de ataque antes que la defensa.', dificultad: 'fácil', categoria: 'recursos' },
                    { titulo: 'Usa el entorno', descripcion: 'Muchos juegos de acción tienen objetos explosivos o trampas ambientales que puedes usar.', dificultad: 'fácil', categoria: 'exploración' }
                ],
                consejos_pro: [
                    { titulo: 'Aprende los patrones', descripcion: 'Cada enemigo tiene un patrón de ataque. Obsérvalo 2-3 veces antes de atacar.' },
                    { titulo: 'Esquiva, no bloquees', descripcion: 'En juegos de acción rápida, esquivar gasta menos recursos que bloquear.' },
                    { titulo: 'Combos en el aire', descripcion: 'Los enemigos son más vulnerables en el aire. Practica combos aéreos.' }
                ],
                secretos: [
                    { titulo: 'Zonas ocultas', descripcion: 'Revisa detrás de cascadas, paredes agrietadas y techos bajos.', ubicacion: 'Todo el mapa' },
                    { titulo: 'Jefe secreto', descripcion: 'Completa todas las misiones secundarias antes del punto sin retorno.', ubicacion: 'Final del juego' },
                    { titulo: 'Arma legendaria', descripcion: 'Busca cofres dorados en las zonas de mayor dificultad.', ubicacion: 'Zonas avanzadas' }
                ],
                resumen: 'Domina los combos, aprende patrones enemigos y explora cada rincón del mapa.'
            },
            'deportes': {
                trucos: [
                    { titulo: 'Domina los controles', descripcion: 'Practica los tutoriales avanzados. Muchos jugadores se saltan mecánicas clave.', dificultad: 'fácil', categoria: 'combate' },
                    { titulo: 'Gestiona la stamina', descripcion: 'No corras todo el partido. Guarda energía para los momentos clave.', dificultad: 'medio', categoria: 'recursos' },
                    { titulo: 'Aprende las formaciones', descripcion: 'Cambia de formación según el rival. Una formación adaptable gana partidos.', dificultad: 'medio', categoria: 'combate' }
                ],
                consejos_pro: [
                    { titulo: 'Pases al espacio', descripcion: 'Usa pases en profundidad en lugar de pases directos para romper líneas.' },
                    { titulo: 'Defensa en zona', descripcion: 'No persigas al jugador con el balón. Cubre los espacios de pase.' },
                    { titulo: 'Practica tiros libres', descripcion: 'Dedica 10 minutos al día a practicar tiros libres. Marcan la diferencia.' }
                ],
                secretos: [
                    { titulo: 'Jugadores ocultos', descripcion: 'Completa desafíos específicos para desbloquear leyendas.', ubicacion: 'Modo desafíos' },
                    { titulo: 'Estadio especial', descripcion: 'Gana todos los torneos para desbloquear estadios únicos.', ubicacion: 'Modo torneo' },
                    { titulo: 'Celebraciones secretas', descripcion: 'Combina botones después de marcar para celebraciones únicas.', ubicacion: 'Durante el partido' }
                ],
                resumen: 'Practica los fundamentos, gestiona la stamina y adapta tu estrategia al rival.'
            },
            'rpg': {
                trucos: [
                    { titulo: 'Build equilibrada', descripcion: 'No te especialices demasiado. Un personaje versátil sobrevive mejor.', dificultad: 'fácil', categoria: 'combate' },
                    { titulo: 'Farmea inteligentemente', descripcion: 'Encuentra zonas con enemigos que den buena experiencia y suelten objetos valiosos.', dificultad: 'medio', categoria: 'recursos' },
                    { titulo: 'Guarda antes de decisiones', descripcion: 'Siempre guarda partida antes de diálogos importantes o elecciones.', dificultad: 'fácil', categoria: 'recursos' }
                ],
                consejos_pro: [
                    { titulo: 'Lee las descripciones', descripcion: 'Muchos objetos tienen usos ocultos descritos en su texto. No los vendas sin leer.' },
                    { titulo: 'Habla con todos', descripcion: 'Los NPCs suelen dar pistas de misiones secundarias y secretos.' },
                    { titulo: 'Rota tu equipo', descripcion: 'No te cases con un solo set. Cambia según el tipo de enemigo o zona.' }
                ],
                secretos: [
                    { titulo: 'Mazmorra oculta', descripcion: 'Busca entradas alternativas en las paredes de las mazmorras principales.', ubicacion: 'Mazmorras' },
                    { titulo: 'Compañero secreto', descripcion: 'Completa cierta cadena de misiones para reclutar un aliado único.', ubicacion: 'Varía según el juego' },
                    { titulo: 'Final alternativo', descripcion: 'Toma decisiones específicas durante la historia principal.', ubicacion: 'Puntos clave de la historia' }
                ],
                resumen: 'Construye un personaje versátil, habla con todos los NPCs y explora cada rincón.'
            },
            'terror': {
                trucos: [
                    { titulo: 'Gestiona el inventario', descripcion: 'Lleva solo lo esencial. El espacio es limitado y cada objeto cuenta.', dificultad: 'medio', categoria: 'recursos' },
                    { titulo: 'No pelees siempre', descripcion: 'A veces huir es la mejor opción. No malgastes munición en cada enemigo.', dificultad: 'fácil', categoria: 'combate' },
                    { titulo: 'Escucha los sonidos', descripcion: 'El audio es clave. Los enemigos hacen ruido antes de aparecer.', dificultad: 'fácil', categoria: 'exploración' }
                ],
                consejos_pro: [
                    { titulo: 'Guarda en slots separados', descripcion: 'Usa múltiples ranuras de guardado por si te quedas sin recursos.' },
                    { titulo: 'Aprende las rutas de escape', descripcion: 'Siempre ten una ruta de huida planeada antes de entrar a una zona nueva.' },
                    { titulo: 'Usa el entorno', descripcion: 'Cierra puertas, tira objetos para distraer y usa la oscuridad a tu favor.' }
                ],
                secretos: [
                    { titulo: 'Habitación oculta', descripcion: 'Revisa cuadros, estanterías y muebles. Pueden esconder pasajes.', ubicacion: 'Edificios principales' },
                    { titulo: 'Arma definitiva', descripcion: 'Completa el juego en la dificultad más alta.', ubicacion: 'Nueva partida+' },
                    { titulo: 'Final verdadero', descripcion: 'Recoge todos los coleccionables para ver el final completo.', ubicacion: 'Todo el juego' }
                ],
                resumen: 'Gestiona recursos, aprende cuándo huir y presta atención al audio.'
            },
            'default': {
                trucos: [
                    { titulo: 'Explora cada rincón', descripcion: 'Revisa detrás de cascadas, paredes falsas y techos.', dificultad: 'fácil', categoria: 'exploración' },
                    { titulo: 'Guarda partida frecuentemente', descripcion: 'Usa múltiples slots para volver atrás si algo sale mal.', dificultad: 'fácil', categoria: 'recursos' },
                    { titulo: 'Prueba diferentes estrategias', descripcion: 'Si algo no funciona, cambia de enfoque.', dificultad: 'medio', categoria: 'combate' }
                ],
                consejos_pro: [
                    { titulo: 'Aprende los patrones', descripcion: 'Los enemigos repiten patrones. Obsérvalos para encontrar su debilidad.' },
                    { titulo: 'Gestiona tus recursos', descripcion: 'Guarda objetos valiosos para fases finales o jefes difíciles.' },
                    { titulo: 'Lee los tutoriales', descripcion: 'Muchos juegos esconden mecánicas avanzadas en los menús de ayuda.' }
                ],
                secretos: [
                    { titulo: 'Contenido desbloqueable', descripcion: 'Completa el juego una vez para acceder a contenido adicional.', ubicacion: 'Nueva partida+' },
                    { titulo: 'Modos alternativos', descripcion: 'Busca en el menú principal modos de juego ocultos.', ubicacion: 'Menú principal' },
                    { titulo: 'Comunidad online', descripcion: 'Únete a foros para descubrir secretos de otros jugadores.', ubicacion: 'Internet' }
                ],
                resumen: 'Explora a fondo, aprende patrones enemigos y gestiona bien tus recursos.'
            }
        };
    }

    buscarEnDB(gameName) {
        const name = gameName.toLowerCase();
        for (const [key, tips] of Object.entries(this.tipsLocales)) {
            if (name.includes(key)) return tips;
        }
        return null;
    }

    buscarPorCategoria(categoria) {
        const cat = categoria?.toLowerCase() || 'default';
        return this.tipsPorCategoria[cat] || this.tipsPorCategoria['default'];
    }

    limpiarJSON(text) {
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
        text = text.trim();
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            text = text.substring(startIndex, endIndex + 1);
        }
        return text;
    }

    async buscarConsejos(gameName, categoria = null) {
        console.log('⚡ Groq buscando consejos para:', gameName);

        try {
            const prompt = `Eres un experto en videojuegos. Para "${gameName}", responde EXACTAMENTE con este JSON. TIENES QUE PONER 3 ITEMS EN CADA ARRAY:

{
    "trucos": [
        {"titulo":"...","descripcion":"...","dificultad":"fácil","categoria":"combate"},
        {"titulo":"...","descripcion":"...","dificultad":"medio","categoria":"exploración"},
        {"titulo":"...","descripcion":"...","dificultad":"difícil","categoria":"recursos"}
    ],
    "consejos_pro": [
        {"titulo":"...","descripcion":"..."},
        {"titulo":"...","descripcion":"..."},
        {"titulo":"...","descripcion":"..."}
    ],
    "secretos": [
        {"titulo":"...","descripcion":"...","ubicacion":"..."},
        {"titulo":"...","descripcion":"...","ubicacion":"..."},
        {"titulo":"...","descripcion":"...","ubicacion":"..."}
    ],
    "resumen":"Breve resumen de 2 líneas"
}

⚠️ OBLIGATORIO: 3 items en CADA array. Si no conoces el juego, inventa 3 creíbles basados en su género. NO pongas menos de 3. Solo responde con el JSON, sin markdown.`;

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                max_tokens: 800
            });

            let text = chatCompletion.choices[0]?.message?.content || '';
            text = this.limpiarJSON(text);

            const data = JSON.parse(text);

            if (!data.trucos?.length && !data.consejos_pro?.length) {
                console.log('⚠️ Groq no conoce el juego, buscando alternativas...');
                const tipsLocales = this.buscarEnDB(gameName);
                if (tipsLocales) {
                    return { success: true, juego: gameName, fuente: 'NexPixel Tips', ...tipsLocales };
                }
                const tipsCategoria = this.buscarPorCategoria(categoria);
                return { success: true, juego: gameName, fuente: 'NexPixel Tips', ...tipsCategoria };
            }

            return {
                success: true,
                juego: gameName,
                fuente: 'IA Groq',
                trucos: data.trucos?.slice(0, 3) || [],
                consejos_pro: data.consejos_pro?.slice(0, 3) || [],
                secretos: data.secretos?.slice(0, 3) || [],
                resumen: data.resumen || `Consejos para ${gameName}`
            };

        } catch (error) {
            console.log('⚠️ Groq falló:', error.message);
            const tipsLocales = this.buscarEnDB(gameName);
            if (tipsLocales) {
                return { success: true, juego: gameName, fuente: 'NexPixel Tips', ...tipsLocales };
            }
            const tipsCategoria = this.buscarPorCategoria(categoria);
            return { success: true, juego: gameName, fuente: 'NexPixel Tips', ...tipsCategoria };
        }
    }

    async buscarConsejoRapido(gameName, pregunta) {
        console.log('⚡ Groq pregunta:', pregunta);

        try {
            const prompt = `Responde en máximo 3 líneas esta pregunta sobre "${gameName}": ${pregunta}`;

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.5,
                max_tokens: 150
            });

            return {
                success: true,
                juego: gameName,
                pregunta: pregunta,
                respuesta: chatCompletion.choices[0]?.message?.content?.trim() || 'Sin respuesta',
                fuente: 'IA Groq'
            };

        } catch (error) {
            return {
                success: true,
                juego: gameName,
                pregunta: pregunta,
                respuesta: 'La IA no está disponible. Intenta de nuevo.',
                fuente: 'NexPixel'
            };
        }
    }
}

export default new GroqTipsService();