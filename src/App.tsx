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
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Index from "./pages/Index";
import Bacharelado from "./pages/Bacharelado";
import Licenciatura from "./pages/Licenciatura";
import Tecnologo from "./pages/Tecnologo";
import PosGraduacao from "./pages/PosGraduacao";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import PostPage from "./pages/Blog/[slug]";
import ParceriaEducacional from "./pages/ParceriaEducacional";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

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
        <Route path="/form-parceria-mt" element={<ParceriaEducacional />} />
        <Route path="/pos-graduacao" element={<PosGraduacao />} />
        <Route path="/Blog" element={<Blog />} />
        <Route path="/Blog/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
