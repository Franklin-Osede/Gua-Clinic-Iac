import { getCdnBaseUrl } from '../config/api.config';

/**
 * Mapeo de doctor_id a ruta de imagen local
 * Estas imágenes se usarán como fallback cuando la imagen de DriCloud no esté disponible
 * 
 * Fotos optimizadas disponibles en public/doctors/ (formato WebP):
 * - 50.webp (Nicolas Nervo)
 * - 63.webp (Andrés Vargas)
 * - Adoracion Gil.webp
 * - ANDREA NOYA.webp
 * - ANDRES VARGAS.webp
 * - CARLOS BLANCO.webp
 * - Diego Puebla.webp
 * - Héctor Ajubita Fernández.webp
 * - JASMINA.webp
 * - MARIA_CONSUELO.webp
 * - María José Suárez Herrera.webp
 * - NICOLAS NERVO.webp
 * - Pablo Juárez del Dago.webp
 * - Francisco Juárez del Dago.webp
 */
export const doctorImageMap: Record<number, string> = {
  3: '/doctors/3.webp',
  4: '/doctors/4.webp',
  5: '/doctors/Pablo Juárez del Dago.webp', // Dr. Pablo Juárez
  18: '/doctors/18.webp',
  20: '/doctors/JASMINA.webp', // Jasmina García Velázquez - Fisioterapia/Psicología
  24: '/doctors/CARLOS BLANCO.webp', // Carlos Blanco
  25: '/doctors/25.webp',
  26: '/doctors/26.webp',
  33: '/doctors/33.webp',
  44: '/doctors/MARIA_CONSUELO.webp', // María Consuelo Calvo Garcia - Medicina Rehabilitadora
  50: '/doctors/50.webp', // Nicolas Nervo Posada
  56: '/doctors/56.webp',
  63: '/doctors/63.webp', // Andrés Humberto Vargas Trujillo
};

/**
 * Mapeo de nombres de doctores a rutas de imagen
 * Se usa cuando no se encuentra por ID
 * 
 * Doctores con fotos disponibles:
 * - Francisco Juarez: https://urologiayandrologia.com/doctor/dr-francisco-juarez-del-dago-pendas/
 * - Adoracion Gil: https://urologiayandrologia.com/doctor/dra-adoracion-gil/
 * - Maria Suarez: https://urologiayandrologia.com/doctor/maria-jose-suarez-herrera/
 * - Diego Puebla (medicina preventiva/integrativa): https://urologiayandrologia.com/medicina-integrativa-dr-diego-puebla/
 * - Pablo Juarez: https://urologiayandrologia.com/doctor/dr-pablo-juarez-del-dago/
 * - Hector Ajubita: (foto disponible en public/doctors/)
 */
const doctorNameMap: Record<string, string> = {
  'nicolas nervo': '/doctors/NICOLAS NERVO.webp',
  'nicolas nervo posada': '/doctors/NICOLAS NERVO.webp',
  'andres vargas': '/doctors/ANDRES VARGAS.webp',
  'andres humberto vargas': '/doctors/ANDRES VARGAS.webp',
  'andres humberto vargas trujillo': '/doctors/ANDRES VARGAS.webp',
  'andrea noya': '/doctors/ANDREA NOYA.webp',
  'carlos blanco': '/doctors/CARLOS BLANCO.webp',
  'carlos blanco- soler palacios-pelletier': '/doctors/CARLOS BLANCO.webp', // Nombre completo de DriCloud
  'carlos blanco soler palacios pelletier': '/doctors/CARLOS BLANCO.webp',
  'jasmina': '/doctors/JASMINA.webp',
  'jasmina garcia': '/doctors/JASMINA.webp',
  'jasmina garcia velazquez': '/doctors/JASMINA.webp',
  'maria consuelo': '/doctors/MARIA_CONSUELO.webp',
  'maria consuelo calvo garcia': '/doctors/MARIA_CONSUELO.webp', // Nombre completo de DriCloud
  'maria consuelo calvo': '/doctors/MARIA_CONSUELO.webp',
  'consuelo calvo garcia': '/doctors/MARIA_CONSUELO.webp',
  'consuelo': '/doctors/MARIA_CONSUELO.webp',
  // Variaciones que DriCloud puede devolver (sin "Consuelo")
  'maria calvo': '/doctors/MARIA_CONSUELO.webp', // DriCloud puede devolver solo "Maria Calvo"
  'maria calvo garcia': '/doctors/MARIA_CONSUELO.webp',
  'calvo garcia': '/doctors/MARIA_CONSUELO.webp',
  'calvo': '/doctors/MARIA_CONSUELO.webp',
  'diego puebla': '/doctors/Diego Puebla.webp',
  'hector ajubita': '/doctors/Héctor Ajubita Fernández.webp',
  'hector ajubita fernandez': '/doctors/Héctor Ajubita Fernández.webp',
  'maria jose suarez': '/doctors/María José Suárez Herrera .webp',
  'maria jose suarez herrera': '/doctors/María José Suárez Herrera .webp',
  'maria suarez': '/doctors/María José Suárez Herrera .webp',
  'adoracion gil': '/doctors/Adoracion Gil.webp',
  'adoracion gil bolanos': '/doctors/Adoracion Gil.webp', // Nombre completo de DriCloud
  'adoracion': '/doctors/Adoracion Gil.webp',
  'pablo juarez': '/doctors/Pablo Juárez del Dago.webp',
  'pablo juarez del dago': '/doctors/Pablo Juárez del Dago.webp',
  'francisco juarez': '/doctors/ Francisco Juárez del Dago.webp', // Nota: el archivo tiene espacio al inicio
  'francisco juarez del dago': '/doctors/ Francisco Juárez del Dago.webp',
  'francisco juarez del dago pendas': '/doctors/ Francisco Juárez del Dago.webp',
};

/**
 * Normaliza un nombre para búsqueda (quita acentos, minúsculas, espacios extra)
 */
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim()
    .replace(/\s+/g, ' '); // Normalizar espacios
};

/**
 * Obtiene la ruta de la imagen local para un doctor
 * @param doctorId ID del doctor
 * @param doctorName Nombre del doctor (opcional, para búsqueda por nombre)
 * @returns URL completa de la imagen (con CDN si está configurado) o null si no existe
 */
export const getDoctorImagePath = (doctorId: number, doctorName?: string): string | null => {
  let relativePath: string | null = null;
  
  // Primero intentar por ID
  if (doctorImageMap[doctorId]) {
    relativePath = doctorImageMap[doctorId];
    console.log(`✅ Imagen encontrada por ID ${doctorId}: ${relativePath}`);
  } else if (doctorName) {
  // Si no se encuentra por ID y hay nombre, intentar por nombre
    const normalizedName = normalizeName(doctorName);
    console.log(`🔍 Buscando imagen por nombre: "${doctorName}" (normalizado: "${normalizedName}")`);
    
    // Búsqueda exacta primero
    if (doctorNameMap[normalizedName]) {
      relativePath = doctorNameMap[normalizedName];
      console.log(`✅ Imagen encontrada por nombre exacto: ${relativePath}`);
    } else {
    // Búsqueda parcial más flexible
    for (const [key, path] of Object.entries(doctorNameMap)) {
      // Verificar si alguna parte del nombre coincide
      const nameParts = normalizedName.split(' ').filter(p => p.length > 2); // Solo partes con más de 2 caracteres
      const keyParts = key.split(' ').filter(p => p.length > 2);
      
      // Verificar si hay coincidencias significativas
      const hasMatch = nameParts.some(part => 
        keyParts.some(keyPart => 
          part.includes(keyPart) || keyPart.includes(part)
        )
      ) || normalizedName.includes(key) || key.includes(normalizedName);
      
      if (hasMatch) {
          relativePath = path;
        console.log(`✅ Imagen encontrada por búsqueda parcial: "${key}" -> ${path}`);
          break;
        }
      }
    }
    
    if (!relativePath) {
    console.log(`❌ No se encontró imagen para: "${doctorName}" (normalizado: "${normalizedName}")`);
    }
  }
  
  // Si no se encontró imagen, retornar null
  if (!relativePath) {
  return null;
  }
  
  // Construir URL completa con CDN si está configurado
  const cdnBase = getCdnBaseUrl();
  if (cdnBase) {
    // Asegurar que la ruta relativa no tenga leading slash duplicado
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${cdnBase}${cleanPath}`;
  }
  
  // En desarrollo, retornar ruta relativa
  return relativePath;
};

