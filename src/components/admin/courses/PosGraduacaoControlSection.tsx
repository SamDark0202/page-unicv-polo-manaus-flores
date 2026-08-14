import { useEffect, useMemo, useState } from "react";
import type { PostGraduateApiResponse, PostGraduateCourse } from "@/types/posGraduacao";
import { generatePosGraduacaoPdf } from "@/lib/posGraduacaoPdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  FileDown,
  ExternalLink,
  Clock,
  DollarSign,
  BookOpen,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

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
  if (!text) return "Sob consulta";
  if (text.toLowerCase().includes("hora") || text.toLowerCase().includes("h")) return text;
  return `${text} horas`;
};

const getDisplayPrice = (course: PostGraduateCourse) => {
  if (course.installment_price && course.installment_price.trim()) {
    const formattedInstallment = formatPrice(course.installment_price);
    if (formattedInstallment !== "-") {
      return `1+12x de ${formattedInstallment}`;
    }
  }
  if (course.current_price && course.current_price.trim()) {
    const formattedCurrent = formatPrice(course.current_price);
    if (formattedCurrent !== "-") {
      return formattedCurrent;
    }
  }
  return "-";
};

const matchesCategory = (courseName: string, cat: { keywords: string[] }) => {
  const n = normalize(courseName);
  return cat.keywords.some((kw) => n.includes(normalize(kw)));
};

export default function PosGraduacaoControlSection() {
  const [courses, setCourses] = useState<PostGraduateCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/cursos?tipo=pos-graduacao");
      if (!response.ok) {
        throw new Error(`Erro ao carregar cursos (Status HTTP ${response.status})`);
      }
      const data = (await response.json()) as PostGraduateApiResponse;
      if (Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else {
        throw new Error("Formato de resposta inválido da API de pós-graduação.");
      }
    } catch (err) {
      console.error("Falha ao buscar cursos de pós-graduação:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível carregar a lista de cursos de Pós-Graduação."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
  };

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

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      generatePosGraduacaoPdf(filteredCourses, {
        searchTerm: searchTerm.trim() || undefined,
        selectedCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                Controle de Cursos de Pós-Graduação
              </CardTitle>
              <CardDescription className="mt-1">
                Visualização e gerenciamento simplificado das ofertas de Pós-Graduação EAD integradas ao site oficial.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCourses}
                disabled={isLoading}
                title="Atualizar lista de cursos"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                onClick={handleDownloadPdf}
                disabled={isLoading || isExportingPdf || filteredCourses.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
              >
                {isExportingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {(searchTerm || selectedCategories.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                Limpar filtros ({selectedCategories.length + (searchTerm ? 1 : 0)})
              </Button>
            )}
          </div>

          {/* Categorias (Pills) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.label);
              return (
                <button
                  key={cat.label}
                  onClick={() => toggleCategory(cat.label)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Resumo de Contagem */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>
              Exibindo <strong className="text-foreground font-semibold">{filteredCourses.length}</strong> de{" "}
              <strong className="text-foreground font-semibold">{courses.length}</strong> cursos de Pós-Graduação
            </span>
            {selectedCategories.length > 0 && (
              <span className="truncate max-w-[300px]">
                Categorias: {selectedCategories.join(", ")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo: Loading, Error ou Lista */}
      {isLoading ? (
        <Card className="p-8 text-center border-border/60">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Carregando lista de cursos de Pós-Graduação...
            </p>
          </div>
        </Card>
      ) : errorMessage ? (
        <Card className="p-6 border-destructive/40 bg-destructive/5 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={fetchCourses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-8 text-center border-border/60">
          <p className="text-sm text-muted-foreground font-medium">
            Nenhum curso encontrado para os termos da busca.
          </p>
          <Button variant="link" size="sm" onClick={clearFilters} className="mt-2 text-primary">
            Limpar filtros de busca
          </Button>
        </Card>
      ) : (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 w-[45%]">Nome do Curso</th>
                  <th className="py-3 px-4 w-[20%]">Carga Horária</th>
                  <th className="py-3 px-4 w-[20%]">Valor do Curso</th>
                  <th className="py-3 px-4 w-[15%] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCourses.map((course) => {
                  const duration = formatDuration(course.duration_hours);
                  const price = getDisplayPrice(course);

                  return (
                    <tr
                      key={course.id || course.url}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Nome do curso */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span className="line-clamp-2" title={course.name}>
                          {course.name}
                        </span>
                      </td>

                      {/* Carga horária */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span>{duration}</span>
                        </div>
                      </td>

                      {/* Valor do curso */}
                      <td className="py-3.5 px-4 font-medium text-primary whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>{price}</span>
                        </div>
                      </td>

                      {/* Link de destino (clicável no painel) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {course.url ? (
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-md transition-colors"
                            title="Abrir página oficial do curso em nova aba"
                          >
                            <span>Página Oficial</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
