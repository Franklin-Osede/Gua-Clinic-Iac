import { FC } from "react";

interface DiagnosticTestsLogoProps {
  disabled: boolean;
}

export const DiagnosticTestsLogo: FC<DiagnosticTestsLogoProps> = ({ disabled }) => {
  return (
    <svg
      width="112"
      height="112"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icono de documento con gráfico */}
      <rect
        x="10"
        y="8"
        width="20"
        height="24"
        rx="2"
        stroke={disabled ? "#999" : "#242424"}
        strokeWidth="2"
        fill="none"
      />
      {/* Líneas del gráfico */}
      <path
        d="M14 18L16 16L18 20L20 18L22 22L24 20L26 24"
        stroke={disabled ? "#999" : "#EAC607"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Marcadores del gráfico */}
      <circle cx="14" cy="18" r="1.5" fill={disabled ? "#999" : "#EAC607"} />
      <circle cx="18" cy="20" r="1.5" fill={disabled ? "#999" : "#EAC607"} />
      <circle cx="22" cy="22" r="1.5" fill={disabled ? "#999" : "#EAC607"} />
      <circle cx="26" cy="24" r="1.5" fill={disabled ? "#999" : "#EAC607"} />
    </svg>
  );
};

export default DiagnosticTestsLogo;






