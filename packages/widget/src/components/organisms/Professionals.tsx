import React, { useEffect, useState } from "react";
import ProfessionalCardOption from "../molecules/ProfessionalCard.tsx";
import { getDoctors } from "../../services/GuaAPIService.ts";
import { PuffLoader } from "react-spinners";
import DoctorImage from "../atoms/DoctorImage.tsx";

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


// Mapeo de profesionales permitidos por especialidad
// Formato: nombre normalizado (sin acentos, minúsculas) -> nombres permitidos (búsqueda parcial)
const allowedProfessionals: Record<string, string[]> = {
  // Urología y Andrología - SOLO estos 3 doctores
  'urologia': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  'andrologia': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  'medicinasexual': ['nicolas nervo', 'andres humberto vargas', 'andrea noya'],
  // Fisioterapia - SOLO Jasmina (viene de Psicología en DriCloud)
  'fisioterapia': ['jasmina', 'jasmina garcia', 'jasmina garcia velazquez', 'jasmina garcia velázquez', 'garcia velazquez', 'velazquez'],
  // Medicina Rehabilitadora - SOLO María Consuelo
  'medicinafisica': ['maria consuelo', 'consuelo', 'maria c', 'maria consuelo'],
  'rehabilitacion': ['maria consuelo', 'consuelo', 'maria c', 'maria consuelo'],
  'medicinarehabilitadora': ['maria consuelo', 'consuelo', 'maria c', 'maria consuelo'],
  // Ginecología - SOLO Carlos Blanco
  'ginecologia': ['carlos blanco', 'carlos', 'blanco', 'carlos blanco'],
  // Medicina Integrativa - SOLO Diego Puebla (también se llama Medicina Preventiva)
  'medicinaintegrativa': ['diego puebla', 'diego', 'puebla'],
  'medicinapreventiva': ['diego puebla', 'diego', 'puebla'],
  'preventiva': ['diego puebla', 'diego', 'puebla'],
  'integrativa': ['diego puebla', 'diego', 'puebla'],
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
  if (!normalizedDoctor || normalizedDoctor === 'dr' || normalizedDoctor.trim() === '') {
    console.warn(`⚠️ Doctor sin nombre válido: "${doctorName}"`);
    return false;
  }
  
  // Buscar en todas las claves de allowedProfessionals
  let foundMatchingKey = false;
  for (const [key, allowedNames] of Object.entries(allowedProfessionals)) {
    // Búsqueda más flexible: verificar si la especialidad normalizada contiene la clave o viceversa
    const serviceMatches = normalizedService.includes(key) || key.includes(normalizedService);
    
    if (serviceMatches) {
      foundMatchingKey = true;
      console.log(`🔑 Especialidad "${normalizedService}" coincide con clave "${key}", nombres permitidos:`, allowedNames);
      
      // Verificar si el nombre del doctor coincide con alguno de los permitidos
      const matches = allowedNames.some(allowed => {
        // Búsqueda más flexible: verificar si el nombre del doctor contiene alguna parte del nombre permitido
        const doctorParts = normalizedDoctor.split(' ').filter(p => p.length > 1); // Al menos 2 caracteres
        const allowedParts = allowed.split(' ').filter(p => p.length > 1);
        
        // Verificar si alguna parte del nombre permitido está en el nombre del doctor
        const match = allowedParts.some(part => {
          return doctorParts.some(docPart => {
            // Coincidencia más flexible: si alguna parte coincide significativamente
            const found = docPart.includes(part) || part.includes(docPart) || 
                         (part.length >= 3 && docPart.length >= 3 && 
                          (docPart.startsWith(part) || part.startsWith(docPart)));
            if (found) {
              console.log(`  ✅ Match parcial: "${part}" encontrado en "${docPart}"`);
            }
            return found;
          });
        });
        
        // También verificar coincidencia completa
        if (!match) {
          const fullMatch = normalizedDoctor.includes(allowed) || allowed.includes(normalizedDoctor);
          if (fullMatch) {
            console.log(`  ✅ Match completo: "${normalizedDoctor}" contiene "${allowed}"`);
            return true;
          }
        }
        
        return match;
      });
      
      if (matches) {
        console.log(`✅ Match encontrado: "${normalizedDoctor}" coincide con "${allowedNames.join(' o ')}"`);
      } else {
        console.log(`❌ No hay match: "${normalizedDoctor}" no coincide con ninguno de: "${allowedNames.join(' o ')}"`);
        console.log(`   Partes del doctor: [${normalizedDoctor.split(' ').join(', ')}]`);
        console.log(`   Nombres permitidos: [${allowedNames.join(', ')}]`);
      }
      
      return matches;
    }
  }
  
  // Si no hay restricciones para esta especialidad, permitir todos
  if (!foundMatchingKey) {
    console.log(`ℹ️ No hay restricciones configuradas para "${serviceName}" (normalizado: "${normalizedService}"), permitiendo todos los doctores`);
    console.log(`   Claves disponibles: [${Object.keys(allowedProfessionals).join(', ')}]`);
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
        console.log('🚀 Iniciando fetchDoctors para serviceId:', serviceId, 'serviceChoice:', serviceChoice);
        const data = await getDoctors(serviceId);
        console.log('📋 Todos los doctores recibidos de la API:', data);
        console.log('📋 Cantidad de doctores recibidos:', data?.length || 0);
        console.log('🔍 Especialidad actual:', serviceChoice);
        console.log('🔍 Tipo de data:', typeof data, '¿Es array?:', Array.isArray(data));
        
        // Validar que data sea un array antes de procesarlo
        if (!Array.isArray(data)) {
          console.error('❌ Error: La respuesta no es un array:', data);
          console.error('❌ Tipo de data:', typeof data);
          console.error('❌ Contenido completo:', JSON.stringify(data, null, 2));
          setProfessionalOptions([]);
          return;
        }
        
        if (data.length === 0) {
          console.warn('⚠️ No se recibieron doctores de la API');
          setProfessionalOptions([]);
          setLoading(false);
          return;
        }
        
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
          
          // Para todas las especialidades, usar el filtro específico de la lista blanca
          const isAllowed = isDoctorAllowed(fullName, serviceChoice);
          
          if (!isAllowed) {
            console.log(`❌ Doctor filtrado: "${fullName}" (ID: ${doctorId}) - no permitido para "${serviceChoice}"`);
          } else {
            console.log(`✅ Doctor permitido: "${fullName}" (ID: ${doctorId}) para "${serviceChoice}"`);
          }
          
          return isAllowed;
        });
        
        console.log('✅ Doctores filtrados:', filteredData);
        console.log('📊 Estadísticas de filtrado:', {
          totalRecibidos: data.length,
          totalFiltrados: filteredData.length,
          especialidad: serviceChoice,
          doctoresPermitidos: filteredData.map(d => {
            const firstName = (d.name || d.USU_NOMBRE || '').trim();
            const lastName = (d.surname || d.USU_APELLIDOS || '').trim();
            return `${firstName} ${lastName}`.trim();
          })
        });
        
        if (filteredData.length === 0) {
          console.warn('⚠️ ⚠️ ⚠️ NINGÚN DOCTOR PASÓ EL FILTRO ⚠️ ⚠️ ⚠️');
          console.warn('⚠️ Esto puede significar que:');
          console.warn('   1. Los nombres de los doctores no coinciden con allowedProfessionals');
          console.warn('   2. La especialidad no tiene restricciones configuradas pero el filtro está bloqueando');
          console.warn('   3. Los nombres están vacíos o mal formateados');
          console.warn('📋 Doctores recibidos (para comparar):', data.map(d => {
            const firstName = (d.name || d.USU_NOMBRE || '').trim();
            const lastName = (d.surname || d.USU_APELLIDOS || '').trim();
            return {
              fullName: `${firstName} ${lastName}`.trim(),
              normalized: normalizeName(`${firstName} ${lastName}`.trim()),
              raw: d
            };
          }));
        }
        
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
            
            // Log para identificar doctores sin imagen (después de construir displayName)
            if (!doctor.FotoPerfil || doctor.FotoPerfil.trim() === '') {
              const normalizedName = normalizeName(displayName);
              const isCarlosBlanco = normalizedName.includes('carlos') && normalizedName.includes('blanco');
              
              if (isCarlosBlanco) {
                console.log(`🔵 CARLOS BLANCO detectado sin FotoPerfil: ${displayName} (ID: ${doctorId})`);
                console.log(`🔵 ID de Carlos Blanco: ${doctorId}`);
              }
              
              console.log(`⚠️ Doctor sin FotoPerfil de DriCloud: ${displayName} (ID: ${doctorId})`);
              console.log(`📝 Para agregar imagen local, guarda la imagen en: /public/doctors/${doctorId}.jpg o ${doctorId}.png`);
              console.log(`📝 Y agrega al mapeo: ${doctorId}: '/doctors/${doctorId}.png'`);
            }
            
            // Usar el componente DoctorImage que maneja el fallback automáticamente
            // Pasar el nombre completo para búsqueda por nombre si no se encuentra por ID
            // Usar el nombre sin "Dr" para la búsqueda, ya que el mapeo está por nombre completo
            const fullName = `${firstName} ${lastName}`.trim();
            const fullNameForSearch = fullName.toLowerCase().trim(); // Nombre normalizado para búsqueda
            const photo = (
              <div className="w-full h-full rounded-full overflow-hidden">
                <DoctorImage
                  doctorId={doctorId}
                  dricloudImage={doctor.FotoPerfil}
                  alt={fullName || 'Doctor'}
                  className="w-full h-full object-cover"
                  doctorName={fullNameForSearch}
                />
              </div>
            );
            
            // Log adicional para debugging de imágenes
            console.log(`🖼️ Preparando imagen para: ${displayName}`, {
              doctorId,
              firstName,
              lastName,
              fullName,
              fullNameForSearch,
              hasFotoPerfil: !!doctor.FotoPerfil,
              fotoPerfilLength: doctor.FotoPerfil?.length || 0
            });
            
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
