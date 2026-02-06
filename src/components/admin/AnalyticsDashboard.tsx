import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Eye,
  MousePointerClick,
  FileText,
  MessageCircle,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCcw,
} from "lucide-react";
import { useAnalytics, type DateRange } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: DateRange; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Tudo" },
];

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>("7d");
  const { data, isLoading, error, refetch } = useAnalytics(range);

  const kpiCards = [
    {
      label: "Visitantes únicos",
      value: data?.totalVisitors ?? 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Visualizações de página",
      value: data?.totalPageViews ?? 0,
      icon: Eye,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Cliques em cards",
      value: data?.totalCardClicks ?? 0,
      icon: MousePointerClick,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Formulários enviados",
      value: data?.totalFormSubmits ?? 0,
      icon: FileText,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/10",
    },
    {
      label: "Cliques WhatsApp",
      value: data?.totalWhatsAppClicks ?? 0,
      icon: MessageCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-500/10",
    },
    {
      label: "Tempo médio de sessão",
      value: formatDuration(data?.avgSessionMs ?? 0),
      icon: Clock,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/10",
      isText: true,
    },
  ];

  const maxDaily = Math.max(...(data?.dailyViews?.map((d) => d.views) ?? [1]), 1);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <TabsList>
            {ranges.map((r) => (
              <TabsTrigger key={r.value} value={r.value} className="px-4">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCcw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-semibold">Erro ao carregar métricas</p>
          <p className="text-sm">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border transition-colors">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", kpi.bg)}>
                  <Icon className={cn("h-6 w-6", kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {isLoading ? "…" : kpi.isText ? kpi.value : Number(kpi.value).toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico diário + Tabelas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mini gráfico de barras */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Visualizações por dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">Carregando…</div>
            ) : !data?.dailyViews?.length ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">Sem dados no período</div>
            ) : (
              <div className="flex h-48 items-end gap-1">
                {data.dailyViews.map((d) => {
                  const pct = (d.views / maxDaily) * 100;
                  return (
                    <div
                      key={d.date}
                      className="group relative flex flex-1 flex-col items-center"
                    >
                      <div className="absolute -top-6 rounded bg-foreground/90 px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                        {d.views}
                      </div>
                      <div
                        className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="mt-1 max-w-full truncate text-[9px] text-muted-foreground">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top páginas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Páginas mais visitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">Carregando…</div>
            ) : !data?.topPages?.length ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">Sem dados no período</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {data.topPages.map((p, i) => {
                  const maxViews = data.topPages[0]?.views ?? 1;
                  const pct = (p.views / maxViews) * 100;
                  return (
                    <div key={p.path} className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-xs font-medium text-muted-foreground text-right">
                        {i + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{p.path}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {p.views.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top cards clicados */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-5 w-5 text-muted-foreground" />
              Cursos mais clicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando…</div>
            ) : !data?.topCards?.length ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Sem cliques no período</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.topCards.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 dark:bg-muted/10"
                  >
                    <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {c.clicks}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
