import { zodResolver } from "@hookform/resolvers/zod";
import Diferenciais from "@/components/Diferenciais";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PartnerWhatsAppMiniForm from "@/components/partner/PartnerWhatsAppMiniForm";
import { useToast } from "@/hooks/use-toast";
import { savePartnerOrigin } from "@/lib/partnerOrigin";
import {
  formatPartnerPublicLeadPhone,
  partnerPublicLeadSchema,
  type PartnerPublicLeadValues,
} from "@/lib/partnerPublicLeadForm";
import { trackFormSubmit } from "@/lib/tracker";
import TestimonialsSection from "@/components/TestimonialsSection";
import logoImage from "@/assets/unicive-logo-principal.png";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Loader2,
  Trophy,
  Users,
  WalletCards,
  MonitorSmartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

const courseTracks = [
  {
    title: "Graduação",
    description: "Bacharelado, licenciatura e tecnólogo para quem quer iniciar ou consolidar a carreira.",
    icon: GraduationCap,
  },
  {
    title: "2ª Graduação",
    description: "Nova formação para ampliar possibilidades profissionais e atualizar o currículo.",
    icon: BookOpen,
  },
  {
    title: "Técnico → Tecnólogo",
    description: "Progressão acadêmica pensada para quem já vem de uma base técnica e quer evoluir.",
    icon: Trophy,
  },
];

const universityHighlights = [
  {
    title: "Instituição reconhecida",
    description: "Formação com credibilidade, diploma reconhecido e estrutura pensada para preparar profissionais para o mercado atual.",
    icon: BadgeCheck,
  },
  {
    title: "Cursos para diferentes momentos",
    description: "Opções para quem está começando, retomando os estudos ou buscando uma nova etapa na vida profissional.",
    icon: Users,
  },
  {
    title: "Flexibilidade de estudo",
    description: "Modalidades e formatos que ajudam a conciliar rotina, trabalho e desenvolvimento acadêmico.",
    icon: MonitorSmartphone,
  },
];

const modalities = [
  {
    label: "Ensino a distância",
    detail: "Mais liberdade para estudar com apoio pedagógico, materiais digitais e acompanhamento durante a jornada.",
    icon: MonitorSmartphone,
  },
  {
    label: "Trilhas para crescimento profissional",
    detail: "Cursos pensados para fortalecer competências, gerar evolução acadêmica e ampliar presença no mercado.",
    icon: WalletCards,
  },
  {
    label: "Ingresso simplificado",
    detail: "Processos mais diretos para que o aluno consiga avançar com clareza desde a escolha do curso até a matrícula.",
    icon: ArrowRight,
  },
];

const faqs = [
  {
    question: "Quais cursos estão disponíveis?",
    answer: "A Unicive oferece opções em graduação, segunda graduação e progressão de técnico para tecnólogo, com diferentes áreas e propostas de formação.",
  },
  {
    question: "Como funcionam as modalidades?",
    answer: "Os cursos contam com formatos que priorizam flexibilidade e praticidade, permitindo que o aluno organize os estudos de acordo com sua rotina.",
  },
  {
    question: "Posso pedir mais informações antes de decidir?",
    answer: "Sim. A página permite solicitar contato para conhecer melhor os cursos, modalidades, processo de ingresso e condições disponíveis.",
  },
  {
    question: "O e-mail é obrigatório no formulário?",
    answer: "Não. O telefone é o dado principal. O e-mail é opcional e pode ser informado apenas se você quiser um canal adicional de contato.",
  },
];

export default function ParceiroOrigem() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [captured, setCaptured] = useState(false);

  const safeSlug = useMemo(() => (slug || "").trim(), [slug]);
  const testimonialsCtaHref = useMemo(
    () => (safeSlug ? `/parceiro/${safeSlug}?origem=depoimentos#formulario-parceiro` : "#formulario-parceiro"),
    [safeSlug],
  );

  const form = useForm<PartnerPublicLeadValues>({
    resolver: zodResolver(partnerPublicLeadSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      website: "",
    },
  });

  useEffect(() => {
    if (!safeSlug) return;
    savePartnerOrigin(safeSlug);
    setCaptured(true);
  }, [safeSlug]);

  async function onSubmit(values: PartnerPublicLeadValues) {
    if (!safeSlug) {
      toast({
        title: "Link inválido",
        description: "Não foi possível identificar o parceiro desta página.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/partner-public-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          slug: safeSlug,
          nome: values.nome,
          telefone: values.telefone,
          email: values.email || "",
          website: values.website || "",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar os dados agora.");
      }

      toast({
        title: "Solicitação enviada",
        description: "Recebemos seus dados. Nossa equipe vai entrar em contato em breve.",
      });
      trackFormSubmit("partner_public_landing_form", {
        partner_slug: safeSlug,
        has_email: Boolean(values.email),
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Falha no envio",
        description: error instanceof Error ? error.message : "Não foi possível enviar seu contato.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Unicive Polo Flores | Conheça Nossos Cursos</title>
        <meta name="description" content="Conheça a Unicive Polo Flores, descubra cursos, modalidades e possibilidades de formação para diferentes momentos da sua trajetória." />
      </Helmet>

      <header className="border-b bg-background">
        <div className="container flex items-center py-4 px-4">
          <img
            src={logoImage}
            alt="Unicive Polo Manaus Flores"
            className="h-8 w-auto max-h-14 transition-all duration-200 sm:h-10 md:h-12 lg:h-14"
            style={{ maxWidth: "180px", objectFit: "contain" }}
          />
        </div>
      </header>

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary-dark))_0%,hsl(var(--primary))_55%,hsl(var(--secondary))_100%)] py-14 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-8 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.86fr]">
            <div>
              <Badge className="border border-white/25 bg-white/10 text-white hover:bg-white/10">
                Unicive
              </Badge>
              <h1 className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                Transforme seu Futuro Profissional

              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                Formação acessível, modalidades flexíveis e cursos pensados para diferentes perfis, objetivos e etapas profissionais.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {courseTracks.map((track) => {
                  const Icon = track.icon;
                  return (
                    <div key={track.title} className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">{track.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/70">{track.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card id="formulario-parceiro" className="scroll-mt-28 rounded-3xl border-white/20 bg-white/95 text-foreground shadow-floating">
              <CardContent className="p-7 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Solicite mais informações</p>
                <h2 className="mt-2 text-2xl font-bold leading-snug">Receba detalhes sobre cursos, modalidades e ingresso</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Preencha seus dados para conhecer melhor a universidade, as opções de formação e o processo para começar.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                    <input type="text" autoComplete="off" tabIndex={-1} className="hidden" {...form.register("website")} />

                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              inputMode="tel"
                              autoComplete="tel"
                              {...field}
                              onChange={(event) => field.onChange(formatPartnerPublicLeadPhone(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            E-mail{" "}
                            <span className="font-normal text-muted-foreground">(opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seuemail@exemplo.com" autoComplete="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting || !captured}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Quero receber mais informações
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                  {["Informações claras", "Atendimento oficial", "Resposta rápida"].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Diferenciais />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Modalidades e possibilidades</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Formatos pensados para diferentes rotinas e objetivos</h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {modalities.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-3xl border border-border/60 bg-background p-6 shadow-soft">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-4xl font-black text-primary/15">{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


  <TestimonialsSection ctaHref={testimonialsCtaHref} />

      <section className="py-16 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Informações rápidas</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Perguntas frequentes</h2>
          </div>

          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardContent className="p-6 sm:p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,hsl(var(--primary-dark))_0%,hsl(var(--primary))_60%,hsl(var(--secondary))_100%)] px-8 py-12 text-white shadow-floating lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">Conheça mais</p>
              <h2 className="mt-4 text-3xl font-bold lg:text-4xl">
                Quando quiser avançar, nossa equipe pode apresentar mais detalhes sobre cursos e ingresso.
              </h2>
              <p className="mt-4 text-base leading-8 text-white/85">
                Use o formulário acima ou o botão de WhatsApp para receber informações sobre a Unicive Polo Flores.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {["Cursos variados", "Modalidades flexíveis", "Equipe disponível"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {safeSlug ? <PartnerWhatsAppMiniForm partnerSlug={safeSlug} /> : null}
    </div>
  );
}