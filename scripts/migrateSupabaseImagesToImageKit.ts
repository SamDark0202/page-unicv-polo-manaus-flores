import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type TableConfig = {
  table: "posts" | "home_launch_banners" | "post_plus_carousel_items";
  keyColumn: "slug" | "id";
  imageColumns: string[];
};

type UrlRef = {
  table: string;
  keyColumn: string;
  keyValue: string;
  column: string;
  originalUrl: string;
};

const tableConfigs: TableConfig[] = [
  { table: "posts", keyColumn: "slug", imageColumns: ["image_url"] },
  { table: "home_launch_banners", keyColumn: "id", imageColumns: ["imagem_url"] },
  { table: "post_plus_carousel_items", keyColumn: "id", imageColumns: ["imagem_url", "imagem_mobile_url"] },
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const imageKitEndpoint = (process.env.VITE_IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");
const imageKitRootFolder = process.env.VITE_IMAGEKIT_ROOT_FOLDER || "/site-polouniciveflores";
const argv = new Set(process.argv.slice(2));
const dryRun = argv.has("--apply") ? false : true;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

if (!imageKitPrivateKey) {
  throw new Error("Missing IMAGEKIT_PRIVATE_KEY.");
}

if (!imageKitEndpoint) {
  throw new Error("Missing VITE_IMAGEKIT_URL_ENDPOINT.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function isSupabaseStorageUrl(url: string) {
  return /\/storage\/v1\/object\/public\/[^/]+\//.test(url);
}

function splitSupabaseStoragePath(url: string) {
  const parsed = new URL(url);
  const marker = "/storage/v1/object/public/";
  const idx = parsed.pathname.indexOf(marker);
  if (idx < 0) {
    throw new Error(`URL is not Supabase public storage URL: ${url}`);
  }

  const full = parsed.pathname.slice(idx + marker.length);
  const firstSlash = full.indexOf("/");
  if (firstSlash < 0) {
    throw new Error(`Unexpected Supabase path: ${url}`);
  }

  const bucket = full.slice(0, firstSlash);
  const pathInBucket = full.slice(firstSlash + 1);

  return { bucket, pathInBucket };
}

function sanitizePathSegment(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function buildImageKitDestination(pathInBucket: string, bucket: string) {
  const normalized = pathInBucket.replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean).map(sanitizePathSegment);
  const fileName = parts.pop() || `asset-${Date.now()}`;
  const folderSuffix = parts.length > 0 ? `/${parts.join("/")}` : "";
  const folder = `${imageKitRootFolder}/supabase-${sanitizePathSegment(bucket)}${folderSuffix}`;
  return { folder, fileName };
}

async function collectUrlRefs(): Promise<UrlRef[]> {
  const refs: UrlRef[] = [];

  for (const cfg of tableConfigs) {
    const selectColumns = [cfg.keyColumn, ...cfg.imageColumns].join(",");
    const { data, error } = await supabase.from(cfg.table).select(selectColumns);
    if (error) {
      const lower = error.message.toLowerCase();
      const isMissing = lower.includes("could not find the table") || lower.includes("does not exist");
      if (isMissing) {
        console.warn(`[image-migration] Skipping missing table: ${cfg.table}`);
        continue;
      }
      throw new Error(`Failed to query ${cfg.table}: ${error.message}`);
    }

    const rows = (data || []) as unknown as Record<string, unknown>[];
    for (const row of rows) {
      const keyRaw = row[cfg.keyColumn];
      if (typeof keyRaw !== "string" || !keyRaw.trim()) continue;

      for (const column of cfg.imageColumns) {
        const raw = row[column];
        if (typeof raw !== "string" || !raw.trim()) continue;
        if (!isSupabaseStorageUrl(raw)) continue;

        refs.push({
          table: cfg.table,
          keyColumn: cfg.keyColumn,
          keyValue: keyRaw,
          column,
          originalUrl: raw,
        });
      }
    }
  }

  return refs;
}

async function uploadToImageKitFromUrl(originalUrl: string) {
  const { bucket, pathInBucket } = splitSupabaseStoragePath(originalUrl);
  const { folder, fileName } = buildImageKitDestination(pathInBucket, bucket);

  const fileRes = await fetch(originalUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to fetch source image (${fileRes.status})`);
  }

  const fileBlob = await fileRes.blob();
  const form = new FormData();
  form.set("file", fileBlob);
  form.set("fileName", fileName);
  form.set("folder", folder);
  form.set("useUniqueFileName", "false");
  form.set("overwriteFile", "true");

  const auth = Buffer.from(`${imageKitPrivateKey}:`).toString("base64");
  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: form,
  });

  const uploadPayload = (await uploadRes.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!uploadRes.ok || !uploadPayload.url) {
    throw new Error(uploadPayload.message || `ImageKit upload failed (${uploadRes.status})`);
  }

  return uploadPayload.url;
}

async function updateReference(ref: UrlRef, newUrl: string) {
  const payload = { [ref.column]: newUrl };
  const { error } = await supabase
    .from(ref.table)
    .update(payload)
    .eq(ref.keyColumn, ref.keyValue);

  if (error) {
    throw new Error(`Failed update ${ref.table}.${ref.column} (${ref.keyValue}): ${error.message}`);
  }
}

async function run() {
  console.log(`[image-migration] Dry run: ${dryRun}`);
  const refs = await collectUrlRefs();
  console.log(`[image-migration] References found: ${refs.length}`);

  if (refs.length === 0) {
    console.log("[image-migration] No Supabase image URLs found.");
    return;
  }

  const uniqueUrls = [...new Set(refs.map((r) => r.originalUrl))];
  console.log(`[image-migration] Unique source URLs: ${uniqueUrls.length}`);

  const mapping = new Map<string, string>();
  let uploadSuccess = 0;
  let uploadFail = 0;

  for (const url of uniqueUrls) {
    try {
      if (dryRun) {
        const { bucket, pathInBucket } = splitSupabaseStoragePath(url);
        const { folder, fileName } = buildImageKitDestination(pathInBucket, bucket);
        const previewUrl = `${imageKitEndpoint}${folder}/${fileName}`.replace(/\/+/g, "/").replace("https:/", "https://");
        mapping.set(url, previewUrl);
      } else {
        const newUrl = await uploadToImageKitFromUrl(url);
        mapping.set(url, newUrl);
      }
      uploadSuccess += 1;
      console.log(`[upload] OK ${uploadSuccess}/${uniqueUrls.length}`);
    } catch (error) {
      uploadFail += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[upload] FAIL ${url} -> ${message}`);
    }
  }

  let updated = 0;
  let skipped = 0;
  let updateFail = 0;

  for (const ref of refs) {
    const newUrl = mapping.get(ref.originalUrl);
    if (!newUrl) {
      skipped += 1;
      continue;
    }

    try {
      if (!dryRun) {
        await updateReference(ref, newUrl);
      }
      updated += 1;
    } catch (error) {
      updateFail += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[update] FAIL ${ref.table}.${ref.column} (${ref.keyValue}) -> ${message}`);
    }
  }

  console.log("[image-migration] Summary");
  console.log(JSON.stringify({
    dryRun,
    refsFound: refs.length,
    uniqueUrls: uniqueUrls.length,
    uploadsOk: uploadSuccess,
    uploadsFail: uploadFail,
    refsUpdated: updated,
    refsSkipped: skipped,
    refsUpdateFail: updateFail,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
