import React from "react";
import AppointmentCardOption from "../molecules/AppointmentCard.tsx";

interface ExistingPatientProps {
  activeId: number | null;
  isClicked: boolean;
  onCardClick: (id: number | null) => void;
  serviceChoice: string;
  showError: boolean;
}

const IdentificationPatient: React.FC<ExistingPatientProps> = ({
  activeId,
  isClicked,
  onCardClick,
  serviceChoice,
  showError,
}) => {
  const registrationOptions = [
    {
      name: "Sí, ya estoy registrado",
      description: "Identifícate con tu DNI.",
      logoType: "existing-patient",
    },
    {
      name: "Soy un paciente nuevo",
      description: "Regístrate online.",
      logoType: "new-patient",
    },
  ];

  return (
    <div className="flex items-center justify-center w-full flex-col">
      <div className="my-8 flex flex-col 2xl:items-center md:items-center items-start w-full justify-center">
        <h3 className="text-primary-400 text-center 2xl:text-lg">
          {serviceChoice}
        </h3>
        <h1>¿Has estado antes con nosotros?</h1>
      </div>
      <div>
        <div className="flex flex-col 2xl:gap-6 md:gap-6 gap-4 items-center justify-center">
          {registrationOptions.map((card, index) => (
            <AppointmentCardOption
              id={index}
              key={index}
              name={card.name}
              description={card.description}
              logoType={card.logoType}
              isActive={index === activeId}
              onAppointmentTypeClick={onCardClick}
              isDisabled={isClicked}
            />
          ))}
        </div>
      </div>
      <div className="w-full">
        {showError && (
          <p className="text-error 2xl:text-sm md:text-sm 2xl:text-center md:text-center text-start 2xl:mt-5 md:mt-5 mt-3">
            ⓘ Por favor, selecciona una opción para continuar
          </p>
        )}
      </div>
    </div>
  );
};

export default IdentificationPatient;
