const REMOTE_URL = "https://diariodebordo.unicv.edu.br/cursos-segunda-graduacao/publico";

const safeStr = (v) => {
  if (typeof v === "string") return v.slice(0, 5000);
  if (typeof v === "number") return v;
  return v;
};

const sanitizeCourses = (item) => {
  const safeCourse = (course) => ({
    id: course?.id ?? null,
    name: safeStr(course?.name ?? course?.nome ?? ""),
  });

  const safeOfferGroup = (og) => ({
    course: og.course ? safeCourse(og.course) : null,
    duration: safeStr(og.duration ?? null),
    total_hours: safeStr(og.total_hours ?? null),
    total_disciplines: safeStr(og.total_disciplines ?? null),
    installments: safeStr(og.installments ?? null),
    value: safeStr(og.value ?? null),
    matrice_file: og.matrice_file
      ? { url: safeStr(og.matrice_file.url ?? null) }
      : null,
  });

  return {
    id: item.id ?? null,
    name: safeStr(item.name ?? item.nome ?? ""),
    description: safeStr(item.description ?? item.descricao ?? ""),
    course_offer_groups: Array.isArray(item.course_offer_groups)
      ? item.course_offer_groups.map(safeOfferGroup)
      : [],
  };
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const upstream = await fetch(REMOTE_URL, {
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
        const safe = parsed.map(sanitizeCourses);
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
    return response.status(502).json({ error: "Falha ao consultar API de cursos." });
  } finally {
    clearTimeout(timeoutId);
  }
}
