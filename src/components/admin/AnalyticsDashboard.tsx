import { useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Link,
  X,
} from "lucide-react";
import {
  useAnalytics,
  type AnalyticsFilter,
  type DateRange,
  type DynamicFilters,
} from "@/hooks/useAnalytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type RangeTabValue = DateRange | "custom";
type MetricView = "all" | "views" | "whatsapp" | "forms";
type MetricSeries = Exclude<MetricView, "all">;
type CustomRange = { start: string; end: string };

const rangeTabs: Array<{ value: RangeTabValue; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Tudo" },
  { value: "custom", label: "Personalizado" },
];

const metricTabs: Array<{ value: MetricView; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "views", label: "Visualizações" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "forms", label: "Formulários" },
];

const metricSeriesOrder: MetricSeries[] = ["views", "whatsapp", "forms"];

const chartConfig = {
  views: {
    label: "Visualizações",
    color: "#6366f1",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#22c55e",
  },
  forms: {
    label: "Formulários",
    color: "#f97316",
  },
} satisfies ChartConfig;

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function formatDateLabel(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }
  return shortDateFormatter.format(parsed);
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultCustomRange(): CustomRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    start: toInputDate(start),
    end: toInputDate(end),
  };
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

export default function AnalyticsDashboard() {
  const [filter, setFilter] = useState<AnalyticsFilter>({ mode: "preset", range: "7d" });
  const [customDraft, setCustomDraft] = useState<CustomRange>(() => defaultCustomRange());
  const [metricView, setMetricView] = useState<MetricView>("all");
  const [rangeTab, setRangeTab] = useState<RangeTabValue>("7d");
  
  // Filtros dinâmicos acumulativos
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectedReferrers, setSelectedReferrers] = useState<Set<string>>(new Set());

  const dynamicFilters: DynamicFilters = {
    pages: selectedPages.size > 0 ? selectedPages : undefined,
    cards: selectedCards.size > 0 ? selectedCards : undefined,
    referrers: selectedReferrers.size > 0 ? selectedReferrers : undefined,
  };

  const { data, isLoading, error, refetch } = useAnalytics(filter, dynamicFilters);

  const isCustomActive = rangeTab === "custom";
  const isCustomValid = Boolean(
    customDraft.start &&
    customDraft.end &&
    customDraft.start <= customDraft.end
  );

  const chartData = data?.dailyMetrics ?? [];
  const activeSeries: MetricSeries[] =
    metricView === "all" ? metricSeriesOrder : [metricView as MetricSeries];
  const hasChartPoints =
    chartData.length > 0 &&
    activeSeries.some((seriesKey) => chartData.some((point) => point[seriesKey] > 0));
  const topPagesTotal = data?.topPages?.reduce((sum, page) => sum + page.views, 0) ?? 0;

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

  function togglePageFilter(page: string) {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(page)) {
        newSet.delete(page);
      } else {
        newSet.add(page);
      }
      return newSet;
    });
  }

  function toggleCardFilter(card: string) {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(card)) {
        newSet.delete(card);
      } else {
        newSet.add(card);
      }
      return newSet;
    });
  }

  function toggleReferrerFilter(referrer: string) {
    setSelectedReferrers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(referrer)) {
        newSet.delete(referrer);
      } else {
        newSet.add(referrer);
      }
      return newSet;
    });
  }

  function clearAllFilters() {
    setSelectedPages(new Set());
    setSelectedCards(new Set());
    setSelectedReferrers(new Set());
  }

  function handleRangeTabChange(value: RangeTabValue) {
    setRangeTab(value);
    if (value === "custom") {
      return;
    }
    if (filter.mode !== "preset" || filter.range !== value) {
      setFilter({ mode: "preset", range: value });
    }
  }

  function handleApplyCustomRange() {
    if (!isCustomValid) return;
    setRangeTab("custom");
    setFilter({ mode: "custom", ...customDraft });
  }

  return (
    <div className="space-y-6">
      {/* Filtros Ativos */}
      {(selectedPages.size > 0 || selectedCards.size > 0 || selectedReferrers.size > 0) && (
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedPages).map((page) => (
                <Badge
                  key={`page-${page}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => togglePageFilter(page)}
                >
                  📄 {page}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {Array.from(selectedCards).map((card) => (
                <Badge
                  key={`card-${card}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => toggleCardFilter(card)}
                >
                  🎯 {card}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {Array.from(selectedReferrers).map((referrer) => (
                <Badge
                  key={`referrer-${referrer}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => toggleReferrerFilter(referrer)}
                >
                  🔗 {referrer.length > 30 ? `${referrer.substring(0, 30)}…` : referrer}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Limpar tudo
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={rangeTab} onValueChange={(v) => handleRangeTabChange(v as RangeTabValue)}>
            <TabsList className="flex flex-wrap gap-1">
              {rangeTabs.map((r) => (
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

        {isCustomActive && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-inner sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="analytics-start-date">
                Data inicial
              </label>
              <Input
                id="analytics-start-date"
                type="date"
                value={customDraft.start}
                max={customDraft.end || undefined}
                onChange={(event) =>
                  setCustomDraft((prev) => ({ ...prev, start: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="analytics-end-date">
                Data final
              </label>
              <Input
                id="analytics-end-date"
                type="date"
                value={customDraft.end}
                min={customDraft.start || undefined}
                onChange={(event) =>
                  setCustomDraft((prev) => ({ ...prev, end: event.target.value }))
                }
              />
            </div>
            <Button
              type="button"
              onClick={handleApplyCustomRange}
              disabled={!isCustomValid || isLoading}
              className="shrink-0"
            >
              Aplicar período
            </Button>
          </div>
        )}
        {!isCustomValid && isCustomActive && (
          <p className="text-xs font-medium text-red-500">
            A data inicial precisa ser menor ou igual à final para aplicar o filtro.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-semibold">Erro ao carregar métricas</p>
          <p className="text-sm">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
        </div>
      )}

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Evolução diária
            </CardTitle>
            <Tabs value={metricView} onValueChange={(value) => setMetricView(value as MetricView)}>
              <TabsList className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                {metricTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground">Carregando…</div>
            ) : !chartData.length || !hasChartPoints ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <p>Sem dados no período selecionado.</p>
                <p className="text-xs">Ajuste o filtro ou aguarde novos eventos.</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                <LineChart data={chartData} margin={{ left: 12, right: 12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 4" className="stroke-border/60" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} width={46} tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {activeSeries.map((series) => (
                    <Line
                      key={series}
                      type="monotone"
                      dataKey={series}
                      stroke={`var(--color-${series})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

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
              <div className="space-y-3">
                {data.topPages.map((p, i) => {
                  const pctTotal = topPagesTotal > 0 ? (p.views / topPagesTotal) * 100 : 0;
                  const barWidth = Math.max(pctTotal, 3);
                  const isSelected = selectedPages.has(p.path);
                  return (
                    <div
                      key={p.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors",
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-500/20"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => togglePageFilter(p.path)}
                    >
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
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-1.5 rounded-full",
                                isSelected ? "bg-blue-500" : "bg-primary/70"
                              )}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div
                            className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            aria-label={`Participação de ${pctTotal.toFixed(1)}%`}
                          >
                            {pctTotal.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                {data.topCards.map((c) => {
                  const isSelected = selectedCards.has(c.name);
                  return (
                    <div
                      key={c.name}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border px-4 py-3 cursor-pointer transition-colors",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/20"
                          : "border-border bg-muted/40 hover:border-blue-300 dark:bg-muted/10 dark:hover:border-blue-500/50"
                      )}
                      onClick={() => toggleCardFilter(c.name)}
                    >
                      <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold",
                          isSelected
                            ? "bg-blue-200 text-blue-700 dark:bg-blue-500/40 dark:text-blue-200"
                            : "bg-primary/10 text-primary"
                        )}>
                          <MousePointerClick className="h-3.5 w-3.5" />
                          {c.clicks}
                        </span>
                        <span className="flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {c.whatsappClicks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link className="h-5 w-5 text-muted-foreground" />
              Origem dos visitantes (Referrers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando…</div>
            ) : !data?.topReferrers?.length ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Sem dados no período</div>
            ) : (
              <div className="space-y-3">
                {data.topReferrers.map((r, i) => {
                  const referrerDisplay = r.referrer.length > 60 ? `${r.referrer.substring(0, 60)}…` : r.referrer;
                  const isSelected = selectedReferrers.has(r.referrer);
                  return (
                    <div
                      key={r.referrer}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors",
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-500/20"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleReferrerFilter(r.referrer)}
                    >
                      <span className="w-5 shrink-0 text-xs font-medium text-muted-foreground text-right">
                        {i + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground" title={r.referrer}>
                            {referrerDisplay}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {r.count.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
