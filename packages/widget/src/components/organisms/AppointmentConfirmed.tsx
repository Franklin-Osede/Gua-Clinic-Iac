import React from "react";
import CheckLogo from "../atoms/logos/CheckLogo.tsx";
import CalendarIcon from "../atoms/icons/CalendarIcon.tsx";
import StethoscopeIcon from "../atoms/icons/StethoscopeIcon.tsx";
import LocationIcon from "../atoms/icons/LocationIcon.tsx";

interface AppointmentConfirmedProps {
  date: string;
  doctor: string;
  service: string;
}

const AppointmentConfirmed: React.FC<AppointmentConfirmedProps> = ({
  date,
  doctor,
  service,
}) => {
  return (
    <div className="flex items-center justify-center 2xl:w-[25vw] md:w-[25vw] w-[85vw] flex-col">
      <div className="flex items-center justify-center w-full flex-col mb-7">
        <div>
          <CheckLogo />
        </div>
        <h1 className="m-4 mt-0">¡Cita confirmada!</h1>
        <h3 className="font-medium">Tu cita ha sido reservada con éxito. 🎉</h3>
        <p>Recibirás una notificación via email.</p>
      </div>
      <div>
        <div className="flex items-center justify-start w-full 2xl:py-6 md:py-4 py-2.5 border-t border-t-primary-200">
          <div className="px-6">
            <CalendarIcon />
          </div>
          <div className="ml-4 flex justify-start items-start flex-col w-9/12">
            <div>
              <span className="text-primary-400 text-xs 2xl:text-sm">
                Fecha
              </span>
              <p className="text-sm 2xl:text-base font-medium">{date}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start w-full 2xl:py-6 md:py-4 py-2.5 border-t border-t-primary-200">
          <div className="px-6">
            <StethoscopeIcon />
          </div>
          <div className="ml-4 w-10/12">
            <span className="text-primary-400 text-xs 2xl:text-sm">
              Profesional
            </span>
            <p className="font-medium text-sm 2xl:text-base">{doctor}</p>
            <p className="text-sm 2xl:text-base">{service}</p>
          </div>
        </div>
        <div className="flex items-center justify-start w-full 2xl:py-6 md:py-4 py-2.5 border-y border-y-primary-200">
          <div className="px-6">
            <LocationIcon />
          </div>
          <div className="ml-4 w-10/12">
            <span className="text-primary-400 text-xs 2xl:text-sm">
              Ubicación
            </span>
            <p className="font-medium text-sm 2xl:text-base">
              Avda. José Mesa y López 54, bajo, in Las Palmas de Gran Canaria
            </p>
          </div>
        </div>
        <div className="text-primary-400 flex items-start justify-center 2xl:mt-6 md:mt-6 mt-4">
          <p className="2xl:text-sm text-xs mx-4">ⓘ</p>
          <p className="2xl:text-sm text-xs">
            Para cualquier cambio o modificación de la reserva puedes
            contactarnos en info@urologiayandrologia.com o a través del teléfono
            +34 629 334 583
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmed;
