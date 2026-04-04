const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

async function parseJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeFolder(folder) {
  const raw = typeof folder === "string" ? folder.trim() : "";
  if (!raw) return "/site-polouniciveflores";

  const withSingleSlash = raw.replace(/\\/g, "/").replace(/\/+/g, "/");
  return withSingleSlash.startsWith("/") ? withSingleSlash : `/${withSingleSlash}`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return response.status(500).json({ error: "IMAGEKIT_PRIVATE_KEY não configurada no ambiente." });
  }

  try {
    const body = await parseJsonBody(request);

    const {
      file,
      fileName,
      folder,
      useUniqueFileName = true,
      overwriteFile = false,
    } = body || {};

    if (!file || typeof file !== "string") {
      return response.status(400).json({ error: "Campo 'file' (base64/data URL) é obrigatório." });
    }

    if (!fileName || typeof fileName !== "string") {
      return response.status(400).json({ error: "Campo 'fileName' é obrigatório." });
    }

    const payload = new URLSearchParams();
    payload.set("file", file);
    payload.set("fileName", fileName);
    payload.set("folder", normalizeFolder(folder));
    payload.set("useUniqueFileName", String(Boolean(useUniqueFileName)));
    payload.set("overwriteFile", String(Boolean(overwriteFile)));

    const auth = Buffer.from(`${privateKey}:`).toString("base64");
    const upstream = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const raw = await upstream.text();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw };
    }

    if (!upstream.ok) {
      const message = parsed?.message || parsed?.help || "Falha no upload para o ImageKit.";
      return response.status(upstream.status).json({ error: message, details: parsed });
    }

    return response.status(200).json({
      url: parsed.url,
      filePath: parsed.filePath,
      fileId: parsed.fileId,
      name: parsed.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao enviar imagem.";
    return response.status(500).json({ error: message });
  }
}
