import MainPage from "./pages/MainPage.tsx";

interface AppProps {
  locale?: string;
  theme?: string;
  baseUrl?: string;
}

function App({ locale, theme, baseUrl }: AppProps) {
  // TODO: Usar props en el futuro para personalización
  console.log('Widget props:', { locale, theme, baseUrl });
  return <MainPage />;
}

export default App;
