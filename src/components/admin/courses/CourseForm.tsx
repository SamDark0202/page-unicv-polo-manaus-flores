import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Course, CourseInput, CourseModality } from "@/types/course";
import { useCourseMutations } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";

const modalityOptions: Array<{ value: CourseModality; label: string }> = [
  { value: "bacharelado", label: "Bacharelado" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "tecnologo", label: "Tecnologo" },
];

type Props = {
  course: Course | null;
  onCancel: () => void;
  onSaved: () => void;
};

type FormState = CourseInput;

const emptyState: FormState = {
  modality: "bacharelado",
  name: "",
  duration: "",
  preview: "",
  about: "",
  jobMarket: "",
  requirements: "",
  curriculum: [],
  active: true,
};

function cloneCourse(course: Course | null): FormState {
  if (!course) return { ...emptyState };
  return {
    id: course.id,
    modality: course.modality,
    name: course.name,
    duration: course.duration,
    preview: course.preview,
    about: course.about,
    jobMarket: course.jobMarket,
    requirements: course.requirements,
    curriculum: course.curriculum,
    active: course.active,
  };
}

export default function CourseForm({ course, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => cloneCourse(course));
  const [errors, setErrors] = useState<string[]>([]);
  const { upsert } = useCourseMutations();
  const { toast } = useToast();
  const [curriculumDraft, setCurriculumDraft] = useState(() => (course ? course.curriculum.join("\n") : ""));

  useEffect(() => {
    setForm(cloneCourse(course));
    setCurriculumDraft(course ? course.curriculum.join("\n") : "");
    setErrors([]);
  }, [course]);

  const submitting = upsert.isPending;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCurriculumChange(value: string) {
    setCurriculumDraft(value);
    const items = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    updateField("curriculum", items);
  }

  function validate(): string[] {
    const issues: string[] = [];
    if (!form.name.trim()) issues.push("Informe o nome do curso.");
    if (!form.duration.trim()) issues.push("Informe a duração.");
    if (!form.preview.trim()) issues.push("Informe o texto de pré-visualização.");
    if (!form.about.trim()) issues.push("Preencha a descrição completa do curso.");
    if (!form.jobMarket.trim()) issues.push("Descreva o mercado de trabalho.");
    if (!form.requirements.trim()) issues.push("Defina os requisitos do curso.");
    if (form.curriculum.length === 0) issues.push("Inclua pelo menos uma disciplina na matriz curricular.");
    return issues;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const issues = validate();
    setErrors(issues);
    if (issues.length > 0) return;

    const payload: CourseInput = {
      ...form,
      curriculum: form.curriculum,
    };

    try {
      await upsert.mutateAsync(payload);
      toast({
        title: "Curso salvo",
        description: `${form.name} atualizado com sucesso.`,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível salvar o curso." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course ? "Editar curso" : "Novo curso"}</h1>
          <p className="text-sm text-muted-foreground">
            Preencha todas as informações para que o curso fique disponível nas páginas públicas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar curso"}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 text-base">Revise os campos obrigatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
              {errors.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Modalidade</Label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.modality}
                onChange={(event) => updateField("modality", event.target.value as CourseModality)}
              >
                {modalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              <Switch checked={form.active} onCheckedChange={(value) => updateField("active", value)} />
              <span className="text-sm">{form.active ? "Curso visível no site" : "Curso oculto"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do curso</Label>
              <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </div>
            <div>
              <Label>Duração</Label>
              <Input value={form.duration} onChange={(event) => updateField("duration", event.target.value)} />
            </div>
          </div>

          <div>
            <Label>Texto de pré-visualização</Label>
            <Textarea
              rows={3}
              value={form.preview}
              onChange={(event) => updateField("preview", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do curso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sobre o curso</Label>
            <Textarea
              rows={6}
              value={form.about}
              onChange={(event) => updateField("about", event.target.value)}
            />
          </div>

          <div>
            <Label>Mercado de trabalho</Label>
            <Textarea
              rows={4}
              value={form.jobMarket}
              onChange={(event) => updateField("jobMarket", event.target.value)}
            />
          </div>

          <div>
            <Label>Requisitos</Label>
            <Textarea
              rows={4}
              value={form.requirements}
              onChange={(event) => updateField("requirements", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matriz curricular</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Disciplinas (uma por linha)</Label>
            <Textarea rows={8} value={curriculumDraft} onChange={(event) => handleCurriculumChange(event.target.value)} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
