import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_TECHNICAL_CATEGORIES,
  loadTechnicalCompetenceCourses,
  saveTechnicalCompetenceCourses,
  type TechnicalCompetenceCourse,
} from "@/lib/technicalCompetenceStorage";
import { generateTecnicoCompetenciaPdf } from "@/lib/tecnicoCompetenciaPdf";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";

const normalize = (text: string) =>
  (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type Props = {
  canEditCourses?: boolean;
};

export default function TechnicalCompetenceManager({ canEditCourses = true }: Props) {
  const [courses, setCourses] = useState<TechnicalCompetenceCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("todos");
  const [isExporting, setIsExporting] = useState(false);

  // Form Modal State (Create or Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TechnicalCompetenceCourse | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(DEFAULT_TECHNICAL_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [formCashPrice, setFormCashPrice] = useState("R$ 840,00");
  const [formCreditCardInstallment, setFormCreditCardInstallment] = useState("12X de R$ 76,16");
  const [formBoletoInstallment, setFormBoletoInstallment] = useState("12X de R$ 108,25");
  const [formMatriculaTax, setFormMatriculaTax] = useState("R$ 99,00");

  // Delete Dialog State
  const [deletingCourse, setDeletingCourse] = useState<TechnicalCompetenceCourse | null>(null);

  const { toast } = useToast();

  // Carregar lista de cursos
  const reloadCourses = () => {
    const loaded = loadTechnicalCompetenceCourses();
    setCourses(loaded);
  };

  useEffect(() => {
    reloadCourses();

    const handleUpdate = () => reloadCourses();
    window.addEventListener("technicalCompetenceCoursesUpdated", handleUpdate);
    return () => window.removeEventListener("technicalCompetenceCoursesUpdated", handleUpdate);
  }, []);

  // Lista de categorias existentes dinâmicas
  const availableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_TECHNICAL_CATEGORIES);
    courses.forEach((c) => {
      if (c.category?.trim()) set.add(c.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [courses]);

  // Cursos filtrados
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        normalize(c.name).includes(normalize(searchTerm)) ||
        normalize(c.category).includes(normalize(searchTerm));
      const matchesCategory =
        selectedCategoryFilter === "todos" ||
        normalize(c.category) === normalize(selectedCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategoryFilter]);

  // Abrir Modal de Cadastro
  const handleOpenCreate = () => {
    if (!canEditCourses) return;
    setEditingCourse(null);
    setFormName("");
    setFormCategory(availableCategories[0] || "Gestão e Negócios");
    setCustomCategory("");
    setFormCashPrice("R$ 840,00");
    setFormCreditCardInstallment("12X de R$ 76,16");
    setFormBoletoInstallment("12X de R$ 108,25");
    setFormMatriculaTax("R$ 99,00");
    setIsFormOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (course: TechnicalCompetenceCourse) => {
    if (!canEditCourses) return;
    setEditingCourse(course);
    setFormName(course.name);

    if (availableCategories.includes(course.category)) {
      setFormCategory(course.category);
      setCustomCategory("");
    } else {
      setFormCategory("outra");
      setCustomCategory(course.category);
    }

    setFormCashPrice(course.cashPrice || "");
    setFormCreditCardInstallment(course.creditCardInstallment || "");
    setFormBoletoInstallment(course.boletoInstallment || "");
    setFormMatriculaTax(course.matriculaTax || "");
    setIsFormOpen(true);
  };

  // Salvar (Cadastrar ou Atualizar)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCourses) return;

    const finalName = formName.trim();
    const finalCategory = (formCategory === "outra" ? customCategory : formCategory).trim();

    if (!finalName) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do curso.",
        variant: "destructive",
      });
      return;
    }

    if (!finalCategory) {
      toast({
        title: "Categoria obrigatória",
        description: "Por favor, informe a categoria do curso.",
        variant: "destructive",
      });
      return;
    }

    let updatedList: TechnicalCompetenceCourse[];

    if (editingCourse) {
      // Edição
      updatedList = courses.map((item) =>
        item.id === editingCourse.id
          ? {
              ...item,
              name: finalName,
              category: finalCategory,
              cashPrice: formCashPrice.trim() || "R$ 840,00",
              creditCardInstallment: formCreditCardInstallment.trim() || "12X de R$ 76,16",
              boletoInstallment: formBoletoInstallment.trim() || "12X de R$ 108,25",
              matriculaTax: formMatriculaTax.trim() || "R$ 99,00",
            }
          : item
      );
      toast({
        title: "Curso atualizado",
        description: `O curso "${finalName}" foi atualizado com sucesso.`,
      });
    } else {
      // Cadastro
      const newCourse: TechnicalCompetenceCourse = {
        id: `tc-custom-${Date.now()}`,
        name: finalName,
        category: finalCategory,
        cashPrice: formCashPrice.trim() || "R$ 840,00",
        creditCardInstallment: formCreditCardInstallment.trim() || "12X de R$ 76,16",
        boletoInstallment: formBoletoInstallment.trim() || "12X de R$ 108,25",
        matriculaTax: formMatriculaTax.trim() || "R$ 99,00",
        active: true,
      };
      updatedList = [...courses, newCourse];
      toast({
        title: "Curso cadastrado",
        description: `O curso "${finalName}" foi adicionado com sucesso.`,
      });
    }

    saveTechnicalCompetenceCourses(updatedList);
    setCourses(updatedList);
    setIsFormOpen(false);
  };

  // Excluir Curso
  const handleConfirmDelete = () => {
    if (!deletingCourse || !canEditCourses) return;

    const updatedList = courses.filter((item) => item.id !== deletingCourse.id);
    saveTechnicalCompetenceCourses(updatedList);
    setCourses(updatedList);

    toast({
      title: "Curso excluído",
      description: `O curso "${deletingCourse.name}" foi removido com sucesso.`,
    });

    setDeletingCourse(null);
  };

  // Baixar PDF da lista dos cursos
  const handleDownloadPdf = async () => {
    if (courses.length === 0) {
      toast({
        title: "Nenhum curso cadastrado",
        description: "Não há cursos disponíveis para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      await generateTecnicoCompetenciaPdf(filteredCourses.length > 0 ? filteredCourses : courses);
      toast({
        title: "PDF baixado com sucesso",
        description: "A lista de cursos técnicos por competência foi baixada em PDF.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar a lista em PDF no momento.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Técnico por Competência</CardTitle>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                  {courses.length} curso(s)
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Gestão dos cursos da modalidade por competência. Cadastre novos cursos, edite nome e valores ou baixe a lista oficial em PDF.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={reloadCourses}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isExporting || courses.length === 0}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Gerando PDF..." : "Baixar Lista em PDF"}
              </Button>

              {canEditCourses && (
                <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" /> Cadastrar Novo Curso
                </Button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Buscar curso por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Categorias</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCourses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum curso encontrado para o filtro aplicado.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border bg-background overflow-x-auto">
              <Table className="min-w-[850px]">
                <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold">
                  <TableRow>
                    <TableHead className="w-[30%]">Curso Técnico</TableHead>
                    <TableHead className="w-[20%]">Categoria</TableHead>
                    <TableHead className="w-[12%]">À Vista</TableHead>
                    <TableHead className="w-[14%]">Cartão de Crédito</TableHead>
                    <TableHead className="w-[14%]">Boleto</TableHead>
                    <TableHead className="w-[10%]">Matrícula</TableHead>
                    {canEditCourses && <TableHead className="w-[10%] text-center">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course, idx) => (
                    <TableRow key={course.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <TableCell className="font-semibold text-foreground">{course.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-300 font-normal">
                          {course.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-700 dark:text-emerald-400">
                        {course.cashPrice || "R$ 840,00"}
                      </TableCell>
                      <TableCell className="text-sm">{course.creditCardInstallment || "12X de R$ 76,16"}</TableCell>
                      <TableCell className="text-sm">{course.boletoInstallment || "12X de R$ 108,25"}</TableCell>
                      <TableCell className="text-sm font-medium">{course.matriculaTax || "R$ 99,00"}</TableCell>
                      {canEditCourses && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar Curso"
                              onClick={() => handleOpenEdit(course)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Excluir Curso"
                              onClick={() => setDeletingCourse(course)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cadastro / Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Editar Curso Técnico por Competência" : "Cadastrar Novo Curso"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Altere o nome, categoria e os valores de pagamento deste curso."
                : "Preencha as informações abaixo para adicionar um novo curso à lista."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2">
            <div>
              <Label htmlFor="courseName" className="font-semibold mb-1 block">
                Nome do Curso *
              </Label>
              <Input
                id="courseName"
                placeholder="Ex: Técnico em Eletrotécnica"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="courseCategory" className="font-semibold mb-1 block">
                Categoria *
              </Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="courseCategory">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="outra">+ Outra (nova categoria)</SelectItem>
                </SelectContent>
              </Select>

              {formCategory === "outra" && (
                <Input
                  className="mt-2"
                  placeholder="Digite a nova categoria"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cashPrice" className="font-semibold mb-1 block">
                  Valor À Vista
                </Label>
                <Input
                  id="cashPrice"
                  placeholder="Ex: R$ 840,00"
                  value={formCashPrice}
                  onChange={(e) => setFormCashPrice(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="matriculaTax" className="font-semibold mb-1 block">
                  Taxa de Matrícula
                </Label>
                <Input
                  id="matriculaTax"
                  placeholder="Ex: R$ 99,00"
                  value={formMatriculaTax}
                  onChange={(e) => setFormMatriculaTax(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditCard" className="font-semibold mb-1 block">
                  Cartão de Crédito
                </Label>
                <Input
                  id="creditCard"
                  placeholder="Ex: 12X de R$ 76,16"
                  value={formCreditCardInstallment}
                  onChange={(e) => setFormCreditCardInstallment(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="boleto" className="font-semibold mb-1 block">
                  Boleto Bancário
                </Label>
                <Input
                  id="boleto"
                  placeholder="Ex: 12X de R$ 108,25"
                  value={formBoletoInstallment}
                  onChange={(e) => setFormBoletoInstallment(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingCourse ? "Salvar Alterações" : "Cadastrar Curso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!deletingCourse} onOpenChange={(open) => !open && setDeletingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o curso <strong>"{deletingCourse?.name}"</strong> da lista de Técnico por Competência?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCourse(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Sim, Excluir Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
