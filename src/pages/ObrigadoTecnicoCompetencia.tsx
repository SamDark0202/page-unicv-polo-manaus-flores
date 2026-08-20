import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trackWhatsAppClick } from "@/lib/tracker";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const WHATSAPP_PHONE = "559220201260";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;
const DEFAULT_WA_MSG = encodeURIComponent(
  "Olá! Enviei meus dados no site para a análise de compatibilidade do Técnico por Competência e gostaria de falar com a equipe."
);

export default function ObrigadoTecnicoCompetencia() {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-x-hidden">
      <Helmet>
        <title>Solicitação Recebida | Técnico por Competência - Unicive Polo Flores</title>
      </Helmet>

      {/* Force dark body background and remove top margin/padding/bar residue */}
      <style>{`
        html, body, #root {
          background-color: #020617 !important;
          margin: 0 !important;
          padding: 0 !important;
          top: 0px !important;
          position: static !important;
        }
        .goog-te-banner-frame,
        iframe.skiptranslate,
        .skiptranslate iframe,
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>

      <main className="w-full max-w-xl my-auto py-4 sm:py-8 flex items-center justify-center">
        <Card className="w-full bg-slate-900/90 border border-slate-800 text-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <CardContent className="p-6 sm:p-10 text-center flex flex-col items-center justify-center">
            {/* Ícone de Sucesso Animado */}
            <div className="mx-auto mb-5 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xl shadow-emerald-950/60">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 animate-bounce" />
            </div>

            <Badge variant="outline" className="mb-4 border-emerald-500/40 text-emerald-400 font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-full bg-emerald-500/10 max-w-full whitespace-normal leading-snug">
              Solicitação Recebida com Sucesso!
            </Badge>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-3 sm:mb-4 leading-tight">
              Obrigado por enviar seus dados!
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-6 sm:mb-8 font-normal leading-relaxed">
              Sua solicitação de análise de compatibilidade para o curso <strong className="text-white font-semibold">Técnico por Competência</strong> foi recebida com sucesso. Nossa equipe pedagógica vai analisar as suas informações e entrará em contato em breve via WhatsApp.
            </p>

            {/* Botões de Ação 100% Perfeitos no PC e Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-md mx-auto pt-1 sm:pt-2">
              <a
                href={`${WHATSAPP_URL}?text=${DEFAULT_WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsAppClick("obrigado_tecnico_competencia_wa", {
                    destination: WHATSAPP_URL,
                  })
                }
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl px-4 py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 transition-all duration-200 text-center leading-tight"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-white" />
                <span>Falar no WhatsApp</span>
              </a>

              <Link
                to="/tecnico-por-competencia"
                className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all duration-200 text-center leading-tight"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-slate-300" />
                <span>Voltar à Página</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
