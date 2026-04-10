import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackWhatsAppClick } from "@/lib/tracker";
import { ArrowLeft, CircleCheckBig, MailCheck, MessageCircleMore, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const WHATSAPP_URL = "https://wa.me/559220201260";

const nextSteps = [
  {
    title: "Termo enviado por e-mail",
    description: "Você receberá no e-mail cadastrado o termo para assinatura da parceria.",
    icon: MailCheck,
  },
  {
    title: "Confirmação da assinatura",
    description: "Assim que a assinatura for concluída, sua ativação seguirá para a próxima etapa.",
    icon: ShieldCheck,
  },
  {
    title: "Contato da equipe",
    description: "Nossa equipe vai falar com você para orientar o início das indicações.",
    icon: UserRoundCheck,
  },
];

export default function ParceriasIndicacoesSucesso() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cadastro recebido | Programa Indique e Ganhe</title>
      </Helmet>

      <Header />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="rounded-3xl shadow-floating">
            <CardContent className="p-8 lg:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleCheckBig className="h-8 w-8" />
              </div>

              <Badge className="mt-6">Cadastro enviado</Badge>
              <h1 className="mt-4 text-4xl font-bold leading-tight">Recebemos seu cadastro no Programa Indique e Ganhe</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Seu cadastro foi encaminhado com sucesso. Agora o processo segue para assinatura do termo e ativação do seu acesso como parceiro de indicação.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {nextSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-2xl border border-border/60 bg-background p-5 shadow-soft">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  Depois da assinatura confirmada, você receberá acesso ao sistema de indicação e também será incluído no grupo de suporte para começar com acompanhamento da equipe.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="outline" size="lg">
                  <Link to="/indique-e-ganhe">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao programa
                  </Link>
                </Button>

                <Button asChild variant="whatsapp" size="lg">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá, finalizei meu cadastro no Programa Indique e Ganhe e quero falar com o polo.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackWhatsAppClick("indication_success_whatsapp", {
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