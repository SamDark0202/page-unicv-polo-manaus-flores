import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs/promises";
import { posts } from "../src/data/posts";
import type { Post } from "../src/types/post";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const bucket = "blog-images";
const dryRun = process.env.DRY_RUN === "1";

const contentTypeByExt: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function toSafeFileName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExtFromUrl(url: string): string {
  try {
    if (url.startsWith("http")) {
      const parsed = new URL(url);
      return path.extname(parsed.pathname) || ".png";
    }
  } catch {
    return ".png";
  }
  return path.extname(url) || ".png";
}

function isLocalAsset(url: string): boolean {
  return url.startsWith("/src/assets/") || url.startsWith("src/assets/");
}

function resolveLocalAsset(url: string): string {
  const clean = url.replace(/^\//, "");
  return path.resolve(process.cwd(), clean);
}

async function readImageBuffer(post: Post): Promise<Uint8Array> {
  const url = post.imageUrl;
  if (isLocalAsset(url)) {
    const filePath = resolveLocalAsset(url);
    return await fs.readFile(filePath);
  }

  if (url.startsWith("http")) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${url}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error(`Unsupported image URL: ${url}`);
}

async function uploadImage(post: Post): Promise<string> {
  const ext = getExtFromUrl(post.imageUrl);
  const safeSlug = toSafeFileName(post.slug) || "post";
  const fileName = `${safeSlug}${ext}`;
  const contentType = contentTypeByExt[ext] || "application/octet-stream";

  if (!dryRun) {
    const buffer = await readImageBuffer(post);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) {
      throw new Error(`Upload failed for ${post.slug}: ${error.message}`);
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  if (!data?.publicUrl) {
    throw new Error(`Could not generate public URL for ${fileName}`);
  }
  return data.publicUrl;
}

async function upsertPost(post: Post, imageUrl: string) {
  const payload = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    author: post.author,
    image_url: imageUrl,
    excerpt: post.excerpt,
    content: post.content,
    meta_description: post.metaDescription ?? null,
    tags: post.tags ?? null,
    canonical_url: post.canonicalUrl ?? null,
    category: post.category ?? null,
    status: "published",
    updated_at: new Date().toISOString(),
  };

  if (dryRun) {
    return;
  }

  const { error } = await supabase.from("posts").upsert(payload, { onConflict: "slug" });
  if (error) {
    throw new Error(`DB upsert failed for ${post.slug}: ${error.message}`);
  }
}

async function run() {
  console.log(`Starting migration. Posts: ${posts.length}. Dry run: ${dryRun}`);

  for (const post of posts) {
    try {
      const imageUrl = await uploadImage(post);
      await upsertPost(post, imageUrl);
      console.log(`OK: ${post.slug}`);
    } catch (err: any) {
      console.error(`FAIL: ${post.slug} - ${err.message || err}`);
    }
  }

  console.log("Migration finished.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
