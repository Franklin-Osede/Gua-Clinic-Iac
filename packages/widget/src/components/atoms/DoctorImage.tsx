import React, { useState, useEffect } from 'react';
import { getDoctorImagePath } from '../../utils/doctorImages';

interface DoctorImageProps {
  doctorId: number;
  dricloudImage?: string;
  alt: string;
  className?: string;
  doctorName?: string; // Nombre del doctor para búsqueda por nombre
}

/**
 * Componente que maneja la visualización de imágenes de doctores con fallback automático
 * 
 * Orden de prioridad:
 * 1. Imagen de DriCloud (si está disponible y carga correctamente)
 * 2. Imagen local del doctor (si existe en el mapeo por ID o nombre)
 * 3. Placeholder genérico
 */
const DoctorImage: React.FC<DoctorImageProps> = ({
  doctorId,
  dricloudImage,
  alt,
  className = 'w-full h-full object-cover',
  doctorName,
}) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  
  const localImagePath = getDoctorImagePath(doctorId, doctorName);
  
  // Log para debugging
  useEffect(() => {
    if (doctorName) {
      console.log(`🖼️ DoctorImage - ID: ${doctorId}, Nombre: "${doctorName}", FotoPerfil: ${dricloudImage ? 'Sí' : 'No'}, LocalPath: ${localImagePath || 'No'}`);
    }
  }, [doctorId, doctorName, dricloudImage, localImagePath]);
  
  // Resetear estado cuando cambian las props (doctorId o localImagePath)
  useEffect(() => {
    // Resetear todos los estados cuando cambia el doctorId o localImagePath
    setImageError(false);
    setFallbackError(false);
    setCurrentImageSrc(null);
    
    // Inicializar directamente con la ruta local si está disponible
    if (localImagePath) {
      setCurrentImageSrc(localImagePath);
      console.log(`🖼️ Inicializando carga de imagen local: "${localImagePath}"`);
    }
  }, [doctorId, localImagePath]);
  
  // Si hay imagen de DriCloud y no ha fallado, intentar usarla
  if (dricloudImage && dricloudImage.trim() !== '' && !imageError) {
    return (
      <img
        src={dricloudImage}
        alt={alt}
        className={className}
        onError={() => {
          console.error(`❌ Error al cargar imagen de DriCloud para ${doctorName || doctorId}`);
          setImageError(true);
        }}
        onLoad={() => {
          console.log(`✅ Imagen de DriCloud cargada exitosamente para ${doctorName || doctorId}`);
        }}
      />
    );
  }
  
  // Si hay imagen local, intentar cargarla
  if (localImagePath && !fallbackError && currentImageSrc) {
    return (
      <img
        src={currentImageSrc}
        alt={alt}
        className={className}
        onError={() => {
          console.error(`❌ Error al cargar imagen local: "${currentImageSrc}"`);
          console.error(`❌ URL completa: ${window.location.origin}${currentImageSrc}`);
          setFallbackError(true);
        }}
        onLoad={() => {
          console.log(`✅ Imagen local cargada exitosamente: "${currentImageSrc}"`);
        }}
      />
    );
  }
  
  // Placeholder si todo falla
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
      <span className="text-gray-500 text-xs font-semibold">DR</span>
    </div>
  );
};

export default DoctorImage;

