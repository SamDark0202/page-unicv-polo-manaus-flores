import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { RadioTopBar } from "./components/RadioTopBar";
import WhatsAppFloat from "@/components/WhatsAppFloat";

import Index from "./pages/Index";
import Bacharelado from "./pages/Bacharelado";
import Licenciatura from "./pages/Licenciatura";
import Tecnologo from "./pages/Tecnologo";
import PosGraduacao from "./pages/PosGraduacao";
import Blog from "./pages/Blog";
import PostPage from "./pages/Blog/[slug]";
import ParceriaEducacional from "./pages/ParceriaEducacional";
import Controle from "@/pages/Controle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* =========================
   ROTAS
========================= */
const AppRoutes = () => {
  const location = useLocation();
  const showWhatsApp = location.pathname !== "/form-parceria-mt";

  return (
    <>
      {showWhatsApp && <WhatsAppFloat />}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/bacharelado" element={<Bacharelado />} />
        <Route path="/licenciatura" element={<Licenciatura />} />
        <Route path="/tecnologo" element={<Tecnologo />} />
        <Route path="/pos-graduacao" element={<PosGraduacao />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<PostPage />} />
        <Route path="/form-parceria-mt" element={<ParceriaEducacional />} />
        <Route path="/controle" element={<Controle />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

/* =========================
   APP (LAYOUT GLOBAL)
========================= */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          {/* Rádio UniCV — TOPO GLOBAL */}
          <RadioTopBar />

          {/* Espaço para não sobrepor conteúdo */}
          <div className="pt-[61px] min-h-screen">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
