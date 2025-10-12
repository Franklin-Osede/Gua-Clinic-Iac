import { FC, useEffect, useState } from "react";

export const LocationIcon: FC = () => {
  const [dimensions, setDimensions] = useState({ width: 35, height: 35 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 22, height: 22 });
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
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.5 11C9.5 11.7956 9.81607 12.5587 10.3787 13.1213C10.9413 13.6839 11.7044 14 12.5 14C13.2956 14 14.0587 13.6839 14.6213 13.1213C15.1839 12.5587 15.5 11.7956 15.5 11C15.5 10.2044 15.1839 9.44129 14.6213 8.87868C14.0587 8.31607 13.2956 8 12.5 8C11.7044 8 10.9413 8.31607 10.3787 8.87868C9.81607 9.44129 9.5 10.2044 9.5 11Z"
        stroke="#EAC607"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.157 16.657L13.914 20.9C13.539 21.2746 13.0306 21.485 12.5005 21.485C11.9704 21.485 11.462 21.2746 11.087 20.9L6.843 16.657C5.72422 15.5381 4.96234 14.1127 4.65369 12.5608C4.34504 11.009 4.50349 9.40047 5.10901 7.93868C5.71452 6.4769 6.7399 5.22749 8.05548 4.34846C9.37107 3.46943 10.9178 3.00024 12.5 3.00024C14.0822 3.00024 15.6289 3.46943 16.9445 4.34846C18.2601 5.22749 19.2855 6.4769 19.891 7.93868C20.4965 9.40047 20.655 11.009 20.3463 12.5608C20.0377 14.1127 19.2758 15.5381 18.157 16.657Z"
        stroke="#EAC607"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LocationIcon;
