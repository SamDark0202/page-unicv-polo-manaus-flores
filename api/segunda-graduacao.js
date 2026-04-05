const REMOTE_URL = "https://diariodebordo.unicv.edu.br/cursos-segunda-graduacao/publico";

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
        const safe = parsed.map((item) => {
          const safeStr = (v) => (typeof v === "string" ? v.slice(0, 5000) : v);
          return {
            id: item.id ?? null,
            name: safeStr(item.name ?? item.nome ?? ""),
            description: safeStr(item.description ?? item.descricao ?? ""),
          };
        });
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
