const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const DATA_URI_RE = /^data:(image\/[a-z+.-]+);base64,/;

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

function validateFileMimeTypeAndSize(file) {
  if (typeof file !== "string") return "Campo 'file' inválido.";
  if (file.startsWith("data:")) {
    const match = file.match(DATA_URI_RE);
    if (!match) return "Formato data URI inválido.";
    const mime = match[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) return `Tipo de imagem não permitido (${mime}).`;
    const base64Start = file.indexOf(",") + 1;
    const base64Length = file.length - base64Start;
    const estimatedSize = (base64Length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) return "Arquivo muito grande (máx 10MB).";
    return null;
  }
  if (file.startsWith("http")) {
    // Remote URL — trust the fileName extension
    const ext = file.split(".").pop()?.split("?")[0]?.toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
    if (!imageExts.includes(ext)) return "Extensão de imagem não permitida.";
    return null;
  }
  return "Formato de file não reconhecido.";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  response.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://unicivepoloam.com.br");
  response.setHeader("Access-Control-Allow-Methods", "POST");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return response.status(500).json({ error: "IMAGEKIT_PRIVATE_KEY não configurada no ambiente." });
  }

  const apiSecret = process.env.UPLOAD_API_SECRET;
  if (apiSecret) {
    const providedSecret = request.headers["x-upload-secret"];
    if (providedSecret !== apiSecret) {
      return response.status(403).json({ error: "Não autorizado." });
    }
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

    const mimeError = validateFileMimeTypeAndSize(file);
    if (mimeError) return response.status(400).json({ error: mimeError });

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
