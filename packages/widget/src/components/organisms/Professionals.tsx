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

// Mapeo de profesionales permitidos por especialidad
// Formato: nombre normalizado (sin acentos, minúsculas) -> nombres permitidos (búsqueda parcial)
const allowedProfessionals: Record<string, string[]> = {
  // Urología y Andrología
  'urologia': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  'andrologia': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  'medicinasexual': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  // Psicología - solo Jasmina García Velázquez
  'psicologia': ['jasmina', 'jasmina garcia', 'jasmina garcia velazquez', 'garcia velazquez', 'velazquez'],
  // Fisioterapia: se maneja en el filtro especial (muestra todos excepto Jasmina)
  // Medicina Física y Rehabilitación
  'medicinafisica': ['maria consuelo', 'consuelo'],
  'rehabilitacion': ['maria consuelo', 'consuelo'],
  // Ginecología
  'ginecologia': ['carlos blanco'],
  // Medicina Integrativa
  'medicinaintegrativa': ['diego puebla'],
};

// Función para normalizar nombres (quitar acentos, minúsculas, espacios)
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
};

// Función para verificar si un doctor está permitido para una especialidad
const isDoctorAllowed = (doctorName: string, serviceName: string): boolean => {
  const normalizedService = normalizeName(serviceName);
  const normalizedDoctor = normalizeName(doctorName);
  
  console.log(`🔍 Verificando doctor: "${doctorName}" (normalizado: "${normalizedDoctor}") para especialidad: "${serviceName}" (normalizado: "${normalizedService}")`);
  
  // Si el nombre del doctor está vacío, no permitir (pero loguear para debug)
  if (!normalizedDoctor || normalizedDoctor === 'dr') {
    console.warn(`⚠️ Doctor sin nombre válido: "${doctorName}"`);
    return false;
  }
  
  // Buscar en todas las claves de allowedProfessionals
  let foundMatchingKey = false;
  for (const [key, allowedNames] of Object.entries(allowedProfessionals)) {
    if (normalizedService.includes(key)) {
      foundMatchingKey = true;
      console.log(`🔑 Especialidad "${normalizedService}" coincide con clave "${key}", nombres permitidos:`, allowedNames);
      
      // Verificar si el nombre del doctor coincide con alguno de los permitidos
      const matches = allowedNames.some(allowed => {
        // Búsqueda más flexible: verificar si el nombre del doctor contiene alguna parte del nombre permitido
        const doctorParts = normalizedDoctor.split(' ').filter(p => p.length > 0);
        const allowedParts = allowed.split(' ').filter(p => p.length > 0);
        
        // Verificar si alguna parte del nombre permitido está en el nombre del doctor
        const match = allowedParts.some(part => {
          return doctorParts.some(docPart => {
            const found = docPart.includes(part) || part.includes(docPart);
            if (found) {
              console.log(`  ✅ Match parcial: "${part}" encontrado en "${docPart}"`);
            }
            return found;
          });
        });
        
        return match;
      });
      
      if (matches) {
        console.log(`✅ Match encontrado: "${normalizedDoctor}" coincide con "${allowedNames.join(' o ')}"`);
      } else {
        console.log(`❌ No hay match: "${normalizedDoctor}" no coincide con ninguno de: "${allowedNames.join(' o ')}"`);
      }
      
      return matches;
    }
  }
  
  // Si no hay restricciones para esta especialidad, permitir todos
  if (!foundMatchingKey) {
    console.log(`ℹ️ No hay restricciones configuradas para "${serviceName}", permitiendo todos los doctores`);
  }
  return true;
};

const Professionals: React.FC<ProfessionalsProps> = ({
  activeProfessionalId,
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
        console.log('📋 Todos los doctores recibidos de la API:', data);
        console.log('🔍 Especialidad actual:', serviceChoice);
        
        // Filtrar doctores según la especialidad
        const filteredData = data.filter((doctor: {
          doctor_id?: number;
          USU_ID?: number;
          name?: string;
          surname?: string;
          USU_NOMBRE?: string;
          USU_APELLIDOS?: string;
          FotoPerfil?: string;
        }) => {
          // Normalizar campos
          const doctorId = doctor.doctor_id || doctor.USU_ID || 0;
          const firstName = (doctor.name || doctor.USU_NOMBRE || '').trim();
          const lastName = (doctor.surname || doctor.USU_APELLIDOS || '').trim();
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Log detallado de cada doctor antes de filtrar
          console.log(`🔍 Doctor raw data:`, {
            id: doctorId,
            name: doctor.name,
            surname: doctor.surname,
            USU_NOMBRE: doctor.USU_NOMBRE,
            USU_APELLIDOS: doctor.USU_APELLIDOS,
            normalized: { firstName, lastName, fullName },
            fullRaw: doctor
          });
          
          const normalizedServiceChoice = normalizeName(serviceChoice || '');
          
          // Filtro especial para Psicología: solo permitir Jasmina García Velázquez
          if (normalizedServiceChoice.includes('psicologia') && !normalizedServiceChoice.includes('fisioterapia')) {
            const normalizedDoctor = normalizeName(fullName);
            const normalizedFirstName = normalizeName(firstName);
            const normalizedLastName = normalizeName(lastName);
            
            // Buscar "jasmina" en el nombre y "garcia" + "velazquez" en los apellidos
            const hasJasmina = normalizedFirstName.includes('jasmina') || normalizedDoctor.includes('jasmina');
            const hasGarcia = normalizedLastName.includes('garcia') || normalizedDoctor.includes('garcia');
            const hasVelazquez = normalizedLastName.includes('velazquez') || normalizedDoctor.includes('velazquez');
            
            // Es Jasmina si tiene "jasmina" en el nombre Y (garcia O velazquez) en los apellidos
            const isJasmina = hasJasmina && (hasGarcia || hasVelazquez);
            
            if (!isJasmina) {
              console.log(`❌ Doctor filtrado para Psicología: "${fullName}" (ID: ${doctorId}) - no es Jasmina García Velázquez`);
              console.log(`   - hasJasmina: ${hasJasmina}, hasGarcia: ${hasGarcia}, hasVelazquez: ${hasVelazquez}`);
              return false;
            } else {
              console.log(`✅ Doctor permitido para Psicología: "${fullName}" (ID: ${doctorId}) - es Jasmina García Velázquez`);
              return true;
            }
          }
          
          // Para Fisioterapia: mostrar todos los profesionales que devuelve la API (sin Jasmina)
          if (normalizedServiceChoice.includes('fisioterapia')) {
            // Excluir explícitamente a Jasmina
            const normalizedDoctor = normalizeName(fullName);
            const normalizedFirstName = normalizeName(firstName);
            const normalizedLastName = normalizeName(lastName);
            
            const hasJasmina = normalizedFirstName.includes('jasmina') || normalizedDoctor.includes('jasmina');
            const hasGarcia = normalizedLastName.includes('garcia') || normalizedDoctor.includes('garcia');
            const hasVelazquez = normalizedLastName.includes('velazquez') || normalizedDoctor.includes('velazquez');
            const isJasmina = hasJasmina && (hasGarcia || hasVelazquez);
            
            if (isJasmina) {
              console.log(`❌ Doctor filtrado para Fisioterapia: "${fullName}" (ID: ${doctorId}) - es Jasmina (pertenece a Psicología)`);
              return false;
            }
            
            // Permitir todos los demás profesionales para Fisioterapia
            console.log(`✅ Doctor permitido para Fisioterapia: "${fullName}" (ID: ${doctorId})`);
            return true;
          }
          
          // Para otras especialidades, usar el filtro normal
          const isAllowed = isDoctorAllowed(fullName, serviceChoice);
          
          if (!isAllowed) {
            console.log(`❌ Doctor filtrado: "${fullName}" (ID: ${doctorId}) - no permitido para "${serviceChoice}"`);
          } else {
            console.log(`✅ Doctor permitido: "${fullName}" (ID: ${doctorId})`);
          }
          
          return isAllowed;
        });
        
        console.log('✅ Doctores filtrados:', filteredData);
        
        const doctors = filteredData.map(
          (doctor: {
            doctor_id: number;
            name?: string;
            surname?: string;
            USU_NOMBRE?: string; // Formato DriCloud
            USU_APELLIDOS?: string; // Formato DriCloud
            USU_ID?: number; // Formato DriCloud
            FotoPerfil?: string;
          }): DoctorInfo => {
            // Normalizar campos: usar name/surname si están, sino usar USU_NOMBRE/USU_APELLIDOS
            const doctorId = doctor.doctor_id || doctor.USU_ID || 0;
            const firstName = (doctor.name || doctor.USU_NOMBRE || '').trim();
            const lastName = (doctor.surname || doctor.USU_APELLIDOS || '').trim();
            // Log detallado del doctor antes de procesar
            console.log(`🔍 Procesando doctor:`, {
              doctor_id: doctorId,
              firstName,
              lastName,
              name: doctor.name,
              surname: doctor.surname,
              USU_NOMBRE: doctor.USU_NOMBRE,
              USU_APELLIDOS: doctor.USU_APELLIDOS,
              raw: doctor
            });
            
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
            else if (doctorPhotos[doctorId]) {
              photo = doctorPhotos[doctorId];
            } 
            // 3. Si no hay nada, mostrar placeholder
            else {
              photo = (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                  <span className="text-gray-500 text-xs font-semibold">DR</span>
                </div>
              );
            }
            
            // Construir nombre completo, asegurando que siempre se muestre
            // Asegurar que siempre tengamos un nombre para mostrar
            let displayName = 'Dr';
            
            if (firstName && lastName) {
              // Formato: "Dr Nombre Apellido" pero solo primer nombre si es muy largo
              const firstNames = firstName.split(' ');
              const firstFirstName = firstNames[0]; // Solo primer nombre
              displayName = `Dr ${firstFirstName} ${lastName}`;
            } else if (firstName) {
              displayName = `Dr ${firstName}`;
            } else if (lastName) {
              displayName = `Dr ${lastName}`;
            } else {
              // Si no hay datos, mostrar ID pero con advertencia
              displayName = doctorId ? `Dr (ID: ${doctorId})` : 'Dr';
              console.warn(`⚠️ Doctor sin nombre completo - ID: ${doctorId}, datos:`, doctor);
            }
            
            // Log para debugging
            console.log(`👤 Doctor procesado: ${displayName} (ID: ${doctorId}, firstName: "${firstName}", lastName: "${lastName}")`);
            
            return {
              photo,
              name: displayName,
              id: doctorId,
            };
          },
        );
        
        console.log('✅ Doctores procesados para mostrar:', doctors);
        console.log(`📊 Total de doctores a mostrar: ${doctors.length}`);
        setProfessionalOptions(doctors);
      } catch (error) {
        console.error("❌ Error fetching doctors:", error);
        setProfessionalOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors().then();
  }, [serviceId, serviceChoice]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full flex items-center justify-center flex-col mt-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', marginTop: '40px', marginBottom: '48px' }}>
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
          Selecciona el profesional
        </h1>
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
            <>
              {console.log('🎨 Renderizando profesionales:', { count: professionalOptions.length, options: professionalOptions })}
              {professionalOptions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#9DABAF', fontSize: '14px' }}>
                    No hay profesionales disponibles para esta especialidad
                  </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Professionals;
