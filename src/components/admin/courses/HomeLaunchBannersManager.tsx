import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useHomeLaunchBannersMutations, useHomeLaunchBannersQuery } from "@/hooks/useHomeLaunchBanners";
import { useCoursesQuery } from "@/hooks/useCourses";
import type { HomeLaunchBanner, HomeLaunchBannerInput } from "@/types/homeLaunchBanner";
import { uploadHomeLaunchBannerImage } from "@/lib/supabaseClient";
import { Check, ChevronsUpDown, ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormState = HomeLaunchBannerInput;

const MODALITY_LABEL: Record<string, string> = {
  bacharelado: "Bacharelado",
  licenciatura: "Licenciatura",
  tecnologo: "Tecnólogo",
};

const emptyFormState: FormState = {
  bannerName: "",
  imageUrl: "",
  courseId: "",
  sortOrder: 0,
  active: true,
};

function cloneToFormState(item: HomeLaunchBanner | null): FormState {
  if (!item) return { ...emptyFormState };

  return {
    id: item.id,
    bannerName: item.bannerName,
    imageUrl: item.imageUrl,
    courseId: item.courseId,
    sortOrder: item.sortOrder,
    active: item.active,
  };
}

export default function HomeLaunchBannersManager() {
  const { data: items = [], isLoading, error, refetch } = useHomeLaunchBannersQuery({ activeOnly: false });
  const { data: courses = [] } = useCoursesQuery({ activeOnly: true });
  const { upsert, toggleActive, hardDelete } = useHomeLaunchBannersMutations();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<HomeLaunchBanner | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(cloneToFormState(editingItem));
    setErrors([]);
  }, [editingItem]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)),
    [items]
  );

  const activeItems = useMemo(() => orderedItems.filter((item) => item.active), [orderedItems]);
  const inactiveItems = useMemo(() => orderedItems.filter((item) => !item.active), [orderedItems]);

  const coursesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const course of courses) {
      map.set(course.id, course.name);
    }
    return map;
  }, [courses]);

  const fetchError = error instanceof Error ? error.message : null;
  const submitting = upsert.isPending;
  const selectedCourse = courses.find((course) => course.id === form.courseId);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingItem(null);
    setForm({ ...emptyFormState, sortOrder: orderedItems.length });
    setErrors([]);
  }

  function validate(): string[] {
    const issues: string[] = [];

    if (!form.bannerName.trim()) issues.push("Informe o nome do banner.");
    if (!form.imageUrl.trim()) issues.push("Informe a URL da imagem 1080x1440.");
    if (!form.courseId.trim()) issues.push("Selecione um curso para vincular ao banner.");
    if (!Number.isFinite(form.sortOrder)) issues.push("A ordem de exibição precisa ser um número válido.");

    return issues;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const issues = validate();
    setErrors(issues);
    if (issues.length > 0) return;

    try {
      await upsert.mutateAsync(form);
      toast({ title: "Banner salvo", description: "Lançamento da Home atualizado com sucesso." });
      resetForm();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível salvar o banner de lançamento." });
    }
  }

  async function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadHomeLaunchBannerImage(file);
      updateField("imageUrl", imageUrl);
      toast({ title: "Imagem enviada", description: "Imagem do lançamento enviada para o Supabase Storage." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar a imagem do lançamento." });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleEdit(item: HomeLaunchBanner) {
    setEditingItem(item);
  }

  function handleCreate() {
    setEditingItem(null);
    setForm({ ...emptyFormState, sortOrder: orderedItems.length });
    setErrors([]);
  }

  function handleToggle(item: HomeLaunchBanner) {
    toggleActive.mutate(
      { id: item.id, active: !item.active },
      {
        onSuccess: () => {
          toast({
            title: item.active ? "Banner desativado" : "Banner ativado",
            description: "Status atualizado com sucesso.",
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível atualizar o status do banner." });
        },
      }
    );
  }

  function handleDelete(item: HomeLaunchBanner) {
    const confirmation = window.confirm("Excluir este banner de lançamento da Home? Esta ação não poderá ser desfeita.");
    if (!confirmation) return;

    hardDelete.mutate(item.id, {
      onSuccess: () => {
        toast({ title: "Banner excluído", description: "Lançamento removido da Home." });
        if (editingItem?.id === item.id) {
          resetForm();
        }
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível excluir o banner." });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos Home (Carrossel)</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre banners 1080x1440 e vincule cada um a um curso já existente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Atualizar lista
          </Button>
          <Button type="button" onClick={handleCreate}>
            Novo banner
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Editar lançamento" : "Novo lançamento"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.length > 0 && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                  {errors.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do banner</Label>
                <Input
                  value={form.bannerName}
                  onChange={(event) => updateField("bannerName", event.target.value)}
                  placeholder="Ex.: Lançamento Gestão de IA"
                />
              </div>

              <div className="space-y-2">
                <Label>Curso vinculado</Label>
                <Popover open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={coursePickerOpen}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {selectedCourse
                          ? `${selectedCourse.name} · ${MODALITY_LABEL[selectedCourse.modality] ?? selectedCourse.modality}`
                          : "Pesquisar e selecionar curso"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digite o nome do curso..." />
                      <CommandList>
                        <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                        <CommandGroup>
                          {courses.map((course) => (
                            <CommandItem
                              key={course.id}
                              value={`${course.name} ${course.id} ${MODALITY_LABEL[course.modality] ?? course.modality}`}
                              onSelect={() => {
                                updateField("courseId", course.id);
                                setCoursePickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.courseId === course.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate">{course.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {MODALITY_LABEL[course.modality] ?? course.modality}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL da imagem (1080 x 1440)</Label>
              <Input
                value={form.imageUrl}
                onChange={(event) => updateField("imageUrl", event.target.value)}
                placeholder="https://..."
              />
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {uploadingImage ? "Enviando..." : "Enviar imagem"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => updateField("sortOrder", Number(event.target.value || "0"))}
                />
              </div>
              <div className="flex items-center gap-3 mt-6 md:mt-8">
                <Switch checked={form.active} onCheckedChange={(value) => updateField("active", value)} />
                <span className="text-sm">{form.active ? "Banner visível no site" : "Banner oculto"}</span>
              </div>
            </div>

            {form.imageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="max-w-[260px] rounded-xl overflow-hidden border">
                  <img src={form.imageUrl} alt={form.bannerName || "Preview banner"} className="w-full aspect-[3/4] object-cover" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || uploadingImage}>
                {submitting ? "Salvando..." : "Salvar banner"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banners ativos na Home</CardTitle>
        </CardHeader>
        <CardContent>
          {activeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum banner ativo no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {activeItems.map((item) => (
                <div key={item.id} className="rounded-xl border bg-background overflow-hidden">
                  <img src={item.imageUrl} alt={item.bannerName} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold line-clamp-1">{item.bannerName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{coursesById.get(item.courseId) ?? "Curso não encontrado"}</p>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        Editar
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleToggle(item)}>
                        Desativar
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactiveItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Banners inativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inactiveItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.bannerName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{coursesById.get(item.courseId) ?? "Curso não encontrado"}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    Editar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleToggle(item)}>
                    Ativar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {fetchError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erro ao carregar lançamentos da Home.</p>
          <p className="text-sm">{fetchError}</p>
        </div>
      )}

      {!isLoading && !fetchError && orderedItems.length === 0 && (
        <div className="text-sm text-muted-foreground">Nenhum banner cadastrado ainda.</div>
      )}
    </div>
  );
}
