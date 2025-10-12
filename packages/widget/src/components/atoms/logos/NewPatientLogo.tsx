import { FC, useEffect, useState } from "react";

interface VirtualCallLogoProps {
  disabled?: boolean;
}

export const NewPatientLogo: FC<VirtualCallLogoProps> = ({ disabled }) => {
  const [dimensions, setDimensions] = useState({ width: 74, height: 74 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 58, height: 58 });
      } else {
        setDimensions({ width: 74, height: 74 });
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
      viewBox="0 0 58 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M31.875 37.3684H39M35.4375 33.7368V41M20 39.7895V37.3684C20 36.0842 20.5004 34.8526 21.3912 33.9445C22.282 33.0365 23.4902 32.5263 24.75 32.5263H29.5M22.375 22.8421C22.375 24.1263 22.8754 25.3579 23.7662 26.266C24.657 27.1741 25.8652 27.6842 27.125 27.6842C28.3848 27.6842 29.593 27.1741 30.4838 26.266C31.3746 25.3579 31.875 24.1263 31.875 22.8421C31.875 21.5579 31.3746 20.3263 30.4838 19.4182C29.593 18.5101 28.3848 18 27.125 18C25.8652 18 24.657 18.5101 23.7662 19.4182C22.8754 20.3263 22.375 21.5579 22.375 22.8421Z"
        stroke={disabled ? "#EFEFEF" : "#EAC607"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default NewPatientLogo;
