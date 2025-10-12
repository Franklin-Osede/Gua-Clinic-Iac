import React from "react";

interface ButtonProps {
  text: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const RoundedButton: React.FC<ButtonProps> = ({
  text,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`px-4 py-2 2xl:text-sm text-[0.6rem] bg-white text-primary-400 border-2 border-primary-300 font-medium rounded-full hover:opacity-70 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default RoundedButton;
