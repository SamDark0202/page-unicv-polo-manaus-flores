import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import CourseDetailDialog from "@/components/CourseDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoursesQuery } from "@/hooks/useCourses";
import type { Course } from "@/types/course";
import { Briefcase, Clock, Star, Zap, CheckCircle, Trophy, Search } from "lucide-react";
import { trackCardClick } from "@/lib/tracker";

const Tecnologo = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { data: courses = [], isLoading, error } = useCoursesQuery({ modality: "tecnologo", activeOnly: true });
  const fetchError = error instanceof Error ? error.message : null;

  const cursosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return courses;
    return courses.filter(
      (curso) =>
        curso.name.toLowerCase().includes(termo) ||
        curso.preview.toLowerCase().includes(termo)
    );
  }, [courses, searchTerm]);

  const totalCursos = courses.length;

  function handleOpenDetails(course: Course) {
    trackCardClick(course.name, { modality: "tecnologo" });
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  }

  function handleCloseDetails(openState: boolean) {
    setIsDetailsOpen(openState);
    if (!openState) {
      setSelectedCourse(null);
    }
  }

  const beneficios = [
    "Entrada rápida no mercado",
    "Foco prático e aplicado",
    "Alta empregabilidade",
    "Formação específica",
    "Menor tempo de estudo",
    "Custo-benefício otimizado"
  ];

  const programaEspecial = [
    "Aproveitamento de disciplinas do curso técnico",
    "Redução significativa do tempo de formação",
    "Mesmo diploma reconhecido pelo MEC",
    "Foco nas competências complementares",
    "Acompanhamento pedagógico especializado",
    "Certificação em tempo recorde"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
              Modalidade EAD
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Graduação Tecnólogo</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Entre rapidamente no mercado de trabalho com formação específica e prática.{" "}
              <strong>
                {isLoading ? "Cursos disponíveis" : `${totalCursos} cursos disponíveis`}
              </strong>{" "}
              com duração de 1,5 a 2,5 anos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{isLoading ? "--" : totalCursos}</div>
                  <div className="text-sm opacity-90">Cursos Disponíveis</div>
                </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">1,5-2,5</div>
                <div className="text-sm opacity-90">Anos de Duração</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">1</div>
                <div className="text-sm opacity-90">Ano (Técnico→Tecnólogo)</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#contato">Quero Entrar no Mercado Agora</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefícios dos Cursos Tecnólogos */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Por que Escolher um Curso Tecnólogo?</h2>
            <p className="text-xl text-muted-foreground">
              Os cursos tecnólogos são ideais para quem busca uma formação rápida, prática e focada no mercado de trabalho.
            </p>
          </div>

          {/* Video Highlight */}
          <div className="mt-12 flex justify-center">
            <div className="relative aspect-video w-3/4 rounded-xl overflow-hidden shadow-md">
              <video
                src="https://res.cloudinary.com/dtfcavqgi/video/upload/v1759689947/GRADUA%C3%87%C3%83O_EAD_COM_1_5_ANOS_zkth5e.mp4"
                loop
                autoPlay
                muted={false}
                controls
                controlsList="nodownload"
                className="min-w-full min-h-full absolute object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Cursos com Busca */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cursos Tecnólogos Disponíveis</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Mais de 75 opções de cursos tecnólogos reconhecidos pelo MEC
            </p>

            <div className="flex justify-center mb-8">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {isLoading && (
              <div className="col-span-full text-center text-muted-foreground">Carregando cursos...</div>
            )}

            {!isLoading && fetchError && (
              <div className="col-span-full text-center text-red-600">Erro ao carregar cursos.</div>
            )}

            {!isLoading && !fetchError && cursosFiltrados.map((curso) => (
              <Card key={curso.id} className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{curso.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{curso.duration}</span>
                      </div>
                    </div>
                    <Briefcase className="h-6 w-6 text-warning" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">{curso.preview}</CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm text-muted-foreground">Entrada rápida no mercado</span>
                        <span className="text-sm font-medium">MODALIDADE EAD</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleOpenDetails(curso)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            {!isLoading && !fetchError && cursosFiltrados.length === 0 && (
              <p className="text-muted-foreground">Nenhum curso encontrado. Tente outro termo de busca.</p>
            )}
            {!isLoading && searchTerm && (
              <Button variant="link" size="sm" onClick={() => setSearchTerm("")}>
                Ver todos os cursos
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Técnico para Tecnólogo em 1 Ano */}
      <section id="pgtec" className="py-16 bg-[#FFF8E7] text-neutral-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Trophy className="h-12 w-12" />
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-900 text-lg px-6 py-2">
                Programa Exclusivo
              </Badge>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Técnico para Tecnólogo em 1 Ano</h2>
            <p className="text-xl lg:text-2xl text-neutral-800 mb-8">
              Já possui curso técnico? Aproveite seus conhecimentos e conclua sua graduação tecnóloga em tempo recorde!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {programaEspecial.map((item, index) => (
                <Card key={index} className="bg-white/80 border border-neutral-300 text-neutral-900">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-3 text-warning" />
                    <p className="font-medium">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-white/90 p-8 rounded-2xl mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">70%</div>
                  <div className="text-lg">Tempo Reduzido</div>
                  <div className="text-sm opacity-90">vs. curso tradicional</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <div className="text-lg">Reconhecido MEC</div>
                  <div className="text-sm opacity-90">mesmo diploma</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">12</div>
                  <div className="text-lg">Meses Máximo</div>
                  <div className="text-sm opacity-90">para formatura</div>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="lg" className="text-lg px-8 w-full md:w-auto" asChild>
              <a href="#contato">Saiba como Aproveitar seu Técnico</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Solicite Mais Informações</h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre os cursos tecnólogos
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LeadForm
              title="Quero saber mais sobre Tecnólogo"
              description="Preencha o formulário e receba informações detalhadas sobre nossos cursos tecnólogos e o programa Técnico para Tecnólogo."
            />
          </div>
        </div>
      </section>

      <Footer />

      <CourseDetailDialog
        course={selectedCourse}
        open={isDetailsOpen}
        onOpenChange={handleCloseDetails}
      />
    </div>
  );
};

export default Tecnologo;
