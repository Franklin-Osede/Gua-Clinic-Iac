import { FC } from "react";

interface LaboratoryLogoProps {
  disabled: boolean;
}

export const LaboratoryLogo: FC<LaboratoryLogoProps> = ({ disabled }) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tubos de ensayo */}
      <rect
        x="12"
        y="12"
        width="4"
        height="16"
        rx="1"
        fill={disabled ? "#999" : "#242424"}
      />
      <rect
        x="18"
        y="8"
        width="4"
        height="20"
        rx="1"
        fill={disabled ? "#999" : "#242424"}
      />
      <rect
        x="24"
        y="14"
        width="4"
        height="14"
        rx="1"
        fill={disabled ? "#999" : "#242424"}
      />
      {/* Líquido en los tubos */}
      <rect
        x="13"
        y="24"
        width="2"
        height="2"
        rx="0.5"
        fill={disabled ? "#999" : "#EAC607"}
      />
      <rect
        x="19"
        y="22"
        width="2"
        height="4"
        rx="0.5"
        fill={disabled ? "#999" : "#EAC607"}
      />
      <rect
        x="25"
        y="26"
        width="2"
        height="2"
        rx="0.5"
        fill={disabled ? "#999" : "#EAC607"}
      />
    </svg>
  );
};

export default LaboratoryLogo;



