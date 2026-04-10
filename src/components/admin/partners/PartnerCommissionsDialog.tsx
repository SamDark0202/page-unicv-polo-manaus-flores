import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminCommission,
  fetchAdminCommissions,
  markCommissionAsPaid,
  type AdminCommissionRecord,
  type CreateCommissionPayload,
} from "@/lib/adminCommissionApi";
import { CheckCircle2, Loader2, Plus, RefreshCcw } from "lucide-react";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatRefMes(referencia_mes: string): string {
  try {
    const d = new Date(`${referencia_mes}T12:00:00`);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  } catch {
    return referencia_mes;
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parceiroId: string | null;
  parceiroNome: string;
  onUpdated?: () => void;
}

export default function PartnerCommissionsDialog({
  open,
  onOpenChange,
  parceiroId,
  parceiroNome,
  onUpdated,
}: Props) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<AdminCommissionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "pago">("todos");
  const [mesFilter, setMesFilter] = useState("");
  const [paying, setPaying] = useState<Set<string>>(new Set());

  // Nova comissão
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newReferencia, setNewReferencia] = useState("");
  const [newValor, setNewValor] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newIndicacaoId, setNewIndicacaoId] = useState("");

  async function load() {
    if (!parceiroId) return;
    try {
      setLoading(true);
      const data = await fetchAdminCommissions({
        parceiroId,
        status: statusFilter,
        mes: mesFilter || undefined,
      });
      setCommissions(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar comissões",
        description: error instanceof Error ? error.message : "Não foi possível carregar comissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && parceiroId) {
      load();
    } else {
      setCommissions([]);
      setShowCreate(false);
      setNewReferencia("");
      setNewValor("");
      setNewDescricao("");
      setNewIndicacaoId("");
    }
  }, [open, parceiroId]);

  async function handleMarkAsPaid(commission: AdminCommissionRecord) {
    if (commission.status_pagamento === "pago") return;

    setPaying((prev) => new Set(prev).add(commission.id));
    try {
      await markCommissionAsPaid(commission.id);
      toast({ title: "Comissão paga", description: `Comissão de ${brl.format(commission.valor)} marcada como paga.` });
      await load();
      onUpdated?.();
    } catch (error) {
      toast({
        title: "Erro ao marcar pagamento",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setPaying((prev) => {
        const next = new Set(prev);
        next.delete(commission.id);
        return next;
      });
    }
  }

  async function handleCreate() {
    const valorNum = parseFloat(newValor.replace(",", "."));
    if (!newReferencia) {
      toast({ title: "Informe o mês de referência.", variant: "destructive" });
      return;
    }
    if (isNaN(valorNum) || valorNum < 0) {
      toast({ title: "Valor inválido.", variant: "destructive" });
      return;
    }

    const payload: CreateCommissionPayload = {
      parceiro_id: parceiroId!,
      referencia_mes: newReferencia,
      valor: valorNum,
      descricao: newDescricao.trim() || null,
      indicacao_id: newIndicacaoId.trim() || null,
    };

    try {
      setCreating(true);
      await createAdminCommission(payload);
      toast({ title: "Comissão criada", description: "Nova comissão adicionada com sucesso." });
      setShowCreate(false);
      setNewReferencia("");
      setNewValor("");
      setNewDescricao("");
      setNewIndicacaoId("");
      await load();
      onUpdated?.();
    } catch (error) {
      toast({
        title: "Erro ao criar comissão",
        description: error instanceof Error ? error.message : "Não foi possível criar a comissão.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  const totalPendente = commissions
    .filter((c) => c.status_pagamento === "pendente")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const totalPago = commissions
    .filter((c) => c.status_pagamento === "pago")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Comissões — {parceiroNome}</DialogTitle>
          <DialogDescription>
            Controle de pagamentos de comissões por mês de referência.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg border px-4 py-2">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="font-semibold text-amber-600">{brl.format(totalPendente)}</p>
          </div>
          <div className="rounded-lg border px-4 py-2">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-semibold text-green-600">{brl.format(totalPago)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Mês (YYYY-MM)</Label>
            <Input
              className="w-[140px]"
              placeholder="ex: 2025-03"
              value={mesFilter}
              onChange={(e) => setMesFilter(e.target.value)}
            />
          </div>

          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowCreate((prev) => !prev)}
          >
            <Plus className="h-4 w-4" />
            Nova comissão
          </Button>
        </div>

        {/* Formulário nova comissão */}
        {showCreate && (
          <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
            <p className="text-sm font-semibold">Nova comissão manual</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Mês de referência *</Label>
                <Input
                  type="month"
                  value={newReferencia}
                  onChange={(e) => setNewReferencia(e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input
                  value={newValor}
                  onChange={(e) => setNewValor(e.target.value)}
                  placeholder="ex: 150,00"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <Label className="text-xs">Descrição (opcional)</Label>
                <Input
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  placeholder="ex: Comissão referente à matrícula de Ana Silva"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <Label className="text-xs">ID da indicação (opcional)</Label>
                <Input
                  value={newIndicacaoId}
                  onChange={(e) => setNewIndicacaoId(e.target.value)}
                  placeholder="UUID da indicação no banco"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar comissão
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={creating}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : commissions.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-muted-foreground text-sm">
              Nenhuma comissão encontrada para os filtros informados.
            </div>
          ) : (
            commissions.map((commission) => {
              const isPaid = commission.status_pagamento === "pago";
              const isPayingNow = paying.has(commission.id);

              return (
                <div
                  key={commission.id}
                  className="rounded-xl border bg-background/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold capitalize">
                        {formatRefMes(commission.referencia_mes)}
                      </span>
                      <Badge
                        variant={isPaid ? "default" : "secondary"}
                        className={isPaid ? "bg-green-600 text-white" : "text-amber-700 border-amber-400"}
                      >
                        {isPaid ? "Pago" : "Pendente"}
                      </Badge>
                    </div>

                    <p className="text-lg font-bold">{brl.format(Number(commission.valor))}</p>

                    {commission.indicacoes?.nome && (
                      <p className="text-xs text-muted-foreground">
                        Lead: {commission.indicacoes.nome}{" "}
                        {commission.indicacoes.telefone && `· ${commission.indicacoes.telefone}`}
                      </p>
                    )}

                    {commission.descricao && (
                      <p className="text-xs text-muted-foreground">{commission.descricao}</p>
                    )}

                    {isPaid && (
                      <p className="text-xs text-green-600">
                        Pago em {formatDate(commission.pago_em)}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isPaid ? (
                      <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Pago
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(commission)}
                        disabled={isPayingNow}
                      >
                        {isPayingNow ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Marcar como pago
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
