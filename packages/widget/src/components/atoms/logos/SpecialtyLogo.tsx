import { FC, useState, useEffect, useMemo } from "react";
import { getCdnBaseUrl } from "../../../config/api.config";

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

// Mapeo de especialidades a logos
// Prioridad: 1) Carpeta local /logos/, 2) CDN, 3) Componente React
const LOCAL_LOGOS_PATH = '/logos'; // Carpeta public/logos/

// Función para construir URL del CDN dinámicamente
const getCdnUrl = (logoPath: string): string => {
  const cdnBase = getCdnBaseUrl();
  if (cdnBase) {
    return `${cdnBase}/logos/${logoPath}`;
  }
  // Fallback a S3 si no hay CDN configurado
  return `https://cdn-gua-com.s3.eu-north-1.amazonaws.com/logos/${logoPath}`;
};

const SVG_MAP: Record<string, { local: string; getCdn: () => string; fallback: FC<{ disabled: boolean }> }> = {
  'urologia': { 
    local: `${LOCAL_LOGOS_PATH}/UROLOGÍA.svg`,
    getCdn: () => getCdnUrl('UROLOGÍA.svg'),
    fallback: UrologyLogo 
  },
  'andrologia': { 
    local: `${LOCAL_LOGOS_PATH}/Andrología.svg`,
    getCdn: () => getCdnUrl('Andrología.svg'),
    fallback: AndrologyLogo 
  },
  'andrologiaymedicinasexual': { 
    local: `${LOCAL_LOGOS_PATH}/Andrología.svg`,
    getCdn: () => getCdnUrl('Andrología.svg'),
    fallback: AndrologyLogo 
  },
  'medicinasexual': { 
    local: `${LOCAL_LOGOS_PATH}/Andrología.svg`,
    getCdn: () => getCdnUrl('Andrología.svg'),
    fallback: AndrologyLogo 
  },
  'ginecologia': { 
    local: `${LOCAL_LOGOS_PATH}/ginecología.svg`,
    getCdn: () => getCdnUrl('ginecología.svg'),
    fallback: GynecologyLogo 
  },
  'fisioterapia': { 
    local: `${LOCAL_LOGOS_PATH}/Fisioterapia.svg`,
    getCdn: () => getCdnUrl('Fisioterapia.svg'),
    fallback: PhysicalTherapyLogo 
  },
  'psicologia': { 
    local: `${LOCAL_LOGOS_PATH}/psicología.svg`,
    getCdn: () => getCdnUrl('psicología.svg'),
    fallback: PsychologyLogo 
  },
  'medicinafisica': { 
    local: `${LOCAL_LOGOS_PATH}/Medicina Física y rehabilitadora.svg`,
    getCdn: () => getCdnUrl('Medicina Física y rehabilitadora.svg'),
    fallback: PhysicalTherapyLogo 
  },
  'medicinarehabilitadora': { 
    local: `${LOCAL_LOGOS_PATH}/Medicina Física y rehabilitadora.svg`,
    getCdn: () => getCdnUrl('Medicina Física y rehabilitadora.svg'),
    fallback: PhysicalTherapyLogo 
  },
  'rehabilitacion': { 
    local: `${LOCAL_LOGOS_PATH}/Medicina Física y rehabilitadora.svg`,
    getCdn: () => getCdnUrl('Medicina Física y rehabilitadora.svg'),
    fallback: PhysicalTherapyLogo 
  },
  'medicinaintegrativa': { 
    local: `${LOCAL_LOGOS_PATH}/medicina integrativa.svg`,
    getCdn: () => getCdnUrl('medicina integrativa.svg'),
    fallback: IntegrativeMedicineLogo 
  },
  'medicinapreventiva': { 
    local: `${LOCAL_LOGOS_PATH}/medicina integrativa.svg`,
    getCdn: () => getCdnUrl('medicina integrativa.svg'),
    fallback: IntegrativeMedicineLogo 
  },
  'laboratorio': { 
    local: `${LOCAL_LOGOS_PATH}/laboratorio.svg`,
    getCdn: () => getCdnUrl('laboratorio.svg'),
    fallback: LaboratoryLogo 
  },
  'pruebasdiagnosticas': { 
    local: `${LOCAL_LOGOS_PATH}/pruebas diagnosticas.svg`,
    getCdn: () => getCdnUrl('pruebas diagnosticas.svg'),
    fallback: DiagnosticTestsLogo 
  },
};

export const SpecialtyLogo: FC<SpecialtyLogoProps> = ({ specialtyName, disabled }) => {
  // Hooks deben estar al principio del componente
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [triedCDN, setTriedCDN] = useState(false);
  
  // Normalizar el nombre usando la función auxiliar
  const normalizedName = useMemo(() => normalizeSpecialtyName(specialtyName || ''), [specialtyName]);
  
  // Buscar logo correspondiente usando useMemo para evitar recálculos
  const logoInfo = useMemo(() => {
    console.log(`🎨 SpecialtyLogo: "${specialtyName}" → normalizado: "${normalizedName}"`);
    
    // Ordenar claves de más específicas a menos específicas para evitar matches incorrectos
    const sortedKeys = Object.keys(SVG_MAP).sort((a, b) => b.length - a.length); // Más largas primero
    
    let foundLogoInfo: { local: string; getCdn: () => string; fallback: FC<{ disabled: boolean }> } | null = null;
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
          foundLogoInfo = info;
          matchedKey = key;
          console.log(`✅ Logo encontrado: "${specialtyName}" → clave: "${key}" (normalizado: "${normalizedName}" contiene "${normalizedKey}")`);
          break;
        }
      }
    }
    
    // Si no encontramos match directo, intentar búsqueda más flexible para casos especiales
    if (!foundLogoInfo) {
      // Para "Medicina Física y Rehabilitación" que se normaliza a "medicinafisicarehabilitacion"
      if (normalizedName.includes('medicina') && (normalizedName.includes('fisica') || normalizedName.includes('rehabilitacion'))) {
        foundLogoInfo = SVG_MAP['medicinafisica'] || SVG_MAP['rehabilitacion'];
        if (foundLogoInfo) {
          matchedKey = normalizedName.includes('fisica') ? 'medicinafisica' : 'rehabilitacion';
          console.log(`✅ Logo encontrado (búsqueda flexible): "${specialtyName}" → clave: "${matchedKey}"`);
        }
      }
    }
    
    return foundLogoInfo;
  }, [specialtyName, normalizedName]);
  
  // Inicializar/resetear imageSrc cuando logoInfo cambie
  useEffect(() => {
    if (logoInfo) {
      setImageSrc(logoInfo.local);
      setTriedCDN(false);
      setImageError(false);
    }
  }, [logoInfo?.local]); // Solo cuando cambie la ruta local
  
  // Si no encontramos logo, usar fallback URO
  if (!logoInfo) {
    console.warn(`⚠️ No se encontró logo para "${specialtyName}" (normalizado: "${normalizedName}"), usando fallback URO`);
    return <UrologyLogo disabled={disabled} />;
  }
  
  const FallbackComponent = logoInfo.fallback;
  // Tamaño responsive: más pequeño en WordPress
  const getLogoSize = () => {
    if (typeof window !== 'undefined') {
      // En WordPress, usar tamaño más pequeño
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.innerWidth <= 480 ? '48px' : '56px'; // Más pequeño en producción
      }
      // En localhost, tamaño normal
      return window.innerWidth <= 480 ? '80px' : '112px';
    }
    return '56px'; // Default más pequeño para WordPress
  };
  
  const logoSize = getLogoSize();
  const logoStyle: React.CSSProperties = {
    width: logoSize,
    height: logoSize,
    maxWidth: logoSize,
    maxHeight: logoSize,
    minWidth: logoSize,
    minHeight: logoSize,
    opacity: disabled ? 0.4 : 1,
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
    boxSizing: 'border-box',
  };
  
  const handleImageError = () => {
    if (!triedCDN) {
      // Si falla la carga local, intentar CDN
      console.log(`⚠️ No se pudo cargar logo desde carpeta local para "${specialtyName}", intentando CDN...`);
      const cdnUrl = logoInfo.getCdn();
      console.log(`🔗 Intentando CDN: ${cdnUrl}`);
      setImageSrc(cdnUrl);
      setTriedCDN(true);
    } else {
      // Si también falla CDN, usar componente React
      console.warn(`⚠️ No se pudo cargar logo desde CDN para "${specialtyName}", usando componente React`);
      setImageError(true);
    }
  };
  
  const handleImageLoad = () => {
    console.log(`✅ Logo cargado para "${specialtyName}" desde ${triedCDN ? 'CDN' : 'carpeta local'}`);
    setImageError(false);
  };
  
  // Estrategia de carga: 1) Carpeta local, 2) CDN, 3) Componente React
  // Si ya falló la carga de imagen, usar componente React directamente
  if (imageError || !imageSrc) {
    console.log(`🎨 Usando componente React para "${specialtyName}" ${imageError ? '(carga de imagen falló)' : '(sin fuente de imagen)'}`);
    // Envolver en un div con estilos inline para forzar el tamaño en WordPress
    const containerSize = getLogoSize();
    return (
      <div style={{
        width: containerSize,
        height: containerSize,
        maxWidth: containerSize,
        maxHeight: containerSize,
        minWidth: containerSize,
        minHeight: containerSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FallbackComponent disabled={disabled} />
        </div>
      </div>
    );
  }
  
  // Intentar cargar imagen (primero local, luego CDN si falla)
  return (
    <img 
      src={imageSrc} 
      alt={specialtyName} 
      style={logoStyle}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default SpecialtyLogo;

