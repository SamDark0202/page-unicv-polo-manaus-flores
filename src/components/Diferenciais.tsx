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

            {/* Video Highlight */}
            <div className="mt-12 flex justify-center">
            <div className="relative aspect-video w-3/4 rounded-xl overflow-hidden shadow-md">
              <iframe
              width="560"
              height="315"
              src="https://www.youtube-nocookie.com/embed/FWPQRmwUGxA?si=j0sRjUtiahHn2hZ1&controls=0"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
              />
            </div>
            </div>

          {/* Diferenciais Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
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

        </div>
      </section>
    </>
  );
};

export default Diferenciais;
