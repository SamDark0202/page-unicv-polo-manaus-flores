import { useEffect, useMemo, useState } from "react";
import { normalizeText } from "@/utils/normalize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCoursesQuery, useCourseMutations } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import type { Course, CourseDeliveryMode, CourseModality } from "@/types/course";
import { generateCourseCatalogPdf, generateCourseInformationPdf } from "@/lib/courseCatalogPdf";
import { Clock, Download, FileDown, GraduationCap, RefreshCcw } from "lucide-react";

const modalityTabs: Array<{ value: ModalityTab; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "bacharelado", label: "Bacharelado" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "tecnologo", label: "Tecnologo" },
];

type ModalityTab = CourseModality | "all";
type ExportStatusFilter = "active" | "inactive";

const exportStatusOptions: ExportStatusFilter[] = ["active", "inactive"];
const exportDeliveryModeOptions: CourseDeliveryMode[] = ["ead", "semipresencial"];

const modalityLabel: Record<ModalityTab, string> = {
  all: "Todas",
  bacharelado: "Bacharelado",
  licenciatura: "Licenciatura",
  tecnologo: "Tecnólogo",
};

const deliveryModeLabel: Record<CourseDeliveryMode, string> = {
  ead: "EAD",
  semipresencial: "Semipresencial",
};

const exportStatusLabel: Record<ExportStatusFilter, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

type Props = {
  onCreate: () => void;
  onEdit: (course: Course) => void;
  canEditCourses?: boolean;
};

export default function CourseList({ onCreate, onEdit, canEditCourses = true }: Props) {
  const [modality, setModality] = useState<ModalityTab>("all");
  const [query, setQuery] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportCourseTypes, setExportCourseTypes] = useState<CourseModality[]>([]);
  const [exportDeliveryModes, setExportDeliveryModes] = useState<CourseDeliveryMode[]>([]);
  const [exportStatuses, setExportStatuses] = useState<ExportStatusFilter[]>([...exportStatusOptions]);
  const [exportQuery, setExportQuery] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const { data: allCourses = [], isLoading, error, refetch } = useCoursesQuery({ activeOnly: false });

  const courses = useMemo(() => {
    if (modality === "all") return allCourses;
    return allCourses.filter((course) => course.modality === modality);
  }, [allCourses, modality]);
  const fetchError = error instanceof Error ? error.message : null;
  const { toggleActive, hardDelete } = useCourseMutations();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return courses;
    return courses.filter((course) =>
      [course.name, course.preview, course.duration].some((value) =>
        normalizeText(value).includes(term)
      )
    );
  }, [courses, query]);

  const exportCandidates = useMemo(() => {
    const term = normalizeText(exportQuery.trim());

    return allCourses.filter((course) => {
      if (exportCourseTypes.length > 0 && !exportCourseTypes.includes(course.modality)) return false;
      if (exportDeliveryModes.length > 0 && !exportDeliveryModes.includes(course.deliveryMode)) return false;

      const courseStatus: ExportStatusFilter = course.active ? "active" : "inactive";
      if (!exportStatuses.includes(courseStatus)) return false;
      if (!term) return true;

      return [course.name, course.preview, course.duration].some((value) =>
        normalizeText(value).includes(term)
      );
    });
  }, [allCourses, exportCourseTypes, exportDeliveryModes, exportQuery, exportStatuses]);

  useEffect(() => {
    if (!isExportDialogOpen) return;

    const availableIds = exportCandidates.map((course) => course.id);
    setSelectedCourseIds((previous) => {
      if (previous.length === 0) return availableIds;

      const kept = previous.filter((id) => availableIds.includes(id));
      return kept.length > 0 ? kept : availableIds;
    });
  }, [exportCandidates, isExportDialogOpen]);

  function handleToggle(course: Course) {
    toggleActive.mutate(
      { id: course.id, active: !course.active },
      {
        onSuccess: () => {
          toast({
            title: course.active ? "Curso desativado" : "Curso ativado",
            description: `${course.name} atualizado com sucesso.`,
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível atualizar o status." });
        },
      }
    );
  }

  function handleDelete(course: Course) {
    const confirmation = window.confirm(
      `Excluir permanentemente o curso "${course.name}"? Esta ação não poderá ser desfeita.`
    );
    if (!confirmation) return;

    hardDelete.mutate(course.id, {
      onSuccess: () => {
        toast({ title: "Curso excluído", description: `${course.name} removido do Supabase.` });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível remover o curso." });
      },
    });
  }

  function handleOpenExportDialog() {
    setExportCourseTypes(modality === "all" ? [] : [modality]);
    setExportDeliveryModes([]);
    setExportStatuses([...exportStatusOptions]);
    setExportQuery("");
    setSelectedCourseIds([]);
    setIsExportDialogOpen(true);
  }

  function toggleCourseTypeFilter(value: CourseModality) {
    setExportCourseTypes((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );
  }

  function toggleDeliveryModeFilter(value: CourseDeliveryMode) {
    setExportDeliveryModes((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );
  }

  function toggleStatusFilter(value: ExportStatusFilter) {
    setExportStatuses((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );
  }

  function handleToggleSelect(id: string) {
    setSelectedCourseIds((previous) =>
      previous.includes(id) ? previous.filter((courseId) => courseId !== id) : [...previous, id]
    );
  }

  async function handleExportCatalog() {
    const selectedCourses = exportCandidates.filter((course) => selectedCourseIds.includes(course.id));

    if (selectedCourses.length === 0) {
      toast({
        title: "Nenhum curso selecionado",
        description: "Selecione ao menos um curso para gerar o catálogo PDF.",
      });
      return;
    }

    try {
      await generateCourseCatalogPdf(selectedCourses, { generatedAt: new Date() });

      toast({
        title: "Catálogo gerado",
        description: `${selectedCourses.length} curso(s) exportado(s) em PDF.`,
      });

      setIsExportDialogOpen(false);
    } catch {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível montar o catálogo agora. Tente novamente.",
      });
    }
  }

  async function handleDownloadCourseInfo(course: Course) {
    try {
      await generateCourseInformationPdf(course, { generatedAt: new Date() });
      toast({
        title: "PDF do curso gerado",
        description: `As informações de ${course.name} foram baixadas com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro ao gerar PDF do curso",
        description: "Não foi possível baixar as informações deste curso agora.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2">
          {canEditCourses && (
            <Button variant="default" onClick={handleOpenExportDialog}>
              <Download className="h-4 w-4 mr-2" /> Baixar catálogo PDF
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar lista
          </Button>
        </div>
      </div>

      <Tabs value={modality} onValueChange={(value) => setModality(value as ModalityTab)}>
        <TabsList className="flex flex-wrap gap-2">
          {modalityTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Carregando cursos..." : `${filtered.length} curso(s) encontrados`}
        </div>
        <Input
          placeholder="Buscar por nome, duração ou descrição"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full md:w-80"
        />
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erro ao carregar cursos.</p>
          <p className="text-sm">{fetchError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {!isLoading && !fetchError && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhum curso encontrado.</div>
        )}

        {filtered.map((course) => (
          <Card key={course.id} className="border border-muted">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center"><GraduationCap className="h-4 w-4 mr-1" /> {course.modality}</div>
                  <div className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {course.duration}</div>
                  <Badge variant={course.active ? "default" : "secondary"} className={course.active ? "bg-emerald-600" : "bg-gray-400"}>
                    {course.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownloadCourseInfo(course)}>
                  <FileDown className="h-4 w-4 mr-1" /> Baixar informações
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
                  {canEditCourses ? "Editar" : "Ver"}
                </Button>
                {canEditCourses && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(course)}>
                      {course.active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(course)}>
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{course.preview}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {canEditCourses && (
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Exportar catálogo de cursos</DialogTitle>
              <DialogDescription>
                Use filtros múltiplos por tipo de curso, modalidade de ensino e status para gerar o catálogo PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Tipo de curso</p>
                <div className="space-y-2 rounded-md border p-3">
                  {modalityTabs
                    .filter((tab) => tab.value !== "all")
                    .map((tab) => {
                      const courseType = tab.value as CourseModality;
                      return (
                        <label key={courseType} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={exportCourseTypes.includes(courseType)}
                            onCheckedChange={() => toggleCourseTypeFilter(courseType)}
                          />
                          <span>{tab.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Modalidade</p>
                <div className="space-y-2 rounded-md border p-3">
                  {exportDeliveryModeOptions.map((deliveryMode) => (
                    <label key={deliveryMode} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={exportDeliveryModes.includes(deliveryMode)}
                        onCheckedChange={() => toggleDeliveryModeFilter(deliveryMode)}
                      />
                      <span>{deliveryModeLabel[deliveryMode]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <div className="space-y-2 rounded-md border p-3">
                  {exportStatusOptions.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={exportStatuses.includes(status)}
                        onCheckedChange={() => toggleStatusFilter(status)}
                      />
                      <span>{exportStatusLabel[status]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Buscar no catálogo</p>
                <Input
                  value={exportQuery}
                  onChange={(event) => setExportQuery(event.target.value)}
                  placeholder="Nome, duração ou descrição"
                />
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  {exportCandidates.length} curso(s) filtrado(s) • {selectedCourseIds.length} selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCourseIds(exportCandidates.map((course) => course.id))}
                  >
                    Selecionar todos
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCourseIds([])}>
                    Limpar seleção
                  </Button>
                </div>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {exportCandidates.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum curso encontrado com os filtros escolhidos.</p>
                )}

                {exportCandidates.map((course) => {
                  const checked = selectedCourseIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => handleToggleSelect(course.id)} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {modalityLabel[course.modality]} • {course.duration} • {course.active ? "Ativo" : "Inativo"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.preview}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleExportCatalog}>
                <Download className="h-4 w-4 mr-2" /> Gerar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
