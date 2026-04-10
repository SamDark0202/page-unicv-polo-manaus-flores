import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trackWhatsAppClick } from "@/lib/tracker";
import { ArrowLeft, ArrowRight, CheckCircle2, LucideIcon } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

type Stat = {
  value: string;
  label: string;
  helper?: string;
};

type BenefitCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Step = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type CtaButton = {
  label: string;
  to?: string;
  href?: string;
  variant?: ButtonProps["variant"];
  trackSource?: string;
  external?: boolean;
};

interface PartnershipDetailPageProps {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  title: string;
  subtitle: string;
  highlightNote: string;
  stats: Stat[];
  audienceTitle: string;
  audienceText: string;
  modelTitle: string;
  modelText: string;
  benefitCards: BenefitCard[];
  steps: Step[];
  partnerBenefitsTitle: string;
  partnerBenefits: string[];
  supportTitle: string;
  supportItems: string[];
  faqs: FaqItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButtons: CtaButton[];
}

function renderCtaButton(button: CtaButton, index: number) {
  const variant = button.variant ?? "default";
  const trackingProps = button.trackSource
    ? {
        onClick: () => {
          trackWhatsAppClick(button.trackSource as string, {
            destination: button.href ?? button.to,
            page: window.location.pathname,
          });
        },
      }
    : {};

  if (button.to) {
    return (
      <Button key={`${button.label}-${index}`} asChild size="lg" variant={variant} className="min-w-[220px]">
        <Link to={button.to}>{button.label}</Link>
      </Button>
    );
  }

  if (button.href) {
    return (
      <Button key={`${button.label}-${index}`} asChild size="lg" variant={variant} className="min-w-[220px]">
        <a
          href={button.href}
          target={button.external ? "_blank" : undefined}
          rel={button.external ? "noopener noreferrer" : undefined}
          {...trackingProps}
        >
          {button.label}
        </a>
      </Button>
    );
  }

  return null;
}

export default function PartnershipDetailPage({
  metaTitle,
  metaDescription,
  badge,
  title,
  subtitle,
  highlightNote,
  stats,
  audienceTitle,
  audienceText,
  modelTitle,
  modelText,
  benefitCards,
  steps,
  partnerBenefitsTitle,
  partnerBenefits,
  supportTitle,
  supportItems,
  faqs,
  ctaTitle,
  ctaDescription,
  ctaButtons,
}: PartnershipDetailPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <Header />

      <section className="relative overflow-hidden bg-[linear-gradient(140deg,hsl(var(--primary-dark))_0%,hsl(var(--primary))_48%,hsl(var(--secondary))_100%)] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-80 w-80 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-14 lg:py-20">
          <Link
            to="/parcerias"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para parcerias
          </Link>

          <div className="mt-6 max-w-4xl">
            <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">{badge}</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight lg:text-6xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/85 lg:text-xl">{subtitle}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-black/10 p-5 shadow-soft backdrop-blur-sm">
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="mt-2 text-sm font-medium text-white/90">{stat.label}</p>
                {stat.helper ? <p className="mt-1 text-sm text-white/65">{stat.helper}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardContent className="p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Para quem faz sentido</p>
              <h2 className="mt-3 text-3xl font-bold">{audienceTitle}</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{audienceText}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted/30 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Vantagens da parceria</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Proposta objetiva, com benefícios institucionais claros</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {benefitCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="rounded-3xl border-border/60 shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-elevated">
                  <CardContent className="p-7">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Etapas do processo</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Fluxo simples do primeiro contato até a ativação</h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="rounded-3xl border-border/60 shadow-soft">
                <CardContent className="p-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border-border/60 shadow-soft">
              <CardContent className="p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Retorno para o parceiro</p>
                <h2 className="mt-3 text-3xl font-bold">{partnerBenefitsTitle}</h2>
                <Separator className="my-6" />
                <div className="space-y-4">
                  {partnerBenefits.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-background shadow-soft">
              <CardContent className="p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Suporte do polo</p>
                <h2 className="mt-3 text-3xl font-bold">{supportTitle}</h2>
                <Separator className="my-6" />
                <div className="space-y-4">
                  {supportItems.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ArrowRight className="mt-1 h-4 w-4 text-secondary" />
                      <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Perguntas frequentes</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Pontos que costumam ser avaliados antes da adesão</h2>
          </div>

          <Card className="mt-10 rounded-3xl border-border/60 px-6 shadow-soft sm:px-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-left text-base font-semibold">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      <section className="pb-16 lg:pb-20">
        <div className="container mx-auto px-4">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-light))_55%,hsl(var(--secondary))_100%)] p-8 text-white shadow-floating lg:p-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Próximo passo</p>
              <h2 className="mt-3 text-3xl font-bold lg:text-4xl">{ctaTitle}</h2>
              <p className="mt-4 text-base leading-8 text-white/85">{ctaDescription}</p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {ctaButtons.map((button, index) => renderCtaButton(button, index))}
            </div>
          </div>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}