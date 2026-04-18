import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, BookOpenCheck, Rocket, Target, CheckCircle2, MessageCircle, Loader2, FileDown, GraduationCap, Award } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SecondGradOption {
  courseName: string;
  duration: string | null;
  totalHours: string | number | null;
  totalDisciplines: string | number | null;
  installments: string | null;
  value: string | number | null;
  matriceFileUrl: string | null;
}

interface GraduationCourse {
  id: string;
  name: string;
  secondGradOptions: SecondGradOption[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_API_URL = "/api/cursos?tipo=segunda-graduacao";
const API_URL = import.meta.env.VITE_SEGUNDA_GRADUACAO_API_URL || DEFAULT_API_URL;
const WHATSAPP_PHONE = "559220201260";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_FETCH_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1200;
const UNICV_BASE_URL = "https://diariodebordo.unicv.edu.br";

// ─────────────────────────────────────────────────────────────────────────────
// Error class
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

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
  if (!Number.isNaN(numberValue) && String(value).trim() !== "") {
    return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value;
};

const formatDuration = (value: string | null) => {
  if (!value) return "-";
  const text = value.trim();
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

const toWhatsappLink = (originCourse: string, targetCourse: string) => {
  const message = `Olá! Tenho graduação em ${originCourse} e quero me matricular na 2ª Graduação em ${targetCourse}. Pode me ajudar?`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

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

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SimulatorLoadingState({ attempt }: { attempt: number }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando opções de 2ª Graduação...
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde enquanto buscamos os cursos de graduação e as opções compatíveis de 2ª Graduação.
        </p>
        <p className="text-xs text-muted-foreground/90 mt-1">
          Tentativa {attempt} de {MAX_FETCH_RETRIES}
        </p>
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

// ─────────────────────────────────────────────────────────────────────────────
// Data parser
// ─────────────────────────────────────────────────────────────────────────────

function parseGraduationCourses(payload: unknown): GraduationCourse[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): GraduationCourse | null => {
      if (!item || typeof item !== "object") return null;

      const raw = item as Record<string, unknown>;
      const idValue = raw.id;
      const nameValue = raw.name;
      const offerGroupsValue = raw.course_offer_groups;

      if ((typeof idValue !== "string" && typeof idValue !== "number") || typeof nameValue !== "string") {
        return null;
      }

      const unique = new Map<string, SecondGradOption>();
      const offerGroups = Array.isArray(offerGroupsValue) ? offerGroupsValue : [];

      for (const offerGroup of offerGroups) {
        if (!offerGroup || typeof offerGroup !== "object") continue;

        const offer = offerGroup as Record<string, unknown>;
        const courseRaw = offer.course;
        const course =
          courseRaw && typeof courseRaw === "object" ? (courseRaw as Record<string, unknown>) : null;
        const courseName = toOptionalText(course?.name) || "Curso sem nome";
        const courseId = toOptionalText(course?.id) || `name:${courseName}`;

        // Extract matrice_file URL
        const matriceFileRaw = offer.matrice_file;
        const matriceFile =
          matriceFileRaw && typeof matriceFileRaw === "object"
            ? (matriceFileRaw as Record<string, unknown>)
            : null;
        const matriceFileUrlRaw = matriceFile ? toOptionalText(matriceFile.url) : null;
        const matriceFileUrl = matriceFileUrlRaw ? `${UNICV_BASE_URL}${matriceFileUrlRaw}` : null;

        if (!unique.has(courseId)) {
          unique.set(courseId, {
            courseName,
            duration: toOptionalText(offer.duration),
            totalHours: toOptionalStringOrNumber(offer.total_hours),
            totalDisciplines: toOptionalStringOrNumber(offer.total_disciplines),
            installments: toOptionalText(offer.installments),
            value: toOptionalStringOrNumber(offer.value),
            matriceFileUrl,
          });
        } else if (!unique.get(courseId)!.matriceFileUrl && matriceFileUrl) {
          // Preserve matrice URL if found in a later offer group for same course
          const existing = unique.get(courseId)!;
          unique.set(courseId, { ...existing, matriceFileUrl });
        }
      }

      const secondGradOptions = Array.from(unique.values()).sort((a, b) =>
        a.courseName.localeCompare(b.courseName, "pt-BR")
      );

      return {
        id: String(idValue),
        name: nameValue,
        secondGradOptions,
      };
    })
    .filter((course): course is GraduationCourse => course !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

const SegundaGraduacao = () => {
  const [graduationCourses, setGraduationCourses] = useState<GraduationCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<GraduationCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(1);

  const suggestions = useMemo(() => {
    const query = normalize(searchTerm.trim());
    if (!query) return graduationCourses.slice(0, 12);
    return graduationCourses.filter((item) => normalize(item.name).includes(query)).slice(0, 12);
  }, [searchTerm, graduationCourses]);

  const handleSelectCourse = (course: GraduationCourse) => {
    setSelectedCourse(course);
    setSearchTerm(course.name);
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedCourse(null);
    setFetchAttempt(1);

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
      setFetchAttempt(attempt);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ApiFetchError(`Falha ao carregar cursos (HTTP ${response.status})`, response.status);
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new ApiFetchError("Resposta inválida da API de cursos.");
        }
        const parsed = parseGraduationCourses(payload);
        setGraduationCourses(parsed);

        if (!parsed.length) {
          setErrorMessage("Nenhum curso de graduação disponível no momento.");
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
    setGraduationCourses([]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
            2ª Graduação
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
           Acelere sua carreira com uma <br />Segunda Graduação
          </h1>
          <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
            Conquiste um novo diploma de nível superior em até 24 meses, aproveitando disciplinas da sua formação anterior.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 max-w-[1400px]">

          {/* Info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20 shadow-soft">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline">Vantagens</Badge>
                </div>
                <CardTitle className="text-xl">Ganhos reais para quem já é Graduado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Aproveite disciplinas já cursadas e reduza tempo e custo da sua 2ª graduação
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Conclua sua nova graduação entre 6 e 24 meses e amplie suas oportunidades profissionais
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Estude no seu ritmo com diplomas reconhecidos pelo MEC, nas modalidades EAD e semipresencial
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-soft">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline">Passo a passo</Badge>
                </div>
                <CardTitle className="text-xl">Visualize seu próximo passo com clareza</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    No simulador, informe o curso da sua <strong className="text-foreground">1ª Graduação</strong> e veja quais cursos você pode fazer como 2ª Graduação.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Baixe a <strong className="text-foreground">Matriz Curricular</strong> do curso de interesse para conhecer as disciplinas.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Clique em <strong className="text-foreground">Matricule-se</strong> e receba atendimento direto no WhatsApp do polo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Simule Sua 2ª Graduação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="graduation-search" className="block text-sm font-semibold text-muted-foreground mb-2">
                  Informe o curso da sua 1ª Graduação
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="graduation-search"
                    type="search"
                    placeholder={
                      isLoading ? "Carregando cursos..." : "Ex.: Bacharelado em Administração"
                    }
                    className="pl-9"
                    autoComplete="off"
                    value={searchTerm}
                    disabled={isLoading}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSelectedCourse(null);
                    }}
                  />
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary absolute right-3 top-3" />
                  )}
                </div>

                {!isLoading && !selectedCourse && searchTerm.trim() && suggestions.length > 0 && (
                  <Card className="mt-2 border-border">
                    <CardContent className="p-2">
                      <div className="grid gap-1">
                        {suggestions.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            variant="ghost"
                            className="justify-start h-auto whitespace-normal"
                            onClick={() => handleSelectCourse(suggestion)}
                          >
                            {suggestion.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="text-base font-semibold text-primary text-center">
                Escolha um curso compatível e inicie seu atendimento agora
              </div>

              {isLoading && <SimulatorLoadingState attempt={fetchAttempt} />}

              {!isLoading && errorMessage && (
                <div className="space-y-3">
                  <div className="text-sm text-destructive">{errorMessage}</div>
                  <Button type="button" variant="outline" onClick={fetchCourses}>
                    Tentar novamente
                  </Button>
                </div>
              )}

              {!isLoading && selectedCourse && (
                <div className="space-y-4">
                  {selectedCourse.secondGradOptions.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Não encontramos opções de 2ª Graduação para esse curso no momento.
                      </CardContent>
                    </Card>
                  )}

                  {selectedCourse.secondGradOptions.length > 0 && (
                    <>
                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {selectedCourse.secondGradOptions.map((opt) => (
                          <Card key={`mobile-${opt.courseName}`} className="overflow-hidden">
                            <CardContent className="p-4 space-y-4">
                              <h3 className="text-base font-semibold leading-snug">{opt.courseName}</h3>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Tempo de Formação</p>
                                  <p className="font-medium">{formatDuration(opt.duration)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Carga Horária</p>
                                  <p className="font-medium">{formatHours(opt.totalHours)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Disciplinas</p>
                                  <p className="font-medium">{opt.totalDisciplines ?? "-"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Plano de Pagamento</p>
                                  <p className="font-medium">
                                    1+{opt.installments ?? "?"}x de {formatCurrency(opt.value)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button variant="whatsapp" className="w-full font-bold" asChild>
                                  <a
                                    href={toWhatsappLink(selectedCourse.name, opt.courseName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Matricule-se
                                  </a>
                                </Button>
                                {opt.matriceFileUrl && (
                                  <Button variant="outline" className="w-full" asChild>
                                    <a
                                      href={opt.matriceFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileDown className="h-4 w-4 mr-2" />
                                      Matriz Curricular
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop table */}
                      <div className="hidden md:block rounded-md border bg-background p-2 lg:p-3 overflow-x-auto">
                        <Table className="min-w-[1080px] [&_th]:px-4 [&_td]:px-4 [&_td]:py-4">
                          <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold [&_th]:h-auto [&_th]:py-4 [&_th]:text-base [&_th]:text-left">
                            <TableRow className="border-0 hover:bg-transparent">
                              <TableHead>2ª Graduação</TableHead>
                              <TableHead>Tempo de Formação</TableHead>
                              <TableHead>Carga Horária</TableHead>
                              <TableHead>Disciplinas</TableHead>
                              <TableHead>Plano de Pagamento</TableHead>
                              <TableHead colSpan={2} className="text-center pr-6">
                                Ações
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCourse.secondGradOptions.map((opt, index) => (
                              <TableRow
                                key={opt.courseName}
                                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                              >
                                <TableCell className="text-base font-medium max-w-[320px]">
                                  {opt.courseName}
                                </TableCell>
                                <TableCell className="text-base whitespace-nowrap">
                                  {formatDuration(opt.duration)}
                                </TableCell>
                                <TableCell className="text-base whitespace-nowrap">
                                  {formatHours(opt.totalHours)}
                                </TableCell>
                                <TableCell className="text-base whitespace-nowrap">
                                  {opt.totalDisciplines ?? "-"}
                                </TableCell>
                                <TableCell className="text-base whitespace-nowrap">
                                  1+{opt.installments ?? "?"}x de {formatCurrency(opt.value)}
                                </TableCell>
                                <TableCell>
                                  <Button variant="whatsapp" size="sm" className="px-5 font-bold" asChild>
                                    <a
                                      href={toWhatsappLink(selectedCourse.name, opt.courseName)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Matricule-se
                                    </a>
                                  </Button>
                                </TableCell>
                                <TableCell className="pr-6">
                                  {opt.matriceFileUrl ? (
                                    <Button variant="outline" size="sm" className="px-4" asChild>
                                      <a
                                        href={opt.matriceFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <FileDown className="h-4 w-4 mr-1.5" />
                                        Matriz
                                      </a>
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
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

          {/* Disclaimer */}
          <Card className="mt-8">
            <CardContent className="p-6 lg:p-8 grid md:grid-cols-[auto_1fr] gap-4 items-start">
              <BookOpenCheck className="h-8 w-8 text-primary" />
              <p className="text-muted-foreground">
                Este simulador apresenta as possibilidades de 2ª Graduação com base na sua formação anterior.
                Para confirmar regras acadêmicas de aproveitamento, documentos e prazos de matrícula, fale com
                nossa equipe no WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SegundaGraduacao;
