import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Index from "./pages/Index";
import Bacharelado from "./pages/Bacharelado";
import Licenciatura from "./pages/Licenciatura";
import Tecnologo from "./pages/Tecnologo";
import PosGraduacao from "./pages/PosGraduacao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WhatsAppFloat />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bacharelado" element={<Bacharelado />} />
          <Route path="/licenciatura" element={<Licenciatura />} />
          <Route path="/tecnologo" element={<Tecnologo />} />
          <Route path="/pos-graduacao" element={<PosGraduacao />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
