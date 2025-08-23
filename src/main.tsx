import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from './lib/errorHandler'

// Inicializar sistema de logging de erros
setupGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(<App />);
