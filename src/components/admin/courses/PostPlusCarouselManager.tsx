import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePostPlusCarouselMutations, usePostPlusCarouselQuery } from "@/hooks/usePostPlusCarousel";
import type { PostPlusCarouselItem, PostPlusCarouselItemInput } from "@/types/postPlusCarousel";
import { uploadPostPlusCarouselImage } from "@/lib/supabaseClient";
import { ImagePlus, Link2, Monitor, Smartphone, Trash2 } from "lucide-react";

type FormState = PostPlusCarouselItemInput;

const emptyFormState: FormState = {
  bannerName: "",
  imageUrl: "",
  mobileImageUrl: "",
  metaDescription: "",
  targetUrl: "",
  sortOrder: 0,
  active: true,
};

function cloneToFormState(item: PostPlusCarouselItem | null): FormState {
  if (!item) return { ...emptyFormState };

  return {
    id: item.id,
    bannerName: item.bannerName,
    imageUrl: item.imageUrl,
    mobileImageUrl: item.mobileImageUrl,
    metaDescription: item.metaDescription,
    targetUrl: item.targetUrl ?? "",
    sortOrder: item.sortOrder,
    active: item.active,
  };
}

function isValidOptionalUrl(url: string) {
  if (!url.trim()) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function PostPlusCarouselManager() {
  const { data: items = [], isLoading, error, refetch } = usePostPlusCarouselQuery({ activeOnly: false });
  const { upsert, toggleActive, hardDelete } = usePostPlusCarouselMutations();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<PostPlusCarouselItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobileImage, setUploadingMobileImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(cloneToFormState(editingItem));
    setErrors([]);
  }, [editingItem]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)),
    [items]
  );
  const activeItems = useMemo(
    () => orderedItems.filter((item) => item.active),
    [orderedItems]
  );
  const inactiveItemsCount = orderedItems.length - activeItems.length;
  const isEditing = Boolean(editingItem);

  const fetchError = error instanceof Error ? error.message : null;
  const submitting = upsert.isPending;

  function resetForm() {
    setEditingItem(null);
    setForm({ ...emptyFormState });
    setErrors([]);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string[] {
    const issues: string[] = [];

    if (!form.bannerName.trim()) {
      issues.push("Informe um nome para o banner.");
    }

    if (!form.imageUrl.trim()) {
      issues.push("Informe a URL da imagem desktop do banner.");
    }

    if (!form.mobileImageUrl.trim()) {
      issues.push("Informe a URL da imagem mobile do banner (1080x1080).");
    }

    if (!form.metaDescription.trim()) {
      issues.push("Informe a meta descrição da imagem para SEO.");
    }

    if (!isValidOptionalUrl(form.targetUrl ?? "")) {
      issues.push("O link da imagem deve começar com http:// ou https://.");
    }

    if (!Number.isFinite(form.sortOrder)) {
      issues.push("A ordem de exibição precisa ser um número válido.");
    }

    return issues;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const issues = validate();
    setErrors(issues);
    if (issues.length > 0) return;

    try {
      await upsert.mutateAsync({
        ...form,
        targetUrl: form.targetUrl?.trim() || undefined,
      });

      toast({
        title: "Item salvo",
        description: "Banner do carrossel Pós+ atualizado com sucesso.",
      });

      resetForm();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível salvar o item do carrossel." });
    }
  }

  async function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadPostPlusCarouselImage(file);
      updateField("imageUrl", imageUrl);
      toast({ title: "Imagem enviada", description: "Imagem desktop do carrossel atualizada no Supabase Storage." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar a imagem desktop do carrossel." });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleUploadMobileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMobileImage(true);
      const imageUrl = await uploadPostPlusCarouselImage(file);
      updateField("mobileImageUrl", imageUrl);
      toast({ title: "Imagem mobile enviada", description: "Imagem mobile (1080x1080) atualizada no Supabase Storage." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar a imagem mobile do carrossel." });
    } finally {
      setUploadingMobileImage(false);
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = "";
      }
    }
  }

  function handleEdit(item: PostPlusCarouselItem) {
    setEditingItem(item);
  }

  function handleCreate() {
    setEditingItem(null);
    setForm({
      ...emptyFormState,
      sortOrder: orderedItems.length,
    });
    setErrors([]);
  }

  function handleToggle(item: PostPlusCarouselItem) {
    toggleActive.mutate(
      { id: item.id, active: !item.active },
      {
        onSuccess: () => {
          toast({
            title: item.active ? "Item desativado" : "Item ativado",
            description: "Status atualizado com sucesso.",
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível atualizar o status do item." });
        },
      }
    );
  }

  function handleDelete(item: PostPlusCarouselItem) {
    const confirmation = window.confirm("Excluir este banner do carrossel Pós+? Esta ação não poderá ser desfeita.");
    if (!confirmation) return;

    hardDelete.mutate(item.id, {
      onSuccess: () => {
        toast({ title: "Item excluído", description: "Banner removido do carrossel Pós+." });
        if (editingItem?.id === item.id) {
          resetForm();
        }
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível excluir o item." });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carrossel de Cursos Pós+</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie banners desktop e mobile com um fluxo simples e seguro para publicação.
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{orderedItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-emerald-600">{activeItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold text-amber-600">{inactiveItemsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Modo</p>
            <p className="text-sm font-semibold">{isEditing ? "Editando" : "Novo cadastro"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{editingItem ? "Editar banner" : "Novo banner"}</CardTitle>
            <Badge variant={editingItem ? "default" : "secondary"}>
              {editingItem ? `Editando #${editingItem.sortOrder}` : "Pronto para cadastrar"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.length > 0 && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">Corrija os campos abaixo:</p>
                <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                  {errors.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Imagens do banner</h3>
                <p className="text-xs text-muted-foreground">Desktop horizontal e Mobile 1080x1080</p>
              </div>
              <div className="space-y-2">
                <Label>Nome do banner</Label>
                <Input
                  value={form.bannerName}
                  onChange={(event) => updateField("bannerName", event.target.value)}
                  placeholder="Ex.: Pós+ Futsal Marquinhos Xavier"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2"><Monitor className="h-4 w-4" /> URL da imagem Desktop</Label>
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
                      {uploadingImage ? "Enviando..." : "Enviar Desktop"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4" /> URL da imagem Mobile (1080x1080)</Label>
                  <Input
                    value={form.mobileImageUrl}
                    onChange={(event) => updateField("mobileImageUrl", event.target.value)}
                    placeholder="https://..."
                  />
                  <div className="flex gap-2">
                    <input
                      ref={mobileFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadMobileImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => mobileFileInputRef.current?.click()}
                      disabled={uploadingMobileImage}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      {uploadingMobileImage ? "Enviando..." : "Enviar Mobile"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link da imagem (opcional)</Label>
                <div className="relative">
                  <Link2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={form.targetUrl ?? ""}
                    onChange={(event) => updateField("targetUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => updateField("sortOrder", Number(event.target.value || "0"))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta descrição da imagem (SEO)</Label>
              <Textarea
                rows={3}
                value={form.metaDescription}
                onChange={(event) => updateField("metaDescription", event.target.value)}
                placeholder="Descreva a imagem com foco em SEO para melhorar ranqueamento e acessibilidade"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(value) => updateField("active", value)} />
              <span className="text-sm">{form.active ? "Banner visível no site" : "Banner oculto"}</span>
            </div>

            {(form.imageUrl || form.mobileImageUrl) && (
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <Label>Preview das imagens</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.imageUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Desktop</p>
                      <div className="rounded-xl overflow-hidden border bg-background">
                        <img src={form.imageUrl} alt={form.metaDescription || "Preview desktop"} className="w-full aspect-[16/7] object-cover" />
                      </div>
                    </div>
                  )}
                  {form.mobileImageUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Mobile (1080x1080)</p>
                      <div className="rounded-xl overflow-hidden border bg-background">
                        <img src={form.mobileImageUrl} alt={form.metaDescription || "Preview mobile"} className="w-full aspect-square object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border rounded-xl p-3">
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpar
                </Button>
                <Button type="submit" disabled={submitting || uploadingImage || uploadingMobileImage}>
                  {submitting ? "Salvando..." : "Salvar banner"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visualização de banners ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando banners...</p>
          ) : activeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum banner ativo no momento.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeItems.map((item) => (
                <div key={`active-${item.id}`} className="rounded-xl overflow-hidden border bg-background">
                  <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600">Ativo</Badge>
                      <Badge variant="outline">Ordem: {item.sortOrder}</Badge>
                      <Badge variant="secondary" className="max-w-[240px] truncate">{item.bannerName}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  <div className="p-3 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.metaDescription}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl overflow-hidden border bg-background">
                        <img src={item.imageUrl} alt={item.metaDescription} className="w-full aspect-[16/7] object-cover" />
                      </div>
                      <div className="rounded-xl overflow-hidden border bg-background">
                        <img src={item.mobileImageUrl} alt={item.metaDescription} className="w-full aspect-square object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {fetchError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erro ao carregar carrossel Pós+.</p>
          <p className="text-sm">{fetchError}</p>
        </div>
      )}

      {!isLoading && !fetchError && inactiveItemsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Banners inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderedItems
                .filter((item) => !item.active)
                .map((item) => (
                  <div key={`inactive-${item.id}`} className="rounded-lg border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.bannerName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.metaDescription}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
