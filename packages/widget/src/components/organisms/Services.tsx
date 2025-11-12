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
  // ⚠️ LOG MUY VISIBLE para verificar que el componente se monta
  console.log('🚀🚀🚀 SERVICES COMPONENT MONTADO 🚀🚀🚀');
  console.log('🚀🚀🚀 SERVICES COMPONENT MONTADO 🚀🚀🚀');
  console.log('🚀🚀🚀 SERVICES COMPONENT MONTADO 🚀🚀🚀');
  
  const [serviceOptions, setServiceOptions] = useState<
    { name: string; id: number }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🔄 Services useEffect triggered');
    const fetchServices = async (forceRefresh: boolean = false) => {
      try {
        console.log('🔍 Fetching medical specialties...', forceRefresh ? '(FORCE REFRESH)' : '');
        const data = await getMedicalSpecialties(forceRefresh);
        console.log('📦 Datos brutos recibidos de la API:', data);
        console.log('📦 Tipo de data:', typeof data);
        console.log('📦 ¿Es array?:', Array.isArray(data));
        console.log('📊 Total de especialidades recibidas:', Array.isArray(data) ? data.length : 0);
        
        // ⚠️ VALIDACIÓN CRÍTICA: Asegurar que data sea un array
        if (!Array.isArray(data)) {
          console.error('❌ ERROR CRÍTICO: data no es un array!', data);
          setServiceOptions([]);
          setLoading(false);
          return;
        }
        
        if (data.length === 0) {
          console.warn('⚠️ ADVERTENCIA: La API devolvió un array vacío');
          setServiceOptions([]);
          setLoading(false);
          return;
        }
        
        // ⚠️ FILTRO SIMPLE Y DIRECTO: SOLO estas 6 especialidades
        // Lista de palabras clave que deben estar en el nombre (sin acentos, minúsculas)
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').replace(/^\d+\.?\s*/g, '');
        
        const allowedKeywords = [
          'urologia',
          'andrologia', 
          'medicinasexual',
          'fisioterapia',
          'medicinafisica',
          'rehabilitacion',
          'ginecologia',
          'medicinaintegrativa',
          'medicinapreventiva'
        ];
        
        const nameMapping: Record<string, string> = {
          'urologia': 'Urología',
          'andrologia': 'Andrología y medicina sexual',
          'medicinasexual': 'Andrología y medicina sexual',
          'fisioterapia': 'Fisioterapia',
          'medicinafisica': 'Medicina Rehabilitadora',
          'rehabilitacion': 'Medicina Rehabilitadora',
          'ginecologia': 'Ginecología',
          'medicinaintegrativa': 'Medicina Integrativa',
          'medicinapreventiva': 'Medicina Integrativa'
        };
        
        console.log('🔍 FILTRO SIMPLE: Solo permitir estas palabras clave:', allowedKeywords);
        
        const formattedOptions = data
          .filter((specialty: { name: string; id: number }) => {
            const originalName = specialty.name.trim();
            const normalized = normalize(originalName);
            
            console.log(`  🔍 "${originalName}" → normalizado: "${normalized}"`);
            
            // Verificar si el nombre normalizado contiene alguna palabra clave permitida
            const matches = allowedKeywords.some(keyword => {
              if (normalized.includes(keyword)) {
                console.log(`    ✅ MATCH: "${normalized}" contiene "${keyword}"`);
                return true;
              }
              return false;
            });
            
            if (!matches) {
              console.log(`    🚫 BLOQUEADO: "${originalName}" no contiene ninguna palabra clave permitida`);
              return false;
            }
            
            return true;
          })
          .map((specialty: { name: string; id: number }) => {
            const originalName = specialty.name.trim();
            const normalized = normalize(originalName);
            
            // Buscar qué palabra clave coincide para determinar el nombre a mostrar
            let displayName = originalName.replace(/^\d+\.?\s*/g, '').trim(); // Por defecto, quitar prefijo numérico
            
            // Buscar el match más específico (más largo primero)
            const sortedKeywords = allowedKeywords.sort((a, b) => b.length - a.length);
            for (const keyword of sortedKeywords) {
              if (normalized.includes(keyword) && nameMapping[keyword]) {
                displayName = nameMapping[keyword];
                console.log(`    📝 Mapeando "${originalName}" → "${displayName}" (keyword: "${keyword}")`);
                break;
              }
            }
            
            return {
              id: specialty.id,
              name: displayName,
            };
          });
        
        console.log('✅ Especialidades filtradas:', formattedOptions);
        console.log(`📊 Total de especialidades después del filtro: ${formattedOptions.length}`);
        
        // ⚠️ ADVERTENCIA si no hay especialidades después del filtro
        if (formattedOptions.length === 0) {
          console.error('❌ ERROR: El filtro bloqueó TODAS las especialidades!');
          console.error('❌ Esto significa que NINGUNA especialidad de la API coincide con la lista blanca');
          console.error('❌ Revisa los logs anteriores para ver qué nombres vienen de la API');
        }
        
        // Establecer las especialidades filtradas
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
        <div className="w-full flex items-center justify-center flex-col mt-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', marginTop: '40px', marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#9DABAF',
            textAlign: 'center',
            marginBottom: '12px',
            letterSpacing: '0.3px',
            lineHeight: '1.5'
          }}>
            Bienvenido/a a Cita Online 👋
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
            Selecciona la Especialidad
          </h1>
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
            ) : serviceOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center col-span-2 mt-8" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ color: '#9DABAF', fontSize: '14px', marginBottom: '8px' }}>
                  No hay especialidades disponibles en este momento
                </p>
                <p style={{ color: '#9DABAF', fontSize: '12px' }}>
                  Por favor, intenta más tarde
                </p>
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
