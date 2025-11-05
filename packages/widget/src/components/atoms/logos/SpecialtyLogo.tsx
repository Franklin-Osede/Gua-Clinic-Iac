import { FC } from "react";

interface SpecialtyLogoProps {
  specialtyName: string;
  disabled: boolean;
}

// Fallback: usar componentes existentes si no hay SVG
import UrologyLogo from "./UrologyLogo";

// Mapeo de especialidades a archivos SVG
// En desarrollo: usar fallback URO (CDN no disponible), en producción: usar CDN
const isDevelopment = import.meta.env.DEV;
const CDN_BASE_URL = 'https://cdn.gua.com';

const SVG_MAP: Record<string, string | null> = {
  'urologia': isDevelopment ? null : `${CDN_BASE_URL}/logos/UROLOGÍA.svg`,
  'andrologia': isDevelopment ? null : `${CDN_BASE_URL}/logos/Andrología.svg`,
  'medicinasexual': isDevelopment ? null : `${CDN_BASE_URL}/logos/Andrología.svg`,
  'ginecologia': isDevelopment ? null : `${CDN_BASE_URL}/logos/ginecología.svg`,
  'fisioterapia': isDevelopment ? null : `${CDN_BASE_URL}/logos/Fisioterapia.svg`,
  'medicinafisica': isDevelopment ? null : `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`,
  'rehabilitacion': isDevelopment ? null : `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`,
  'psicologia': isDevelopment ? null : `${CDN_BASE_URL}/logos/psicología.svg`,
  'medicinaintegrativa': isDevelopment ? null : `${CDN_BASE_URL}/logos/medicina integrativa.svg`,
};

export const SpecialtyLogo: FC<SpecialtyLogoProps> = ({ specialtyName, disabled }) => {
  // Normalizar el nombre para matching (sin espacios, minúsculas, sin números)
  const normalizedName = (specialtyName || '')
    .toLowerCase()
    .replace(/^\d+\.?\s*/g, '') // Remover prefijos numéricos como "01. " o "29."
    .replace(/[^a-záéíóúñü]/g, '') // Remover caracteres especiales
    .trim();
  
  // Buscar SVG correspondiente
  let svgPath: string | null = null;
  for (const [key, path] of Object.entries(SVG_MAP)) {
    if (normalizedName.includes(key)) {
      svgPath = path;
      break;
    }
  }
  
  // En desarrollo, usar fallback directamente (CDN no disponible)
  // En producción, intentar cargar desde CDN
  if (isDevelopment || !svgPath) {
    return <UrologyLogo disabled={disabled} />;
  }
  
  const logoStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    opacity: disabled ? 0.4 : 1,
    objectFit: 'contain',
  };
  
  // Intentar cargar desde CDN
  return (
    <img 
      src={svgPath} 
      alt={specialtyName} 
      style={logoStyle}
      onError={(e) => {
        // Si falla cargar el SVG, usar fallback
        console.warn(`Failed to load logo for ${specialtyName} from CDN, using fallback`);
        // Esto debería ser manejado por el componente padre, pero por ahora usamos fallback
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

export default SpecialtyLogo;

