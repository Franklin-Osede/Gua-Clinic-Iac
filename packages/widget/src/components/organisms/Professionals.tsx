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
          }): DoctorInfo => ({
            photo: doctorPhotos[doctor.doctor_id],
            name: `Dr ${doctor.name} ${doctor.surname}`,
            id: doctor.doctor_id,
          }),
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
    <div className="flex min-w-screen justify-center items-center flex-col">
      <div className="w-full flex 2xl:items-center md:items-center items-start justify-center flex-col ml-2 mt-8">
        <h3 className="text-primary-400">{serviceChoice}</h3>
        <h1>Selecciona el profesional</h1>
      </div>
      <div className="flex flex-col items-center my-8">
        <div
          className={`
            ${
              professionalOptions.length < 3
                ? "flex items-center justify-center"
                : "grid 2xl:grid-cols-3 md:grid-cols-3 grid-cols-2"
            }
           2xl:gap-6 md:gap-6 gap-4`}
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
                isDisabled={professionalClicked}
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
