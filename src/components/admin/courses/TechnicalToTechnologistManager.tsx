import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  type CompatibleCoursePdfItem,
  generateTechnicalToTechnologistPdf,
} from "@/lib/technicalToTechnologistPdf";
import { Download, RefreshCcw, Search } from "lucide-react";

interface CompatibleCourse extends CompatibleCoursePdfItem {
  courseName: string;
}

interface TechnicalCourse {
  id: string;
  name: string;
  compatibleCourses: CompatibleCourse[];
}

const DEFAULT_API_URL = "/api/cursos-tecnicos";
const API_URL = import.meta.env.VITE_TECNICO_TECNOLOGO_API_URL || DEFAULT_API_URL;

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

export default function TechnicalToTechnologistManager() {
  const [technicalCourses, setTechnicalCourses] = useState<TechnicalCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnicalCourse, setSelectedTechnicalCourse] = useState<TechnicalCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

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
        headers: { Accept: "application/json" },
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

  async function handleDownloadListPdf() {
    if (!selectedTechnicalCourse || selectedTechnicalCourse.compatibleCourses.length === 0) {
      toast({
        title: "Selecione um curso técnico",
        description: "Escolha um curso técnico com opções compatíveis para exportar o PDF.",
      });
      return;
    }

    try {
      setIsExporting(true);
      await generateTechnicalToTechnologistPdf(
        selectedTechnicalCourse.name,
        selectedTechnicalCourse.compatibleCourses,
        { generatedAt: new Date() }
      );
      toast({
        title: "PDF gerado com sucesso",
        description: "A lista Técnico para Tecnólogo foi baixada.",
      });
    } catch {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível exportar a lista no momento.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Técnico para Tecnólogo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Consulte compatibilidades e baixe a lista em PDF com a identidade do polo.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchTechnicalCourses} disabled={isLoading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
              <Button onClick={handleDownloadListPdf} disabled={isExporting || isLoading}>
                <Download className="h-4 w-4 mr-2" /> {isExporting ? "Gerando PDF..." : "Baixar lista PDF"}
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="technical-search-admin" className="block text-sm font-semibold text-muted-foreground mb-2">
              Informe o curso técnico
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                id="technical-search-admin"
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

          {selectedTechnicalCourse && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Curso selecionado</Badge>
              <p className="text-sm font-medium">{selectedTechnicalCourse.name}</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && <div className="text-sm text-muted-foreground">Carregando opções compatíveis...</div>}
          {!isLoading && errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}

          {selectedTechnicalCourse && selectedTechnicalCourse.compatibleCourses.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                Não encontramos opções compatíveis para esse curso técnico no momento.
              </CardContent>
            </Card>
          )}

          {selectedTechnicalCourse && selectedTechnicalCourse.compatibleCourses.length > 0 && (
            <>
              <div className="md:hidden space-y-3">
                {selectedTechnicalCourse.compatibleCourses.map((course) => (
                  <Card key={`admin-mobile-${course.courseName}`} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block rounded-md border bg-background p-2 lg:p-3">
                <Table className="min-w-[900px] [&_th]:px-4 [&_td]:px-4 [&_td]:py-4">
                  <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold [&_th]:h-auto [&_th]:py-4 [&_th]:text-left">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead>Curso Tecnólogo</TableHead>
                      <TableHead>Tempo de Formação</TableHead>
                      <TableHead>Carga Horária a Cursar</TableHead>
                      <TableHead>Disciplinas a Cursar</TableHead>
                      <TableHead>Plano de Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTechnicalCourse.compatibleCourses.map((course, index) => (
                      <TableRow
                        key={`admin-row-${course.courseName}`}
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        <TableCell className="text-base font-medium max-w-[360px]">{course.courseName}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">{formatDuration(course.duration)}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">{formatHours(course.totalHours)}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">{course.installments || "-"}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">1+12x de {formatCurrency(course.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}