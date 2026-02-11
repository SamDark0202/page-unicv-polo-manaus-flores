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
import { lazy, Suspense } from "react";

import TopbarFixed from "./components/TopbarFixed";
import { isChristmas } from "@/lib/isChristmas";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTracker from "@/components/PageTracker";

// ✅ LAZY LOAD - Páginas carregadas sob demanda
const Index = lazy(() => import("./pages/Index"));
const Bacharelado = lazy(() => import("./pages/Bacharelado"));
const Licenciatura = lazy(() => import("./pages/Licenciatura"));
const Tecnologo = lazy(() => import("./pages/Tecnologo"));
const PosGraduacao = lazy(() => import("./pages/PosGraduacao"));
const Blog = lazy(() => import("./pages/Blog"));
const PostPage = lazy(() => import("./pages/Blog/[slug]"));
const ParceriaEducacional = lazy(() => import("./pages/ParceriaEducacional"));
const Controle = lazy(() => import("@/pages/Controle"));
const TermosDeServico = lazy(() => import("./pages/TermosDeServico"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ✅ Loading skeleton while pages load
const PageLoadingSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-center">
      <div className="h-12 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
);

const queryClient = new QueryClient();

/* =========================
   ROTAS
========================= */
const AppRoutes = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/controle");
  const showWhatsApp = location.pathname !== "/form-parceria-mt" && !isAdmin;

  return (
    <>
      <PageTracker />
      {!isAdmin && <TopbarFixed isChristmas={isChristmas} />}
      {showWhatsApp && <WhatsAppFloat />}

      <Suspense fallback={<PageLoadingSkeleton />}>
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
          <Route path="/termos-de-servico" element={<TermosDeServico />} />
          <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

/* =========================
   APP (LAYOUT GLOBAL)
========================= */
const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/controle");
  return (
    <div className={isAdmin ? "min-h-screen" : "pt-[90px] min-h-screen"}>
      <AppRoutes />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
