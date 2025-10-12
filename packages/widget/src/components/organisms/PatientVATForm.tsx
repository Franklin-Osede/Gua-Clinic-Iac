import React, { useEffect, useState } from "react";
import { getPatientByEncryptedWAT } from "../../services/GuaAPIService.ts";
import { PuffLoader } from "react-spinners";

interface PatientVATProps {
  serviceChoice: string;
  handleInputChange: (isValid: boolean, id: number | null) => void;
  showError: boolean;
}

const PatientVATForm: React.FC<PatientVATProps> = ({
  serviceChoice,
  showError,
  handleInputChange,
}) => {
  const [vat, setVat] = useState<string>("");
  const [vatError, setVatError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);

  const validateVAT = (value: string): string => {
    const vatRegex = /^\d{8}[A-Z]$/;
    if (!value.trim()) return "Este campo es obligatorio";
    if (!vatRegex.test(value)) return "Introduce un DNI válido";
    return "";
  };

  useEffect(() => {
    const validateAndFetchPatient = async () => {
      const error = showError ? validateVAT(vat) : "";
      setVatError((prevError) => {
        if (prevError !== error) {
          return error;
        }
        return prevError;
      });

      if (!error) {
        const isValid = vat.trim().length > 0 && /^\d{8}[A-Z]$/.test(vat);
        handleInputChange(isValid, null);
        setIsValid(isValid);

        if (isValid) {
          try {
            setLoading(true);

            const patient = await getPatientByEncryptedWAT(vat);

            setPatientName(patient.PAC_NOMBRE + " " + patient.PAC_APELLIDOS);
            handleInputChange(isValid, patient.PAC_ID);
          } catch (error) {
            console.error("Error fetching patient:", error);
            setVatError(
              "El DNI ingresado no corresponde a ningún paciente en nuestra base de datos. Confirme los datos y pruebe de nuevo.",
            );
          } finally {
            setLoading(false);
          }
        }
      }
    };

    validateAndFetchPatient().then();
  }, [vat, showError, handleInputChange]);

  return (
    <div>
      <div className="flex min-w-screen justify-center items-center flex-col">
        <div className="w-full flex 2xl:items-center md:items-center items-start justify-center flex-col pl-3 mt-8">
          <h3 className="text-primary-400 text-center 2xl:text-lg">
            {serviceChoice}
          </h3>
          <h1>Identifícate con tu DNI</h1>
        </div>
      </div>
      <div className="2xl:m-6 md:m-6 m-3.5 2xl:mt-12 md:mt-12 bg-white 2xl:w-[24vw] md:w-[28vw] w-[85vw]">
        <div>
          <label
            htmlFor="vat"
            className="block 2xl:text-base text-sm font-medium text-primary-700 mb-2"
          >
            DNI, con letra incluía *
          </label>
          <input
            type="text"
            id="vat"
            value={vat}
            placeholder="00000000X"
            onChange={(e) =>
              setVat(e.target.value.toUpperCase().replace(/\s/g, ""))
            }
            className={`2xl:text-sm md:text-sm text-xs mt-1 block w-full p-3 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
              vatError ? "border-error" : "border-primary-200"
            }`}
            required
          />
          {vatError && <p className="text-error text-sm mt-5">{vatError}</p>}
          {!showError && !loading && !vatError && patientName.length === 0 && (
            <div className="w-full mt-9">
              <p className="text-primary-400 text-sm text-left">
                (*) Campos obligatorios
              </p>
            </div>
          )}
          {loading && (
            <div className="flex justify-center items-center mt-14">
              <PuffLoader size={30} color={"#9CA3AF"} loading={loading} />
            </div>
          )}
          {!loading && isValid && !vatError && (
            <div>
              <label
                htmlFor="patient"
                className="block 2xl:text-base text-sm font-medium text-primary-700 mt-8"
              >
                Paciente Encontrado:
              </label>
              <div className="2xl:text-base md:text-sm text-xs block w-full p-3 pl-0 border-b border-b-accent-300 min-h-max">
                {patientName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientVATForm;
