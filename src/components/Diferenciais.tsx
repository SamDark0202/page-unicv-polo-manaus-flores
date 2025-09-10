import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Star,
  Users,
  Award,
  MapPin,
  Clock,
  CheckCircle,
  Trophy,
  BookOpen,
  Shield
} from "lucide-react";
import entrevistaMp4 from "../assets/entrevista_unicv.mp4";

const Diferenciais = () => {
  const diferenciais = [
    {
      icon: Star,
      title: "Nota Máxima MEC",
      description:
        "Instituição com conceito máximo no Ministério da Educação, garantindo qualidade e reconhecimento do seu diploma.",
      highlight: "Conceito 5",
      color: "text-warning"
    },
    {
      icon: MapPin,
      title: "900+ Polos Espalhados",
      description:
        "Presente em todo o Brasil com mais de 900 polos de apoio presencial para seu suporte acadêmico.",
      highlight: "900+ Polos",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Professores Mestres e Doutores",
      description:
        "Corpo docente altamente qualificado com mestres e doutores nas principais universidades do país.",
      highlight: "100% Qualificados",
      color: "text-accent"
    },
    {
      icon: Clock,
      title: "Técnico para Tecnólogo",
      description:
        "Programa exclusivo que permite concluir a graduação tecnóloga em até 1 ano para quem já tem curso técnico.",
      highlight: "Apenas 1 Ano",
      color: "text-warning"
    },
    {
      icon: BookOpen,
      title: "Metodologia Inovadora",
      description:
        "Ensino a distância com metodologia ativa, materiais digitais e suporte pedagógico completo.",
      highlight: "EAD Moderno",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Diploma Reconhecido",
      description:
        "Diplomas com validade nacional, reconhecidos pelo MEC e aceitos em concursos públicos e empresas.",
      highlight: "Validade Nacional",
      color: "text-accent"
    }
  ];

  return (
    <>
      <section className="py-16 lg:py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Por que escolher a UniCV?
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">
              Nossos Diferenciais
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mais de uma década formando profissionais de sucesso com qualidade
              reconhecida pelo MEC e metodologia inovadora de ensino.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">5.0</div>
                <div className="text-sm text-muted-foreground">Nota MEC</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">900+</div>
                <div className="text-sm text-muted-foreground">
                  Polos no Brasil
                </div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">
                  Professores Mestres
                </div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">15+</div>
                <div className="text-sm text-muted-foreground">
                  Anos de Experiência
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diferenciais Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diferenciais.map((diferencial, index) => {
              const IconComponent = diferencial.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 bg-background"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-primary ${diferencial.color}`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-foreground">
                            {diferencial.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {diferencial.highlight}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {diferencial.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Program Highlight */}
          <div className="mt-16">
            <Card className="bg-gradient-primary text-primary-foreground shadow-floating">
              <CardContent className="p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Trophy className="h-8 w-8 text-warning" />
                      <Badge
                        variant="secondary"
                        className="bg-warning text-warning-foreground"
                      >
                        Programa Exclusivo
                      </Badge>
                    </div>
                    <h3 className="text-3xl font-bold mb-4">
                      Técnico para Tecnólogo em 1 Ano
                    </h3>
                    <p className="text-lg text-primary-foreground/90 mb-6">
                      Se você já possui curso técnico, pode concluir sua
                      graduação tecnóloga em apenas 1 ano, aproveitando
                      conhecimentos já adquiridos.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span>
                          Aproveitamento de disciplinas do curso técnico
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span>Conclusão acelerada em até 12 meses</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span>Mesmo diploma reconhecido pelo MEC</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/10 p-8 rounded-2xl">
                      <div className="text-5xl font-bold mb-2">1 ANO</div>
                      <div className="text-xl">para se formar</div>
                      <div className="text-sm mt-2 opacity-90">
                        vs. 2-3 anos tradicional
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Adicionado no fim da sessão de Diferenciais: componente de vídeo / entrevista */}
      <section
        id="entrevista"
        className="mt-12 bg-gray-50/60 dark:bg-transparent rounded-lg p-6 shadow-sm"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 mb-3">
            Estamos em movimento — Entrevista com nosso gestor
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Nesta entrevista exclusiva, nosso gestor compartilha insights sobre as transformações no ensino EAD, responde às principais dúvidas e apresenta as iniciativas que já estão em andamento. Confira o vídeo e conheça de perto nossa atuação.
          </p>

          <div className="w-full">
            <div className="aspect-video w-full rounded-md overflow-hidden shadow-md">
              <video
                src={entrevistaMp4}
                controls
                controlsList="nodownload"
                playsInline
                className="w-full h-full object-cover bg-black"
                aria-label="Entrevista com o gestor sobre mudanças no ensino EAD"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Diferenciais;
