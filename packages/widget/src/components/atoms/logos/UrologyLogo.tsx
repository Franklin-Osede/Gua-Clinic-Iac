import { FC } from "react";

interface UrologyLogoProps {
  disabled: boolean;
}

export const UrologyLogo: FC<UrologyLogoProps> = ({ disabled }) => {
  return (
    <div style={{ width: 46, height: 46, backgroundColor: disabled ? "#EFEFEF" : "#EAC607", borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: disabled ? "#999" : "#333", fontSize: 12, fontWeight: 'bold' }}>URO</span>
    </div>
  );
};

export default UrologyLogo;