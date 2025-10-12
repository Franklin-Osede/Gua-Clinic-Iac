import { FC, useEffect, useState } from "react";

interface PhysicalAppointmentLogoProps {
  disabled?: boolean;
}

export const PhysicalAppointmentLogo: FC<PhysicalAppointmentLogoProps> = ({
  disabled,
}) => {
  const [dimensions, setDimensions] = useState({ width: 35, height: 35 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 24, height: 24 });
      } else {
        setDimensions({ width: 35, height: 35 });
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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 23H23M3.44444 23V3.44444C3.44444 2.79614 3.70198 2.17438 4.16041 1.71596C4.61883 1.25754 5.24058 1 5.88889 1H18.1111C18.7594 1 19.3812 1.25754 19.8396 1.71596C20.298 2.17438 20.5556 2.79614 20.5556 3.44444V23M8.33333 23V18.1111C8.33333 17.4628 8.59087 16.8411 9.04929 16.3826C9.50772 15.9242 10.1295 15.6667 10.7778 15.6667H13.2222C13.8705 15.6667 14.4923 15.9242 14.9507 16.3826C15.4091 16.8411 15.6667 17.4628 15.6667 18.1111V23M9.55556 8.33333H14.4444M12 5.88889V10.7778"
        stroke={disabled ? "#EFEFEF" : "#EAC607"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PhysicalAppointmentLogo;
