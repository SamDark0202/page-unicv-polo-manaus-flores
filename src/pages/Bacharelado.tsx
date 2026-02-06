import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import CourseDetailDialog from "@/components/CourseDetailDialog";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoursesQuery } from "@/hooks/useCourses";
import type { Course } from "@/types/course";
import { GraduationCap, Clock, Star, CheckCircle, Search } from "lucide-react";
import { trackCardClick } from "@/lib/tracker";

const Bacharelado = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { data: courses = [], isLoading, error } = useCoursesQuery({ modality: "bacharelado", activeOnly: true });
  const fetchError = error instanceof Error ? error.message : null;

  const beneficios = [
    "Formação ampla e generalista",
    "Preparação para diversas áreas do mercado",
    "Base sólida para carreira profissional",
    "Possibilidade de pós-graduação",
    "Reconhecimento pelo MEC",
    "Diploma com validade nacional"
  ];

  const cursosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return courses;
    return courses.filter((curso) =>
      curso.name.toLowerCase().includes(termo) ||
      curso.preview.toLowerCase().includes(termo)
    );
  }, [courses, searchTerm]);

  const totalCursos = courses.length;

  function handleOpenDetails(course: Course) {
    trackCardClick(course.name, { modality: "bacharelado" });
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  }

  function handleCloseDetails(openState: boolean) {
    setIsDetailsOpen(openState);
    if (!openState) {
      setSelectedCourse(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
              Modalidade EAD
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Graduação Bacharelado</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Formação completa e ampla para sua carreira profissional.{" "}
              <strong>
                {isLoading ? "Cursos disponíveis" : `${totalCursos} cursos disponíveis`}
              </strong>{" "}
              com duração de 3 a 5 anos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{isLoading ? "--" : totalCursos}</div>
                  <div className="text-sm opacity-90">Cursos Disponíveis</div>
                </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">3-5</div>
                <div className="text-sm opacity-90">Anos de Duração</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-sm opacity-90">Reconhecido MEC</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#contato">Quero me Inscrever</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Por que escolher Bacharelado?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              O bacharelado oferece formação ampla e sólida, preparando você para atuar em diversas áreas do mercado de trabalho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="text-center shadow-soft hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-6">
                  <CheckCircle className="h-8 w-8 text-accent mx-auto mb-3" />
                  <p className="font-medium">{beneficio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de cursos com busca */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cursos de Bacharelado Disponíveis</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Escolha entre nossos 28 cursos de bacharelado reconhecidos pelo MEC
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
              <div className="col-span-full text-center text-red-600">
                Erro ao carregar cursos. Tente novamente mais tarde.
              </div>
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
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {curso.preview}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm text-muted-foreground">Reconhecido pelo MEC</span>
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

          {!isLoading && !fetchError && cursosFiltrados.length === 0 && (
            <p className="text-center text-muted-foreground">Não possuímos o curso no momento.</p>
          )}
        </div>
      </section>

      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Solicite Mais Informações</h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre os cursos de bacharelado
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LeadForm 
              title="Quero saber mais sobre Bacharelado"
              description="Preencha o formulário e receba informações detalhadas sobre nossos cursos de bacharelado e condições especiais."
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

export default Bacharelado;