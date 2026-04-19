import { Link } from "react-router-dom";
import { Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VocacionalPromoSection() {
  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 px-8 py-12 lg:px-14 lg:py-16 shadow-xl">
          {/* Orbes decorativos */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Texto */}
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
                <Brain className="h-4 w-4" />
                Teste Vocacional Gratuito
              </div>

              <h2 className="text-2xl font-bold text-white lg:text-3xl">
                Ainda não sabe qual curso escolher?
              </h2>
              <p className="mt-3 text-base text-slate-300 leading-relaxed">
                Responda 10 perguntas rápidas e descubra as formações que mais combinam com seu perfil tudo em menos de 3 minutos.
              </p>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-xl bg-emerald-500 px-8 text-white hover:bg-emerald-400 font-semibold shadow-md"
              >
                <Link to="/teste-vocacional">
                  Fazer o teste agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
