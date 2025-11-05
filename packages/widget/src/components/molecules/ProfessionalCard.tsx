import React from "react";

interface ProfessionalCardProps {
  id: number;
  name: string;
  photo: JSX.Element;
  isDisabled: boolean;
  isActive: boolean;
  doctorInfo: number;
  onCardClick: (id: number | null, name: string, extra: number) => void;
}

const ProfessionalCardOption: React.FC<ProfessionalCardProps> = ({
  id,
  name,
  photo,
  isDisabled,
  isActive,
  doctorInfo,
  onCardClick,
}) => {
  const handleServiceClick = () => {
    onCardClick(isActive ? null : id, name, doctorInfo);
  };

  // Estilos inline como fallback para WordPress
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '170px',
    height: '128px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    border: '1px solid',
    borderRadius: '16px',
    padding: '8px',
    boxSizing: 'border-box',
    backgroundColor: isActive ? '#FDF9E6' : '#FFFFFF',
    borderColor: isActive ? '#EAC607' : '#DDDDDD',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: !isDisabled ? 'pointer' : 'default',
    transition: 'opacity 0.2s',
    margin: '0 auto',
  };

  const photoContainerStyle: React.CSSProperties = {
    width: '48px', // w-12
    height: '48px', // h-12
    borderRadius: '50%',
    overflow: 'hidden',
    opacity: (!isActive && isDisabled) ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    color: (!isActive && isDisabled) ? '#EFEFEF' : '#242424',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 500,
    maxWidth: '75%',
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
          : !isDisabled
          ? "hover:opacity-70"
          : "bg-white border-primary-300"
      } 2xl:w-44 md:w-44 w-40 2xl:h-36 md:h-36 h-32 flex items-center justify-evenly border rounded-2xl drop-shadow flex-col py-2`}
      style={cardStyle}
      onClick={() => {
        // Siempre permitir click para toggle (seleccionar/deseleccionar)
        handleServiceClick();
      }}
    >
      <div
        className={`${
          !isActive && isDisabled ? "opacity-40" : "opacity-100"
        } 2xl:w-16 md:w-16 w-12 2xl:h-16 md:h-16 h-12 object-cover rounded-full overflow-hidden`}
        style={photoContainerStyle}
      >
        {photo}
      </div>
      <h3
        className={`${
          !isActive && isDisabled ? "text-disabled " : "text-primary-600"
        } text-center cursor-default font-medium max-w-[75%] md:text-xs 2xl:text-sm`}
        style={textStyle}
      >
        {name}
      </h3>
    </div>
  );
};

export default ProfessionalCardOption;
