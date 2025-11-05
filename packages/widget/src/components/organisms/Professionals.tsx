import React, { useEffect, useState } from "react";
import ProfessionalCardOption from "../molecules/ProfessionalCard.tsx";
import { getDoctors } from "../../services/GuaAPIService.ts";
import { PuffLoader } from "react-spinners";
import Doctor18 from "../atoms/images/Doctor18.tsx";
import Doctor20 from "../atoms/images/Doctor20.tsx";
import Doctor24 from "../atoms/images/Doctor24.tsx";
import Doctor3 from "../atoms/images/Doctor3.tsx";
import Doctor4 from "../atoms/images/Doctor4.tsx";
import Doctor5 from "../atoms/images/Doctor5.tsx";
import Doctor26 from "../atoms/images/Doctor26.tsx";
import Doctor33 from "../atoms/images/Doctor33.tsx";
import Doctor44 from "../atoms/images/Doctor44.tsx";
import Doctor56 from "../atoms/images/Doctor56.tsx";
import Doctor25 from "../atoms/images/Doctor25.tsx";

interface ProfessionalsProps {
  activeProfessionalId: number | null;
  professionalClicked: boolean;
  serviceChoice: string;
  serviceId: number;
  onCardClick: (id: number | null, name: string, extra: number) => void;
}

interface DoctorInfo {
  photo: JSX.Element;
  name: string;
  id: number;
}

const doctorPhotos: Record<number, JSX.Element> = {
  3: <Doctor3 />,
  4: <Doctor4 />,
  5: <Doctor5 />,
  18: <Doctor18 />,
  20: <Doctor20 />,
  24: <Doctor24 />,
  25: <Doctor25 />,
  26: <Doctor26 />,
  33: <Doctor33 />,
  44: <Doctor44 />,
  56: <Doctor56 />,
};

const Professionals: React.FC<ProfessionalsProps> = ({
  activeProfessionalId,
  professionalClicked,
  serviceChoice,
  serviceId,
  onCardClick,
}) => {
  const [professionalOptions, setProfessionalOptions] = useState<DoctorInfo[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getDoctors(serviceId);
        const doctors = data.map(
          (doctor: {
            doctor_id: number;
            name: string;
            surname: string;
            FotoPerfil?: string;
          }): DoctorInfo => {
            // Determinar la foto a mostrar
            let photo: JSX.Element;
            
            // 1. Primero intentar usar FotoPerfil de DriCloud si está disponible
            if (doctor.FotoPerfil && doctor.FotoPerfil.trim() !== '') {
              photo = (
                <img 
                  src={doctor.FotoPerfil} 
                  alt={`${doctor.name} ${doctor.surname}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si falla la carga, usar fallback
                    const fallbackPhoto = doctorPhotos[doctor.doctor_id];
                    if (fallbackPhoto) {
                      e.currentTarget.style.display = 'none';
                      // Renderizar fallback si existe
                    } else {
                      // Mostrar placeholder si no hay foto
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EUjwvdGV4dD48L3N2Zz4=';
                    }
                  }}
                />
              );
            } 
            // 2. Si no hay FotoPerfil, usar el Record hardcodeado
            else if (doctorPhotos[doctor.doctor_id]) {
              photo = doctorPhotos[doctor.doctor_id];
            } 
            // 3. Si no hay nada, mostrar placeholder
            else {
              photo = (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                  <span className="text-gray-500 text-xs font-semibold">DR</span>
                </div>
              );
            }
            
            // Construir nombre completo, limpiando espacios
            const firstName = (doctor.name || '').trim();
            const lastName = (doctor.surname || '').trim();
            const fullName = firstName && lastName 
              ? `Dr ${firstName} ${lastName}` 
              : firstName 
                ? `Dr ${firstName}` 
                : lastName 
                  ? `Dr ${lastName}` 
                  : 'Dr';
            
            return {
              photo,
              name: fullName,
              id: doctor.doctor_id,
            };
          },
        );
        setProfessionalOptions(doctors);
      } catch (error) {
        console.error("Error fetching medical specialties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors().then();
  }, [serviceId]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full flex items-center justify-center flex-col mt-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 className="text-primary-400 text-center">{serviceChoice}</h3>
        <h1 className="text-center">Selecciona el profesional</h1>
      </div>
      <div className="flex flex-col items-center my-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', marginTop: '48px' }}>
        <div
          className={`
            ${
              professionalOptions.length < 3
                ? "flex items-center justify-center"
                : "grid 2xl:grid-cols-3 md:grid-cols-3 grid-cols-2"
            }
           2xl:gap-6 md:gap-6 gap-4`}
          style={{
            display: professionalOptions.length < 3 ? 'flex' : 'grid',
            gridTemplateColumns: professionalOptions.length >= 3 ? 'repeat(2, 1fr)' : undefined,
            gap: '8px',
            width: '100%',
            maxWidth: '360px',
            boxSizing: 'border-box',
            margin: '0 auto',
            alignItems: professionalOptions.length < 3 ? 'center' : undefined,
            justifyContent: professionalOptions.length < 3 ? 'center' : undefined,
            padding: '0',
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center col-span-2 mt-8">
              <PuffLoader size={30} color={"#9CA3AF"} loading={loading} />
            </div>
          ) : (
            professionalOptions.map((doctor, index) => (
              <ProfessionalCardOption
                key={index}
                id={index}
                name={doctor.name}
                photo={doctor.photo}
                isDisabled={false}
                isActive={activeProfessionalId === index}
                onCardClick={onCardClick}
                doctorInfo={doctor.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Professionals;
