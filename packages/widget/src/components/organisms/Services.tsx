import ServiceCardOption from "../molecules/ServiceCard.tsx";
import React, { useEffect, useState } from "react";
import { getMedicalSpecialties } from "../../services/GuaAPIService.ts";
import { PuffLoader } from "react-spinners";

interface ServicePageProps {
  activeCardId: number | null;
  initialCard: boolean;
  onCardClick: (id: number | null, name: string) => void;
}

const Services: React.FC<ServicePageProps> = ({
  activeCardId,
  initialCard,
  onCardClick,
}) => {
  const [serviceOptions, setServiceOptions] = useState<
    { name: string; id: number }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getMedicalSpecialties();
        const formattedOptions = data.map(
          (specialty: { name: string; id: number }) => ({
            id: specialty.id,
            name:
              specialty.name === "Andrología"
                ? "Andrología y medicina sexual"
                : specialty.name,
          }),
        );
        setServiceOptions(formattedOptions);
      } catch (error) {
        console.error("Error fetching medical specialties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices().then();
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="flex min-w-screen justify-center items-center flex-col" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-full flex items-center justify-center flex-col mt-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="text-primary-400 text-center">Bienvenido/a a Cita Online 👋</h3>
          <h1 className="text-center">Selecciona la Especialidad</h1>
        </div>
        <div className="flex flex-col items-center my-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', marginTop: '48px' }}>
          <div 
            className="grid 2xl:grid-cols-3 md:grid-cols-3 grid-cols-2 2xl:gap-6 md:gap-6 gap-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              width: '100%',
              maxWidth: '360px',
              boxSizing: 'border-box',
              margin: '0 auto',
              justifyContent: 'center',
              padding: '0',
            }}
          >
            {loading ? (
              <div className="flex justify-center items-center col-span-2 mt-8">
                <PuffLoader size={30} color={"#9CA3AF"} loading={loading} />
              </div>
            ) : (
              serviceOptions.map((service, index) => (
                <ServiceCardOption
                  key={index}
                  id={index}
                  serviceId={service.id}
                  name={service.name}
                  logoType={service.name}
                  isActive={index === activeCardId}
                  onServiceCardClick={onCardClick}
                  isInitial={initialCard}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
