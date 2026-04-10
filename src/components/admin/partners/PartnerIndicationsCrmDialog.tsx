import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminIndications,
  type AdminIndicationRecord,
  updateAdminIndication,
} from "@/lib/adminIndicationApi";
import { formatPartnerIndicationStatus, type PartnerIndicationStatus } from "@/lib/partnerIndication";
import { Loader2, Save, Search } from "lucide-react";

const STATUS_OPTIONS: Array<{ value: PartnerIndicationStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "convertido", label: "Convertido" },
  { value: "nao_convertido", label: "Não convertido" },
];

type PartnerIndicationsCrmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parceiroId: string | null;
  parceiroNome: string;
  onUpdated?: () => void;
};

type DraftMap = Record<string, {
  status: PartnerIndicationStatus;
  observacao: string;
  curso_interesse: string;
  data_conversao: string;
  valor_matricula: string;
}>;

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function PartnerIndicationsCrmDialog({
  open,
  onOpenChange,
  parceiroId,
  parceiroNome,
  onUpdated,
}: PartnerIndicationsCrmDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [indications, setIndications] = useState<AdminIndicationRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<PartnerIndicationStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<DraftMap>({});

  async function load() {
    if (!parceiroId) return;
    try {
      setLoading(true);
      const rows = await fetchAdminIndications(parceiroId, { status: statusFilter, search: search.trim() });
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
      setDrafts(nextDrafts);
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
    if (open && parceiroId) {
      load();
    }
  }, [open, parceiroId]);

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
    const draft = drafts[id];
    if (!draft) return;

    try {
      setSavingId(id);
      await updateAdminIndication({
        id,
        status: draft.status,
        observacao: draft.observacao,
        curso_interesse: draft.curso_interesse,
        data_conversao: draft.data_conversao || "",
        valor_matricula: draft.valor_matricula,
      });

      toast({
        title: "Indicação atualizada",
        description: "Status e dados de conversão salvos com sucesso.",
      });

      await load();
      onUpdated?.();
    } catch (error) {
      toast({
        title: "Falha ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar a indicação.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Mini CRM de indicações</DialogTitle>
          <DialogDescription>
            Gestão de leads do parceiro {parceiroNome}. Atualize status e preencha os detalhes de conversão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 border-b pb-4 md:grid-cols-[220px_1fr_auto]">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PartnerIndicationStatus | "todos") }>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail"
              className="pl-9"
            />
          </div>

          <Button variant="outline" onClick={load}>
            Atualizar lista
          </Button>
        </div>

        <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando indicações...
            </div>
          ) : indications.length === 0 ? (
            <div className="rounded-xl border py-12 text-center text-muted-foreground">
              Nenhuma indicação encontrada para os filtros informados.
            </div>
          ) : (
            indications.map((item) => {
              const draft = drafts[item.id];
              if (!draft) return null;
              const converted = draft.status === "convertido";

              return (
                <div key={item.id} className="rounded-xl border bg-background p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{item.nome}</p>
                      <p className="text-sm text-muted-foreground">{item.telefone} {item.email ? `• ${item.email}` : ""}</p>
                    </div>
                    <Badge variant="secondary">{formatPartnerIndicationStatus(item.status)}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Status</p>
                      <Select
                        value={draft.status}
                        onValueChange={(value) => updateDraft(item.id, "status", value as PartnerIndicationStatus)}
                      >
                        <SelectTrigger>
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

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Curso de interesse</p>
                      <Input
                        value={draft.curso_interesse}
                        onChange={(event) => updateDraft(item.id, "curso_interesse", event.target.value)}
                        placeholder="Ex: Tecnólogo em Gestão Comercial"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Data de conversão</p>
                      <Input
                        type="date"
                        value={draft.data_conversao}
                        onChange={(event) => updateDraft(item.id, "data_conversao", event.target.value)}
                        disabled={!converted}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Valor da comissão (R$)</p>
                      <Input
                        value={draft.valor_matricula}
                        onChange={(event) => updateDraft(item.id, "valor_matricula", event.target.value)}
                        placeholder="0,00"
                        inputMode="decimal"
                        disabled={!converted}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">Observação do CRM</p>
                      <Textarea
                        value={draft.observacao}
                        onChange={(event) => updateDraft(item.id, "observacao", event.target.value)}
                        placeholder="Notas de atendimento, objeções e próximos passos"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => saveIndication(item.id)} disabled={savingId === item.id}>
                      {savingId === item.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar lead
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
