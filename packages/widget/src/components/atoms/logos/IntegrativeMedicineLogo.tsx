import { FC } from "react";

interface IntegrativeMedicineLogoProps {
  disabled: boolean;
}

export const IntegrativeMedicineLogo: FC<IntegrativeMedicineLogoProps> = ({ disabled }) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icono de equilibrio/harmonía - círculos entrelazados */}
      <circle
        cx="15"
        cy="20"
        r="8"
        stroke={disabled ? "#999" : "#242424"}
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="25"
        cy="20"
        r="8"
        stroke={disabled ? "#999" : "#242424"}
        strokeWidth="2"
        fill="none"
      />
      {/* Símbolo de cruz médica en el centro */}
      <line
        x1="20"
        y1="16"
        x2="20"
        y2="24"
        stroke={disabled ? "#999" : "#EAC607"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="20"
        x2="24"
        y2="20"
        stroke={disabled ? "#999" : "#EAC607"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default IntegrativeMedicineLogo;

