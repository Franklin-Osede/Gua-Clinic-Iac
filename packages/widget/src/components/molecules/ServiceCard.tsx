import React from "react";
import SpecialtyLogo from "../atoms/logos/SpecialtyLogo.tsx";

interface ServiceCardProps {
  id: number;
  name: string;
  serviceId: number;
  logoType: string;
  isInitial: boolean;
  isActive: boolean;
  onServiceCardClick: (
    activeId: number | null,
    name: string,
    serviceId: number | null,
  ) => void;
}

const ServiceCardOption: React.FC<ServiceCardProps> = ({
  id,
  name,
  serviceId,
  logoType,
  isInitial,
  isActive,
  onServiceCardClick,
}) => {
  const handleServiceClick = () => {
    onServiceCardClick(isActive ? null : id, name, serviceId);
  };

  const renderLogo = () => {
    // Usar el nuevo componente SpecialtyLogo que carga los SVGs automáticamente
    return <SpecialtyLogo specialtyName={logoType || name} disabled={!isActive && !isInitial} />;
  };

  // Estilos inline como fallback para WordPress
  const cardStyle: React.CSSProperties = {
    width: '160px', // w-40
    height: '128px', // h-32
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    border: '1px solid',
    borderRadius: '16px',
    padding: '8px',
    boxSizing: 'border-box',
    backgroundColor: isActive ? '#FDF9E6' : (isInitial ? '#FFFFFF' : '#FFFFFF'),
    borderColor: isActive ? '#EAC607' : '#DDDDDD',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: isInitial ? 'pointer' : 'default',
    transition: 'opacity 0.2s',
  };

  const textStyle: React.CSSProperties = {
    color: (!isActive && !isInitial) ? '#EFEFEF' : '#242424',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 500,
    maxWidth: '90%',
    margin: '0',
    lineHeight: '1.2',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div
      className={`${
        isActive
          ? "bg-accent-100 border-accent-300"
          : isInitial
          ? "hover:opacity-70"
          : "bg-white border-primary-300"
      } 2xl:w-44 md:w-44 w-40 2xl:h-36 md:h-36 h-32 flex items-center justify-evenly border rounded-2xl drop-shadow flex-col py-2`}
      style={cardStyle}
      onClick={() => {
        if (isInitial) {
          handleServiceClick();
        }
      }}
    >
      <h3
        className={`${
          !isActive && !isInitial ? "text-disabled " : "text-primary-600"
        } text-center cursor-default font-medium max-w-[90%]`}
        style={textStyle}
      >
        {name}
      </h3>
      {renderLogo()}
    </div>
  );
};

export default ServiceCardOption;
