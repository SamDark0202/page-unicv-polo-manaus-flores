import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type CheckConfig = {
  label: string;
  table: string;
  keyColumn: string;
  imageColumns: string[];
};

const configs: CheckConfig[] = [
  { label: "Blog posts", table: "posts", keyColumn: "slug", imageColumns: ["image_url"] },
  { label: "Home launch banners", table: "home_launch_banners", keyColumn: "id", imageColumns: ["imagem_url"] },
  {
    label: "Post+ carousel",
    table: "post_plus_carousel_items",
    keyColumn: "id",
    imageColumns: ["imagem_url", "imagem_mobile_url"],
  },
];

function getHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

async function verifyUrl(url: string): Promise<{ ok: boolean; status: number | null; error?: string }> {
  try {
    const response = await fetch(url, { method: "GET" });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, status: null, error: message };
  }
}

async function run() {
  let totalRefs = 0;
  let totalImageKit = 0;
  let totalReachable = 0;

  for (const cfg of configs) {
    const select = [cfg.keyColumn, ...cfg.imageColumns].join(",");
    const { data, error } = await supabase.from(cfg.table).select(select);

    if (error) {
      console.error(`[${cfg.label}] query error: ${error.message}`);
      continue;
    }

    const rows = (data || []) as unknown as Record<string, unknown>[];
    const refs: Array<{ key: string; column: string; url: string }> = [];

    for (const row of rows) {
      const key = String(row[cfg.keyColumn] ?? "");
      if (!key) continue;

      for (const col of cfg.imageColumns) {
        const value = row[col];
        if (typeof value !== "string" || !value.trim()) continue;
        refs.push({ key, column: col, url: value });
      }
    }

    let imageKitCount = 0;
    let reachableCount = 0;
    const failures: string[] = [];

    for (const ref of refs) {
      const host = getHost(ref.url);
      const isImageKit = host.includes("imagekit.io") || ref.url.includes("/ik.imagekit.io/");
      if (isImageKit) imageKitCount += 1;

      const check = await verifyUrl(ref.url);
      if (check.ok) {
        reachableCount += 1;
      } else {
        failures.push(`${cfg.table}.${ref.column} (${ref.key}) -> ${check.status ?? "ERR"}${check.error ? ` ${check.error}` : ""}`);
      }
    }

    totalRefs += refs.length;
    totalImageKit += imageKitCount;
    totalReachable += reachableCount;

    console.log(`\n[${cfg.label}]`);
    console.log(`table: ${cfg.table}`);
    console.log(`refs: ${refs.length}`);
    console.log(`imagekit: ${imageKitCount}`);
    console.log(`reachable: ${reachableCount}`);

    if (failures.length > 0) {
      console.log("unreachable samples:");
      for (const f of failures.slice(0, 10)) {
        console.log(`- ${f}`);
      }
      if (failures.length > 10) {
        console.log(`- ... and ${failures.length - 10} more`);
      }
    }
  }

  console.log("\n[overall]");
  console.log(JSON.stringify({
    totalRefs,
    totalImageKit,
    totalReachable,
    allImageKit: totalRefs > 0 ? totalRefs === totalImageKit : true,
    allReachable: totalRefs > 0 ? totalRefs === totalReachable : true,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
