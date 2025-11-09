import React, { useCallback, useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import TimeButton from "../atoms/buttons/TimeButton.tsx";
import { getDoctorAgenda } from "../../services/GuaAPIService.ts";
import {
  convertTo24HourFormat,
  formatDateToLocaleString,
  formatStringFromDate,
} from "@gua/shared";
import { PuffLoader } from "react-spinners";

interface calendarDateProps {
  activeTimeId: number | null;
  activeDate: string;
  doctorId: number;
  isDisabled: boolean;
  serviceChoice: string;
  onDateTimeChosen: (id: number | null, date: string, extra: string) => void;
  refreshKey?: number | string; // Clave para forzar actualización del calendario
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarDatePicker: React.FC<calendarDateProps> = ({
  activeTimeId,
  activeDate,
  doctorId,
  onDateTimeChosen,
  serviceChoice,
  isDisabled,
  refreshKey,
}) => {
  const [loadingDate, setLoadingDate] = useState<boolean>(true);
  const [loadingTime, setLoadingTime] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [dateChosen, setDateChosen] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [fullAvailableData, setFullAvailableData] = useState<string[]>([]);
  const [dateString, setDateString] = useState<string>("");
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  /**
   * Parsea los datos de disponibilidad de DriCloud
   * Formato esperado: "yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"
   * Ejemplo: "202501151000:30:1:1" = 15 Ene 2025 a las 10:00 (30 min, despacho 1, doctor 1)
   */
  const parseAvailableDates = useCallback((data: string[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ parseAvailableDates: datos vacíos o inválidos');
      setAvailableDates([]);
      return;
    }
    
    // Filtrar y parsear fechas disponibles
    const dates = data
      .filter((entry) => {
        // Validar que el entry tenga el formato correcto de DriCloud
        if (!entry || typeof entry !== 'string' || entry.length < 8) {
          return false;
        }
        
        // Formato DriCloud: "yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"
        const [datetime] = entry.split(":");
        if (!datetime || datetime.length < 8) {
          return false;
        }
        
        try {
          // Parsear fecha: yyyyMMdd (primeros 8 caracteres)
          const year = parseInt(datetime.slice(0, 4), 10);
          const month = parseInt(datetime.slice(4, 6), 10) - 1; // Mes es 0-indexed en JS
          const day = parseInt(datetime.slice(6, 8), 10);
          
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return false;
          }
          
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          
          // Filtrar solo fechas futuras (no pasadas)
          return date >= now;
        } catch (e) {
          console.warn('⚠️ Error parseando fecha:', entry, e);
          return false;
        }
      })
      .map((entry) => {
        const [datetime] = entry.split(":");
        const year = parseInt(datetime.slice(0, 4), 10);
        const month = parseInt(datetime.slice(4, 6), 10) - 1;
        const day = parseInt(datetime.slice(6, 8), 10);
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        return date;
      });

    // Obtener fechas únicas usando toDateString para comparar
    const uniqueDatesMap = new Map<string, Date>();
    dates.forEach((date) => {
      const key = date.toDateString();
      if (!uniqueDatesMap.has(key)) {
        uniqueDatesMap.set(key, date);
      }
    });
    
    const finalUniqueDates = Array.from(uniqueDatesMap.values())
      .sort((a, b) => a.getTime() - b.getTime());

    console.log(`✅ parseAvailableDates: ${finalUniqueDates.length} fechas únicas encontradas de ${data.length} slots`);
    setAvailableDates(finalUniqueDates);

    if (finalUniqueDates.length > 0) {
      setActiveStartDate(
        new Date(finalUniqueDates[0].getFullYear(), finalUniqueDates[0].getMonth(), 1),
      );
    } else {
      setActiveStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, []);

  const fetchAvailability = useCallback(
    async (date: Date) => {
      try {
        setLoadingDate(true);
        const data = await getDoctorAgenda(
          doctorId,
          formatStringFromDate(date),
          31,
        );
        setFullAvailableData(data);
        return data;
      } catch (error) {
        console.error("Error fetching available dates:", error);
        return [];
      } finally {
        setLoadingDate(false);
      }
    },
    [doctorId],
  );

  // Cerrar el selector de mes/año cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthPickerRef.current &&
        !monthPickerRef.current.contains(event.target as Node) &&
        showMonthPicker
      ) {
        setShowMonthPicker(false);
      }
    };

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMonthPicker]);

  useEffect(() => {
    console.log('📅 CalendarDatePicker montado/actualizado:', { doctorId, activeDate });
    
    // Resetear estados cuando se monta o cambia el doctorId
    setLoadingDate(true);
    setLoadingTime(true);
    setSelectedDate(null);
    setDateChosen("");
    setAvailableTimes([]);
    setAvailableDates([]);
    setFullAvailableData([]);
    setDateString("");
    setShowMonthPicker(false); // Cerrar selector al cambiar de doctor
    
    const initialize = async () => {
      try {
        // Validar que doctorId sea válido
        if (!doctorId || doctorId === 0) {
          console.warn('⚠️ CalendarDatePicker: doctorId inválido o es 0:', doctorId);
          setLoadingDate(false);
          setLoadingTime(false);
          return;
        }
        
        const currentDate = new Date();
        console.log('📅 Inicializando calendario para doctorId:', doctorId);
        const data = await fetchAvailability(currentDate);
        
        console.log('📅 Datos recibidos de la API:', { 
          length: data?.length || 0, 
          firstItem: data?.[0],
          sample: data?.slice(0, 3) 
        });

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ No hay datos disponibles para el doctor:', doctorId);
          setLoadingDate(false);
          setLoadingTime(false);
          return;
        }

        // Validar que data[0] existe y tiene el formato correcto
        if (!data[0] || typeof data[0] !== 'string' || data[0].length < 8) {
          console.error('❌ Formato de datos inválido:', data[0]);
          setLoadingDate(false);
          setLoadingTime(false);
          return;
        }

        const firstAvailableMonth = parseInt(data[0].slice(4, 6), 10) - 1;
        const currentMonth = currentDate.getMonth();

        console.log('📅 Comparando meses:', { firstAvailableMonth, currentMonth });

        if (firstAvailableMonth !== currentMonth) {
          const firstDayOfMonth = new Date(
            currentDate.getFullYear(),
            firstAvailableMonth,
            1,
          );
          console.log('📅 Cargando datos del mes:', firstDayOfMonth);
          const newData = await fetchAvailability(firstDayOfMonth);
          parseAvailableDates(newData);
        } else {
          parseAvailableDates(data);
        }
      } catch (error) {
        console.error('❌ Error inicializando calendario:', error);
        setLoadingDate(false);
        setLoadingTime(false);
      }
    };

    initialize().then();
  }, [doctorId, fetchAvailability, parseAvailableDates]);

  /**
   * Filtra y formatea los horarios disponibles para una fecha específica
   * Formato DriCloud: "yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"
   */
  const filterAvailableTimes = useCallback(
    (date: Date): string[] => {
      if (!fullAvailableData || fullAvailableData.length === 0) {
        return [];
      }
      
      const now = new Date();
      const dateString = formatStringFromDate(date); // Formato: yyyyMMdd
      
      const times = fullAvailableData
        .filter((entry) => {
          if (!entry || typeof entry !== 'string') return false;
          
          // Verificar que el entry empiece con la fecha (yyyyMMdd)
          if (!entry.startsWith(dateString)) return false;
          
          // Parsear hora para verificar que no sea pasada
          const [datetime] = entry.split(":");
          if (!datetime || datetime.length < 12) return false;
          
          const year = parseInt(datetime.slice(0, 4), 10);
          const month = parseInt(datetime.slice(4, 6), 10) - 1;
          const day = parseInt(datetime.slice(6, 8), 10);
          const hour = parseInt(datetime.slice(8, 10), 10);
          const minute = parseInt(datetime.slice(10, 12), 10);
          
          if (isNaN(hour) || isNaN(minute)) return false;
          
          // Filtrar horarios pasados
          const slotDateTime = new Date(year, month, day, hour, minute);
          return slotDateTime > now;
        })
        .map((entry) => {
          const [datetime] = entry.split(":");
          if (!datetime || datetime.length < 12) return null;
          
          const hour = parseInt(datetime.slice(8, 10), 10);
          const minute = parseInt(datetime.slice(10, 12), 10);
          
          if (isNaN(hour) || isNaN(minute)) return null;

          // Formatear en 12 horas con AM/PM
          return new Date(0, 0, 0, hour, minute)
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(":", ".");
        })
        .filter((time): time is string => time !== null)
        .sort((a, b) => {
          // Ordenar por hora (convertir a formato 24h para comparar correctamente)
          const timeA = a.replace('.', ':').toLowerCase();
          const timeB = b.replace('.', ':').toLowerCase();
          return timeA.localeCompare(timeB);
        });
      
      console.log(`✅ filterAvailableTimes: ${times.length} horarios disponibles para ${dateString}`);
      return times;
    },
    [fullAvailableData],
  );

  // Ref para rastrear el último refreshKey procesado y evitar bucles infinitos
  const lastRefreshKeyRef = useRef<string | number | null>(null);
  
  // Efecto para refrescar disponibilidad cuando cambia refreshKey (después de crear cita)
  useEffect(() => {
    // Solo refrescar si refreshKey cambió y es válido
    if (refreshKey !== undefined && refreshKey !== null && doctorId && refreshKey !== lastRefreshKeyRef.current) {
      console.log('🔄 Refrescando calendario después de crear cita, refreshKey:', refreshKey);
      lastRefreshKeyRef.current = refreshKey;
      
      const refreshAvailability = async () => {
        try {
          // Obtener la fecha actual o la primera fecha disponible del mes actual
          const currentDate = (selectedDate instanceof Date) ? selectedDate : new Date();
          const firstDayOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
          );
          
          const data = await fetchAvailability(firstDayOfMonth);
          
          // Si hay una fecha seleccionada, mantenerla seleccionada pero actualizar disponibilidad
          if (selectedDate instanceof Date) {
            const times = filterAvailableTimes(selectedDate);
            setAvailableTimes(times);
            
            // Si la hora seleccionada ya no está disponible, limpiar selección
            if (activeTimeId !== null && times.length > 0 && activeTimeId >= times.length) {
              console.log('⚠️ La hora seleccionada ya no está disponible, limpiando selección');
              onDateTimeChosen(null, "", "");
            }
          }
          
          parseAvailableDates(data);
        } catch (error) {
          console.error('❌ Error refrescando disponibilidad:', error);
        }
      };
      
      refreshAvailability();
    }
  }, [refreshKey, doctorId]);

  useEffect(() => {
    // Si hay una fecha activa desde el componente padre, intentar hacer match
    if (activeDate && activeDate.length === 12 && availableDates.length > 0) {
      const matchedDate = getMatchingDate(activeDate, availableDates);
      if (matchedDate) {
        setSelectedDate(matchedDate);
        const times = filterAvailableTimes(matchedDate);
        setAvailableTimes(times);
        setLoadingTime(false);

        const formattedDate = formatDateToLocaleString(matchedDate);
        setDateChosen(formattedDate);

        const fullDateString = formatStringFromDate(matchedDate);
        setDateString(fullDateString);
        return;
      }
    }
    
    // Si no hay fecha seleccionada localmente, mostrar mensaje para seleccionar
    if (!selectedDate) {
      setAvailableTimes([]);
      setLoadingTime(false);
    }
  }, [activeDate, availableDates, filterAvailableTimes, selectedDate]);

  /**
   * Maneja el cambio de fecha seleccionada en el calendario
   * Valida que la fecha esté disponible antes de permitir la selección
   */
  const handleDateChange = (value: Value) => {
    if (!(value instanceof Date)) {
      console.warn('⚠️ handleDateChange: valor no es una fecha válida:', value);
      return;
    }

    // Normalizar fechas para comparar solo día/mes/año
    const selectedDateNormalized = new Date(value);
    selectedDateNormalized.setHours(0, 0, 0, 0);

    // Verificar que la fecha esté disponible antes de seleccionarla
    const isAvailable = availableDates.some(
      (availableDate) => {
        const availableDateNormalized = new Date(availableDate);
        availableDateNormalized.setHours(0, 0, 0, 0);
        return availableDateNormalized.getTime() === selectedDateNormalized.getTime();
      }
    );

    if (!isAvailable) {
      console.log('⚠️ Fecha no disponible o sin slots:', value);
      // No permitir seleccionar fechas no disponibles
      return;
    }

    console.log('✅ Fecha seleccionada:', value);
    setSelectedDate(value);
    
    // Cargar tiempos inmediatamente al seleccionar fecha
    setLoadingTime(true);
    
    const times = filterAvailableTimes(value);
    setAvailableTimes(times);
    setLoadingTime(false);

    const formattedDate = formatDateToLocaleString(value);
    setDateChosen(formattedDate);

    const yearMonthDayFormat = formatStringFromDate(value);
    const fullDateString = yearMonthDayFormat;
    setDateString(fullDateString);

    // Si hay una hora previamente seleccionada y sigue disponible, mantenerla
    if (activeTimeId !== null && times.length > 0 && activeTimeId < times.length) {
      const fullDateStringWithTime = yearMonthDayFormat + convertTo24HourFormat(times[activeTimeId]);
      setDateString(fullDateStringWithTime);
      const fullDateTitle = `${times[activeTimeId]} · ${formattedDate}`;
      onDateTimeChosen(activeTimeId, fullDateTitle, fullDateStringWithTime);
    } else {
      // Si no hay hora seleccionada o ya no está disponible, limpiar
      onDateTimeChosen(null, formattedDate, fullDateString);
    }
  };

  /**
   * Determina si una fecha debe estar deshabilitada en el calendario
   * Deshabilita fechas pasadas y fechas sin disponibilidad
   */
  const isDateDisabled = ({ date }: { date: Date }) => {
    // Normalizar fechas para comparar solo día/mes/año
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Deshabilitar fechas pasadas
    if (checkDate < today) {
      return true;
    }
    
    // Deshabilitar fechas que NO están en availableDates (sin disponibilidad)
    const isAvailable = availableDates.some(
      (availableDate) => {
        const availableDateNormalized = new Date(availableDate);
        availableDateNormalized.setHours(0, 0, 0, 0);
        return availableDateNormalized.getTime() === checkDate.getTime();
      }
    );
    
    return !isAvailable;
  };

  /**
   * Aplica clases CSS a las fechas del calendario según su estado
   * - available-date: Fecha con disponibilidad (no seleccionada)
   * - available-date-selected: Fecha disponible cuando hay otra seleccionada
   * - selected-date: Fecha actualmente seleccionada
   */
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    
    // Normalizar fechas para comparar
    const dateNormalized = new Date(date);
    dateNormalized.setHours(0, 0, 0, 0);
    
    const isAvailable = availableDates.some(
      (availableDate) => {
        const availableDateNormalized = new Date(availableDate);
        availableDateNormalized.setHours(0, 0, 0, 0);
        return availableDateNormalized.getTime() === dateNormalized.getTime();
      }
    );

    // Si no está disponible, no aplicar clase (se deshabilitará automáticamente)
    if (!isAvailable) return null;

    // Verificar si es la fecha seleccionada
    const isSelected =
      (selectedDate instanceof Date &&
        selectedDate.toDateString() === date.toDateString()) ||
      (selectedDate === null &&
        getMatchingDate(activeDate, availableDates)?.toDateString() ===
          date.toDateString());

    if (isSelected) {
      return "selected-date";
    } else if (selectedDate || getMatchingDate(activeDate, availableDates)) {
      // Hay otra fecha seleccionada, mostrar esta como disponible pero no seleccionada
      return "available-date-selected";
    } else {
      // Fecha disponible sin selección
      return "available-date";
    }
  };

  const getMatchingDate = (
    activeDate: string,
    availableDates: Date[],
  ): Date | null => {
    if (activeDate.length !== 12) return null;

    const year = parseInt(activeDate.slice(0, 4), 10);
    const month = parseInt(activeDate.slice(4, 6), 10) - 1;
    const day = parseInt(activeDate.slice(6, 8), 10);
    const hour = parseInt(activeDate.slice(8, 10), 10);
    const minute = parseInt(activeDate.slice(10, 12), 10);

    const activeDateObj = new Date(year, month, day, hour, minute);

    return (
      availableDates.find(
        (date) => date.toDateString() === activeDateObj.toDateString(),
      ) || null
    );
  };

  const handleActiveStartDateChange = async ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (!activeStartDate) return;

    // Cerrar el selector de mes/año cuando se cambia de mes usando las flechas
    setShowMonthPicker(false);

    const firstDayOfMonth = new Date(
      activeStartDate.getFullYear(),
      activeStartDate.getMonth(),
      1,
    );
    const data = await fetchAvailability(firstDayOfMonth);
    parseAvailableDates(data);
  };

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '0 20px'
    }}>
      {/* Header minimalista */}
      <div className="w-full flex items-center justify-center flex-col mb-8" style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: '32px', 
        marginBottom: '40px' 
      }}>
        {serviceChoice && (
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#9DABAF',
            textAlign: 'center',
            marginBottom: '6px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            {serviceChoice}
          </div>
        )}
        <h1 className="text-center" style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#242424',
          textAlign: 'center',
          margin: '0',
          letterSpacing: '-0.5px',
          lineHeight: '1.2'
        }}>
          Selecciona fecha y hora
        </h1>
      </div>

      {/* Calendario moderno */}
      <div className="flex items-center justify-center w-full mb-8" style={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        {loadingDate ? (
          <div className="flex justify-center items-center py-16" style={{ minHeight: '400px' }}>
            <PuffLoader size={50} color={"#EAC607"} loading={loadingDate} />
          </div>
        ) : (
            <Calendar
              locale="es-ES"
              onChange={handleDateChange}
              value={selectedDate}
              tileClassName={tileClassName}
              tileDisabled={isDateDisabled}
              activeStartDate={activeStartDate}
              onActiveStartDateChange={({ activeStartDate }) =>
                handleActiveStartDateChange({ activeStartDate })
              }
              view="month"
              minDetail="month"
              maxDetail="month"
              prevLabel={"‹"}
              nextLabel={"›"}
              prev2Label={null}
              next2Label={null}
              navigationLabel={({ date, label }) => {
                // Dropdown para seleccionar mes/año
                const months = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                const currentMonth = date.getMonth();
                const currentYear = date.getFullYear();
                
                return (
                  <div 
                    ref={monthPickerRef}
                    style={{ 
                      position: 'relative', 
                      display: 'inline-block',
                      width: '100%',
                      zIndex: showMonthPicker ? 10000 : 'auto'
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowMonthPicker(!showMonthPicker);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMonthPicker(!showMonthPicker);
                        }
                        if (e.key === 'Escape') {
                          setShowMonthPicker(false);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#242424',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        outline: 'none',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(234, 198, 7, 0.1)';
                        e.currentTarget.style.color = '#EAC607';
                      }}
                      onMouseLeave={(e) => {
                        if (!showMonthPicker) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#242424';
                        }
                      }}
                      aria-label="Seleccionar mes y año"
                      aria-expanded={showMonthPicker}
                    >
                      {label}
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          marginLeft: '6px',
                          transition: 'transform 0.2s ease',
                          transform: showMonthPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'inline-block'
                        }}
                      >
                        ▼
                      </span>
                    </button>
                    
                    {showMonthPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                          padding: '16px',
                          minWidth: '300px',
                          zIndex: 10000,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          animation: 'fadeIn 0.2s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowMonthPicker(false);
                          }
                        }}
                        role="dialog"
                        aria-label="Selector de mes y año"
                      >
                          {/* Selector de año */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                          }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newDate = new Date(activeStartDate);
                                newDate.setFullYear(newDate.getFullYear() - 1);
                                setActiveStartDate(newDate);
                              }}
                              style={{
                                background: 'rgba(234, 198, 7, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#242424',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                fontWeight: 600
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              aria-label="Año anterior"
                            >
                              ‹
                            </button>
                            <span style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#242424',
                              minWidth: '80px',
                              textAlign: 'center'
                            }}>
                              {currentYear}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newDate = new Date(activeStartDate);
                                newDate.setFullYear(newDate.getFullYear() + 1);
                                setActiveStartDate(newDate);
                              }}
                              style={{
                                background: 'rgba(234, 198, 7, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#242424',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                fontWeight: 600
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              aria-label="Año siguiente"
                            >
                              ›
                            </button>
                          </div>
                          
                          {/* Grid de meses */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px'
                          }}>
                            {months.map((month, index) => (
                              <button
                                key={month}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newDate = new Date(activeStartDate);
                                  newDate.setMonth(index);
                                  setActiveStartDate(newDate);
                                  setShowMonthPicker(false);
                                }}
                                style={{
                                  padding: '12px 8px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: currentMonth === index ? '#EAC607' : 'transparent',
                                  color: currentMonth === index ? '#FFFFFF' : '#242424',
                                  fontWeight: currentMonth === index ? 700 : 500,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  textTransform: 'capitalize'
                                }}
                                onMouseEnter={(e) => {
                                  if (currentMonth !== index) {
                                    e.currentTarget.style.background = 'rgba(234, 198, 7, 0.15)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentMonth !== index) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                                aria-label={`Seleccionar ${month}`}
                                aria-pressed={currentMonth === index}
                              >
                                {month.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>
                );
              }}
            />
        )}
      </div>

      {/* Sección de Horas - Diseño integrado */}
      <div className="flex flex-col w-full mb-6" style={{ 
        width: '100%', 
        maxWidth: '420px',
        marginTop: '32px',
        marginBottom: '32px'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#242424',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          paddingLeft: '4px'
        }}>
          Horas disponibles
        </div>
        
        {loadingTime ? (
          <div className="flex justify-center items-center py-16" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            minHeight: '120px'
          }}>
            <PuffLoader size={40} color={"#EAC607"} loading={loadingTime} />
          </div>
        ) : !selectedDate ? (
          <div className="flex justify-center items-center py-16 px-6" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed rgba(157, 171, 175, 0.3)',
            minHeight: '120px'
          }}>
            <p style={{
              color: '#9DABAF',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              Selecciona una fecha para ver las horas disponibles
            </p>
          </div>
        ) : availableTimes.length === 0 ? (
          <div className="flex justify-center items-center py-16 px-6" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed rgba(157, 171, 175, 0.3)',
            minHeight: '120px'
          }}>
            <p style={{
              color: '#9DABAF',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              No hay horarios disponibles para esta fecha
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 p-4" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            maxHeight: '200px',
            overflowY: 'auto',
            justifyContent: 'flex-start',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            {availableTimes.map((time, index) => (
              <TimeButton
                key={`${dateString}-${index}-${time}`}
                time={time}
                id={index}
                onClick={onDateTimeChosen}
                activeTime={activeTimeId === index}
                isDisabled={isDisabled}
                dateNameChosen={dateChosen}
                dateStringChosen={dateString}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDatePicker;
