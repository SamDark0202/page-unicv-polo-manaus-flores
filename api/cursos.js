// Consolidado: substitui cursos-tecnicos.js e segunda-graduacao.js
// Uso: GET /api/cursos?tipo=tecnicos  |  GET /api/cursos?tipo=segunda-graduacao

const REMOTE_URLS = {
  tecnicos: "https://diariodebordo.unicv.edu.br/cursos-tecnicos/publico",
  "segunda-graduacao": "https://diariodebordo.unicv.edu.br/cursos-segunda-graduacao/publico",
};

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
  const remoteUrl = REMOTE_URLS[tipo];

  if (!remoteUrl) {
    return response.status(400).json({ error: "Parâmetro 'tipo' inválido. Use: tecnicos, segunda-graduacao" });
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
