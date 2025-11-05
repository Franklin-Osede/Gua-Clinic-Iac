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

  const parseAvailableDates = useCallback((data: string[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    // Filtrar y parsear fechas disponibles
    const dates = data
      .filter((entry) => {
        // Validar que el entry tenga el formato correcto
        if (!entry || typeof entry !== 'string' || entry.length < 8) {
          return false;
        }
        
        const [datetime] = entry.split(":");
        if (!datetime || datetime.length < 8) {
          return false;
        }
        
        try {
          const year = parseInt(datetime.slice(0, 4), 10);
          const month = parseInt(datetime.slice(4, 6), 10) - 1;
          const day = parseInt(datetime.slice(6, 8), 10);
          
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return false;
          }
          
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          
          // Filtrar solo fechas futuras
          return date >= now;
        } catch (e) {
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

  const filterAvailableTimes = useCallback(
    (date: Date): string[] => {
      if (!fullAvailableData || fullAvailableData.length === 0) {
        return [];
      }
      
      const dateString = formatStringFromDate(date);
      const times = fullAvailableData
        .filter((entry) => {
          if (!entry || typeof entry !== 'string') return false;
          return entry.startsWith(dateString);
        })
        .map((entry) => {
          const [datetime] = entry.split(":");
          if (!datetime || datetime.length < 12) return null;
          
          const hour = parseInt(datetime.slice(8, 10), 10);
          const minute = parseInt(datetime.slice(10, 12), 10);
          
          if (isNaN(hour) || isNaN(minute)) return null;

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
          // Ordenar por hora (convertir a formato 24h para comparar)
          const timeA = a.replace('.', ':').toLowerCase();
          const timeB = b.replace('.', ':').toLowerCase();
          return timeA.localeCompare(timeB);
        });
      
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

  const handleDateChange = (value: Value) => {
    if (!(value instanceof Date)) return;

    // Verificar que la fecha esté disponible antes de seleccionarla
    const isAvailable = availableDates.some(
      (availableDate) => availableDate.toDateString() === value.toDateString(),
    );

    if (!isAvailable) {
      console.log('⚠️ Fecha no disponible:', value);
      return;
    }

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

  const isDateDisabled = ({ date }: { date: Date }) => {
    // Deshabilitar fechas que NO están en availableDates (reservadas o sin disponibilidad)
    const isAvailable = availableDates.some(
      (availableDate) => availableDate.toDateString() === date.toDateString(),
    );
    
    // También deshabilitar fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return !isAvailable || checkDate < today;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const isAvailable = availableDates.some(
        (availableDate) => availableDate.toDateString() === date.toDateString(),
      );

      if (!isAvailable) return null;

      if (isAvailable) {
        const isSelected =
          (selectedDate === null &&
            getMatchingDate(activeDate, availableDates)?.toDateString() ===
              date.toDateString()) ||
          (selectedDate instanceof Date &&
            selectedDate.toDateString() === date.toDateString());

        if (isSelected) {
          return "selected-date";
        } else if (
          selectedDate ||
          getMatchingDate(activeDate, availableDates)
        ) {
          return "available-date-selected";
        } else {
          return "available-date";
        }
      }
    }

    return null;
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
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMonthPicker(!showMonthPicker);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMonthPicker(!showMonthPicker);
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
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(234, 198, 7, 0.1)';
                        e.currentTarget.style.color = '#EAC607';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#242424';
                      }}
                    >
                      {label}
                      <span style={{ fontSize: '12px', marginLeft: '4px' }}>▼</span>
                    </div>
                    
                    {showMonthPicker && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998
                          }}
                          onClick={() => setShowMonthPicker(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '8px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                            padding: '12px',
                            minWidth: '280px',
                            zIndex: 9999,
                            border: '1px solid rgba(0, 0, 0, 0.06)'
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                              onClick={() => {
                                const newDate = new Date(activeStartDate);
                                newDate.setFullYear(newDate.getFullYear() - 1);
                                setActiveStartDate(newDate);
                              }}
                              style={{
                                background: 'rgba(234, 198, 7, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#242424',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.1)';
                              }}
                            >
                              ‹
                            </button>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#242424'
                            }}>
                              {currentYear}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newDate = new Date(activeStartDate);
                                newDate.setFullYear(newDate.getFullYear() + 1);
                                setActiveStartDate(newDate);
                              }}
                              style={{
                                background: 'rgba(234, 198, 7, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#242424',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 198, 7, 0.1)';
                              }}
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
                                onClick={() => {
                                  const newDate = new Date(activeStartDate);
                                  newDate.setMonth(index);
                                  setActiveStartDate(newDate);
                                  setShowMonthPicker(false);
                                }}
                                style={{
                                  padding: '10px 8px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: currentMonth === index ? '#EAC607' : 'transparent',
                                  color: currentMonth === index ? '#FFFFFF' : '#242424',
                                  fontWeight: currentMonth === index ? 700 : 500,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (currentMonth !== index) {
                                    e.currentTarget.style.background = 'rgba(234, 198, 7, 0.1)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentMonth !== index) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                {month.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
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
