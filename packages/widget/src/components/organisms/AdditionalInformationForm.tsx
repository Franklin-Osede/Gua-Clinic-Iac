import React, { useEffect, useState } from "react";
import PrivacyModal from "../molecules/PrivacyModal";
import CommunicationConsentModal from "../molecules/CommunicationConsentModal";
import { PuffLoader } from "react-spinners";

interface AdditionalInformationFormProps {
  serviceChoice: string;
  onCheckboxClicked: (id: number | null) => void;
  handleObservationsChange: (info: string) => void;
  showError: boolean;
  showCreationError: boolean;
  loading: boolean;
}

const AdditionalInformationForm: React.FC<AdditionalInformationFormProps> = ({
  onCheckboxClicked,
  serviceChoice,
  handleObservationsChange,
  showError,
  showCreationError,
  loading,
}) => {
  const [description, setDescription] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [communicationConsent, setCommunicationConsent] =
    useState<boolean>(false);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isCommunicationOpen, setIsCommunicationOpen] =
    useState<boolean>(false);

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
  };

  const handleCommunicationsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCommunicationConsent(e.target.checked);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
    onCheckboxClicked(e.target.checked ? 0 : null);
  };

  const openPrivacyModal = () => setIsPrivacyOpen(true);
  const closePrivacyModal = () => setIsPrivacyOpen(false);

  const openCommunicationModal = () => setIsCommunicationOpen(true);
  const closeCommunicationModal = () => setIsCommunicationOpen(false);

  useEffect(() => {
    handleObservationsChange(description);
  }, [description, handleObservationsChange]);

  return (
    <div className="flex items-center justify-center w-full flex-col">
      <div className="w-full flex 2xl:items-center md:items-center items-start justify-center flex-col mt-8">
        <h3 className="text-primary-400">{serviceChoice}</h3>
        <h1>Completa tu cita</h1>
      </div>
      {showCreationError && !loading && (
        <div className="flex justify-center w-full flex-col item-center max-w-[25rem] min-h-[25rem]">
          <p className="text-error text-sm text-center">
            ERROR AL CREAR LA CITA, REFRESCA LA PÁGINA E INTÉNTELO DE NUEVO
          </p>
        </div>
      )}
      {loading && !showCreationError && (
        <div className="min-h-[25rem] flex items-center justify-center">
          <PuffLoader size={30} color={"#9CA3AF"} loading={loading} />
        </div>
      )}
      {!showCreationError && !loading && (
        <div className="2xl:mt-10 mt-2 2xl:w-[24vw] md:w-[26vw] w-[85vw]">
          <div className="2xl:mb-12 mb-6 w-full">
            <label
              htmlFor="description"
              className="block 2xl:text-md md:text-md text-base font-medium text-primary-600 my-4"
            >
              (OPCIONAL) Escribe el motivo de la cita
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              className="2xl:text-base md:text-base text-xs mt-1 block w-full 2xl:h-60 md:h-60 h-40 p-4 border border-primary-200 rounded-md resize-none focus:outline-none focus:ring-accent-300 focus:border-accent-300"
              rows={4}
              placeholder="Añade una breve descripción"
            />
          </div>

          <div className="flex items-start">
            <div className="relative">
              <input
                type="checkbox"
                id="newsletter"
                checked={communicationConsent}
                onChange={handleCommunicationsChange}
                className="absolute opacity-0 h-5 w-5 mt-1.5"
              />
              <div
                className={`mt-1.5 h-5 w-5 border rounded flex items-center justify-center transition-colors ${
                  communicationConsent
                    ? "bg-accent-300 border-accent-300"
                    : "bg-white border-primary-200"
                }`}
              >
                {communicationConsent && (
                  <span className="text-white text-sm pb-0.5 text-center font-medium">
                    x
                  </span>
                )}
              </div>
            </div>

            <div className="pl-4 block text-base cursor-default">
              <p className="text-base text-primary-600">
                Aceptar{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-500 cursor-pointer"
                  onClick={openCommunicationModal}
                >
                  Consentimiento de Comunicación
                </a>
              </p>
              <p className="text-sm text-primary-400">
                Para notificaciones SMS o por correo
              </p>
            </div>
          </div>

          <div className="flex items-start mt-6">
            <div className="relative">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={handleTermsChange}
                className="absolute opacity-0 h-5 w-5 mt-1.5"
                required
              />
              <div
                className={`mt-1.5 h-5 w-5 border rounded flex items-center justify-center transition-colors ${
                  termsAccepted
                    ? "bg-accent-300 border-accent-300"
                    : "bg-white border-primary-200"
                }`}
              >
                {termsAccepted && (
                  <span className="text-white pb-0.5 text-sm text-center font-medium">
                    x
                  </span>
                )}
              </div>
            </div>
            <div className="pl-4 block text-base cursor-default">
              <p className="text-base text-primary-600">
                Aceptar{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-500 cursor-pointer"
                  onClick={openPrivacyModal}
                >
                  Términos y Condiciones
                </a>
              </p>
              <p className="text-sm text-primary-400 mb-8">
                Incluye Política de Privacidad y Protección de datos.
              </p>
            </div>
          </div>

          {showError && !loading && (
            <p className="text-error text-sm mt-2">
              ⓘ Por favor, acepta los Términos y Condiciones y el Conscientious
              de Comunicación para continuar para continuar
            </p>
          )}
        </div>
      )}

      <PrivacyModal isOpen={isPrivacyOpen} onClose={closePrivacyModal} />
      <CommunicationConsentModal
        isOpen={isCommunicationOpen}
        onClose={closeCommunicationModal}
      />
    </div>
  );
};

export default AdditionalInformationForm;
