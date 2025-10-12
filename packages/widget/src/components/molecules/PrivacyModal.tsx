interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
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
            Política de privacidad y términos de uso
          </span>
          <button
            className="text-black text-2xl font-bold focus:outline-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold">Aviso de Protección de Datos</h3>
          <br />
          <p>
            En cumplimiento con lo establecido en el Reglamento General de
            Protección de Datos (RGPD) y otras normativas aplicables, le
            informamos de que los datos personales que nos facilite a través de
            este formulario serán tratados por GUA Urología y Andrología como
            responsable del tratamiento, con la finalidad de gestionar su
            solicitud de cita online y proporcionarle información relacionada
            con nuestros servicios.
          </p>

          <h3 className="font-semibold mt-4">Base legal del tratamiento:</h3>
          <p>Su consentimiento al completar y enviar este formulario.</p>

          <h3 className="font-semibold mt-4">Conservación de los datos:</h3>
          <p>
            Los datos proporcionados se conservarán mientras sean necesarios
            para la finalidad indicada o hasta que usted solicite su supresión.
          </p>

          <h3 className="font-semibold mt-4">Destinatarios:</h3>
          <p>No se cederán sus datos a terceros, salvo obligación legal.</p>

          <h3 className="font-semibold mt-4">Derechos del usuario:</h3>
          <p>
            Puede ejercer sus derechos de acceso, rectificación, supresión,
            limitación del tratamiento, portabilidad y oposición al tratamiento
            de sus datos enviando una solicitud a{" "}
            <a
              href="mailto:info@urologiayandrologia.com"
              className="text-blue-600 underline"
            >
              info@urologiayandrologia.com
            </a>
            . Asimismo, tiene derecho a presentar una reclamación ante la
            autoridad de control competente. Al enviar este formulario, usted
            confirma que ha leído y acepta nuestra{" "}
            <strong>Política de Privacidad</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyModal;
