import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePartnerCommissions } from "@/hooks/usePartnerCommissions";
import {
  formatCurrencyBRL,
  formatReferenceMonthLabel,
  getCurrentReferenceMonth,
  getPaymentDateForReferenceMonth,
} from "@/lib/partnerCommission";
import { AlertCircle, CalendarClock, CheckCircle2, Coins, Loader2, Radar, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

interface PartnerCommissionsSectionProps {
  parceiroId: string;
  reloadKey: number;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

export default function PartnerCommissionsSection({ parceiroId, reloadKey }: PartnerCommissionsSectionProps) {
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth());

  const {
    commissions,
    summary,
    loadingCommissions,
    commissionsError,
  } = usePartnerCommissions(parceiroId, referenceMonth, reloadKey);

  const monthlyCommissions = useMemo(() => {
    const grouped = new Map<string, {
      referencia_mes: string;
      total: number;
      quantidadeLeads: number;
      status: "pendente" | "pago";
      pago_em: string | null;
      source: "recorded" | "projected";
    }>();

    for (const item of commissions) {
      const current = grouped.get(item.referencia_mes) || {
        referencia_mes: item.referencia_mes,
        total: 0,
        quantidadeLeads: 0,
        status: "pago" as const,
        pago_em: item.pago_em || null,
        source: item.source === "projected" ? "projected" : "recorded",
      };

      current.total += Number(item.valor || 0);
      current.quantidadeLeads += 1;
      if (item.status_pagamento !== "pago") {
        current.status = "pendente";
      }
      if (item.source === "projected") {
        current.source = "projected";
      }
      if (item.pago_em && (!current.pago_em || new Date(item.pago_em).getTime() > new Date(current.pago_em).getTime())) {
        current.pago_em = item.pago_em;
      }

      grouped.set(item.referencia_mes, current);
    }

    return Array.from(grouped.values()).sort((left, right) => right.referencia_mes.localeCompare(left.referencia_mes));
  }, [commissions]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Comissões</h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            Pagamento todo dia 10, referente às conversões do mês anterior.
          </p>
        </div>
      </div>

      <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <CardContent className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(220px,320px)_1fr]">
          <div className="space-y-2">
            <p className="text-sm font-medium">Mês de referência</p>
            <Input
              type="month"
              value={referenceMonth}
              onChange={(event) => setReferenceMonth(event.target.value)}
              required
            />
          </div>

          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarClock className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Janela de pagamento</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-emerald-950/80">
              Para {formatReferenceMonthLabel(referenceMonth)}, o painel consolida o total de comissão informado nas conversões do mês.
              Quando seu pagamento for realizado, isso aparecerá aqui na referência correspondente.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Convertidas no mês</p>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingCommissions ? "..." : summary.quantidadeConvertidas}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Valor previsto</p>
            </div>
            <p className="mt-3 text-2xl font-bold sm:text-4xl">{loadingCommissions ? "..." : formatCurrencyBRL(summary.valorTotalReceber)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary">
              <WalletCards className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Pendentes</p>
            </div>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingCommissions ? "..." : summary.quantidadePendentes}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Pagas</p>
            </div>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingCommissions ? "..." : summary.quantidadePagas}</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-[28px] shadow-soft xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-amber-600">
              <Radar className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Aguardando lançamento</p>
            </div>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingCommissions ? "..." : summary.quantidadeProjetadas}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {loadingCommissions ? "" : formatCurrencyBRL(summary.valorProjetado)} ainda não entrou na tabela de comissões.
            </p>
          </CardContent>
        </Card>
      </div>

      {loadingCommissions && (
        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando comissões...
            </div>
          </CardContent>
        </Card>
      )}

      {commissionsError && (
        <Card className="rounded-[28px] border-destructive/30 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <p className="text-sm leading-7">Não foi possível carregar as comissões. Detalhe: {commissionsError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingCommissions && !commissionsError && monthlyCommissions.length === 0 && (
        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm leading-7 text-muted-foreground">
              Nenhuma comissão encontrada no mês selecionado.
            </p>
          </CardContent>
        </Card>
      )}

      {!loadingCommissions && !commissionsError && monthlyCommissions.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border-white/60 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.10)]">
          <CardContent className="p-0">
            <div className="border-b border-border/60 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Comissões do período</p>
                  <p className="text-sm text-muted-foreground">
                    {monthlyCommissions.length} referência(s) encontrada(s) para acompanhamento do mês.
                  </p>
                </div>
                {summary.quantidadeProjetadas > 0 && (
                  <Badge className="w-fit bg-amber-100 text-amber-900 hover:bg-amber-100">
                    Atenção: há comissões aguardando sincronização automática.
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {monthlyCommissions.map((item) => {
                const isProjected = item.source === "projected";
                const isPaid = item.status === "pago";

                return (
                  <div key={item.referencia_mes} className="rounded-[24px] border border-border/60 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{formatReferenceMonthLabel(item.referencia_mes.slice(0, 7))}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.quantidadeLeads} lead(s) contabilizado(s)</p>
                      </div>
                      <Badge variant={isPaid ? "default" : "secondary"} className="shrink-0">
                        {isPaid ? "Pago" : "Pendente"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Origem</p>
                        <Badge variant="outline" className={isProjected ? "mt-1 border-amber-300 text-amber-800" : "mt-1 border-emerald-200 text-emerald-800"}>
                          {isProjected ? "Prevista" : "Lançada"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valor</p>
                        <p className="mt-1 font-semibold text-primary">{formatCurrencyBRL(Number(item.total || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Referência</p>
                        <p className="mt-1 font-medium text-foreground">{formatDateLabel(item.referencia_mes)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pagamento</p>
                        <p className="mt-1 font-medium text-foreground">
                          {isPaid && item.pago_em ? `Pago em ${formatDateLabel(item.pago_em)}` : `Prev. ${getPaymentDateForReferenceMonth(referenceMonth)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden px-2 py-2 md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyCommissions.map((item) => {
                    const isProjected = item.source === "projected";
                    const isPaid = item.status === "pago";

                    return (
                      <TableRow key={item.referencia_mes}>
                        <TableCell>
                          <p className="font-semibold">{formatReferenceMonthLabel(item.referencia_mes.slice(0, 7))}</p>
                        </TableCell>
                        <TableCell>{item.quantidadeLeads}</TableCell>
                        <TableCell>{formatDateLabel(item.referencia_mes)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={isProjected ? "border-amber-300 text-amber-800" : "border-emerald-200 text-emerald-800"}>
                            {isProjected ? "Prevista" : "Lançada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPaid ? "default" : "secondary"}>
                            {isPaid ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{formatCurrencyBRL(Number(item.total || 0))}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {isPaid && item.pago_em ? `Pago em ${formatDateLabel(item.pago_em)}` : `Previsão ${getPaymentDateForReferenceMonth(referenceMonth)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}