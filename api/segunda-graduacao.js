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

    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    response.setHeader("Content-Type", "application/json; charset=utf-8");

    return response.status(upstream.status).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar API de cursos";
    return response.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
}
