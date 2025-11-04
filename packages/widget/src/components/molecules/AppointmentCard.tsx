import React from "react";
import FirstAppointmentLogo from "../atoms/logos/FirstAppointmentLogo.tsx";
import RevisionLogo from "../atoms/logos/RevisionLogo.tsx";
import { AppointmentInfo } from "../../pages/MainPage.tsx";
import VirtualCallLogo from "../atoms/logos/VirtualCallLogo.tsx";
import PhysicalAppointmentLogo from "../atoms/logos/PhysicalAppointmentLogo.tsx";
import ExistingPatientLogo from "../atoms/logos/ExistingPatientLogo.tsx";
import NewPatientLogo from "../atoms/logos/NewPatientLogo.tsx";

interface AppointmentCardProps {
  id: number;
  name: string;
  description: string;
  logoType: string;
  info?: AppointmentInfo;
  isActive: boolean;
  isDisabled: boolean;
  onAppointmentTypeClick: (
    id: number | null,
    name: string,
    info: AppointmentInfo | null,
  ) => void;
}

const AppointmentCardOption: React.FC<AppointmentCardProps> = ({
  id,
  name,
  description,
  logoType,
  info,
  isActive,
  isDisabled,
  onAppointmentTypeClick,
}) => {
  const onCardClick = () => {
    onAppointmentTypeClick(isActive ? null : id, logoType, info ?? null);
  };

  const renderLogo = () => {
    switch (logoType) {
      case "first-consultation":
        return <FirstAppointmentLogo disabled={!isActive && isDisabled} />;
      case "revision":
        return (
          <RevisionLogo
            width={75}
            height={75}
            disabled={!isActive && isDisabled}
          />
        );
      case "virtual":
        return <VirtualCallLogo disabled={!isActive && isDisabled} />;
      case "revision-physical":
        return <PhysicalAppointmentLogo disabled={!isActive && isDisabled} />;
      case "existing-patient":
        return <ExistingPatientLogo disabled={!isActive && isDisabled} />;
      case "new-patient":
        return <NewPatientLogo disabled={!isActive && isDisabled} />;
      default:
        return <div>{logoType}</div>;
    }
  };

  // Estilos inline como fallback para WordPress
  const cardStyle: React.CSSProperties = {
    width: '320px', // w-[20rem]
    height: '96px', // h-24
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    border: '1px solid',
    borderRadius: '16px',
    padding: '8px 16px',
    boxSizing: 'border-box',
    backgroundColor: isActive ? '#FDF9E6' : '#FFFFFF',
    borderColor: isActive ? '#EAC607' : '#DDDDDD',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: !isDisabled ? 'pointer' : 'default',
    transition: 'opacity 0.2s',
    marginBottom: '16px',
  };

  const iconContainerStyle: React.CSSProperties = {
    minWidth: '30%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  };

  const textContainerStyle: React.CSSProperties = {
    color: (!isActive && isDisabled) ? '#EFEFEF' : '#242424',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    maxWidth: '60%',
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 500,
    fontSize: '14px',
    margin: '0 0 4px 0',
    lineHeight: '1.2',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '12px',
    margin: '0',
    lineHeight: '1.3',
    opacity: 0.8,
  };

  return (
    <div
      className={`${
        isActive
          ? "bg-accent-100 border-accent-300"
          : !isDisabled
          ? "hover:opacity-70"
          : "bg-white border-primary-300"
      } 2xl:w-[24rem] md:w-[22rem] w-[20rem] 2xl:h-36 md:h-28 h-24 flex items-center justify-start border rounded-2xl drop-shadow py-2`}
      style={cardStyle}
      onClick={() => {
        if (!isDisabled) {
          onCardClick();
        }
      }}
    >
      <div 
        className="2xl:min-w-[25%] min-w-[30%] flex justify-center items-center"
        style={iconContainerStyle}
      >
        {renderLogo()}
      </div>
      <div
        className={`${
          !isActive && isDisabled ? "text-disabled" : "text-primary-600"
        } flex flex-col text-start cursor-default 2xl:max-w-[70%] max-w-[60%]`}
        style={textContainerStyle}
      >
        <h3 className="font-medium" style={titleStyle}>{name}</h3>
        <p style={descriptionStyle}>{description}</p>
      </div>
    </div>
  );
};

export default AppointmentCardOption;
