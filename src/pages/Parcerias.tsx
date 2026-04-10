import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const partnershipCategories = [
  {
    title: "Empresas",
    description:
      "Ofereça ensino superior como benefício para seus colaboradores e receba comissão por cada matrícula realizada.",
    href: "/parcerias/empresas",
    icon: BriefcaseBusiness,
    highlight: "Comissão por matrícula",
  },
  {
    title: "Órgãos públicos",
    description:
      "Convênios para qualificar servidores com acesso facilitado ao ensino superior e suporte completo do polo.",
    href: "/parcerias/orgaos-publicos",
    icon: Building2,
    highlight: "Convênio institucional",
  },
  {
    title: "Escolas",
    description:
      "Indique alunos e ex-alunos para graduação, amplie oportunidades e receba comissão por matrícula confirmada.",
    href: "/parcerias/escolas",
    icon: GraduationCap,
    highlight: "Comissão por matrícula",
  },
];

const mainBenefits = [
  "Modelo simples: você indica, o aluno se matricula e você recebe",
  "Suporte completo do polo em todas as etapas",
  "Acompanhamento claro das indicações e resultados",
  "Implantação rápida e sem burocracia",
];

export default function Parcerias() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Parcerias Educacionais | Unicive Polo Flores</title>
        <meta
          name="description"
          content="Conheça as parcerias institucionais da Unicive Polo Flores para empresas, órgãos públicos e escolas."
        />
      </Helmet>

      <Header />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-light))_45%,hsl(var(--secondary))_100%)] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl">
            <Badge className="mb-5 bg-white/15 text-white hover:bg-white/15">Parcerias institucionais</Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight lg:text-6xl">
              Parcerias institucionais para empresas, escolas e órgãos públicos
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/85 lg:text-xl">
             Conecte sua instituição ao ensino superior com um modelo simples, estruturado e com apoio do polo em todas as etapas da parceria.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <a href="#modelos">Ver como funciona</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/indique-e-ganhe">Conhecer o Programa Indique e Ganhe</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12">
        <div className="container mx-auto grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-4">
          {mainBenefits.map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-border/70 bg-background/90 px-5 py-4 shadow-soft">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">{benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="modelos" className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Escolha o modelo ideal</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Três formatos institucionais, um processo simples</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Escolha abaixo o formato institucional mais adequado ao seu perfil. Cada modelo foi pensado para facilitar a implantação e a divulgação dentro da sua realidade.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {partnershipCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.title} className="group flex h-full flex-col rounded-3xl border-border/70 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit">{category.highlight}</Badge>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-muted-foreground">
                        {category.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="mt-auto pt-0">
                    <Button asChild className="w-full justify-between rounded-xl" size="lg">
                      <Link to={category.href}>
                        Ver detalhes da parceria
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}