import React, { useCallback, useEffect, useState } from "react";
import AppointmentCardOption from "../molecules/AppointmentCard.tsx";
import { AppointmentOption } from "@gua/shared";
import { getAppointmentTypes } from "../../services/GuaAPIService.ts";
import { PuffLoader } from "react-spinners";

interface AppointmentTypesProps {
  activeAppointmentId: number | null;
  appointmentClicked: boolean;
  onCardClick: (appointmentId: number | null) => void;
  serviceChoice: string;
  serviceId: number;
  showError: boolean;
}

const AppointmentTypes: React.FC<AppointmentTypesProps> = ({
  activeAppointmentId,
  appointmentClicked,
  onCardClick,
  serviceChoice,
  serviceId,
  showError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentsOptions] = useState<AppointmentOption[]>([
    {
      name: "Cita Virtual",
      description: "Consulta en remoto",
      logoType: "virtual",
      extra: {
        id: 0,
        price: 0,
        duration: 0,
      },
    },
    {
      name: "Cita en Físico",
      description: "Consulta presencial en la clínica",
      logoType: "revision-physical",
      extra: {
        id: 0,
        price: 0,
        duration: 0,
      },
    },
  ]);

  const [finalOptions, setFinalOptions] = useState<AppointmentOption[]>([]);

  const fetchTypesAndUpdateOptions = useCallback(async () => {
    try {
      const updatedOptions: AppointmentOption[] = (
        await Promise.all(
          appointmentsOptions.map(async (option) => {
            const logoType =
              option.logoType === "revision-physical"
                ? option.logoType.split("-")[0]
                : option.logoType;
            const data = await getAppointmentTypes(serviceId, logoType);

            if (!data.length) return null;

            return {
              ...option,
              extra: {
                id: data[0]?.id ?? null,
                price: data[0]?.private_price ?? 0,
                duration: data[0]?.duration_minutes ?? 0,
              },
            };
          }),
        )
      ).filter((option): option is AppointmentOption => option !== null);
      setFinalOptions(updatedOptions);
    } catch (error) {
      console.error("Error fetching appointment types:", error);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentsOptions, serviceId]);

  useEffect(() => {
    if (isLoading) {
      fetchTypesAndUpdateOptions().then();
    }
  }, [fetchTypesAndUpdateOptions, isLoading]);

  return (
    <div className="flex items-center justify-center w-full flex-col">
      <div className="flex flex-col 2xl:items-center md:items-center items-start w-full justify-center my-8">
        <h3 className="text-primary-400 text-center 2xl:text-lg">
          {serviceChoice}
        </h3>
        <h1>Elige cómo será tu cita</h1>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center col-span-2 mt-8">
          <PuffLoader size={30} color={"#9CA3AF"} loading={isLoading} />
        </div>
      )}
      {!isLoading && (
        <div>
          <div 
            className="flex flex-col 2xl:gap-6 md:gap-6 gap-4 items-center justify-center"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {finalOptions.map((appt, index) => (
              <AppointmentCardOption
                id={index}
                key={index}
                name={appt.name}
                description={appt.description}
                logoType={appt.logoType}
                isActive={activeAppointmentId === index}
                onAppointmentTypeClick={onCardClick}
                isDisabled={appointmentClicked}
                info={appt.extra}
              />
            ))}
          </div>
        </div>
      )}
      <div className="w-full">
        {showError && (
          <p className="2xl:text-sm md:text-sm 2xl:text-center md:text-center text-start text-error mt-5">
            ⓘ Por favor, selecciona una opción para continuar
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentTypes;
