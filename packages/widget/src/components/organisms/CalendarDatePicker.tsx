import React, { useCallback, useEffect, useState } from "react";
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

  const parseAvailableDates = useCallback((data: string[]) => {
    const now = new Date();
    const dates = data
      .map((entry) => {
        const [datetime] = entry.split(":");
        return new Date(
          parseInt(datetime.slice(0, 4), 10),
          parseInt(datetime.slice(4, 6), 10) - 1,
          parseInt(datetime.slice(6, 8), 10),
        );
      })
      .filter((date) => date > now);

    const uniqueDates = Array.from(
      new Set(dates.map((d) => d.toDateString())),
    ).map((dateString) => new Date(dateString));

    setAvailableDates(uniqueDates);

    if (uniqueDates.length > 0) {
      setActiveStartDate(
        new Date(uniqueDates[0].getFullYear(), uniqueDates[0].getMonth(), 1),
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
      return fullAvailableData
        .filter((entry) => entry.startsWith(formatStringFromDate(date)))
        .map((entry) => {
          const [datetime] = entry.split(":");
          const hour = parseInt(datetime.slice(8, 10), 10);
          const minute = parseInt(datetime.slice(10, 12), 10);

          return new Date(0, 0, 0, hour, minute)
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(":", ".");
        });
    },
    [fullAvailableData],
  );

  useEffect(() => {
    if (!activeDate || availableDates.length === 0) {
      // Si no hay fecha activa o no hay fechas disponibles, resetear tiempos
      setAvailableTimes([]);
      setLoadingTime(false);
      return;
    }

    const matchedDate = getMatchingDate(activeDate, availableDates);
    if (!matchedDate) {
      setAvailableTimes([]);
      setLoadingTime(false);
      return;
    }

    setSelectedDate(matchedDate);
    const times = filterAvailableTimes(matchedDate);
    setAvailableTimes(times);
    setLoadingTime(false);

    const formattedDate = formatDateToLocaleString(matchedDate);
    setDateChosen(formattedDate);

    const fullDateString = formatStringFromDate(matchedDate);
    setDateString(fullDateString);
  }, [activeDate, availableDates, filterAvailableTimes]);

  const handleDateChange = (value: Value) => {
    if (!(value instanceof Date)) return;

    setSelectedDate(value);
    const times = filterAvailableTimes(value);
    setAvailableTimes(times);
    setLoadingTime(false);

    const formattedDate = formatDateToLocaleString(value);
    setDateChosen(formattedDate);

    const yearMonthDayFormat = formatStringFromDate(value);
    const fullDateString =
      activeTimeId !== null
        ? yearMonthDayFormat + convertTo24HourFormat(times[activeTimeId])
        : yearMonthDayFormat;
    setDateString(fullDateString);

    const fullDateTitle =
      activeTimeId !== null
        ? `${times[activeTimeId]} · ${formattedDate}`
        : formattedDate;

    onDateTimeChosen(activeTimeId, fullDateTitle, fullDateString);
  };

  const isDateDisabled = ({ date }: { date: Date }) =>
    !availableDates.some(
      (availableDate) => availableDate.toDateString() === date.toDateString(),
    );

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
          Selecciona cuándo quieres tu cita
        </h1>
      </div>
      <div className="flex flex-col w-full md:mt-3 mt-0 pl-[1.375rem] max-w-[25rem]">
        <p className="text-primary-400 font-medium text-start m-2 2xl:mb-4">
          Fecha
        </p>
      </div>

      <div className="flex items-center justify-center w-full flex-col max-w-[25rem]">
        <div className="min-h-[315px]">
          {loadingDate ? (
            <div className="flex justify-center items-center col-span-2 mt-8">
              <PuffLoader size={30} color={"#9CA3AF"} loading={loadingDate} />
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
              prevLabel={"←"}
              nextLabel={"→"}
              prev2Label={null}
              next2Label={null}
            />
          )}
        </div>
        <div className="flex flex-col w-full 2xl:my-5 md:my-3 mt-0 pl-[1.375rem]">
          <p className="text-primary-400 font-medium text-start m-2 2xl:mb-4">
            Hora
          </p>
          {loadingTime && (
            <div className="flex justify-center items-center col-span-2 mt-3">
              <PuffLoader size={30} color={"#9CA3AF"} loading={loadingDate} />
              {!loadingDate && (
                <div className="flex justify-center items-center w-full">
                  <p className="text-primary-400 text-center m-2">
                    Selecciona una fecha para ver las horas disponibles
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="2xl:pr-4 px-4 flex flex-wrap 2xl:gap-5 gap-3.5 2xl:max-h-32 md:max-h-[6.5rem] max-h-[5.5rem] overflow-y-scroll justify-center">
            {availableTimes.map((time, index) => (
              <TimeButton
                key={index}
                time={time}
                id={index}
                onClick={onDateTimeChosen}
                activeTime={activeTimeId == index}
                isDisabled={isDisabled}
                dateNameChosen={dateChosen}
                dateStringChosen={dateString}
              ></TimeButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDatePicker;
