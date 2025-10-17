import { createRoot } from 'react-dom/client'
import Controle from "@/pages/Controle";
import App from './App.tsx'
import './index.css'
import { Route } from 'react-router-dom';

// Add this Route to your routing configuration
//      
<Route path="/controle" element={<Controle />} />
createRoot(document.getElementById("root")!).render(<App />);
