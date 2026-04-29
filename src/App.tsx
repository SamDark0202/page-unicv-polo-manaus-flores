import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import TopbarFixed from "./components/TopbarFixed";
import { isChristmas } from "@/lib/isChristmas";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTracker from "@/components/PageTracker";
import {
  hasAdminPasswordSetupContext,
  resolveAdminPasswordSetupTargetPath,
} from "@/lib/adminPasswordSetup";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// ✅ LAZY LOAD - Páginas carregadas sob demanda
const Index = lazy(() => import("./pages/Index"));
const Bacharelado = lazy(() => import("./pages/Bacharelado"));
const Licenciatura = lazy(() => import("./pages/Licenciatura"));
const Tecnologo = lazy(() => import("./pages/Tecnologo"));
const TecnicoParaTecnologo = lazy(() => import("./pages/TecnicoParaTecnologo"));
const SegundaGraduacao = lazy(() => import("./pages/SegundaGraduacao"));
const PosGraduacao = lazy(() => import("./pages/PosGraduacao"));
const Parcerias = lazy(() => import("./pages/Parcerias"));
const ParceriasEmpresas = lazy(() => import("./pages/ParceriasEmpresas"));
const ParceriasEscolas = lazy(() => import("./pages/ParceriasEscolas"));
const ParceriasOrgaosPublicos = lazy(() => import("./pages/ParceriasOrgaosPublicos"));
const ParceriasIndicacoes = lazy(() => import("./pages/ParceriasIndicacoes"));
const ParceriasIndicacoesFormulario = lazy(() => import("./pages/ParceriasIndicacoesFormulario"));
const ParceriasIndicacoesSucesso = lazy(() => import("./pages/ParceriasIndicacoesSucesso"));
const ParceriasPainel = lazy(() => import("./pages/ParceriasPainel"));
const ParceriasPainelDashboard = lazy(() => import("./pages/ParceriasPainelDashboard"));
const ParceriasDefinirSenha = lazy(() => import("./pages/ParceriasDefinirSenha"));
const ControleDefinirSenha = lazy(() => import("./pages/ControleDefinirSenha"));
const ParceiroOrigem = lazy(() => import("./pages/ParceiroOrigem"));
const ParceriasFormularioEmpresa = lazy(() => import("./pages/ParceriasFormularioEmpresa"));
const ParceriasFormularioEscola = lazy(() => import("./pages/ParceriasFormularioEscola"));
const ParceriasSucesso = lazy(() => import("./pages/ParceriasSucesso"));
const Blog = lazy(() => import("./pages/Blog"));
const PostPage = lazy(() => import("./pages/Blog/[slug]"));
const ParceriaEducacional = lazy(() => import("./pages/ParceriaEducacional"));
const WhatsAppRedirectLanding = lazy(() => import("./pages/WhatsAppRedirectLanding"));
const Controle = lazy(() => import("@/pages/Controle"));
const TermosDeServico = lazy(() => import("./pages/TermosDeServico"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade"));
const TesteVocacional = lazy(() => import("./pages/TesteVocacional"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

const RootEntryRoute = () => {
  const location = useLocation();

  if (location.pathname === "/" && hasAdminPasswordSetupContext(location.search, location.hash)) {
    const targetPath = resolveAdminPasswordSetupTargetPath(location.search, location.hash);
    return (
      <Navigate
        to={{
          pathname: targetPath,
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return <Index />;
};

/* =========================
   ROTAS
========================= */
const AppRoutes = () => {
  const location = useLocation();
  const redirectPaths = new Set([
    "/zap/panfleto-flores-2026",
    "/zap/palestrante-tania",
    "/zap/folder-vire-pagina",
  ]);
  const isRedirectLanding = redirectPaths.has(location.pathname);
  const isAdmin = location.pathname.startsWith("/controle");
  const isVocationalTestRoute = location.pathname === "/teste-vocacional";
  const isPartnershipFlow =
    location.pathname.startsWith("/parcerias") ||
    location.pathname.startsWith("/indique-e-ganhe");
    const isPartnerPublicRoute = location.pathname.startsWith('/parceiro/');
    const hideGlobalChrome = isAdmin || isRedirectLanding || isPartnershipFlow || isPartnerPublicRoute || isVocationalTestRoute;
  const showWhatsApp =
    location.pathname !== "/form-parceria-mt" &&
    !hideGlobalChrome &&
    !isVocationalTestRoute;

  return (
    <>
      <PageTracker />
      <ScrollToTop />
      {!hideGlobalChrome && <TopbarFixed isChristmas={isChristmas} />}
      {showWhatsApp && <WhatsAppFloat />}

      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          <Route path="/" element={<RootEntryRoute />} />
          <Route path="/bacharelado" element={<Bacharelado />} />
          <Route path="/licenciatura" element={<Licenciatura />} />
          <Route path="/tecnologo" element={<Tecnologo />} />
          <Route path="/tecnico-para-tecnologo" element={<TecnicoParaTecnologo />} />
          <Route path="/segunda-graduacao" element={<SegundaGraduacao />} />
          <Route path="/pos-graduacao" element={<PosGraduacao />} />
          <Route path="/teste-vocacional" element={<TesteVocacional />} />
          <Route path="/parcerias" element={<Parcerias />} />
          <Route path="/parcerias/empresas" element={<ParceriasEmpresas />} />
          <Route path="/parcerias/empresas/formulario" element={<ParceriasFormularioEmpresa />} />
          <Route path="/parcerias/escolas" element={<ParceriasEscolas />} />
          <Route path="/parcerias/escolas/formulario" element={<ParceriasFormularioEscola />} />
          <Route path="/parcerias/indicacoes" element={<Navigate to="/indique-e-ganhe" replace />} />
          <Route path="/parcerias/indicacoes/formulario" element={<Navigate to="/indique-e-ganhe/formulario" replace />} />
          <Route path="/indique-e-ganhe" element={<ParceriasIndicacoes />} />
          <Route path="/indique-e-ganhe/formulario" element={<ParceriasIndicacoesFormulario />} />
          <Route path="/indique-e-ganhe/sucesso" element={<ParceriasIndicacoesSucesso />} />
          <Route path="/parcerias/painel" element={<ParceriasPainel />} />
          <Route path="/parcerias/painel/dashboard" element={<ParceriasPainelDashboard />} />
          <Route path="/parcerias/definir-senha" element={<ParceriasDefinirSenha />} />
          <Route path="/controle/definir-senha" element={<ControleDefinirSenha />} />
          <Route path="/parceiro/:slug" element={<ParceiroOrigem />} />
          <Route path="/parcerias/sucesso" element={<ParceriasSucesso />} />
          <Route path="/parcerias/orgaos-publicos" element={<ParceriasOrgaosPublicos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostPage />} />
          <Route path="/form-parceria-mt" element={<ParceriaEducacional />} />
          <Route
            path="/zap/panfleto-flores-2026"
            element={
              <WhatsAppRedirectLanding
                campaignKey="qr_panfleto"
                campaignLabel="QR Code do panfleto"
              />
            }
          />
          <Route
            path="/zap/palestrante-tania"
            element={
              <WhatsAppRedirectLanding
                campaignKey="palestrante_tania"
                campaignLabel="Palestrante Tania"
              />
            }
          />
          <Route
            path="/zap/folder-vire-pagina"
            element={
              <WhatsAppRedirectLanding
                campaignKey="folder_vire_pagina"
                campaignLabel="Folder Vire Pagina"
              />
            }
          />
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
  const redirectPaths = new Set([
    "/zap/panfleto-flores-2026",
    "/zap/palestrante-tania",
    "/zap/folder-vire-pagina",
  ]);
  const isRedirectLanding = redirectPaths.has(location.pathname);
  const isAdmin = location.pathname.startsWith("/controle");
  const isVocationalTestRoute = location.pathname === "/teste-vocacional";
  const isPartnershipFlow =
    location.pathname.startsWith("/parcerias") ||
    location.pathname.startsWith("/indique-e-ganhe");
  const isPartnerPublicRoute = location.pathname.startsWith("/parceiro/");
  return (
    <div className={isAdmin || isRedirectLanding || isPartnershipFlow || isPartnerPublicRoute || isVocationalTestRoute ? "min-h-screen" : "pt-[90px] min-h-screen"}>
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
