import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type SecondGradPdfItem, generateSegundaGraduacaoPdf } from "@/lib/segundaGraduacaoPdf";
import { Download, RefreshCcw, Search } from "lucide-react";

interface SecondGradOption extends SecondGradPdfItem {
  matriceFileUrl: string | null;
}

interface GraduationCourse {
  id: string;
  name: string;
  secondGradOptions: SecondGradOption[];
}

const DEFAULT_API_URL = "/api/segunda-graduacao";
const API_URL = import.meta.env.VITE_SEGUNDA_GRADUACAO_API_URL || DEFAULT_API_URL;
const UNICV_BASE_URL = "https://diariodebordo.unicv.edu.br";

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
        const course = courseRaw && typeof courseRaw === "object" ? (courseRaw as Record<string, unknown>) : null;
        const courseName = toOptionalText(course?.name) || "Curso sem nome";
        const courseId = toOptionalText(course?.id) || `name:${courseName}`;

        const matriceFileRaw = offer.matrice_file;
        const matriceFile = matriceFileRaw && typeof matriceFileRaw === "object"
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
          const existing = unique.get(courseId)!;
          unique.set(courseId, { ...existing, matriceFileUrl });
        }
      }

      const secondGradOptions = Array.from(unique.values()).sort((a, b) =>
        a.courseName.localeCompare(b.courseName, "pt-BR")
      );

      return { id: String(idValue), name: nameValue, secondGradOptions };
    })
    .filter((course): course is GraduationCourse => course !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export default function SegundaGraduacaoManager() {
  const [courses, setCourses] = useState<GraduationCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<GraduationCourse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const suggestions = useMemo(() => {
    const query = normalize(searchTerm.trim());
    if (!query) return courses.slice(0, 12);
    return courses.filter((item) => normalize(item.name).includes(query)).slice(0, 12);
  }, [searchTerm, courses]);

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedCourse(null);

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
      const parsed = parseGraduationCourses(payload);
      setCourses(parsed);

      if (!parsed.length) {
        setErrorMessage("Nenhum curso de graduação disponível no momento.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao consultar cursos.";
      setErrorMessage(message);
      setCourses([]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleDownloadPdf() {
    if (!selectedCourse || selectedCourse.secondGradOptions.length === 0) {
      toast({
        title: "Selecione uma graduação de origem",
        description: "Escolha o curso da 1ª Graduação para exportar as opções disponíveis.",
      });
      return;
    }

    try {
      setIsExporting(true);
      await generateSegundaGraduacaoPdf(
        selectedCourse.name,
        selectedCourse.secondGradOptions,
        { generatedAt: new Date() }
      );
      toast({
        title: "PDF gerado com sucesso",
        description: "A lista de 2ª Graduação foi baixada.",
      });
    } catch {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível exportar a lista no momento.",
        variant: "destructive",
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
              <CardTitle className="text-2xl">2ª Graduação</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Consulte opções de segunda graduação por curso de origem e baixe a lista em PDF.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchCourses} disabled={isLoading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
              <Button onClick={handleDownloadPdf} disabled={isExporting || isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Gerando PDF..." : "Baixar lista PDF"}
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="segunda-grad-search-admin" className="block text-sm font-semibold text-muted-foreground mb-2">
              Informe a 1ª Graduação do aluno
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                id="segunda-grad-search-admin"
                type="search"
                placeholder="Ex.: Administração, Ciências Contábeis..."
                className="pl-9"
                autoComplete="off"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedCourse(null);
                }}
              />
            </div>

            {!selectedCourse && searchTerm.trim() && suggestions.length > 0 && (
              <Card className="mt-2 border-border">
                <CardContent className="p-2">
                  <div className="grid gap-1">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion.id}
                        variant="ghost"
                        className="justify-start h-auto whitespace-normal"
                        onClick={() => {
                          setSelectedCourse(suggestion);
                          setSearchTerm(suggestion.name);
                        }}
                      >
                        {suggestion.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedCourse && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">1ª Graduação selecionada</Badge>
              <p className="text-sm font-medium">{selectedCourse.name}</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Carregando opções de 2ª Graduação...</div>
          )}
          {!isLoading && errorMessage && (
            <div className="text-sm text-destructive">{errorMessage}</div>
          )}

          {selectedCourse && selectedCourse.secondGradOptions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                Não encontramos opções de 2ª Graduação para esse curso no momento.
              </CardContent>
            </Card>
          )}

          {selectedCourse && selectedCourse.secondGradOptions.length > 0 && (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {selectedCourse.secondGradOptions.map((option) => (
                  <Card key={`admin-mob-${option.courseName}`} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-base font-semibold leading-snug">{option.courseName}</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tempo</p>
                          <p className="font-medium">{formatDuration(option.duration)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Carga Horária</p>
                          <p className="font-medium">{formatHours(option.totalHours)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Disciplinas</p>
                          <p className="font-medium">{option.totalDisciplines ? String(option.totalDisciplines) : "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pagamento</p>
                          <p className="font-medium">1+12x de {formatCurrency(option.value)}</p>
                        </div>
                      </div>
                      {option.matriceFileUrl && (
                        <a
                          href={option.matriceFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Ver matriz curricular
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block rounded-md border bg-background p-2 lg:p-3">
                <Table className="min-w-[900px] [&_th]:px-4 [&_td]:px-4 [&_td]:py-4">
                  <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold [&_th]:h-auto [&_th]:py-4 [&_th]:text-left">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead>Curso 2ª Graduação</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Disciplinas</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Matriz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourse.secondGradOptions.map((option, index) => (
                      <TableRow
                        key={`admin-row-${option.courseName}`}
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        <TableCell className="text-base font-medium max-w-[300px]">{option.courseName}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">{formatDuration(option.duration)}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">{formatHours(option.totalHours)}</TableCell>
                        <TableCell className="text-base whitespace-nowrap">
                          {option.totalDisciplines ? String(option.totalDisciplines) : "-"}
                        </TableCell>
                        <TableCell className="text-base whitespace-nowrap">
                          1+12x de {formatCurrency(option.value)}
                        </TableCell>
                        <TableCell>
                          {option.matriceFileUrl ? (
                            <a
                              href={option.matriceFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Ver matriz
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
