/**
 * Mapeo de doctor_id a ruta de imagen local
 * Estas imágenes se usarán como fallback cuando la imagen de DriCloud no esté disponible
 * 
 * Fotos disponibles en public/doctors/:
 * - 50.png (Nicolas Nervo)
 * - 63.png (Andrés Vargas)
 * - Adoracion Gil.png
 * - ANDREA NOYA.png
 * - ANDRES VARGAS.png
 * - CARLOS BLANCO.png
 * - Diego Puebla.jpg
 * - Héctor Ajubita Fernández.jpg
 * - JASMINA.png
 * - MARÍA CONSUELO.png
 * - María José Suárez Herrera .jpg
 * - NICOLAS NERVO.png
 * - Pablo Juárez del Dago.jpg
 * - Francisco Juárez del Dago.jpg
 */
export const doctorImageMap: Record<number, string> = {
  3: '/doctors/3.jpg',
  4: '/doctors/4.jpg',
  5: '/doctors/Pablo Juárez del Dago.jpg', // Dr. Pablo Juárez
  18: '/doctors/18.jpg',
  20: '/doctors/JASMINA.png', // Jasmina García Velázquez - Fisioterapia/Psicología
  24: '/doctors/CARLOS BLANCO.png', // Carlos Blanco - corregido: el archivo es CARLOS BLANCO.png, no 24.jpg
  25: '/doctors/25.jpg',
  26: '/doctors/26.jpg',
  33: '/doctors/33.jpg',
  44: '/doctors/44.jpg',
  50: '/doctors/50.png', // Nicolas Nervo Posada
  56: '/doctors/56.jpg',
  63: '/doctors/63.png', // Andrés Humberto Vargas Trujillo
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
  'nicolas nervo': '/doctors/NICOLAS NERVO.png',
  'nicolas nervo posada': '/doctors/NICOLAS NERVO.png',
  'andres vargas': '/doctors/ANDRES VARGAS.png',
  'andres humberto vargas': '/doctors/ANDRES VARGAS.png',
  'andres humberto vargas trujillo': '/doctors/ANDRES VARGAS.png',
  'andrea noya': '/doctors/ANDREA NOYA.png',
  'carlos blanco': '/doctors/CARLOS BLANCO.png',
  'carlos blanco- soler palacios-pelletier': '/doctors/CARLOS BLANCO.png', // Nombre completo de DriCloud
  'carlos blanco soler palacios pelletier': '/doctors/CARLOS BLANCO.png',
  'jasmina': '/doctors/JASMINA.png',
  'jasmina garcia': '/doctors/JASMINA.png',
  'jasmina garcia velazquez': '/doctors/JASMINA.png',
  'maria consuelo': '/doctors/MARÍA CONSUELO.png',
  'diego puebla': '/doctors/Diego Puebla.jpg',
  'hector ajubita': '/doctors/Héctor Ajubita Fernández.jpg',
  'hector ajubita fernandez': '/doctors/Héctor Ajubita Fernández.jpg',
  'maria jose suarez': '/doctors/María José Suárez Herrera .jpg',
  'maria jose suarez herrera': '/doctors/María José Suárez Herrera .jpg',
  'maria suarez': '/doctors/María José Suárez Herrera .jpg',
  'adoracion gil': '/doctors/Adoracion Gil.png',
  'adoracion gil bolanos': '/doctors/Adoracion Gil.png', // Nombre completo de DriCloud
  'adoracion': '/doctors/Adoracion Gil.png',
  'pablo juarez': '/doctors/Pablo Juárez del Dago.jpg',
  'pablo juarez del dago': '/doctors/Pablo Juárez del Dago.jpg',
  'francisco juarez': '/doctors/ Francisco Juárez del Dago.jpg',
  'francisco juarez del dago': '/doctors/ Francisco Juárez del Dago.jpg',
  'francisco juarez del dago pendas': '/doctors/ Francisco Juárez del Dago.jpg',
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
 * @returns Ruta de la imagen o null si no existe
 */
export const getDoctorImagePath = (doctorId: number, doctorName?: string): string | null => {
  // Primero intentar por ID
  if (doctorImageMap[doctorId]) {
    console.log(`✅ Imagen encontrada por ID ${doctorId}: ${doctorImageMap[doctorId]}`);
    return doctorImageMap[doctorId];
  }
  
  // Si no se encuentra por ID y hay nombre, intentar por nombre
  if (doctorName) {
    const normalizedName = normalizeName(doctorName);
    console.log(`🔍 Buscando imagen por nombre: "${doctorName}" (normalizado: "${normalizedName}")`);
    
    // Búsqueda exacta primero
    if (doctorNameMap[normalizedName]) {
      console.log(`✅ Imagen encontrada por nombre exacto: ${doctorNameMap[normalizedName]}`);
      return doctorNameMap[normalizedName];
    }
    
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
        console.log(`✅ Imagen encontrada por búsqueda parcial: "${key}" -> ${path}`);
        return path;
      }
    }
    
    console.log(`❌ No se encontró imagen para: "${doctorName}" (normalizado: "${normalizedName}")`);
  }
  
  return null;
};

