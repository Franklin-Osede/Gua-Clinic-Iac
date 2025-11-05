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
      console.log('📋 AppointmentTypes: Iniciando carga para serviceId:', serviceId);
      const updatedOptions: AppointmentOption[] = (
        await Promise.all(
          appointmentsOptions.map(async (option) => {
            const logoType =
              option.logoType === "revision-physical"
                ? option.logoType.split("-")[0]
                : option.logoType;
            console.log(`📋 Buscando tipo de cita: ${logoType} para serviceId: ${serviceId}`);
            
            try {
              const data = await getAppointmentTypes(serviceId, logoType);
              console.log(`📋 Datos recibidos para ${logoType}:`, data);

              if (!data || !data.length) {
                console.warn(`⚠️ No hay datos para ${logoType}, usando valores por defecto`);
                // Si no hay datos, mantener la opción con valores por defecto
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
            } catch (error) {
              console.error(`❌ Error obteniendo tipo de cita ${logoType}:`, error);
              // En caso de error, mantener la opción con valores por defecto
              return {
                ...option,
                extra: {
                  id: null,
                  price: 0,
                  duration: 0,
                },
              };
            }
          }),
        )
      ).filter((option): option is AppointmentOption => option !== null);
      
      console.log('📋 Opciones finales:', updatedOptions);
      setFinalOptions(updatedOptions);
    } catch (error) {
      console.error("❌ Error fetching appointment types:", error);
      // En caso de error general, mostrar opciones por defecto
      setFinalOptions(appointmentsOptions.map(option => ({
        ...option,
        extra: {
          id: null,
          price: 0,
          duration: 0,
        },
      })));
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="flex flex-col items-center w-full justify-center my-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', marginTop: '40px', marginBottom: '48px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#9DABAF',
          textAlign: 'center',
          marginBottom: '12px',
          letterSpacing: '0.3px',
          lineHeight: '1.5'
        }}>
          {serviceChoice}
        </div>
        <h1 className="text-center" style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#242424',
          textAlign: 'center',
          margin: '0',
          letterSpacing: '-0.2px',
          lineHeight: '1.3'
        }}>
          Elige cómo será tu cita
        </h1>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center col-span-2 mt-8">
          <PuffLoader size={30} color={"#9CA3AF"} loading={isLoading} />
        </div>
      )}
      {!isLoading && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
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
                isDisabled={false}
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
