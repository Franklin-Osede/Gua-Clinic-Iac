import React from "react";
import { convertTo24HourFormat } from "../../../services/utils.ts";

interface TimeButtonProps {
  id: number;
  activeTime: boolean;
  isDisabled: boolean;
  time: string;
  dateNameChosen: string;
  dateStringChosen: string;
  onClick: (time: null | number, date: string, extra: string) => void;
}

export const TimeButton: React.FC<TimeButtonProps> = ({
  id,
  activeTime,
  isDisabled,
  time,
  dateNameChosen,
  dateStringChosen,
  onClick,
}) => {
  const handleClick = () => {
    const fullDateName = `${time} · ${dateNameChosen}`;
    const fullDateString = dateStringChosen + convertTo24HourFormat(time);
    onClick(id, fullDateName, fullDateString);
  };

  return (
    <div
      onClick={() => {
        if (!isDisabled) {
          handleClick();
        }
      }}
      className={`${
        activeTime
          ? "text-white bg-primary-600 border-primary-600"
          : isDisabled
          ? "text-disabled border-disabled"
          : "text-primary-600 border-primary-300 hover:opacity-70"
      } py-2 px-4 border-2 rounded-3xl cursor-default`}
    >
      <p className="font-medium uppercase">{time}</p>
    </div>
  );
};

export default TimeButton;
