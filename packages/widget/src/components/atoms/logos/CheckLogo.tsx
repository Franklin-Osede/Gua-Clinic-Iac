import { FC, useEffect, useState } from "react";

export const CheckLogo: FC = () => {
  const [dimensions, setDimensions] = useState({ width: 73, height: 72 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 65, height: 65 });
      } else {
        setDimensions({ width: 73, height: 72 });
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
      viewBox="0 0 73 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M27.5 36L33.5 42L45.5 30M9.5 36C9.5 39.5457 10.1984 43.0567 11.5553 46.3325C12.9121 49.6082 14.9009 52.5847 17.4081 55.0919C19.9153 57.5991 22.8918 59.5879 26.1675 60.9447C29.4433 62.3016 32.9543 63 36.5 63C40.0457 63 43.5567 62.3016 46.8325 60.9447C50.1082 59.5879 53.0847 57.5991 55.5919 55.0919C58.0991 52.5847 60.0879 49.6082 61.4447 46.3325C62.8016 43.0567 63.5 39.5457 63.5 36C63.5 32.4543 62.8016 28.9433 61.4447 25.6675C60.0879 22.3918 58.0991 19.4153 55.5919 16.9081C53.0847 14.4009 50.1082 12.4121 46.8325 11.0553C43.5567 9.69838 40.0457 9 36.5 9C32.9543 9 29.4433 9.69838 26.1675 11.0553C22.8918 12.4121 19.9153 14.4009 17.4081 16.9081C14.9009 19.4153 12.9121 22.3918 11.5553 25.6675C10.1984 28.9433 9.5 32.4543 9.5 36Z"
        stroke="#EAC607"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckLogo;
