// Consolidado: substitui cursos-tecnicos.js, segunda-graduacao.js e pos-graduacao.js
// Uso: GET /api/cursos?tipo=tecnicos | GET /api/cursos?tipo=segunda-graduacao | GET /api/cursos?tipo=pos-graduacao

const REMOTE_URLS = {
  tecnicos: "https://diariodebordo.unicv.edu.br/cursos-tecnicos/publico",
  "segunda-graduacao": "https://diariodebordo.unicv.edu.br/cursos-segunda-graduacao/publico",
};

// ─── Pós-Graduação (scraper HTML Tutor LMS) ───────────────────────────────────
const PG_BASE_URL = "https://unicive.com/pos-graduacao-ead/";
const PG_AJAX_URL = "https://unicive.com/wp-admin/admin-ajax.php";
const PG_MAX_PAGES = 30;
const PG_TIMEOUT_MS = 15000;
const PG_RETRIES = 2;

const pgSafeText = (v, max = 5000) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

const pgDecodeHtml = (v) => {
  if (typeof v !== "string") return "";
  return v
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

const pgExtractMatch = (text, regex, group = 1) => {
  const m = text.match(regex);
  return m && m[group] ? pgDecodeHtml(m[group]) : "";
};

const pgSlugify = (text) =>
  pgDecodeHtml(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

const pgSanitize = (c) => ({
  id: pgSafeText(c.id, 120),
  name: pgSafeText(c.name, 300),
  url: pgSafeText(c.url, 1000),
  image_url: pgSafeText(c.image_url, 1000),
  duration_hours: pgSafeText(c.duration_hours, 50),
  old_price: pgSafeText(c.old_price, 50),
  current_price: pgSafeText(c.current_price, 50),
  installment_price: pgSafeText(c.installment_price, 50),
  level: "Pós-Graduação EAD",
});

const pgParseTotalPages = (html) => {
  const nums = [...html.matchAll(/current_page=(\d+)/g)].map((m) => Number(m[1]));
  const max = nums.length ? Math.max(...nums) : 1;
  if (Number.isFinite(max) && max > 0) return max;
  const info = html.match(/Página[\s\S]*?de[\s\S]*?<span[^>]*>\s*(\d+)\s*<\/span>/i);
  const parsed = info ? Number(info[1]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const pgParseCoursesFromHtml = (html) => {
  const blocks = html.match(/<div class="item-course[\s\S]*?(?=<div class="item-course|<nav class="tutor-pagination|$)/g) || [];
  const courses = [];
  for (const block of blocks) {
    const url = pgExtractMatch(block, /<a\s+href="([^"]+)"[^>]*class="button btn-purchase[^"]*"/i) ||
      pgExtractMatch(block, /<a\s+class="link-overlay"\s+href="([^"]+)"/i);
    const name = pgExtractMatch(block, /<h2\s+class="title"[^>]*>\s*<a\s+href="[^"]+"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
    const imageUrl = pgExtractMatch(block, /<div class="tutor-course-thumbnail">\s*<img[^>]*src="([^"]+)"/i);
    const durationHours = pgExtractMatch(block, /Dura[çc][aã]o m[ií]nima do curso:[\s\S]*?<span class="tutor-meta-level">\s*([^<]+)\s*<\/span>/i);
    const oldPrice = pgExtractMatch(block, /De:\s*(?:R\$\s*|(?:<[^>]*>[^<]*<\/[^>]*>\s*)?)([0-9][^<\s][^<]*)/i);
    const currentPrice = pgExtractMatch(block, /Por:[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);
    const installmentPrice = pgExtractMatch(block, /1\+12x de\s*<span class="woocommerce-Price-amount amount">[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);
    if (!name || !url) continue;
    courses.push({ id: pgSlugify(name) || `curso-${courses.length + 1}`, name, url, image_url: imageUrl, duration_hours: durationHours, old_price: oldPrice, current_price: currentPrice, installment_price: installmentPrice });
  }
  return courses;
};

const pgExtractNonce = (html) => html.match(/"_tutor_nonce"\s*:\s*"([a-f0-9]+)"/)?.[1] ?? null;

const pgFetchWithRetry = async (url, options) => {
  let lastError = null;
  for (let attempt = 1; attempt <= PG_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), PG_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === PG_RETRIES) throw err;
    } finally {
      clearTimeout(tid);
    }
  }
  throw lastError;
};

const pgFetchPage1 = async () => {
  const res = await pgFetchWithRetry(PG_BASE_URL, {
    method: "GET",
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0)", "Cache-Control": "no-cache" },
  });
  return res.text();
};

const pgFetchAjaxPage = async (page, nonce) => {
  const params = new URLSearchParams({ action: "tutor_course_filter_ajax", current_page: String(page), course_per_page: "15", course_order: "course_title_az", "tutor-course-filter-level": "pos_graduacao_ead", only_course_items: "1", supported_filters: "1" });
  if (nonce) params.set("_tutor_nonce", nonce);
  const res = await pgFetchWithRetry(PG_AJAX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", Accept: "*/*", "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0)" },
    body: params.toString(),
  });
  const text = await res.text();
  try { const json = JSON.parse(text); return json?.data?.html ?? json?.html ?? text; } catch { return text; }
};

async function handlePosGraduacao(response) {
  const firstHtml = await pgFetchPage1();
  const detectedPages = pgParseTotalPages(firstHtml);
  const totalPages = Math.max(1, Math.min(detectedPages, PG_MAX_PAGES));
  const nonce = pgExtractNonce(firstHtml);
  const allCourses = [...pgParseCoursesFromHtml(firstHtml)];
  const CONCURRENT = 4;
  for (let page = 2; page <= totalPages; page += CONCURRENT) {
    const batch = [];
    for (let i = page; i < page + CONCURRENT && i <= totalPages; i++) batch.push(i);
    const results = await Promise.allSettled(batch.map((p) => pgFetchAjaxPage(p, nonce)));
    for (const r of results) { if (r.status === "fulfilled") allCourses.push(...pgParseCoursesFromHtml(r.value)); }
  }
  const unique = new Map();
  for (const item of allCourses) {
    const key = `${item.url}::${item.name}`;
    if (!unique.has(key)) unique.set(key, pgSanitize(item));
  }
  const courses = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(200).json({ updated_at: new Date().toISOString(), total_pages: totalPages, total_courses: courses.length, courses });
}
// ─────────────────────────────────────────────────────────────────────────────

const safeStr = (v) => {
  if (typeof v === "string") return v.slice(0, 5000);
  if (typeof v === "number") return v;
  return v;
};

const sanitizeOfferGroup = (og) => ({
  course: og?.course
    ? { id: og.course?.id ?? null, name: safeStr(og.course?.name ?? og.course?.nome ?? "") }
    : null,
  duration: safeStr(og?.duration ?? null),
  total_hours: safeStr(og?.total_hours ?? null),
  total_disciplines: safeStr(og?.total_disciplines ?? null),
  installments: safeStr(og?.installments ?? null),
  value: safeStr(og?.value ?? null),
  matrice_file: og?.matrice_file ? { url: safeStr(og.matrice_file.url ?? null) } : null,
});

const sanitizeItem = (item) => ({
  id: item?.id ?? null,
  name: safeStr(item?.name ?? item?.nome ?? ""),
  description: safeStr(item?.description ?? item?.descricao ?? ""),
  course_offer_groups: Array.isArray(item?.course_offer_groups)
    ? item.course_offer_groups.map(sanitizeOfferGroup)
    : [],
});

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const url = new URL(request.url, "http://localhost");
  const tipo = url.searchParams.get("tipo") || "";

  if (tipo === "pos-graduacao") {
    try {
      return await handlePosGraduacao(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao consultar pós-graduação";
      return response.status(502).json({ error: message });
    }
  }

  const remoteUrl = REMOTE_URLS[tipo];

  if (!remoteUrl) {
    return response.status(400).json({ error: "Parâmetro 'tipo' inválido. Use: tecnicos, segunda-graduacao, pos-graduacao" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const upstream = await fetch(remoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "User-Agent": "unicv-flores-site-proxy",
      },
      signal: controller.signal,
    });

    const body = await upstream.text();

    if (upstream.status === 200) {
      try {
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed)) {
          return response.status(502).json({ error: "Resposta inesperada do servidor de cursos." });
        }
        const safe = parsed.map(sanitizeItem);
        response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        return response.status(200).json(safe);
      } catch {
        return response.status(502).json({ error: "Resposta inválida do servidor de cursos." });
      }
    }

    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return response.status(upstream.status).json({ error: "Servidor de cursos indisponível." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar API de cursos.";
    return response.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
}
