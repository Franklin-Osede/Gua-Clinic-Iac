import { FC, useEffect, useState } from "react";

export const StethoscopeIcon: FC = () => {
  const [dimensions, setDimensions] = useState({ width: 35, height: 36 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 22, height: 22 });
      } else {
        setDimensions({ width: 35, height: 36 });
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
        d="M6.5 4H5.5C4.96957 4 4.46086 4.21071 4.08579 4.58579C3.71071 4.96086 3.5 5.46957 3.5 6V9.5C3.5 10.9587 4.07946 12.3576 5.11091 13.3891C6.14236 14.4205 7.54131 15 9 15C10.4587 15 11.8576 14.4205 12.8891 13.3891C13.9205 12.3576 14.5 10.9587 14.5 9.5V6C14.5 5.46957 14.2893 4.96086 13.9142 4.58579C13.5391 4.21071 13.0304 4 12.5 4H11.5M8.5 15C8.5 15.7879 8.65519 16.5681 8.95672 17.2961C9.25825 18.0241 9.70021 18.6855 10.2574 19.2426C10.8145 19.7998 11.4759 20.2417 12.2039 20.5433C12.9319 20.8448 13.7121 21 14.5 21C15.2879 21 16.0681 20.8448 16.7961 20.5433C17.5241 20.2417 18.1855 19.7998 18.7426 19.2426C19.2998 18.6855 19.7417 18.0241 20.0433 17.2961C20.3448 16.5681 20.5 15.7879 20.5 15V12M20.5 12C19.9696 12 19.4609 11.7893 19.0858 11.4142C18.7107 11.0391 18.5 10.5304 18.5 10C18.5 9.46957 18.7107 8.96086 19.0858 8.58579C19.4609 8.21071 19.9696 8 20.5 8C21.0304 8 21.5391 8.21071 21.9142 8.58579C22.2893 8.96086 22.5 9.46957 22.5 10C22.5 10.5304 22.2893 11.0391 21.9142 11.4142C21.5391 11.7893 21.0304 12 20.5 12ZM11.5 3V5M6.5 3V5"
        stroke="#EAC607"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StethoscopeIcon;
