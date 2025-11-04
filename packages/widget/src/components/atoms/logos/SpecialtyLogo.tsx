import { FC } from "react";

interface SpecialtyLogoProps {
  specialtyName: string;
  disabled: boolean;
}

// Fallback: usar componentes existentes si no hay SVG
import UrologyLogo from "./UrologyLogo";

// Mapeo de especialidades a archivos SVG (se cargarán desde public en build)
const SVG_MAP: Record<string, string> = {
  'urologia': '/logos/UROLOGÍA.svg',
  'andrologia': '/logos/Andrología.svg',
  'medicinasexual': '/logos/Andrología.svg',
  'ginecologia': '/logos/ginecología.svg',
  'fisioterapia': '/logos/Fisioterapia.svg',
  'medicinafisica': '/logos/rehabilitadora.svg',
  'rehabilitacion': '/logos/rehabilitadora.svg',
  'psicologia': '/logos/psicología.svg',
  'medicinaintegrativa': '/logos/integrativa.svg',
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

