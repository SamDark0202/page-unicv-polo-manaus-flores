import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowRight, BookOpenCheck, Rocket, Target, CheckCircle2, MessageCircle } from "lucide-react";

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

const DEFAULT_API_URL = "/api/cursos-tecnicos";
const API_URL = import.meta.env.VITE_TECNICO_TECNOLOGO_API_URL || DEFAULT_API_URL;
const WHATSAPP_PHONE = "559220201260";

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

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar cursos (HTTP ${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Resposta inválida da API de cursos.");
      }

      const payload = (await response.json()) as unknown;
      const parsed = parseTechnicalCourses(payload);
      setTechnicalCourses(parsed);

      if (!parsed.length) {
        setErrorMessage("Nenhum curso técnico disponível no momento.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao consultar cursos.";
      setErrorMessage(message);
      setTechnicalCourses([]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
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
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">Do Técnico ao Tecnólogo com Mais Agilidade</h1>
          <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
            Você já tem base técnica. Agora use esse diferencial para avançar rumo ao diploma de graduação tecnóloga e crescer profissionalmente.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20 shadow-soft">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline">Vantagens</Badge>
                </div>
                <CardTitle className="text-xl">Ganhos reais para quem já é Técnico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Aproveite sua formação prévia para encurtar o caminho até a graduação tecnóloga.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Fortaleça seu currículo, aumente sua competitividade e abra novas oportunidades de carreira.
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
                    No simulador, informe seu curso técnico e veja os tecnólogos compatíveis com sua formação.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-1 text-primary" />
                  <p>
                    Escolha a melhor opção e clique em <strong className="text-foreground">Matricule-se</strong> para receber atendimento direto no WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
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
                    placeholder="Ex.: Técnico em Automação Industrial"
                    className="pl-9"
                    autoComplete="off"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSelectedTechnicalCourse(null);
                    }}
                  />
                </div>

                {!selectedTechnicalCourse && searchTerm.trim() && suggestions.length > 0 && (
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

              <div className="text-base font-semibold text-primary text-center">
                Escolha um curso compatível e inicie seu atendimento agora
              </div>

              {isLoading && <div className="text-sm text-muted-foreground">Carregando opções compatíveis...</div>}
              {!isLoading && errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}

              {selectedTechnicalCourse && (
                <div className="space-y-4">

                  {selectedTechnicalCourse.compatibleCourses.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Não encontramos opções compatíveis para esse curso técnico no momento.
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

          <Card className="mt-8">
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