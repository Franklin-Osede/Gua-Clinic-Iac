import React from "react";
import { convertTo24HourFormat } from "@gua/shared";

interface TimeButtonProps {
  id: number;
  activeTime: boolean;
  isDisabled: boolean;
  time: string;
  dateNameChosen: string;
  dateStringChosen: string;
  onClick: (time: null | number, date: string, extra: string) => void;
  hasOtherTimeSelected?: boolean; // Indica si hay otra hora seleccionada
}

export const TimeButton: React.FC<TimeButtonProps> = ({
  id,
  activeTime,
  isDisabled,
  time,
  dateNameChosen,
  dateStringChosen,
  onClick,
  hasOtherTimeSelected = false,
}) => {
  const handleClick = () => {
    // Permitir clic si:
    // 1. Es la hora activa (para deseleccionar)
    // 2. No está deshabilitado y no hay otra hora seleccionada (para seleccionar)
    if (activeTime || (!isDisabled && !hasOtherTimeSelected)) {
      const fullDateName = `${time} · ${dateNameChosen}`;
      const fullDateString = dateStringChosen + convertTo24HourFormat(time);
      onClick(id, fullDateName, fullDateString);
    }
  };

  // Colores de marca según requisitos:
  // - Available slots: #EAC607 (yellow/gold)
  // - Selected slot: #033B4A (dark teal) - claramente visible
  // - Disabled (otra hora seleccionada): #F5F5F5 (light gray) con borde más claro
  // - Disabled (otras razones): #EFEFEF (light gray)
  const getButtonStyles = () => {
    // Hora seleccionada - siempre visible y destacada
    if (activeTime) {
      return {
        backgroundColor: '#033B4A', // Dark teal para seleccionado
        borderColor: '#033B4A',
        color: '#FFFFFF',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(3, 59, 74, 0.3)',
        transform: 'scale(1.05)',
        cursor: 'pointer',
        opacity: 1,
      };
    }
    
    // Deshabilitado porque hay otra hora seleccionada
    if (isDisabled && hasOtherTimeSelected) {
      return {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
        color: '#9DABAF',
        cursor: 'not-allowed',
        opacity: 0.5,
        fontWeight: 400,
      };
    }
    
    // Deshabilitado por otras razones (carga, etc.)
    if (isDisabled) {
      return {
        backgroundColor: '#EFEFEF',
        borderColor: '#DDDDDD',
        color: '#9DABAF',
        cursor: 'not-allowed',
        opacity: 0.6,
        fontWeight: 400,
      };
    }
    
    // Disponible y no seleccionada
    return {
      backgroundColor: '#FFFFFF',
      borderColor: '#EAC607', // Accent color para disponibles
      color: '#242424',
      fontWeight: 500,
      cursor: 'pointer',
    };
  };

  const buttonStyles = getButtonStyles();
  // Permitir clic si es la hora activa (para deseleccionar) o si está disponible
  const canClick = activeTime || (!isDisabled && !hasOtherTimeSelected);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canClick} // Deshabilitar solo si no se puede hacer clic
      style={{
        padding: '12px 20px',
        borderRadius: '12px',
        border: '2px solid',
        fontSize: '14px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...buttonStyles,
      }}
      onMouseEnter={(e) => {
        // Solo hover si está disponible o es la hora seleccionada
        if (canClick && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FDF9E6'; // Light yellow background
          e.currentTarget.style.borderColor = '#EAC607';
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(234, 198, 7, 0.2)';
        } else if (activeTime) {
          // Hover en hora seleccionada - hacerla un poco más oscura
          e.currentTarget.style.backgroundColor = '#022A35';
          e.currentTarget.style.transform = 'scale(1.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (canClick && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#EAC607';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        } else if (activeTime) {
          // Restaurar estilo de hora seleccionada
          e.currentTarget.style.backgroundColor = '#033B4A';
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      className="font-medium"
      aria-pressed={activeTime}
      aria-label={activeTime ? `${time} seleccionado` : time}
    >
      {time}
    </button>
  );
};

export default TimeButton;
