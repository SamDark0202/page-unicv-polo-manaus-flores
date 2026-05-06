import { useMemo, useState } from "react";
import { normalizeText } from "@/utils/normalize";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoursesQuery } from "@/hooks/useCourses";
import { Briefcase, Clock, Star, Zap, CheckCircle, Trophy, Search } from "lucide-react";
import { trackCardClick } from "@/lib/tracker";
import { buildCoursePath } from "@/lib/courseRoute";

const Tecnologo = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: courses = [], isLoading, error } = useCoursesQuery({ modality: "tecnologo", activeOnly: true });
  const fetchError = error instanceof Error ? error.message : null;

  const cursosFiltrados = useMemo(() => {
    const termo = normalizeText(searchTerm.trim());
    if (!termo) return courses;
    return courses.filter(
      (curso) =>
        normalizeText(curso.name).includes(termo) ||
        normalizeText(curso.preview).includes(termo)
    );
  }, [courses, searchTerm]);

  const totalCursos = courses.length;

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
            <Button variant="hero" size="lg" asChild>
              <a href="#cursos-tecnologo">Explorar Cursos</a>
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
              <iframe
              width="560"
              height="315"
              src="https://www.youtube-nocookie.com/embed/T7Rwv6IpCg4?si=j0sRjUtiahHn2hZ1&controls=0"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
              />
            </div>
            </div>
        </div>
      </section>

      {/* Lista de Cursos com Busca */}
      <section id="cursos-tecnologo" className="py-16">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
            {isLoading && (
              <div className="col-span-full text-center text-muted-foreground">Carregando cursos...</div>
            )}

            {!isLoading && fetchError && (
              <div className="col-span-full text-center text-red-600">Erro ao carregar cursos.</div>
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
                    <Briefcase className="h-5 w-5 text-warning" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <CardDescription className="text-sm leading-relaxed line-clamp-2 min-h-[2.75rem]">{curso.preview}</CardDescription>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-2.5 py-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-3.5 w-3.5 text-warning fill-current" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground">Entrada rápida no mercado</span>
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
                      onClick={() => trackCardClick(curso.name, { modality: "tecnologo" })}
                    >
                      <Link to={buildCoursePath(curso)}>Ver detalhes</Link>
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">Veja matriz curricular, mercado e requisitos</p>
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
              <Link to="/tecnico-para-tecnologo">Saiba como Aproveitar seu Técnico</Link>
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
    </div>
  );
};

export default Tecnologo;
