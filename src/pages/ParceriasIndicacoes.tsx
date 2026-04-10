import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, FileSignature, Megaphone, MessageCircle, Store, UsersRound, WalletCards } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const benefits = [
  {
    title: "Parceria aberta para público geral",
    description: "A oportunidade é voltada para quem tem rede de contatos e quer indicar alunos, seja como pessoa física ou jurídica.",
    icon: UsersRound,
  },
  {
    title: "Processo simples de indicação",
    description: "Você indica o aluno, a equipe da Unicive faz o atendimento e acompanha toda a jornada até a matrícula.",
    icon: FileSignature,
  },
  {
    title: "Comissão fixa por matrícula",
    description: "Cada matrícula confirmada gera R$ 50,00 de comissão, com pagamento previsto para o dia 10 de cada mês.",
    icon: WalletCards,
  },
];

const audiences = [
  "Vendedores que querem ampliar a renda com um produto de alta procura.",
  "Comerciantes com fluxo constante de pessoas no ponto físico.",
  "Conectores com boa rede de contatos na comunidade.",
  "Influenciadores e perfis digitais com capacidade de mobilizar audiência.",
];

const steps = [
  "Você apresenta o aluno interessado pelos canais oficiais da parceria.",
  "A equipe da Unicive faz o atendimento, tira dúvidas e conduz o processo.",
  "O aluno conclui a matrícula de forma 100% digital.",
  "Com a matrícula confirmada, a comissão é lançada para pagamento.",
];

const gainExamples = [
  { enrollments: "10 matrículas", amount: "R$ 500,00" },
  { enrollments: "30 matrículas", amount: "R$ 1.500,00" },
  { enrollments: "50 matrículas", amount: "R$ 2.500,00" },
];

const strategies = [
  {
    title: "Canais digitais",
    description: "Use WhatsApp, Instagram e Facebook para falar com sua rede de contatos de forma rápida e direta.",
    icon: Megaphone,
  },
  {
    title: "Ponto de venda",
    description: "Divulgue no seu estabelecimento, balcão de atendimento ou vitrine para alcançar o público local.",
    icon: Store,
  },
  {
    title: "Boca a boca",
    description: "A indicação pessoal continua sendo uma das formas mais fortes de gerar confiança e conversão.",
    icon: MessageCircle,
  },
];

export default function ParceriasIndicacoes() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Parceria de Indicação | Unicive Polo Flores</title>
        <meta
          name="description"
          content="Conheça a parceria de indicação da Unicive, veja como funciona a comissão por matrícula e inicie seu cadastro para receber o termo de parceria."
        />
      </Helmet>

      <Header />

      <section className="relative overflow-hidden bg-[linear-gradient(140deg,hsl(var(--primary-dark))_0%,hsl(var(--primary))_48%,hsl(var(--secondary))_100%)] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-80 w-80 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-10 sm:py-12 lg:py-14">
          <div className="max-w-4xl">
            <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">Parceria de indicação</Badge>
            <h1 className="mt-3 max-w-[1100px] text-[2rem] font-bold leading-[1.02] sm:text-[3rem] lg:text-[3.7rem] xl:text-[4rem]">
              Transforme sua rede de contatos em renda com indicações para a Unicive Polo Manaus Flores
            </h1>

            <div className="mt-5 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:mt-6 sm:p-6 lg:max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Por que vale a pena</p>
              <p className="mt-3 text-base leading-8 text-white sm:text-lg">
                Você entra em uma parceria pensada para facilitar a divulgação, aproveitar sua rede de contatos e criar uma nova fonte de oportunidade com apoio comercial da Unicive.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto sm:min-w-[260px]">
                <Link to="/indique-e-ganhe/formulario">Quero iniciar meu cadastro</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto sm:min-w-[216px]"
              >
                <a href="#detalhes">Entender o processo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="detalhes" className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Visão geral</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Uma oportunidade simples para indicar alunos e gerar renda extra</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              O modelo foi pensado para facilitar a indicação. Você não precisa fazer atendimento, matrícula ou suporte acadêmico. A Unicive cuida disso para você.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-3xl border-border/60 shadow-soft">
                  <CardContent className="p-7">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Para quem é</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Perfis que podem aproveitar melhor essa parceria</h2>
          </div>

          <div className="mb-10 grid gap-4 lg:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background p-5 shadow-soft">
                <BadgeCheck className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-7 text-muted-foreground">{audience}</p>
              </div>
            ))}
          </div>

          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardContent className="p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Passo a passo</p>
              <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Como a parceria funciona na prática</h2>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-soft sm:gap-4 sm:p-5 lg:p-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl sm:text-base">
                      {index + 1}
                    </div>
                    <p className="pt-0.5 text-[15px] leading-7 text-muted-foreground sm:text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Potencial de ganhos</p>
                <h3 className="mt-3 text-2xl font-bold">Exemplos práticos de comissão</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {gainExamples.map((item) => (
                    <div key={item.enrollments} className="rounded-2xl border border-border/60 bg-background p-5 text-center shadow-soft">
                      <p className="text-sm font-medium text-muted-foreground">{item.enrollments}</p>
                      <div className="mt-2 text-3xl font-bold text-primary">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Mais facilidade para divulgar</p>
                <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-5 w-5 text-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">
                      O parceiro conta com valores e condições especiais dedicadas, o que traz mais facilidade para divulgar a oportunidade e avançar nas indicações.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Como divulgar</p>
                <h3 className="mt-3 text-2xl font-bold">Canais simples para começar sem investir</h3>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {strategies.map((strategy) => {
                    const Icon = strategy.icon;
                    return (
                      <div key={strategy.title} className="rounded-2xl border border-border/60 bg-background p-5 shadow-soft">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="mt-4 text-lg font-semibold">{strategy.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{strategy.description}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-5 w-5 text-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">
                      Você não precisa investir nada para começar. O foco é usar sua rede, seu atendimento ou sua presença local e digital.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
                <Link to="/indique-e-ganhe/formulario">
                  Quero ser um parceiro de indicação
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}
