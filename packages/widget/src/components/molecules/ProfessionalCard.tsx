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

  return (
    <div
      className={`${
        isActive
          ? "bg-accent-100 border-accent-300"
          : !isDisabled
          ? "hover:opacity-70"
          : "bg-white border-primary-300"
      } 2xl:w-44 md:w-44 w-40 2xl:h-36 md:h-36 h-32 flex items-center justify-evenly border rounded-2xl drop-shadow flex-col py-2`}
      onClick={() => {
        if (!isDisabled) {
          handleServiceClick();
        }
      }}
    >
      <div
        className={`${
          !isActive && isDisabled ? "opacity-40" : "opacity-100"
        } 2xl:w-16 md:w-16 w-12 2xl:h-16 md:h-16 h-12 object-cover rounded-full overflow-hidden`}
      >
        {photo}
      </div>
      <h3
        className={`${
          !isActive && isDisabled ? "text-disabled " : "text-primary-600"
        } text-center cursor-default font-medium max-w-[75%] md:text-xs 2xl:text-sm`}
      >
        {name}
      </h3>
    </div>
  );
};

export default ProfessionalCardOption;
