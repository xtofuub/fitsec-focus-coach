import { AppShell } from './components/AppShell';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fc-theme">
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
