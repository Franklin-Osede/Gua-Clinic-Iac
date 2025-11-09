import React, { useCallback, useEffect, useState } from "react";
import Services from "../components/organisms/Services.tsx";
import MedicalAppointmentTypes from "../components/organisms/MedicalAppointmentTypes.tsx";
import Professionals from "../components/organisms/Professionals.tsx";
import CalendarDatePicker from "../components/organisms/CalendarDatePicker.tsx";
import AppointmentTypes from "../components/organisms/AppointmentTypes.tsx";
import PatientRegistrationForm from "../components/organisms/PatientRegistrationForm.tsx";
import AdditionalInformationForm from "../components/organisms/AdditionalInformationForm.tsx";
import AppointmentConfirmed from "../components/organisms/AppointmentConfirmed.tsx";
import { createAppointment, createPatient } from "../services/GuaAPIService.ts";
import { formatAppointmentData, formatPatientData } from "@gua/shared";
import IdentificationPatient from "../components/organisms/IdentificationPatient.tsx";
import PatientVATForm from "../components/organisms/PatientVATForm.tsx";

type PageState = {
  activeId: number | null;
  isClicked: boolean;
  name?: string;
  extra?: null | number | AppointmentInfo | string | FormFields;
};

export type AppointmentInfo = {
  id: number;
  duration: number;
  price: number;
};

export type FormFields = {
  name: string;
  birthdate: string;
  phone: string;
  email: string;
  vat: string;
};

type AppState = {
  currentPage: number;
  pages: PageState[];
};

type PageComponent = React.ReactElement;

type Page = {
  name: string;
  component: PageComponent;
};

const SPECIALTIES_PAGE_INDEX = 0;
const APPOINTMENTS_PAGE_INDEX = 1;
const DOCTOR_PAGE_INDEX = 2;
const VIRTUAL_PAGE_INDEX = 3;
const DATE_TIME_PAGE_INDEX = 4;
const NEW_OR_EXISTING_PAGE_INDEX = 5;
const VAT_FORM_INDEX = 6;
const PERSONAL_FORM_INDEX = 7;
const ADDITIONAL_INFO_FORM_INDEX = 8;
const LAST_PAGE_INDEX = 9;

const VIRTUAL_DOCTOR_ID = 5;

const MainPage: React.FC = () => {
  const [showNextButton, setShowNextButton] = useState(false);
  const [showPreviousButton, setShowPreviousButton] = useState(false);
  const [disableNextButton, setDisableNextButton] = useState(false);
  const [disablePreviousButton, setDisablePreviousButton] = useState(false);
  const [showNoOptionError, setShowNoOptionError] = useState(false);
  const [pageState, setPageState] = useState<AppState>({
    currentPage: 0,
    pages: [
      { activeId: null, isClicked: false, name: "", extra: null }, // Page 0: Services
      { activeId: null, isClicked: false, extra: null }, // Page 1: Revision or First Consultation Appointments
      { activeId: null, isClicked: false, name: "", extra: null }, // Page 2: Professionals
      { activeId: null, isClicked: false }, // Page 3: Virtual or Physical Appointments
      { activeId: null, isClicked: false, name: "", extra: "" }, // Page 4: Calendar Date Picker
      { activeId: null, isClicked: false, name: "" }, // Page 5: Existing or New Patient Page
      { activeId: null, isClicked: false, name: "" }, // Page 6: DNI Existing Patient Page
      { activeId: null, isClicked: false, extra: null }, // Page 7: Personal Information
      { activeId: null, isClicked: false, extra: "" }, // Page 8: Complete Appointment
      { activeId: null, isClicked: false }, // Page 9: Appointment Booked
    ],
  });
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [showPatientError, setShowPatientError] = useState(false);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false);
  const [showAppointmentError, setShowAppointmentError] = useState(false);

  const handleCardClick = (
    activeId: number | null,
    name?: string,
    extra?: number | null | AppointmentInfo | string,
  ) => {
    setShowNextButton(true);
    setShowPreviousButton(true);
    setShowNoOptionError(false);
    setPageState((prev) => {
      const updatedPage = {
        activeId: activeId,
        isClicked: name ? name.length > 0 && activeId !== null : true,
        ...(name && { name }),
        ...(extra && { extra }),
      };

      return {
        ...prev,
        pages: {
          ...prev.pages,
          [prev.currentPage]: updatedPage,
        },
      };
    });
  };

  const handleRegistrationFormChange = useCallback(
    (isFilled: boolean, extra: FormFields) => {
      if (isFilled) {
        setPageState((prev) => {
          const currentPage = prev.pages[PERSONAL_FORM_INDEX];
          const updatedPage = {
            activeId: 0,
            isClicked: isFilled,
            ...(extra && { extra }),
          };

          if (JSON.stringify(currentPage) === JSON.stringify(updatedPage)) {
            return prev;
          }

          return {
            ...prev,
            pages: {
              ...prev.pages,
              [PERSONAL_FORM_INDEX]: updatedPage,
            },
          };
        });
      }
    },
    [],
  );

  const handleAdditionalInformationChange = useCallback((extra: string) => {
    setPageState((prev) => {
      const currentPageData = prev.pages[ADDITIONAL_INFO_FORM_INDEX];
      const updatedPage = {
        activeId: currentPageData.activeId,
        isClicked: currentPageData.isClicked,
        ...(extra && { extra }),
      };

      if (JSON.stringify(currentPageData) === JSON.stringify(updatedPage)) {
        return prev;
      }

      return {
        ...prev,
        pages: {
          ...prev.pages,
          [ADDITIONAL_INFO_FORM_INDEX]: updatedPage,
        },
      };
    });
  }, []);

  const handleVATInputChange = useCallback(
    (isValid: boolean, id: number | null) => {
      setPageState((prev) => {
        const currentPage = prev.pages[VAT_FORM_INDEX];
        const updatedPage = {
          activeId: id,
          isClicked: isValid,
        };

        if (JSON.stringify(currentPage) === JSON.stringify(updatedPage)) {
          return prev;
        }

        return {
          ...prev,
          pages: {
            ...prev.pages,
            [VAT_FORM_INDEX]: updatedPage,
          },
        };
      });
    },
    [],
  );

  const handlePatientCreation = async () => {
    try {
      setIsLoadingPatient(true);

      const data = pageState.pages[PERSONAL_FORM_INDEX].extra as FormFields;
      const patientId = await createPatient(formatPatientData(data));

      setPageState((prev) => {
        const currentPageData = prev.pages[PERSONAL_FORM_INDEX];

        const updatedPage = {
          activeId: patientId["PAC_ID"],
          isClicked: currentPageData.isClicked,
          extra: currentPageData.extra,
        };

        return {
          ...prev,
          pages: {
            ...prev.pages,
            [PERSONAL_FORM_INDEX]: updatedPage,
          },
        };
      });

      setShowPatientError(false);
      return true;
    } catch (error) {
      console.error("Error creating patient:", error);
      setShowPatientError(true);
      setDisableNextButton(true);
      setDisablePreviousButton(true);
      return false;
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const handleAppointmentCreation = async () => {
    try {
      setIsLoadingAppointment(true);

      const doctorId =
        import.meta.env.VITE_IS_PROD === "true"
          ? Number(pageState.pages[DOCTOR_PAGE_INDEX].extra)
          : Number(import.meta.env.VITE_TESTING_DOCTOR_ID);

      const date = String(pageState.pages[DATE_TIME_PAGE_INDEX].extra);

      const patientId =
        pageState.pages[PERSONAL_FORM_INDEX].activeId !== null
          ? Number(pageState.pages[PERSONAL_FORM_INDEX].activeId)
          : Number(pageState.pages[VAT_FORM_INDEX].activeId);

      const observations = (() => {
        const extra = `[${pageState.pages[APPOINTMENTS_PAGE_INDEX]?.name}] ${
          pageState.pages[ADDITIONAL_INFO_FORM_INDEX]?.extra ?? ""
        }`;
        if (
          doctorId === VIRTUAL_DOCTOR_ID &&
          pageState.pages[VIRTUAL_PAGE_INDEX]?.name === "virtual"
        ) {
          return `${extra}\n cita virtual`;
        }
        return String(extra);
      })();

      const data = formatAppointmentData(
        doctorId,
        date,
        patientId,
        observations,
      );

      await createAppointment(data);

      setShowAppointmentError(false);
      return true;
    } catch (error) {
      console.error("Error creating appointment:", error);
      setShowAppointmentError(true);
      setDisableNextButton(true);
      setDisablePreviousButton(true);
      return false;
    } finally {
      setIsLoadingAppointment(false);
    }
  };

  const handleNext = async () => {
    if (
      pageState.currentPage === PERSONAL_FORM_INDEX &&
      pageState.pages[PERSONAL_FORM_INDEX].activeId === 0
    ) {
      const patientCreationSuccess = await handlePatientCreation();
      if (!patientCreationSuccess) {
        return;
      }
    }

    if (pageState.currentPage === ADDITIONAL_INFO_FORM_INDEX) {
      const appointmentCreationSuccess = await handleAppointmentCreation();
      if (!appointmentCreationSuccess) {
        return;
      }
    }

    setPageState((prev) => {
      let nextPage = prev.currentPage + 1;
      const pages = prev.pages;

      if (
        pages[DOCTOR_PAGE_INDEX]?.extra !== VIRTUAL_DOCTOR_ID &&
        nextPage === VIRTUAL_PAGE_INDEX
      ) {
        resetPageInfo(VIRTUAL_PAGE_INDEX);
        nextPage += 1;
      }

      if (nextPage === VAT_FORM_INDEX) {
        const activeId = pages[NEW_OR_EXISTING_PAGE_INDEX]?.activeId;

        if (activeId === 1) {
          resetPageInfo(VAT_FORM_INDEX);
          nextPage += 1;
        } else if (activeId === 0) {
          resetPageInfo(PERSONAL_FORM_INDEX);
        }
      }

      if (prev.currentPage === VAT_FORM_INDEX) {
        resetPageInfo(PERSONAL_FORM_INDEX);
        nextPage += 1;
      }

      if (nextPage >= Object.keys(pages).length) {
        return prev;
      }

      return {
        ...prev,
        currentPage: nextPage,
      };
    });
  };

  const handleReset = () => {
    setShowNoOptionError(false);
    setPageState((prev) => {
      let previousPage = prev.currentPage - 1;
      const pages = prev.pages;

      if (
        pages[DOCTOR_PAGE_INDEX]?.extra !== VIRTUAL_DOCTOR_ID &&
        previousPage === VIRTUAL_PAGE_INDEX
      ) {
        resetPageInfo(VIRTUAL_PAGE_INDEX);
        previousPage -= 1;
      }

      if (previousPage === VAT_FORM_INDEX) {
        const activeId = pages[NEW_OR_EXISTING_PAGE_INDEX]?.activeId;

        if (activeId === 1) {
          resetPageInfo(VAT_FORM_INDEX);
          previousPage -= 1;
        } else if (activeId === 0) {
          resetPageInfo(PERSONAL_FORM_INDEX);
        }
      }

      if (previousPage === PERSONAL_FORM_INDEX) {
        resetPageInfo(PERSONAL_FORM_INDEX);
        previousPage -= 1;
      }

      if (pages[prev.currentPage]?.isClicked) {
        return {
          ...prev,
          pages: {
            ...pages,
            [prev.currentPage]: {
              ...pages[prev.currentPage],
              isClicked: false,
            },
          },
        };
      }

      if (previousPage < 0) {
        return prev;
      }

      return {
        ...prev,
        currentPage: previousPage,
      };
    });
  };

  const getComponentForPage = (pageIndex: number) => {
    const page = pageState.pages[pageIndex];

    switch (pageIndex) {
      case 0:
        return (
          <Services
            activeCardId={page.activeId}
            initialCard={!page.isClicked}
            onCardClick={handleCardClick}
          />
        );
      case 1:
        return (
          <MedicalAppointmentTypes
            activeAppointmentId={page.activeId}
            appointmentClicked={page.isClicked}
            onCardClick={handleCardClick}
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            showError={showNoOptionError}
            serviceId={
              Number(pageState.pages[SPECIALTIES_PAGE_INDEX].extra) ?? 0
            }
          />
        );
      case 2:
        return (
          <Professionals
            activeProfessionalId={page.activeId}
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            onCardClick={handleCardClick}
            serviceId={
              Number(pageState.pages[SPECIALTIES_PAGE_INDEX].extra) ?? 0
            }
          />
        );
      case 3:
        return (
          <AppointmentTypes
            activeAppointmentId={page.activeId}
            appointmentClicked={page.isClicked}
            onCardClick={handleCardClick}
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            showError={showNoOptionError}
            serviceId={
              Number(pageState.pages[SPECIALTIES_PAGE_INDEX].extra) ?? 0
            }
          />
        );
      case 4:
        return (
          <CalendarDatePicker
            activeTimeId={page.activeId}
            isDisabled={page.isClicked}
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            onDateTimeChosen={handleCardClick}
            activeDate={String(page.extra) ?? ""}
            doctorId={Number(pageState.pages[DOCTOR_PAGE_INDEX].extra)}
          />
        );
      case 5:
        return (
          <IdentificationPatient
            activeId={page.activeId}
            isClicked={page.isClicked}
            onCardClick={handleCardClick}
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            showError={showNoOptionError}
          />
        );
      case 6:
        return (
          <PatientVATForm
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            handleInputChange={handleVATInputChange}
            showError={showNoOptionError}
          />
        );
      case 7:
        return (
          <PatientRegistrationForm
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            handleFormChange={handleRegistrationFormChange}
            showError={showNoOptionError}
            showCreationError={showPatientError}
            loading={isLoadingPatient}
          />
        );
      case 8:
        return (
          <AdditionalInformationForm
            serviceChoice={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
            onCheckboxClicked={handleCardClick}
            handleObservationsChange={handleAdditionalInformationChange}
            showError={showNoOptionError}
            showCreationError={showAppointmentError}
            loading={isLoadingAppointment}
          />
        );
      case 9:
        return (
          <AppointmentConfirmed
            date={pageState.pages[DATE_TIME_PAGE_INDEX].name ?? ""}
            doctor={pageState.pages[DOCTOR_PAGE_INDEX].name ?? ""}
            service={pageState.pages[SPECIALTIES_PAGE_INDEX].name ?? ""}
          />
        );
      default:
        return <></>;
    }
  };

  const allPages: Page[] = [
    {
      name: "Services",
      component: getComponentForPage(SPECIALTIES_PAGE_INDEX),
    },
    {
      name: "Medical Appointments",
      component: getComponentForPage(APPOINTMENTS_PAGE_INDEX),
    },
    {
      name: "Professionals",
      component: getComponentForPage(DOCTOR_PAGE_INDEX),
    },
    {
      name: "Appointment Types",
      component: getComponentForPage(VIRTUAL_PAGE_INDEX),
    },
    {
      name: "Calendar Date Picker",
      component: getComponentForPage(DATE_TIME_PAGE_INDEX),
    },
    {
      name: "New or Existing Patient Page",
      component: getComponentForPage(NEW_OR_EXISTING_PAGE_INDEX),
    },
    {
      name: "DNI Existing Patient Page",
      component: getComponentForPage(VAT_FORM_INDEX),
    },
    {
      name: "Personal Information",
      component: getComponentForPage(PERSONAL_FORM_INDEX),
    },
    {
      name: "Complete Appointment",
      component: getComponentForPage(ADDITIONAL_INFO_FORM_INDEX),
    },
    {
      name: "Appointment Booked",
      component: getComponentForPage(LAST_PAGE_INDEX),
    },
  ];

  useEffect(() => {
    const currentPage = pageState.pages[pageState.currentPage];
    const shouldDisableNextButton =
      currentPage.activeId === null ||
      ("name" in currentPage ? currentPage?.name?.length === 0 : false);
    setDisableNextButton(shouldDisableNextButton);

    const shouldDisablePreviousButton =
      pageState.currentPage === 0 && !currentPage.isClicked;
    setDisablePreviousButton(shouldDisablePreviousButton);
  }, [pageState.pages, pageState.currentPage]);

  const resetPageInfo = (pageIndexToReset: number) => {
    setPageState((prev) => {
      const pageToReset = prev.pages[pageIndexToReset];
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageIndexToReset]: {
            ...pageToReset,
            activeId: null,
            isClicked: false,
            ...(pageToReset.extra !== undefined && { virtual: 0 }),
            ...(pageToReset.name !== undefined && { name: "" }),
          },
        },
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start">
      <div className="flex-grow flex items-start justify-center">
        {allPages[pageState.currentPage].component}
      </div>

      <div
        className={`flex items-center justify-center ${
          pageState.currentPage === LAST_PAGE_INDEX
            ? "h-0"
            : "2xl:h-40 md:h-40 h-20 mt-2"
        }`}
      >
        <div className="flex 2xl:flex-col md:flex-col flex-row-reverse items-center justify-center" style={{ gap: '16px' }}>
          {showNextButton && pageState.currentPage !== LAST_PAGE_INDEX && (
            <button
              className={`${
                disableNextButton
                  ? "bg-disabled cursor-default"
                  : "bg-accent-300 hover:brightness-95"
              } min-w-min w-32 2xl:text-xs md:text-xs text-[0.6rem] py-4 2xl:px-8 md:px-8 px-4 text-white`}
              onClick={() => {
                if (!disableNextButton) {
                  handleNext().then();
                } else {
                  setShowNoOptionError(true);
                }
              }}
            >
              SIGUIENTE
            </button>
          )}
          {showPreviousButton &&
            pageState.currentPage !== ADDITIONAL_INFO_FORM_INDEX &&
            pageState.currentPage !== LAST_PAGE_INDEX && (
              <button
                className={`${
                  disablePreviousButton ? "cursor-default" : "hover:opacity-50"
                } min-w-min w-32 2xl:text-xs md:text-xs text-[0.6rem] bg-white text-primary-400 py-4 2xl:px-8 md:px-8 px-4 2xl:mt-2 md:mt-2`}
                onClick={() => {
                  if (!disablePreviousButton) {
                    handleReset();
                  }
                }}
              >
                VOLVER
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
