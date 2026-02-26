import { createClient } from "@supabase/supabase-js";
import type { Post } from "@/types/post";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type DbPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  author: string;
  image_url: string;
  excerpt: string;
  content: string;
  meta_description: string | null;
  tags: string[] | null;
  canonical_url: string | null;
  category: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

// Transform DB -> App
export function dbToPost(db: DbPost): Post {
  return {
    slug: db.slug,
    title: db.title,
    date: db.date,
    author: db.author,
    imageUrl: db.image_url,
    excerpt: db.excerpt,
    content: db.content,
    metaDescription: db.meta_description ?? undefined,
    tags: db.tags ?? undefined,
    canonicalUrl: db.canonical_url ?? undefined,
    category: db.category ?? undefined,
  };
}

// Transform App -> DB
export function postToDb(post: Post): Partial<DbPost> {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    author: post.author,
    image_url: post.imageUrl,
    excerpt: post.excerpt,
    content: post.content,
    meta_description: post.metaDescription ?? null,
    tags: post.tags ?? null,
    canonical_url: post.canonicalUrl ?? null,
    category: post.category ?? null,
    status: "published",
  };
}

// Fetch all posts
export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data as DbPost[]).map(dbToPost);
}

// Fetch single post by slug
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return dbToPost(data as DbPost);
}

// Upsert post
export async function upsertPost(post: Post): Promise<void> {
  const payload = postToDb(post);
  const { error } = await supabase
    .from("posts")
    .upsert(payload, { onConflict: "slug" });

  if (error) throw error;
}

// Delete post
export async function deletePost(slug: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("slug", slug);
  if (error) throw error;
}

// Upload image to Storage
function toSafeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExt(fileName: string) {
  const ext = fileName.split(".").pop();
  return ext ? ext.toLowerCase() : "png";
}

export async function uploadCoverImage(file: File, slug: string): Promise<string> {
  const ext = getExt(file.name);
  const safeSlug = toSafeFileName(slug || "post") || "post";
  const fileName = `${safeSlug}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadInlineMedia(file: File, folder: "content-images" | "content-videos") {
  const ext = getExt(file.name);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const fileName = `${folder}/${stamp}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadPostPlusCarouselImage(file: File): Promise<string> {
  const ext = getExt(file.name);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const fileName = `pos-plus-carousel/${stamp}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadHomeLaunchBannerImage(file: File): Promise<string> {
  const ext = getExt(file.name);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const fileName = `home-launch-banners/${stamp}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}
