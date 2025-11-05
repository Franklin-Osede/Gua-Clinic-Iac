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
        padding: '10px 18px',
        borderRadius: '12px',
        border: activeTime ? '2px solid #EAC607' : '2px solid #DDDDDD',
        backgroundColor: activeTime ? '#EAC607' : '#FFFFFF',
        color: activeTime ? '#242424' : '#242424',
        fontWeight: activeTime ? 600 : 500,
        fontSize: '14px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isDisabled ? 0.5 : 1,
        boxShadow: activeTime ? '0 2px 8px rgba(234, 198, 7, 0.3)' : 'none',
        transform: activeTime ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FDF9E6';
          e.currentTarget.style.borderColor = '#EAC607';
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && !activeTime) {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#DDDDDD';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      className="font-medium"
    >
      {time}
    </button>
  );
};

export default TimeButton;
