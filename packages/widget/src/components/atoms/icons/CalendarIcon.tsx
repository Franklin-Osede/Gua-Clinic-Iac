import { FC, useEffect, useState } from "react";

export const CalendarIcon: FC = () => {
  const [dimensions, setDimensions] = useState({ width: 35, height: 35 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 22, height: 22 });
      } else {
        setDimensions({ width: 35, height: 34 });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5 3V7M8.5 3V7M4.5 11H20.5M7.5 14H7.513M10.5098 14H10.5148M13.5098 14H13.5148M16.5151 14H16.5201M13.5151 17H13.5201M7.50977 17H7.51477M10.5098 17H10.5148M4.5 7C4.5 6.46957 4.71071 5.96086 5.08579 5.58579C5.46086 5.21071 5.96957 5 6.5 5H18.5C19.0304 5 19.5391 5.21071 19.9142 5.58579C20.2893 5.96086 20.5 6.46957 20.5 7V19C20.5 19.5304 20.2893 20.0391 19.9142 20.4142C19.5391 20.7893 19.0304 21 18.5 21H6.5C5.96957 21 5.46086 20.7893 5.08579 20.4142C4.71071 20.0391 4.5 19.5304 4.5 19V7Z"
        stroke="#EAC607"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CalendarIcon;
