import { FC } from "react";

interface SpecialtyLogoProps {
  specialtyName: string;
  disabled: boolean;
}

// Fallback: usar componentes existentes si no hay SVG
import UrologyLogo from "./UrologyLogo";

// Mapeo de especialidades a archivos SVG (se cargarán desde CDN como los otros logos)
const CDN_BASE_URL = 'https://cdn.gua.com';
const SVG_MAP: Record<string, string> = {
  'urologia': `${CDN_BASE_URL}/logos/UROLOGÍA.svg`,
  'andrologia': `${CDN_BASE_URL}/logos/Andrología.svg`,
  'medicinasexual': `${CDN_BASE_URL}/logos/Andrología.svg`,
  'ginecologia': `${CDN_BASE_URL}/logos/ginecología.svg`,
  'fisioterapia': `${CDN_BASE_URL}/logos/Fisioterapia.svg`,
  'medicinafisica': `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`,
  'rehabilitacion': `${CDN_BASE_URL}/logos/Medicina Física y rehabilitadora.svg`,
  'psicologia': `${CDN_BASE_URL}/logos/psicología.svg`,
  'medicinaintegrativa': `${CDN_BASE_URL}/logos/medicina integrativa.svg`,
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
  
  const logoStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    opacity: disabled ? 0.4 : 1,
    objectFit: 'contain',
  };
  
  // Si hay SVG, intentar cargarlo
  if (svgPath) {
    return (
      <img 
        src={svgPath} 
        alt={specialtyName} 
        style={logoStyle}
        onError={(e) => {
          // Si falla cargar el SVG, ocultar y usar fallback
          const target = e.currentTarget;
          target.style.display = 'none';
          // El componente padre mostrará el fallback
        }}
      />
    );
  }
  
  // Fallback: usar componentes existentes para especialidades sin SVG
  return <UrologyLogo disabled={disabled} />;
};

export default SpecialtyLogo;

