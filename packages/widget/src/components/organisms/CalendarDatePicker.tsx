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
    const initialize = async () => {
      const currentDate = new Date();
      const data = await fetchAvailability(currentDate);

      if (data.length === 0) return;

      const firstAvailableMonth = parseInt(data[0].slice(4, 6), 10) - 1;
      const currentMonth = currentDate.getMonth();

      if (firstAvailableMonth !== currentMonth) {
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          firstAvailableMonth,
          1,
        );
        const newData = await fetchAvailability(firstDayOfMonth);
        parseAvailableDates(newData);
      } else {
        parseAvailableDates(data);
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
    if (!activeDate || availableDates.length === 0) return;

    const matchedDate = getMatchingDate(activeDate, availableDates);
    if (!matchedDate) return;

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
    <div className="flex items-center justify-center w-full flex-col">
      <div className="w-full flex 2xl:items-center md:items-center items-start justify-center flex-col pl-6 mt-8">
        <h3 className="text-primary-400">{serviceChoice}</h3>
        <h1>Selecciona cuándo quieres tu cita</h1>
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
