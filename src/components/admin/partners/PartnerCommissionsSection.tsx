import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { fetchAdminPartners, type AdminPartnerRecord } from "@/lib/adminPartnerApi";
import {
  fetchAdminCommissions,
  markCommissionAsPaid,
  type AdminCommissionRecord,
} from "@/lib/adminCommissionApi";
import { Building2, CalendarDays, CheckCircle2, Loader2, RefreshCcw, Wallet, CircleDollarSign, UsersRound } from "lucide-react";

const ALL_PARTNERS_VALUE = "all";

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
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

export default function PartnerCommissionsSection() {
  const { toast } = useToast();

  const [partners, setPartners] = useState<AdminPartnerRecord[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [selectedId, setSelectedId] = useSessionStorageState<string>("controle.partnerCommissions.selectedId", ALL_PARTNERS_VALUE);

  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<AdminCommissionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useSessionStorageState<"todos" | "pendente" | "pago">("controle.partnerCommissions.statusFilter", "todos");
  const [mesFilter, setMesFilter] = useSessionStorageState<string>("controle.partnerCommissions.mesFilter", "");
  const [paying, setPaying] = useState<Set<string>>(new Set());

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
      const data = await fetchAdminCommissions({
        parceiroId: resolvedPartnerId,
        status: "todos",
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
    load(selectedId);
  }, [selectedId]);

  const groupedCommissions = useMemo(() => {
    const map = new Map<string, {
      key: string;
      parceiro_id: string;
      partnerName: string;
      referencia_mes: string;
      status: "pendente" | "pago";
      pago_em: string | null;
      total: number;
      leadCount: number;
      commissionIds: string[];
      pendingIds: string[];
    }>();

    for (const item of commissions) {
      const key = `${item.parceiro_id}::${item.referencia_mes}`;
      const current = map.get(key) || {
        key,
        parceiro_id: item.parceiro_id,
        partnerName: item.parceiros?.nome || partners.find((p) => p.id === item.parceiro_id)?.nome || "Parceiro não identificado",
        referencia_mes: item.referencia_mes,
        status: "pago" as const,
        pago_em: item.pago_em || null,
        total: 0,
        leadCount: 0,
        commissionIds: [],
        pendingIds: [],
      };

      current.total += Number(item.valor || 0);
      current.leadCount += 1;
      current.commissionIds.push(item.id);
      if (item.status_pagamento !== "pago") {
        current.status = "pendente";
        current.pendingIds.push(item.id);
      } else if (!current.pago_em || new Date(item.pago_em || 0).getTime() > new Date(current.pago_em || 0).getTime()) {
        current.pago_em = item.pago_em;
      }

      map.set(key, current);
    }

    return Array.from(map.values())
      .filter((item) => statusFilter === "todos" || item.status === statusFilter)
      .sort((left, right) => {
        if (left.referencia_mes === right.referencia_mes) {
          return left.partnerName.localeCompare(right.partnerName, "pt-BR");
        }
        return right.referencia_mes.localeCompare(left.referencia_mes);
      });
  }, [commissions, partners, statusFilter]);

  async function handleMarkAsPaid(group: (typeof groupedCommissions)[number]) {
    if (group.status === "pago" || group.pendingIds.length === 0) return;

    setPaying((prev) => new Set(prev).add(group.key));
    try {
      await Promise.all(group.pendingIds.map((id) => markCommissionAsPaid(id)));
      toast({
        title: "Comissão do mês paga",
        description: `${brl.format(group.total)} marcado como pago para ${group.partnerName}.`,
      });
      await load(selectedId);
    } catch (error) {
      toast({
        title: "Erro ao marcar pagamento",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setPaying((prev) => {
        const next = new Set(prev);
        next.delete(group.key);
        return next;
      });
    }
  }

  const selectedPartner = selectedId !== ALL_PARTNERS_VALUE ? partners.find((p) => p.id === selectedId) || null : null;

  const summary = useMemo(() => {
    const totalPendente = groupedCommissions.filter((c) => c.status === "pendente").reduce((sum, c) => sum + c.total, 0);
    const totalPago = groupedCommissions.filter((c) => c.status === "pago").reduce((sum, c) => sum + c.total, 0);
    const paidCount = groupedCommissions.filter((c) => c.status === "pago").length;
    const pendingCount = groupedCommissions.filter((c) => c.status === "pendente").length;
    return { totalPendente, totalPago, paidCount, pendingCount };
  }, [groupedCommissions]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-white/60 bg-card/85 shadow-soft supports-[backdrop-filter]:backdrop-blur">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Parceiro</p>
              <Select
                value={selectedId}
                onValueChange={(v) => {
                  setSelectedId(v);
                  setStatusFilter("todos");
                  setMesFilter("");
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
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} - {p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-[160px] space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Status</p>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "todos" | "pendente" | "pago")}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => load(selectedId)} disabled={loading} className="h-12 rounded-2xl px-5">
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(220px,320px)_1fr]">
            <div className="space-y-2">
              <p className="text-sm font-medium">Mês de referência</p>
              <Input
                type="month"
                value={mesFilter}
                onChange={(e) => setMesFilter(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CalendarDays className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Filtro do período</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-emerald-950/80">
                Selecione o mês de referência para visualizar somente o consolidado financeiro daquele período, no mesmo padrão usado no painel do parceiro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[24px] shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-amber-700">
              <Wallet className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Pendente</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{brl.format(summary.totalPendente)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{summary.pendingCount} lançamento(s) aguardando pagamento</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Pago</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{brl.format(summary.totalPago)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{summary.paidCount} lançamento(s) já quitados</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-primary">
              <CircleDollarSign className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Total</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{brl.format(summary.totalPago + summary.totalPendente)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Base consolidada para acompanhamento mensal</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Visão ativa</p>
            </div>
            <p className="mt-3 text-lg font-bold">{selectedPartner?.nome || "Todos os parceiros"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{mesFilter || "Todos os meses"}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-[28px] border bg-card/50 py-20 text-muted-foreground shadow-soft">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando comissões...
        </div>
      ) : groupedCommissions.length === 0 ? (
        <div className="rounded-[28px] border bg-card/50 py-20 text-center text-muted-foreground shadow-soft">
          Nenhuma comissão encontrada para os filtros informados.
        </div>
      ) : (
        <div className="space-y-3">
          {groupedCommissions.map((group) => {
            const isPaid = group.status === "pago";
            const isPayingNow = paying.has(group.key);

            return (
              <div
                key={group.key}
                className="rounded-[24px] border bg-card p-4 shadow-soft sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold capitalize">{formatRefMes(group.referencia_mes)}</span>
                      <Badge
                        variant={isPaid ? "default" : "secondary"}
                        className={isPaid ? "bg-green-600 text-white" : "border-amber-300 text-amber-700"}
                      >
                        {isPaid ? "Pago" : "Pendente"}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {group.partnerName}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <UsersRound className="h-3.5 w-3.5" />
                        {group.leadCount} lead{group.leadCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <p className="text-2xl font-bold">{brl.format(group.total)}</p>

                    <p className={isPaid ? "text-xs font-medium text-green-600" : "text-xs font-medium text-amber-700"}>
                      {isPaid ? `Pago em ${formatDate(group.pago_em)}` : "Aguardando baixa de pagamento deste mês de referência."}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isPaid ? (
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Mês quitado
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleMarkAsPaid(group)} disabled={isPayingNow}>
                        {isPayingNow ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Marcar mês como pago
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}