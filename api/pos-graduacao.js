// Página 1: GET https://unicive.com/pos-graduacao-ead/ (HTML completo — funciona)
// Páginas 2+: POST https://unicive.com/wp-admin/admin-ajax.php com action=tutor_course_filter_ajax
// (paginação real é AJAX no Tutor LMS, não server-side)
const REMOTE_BASE_URL = "https://unicive.com/pos-graduacao-ead/";
const AJAX_URL = "https://unicive.com/wp-admin/admin-ajax.php";
const MAX_PAGES_HARD_LIMIT = 30;
const PAGE_TIMEOUT_MS = 15000;
const FETCH_RETRIES = 2;

const safeText = (value, max = 5000) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
};

const decodeHtml = (value) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const extractMatch = (text, regex, group = 1) => {
  const match = text.match(regex);
  return match && match[group] ? decodeHtml(match[group]) : "";
};

const sanitizeCourse = (course) => ({
  id: safeText(course.id, 120),
  name: safeText(course.name, 300),
  url: safeText(course.url, 1000),
  image_url: safeText(course.image_url, 1000),
  duration_hours: safeText(course.duration_hours, 50),
  old_price: safeText(course.old_price, 50),
  current_price: safeText(course.current_price, 50),
  installment_price: safeText(course.installment_price, 50),
  level: "Pós-Graduação EAD",
});

const slugify = (text) =>
  decodeHtml(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

const parseTotalPages = (html) => {
  const allPageMatches = [...html.matchAll(/current_page=(\d+)/g)].map((m) => Number(m[1]));
  const maxInLinks = allPageMatches.length ? Math.max(...allPageMatches) : 1;
  if (Number.isFinite(maxInLinks) && maxInLinks > 0) return maxInLinks;

  const pageInfo = html.match(/Página[\s\S]*?de[\s\S]*?<span[^>]*>\s*(\d+)\s*<\/span>/i);
  const parsed = pageInfo ? Number(pageInfo[1]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseCoursesFromHtml = (html) => {
  const itemBlocks = html.match(/<div class="item-course[\s\S]*?(?=<div class="item-course|<nav class="tutor-pagination|$)/g) || [];
  const courses = [];

  for (const block of itemBlocks) {
    const url = extractMatch(block, /<a\s+href="([^"]+)"[^>]*class="button btn-purchase[^"]*"/i) || extractMatch(block, /<a\s+class="link-overlay"\s+href="([^"]+)"/i);
    const name = extractMatch(block, /<h2\s+class="title"[^>]*>\s*<a\s+href="[^"]+"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
    const imageUrl = extractMatch(block, /<div class="tutor-course-thumbnail">\s*<img[^>]*src="([^"]+)"/i);
    const durationHours = extractMatch(block, /Dura[çc][aã]o m[ií]nima do curso:[\s\S]*?<span class="tutor-meta-level">\s*([^<]+)\s*<\/span>/i);
    // O HTML do AJAX usa entidades HTML (&#082;&#036;) em vez do literal R$ para o símbolo da moeda
    const oldPrice = extractMatch(block, /De:\s*(?:R\$\s*|(?:<[^>]*>[^<]*<\/[^>]*>\s*)?)([0-9][^<\s][^<]*)/i);
    const currentPrice = extractMatch(block, /Por:[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);
    const installmentPrice = extractMatch(block, /1\+12x de\s*<span class="woocommerce-Price-amount amount">[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);

    if (!name || !url) continue;

    courses.push({
      id: slugify(name) || `curso-${courses.length + 1}`,
      name,
      url,
      image_url: imageUrl,
      duration_hours: durationHours,
      old_price: oldPrice,
      current_price: currentPrice,
      installment_price: installmentPrice,
    });
  }

  return courses;
};

// Extrai o nonce do Tutor LMS do HTML da página.
// O campo é "_tutor_nonce" dentro do objeto de configuração inline do plugin.
const extractNonce = (html) => {
  const match = html.match(/"_tutor_nonce"\s*:\s*"([a-f0-9]+)"/);
  return match?.[1] ?? null;
};

const fetchWithRetry = async (url, options) => {
  let lastError = null;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === FETCH_RETRIES) throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
};

// Página 1: GET na página original (retorna HTML completo com cursos + paginação)
const fetchPage1Html = async () => {
  const response = await fetchWithRetry(REMOTE_BASE_URL, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0; +https://unicvflores.com.br)",
      "Cache-Control": "no-cache",
    },
  });
  return response.text();
};

// Páginas 2+: POST para o endpoint AJAX do Tutor LMS
const fetchAjaxPage = async (page, nonce) => {
  const params = new URLSearchParams({
    action: "tutor_course_filter_ajax",
    current_page: String(page),
    course_per_page: "15",
    course_order: "course_title_az",
    "tutor-course-filter-level": "pos_graduacao_ead",
    only_course_items: "1",
    supported_filters: "1",
  });
  if (nonce) params.set("_tutor_nonce", nonce);

  const response = await fetchWithRetry(AJAX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Accept: "*/*",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0; +https://unicvflores.com.br)",
      "Cache-Control": "no-cache",
    },
    body: params.toString(),
  });
  const text = await response.text();
  // Tutor LMS retorna JSON com campo `html` contendo os itens de curso
  try {
    const json = JSON.parse(text);
    return json?.data?.html ?? json?.html ?? text;
  } catch {
    return text;
  }
};

const CONCURRENT_PAGES = 4; // busca 4 páginas em paralelo para equilibrar velocidade e não ser bloqueado

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Página 1: GET na página original (fonte confiável + contém nonce e total de páginas)
    const firstHtml = await fetchPage1Html();
    const detectedPages = parseTotalPages(firstHtml);
    const totalPages = Math.max(1, Math.min(detectedPages, MAX_PAGES_HARD_LIMIT));

    const nonce = extractNonce(firstHtml);

    const allCourses = [...parseCoursesFromHtml(firstHtml)];

    // Páginas 2+: POST para o endpoint AJAX do Tutor LMS
    for (let page = 2; page <= totalPages; page += CONCURRENT_PAGES) {
      const batch = [];
      for (let i = page; i < page + CONCURRENT_PAGES && i <= totalPages; i += 1) {
        batch.push(i);
      }
      const results = await Promise.allSettled(batch.map((p) => fetchAjaxPage(p, nonce)));
      for (const result of results) {
        if (result.status === "fulfilled") {
          allCourses.push(...parseCoursesFromHtml(result.value));
        }
      }
    }

    const uniqueByKey = new Map();
    for (const item of allCourses) {
      const key = `${item.url}::${item.name}`;
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, sanitizeCourse(item));
      }
    }

    const courses = Array.from(uniqueByKey.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );

    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    return response.status(200).json({
      updated_at: new Date().toISOString(),
      total_pages: totalPages,
      total_courses: courses.length,
      courses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar pós-graduação";
    return response.status(502).json({ error: message });
  }
}