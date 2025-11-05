import { FC, useState } from "react";

interface SpecialtyLogoProps {
  specialtyName: string;
  disabled: boolean;
}

// Importar logos React como fallback
import UrologyLogo from "./UrologyLogo";
import GynecologyLogo from "./GynecologyLogo";
import AndrologyLogo from "./AndrologyLogo";
import PhysicalTherapyLogo from "./PhysicalTherapyLogo";
import PsychologyLogo from "./PsychologyLogo";
import LaboratoryLogo from "./LaboratoryLogo";
import DiagnosticTestsLogo from "./DiagnosticTestsLogo";
import IntegrativeMedicineLogo from "./IntegrativeMedicineLogo";

// Función auxiliar para normalizar nombres (quitar tildes, espacios, números)
const normalizeSpecialtyName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/^\d+\.?\s*/g, '') // Remover prefijos numéricos
    .normalize('NFD') // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
    .replace(/[^a-z]/g, '') // Solo letras minúsculas
    .trim();
};

// Mapeo de especialidades a logos en el CDN
const CDN_BASE_URL = 'https://cdn.gua.com';

const SVG_MAP: Record<string, { cdn: string; fallback: FC<{ disabled: boolean }> }> = {
  'urologia': { 
    cdn: `${CDN_BASE_URL}/logos/UROLOGÍA.svg`, 
    fallback: UrologyLogo 
  },
  'andrologia': { 
    cdn: `${CDN_BASE_URL}/logos/Andrología.svg`, 
    fallback: AndrologyLogo 
  },
  'medicinasexual': { 
    cdn: `${CDN_BASE_URL}/logos/Andrología.svg`, 
    fallback: AndrologyLogo 
  },
  'ginecologia': { 
    cdn: `${CDN_BASE_URL}/logos/ginecología.svg`, 
    fallback: GynecologyLogo 
  },
  'fisioterapia': { 
    // IMPORTANTE: "Fisioterapia" en la UI es realmente "Psicología" en la API
    // Usar logo de psicología porque Fisioterapia se muestra en lugar de Psicología
    cdn: `${CDN_BASE_URL}/logos/psicología.svg`, 
    fallback: PsychologyLogo 
  },
  'psicologia': { 
    cdn: `${CDN_BASE_URL}/logos/psicología.svg`, 
    fallback: PsychologyLogo 
  },
  'medicinafisica': { 
    cdn: `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`, 
    fallback: PhysicalTherapyLogo 
  },
  'rehabilitacion': { 
    cdn: `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`, 
    fallback: PhysicalTherapyLogo 
  },
  'medicinaintegrativa': { 
    cdn: `${CDN_BASE_URL}/logos/medicina integrativa.svg`, 
    fallback: IntegrativeMedicineLogo 
  },
  'laboratorio': { 
    cdn: `${CDN_BASE_URL}/logos/laboratorio.svg`, 
    fallback: LaboratoryLogo 
  },
  'pruebasdiagnosticas': { 
    cdn: `${CDN_BASE_URL}/logos/pruebas diagnosticas.svg`, 
    fallback: DiagnosticTestsLogo 
  },
};

export const SpecialtyLogo: FC<SpecialtyLogoProps> = ({ specialtyName, disabled }) => {
  const [imageError, setImageError] = useState(false);
  
  // Normalizar el nombre usando la función auxiliar
  const normalizedName = normalizeSpecialtyName(specialtyName || '');
  
  console.log(`🎨 SpecialtyLogo: "${specialtyName}" → normalizado: "${normalizedName}"`);
  
  // Buscar logo correspondiente
  // Ordenar claves de más específicas a menos específicas para evitar matches incorrectos
  const sortedKeys = Object.keys(SVG_MAP).sort((a, b) => b.length - a.length); // Más largas primero
  
  let logoInfo: { cdn: string; fallback: FC<{ disabled: boolean }> } | null = null;
  let matchedKey: string | null = null;
  
  for (const key of sortedKeys) {
    const info = SVG_MAP[key];
    // Normalizar también la clave para comparación
    const normalizedKey = normalizeSpecialtyName(key);
    
    // Verificar si el nombre normalizado contiene la clave normalizada COMPLETA
    // Esto evita que "medicina" coincida con "medicinasexual" cuando buscamos "medicinaintegrativa"
    if (normalizedName.includes(normalizedKey)) {
      // Verificar que no hay una clave más específica que también coincida
      // Ejemplo: "medicinaintegrativa" contiene "medicina" pero debería usar "medicinaintegrativa"
      const isMoreSpecific = sortedKeys.some(otherKey => {
        if (otherKey === key) return false;
        const otherNormalized = normalizeSpecialtyName(otherKey);
        return normalizedName.includes(otherNormalized) && otherNormalized.length > normalizedKey.length;
      });
      
      if (!isMoreSpecific) {
        logoInfo = info;
        matchedKey = key;
        console.log(`✅ Logo encontrado: "${specialtyName}" → clave: "${key}" (normalizado: "${normalizedName}" contiene "${normalizedKey}")`);
        break;
      }
    }
  }
  
  // Si no encontramos match directo, intentar búsqueda más flexible para casos especiales
  if (!logoInfo) {
    // Para "Medicina Física y Rehabilitación" que se normaliza a "medicinafisicarehabilitacion"
    if (normalizedName.includes('medicina') && (normalizedName.includes('fisica') || normalizedName.includes('rehabilitacion'))) {
      logoInfo = SVG_MAP['medicinafisica'] || SVG_MAP['rehabilitacion'];
      if (logoInfo) {
        matchedKey = normalizedName.includes('fisica') ? 'medicinafisica' : 'rehabilitacion';
        console.log(`✅ Logo encontrado (búsqueda flexible): "${specialtyName}" → clave: "${matchedKey}"`);
      }
    }
  }
  
  // Si no encontramos logo, usar fallback URO
  if (!logoInfo) {
    console.warn(`⚠️ No se encontró logo para "${specialtyName}" (normalizado: "${normalizedName}"), usando fallback URO`);
    return <UrologyLogo disabled={disabled} />;
  }
  
  const FallbackComponent = logoInfo.fallback;
  const logoStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    opacity: disabled ? 0.4 : 1,
    objectFit: 'contain',
  };
  
  // En desarrollo, usar directamente los componentes React (más rápido y confiable)
  // En producción, intentar cargar desde CDN primero, y si falla usar componente React
  const isDevelopment = import.meta.env.DEV;
  
  // En desarrollo, usar siempre componente React directamente
  if (isDevelopment) {
    console.log(`🎨 Desarrollo: usando componente React para "${specialtyName}"`);
    return <FallbackComponent disabled={disabled} />;
  }
  
  // En producción: intentar cargar desde CDN, si falla usar componente React
  if (imageError) {
    console.log(`🎨 Producción: usando componente React para "${specialtyName}" (CDN falló)`);
    return <FallbackComponent disabled={disabled} />;
  }
  
  // Intentar cargar desde CDN (solo en producción)
  return (
    <img 
      src={logoInfo.cdn} 
      alt={specialtyName} 
      style={logoStyle}
      onError={() => {
        // Si falla cargar desde CDN, usar componente React como fallback
        console.warn(`⚠️ No se pudo cargar logo desde CDN para "${specialtyName}", usando fallback`);
        setImageError(true);
      }}
      onLoad={() => {
        // Si carga correctamente, resetear el estado de error
        console.log(`✅ Logo cargado desde CDN para "${specialtyName}"`);
        setImageError(false);
      }}
    />
  );
};

export default SpecialtyLogo;

