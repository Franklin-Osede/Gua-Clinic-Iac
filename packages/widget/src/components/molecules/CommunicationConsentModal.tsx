import React from "react";

interface CommunicationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommunicationConsentModal: React.FC<CommunicationConsentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-11/12 max-w-2xl rounded shadow-lg overflow-hidden">
        <div className="bg-accent-300 p-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-black">
            Consentimiento de Comunicación
          </span>
          <button
            className="text-black text-2xl font-bold focus:outline-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold">Consentimiento explícito</h3>
          <br />
          <p>
            Las Palmas de Gran Canaria, Las Palmas, en fecha 29/01/2025. <br />
            <br />
            GABINETE DE UROLOGIA Y ANDROLOGIA SL es el Responsable del
            tratamiento de los datos personales del Interesado y le informa que
            estos datos serán tratados de conformidad con lo dispuesto en el
            Reglamento (UE) 2016/679 de 27 de abril de 2016 (GDPR), por lo que
            se le facilita la siguiente información del tratamiento:
          </p>

          <br />
          <p className="mb-4">
            <strong className="font-semibold">Fines del tratamiento:</strong>{" "}
            prestación de servicios profesionales de salud y mantenimiento del
            historial clínico con el consentimiento del interesado.
          </p>
          <p className="mb-4">
            <strong className="font-semibold">
              Criterios de conservación de los datos:
            </strong>{" "}
            se conservarán mientras exista un interés mutuo para mantener el fin
            del tratamiento y, cuando ya no sea necesario para tal fin, se
            suprimirán con medidas de seguridad adecuadas para garantizar la
            seudonimización de los datos o la destrucción total de los mismos.
          </p>
          <p className="mb-4">
            <strong className="font-semibold">
              Comunicación de los datos:
            </strong>{" "}
            no se comunicarán los datos a terceros, salvo obligación legal.
          </p>
          <p className="mb-4">
            <strong className="font-semibold">
              Derechos que asisten al Interesado:
            </strong>
          </p>
          <ul className="list-disc list-inside mb-4">
            <li className="mb-2">
              Derecho a retirar el consentimiento en cualquier momento.
            </li>
            <li className="mb-2">
              Derecho de acceso, rectificación, portabilidad y supresión de sus
              datos y a la limitación u oposición a su tratamiento.
            </li>
            <li className="mb-2">
              Derecho a presentar una reclamación ante la Autoridad de control (
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                www.aepd.es
              </a>
              ) si considera que el tratamiento no se ajusta a la normativa
              vigente.
            </li>
          </ul>
          <p className="mb-4">
            <strong className="font-semibold">
              Datos de contacto para ejercer sus derechos:
            </strong>{" "}
            <br />
            GABINETE DE UROLOGIA Y ANDROLOGIA SL. C/ Mesa y López, 54, bajo, -
            35010 Las Palmas de Gran Canaria, Las Palmas (Las Palmas). <br />
            Email:{" "}
            <a
              href="mailto:Gabinete@urologiayandrologia.com"
              className="text-primary-600 underline"
            >
              Gabinete@urologiayandrologia.com
            </a>
          </p>
          <p className="mt-2">
            Para realizar el tratamiento de datos descrito, el Responsable del
            tratamiento necesita su consentimiento explícito o el de su
            representante legal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunicationConsentModal;
