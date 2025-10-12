import React from "react";
import UrologyLogo from "../atoms/logos/UrologyLogo.tsx";
import PhysioLogo from "../atoms/logos/PhysioLogo.tsx";
import GynecologyLogo from "../atoms/logos/GynecologyLogo.tsx";
import PhysicalTherapyLogo from "../atoms/logos/PhysicalTherapyLogo.tsx";
import PsychologyLogo from "../atoms/logos/PsychologyLogo.tsx";
import AndrologyLogo from "../atoms/logos/AndrologyLogo.tsx";

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
    switch (logoType) {
      case "Urología":
        return <UrologyLogo disabled={!isActive && !isInitial} />;
      case "Fisioterapia":
        return <PhysioLogo disabled={!isActive && !isInitial} />;
      case "Ginecología":
        return <GynecologyLogo disabled={!isActive && !isInitial} />;
      case "Medicina Física y Rehabilitación":
        return <PhysicalTherapyLogo disabled={!isActive && !isInitial} />;
      case "Psicología":
        return <PsychologyLogo disabled={!isActive && !isInitial} />;
      case "Andrología y medicina sexual":
        return <AndrologyLogo disabled={!isActive && !isInitial} />;
      default:
        return <div>No Icon</div>;
    }
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
      >
        {name}
      </h3>
      {renderLogo()}
    </div>
  );
};

export default ServiceCardOption;
