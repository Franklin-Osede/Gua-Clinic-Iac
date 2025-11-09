/**
 * Mapeo de doctor_id a ruta de imagen local
 * Estas imágenes se usarán como fallback cuando la imagen de DriCloud no esté disponible
 */
export const doctorImageMap: Record<number, string> = {
  3: '/doctors/3.jpg',
  4: '/doctors/4.jpg',
  5: '/doctors/5.jpg',
  18: '/doctors/18.jpg',
  20: '/doctors/20.jpg',
  24: '/doctors/24.jpg',
  25: '/doctors/25.jpg',
  26: '/doctors/26.jpg',
  33: '/doctors/33.jpg',
  44: '/doctors/44.jpg',
  50: '/doctors/50.png', // Nicolas Nervo Posada
  56: '/doctors/56.jpg',
  63: '/doctors/63.png', // Andrés Humberto Vargas Trujillo
};

/**
 * Obtiene la ruta de la imagen local para un doctor
 * @param doctorId ID del doctor
 * @returns Ruta de la imagen o null si no existe
 */
export const getDoctorImagePath = (doctorId: number): string | null => {
  return doctorImageMap[doctorId] || null;
};

