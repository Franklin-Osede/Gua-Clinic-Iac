import React, { useState } from 'react';
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
  
  const localImagePath = getDoctorImagePath(doctorId, doctorName);
  
  // Log para debugging
  if (doctorName) {
    console.log(`🖼️ DoctorImage - ID: ${doctorId}, Nombre: "${doctorName}", FotoPerfil: ${dricloudImage ? 'Sí' : 'No'}, LocalPath: ${localImagePath || 'No'}`);
  }
  
  // Si hay imagen de DriCloud y no ha fallado, intentar usarla
  if (dricloudImage && dricloudImage.trim() !== '' && !imageError) {
    return (
      <img
        src={dricloudImage}
        alt={alt}
        className={className}
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }
  
  // Si hay imagen local y no ha fallado, usarla
  if (localImagePath && !fallbackError) {
    return (
      <img
        src={localImagePath}
        alt={alt}
        className={className}
        onError={() => {
          setFallbackError(true);
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

