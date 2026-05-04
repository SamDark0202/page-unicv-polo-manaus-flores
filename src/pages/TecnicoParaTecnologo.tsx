import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, BookOpenCheck, Rocket, Target, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";

interface CompatibleCourse {
  courseName: string;
  duration: string | null;
  installments: string | null;
  value: string | number | null;
  totalHours: string | number | null;
}

interface TechnicalCourse {
  id: string;
  name: string;
  compatibleCourses: CompatibleCourse[];
}

const DEFAULT_API_URL = "/api/cursos?tipo=tecnicos";
const API_URL = import.meta.env.VITE_TECNICO_TECNOLOGO_API_URL || DEFAULT_API_URL;
const WHATSAPP_PHONE = "559220201260";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_FETCH_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1200;

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

const normalize = (text: string) =>
  (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const toOptionalText = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
};

const toOptionalStringOrNumber = (value: unknown): string | number | null => {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
};

const formatCurrency = (value: string | number | null) => {
  if (value === null || value === "") return "-";
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && value.trim() !== "") {
    return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return value;
};

const formatDuration = (value: string | number | null) => {
  if (value === null || value === "") return "-";
  const text = String(value).trim();
  if (!text) return "-";
  if (/trimestre/i.test(text)) return text;
  return `${text} Trimestres`;
};

const formatHours = (value: string | number | null) => {
  if (value === null || value === "") return "-";
  const text = String(value).trim();
  if (!text) return "-";
  if (/hora/i.test(text)) return text;
  return `${text} Horas`;
};

const toWhatsappLink = (courseName: string) => {
  const message = `Olá! Tenho curso técnico e quero me matricular em ${courseName}. Pode me ajudar?`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number) => RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);

const shouldRetryFetch = (error: unknown) => {
  if (!(error instanceof ApiFetchError)) {
    return true;
  }

  if (error.code === "TIMEOUT") {
    return true;
  }

  if (typeof error.status === "number") {
    if (error.status >= 500) return true;
    if (error.status === 429 || error.status === 408) return true;
    return false;
  }

  return true;
};

function SimulatorLoadingState({ attempt }: { attempt: number }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando opções compatíveis...
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto liberamos a busca de cursos técnicos e as trilhas compatíveis.
        </p>
        <p className="text-xs text-muted-foreground/90 mt-1">Tentativa {attempt} de {MAX_FETCH_RETRIES}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border bg-card p-3 animate-pulse">
            <div className="h-3 w-2/3 bg-muted rounded mb-2" />
            <div className="h-3 w-4/5 bg-muted rounded mb-2" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function parseTechnicalCourses(payload: unknown): TechnicalCourse[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): TechnicalCourse | null => {
      if (!item || typeof item !== "object") return null;

      const technicalItem = item as Record<string, unknown>;
      const idValue = technicalItem.id;
      const nameValue = technicalItem.name;
      const offerGroupsValue = technicalItem.course_offer_groups;

      if ((typeof idValue !== "string" && typeof idValue !== "number") || typeof nameValue !== "string") {
        return null;
      }

      const unique = new Map<string, CompatibleCourse>();
      const offerGroups = Array.isArray(offerGroupsValue) ? offerGroupsValue : [];

      for (const offerGroup of offerGroups) {
        if (!offerGroup || typeof offerGroup !== "object") continue;

        const offer = offerGroup as Record<string, unknown>;
        const courseRaw = offer.course;
        const course = courseRaw && typeof courseRaw === "object" ? (courseRaw as Record<string, unknown>) : null;
        const courseName = toOptionalText(course?.name) || "Curso sem nome";
        const courseId = toOptionalText(course?.id) || `name:${courseName}`;

        if (!unique.has(courseId)) {
          unique.set(courseId, {
            courseName,
            duration: toOptionalText(offer.duration),
            installments: toOptionalText(offer.installments),
            value: toOptionalStringOrNumber(offer.value),
            totalHours: toOptionalStringOrNumber(offer.total_hours),
          });
        }
      }

      const compatibleCourses = Array.from(unique.values()).sort((a, b) =>
        a.courseName.localeCompare(b.courseName, "pt-BR")
      );

      return {
        id: String(idValue),
        name: nameValue,
        compatibleCourses,
      };
    })
    .filter((course): course is TechnicalCourse => course !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const TecnicoParaTecnologo = () => {
  const [technicalCourses, setTechnicalCourses] = useState<TechnicalCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnicalCourse, setSelectedTechnicalCourse] = useState<TechnicalCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(1);

  const suggestions = useMemo(() => {
    const query = normalize(searchTerm.trim());
    if (!query) return technicalCourses.slice(0, 12);
    return technicalCourses.filter((item) => normalize(item.name).includes(query)).slice(0, 12);
  }, [searchTerm, technicalCourses]);

  const handleSelectTechnicalCourse = (course: TechnicalCourse) => {
    setSelectedTechnicalCourse(course);
    setSearchTerm(course.name);
  };

  const fetchTechnicalCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedTechnicalCourse(null);
    setFetchAttempt(1);

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
      setFetchAttempt(attempt);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ApiFetchError(`Falha ao carregar cursos (HTTP ${response.status})`, response.status);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/json")) {
          throw new ApiFetchError("Resposta inválida da API de cursos.");
        }

        const payload = (await response.json()) as unknown;
        const parsed = parseTechnicalCourses(payload);
        setTechnicalCourses(parsed);

        if (!parsed.length) {
          setErrorMessage("Nenhum curso técnico disponível no momento.");
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
    setTechnicalCourses([]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTechnicalCourses();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
            Acelere sua Graduação
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">Evolua do Técnico ao Tecnólogo <br/> e avance na sua carreira</h1>
          <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
           Aproveite sua experiência e conquiste seu diploma de graduação <strong>em até 12 meses</strong>, abrindo novas oportunidades profissionais.
          </p>
          <a
            href="#simulador"
            className="inline-block mt-8 bg-warning text-warning-foreground font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
          >
            Simular minha trilha agora ↓
          </a>
          <div className="flex gap-6 justify-center flex-wrap text-sm font-semibold text-white/90 mt-6">
            <span>✓ Diploma reconhecido pelo MEC</span>
            <span>✓ 100% EAD</span>
            <span>✓ A partir de 12 meses</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-2">Como funciona em 3 passos</h2>
          <p className="text-muted-foreground mb-12">
            Você não começa do zero. Aproveitamos tudo que você já estudou.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-md">1</div>
              <h3 className="font-semibold text-lg">Informe seu técnico</h3>
              <p className="text-sm text-muted-foreground text-center">
                Digite o nome do seu curso técnico no simulador abaixo e veja quais tecnólogos são compatíveis com sua formação.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-md">2</div>
              <h3 className="font-semibold text-lg">Veja o que você já tem</h3>
              <p className="text-sm text-muted-foreground text-center">
                O sistema mostra quantas disciplinas você aproveita e quanto tempo e custo ainda falta para concluir o tecnólogo.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-md">3</div>
              <h3 className="font-semibold text-lg">Fale com um consultor</h3>
              <p className="text-sm text-muted-foreground text-center">
                Clique em "Matricule-se" no resultado do simulador e receba atendimento direto pelo WhatsApp para concluir a matrícula.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-subtle">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Rocket className="h-5 w-5" />,
                title: "Menos tempo",
                desc: "Conclua em até 12 meses aproveitando o que já estudou",
              },
              {
                icon: <CheckCircle2 className="h-5 w-5" />,
                title: "MEC reconhecido",
                desc: "Diploma com validade nacional em todo o Brasil",
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: "100% online",
                desc: "Estude no seu ritmo, sem sair de casa",
              },
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: "Suporte no WhatsApp",
                desc: "Consultor disponível para tirar todas as dúvidas",
              },
            ].map((item) => (
              <Card key={item.title} className="border-primary/20 shadow-soft text-center p-6">
                <div className="flex justify-center mb-3 text-primary">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="simulador" className="py-16 bg-gradient-subtle scroll-mt-20">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <Card className="border-primary/20 shadow-soft">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl lg:text-3xl">Simule sua Trilha de Formação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="technical-search" className="block text-sm font-semibold text-muted-foreground mb-2">
                  Informe seu curso técnico de origem
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="technical-search"
                    type="search"
                    placeholder={isLoading ? "Carregando cursos..." : "Ex.: Técnico em Automação Industrial"}
                    className="pl-9"
                    autoComplete="off"
                    value={searchTerm}
                    disabled={isLoading}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSelectedTechnicalCourse(null);
                    }}
                  />
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary absolute right-3 top-3" />}
                </div>

                {!selectedTechnicalCourse && !searchTerm.trim() && !isLoading && (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/70 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                    <Search className="h-10 w-10 text-primary/70" />
                    <p className="text-sm font-medium">Comece digitando o nome do seu curso técnico acima</p>
                  </div>
                )}

                {!isLoading && !selectedTechnicalCourse && searchTerm.trim() && suggestions.length > 0 && (
                  <Card className="mt-2 border-border">
                    <CardContent className="p-2">
                      <div className="grid gap-1">
                        {suggestions.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            variant="ghost"
                            className="justify-start h-auto whitespace-normal"
                            onClick={() => handleSelectTechnicalCourse(suggestion)}
                          >
                            {suggestion.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {isLoading && <SimulatorLoadingState attempt={fetchAttempt} />}
              {!isLoading && errorMessage && (
                <div className="space-y-3">
                  <div className="text-sm text-destructive">{errorMessage}</div>
                  <Button type="button" variant="outline" onClick={fetchTechnicalCourses}>
                    Tentar novamente
                  </Button>
                </div>
              )}

              {!isLoading && selectedTechnicalCourse && (
                <div className="space-y-4">

                  {selectedTechnicalCourse.compatibleCourses.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Não encontramos opções compatíveis para esse curso técnico no momento.
                        <Button variant="whatsapp" className="mt-4 w-full font-bold" asChild>
                          <a
                            href={`https://wa.me/559220201260?text=${encodeURIComponent(
                              `Olá! Tenho ${selectedTechnicalCourse.name} e não encontrei compatível. Podem me ajudar?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Falar com consultor no WhatsApp
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {selectedTechnicalCourse.compatibleCourses.length > 0 && (
                    <>
                      <div className="md:hidden space-y-3">
                        {selectedTechnicalCourse.compatibleCourses.map((course) => (
                          <Card key={`mobile-${course.courseName}`} className="overflow-hidden">
                            <CardContent className="p-4 space-y-4">
                              <h3 className="text-base font-semibold leading-snug">{course.courseName}</h3>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Tempo de Formação</p>
                                  <p className="font-medium">{formatDuration(course.duration)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Carga Horária</p>
                                  <p className="font-medium">{formatHours(course.totalHours)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Disciplinas</p>
                                  <p className="font-medium">{course.installments || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Plano de Pagamento</p>
                                  <p className="font-medium">1+12x de {formatCurrency(course.value)}</p>
                                </div>
                              </div>

                              <Button variant="whatsapp" className="w-full font-bold" asChild>
                                <a href={toWhatsappLink(course.courseName)} target="_blank" rel="noopener noreferrer">
                                  Matricule-se
                                </a>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="hidden md:block rounded-md border bg-background p-2 lg:p-3">
                        <Table className="min-w-[980px] [&_th]:px-5 [&_td]:px-5 [&_td]:py-5">
                          <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold [&_th]:h-auto [&_th]:py-4 [&_th]:text-base [&_th]:text-left">
                            <TableRow className="border-0 hover:bg-transparent">
                              <TableHead>Curso Tecnólogo</TableHead>
                              <TableHead>Tempo de Formação</TableHead>
                              <TableHead>Carga Horária a Cursar</TableHead>
                              <TableHead>Disciplinas a Cursar</TableHead>
                              <TableHead>Plano de Pagamento</TableHead>
                              <TableHead className="pr-8">Informações Sobre o Curso</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTechnicalCourse.compatibleCourses.map((course, index) => (
                              <TableRow
                                key={course.courseName}
                                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                              >
                                <TableCell className="text-base font-medium max-w-[360px]">{course.courseName}</TableCell>
                                <TableCell className="text-base whitespace-nowrap">{formatDuration(course.duration)}</TableCell>
                                <TableCell className="text-base whitespace-nowrap">{formatHours(course.totalHours)}</TableCell>
                                <TableCell className="text-base whitespace-nowrap">{course.installments || "-"}</TableCell>
                                <TableCell className="text-base whitespace-nowrap">1+12x de {formatCurrency(course.value)}</TableCell>
                                <TableCell className="pr-8">
                                  <div className="flex justify-end">
                                    <Button variant="whatsapp" size="sm" className="px-6 font-bold" asChild>
                                      <a href={toWhatsappLink(course.courseName)} target="_blank" rel="noopener noreferrer">
                                        Matricule-se
                                      </a>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8 border-primary/20 bg-white/80">
            <CardContent className="p-6 lg:p-8 grid md:grid-cols-[auto_1fr] gap-4 items-start">
              <BookOpenCheck className="h-8 w-8 text-primary" />
              <p className="text-muted-foreground">
                Este simulador apresenta possibilidades de aproveitamento com base no seu curso técnico.
                Para confirmar regras acadêmicas, documentos e prazos de matrícula, fale com nossa equipe no WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default TecnicoParaTecnologo;