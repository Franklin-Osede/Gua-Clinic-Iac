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
}

export const TimeButton: React.FC<TimeButtonProps> = ({
  id,
  activeTime,
  isDisabled,
  time,
  dateNameChosen,
  dateStringChosen,
  onClick,
}) => {
  const handleClick = () => {
    const fullDateName = `${time} · ${dateNameChosen}`;
    const fullDateString = dateStringChosen + convertTo24HourFormat(time);
    onClick(id, fullDateName, fullDateString);
  };

  // Colores de marca según requisitos:
  // - Available slots: #EAC607 (yellow/gold)
  // - Selected slot: #033B4A (dark teal) o #22AD5C (green) - usando #033B4A
  // - Disabled: #EFEFEF (light gray)
  const getButtonStyles = () => {
    if (isDisabled) {
      return {
        backgroundColor: '#EFEFEF',
        borderColor: '#DDDDDD',
        color: '#9DABAF',
        cursor: 'not-allowed',
        opacity: 0.6,
      };
    }
    
    if (activeTime) {
      return {
        backgroundColor: '#033B4A', // Dark teal para seleccionado
        borderColor: '#033B4A',
        color: '#FFFFFF',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(3, 59, 74, 0.3)',
        transform: 'scale(1.05)',
      };
    }
    
    return {
      backgroundColor: '#FFFFFF',
      borderColor: '#EAC607', // Accent color para disponibles
      color: '#242424',
      fontWeight: 500,
    };
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          handleClick();
        }
      }}
      disabled={isDisabled}
      style={{
        padding: '12px 20px',
        borderRadius: '12px',
        border: '2px solid',
        fontSize: '14px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...getButtonStyles(),
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FDF9E6'; // Light yellow background
          e.currentTarget.style.borderColor = '#EAC607';
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(234, 198, 7, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#EAC607';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      className="font-medium"
    >
      {time}
    </button>
  );
};

export default TimeButton;
