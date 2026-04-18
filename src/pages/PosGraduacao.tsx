import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Award, BookOpen, CheckCircle, Clock, Loader2, MessageCircle, Search, Star, Target, TrendingUp } from "lucide-react";
import { usePostPlusCarouselQuery } from "@/hooks/usePostPlusCarousel";
import { toSupabaseRenderImageUrl } from "@/lib/supabaseImage";
import { trackCardClick } from "@/lib/tracker";

type PostGraduateCourse = {
  id: string;
  name: string;
  url: string;
  image_url: string;
  duration_hours: string;
  old_price: string;
  current_price: string;
  installment_price: string;
  level: string;
};

type PostGraduateApiResponse = {
  updated_at: string;
  total_pages: number;
  total_courses: number;
  courses: PostGraduateCourse[];
};

const DEFAULT_API_URL = "/api/pos-graduacao";
const API_URL = import.meta.env.VITE_POS_GRADUACAO_API_URL || DEFAULT_API_URL;
const API_FALLBACK_URL = "https://www.unicivepoloam.com.br/api/pos-graduacao";
const WHATSAPP_PHONE = "559220201260";
const REQUEST_TIMEOUT_MS = 25000;
const MAX_FETCH_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 1200;
const PAGE_SIZE = 12;

class ApiFetchError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.code = code;
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number) => RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);

const shouldRetryFetch = (error: unknown) => {
  if (!(error instanceof ApiFetchError)) return true;
  if (error.code === "TIMEOUT") return true;

  if (typeof error.status === "number") {
    if (error.status >= 500) return true;
    if (error.status === 429 || error.status === 408) return true;
    return false;
  }

  return true;
};

const normalize = (text: string) =>
  (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const formatPrice = (value: string) => {
  const clean = (value || "").replace(/\./g, "").replace(",", ".").trim();
  const numberValue = Number(clean);
  if (!Number.isNaN(numberValue) && numberValue > 0) {
    return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value || "-";
};

const formatDuration = (value: string) => {
  const text = (value || "").trim();
  if (!text) return "Carga horária sob consulta";
  return `${text} horas`;
};

const toWhatsappLink = (courseName: string) => {
  const message = `Olá! Tenho interesse no curso de Pós-Graduação em ${courseName}. Pode me ajudar com valores e matrícula?`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

const parseApiPayload = (raw: string): PostGraduateApiResponse => {
  try {
    return JSON.parse(raw) as PostGraduateApiResponse;
  } catch {
    throw new ApiFetchError("Resposta inválida da API de pós-graduação.");
  }
};

function PostGraduateSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="h-44 animate-pulse bg-muted" />
          <CardContent className="p-5 space-y-3">
            <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-10 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Agronegócio", keywords: ["agronegócio", "agronegocio", "agricultura", "agrometeorologia", "agro"] },
  { label: "Comunicação e Design", keywords: ["comunicação", "comunicacao", "design", "mídia", "midia", "jornalismo", "publicidade", "marketing"] },
  { label: "Direito", keywords: ["direito", "advocacia", "jurídico", "juridico", "tributário", "tributario", "constitucional", "penal"] },
  { label: "Educação", keywords: ["educação", "educacao", "pedagogia", "docencia", "docência", "ensino", "alfabetização", "alfabetizacao", "letramento", "metodologia"] },
  { label: "Engenharia", keywords: ["engenharia", "engenheiro", "civil", "produção", "producao", "estrutura", "construção", "construcao"] },
  { label: "Gestão Contábil e Financeira", keywords: ["contábil", "contabil", "contabilidade", "financ", "tribut", "auditoria", "fiscal", "tributos"] },
  { label: "Gestão Pública", keywords: ["pública", "publica", "municipal", "governo", "estratégica", "estrategica", "gestão p", "gestao p", "administração pública", "administracao publica"] },
  { label: "Medicina Veterinária", keywords: ["veterinár", "veterinar", "animal", "zoonose", "zootecnia"] },
  { label: "Negócios", keywords: ["negócios", "negocios", "mba", "gestão", "gestao", "empreende", "liderança", "lideranca", "logística", "logistica", "comercial", "varejo"] },
  { label: "Saúde", keywords: ["saúde", "saude", "enferma", "médico", "medico", "hospitalar", "clínic", "clinic", "nutrição", "nutricao", "farmácia", "farmacia", "psicolog", "odontolog", "fisioterapia"] },
  { label: "Tecnologia", keywords: ["tecnologia", "ti ", "t.i.", "sistemas", "informática", "informatica", "software", "dados", "inteligência", "inteligencia", "digital", "cyber", "segurança da informação"] },
];

const matchesCategory = (courseName: string, cat: { keywords: string[] }) => {
  const n = normalize(courseName);
  return cat.keywords.some((kw) => n.includes(normalize(kw)));
};

const PosGraduacao = () => {
  const [courses, setCourses] = useState<PostGraduateCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
    setCurrentPage(1);
  };

  const { data: carouselItems = [] } = usePostPlusCarouselQuery({ activeOnly: true });

  const filteredCourses = useMemo(() => {
    const query = normalize(searchTerm.trim());
    return courses.filter((course) => {
      const matchesSearch = !query || normalize(course.name).includes(query);
      const matchesCat =
        selectedCategories.length === 0 ||
        selectedCategories.some((label) => {
          const cat = CATEGORIES.find((c) => c.label === label);
          return cat ? matchesCategory(course.name, cat) : false;
        });
      return matchesSearch && matchesCat;
    });
  }, [courses, searchTerm, selectedCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const visibleCourses = useMemo(
    () => filteredCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredCourses, currentPage]
  );

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setFetchAttempt(1);

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
      setFetchAttempt(attempt);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const shouldTryFallback =
          attempt > 1 &&
          !!API_FALLBACK_URL &&
          API_FALLBACK_URL !== API_URL;

        const endpoint = shouldTryFallback ? API_FALLBACK_URL : API_URL;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ApiFetchError(`Falha ao carregar cursos (HTTP ${response.status})`, response.status);
        }

        const body = await response.text();
        const payload = parseApiPayload(body);
        const parsed = Array.isArray(payload?.courses) ? payload.courses : [];

        setCourses(parsed);
        setCurrentPage(1);

        if (parsed.length === 0) {
          setErrorMessage("Nenhum curso de pós-graduação disponível no momento.");
        }

        setIsLoading(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          lastError = new ApiFetchError("Tempo de resposta da API excedido.", undefined, "TIMEOUT");
        } else {
          lastError = error;
        }

        if (attempt < MAX_FETCH_RETRIES && shouldRetryFetch(lastError)) {
          await wait(getBackoffDelay(attempt));
          continue;
        }

        break;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    const message =
      lastError instanceof Error
        ? `${lastError.message} Tentamos automaticamente ${MAX_FETCH_RETRIES} vezes.`
        : `Erro inesperado ao consultar cursos. Tentamos automaticamente ${MAX_FETCH_RETRIES} vezes.`;

    setErrorMessage(message);
    setCourses([]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const beneficios = [
    "Especialização em área específica",
    "Networking profissional",
    "Crescimento na carreira",
    "Aumento salarial",
    "Atualização profissional",
    "Diferencial competitivo",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-accent text-accent-foreground">
              Modalidade EAD
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Pós-Graduação</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Especialize-se e acelere sua carreira profissional.
              <strong> Escolha sua especialização e fale com nosso time em um clique.</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{courses.length > 0 ? `${courses.length}+` : "200+"}</div>
                <div className="text-sm opacity-90">Especializações</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">360h+</div>
                <div className="text-sm opacity-90">Carga horária</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">EAD</div>
                <div className="text-sm opacity-90">Flexível para sua rotina</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#cursos-pos">Quero me Especializar</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Por que fazer uma Pós-Graduação?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A pós-graduação é o caminho para se destacar no mercado de trabalho e conquistar melhores oportunidades.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <div className="relative aspect-video w-3/4 rounded-xl overflow-hidden shadow-md">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube-nocookie.com/embed/HOQDYtVpCFg?si=X4Rw2deuXXa84d-D&amp;controls=0"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mt-12">
            {beneficios.map((beneficio) => (
              <Card key={beneficio} className="text-center shadow-soft hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-6">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-3" />
                  <p className="font-medium">{beneficio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-primary text-primary-foreground shadow-floating">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-4">Impacto da Pós-Graduação</h3>
                <p className="text-xl text-primary-foreground/90">Dados do mercado sobre profissionais especializados</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">40%</div>
                  <div className="text-sm opacity-90">Aumento salarial médio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">75%</div>
                  <div className="text-sm opacity-90">Melhores oportunidades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">90%</div>
                  <div className="text-sm opacity-90">Satisfação profissional</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="cursos-pos" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Catálogo de Especializações</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Encontre a pós ideal para seu momento profissional e fale direto com nosso atendimento no WhatsApp para saber mais sobre o curso desejado.
              
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Painel de categorias */}
            <Card className="lg:w-64 shrink-0 shadow-soft border-primary/20 h-fit">
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-4">Encontre o Curso</p>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const checked = selectedCategories.includes(cat.label);
                    return (
                      <label
                        key={cat.label}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <span
                          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            checked
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/40 group-hover:border-primary/60"
                          }`}
                          onClick={() => toggleCategory(cat.label)}
                        >
                          {checked && (
                            <svg viewBox="0 0 10 8" className="h-3 w-3 text-white fill-current">
                              <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm ${checked ? "font-medium text-foreground" : "text-muted-foreground"}`}
                          onClick={() => toggleCategory(cat.label)}
                        >
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    className="mt-4 text-xs text-primary underline underline-offset-2"
                    onClick={() => { setSelectedCategories([]); setCurrentPage(1); }}
                  >
                    Limpar filtros
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Coluna direita: busca + grid */}
            <div className="flex-1 min-w-0">
              <Card className="mb-6 shadow-soft border-primary/20">
                <CardContent className="p-5">
                  <label htmlFor="pos-search" className="text-sm font-medium text-muted-foreground mb-2 block">
                    Buscar curso por nome
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pos-search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Ex.: Administração Hospitalar, Direito Tributário, Inteligência Artificial..."
                      className="pl-10"
                    />
                  </div>
                  {filteredCourses.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {filteredCourses.length} curso{filteredCourses.length !== 1 ? "s" : ""} encontrado{filteredCourses.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>

              {isLoading && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando catálogo de pós-graduação...
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Aguarde um momento. Estamos trazendo os cursos disponíveis e atualizando os valores.
                </p>
                <p className="text-xs text-muted-foreground/90 mt-1">
                  Tentativa {fetchAttempt} de {MAX_FETCH_RETRIES}
                </p>
              </div>
              <PostGraduateSkeleton />
            </div>
          )}

          {!isLoading && errorMessage && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-destructive">Não foi possível carregar os cursos</h3>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                </div>
                <Button variant="outline" onClick={fetchCourses}>Tentar novamente</Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !errorMessage && filteredCourses.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Nenhum curso encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente outro termo de busca para encontrar sua especialização.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !errorMessage && filteredCourses.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visibleCourses.map((course) => {
                  const whatsappUrl = toWhatsappLink(course.name);

                  return (
                    <Card key={`${course.id}-${course.name}`} className="overflow-hidden border-primary/10 hover:shadow-elevated transition-all duration-300 group">
                      <div className="relative h-48 overflow-hidden bg-muted">
                        {course.image_url ? (
                          <img
                            src={course.image_url}
                            alt={course.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-subtle flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 bg-black/75 text-white border-0">{course.level || "Pós-Graduação"}</Badge>
                      </div>

                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg leading-tight min-h-[3.5rem]">{course.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {formatDuration(course.duration_hours)}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs text-muted-foreground">Investimento</p>
                          {course.old_price ? (
                            <p className="text-xs text-muted-foreground line-through">De {formatPrice(course.old_price)}</p>
                          ) : null}
                          <p className="text-base font-bold text-primary">Por {formatPrice(course.current_price)}</p>
                          {course.installment_price ? (
                            <p className="text-xs text-muted-foreground">1 + 12x de {formatPrice(course.installment_price)}</p>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            className="w-full"
                            asChild
                            onClick={() => {
                              trackCardClick(course.name, {
                                source: "pos_graduacao_whatsapp",
                                course_id: course.id,
                                course_name: course.name,
                                destination_url: whatsappUrl,
                              });
                            }}
                          >
                            <a href={whatsappUrl} target="_blank" rel="noreferrer">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Falar no WhatsApp
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1 flex-wrap">
                  <span className="text-sm text-muted-foreground mr-3">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    &lsaquo;
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={item}
                          variant={item === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setCurrentPage(item as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          {item}
                        </Button>
                      )
                    )
                  }
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    &rsaquo;
                  </Button>
                </div>
              )}
            </>
          )}
            </div>{/* fim coluna direita */}
          </div>{/* fim flex */}
        </div>
      </section>

      {carouselItems.length > 0 && (
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#02683E] via-[#024a2d] to-black">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16 space-y-6">
              <div className="flex justify-center animate-pulse">
                <Badge className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-[#ce9e0d] via-[#f4d03f] to-[#ce9e0d] text-black border-0 shadow-2xl">
                  <Star className="h-4 w-4 mr-2 fill-current" />
                  EXCLUSIVO Unicive
                </Badge>
              </div>

              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white">
                Cursos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ce9e0d] to-[#f4d03f]">Pós+</span>
              </h2>

              <p className="text-lg lg:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Programas de alto nível com proposta acadêmica diferenciada e posicionamento premium para sua carreira.
              </p>
            </div>

            <Carousel className="w-full max-w-6xl mx-auto" opts={{ loop: carouselItems.length > 1, align: "center" }}>
              <CarouselContent className="-ml-4">
                {carouselItems.map((item) => (
                  <CarouselItem key={item.id} className="pl-4">
                    <div className="relative group flex justify-center items-center">
                      <div className="relative inline-block rounded-2xl bg-gradient-to-br from-[#ce9e0d] via-[#f4d03f] to-[#02683E] p-[3px] shadow-2xl">
                        <div className="absolute -inset-[2px] bg-gradient-to-br from-[#ce9e0d]/60 via-[#f4d03f]/40 to-[#02683E]/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 group-hover:blur-xl transition-all duration-500 -z-10" />

                        {item.targetUrl ? (
                          <a
                            href={item.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() =>
                              trackCardClick(item.bannerName, {
                                source: "post_plus_banner",
                                banner_id: item.id,
                                banner_name: item.bannerName,
                                destination_url: item.targetUrl,
                              })
                            }
                            aria-label={item.bannerName}
                            title={item.bannerName}
                            className="block rounded-[14px] overflow-hidden bg-black"
                          >
                            <picture>
                              <source
                                media="(min-width: 768px)"
                                srcSet={toSupabaseRenderImageUrl(item.imageUrl, {
                                  width: 1400,
                                  quality: 68,
                                  format: "webp",
                                  resize: "contain",
                                })}
                              />
                              <img
                                src={toSupabaseRenderImageUrl(item.mobileImageUrl, {
                                  width: 900,
                                  quality: 68,
                                  format: "webp",
                                  resize: "cover",
                                })}
                                alt={item.metaDescription}
                                loading="lazy"
                                decoding="async"
                                className="w-full max-w-[500px] md:max-w-full h-auto aspect-square md:aspect-auto md:h-[420px] lg:h-[480px] md:w-auto object-cover md:object-contain rounded-[14px] transition-all duration-500 group-hover:scale-[1.02]"
                              />
                            </picture>
                          </a>
                        ) : (
                          <div className="rounded-[14px] overflow-hidden bg-black">
                            <picture>
                              <source
                                media="(min-width: 768px)"
                                srcSet={toSupabaseRenderImageUrl(item.imageUrl, {
                                  width: 1400,
                                  quality: 68,
                                  format: "webp",
                                  resize: "contain",
                                })}
                              />
                              <img
                                src={toSupabaseRenderImageUrl(item.mobileImageUrl, {
                                  width: 900,
                                  quality: 68,
                                  format: "webp",
                                  resize: "cover",
                                })}
                                alt={item.metaDescription}
                                loading="lazy"
                                decoding="async"
                                title={item.metaDescription}
                                className="w-full max-w-[500px] md:max-w-full h-auto aspect-square md:aspect-auto md:h-[420px] lg:h-[480px] md:w-auto object-cover md:object-contain rounded-[14px] transition-all duration-500 group-hover:scale-[1.02]"
                              />
                            </picture>
                          </div>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {carouselItems.length > 1 && (
                <>
                  <CarouselPrevious className="left-0 lg:-left-12 bg-gradient-to-br from-[#02683E] to-[#024a2d] border-2 border-[#ce9e0d] hover:border-[#f4d03f] text-white hover:scale-110 transition-all duration-300 shadow-xl" />
                  <CarouselNext className="right-0 lg:-right-12 bg-gradient-to-br from-[#02683E] to-[#024a2d] border-2 border-[#ce9e0d] hover:border-[#f4d03f] text-white hover:scale-110 transition-all duration-300 shadow-xl" />
                </>
              )}
            </Carousel>
          </div>
        </section>
      )}

      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Solicite Mais Informações</h2>
            <p className="text-xl text-muted-foreground">Nossa equipe está pronta para esclarecer suas dúvidas sobre as especializações</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LeadForm
              title="Quero saber mais sobre Pós-Graduação"
              description="Preencha o formulário e receba informações detalhadas sobre nossas especializações e condições especiais."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PosGraduacao;
