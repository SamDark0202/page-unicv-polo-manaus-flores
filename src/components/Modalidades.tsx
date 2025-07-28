import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  BookOpen, 
  Briefcase, 
  Award,
  Clock,
  ArrowRight,
  Users,
  Star
} from "lucide-react";

const Modalidades = () => {
  const modalidades = [
    {
      icon: GraduationCap,
      title: "Graduação Bacharelado",
      subtitle: "4-5 anos",
      description: "Formação ampla e generalista, preparando profissionais para diversas áreas do mercado de trabalho.",
      highlights: ["Formação completa", "Mercado amplo", "Base sólida"],
      cursos: "28 cursos disponíveis",
      duracao: "4 a 5 anos",
      link: "/bacharelado",
      color: "bg-primary",
      examples: ["Administração", "Engenharias", "Psicologia", "Direito"]
    },
    {
      icon: BookOpen,
      title: "Graduação Licenciatura",
      subtitle: "3-4 anos",
      description: "Formação para atuar na educação, preparando professores para diversos níveis de ensino.",
      highlights: ["Carreira docente", "Estabilidade", "Impacto social"],
      cursos: "22 cursos disponíveis",
      duracao: "3 a 4 anos",
      link: "/licenciatura",
      color: "bg-accent",
      examples: ["Pedagogia", "Matemática", "História", "Letras"]
    },
    {
      icon: Briefcase,
      title: "Graduação Tecnólogo",
      subtitle: "1,5-2,5 anos",
      description: "Formação específica e prática, focada em competências técnicas para o mercado de trabalho.",
      highlights: ["Entrada rápida", "Foco prático", "Alta empregabilidade"],
      cursos: "75+ cursos disponíveis",
      duracao: "1,5 a 2,5 anos",
      link: "/tecnologo",
      color: "bg-warning",
      examples: ["Análise de Sistemas", "Marketing Digital", "Logística", "RH"],
      special: "Técnico → Tecnólogo em 1 ano"
    },
    {
      icon: Award,
      title: "Pós-Graduação",
      subtitle: "12-18 meses",
      description: "Especialização para aprofundar conhecimentos e alavancar sua carreira profissional.",
      highlights: ["Especialização", "Networking", "Crescimento profissional"],
      cursos: "200+ especializações",
      duracao: "12 a 18 meses",
      link: "/pos-graduacao",
      color: "bg-secondary",
      examples: ["MBA Gestão", "Direito Digital", "Educação Especial", "Engenharia"]
    }
  ];

  return (
    <section id="Modalidades" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Escolha sua modalidade
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">
            Modalidades de Curso
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Oferecemos diferentes modalidades de ensino para atender seus objetivos 
            profissionais e disponibilidade de tempo.
          </p>
        </div>

        {/* Modalidades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {modalidades.map((modalidade, index) => {
            const IconComponent = modalidade.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Color strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${modalidade.color}`}></div>
                
                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${modalidade.color} text-white mb-4 mx-auto`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl mb-2">{modalidade.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-primary">
                    {modalidade.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {modalidade.description}
                  </p>

                  {/* Special badge for Tecnólogo */}
                  {modalidade.special && (
                    <Badge variant="secondary" className="w-full mb-4 bg-warning/10 text-warning border-warning">
                      🚀 {modalidade.special}
                    </Badge>
                  )}

                  {/* Course info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cursos:</span>
                      <span className="font-medium">{modalidade.cursos}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-medium">{modalidade.duracao}</span>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-2">Exemplos:</div>
                    <div className="flex flex-wrap gap-1">
                      {modalidade.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2 mb-6">
                    {modalidade.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <Star className="h-3 w-3 text-warning fill-current" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                    <Link to={modalidade.link}>
                      Ver Cursos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Special Program Highlight */}
        <Card className="bg-gradient-accent text-accent-foreground shadow-floating">
          <CardContent className="p-8 lg:p-12">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Clock className="h-8 w-8" />
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Programa Exclusivo
                </Badge>
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                Técnico para Tecnólogo em 1 Ano
              </h3>
              <p className="text-xl text-accent-foreground/90 mb-8">
                Já possui curso técnico? Aproveite seus conhecimentos e conclua 
                sua graduação tecnóloga em tempo recorde!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">Aproveitamento</div>
                  <div className="text-sm opacity-90">de disciplinas técnicas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">1 Ano</div>
                  <div className="text-sm opacity-90">para conclusão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">Mesmo Diploma</div>
                  <div className="text-sm opacity-90">reconhecido pelo MEC</div>
                </div>
              </div>
              <Button variant="secondary" size="lg" className="text-lg px-8" asChild>
                <Link to="/tecnologo">
                  Saiba Mais sobre o Programa
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Modalidades;