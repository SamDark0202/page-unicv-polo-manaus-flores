import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type DateRange = "today" | "7d" | "30d" | "all";

export type AnalyticsFilter =
  | { mode: "preset"; range: DateRange }
  | { mode: "custom"; start: string; end: string };

export type DailyMetricsPoint = {
  date: string;
  views: number;
  whatsapp: number;
  forms: number;
};

export interface KpiSummary {
  totalVisitors: number;
  totalPageViews: number;
  totalCardClicks: number;
  totalFormSubmits: number;
  totalWhatsAppClicks: number;
  avgSessionMs: number;
  topPages: Array<{ path: string; views: number }>;
  topCards: Array<{ name: string; clicks: number }>;
  dailyMetrics: DailyMetricsPoint[];
}

// ---------------------------------------------------------------------------
// Helpers de data
// ---------------------------------------------------------------------------

function dateFilter(range: DateRange): string | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.toISOString();
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch principal
// ---------------------------------------------------------------------------

function getQueryBounds(filter: AnalyticsFilter): { gte?: string; lte?: string } {
  if (filter.mode === "preset") {
    const since = dateFilter(filter.range);
    return since ? { gte: since } : {};
  }

  const startDate = new Date(filter.start);
  const endDate = new Date(filter.end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Período personalizado inválido");
  }

  if (startDate > endDate) {
    throw new Error("Data inicial não pode ser maior que a final");
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return {
    gte: startDate.toISOString(),
    lte: endDate.toISOString(),
  };
}

async function fetchKpis(filter: AnalyticsFilter): Promise<KpiSummary> {
  const { gte, lte } = getQueryBounds(filter);

  // Busca todos os eventos do período de uma vez
  let query = supabase.from("site_events").select("*");
  if (gte) {
    query = query.gte("created_at", gte);
  }
  if (lte) {
    query = query.lte("created_at", lte);
  }

  const { data: events, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  const rows = events ?? [];

  // Visitantes únicos
  const visitors = new Set(rows.map((r) => r.visitor_id));

  // Totais por tipo
  const pageViews = rows.filter((r) => r.event_type === "page_view");
  const cardClicks = rows.filter((r) => r.event_type === "card_click");
  const formSubmits = rows.filter((r) => r.event_type === "form_submit");
  const whatsappClicks = rows.filter((r) => r.event_type === "whatsapp_click");
  const sessionEnds = rows.filter((r) => r.event_type === "session_end");

  // Tempo médio de sessão
  const durations = sessionEnds
    .map((r) => (r.metadata as Record<string, unknown>)?.session_duration_ms)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgSessionMs =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  // Top páginas
  const pageCounts: Record<string, number> = {};
  for (const pv of pageViews) {
    const p = pv.page_path ?? "/";
    pageCounts[p] = (pageCounts[p] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top cards clicados
  const cardCounts: Record<string, number> = {};
  for (const cc of cardClicks) {
    const name = String((cc.metadata as Record<string, unknown>)?.card_name ?? "Sem nome");
    cardCounts[name] = (cardCounts[name] ?? 0) + 1;
  }
  const topCards = Object.entries(cardCounts)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Métricas diárias combinadas
  const dailyMap: Record<string, DailyMetricsPoint> = {};

  function ensureDay(day: string) {
    if (!dailyMap[day]) {
      dailyMap[day] = { date: day, views: 0, whatsapp: 0, forms: 0 };
    }
    return dailyMap[day];
  }

  for (const event of rows) {
    const day = event.created_at?.slice(0, 10) ?? "unknown";
    const bucket = ensureDay(day);
    switch (event.event_type) {
      case "page_view":
        bucket.views += 1;
        break;
      case "whatsapp_click":
        bucket.whatsapp += 1;
        break;
      case "form_submit":
        bucket.forms += 1;
        break;
      default:
        break;
    }
  }

  const dailyMetrics = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalVisitors: visitors.size,
    totalPageViews: pageViews.length,
    totalCardClicks: cardClicks.length,
    totalFormSubmits: formSubmits.length,
    totalWhatsAppClicks: whatsappClicks.length,
    avgSessionMs,
    topPages,
    topCards,
    dailyMetrics,
  };
}

// ---------------------------------------------------------------------------
// Hook export
// ---------------------------------------------------------------------------

export function useAnalytics(filter: AnalyticsFilter) {
  const queryKey =
    filter.mode === "preset"
      ? ["analytics", "preset", filter.range]
      : ["analytics", "custom", filter.start, filter.end];

  return useQuery({
    queryKey,
    queryFn: () => fetchKpis(filter),
    refetchInterval: 60_000, // atualiza a cada 60s
    staleTime: 30_000,
  });
}
