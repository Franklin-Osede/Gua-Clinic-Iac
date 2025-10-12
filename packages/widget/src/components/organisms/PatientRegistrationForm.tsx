import React, { useEffect, useState } from "react";
import { FormFields } from "../../pages/MainPage.tsx";
import { PuffLoader } from "react-spinners";

interface PersonalInformationFormProps {
  serviceChoice: string;
  handleFormChange: (isFilled: boolean, data: FormFields) => void;
  showError: boolean;
  showCreationError: boolean;
  loading: boolean;
}

const PatientRegistrationForm: React.FC<PersonalInformationFormProps> = ({
  serviceChoice,
  handleFormChange,
  showError,
  showCreationError,
  loading,
}) => {
  const [name, setName] = useState<string>("");
  const [vat, setVat] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [nameError, setNameError] = useState<string>("");
  const [vatError, setVatError] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [phoneNumberError, setPhoneNumberError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [textWarning, setTextWarning] = useState<string>(
    "(*) Campos obligatorios.",
  );

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const years = Array.from({ length: 100 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );
  const [isFormFilled, setIsFormFilled] = useState<boolean>(false);

  useEffect(() => {
    const isFilled = !!(
      name.trim() &&
      vat.trim() &&
      day &&
      month &&
      year &&
      phoneNumber.trim() &&
      email.trim()
    );
    setIsFormFilled(isFilled);
    setTextWarning(
      isFilled
        ? "(*) Verifica que toda tu información sea correcta antes de continuar, ya que no podrás retroceder."
        : textWarning,
    );
    if (showError) {
      const nameRegex = /^\w+\s+\w+/;
      setNameError(
        name.trim() && nameRegex.test(name)
          ? ""
          : "Este campo debe tener nombre y apellido",
      );

      const vatRegex = /^\d{8}[A-Z]$/;
      if (!vat.trim()) {
        setVatError("Este campo es obligatorio");
      } else if (!vatRegex.test(vat)) {
        setPhoneNumberError("Introduce un DNI válido");
      } else {
        setPhoneNumberError("");
      }

      setDateError(day && month && year ? "" : "Este campo es obligatorio");

      const phoneRegex = /^\d{9}$/;
      if (!phoneNumber.trim()) {
        setPhoneNumberError("Este campo es obligatorio");
      } else if (!phoneRegex.test(phoneNumber)) {
        setPhoneNumberError("Añade un número de teléfono válido");
      } else {
        setPhoneNumberError("");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        setEmailError("Este campo es obligatorio");
      } else if (!emailRegex.test(email)) {
        setEmailError("Añade un correo electrónico válido");
      } else {
        setEmailError("");
      }
    }
  }, [name, day, month, year, phoneNumber, email, showError, textWarning, vat]);

  useEffect(() => {
    const data = {
      name: name,
      birthdate: `${year}-${month}-${day}T00:00:00`,
      phone: phoneNumber,
      email: email,
      vat: vat,
    };
    handleFormChange(isFormFilled, data);
  }, [
    isFormFilled,
    handleFormChange,
    name,
    day,
    month,
    year,
    phoneNumber,
    email,
    vat,
  ]);

  return (
    <div className="flex items-center justify-center w-full flex-col">
      <div className="w-full flex 2xl:items-center md:items-center items-start justify-center flex-col pl-3 mt-8">
        <h3 className="text-primary-400 text-center 2xl:text-lg">
          {serviceChoice}
        </h3>
        <h1>Completa información personal</h1>
      </div>
      {showCreationError ? (
        <div className="flex justify-center w-full flex-col item-center max-w-[25rem] min-h-[25rem]">
          <p className="text-error text-sm text-center">
            ERROR AL CREAR PACIENTE, REFRESCA LA PÁGINA E INTÉNTELO DE NUEVO
          </p>
        </div>
      ) : (
        <div className="2xl:m-6 md:m-6 m-3.5 2xl:mt-10 bg-white 2xl:w-[24vw] md:w-[28vw] w-[85vw]">
          {loading && (
            <div className="min-h-[25rem] flex items-center justify-center">
              <PuffLoader size={30} color={"#9CA3AF"} loading={loading} />
            </div>
          )}
          {!loading && (
            <form
              className={
                !showError
                  ? "2xl:space-y-7 md:space-y-5 space-y-5"
                  : "2xl:space-y-6 md:space-y-3 space-y-4"
              }
            >
              <div>
                <label
                  htmlFor="name"
                  className="block 2xl:text-base text-sm font-medium text-primary-700 mb-2"
                >
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  placeholder="Escribe nombre y apellidos completo"
                  onChange={(e) => setName(e.target.value)}
                  className={`2xl:text-sm md:text-sm text-xs mt-1 block w-full p-3 md:p-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                    nameError ? "border-error" : "border-primary-200"
                  }`}
                  required
                />
                {nameError && (
                  <p className="text-error text-sm mt-1">{nameError}</p>
                )}
              </div>

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
                  className={`2xl:text-sm md:text-sm text-xs mt-1 block w-full p-3 md:p-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                    vatError ? "border-error" : "border-primary-200"
                  }`}
                  required
                />
                {vatError && (
                  <p className="text-error text-sm mt-1">{vatError}</p>
                )}
              </div>

              <div>
                <label className="block 2xl:text-base text-sm font-medium text-primary-700">
                  Fecha de nacimiento *
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="relative w-1/4">
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className={`2xl:text-sm md:text-sm text-xs w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                        day === "" ? "text-primary-500" : "text-primary-600"
                      } appearance-none bg-white pr-8 ${
                        dateError ? "border-error" : "border-primary-200"
                      }`}
                      required
                    >
                      <option value="" disabled hidden>
                        Día
                      </option>
                      {days.map((d) => (
                        <option key={d} value={d} className="text-primary-600">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-1/2">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className={`2xl:text-sm md:text-sm text-xs w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                        month === "" ? "text-primary-500" : "text-primary-600"
                      } appearance-none bg-white pr-8 ${
                        dateError ? "border-error" : "border-primary-200"
                      }`}
                      required
                    >
                      <option value="" disabled hidden>
                        Mes
                      </option>
                      {months.map((m, index) => (
                        <option
                          key={m}
                          value={index + 1}
                          className="text-primary-600"
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-1/3">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={`2xl:text-sm md:text-sm text-xs w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                        year === "" ? "text-primary-500" : "text-primary-600"
                      } appearance-none bg-white pr-8 ${
                        dateError ? "border-error" : "border-primary-200"
                      }`}
                      required
                    >
                      <option value="" disabled hidden>
                        Año
                      </option>
                      {years.map((y) => (
                        <option key={y} value={y} className="text-primary-600">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {dateError && (
                  <p className="text-error text-sm mt-1">{dateError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block 2xl:text-base text-sm font-medium text-primary-700 mb-2"
                >
                  Número de teléfono *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  placeholder="Escribe número de teléfono"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`2xl:text-sm md:text-sm text-xs mt-1 block w-full p-3 md:p-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                    phoneNumberError ? "border-error" : "border-primary-200"
                  }`}
                  required
                />
                {phoneNumberError && (
                  <p className="text-error text-sm mt-1">{phoneNumberError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block 2xl:text-base text-sm font-medium text-primary-700 mb-2"
                >
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Escribe un correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`2xl:text-sm md:text-sm text-xs mt-1 block w-full p-3 md:p-2 border rounded-md focus:outline-none focus:ring-accent-300 focus:border-accent-300 ${
                    emailError ? "border-error" : "border-primary-200"
                  }`}
                  required
                />
                {emailError && (
                  <p className="text-error text-sm mt-1">{emailError}</p>
                )}
              </div>
            </form>
          )}
          {!showError && !loading && (
            <div className="w-full mt-7">
              <p className="text-primary-400 text-sm text-left">
                {textWarning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientRegistrationForm;
