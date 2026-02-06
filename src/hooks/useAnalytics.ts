import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type DateRange = "today" | "7d" | "30d" | "all";

export interface KpiSummary {
  totalVisitors: number;
  totalPageViews: number;
  totalCardClicks: number;
  totalFormSubmits: number;
  totalWhatsAppClicks: number;
  avgSessionMs: number;
  topPages: Array<{ path: string; views: number }>;
  topCards: Array<{ name: string; clicks: number }>;
  dailyViews: Array<{ date: string; views: number }>;
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

async function fetchKpis(range: DateRange): Promise<KpiSummary> {
  const since = dateFilter(range);

  // Busca todos os eventos do período de uma vez
  let query = supabase.from("site_events").select("*");
  if (since) {
    query = query.gte("created_at", since);
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

  // Views por dia (para gráfico)
  const dailyMap: Record<string, number> = {};
  for (const pv of pageViews) {
    const day = pv.created_at?.slice(0, 10) ?? "unknown";
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }
  const dailyViews = Object.entries(dailyMap)
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalVisitors: visitors.size,
    totalPageViews: pageViews.length,
    totalCardClicks: cardClicks.length,
    totalFormSubmits: formSubmits.length,
    totalWhatsAppClicks: whatsappClicks.length,
    avgSessionMs,
    topPages,
    topCards,
    dailyViews,
  };
}

// ---------------------------------------------------------------------------
// Hook export
// ---------------------------------------------------------------------------

export function useAnalytics(range: DateRange) {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => fetchKpis(range),
    refetchInterval: 60_000, // atualiza a cada 60s
    staleTime: 30_000,
  });
}
