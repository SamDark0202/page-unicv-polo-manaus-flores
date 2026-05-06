import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { useMemo, useState } from "react";
import { normalizeText } from "@/utils/normalize";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoursesQuery } from "@/hooks/useCourses";
import { GraduationCap, Clock, Star, CheckCircle, Search } from "lucide-react";
import { trackCardClick } from "@/lib/tracker";
import { Link } from "react-router-dom";
import { buildCoursePath } from "@/lib/courseRoute";

const Bacharelado = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: courses = [], isLoading, error } = useCoursesQuery({ modality: "bacharelado", activeOnly: true });
  const fetchError = error instanceof Error ? error.message : null;

  const beneficios = [
    "Preparação para diversas áreas do mercado",
    "Base sólida para carreira profissional",
    "Reconhecimento pelo MEC",
    "Diploma com validade nacional"
  ];

  const cursosFiltrados = useMemo(() => {
    const termo = normalizeText(searchTerm.trim());
    if (!termo) return courses;
    return courses.filter((curso) =>
      normalizeText(curso.name).includes(termo) ||
      normalizeText(curso.preview).includes(termo)
    );
  }, [courses, searchTerm]);

  const totalCursos = courses.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
              Modalidade EAD/SEMIPRESENCIAL
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
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
              <Card key={curso.id} className="group overflow-hidden border border-border/70 hover:border-primary/40 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                {curso.imageUrl && (
                  <div className="relative overflow-hidden border-b">
                    <img src={curso.imageUrl} alt={curso.name} className="aspect-video w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    <div className="absolute left-3 top-3">
                      <Badge variant="secondary" className="bg-white/95 text-foreground shadow-sm">
                        {curso.deliveryMode === "semipresencial" ? "Semipresencial" : "EAD"}
                      </Badge>
                    </div>
                  </div>
                )}
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight mb-1.5 line-clamp-2">{curso.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{curso.duration}</span>
                      </div>
                    </div>
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <CardDescription className="text-sm leading-relaxed line-clamp-2 min-h-[2.75rem]">
                    {curso.preview}
                  </CardDescription>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-2.5 py-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-3.5 w-3.5 text-warning fill-current" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground">Reconhecido pelo MEC</span>
                        <span className="text-xs font-medium">{curso.deliveryMode === "semipresencial" ? "SEMIPRESENCIAL" : "MODALIDADE EAD"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="default"
                      asChild
                      className="w-full"
                      onClick={() => trackCardClick(curso.name, { modality: "bacharelado" })}
                    >
                      <Link to={buildCoursePath(curso)}>Ver detalhes</Link>
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">Veja matriz curricular, mercado e requisitos</p>
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
    </div>
  );
};

export default Bacharelado;