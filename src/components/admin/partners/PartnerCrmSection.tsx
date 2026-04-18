import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminPartners, type AdminPartnerRecord } from "@/lib/adminPartnerApi";
import {
  createAdminIndication,
  deleteAdminIndication,
  fetchAdminIndications,
  updateAdminIndication,
  type AdminIndicationRecord,
} from "@/lib/adminIndicationApi";
import { formatIndicationPhone, formatPartnerIndicationStatus, type PartnerIndicationStatus } from "@/lib/partnerIndication";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Plus,
  Trash2,
  Eye,
  Filter,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Target,
  Users,
} from "lucide-react";

const ALL_PARTNERS_VALUE = "all";

const STATUS_OPTIONS: Array<{ value: PartnerIndicationStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "convertido", label: "Convertido" },
  { value: "nao_convertido", label: "Não convertido" },
];

const PIPELINE_COLUMNS: Array<{
  status: PartnerIndicationStatus;
  title: string;
  description: string;
  tone: string;
  surface: string;
}> = [
  {
    status: "novo",
    title: "Entrada",
    description: "Leads captados aguardando primeiro contato.",
    tone: "text-sky-800 dark:text-sky-200",
    surface: "border-sky-200 bg-sky-50/85 dark:border-sky-500/35 dark:bg-sky-950/35",
  },
  {
    status: "em_negociacao",
    title: "Negociação",
    description: "Atendimentos aquecidos com follow-up em andamento.",
    tone: "text-amber-800 dark:text-amber-200",
    surface: "border-amber-200 bg-amber-50/85 dark:border-amber-500/35 dark:bg-amber-950/35",
  },
  {
    status: "convertido",
    title: "Convertidos",
    description: "Leads confirmados com potencial de comissão.",
    tone: "text-emerald-800 dark:text-emerald-200",
    surface: "border-emerald-200 bg-emerald-50/85 dark:border-emerald-500/35 dark:bg-emerald-950/35",
  },
  {
    status: "nao_convertido",
    title: "Perdidos",
    description: "Oportunidades encerradas ou sem avanço.",
    tone: "text-rose-800 dark:text-rose-200",
    surface: "border-rose-200 bg-rose-50/85 dark:border-rose-500/35 dark:bg-rose-950/35",
  },
];

type DraftMap = Record<string, {
  status: PartnerIndicationStatus;
  observacao: string;
  curso_interesse: string;
  data_conversao: string;
  valor_matricula: string;
}>;

type CreateLeadDraft = {
  parceiro_id: string;
  nome: string;
  telefone: string;
  email: string;
  observacao: string;
};

function toInputDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function PartnerCrmSection({ canEdit = true, canDeleteLead = true }: { canEdit?: boolean; canDeleteLead?: boolean }) {
  const { toast } = useToast();

  const [partners, setPartners] = useState<AdminPartnerRecord[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [selectedId, setSelectedId] = useSessionStorageState<string>("controle.partnerCrm.selectedId", ALL_PARTNERS_VALUE);

  const [loading, setLoading] = useState(false);
  const [indications, setIndications] = useState<AdminIndicationRecord[]>([]);
  const [search, setSearch] = useSessionStorageState<string>("controle.partnerCrm.search", "");
  const [viewFilter, setViewFilter] = useSessionStorageState<"todos" | "abertos" | "fechados">("controle.partnerCrm.viewFilter", "todos");
  const [drafts, setDrafts] = useSessionStorageState<DraftMap>("controle.partnerCrm.drafts", {});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useSessionStorageState<string | null>("controle.partnerCrm.activeLeadId", null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [leadPendingDeletion, setLeadPendingDeletion] = useState<AdminIndicationRecord | null>(null);
  const [createDraft, setCreateDraft] = useSessionStorageState<CreateLeadDraft>("controle.partnerCrm.createDraft", {
    parceiro_id: "",
    nome: "",
    telefone: "",
    email: "",
    observacao: "",
  });

  useEffect(() => {
    fetchAdminPartners({ search: "", tipo: "todos" })
      .then((data) => setPartners(data))
      .catch(() => toast({ title: "Erro ao carregar parceiros", variant: "destructive" }))
      .finally(() => setLoadingPartners(false));
  }, [toast]);

  async function load(partnerId = selectedId) {
    try {
      setLoading(true);
      const resolvedPartnerId = partnerId === ALL_PARTNERS_VALUE ? undefined : partnerId;
      const rows = await fetchAdminIndications(resolvedPartnerId, { status: "todos" });
      setIndications(rows);

      const nextDrafts: DraftMap = {};
      for (const row of rows) {
        nextDrafts[row.id] = {
          status: row.status,
          observacao: row.observacao || "",
          curso_interesse: row.curso_interesse || "",
          data_conversao: toInputDate(row.data_conversao),
          valor_matricula: row.valor_matricula ? String(row.valor_matricula) : "",
        };
      }

      setDrafts((previousDrafts) => {
        const mergedDrafts: DraftMap = { ...nextDrafts };

        for (const [leadId, draft] of Object.entries(previousDrafts)) {
          if (!mergedDrafts[leadId]) continue;
          mergedDrafts[leadId] = {
            ...mergedDrafts[leadId],
            ...draft,
          };
        }

        return mergedDrafts;
      });
      setActiveLeadId((current) => (current && rows.some((item) => item.id === current) ? current : null));
    } catch (error) {
      toast({
        title: "Erro ao carregar CRM",
        description: error instanceof Error ? error.message : "Não foi possível carregar indicações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(selectedId);
  }, [selectedId]);

  useEffect(() => {
    setCreateDraft((current) => ({
      ...current,
      parceiro_id: selectedId !== ALL_PARTNERS_VALUE ? selectedId : current.parceiro_id,
    }));
  }, [selectedId]);

  function updateDraft(id: string, field: keyof DraftMap[string], value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  async function saveIndication(id: string) {
    if (!canEdit) return;
    const draft = drafts[id];
    if (!draft) return;

    try {
      setSavingId(id);
      const { syncWarning } = await updateAdminIndication({
        id,
        status: draft.status,
        observacao: draft.observacao,
        curso_interesse: draft.curso_interesse,
        data_conversao: draft.data_conversao || "",
        valor_matricula: draft.valor_matricula,
      });

      toast({ title: "Lead atualizado", description: "As informações do CRM foram salvas com sucesso." });
      if (syncWarning) {
        toast({ title: "Aviso de comissão", description: syncWarning, variant: "destructive" });
      }
      await load(selectedId);
    } catch (error) {
      toast({
        title: "Falha ao salvar lead",
        description: error instanceof Error ? error.message : "Não foi possível salvar o lead.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateLead() {
    if (!canEdit) return;
    try {
      setCreatingLead(true);
      await createAdminIndication({
        parceiro_id: createDraft.parceiro_id,
        nome: createDraft.nome,
        telefone: createDraft.telefone,
        email: createDraft.email,
        observacao: createDraft.observacao,
      });

      toast({
        title: "Lead criado",
        description: "O novo lead foi adicionado ao CRM e já ficará disponível no painel do parceiro vinculado.",
      });

      setCreateOpen(false);
      setCreateDraft({
        parceiro_id: selectedId !== ALL_PARTNERS_VALUE ? selectedId : "",
        nome: "",
        telefone: "",
        email: "",
        observacao: "",
      });
      await load(selectedId);
    } catch (error) {
      toast({
        title: "Falha ao criar lead",
        description: error instanceof Error ? error.message : "Não foi possível cadastrar o lead manualmente.",
        variant: "destructive",
      });
    } finally {
      setCreatingLead(false);
    }
  }

  async function handleDeleteLead() {
    if (!canDeleteLead) return;
    if (!leadPendingDeletion) return;

    try {
      setDeletingLeadId(leadPendingDeletion.id);
      await deleteAdminIndication(leadPendingDeletion.id);
      toast({
        title: "Lead excluído",
        description: "O lead e suas comissões vinculadas foram removidos com sucesso.",
      });
      setLeadPendingDeletion(null);
      setActiveLeadId(null);
      await load(selectedId);
    } catch (error) {
      toast({
        title: "Falha ao excluir lead",
        description: error instanceof Error ? error.message : "Não foi possível excluir o lead.",
        variant: "destructive",
      });
    } finally {
      setDeletingLeadId(null);
    }
  }

  const partnerMap = useMemo(() => {
    return new Map(partners.map((partner) => [partner.id, partner]));
  }, [partners]);

  const selectedPartner = selectedId !== ALL_PARTNERS_VALUE ? partnerMap.get(selectedId) || null : null;

  const filteredIndications = useMemo(() => {
    const query = normalize(search.trim());

    return indications.filter((item) => {
      const partnerLabel = item.parceiros?.nome || partnerMap.get(item.parceiro_id)?.nome || "";
      const normalizedBlob = normalize([
        item.nome,
        item.telefone,
        item.email || "",
        item.curso_interesse || "",
        partnerLabel,
      ].join(" "));

      const matchesSearch = !query || normalizedBlob.includes(query);
      const matchesView =
        viewFilter === "todos"
          ? true
          : viewFilter === "abertos"
            ? item.status === "novo" || item.status === "em_negociacao"
            : item.status === "convertido" || item.status === "nao_convertido";

      return matchesSearch && matchesView;
    });
  }, [indications, partnerMap, search, viewFilter]);

  const activeLead = activeLeadId ? indications.find((item) => item.id === activeLeadId) || null : null;
  const activeDraft = activeLead ? drafts[activeLead.id] : null;

  const metrics = useMemo(() => {
    const total = filteredIndications.length;
    const emNegociacao = filteredIndications.filter((item) => item.status === "em_negociacao").length;
    const convertidos = filteredIndications.filter((item) => item.status === "convertido").length;
    const valorPipeline = filteredIndications.reduce((sum, item) => sum + Number(item.valor_matricula || 0), 0);
    return { total, emNegociacao, convertidos, valorPipeline };
  }, [filteredIndications]);

  const groupedColumns = useMemo(() => {
    return PIPELINE_COLUMNS.map((column) => ({
      ...column,
      items: filteredIndications.filter((item) => item.status === column.status),
    }));
  }, [filteredIndications]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-white/60 bg-card/95 shadow-soft supports-[backdrop-filter]:backdrop-blur">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Parceiro</p>
              <Select
                value={selectedId}
                onValueChange={(value) => {
                  setSelectedId(value);
                  setSearch("");
                  setViewFilter("todos");
                }}
                disabled={loadingPartners}
              >
                <SelectTrigger className="h-12 rounded-2xl">
                  {loadingPartners ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando parceiros...
                    </span>
                  ) : (
                    <SelectValue placeholder="Selecione um parceiro ou veja toda a operação" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PARTNERS_VALUE}>Todos os parceiros</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.nome} - {partner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Busca rápida</p>
              <Search className="pointer-events-none absolute left-4 top-[calc(50%+8px)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, telefone, e-mail, curso ou parceiro"
                className="h-12 rounded-2xl pl-10"
              />
            </div>

            <div className="w-full xl:w-[220px] space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recorte</p>
              <Select value={viewFilter} onValueChange={(value) => setViewFilter(value as "todos" | "abertos" | "fechados")}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os leads</SelectItem>
                  <SelectItem value="abertos">Somente pipeline aberto</SelectItem>
                  <SelectItem value="fechados">Somente encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {canEdit && (
                <Button type="button" onClick={() => setCreateOpen(true)} className="h-12 rounded-2xl px-5">
                  <Plus className="h-4 w-4" />
                  Adicionar lead
                </Button>
              )}
              <Button variant="outline" onClick={() => load(selectedId)} disabled={loading} className="h-12 rounded-2xl px-5">
                <RefreshCcw className="h-4 w-4" />
                Atualizar CRM
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center rounded-[28px] border bg-card/50 py-20 text-muted-foreground shadow-soft">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando pipeline comercial...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Users className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Leads visíveis</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{metrics.total}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Target className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Em negociação</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{metrics.emNegociacao}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <BadgeCheck className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Convertidos</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{metrics.convertidos}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary">
                  <CircleDollarSign className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Pipeline financeiro</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{formatCurrency(metrics.valorPipeline)}</p>
              </CardContent>
            </Card>
          </div>

          {filteredIndications.length === 0 ? (
            <div className="rounded-[28px] border bg-card/50 py-20 text-center text-muted-foreground shadow-soft">
              Nenhuma indicação encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="space-y-4 overflow-x-auto pb-2">
              <div className="grid min-w-[1080px] gap-4 xl:min-w-0 xl:grid-cols-4">
                {groupedColumns.map((column) => (
                  <div key={column.status} className={cn("rounded-[28px] border p-4", column.surface)}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className={cn("text-sm font-semibold", column.tone)}>{column.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700/90 dark:text-slate-300/90">{column.description}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold">
                        {column.items.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {column.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-card/85 p-4 text-center text-xs text-foreground/75">
                          Nenhum lead nesta etapa.
                        </div>
                      ) : (
                        column.items.map((item) => {
                          const partnerName = item.parceiros?.nome || partnerMap.get(item.parceiro_id)?.nome || "Parceiro não identificado";

                          return (
                            <div
                              key={item.id}
                              className="rounded-[22px] border border-border/80 bg-card/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                            >
                              <div className="space-y-3 text-[13px] text-foreground/85">
                                <div className="min-w-0">
                                  <p className="truncate text-lg font-semibold text-foreground">{item.nome}</p>
                                </div>
                                <div>
                                  <p className="text-foreground/80">Criado em {formatDateLabel(item.data_criacao)}</p>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span className="truncate font-medium">{partnerName}</span>
                                </div>
                              </div>

                              <div className="mt-4">
                                <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => setActiveLeadId(item.id)}>
                                  <Eye className="h-4 w-4" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={Boolean(activeLead && activeDraft)} onOpenChange={(open) => setActiveLeadId(open ? activeLeadId : null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-[28px]">
          {!activeLead || !activeDraft ? null : (
            <>
              <DialogHeader>
                <DialogTitle>Detalhamento do lead</DialogTitle>
                <DialogDescription>
                  {activeLead.parceiros?.nome || partnerMap.get(activeLead.parceiro_id)?.nome || "Parceiro não identificado"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-[24px] border bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{activeLead.nome}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeLead.telefone}
                      {activeLead.email ? ` - ${activeLead.email}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                    {formatPartnerIndicationStatus(activeDraft.status)}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Origem</p>
                    <p className="mt-2 text-sm font-medium">
                      {activeLead.parceiros?.nome || partnerMap.get(activeLead.parceiro_id)?.nome || "Parceiro não identificado"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Entrada</p>
                    <p className="mt-2 text-sm font-medium">{formatDateLabel(activeLead.data_criacao)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etapa do pipeline</p>
                    <Select value={activeDraft.status} onValueChange={(value) => updateDraft(activeLead.id, "status", value as PartnerIndicationStatus)} disabled={!canEdit}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((option) => option.value !== "todos").map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Curso de interesse</p>
                    <Input
                      className="h-11 rounded-2xl"
                      value={activeDraft.curso_interesse}
                      onChange={(event) => updateDraft(activeLead.id, "curso_interesse", event.target.value)}
                      placeholder="Ex: Tecnólogo em Gestão Comercial"
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Data de conversão</p>
                      <Input
                        type="date"
                        className="h-11 rounded-2xl"
                        value={activeDraft.data_conversao}
                        onChange={(event) => updateDraft(activeLead.id, "data_conversao", event.target.value)}
                        disabled={!canEdit || activeDraft.status !== "convertido"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valor da comissão</p>
                      <Input
                        className="h-11 rounded-2xl"
                        value={activeDraft.valor_matricula}
                        onChange={(event) => updateDraft(activeLead.id, "valor_matricula", event.target.value)}
                        placeholder="0,00"
                        inputMode="decimal"
                        disabled={!canEdit || activeDraft.status !== "convertido"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notas do CRM</p>
                    <Textarea
                      value={activeDraft.observacao}
                      onChange={(event) => updateDraft(activeLead.id, "observacao", event.target.value)}
                      placeholder="Registre contexto, objeções, temperatura e próximos passos"
                      rows={7}
                      className="rounded-2xl"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Ao salvar, o lead é reclassificado e a comissão é sincronizada.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {canDeleteLead && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLeadPendingDeletion(activeLead)}
                        disabled={deletingLeadId === activeLead.id}
                        className="rounded-2xl px-5 text-destructive hover:text-destructive"
                      >
                        {deletingLeadId === activeLead.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Excluir lead
                          </>
                        )}
                      </Button>
                    )}
                    {canEdit && (
                      <Button onClick={() => saveIndication(activeLead.id)} disabled={savingId === activeLead.id} className="rounded-2xl px-5">
                        {savingId === activeLead.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salvar alterações
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={canEdit && createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Novo lead manual</DialogTitle>
            <DialogDescription>
              Cadastre uma indicação diretamente no CRM e atribua o lead ao parceiro correto para refletir também no painel dele.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Parceiro responsável</p>
              <Select
                value={createDraft.parceiro_id}
                onValueChange={(value) => setCreateDraft((current) => ({ ...current, parceiro_id: value }))}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Selecione o parceiro para receber o lead" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.nome} - {partner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nome do lead</p>
              <Input
                className="h-11 rounded-2xl"
                value={createDraft.nome}
                onChange={(event) => setCreateDraft((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Telefone</p>
              <Input
                className="h-11 rounded-2xl"
                value={createDraft.telefone}
                onChange={(event) => setCreateDraft((current) => ({ ...current, telefone: formatIndicationPhone(event.target.value) }))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">E-mail</p>
              <Input
                className="h-11 rounded-2xl"
                value={createDraft.email}
                onChange={(event) => setCreateDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="lead@exemplo.com"
                type="email"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Observação</p>
              <Textarea
                value={createDraft.observacao}
                onChange={(event) => setCreateDraft((current) => ({ ...current, observacao: event.target.value }))}
                placeholder="Contexto, canal de origem, urgência ou próximos passos"
                rows={5}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setCreateOpen(false)} disabled={creatingLead}>
              Cancelar
            </Button>
            <Button type="button" className="rounded-2xl px-5" onClick={handleCreateLead} disabled={creatingLead}>
              {creatingLead ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar lead
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={canDeleteLead && Boolean(leadPendingDeletion)}
        onOpenChange={(open) => {
          if (!open && !deletingLeadId) {
            setLeadPendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead do CRM</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o lead do CRM, do painel do parceiro e também excluirá as comissões vinculadas a essa indicação. Use apenas para cadastros incorretos ou duplicados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingLeadId)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteLead();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingLeadId ? "Excluindo..." : "Confirmar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}