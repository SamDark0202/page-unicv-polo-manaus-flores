import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackWhatsAppClick } from "@/lib/tracker";
import { ArrowLeft, CircleCheckBig, MessageCircleMore } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";

const WHATSAPP_URL = "https://wa.me/559220201260";

export default function ParceriasSucesso() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") === "escola" ? "escola" : "empresa";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Dados enviados com sucesso | Unicive Polo Flores</title>
      </Helmet>

      <Header />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="rounded-3xl shadow-floating">
            <CardContent className="p-8 lg:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleCheckBig className="h-8 w-8" />
              </div>

              <Badge className="mt-6">Envio concluído</Badge>
              <h1 className="mt-4 text-4xl font-bold leading-tight">Recebemos os dados da parceria com sucesso</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                O cadastro da parceria de {tipo} foi encaminhado. Agora o processo segue para conferência, geração do contrato e envio para assinatura no e-mail informado.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="outline" size="lg">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao site
                  </Link>
                </Button>

                <Button asChild variant="whatsapp" size="lg">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá, enviei o formulário de parceria e quero falar com o polo.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackWhatsAppClick("partnership_success_whatsapp", {
                        partnership_type: tipo,
                        destination: WHATSAPP_URL,
                      })
                    }
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    Falar com o polo no WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}
