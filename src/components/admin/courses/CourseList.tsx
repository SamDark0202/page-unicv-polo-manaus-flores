import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useCoursesQuery, useCourseMutations } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import type { Course, CourseModality } from "@/types/course";
import { Clock, GraduationCap, RefreshCcw } from "lucide-react";

const modalityTabs: Array<{ value: ModalityTab; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "bacharelado", label: "Bacharelado" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "tecnologo", label: "Tecnologo" },
];

type ModalityTab = CourseModality | "all";

type Props = {
  onCreate: () => void;
  onEdit: (course: Course) => void;
};

export default function CourseList({ onCreate, onEdit }: Props) {
  const [modality, setModality] = useState<ModalityTab>("all");
  const [query, setQuery] = useState("");
  const filters = useMemo(
    () => ({ modality: modality === "all" ? undefined : modality, activeOnly: false as const }),
    [modality]
  );
  const { data: courses = [], isLoading, error, refetch } = useCoursesQuery(filters);
  const fetchError = error instanceof Error ? error.message : null;
  const { toggleActive, hardDelete } = useCourseMutations();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) =>
      [course.name, course.preview, course.duration].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [courses, query]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2">
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
                <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggle(course)}>
                  {course.active ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(course)}>
                  Excluir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{course.preview}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
