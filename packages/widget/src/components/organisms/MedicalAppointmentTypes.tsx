import React, { useCallback, useEffect, useState } from "react";
import AppointmentCardOption from "../molecules/AppointmentCard.tsx";
import { getAppointmentTypes } from "../../services/GuaAPIService.ts";
import { AppointmentInfo } from "../../pages/MainPage.tsx";
import { PuffLoader } from "react-spinners";
import { AppointmentOption } from "@gua/shared";

interface MedicalAppointmentTypesProps {
  activeAppointmentId: number | null;
  appointmentClicked: boolean;
  serviceId: number;
  onCardClick: (
    appointmentId: number | null,
    name: string,
    info: AppointmentInfo | null,
  ) => void;
  serviceChoice: string;
  showError: boolean;
}

const MedicalAppointmentTypes: React.FC<MedicalAppointmentTypesProps> = ({
  activeAppointmentId,
  appointmentClicked,
  serviceId,
  onCardClick,
  serviceChoice,
  showError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [medicalAppointmentsOptions] = useState<AppointmentOption[]>([
    {
      name: "Es mi Primera Consulta",
      description: "No incluye pruebas diagnósticas.",
      logoType: "first-consultation",
      extra: {
        id: 0,
        price: 0,
        duration: 0,
      },
    },
    {
      name: "Una Revisión",
      description: "No incluye pruebas diagnósticas.",
      logoType: "revision",
      extra: {
        id: 0,
        price: 0,
        duration: 0,
      },
    },
  ]);

  const [finalAppointmentOptions, setFinalAppointmentOptions] = useState<
    AppointmentOption[]
  >([]);

  const fetchAppointmentTypesAndUpdateOptions = useCallback(async () => {
    try {
      const updatedOptions: AppointmentOption[] = (
        await Promise.all(
          medicalAppointmentsOptions.map(async (option) => {
            const data = await getAppointmentTypes(serviceId, option.logoType);

            if (!data.length) {
              return {
                ...option,
                extra: {
                  id: null,
                  price: 0,
                  duration: 0,
                },
              };
            }
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

      setFinalAppointmentOptions(updatedOptions);
    } catch (error) {
      console.error("Error fetching appointment types:", error);
    } finally {
      setIsLoading(false);
    }
  }, [medicalAppointmentsOptions, serviceId]);

  useEffect(() => {
    if (isLoading) {
      fetchAppointmentTypesAndUpdateOptions().then();
    }
  }, [fetchAppointmentTypesAndUpdateOptions, isLoading]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="my-8 flex flex-col items-center w-full justify-center" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '32px' }}>
        <h3 className="text-primary-400 text-center 2xl:text-lg">
          {serviceChoice}
        </h3>
        <h1 className="text-center">Selecciona el tipo de cita médica</h1>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center col-span-2 mt-8">
          <PuffLoader size={30} color={"#9CA3AF"} loading={isLoading} />
        </div>
      )}
      {!isLoading && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <div className="flex flex-col 2xl:gap-6 md:gap-6 gap-4 items-center justify-center" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {finalAppointmentOptions.map((appt, index) => (
              <AppointmentCardOption
                id={index}
                key={index}
                name={appt.name}
                description={appt.description}
                logoType={appt.logoType}
                isActive={activeAppointmentId === index}
                onAppointmentTypeClick={onCardClick}
                isDisabled={false}
                info={appt.extra}
              />
            ))}
          </div>
        </div>
      )}
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

export default MedicalAppointmentTypes;
