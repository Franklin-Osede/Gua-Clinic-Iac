import { FC, useEffect, useState } from "react";

interface VirtualCallLogoProps {
  disabled?: boolean;
}

export const VirtualCallLogo: FC<VirtualCallLogoProps> = ({ disabled }) => {
  const [dimensions, setDimensions] = useState({ width: 80, height: 80 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setDimensions({ width: 55, height: 55 });
      } else {
        setDimensions({ width: 80, height: 82 });
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
      fill={disabled ? "none" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.8333 19.6665H25.5L27.8333 25.4998L24.9167 27.2498C26.1661 29.7833 28.2165 31.8337 30.75 33.0832L32.5 30.1665L38.3333 32.4998V37.1665C38.3333 37.7853 38.0875 38.3788 37.6499 38.8164C37.2123 39.254 36.6188 39.4998 36 39.4998C31.4491 39.2233 27.1568 37.2908 23.933 34.0669C20.7091 30.843 18.7766 26.5507 18.5 21.9998C18.5 21.381 18.7458 20.7875 19.1834 20.3499C19.621 19.9123 20.2145 19.6665 20.8333 19.6665Z"
        stroke={disabled ? "#EFEFEF" : "#EAC607"}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default VirtualCallLogo;
