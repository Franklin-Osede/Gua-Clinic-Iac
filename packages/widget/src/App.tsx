import { useEffect, useState } from "react";
import MainPage from "./pages/MainPage.tsx";
import { initializeSession } from "./services/GuaAPIService.ts";
import { setApiBaseUrl } from "./config/api.config.ts";

interface AppProps {
  locale?: string;
  theme?: string;
  baseUrl?: string;
}

function App({ locale, theme, baseUrl }: AppProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    // Configurar la URL base de la API ANTES de inicializar la sesión
    if (baseUrl) {
      setApiBaseUrl(baseUrl);
    }

    // Esperar un tick para asegurar que setApiBaseUrl se haya ejecutado
    const init = async () => {
      // Pequeño delay para asegurar que la configuración esté lista
      await new Promise(resolve => setTimeout(resolve, 0));
      
      try {
        await initializeSession();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error al inicializar widget:', error);
        setInitializationError(error instanceof Error ? error.message : 'Error desconocido');
        // Continuar de todas formas para que el usuario vea el widget
        setIsInitialized(true);
      }
    };

    init();
  }, [baseUrl]);

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#666'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (initializationError) {
    console.warn('⚠️ Advertencia al inicializar sesión:', initializationError);
  }

  // TODO: Usar props en el futuro para personalización
  console.log('Widget props:', { locale, theme, baseUrl });
  return <MainPage />;
}

export default App;
