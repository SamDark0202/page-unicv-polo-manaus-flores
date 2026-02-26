import type {
  PostPlusCarouselFilters,
  PostPlusCarouselItem,
  PostPlusCarouselItemInput,
} from "@/types/postPlusCarousel";
import { supabase } from "./supabaseClient";

type DbPostPlusCarouselItem = {
  id: string;
  nome_banner: string;
  imagem_url: string;
  imagem_mobile_url: string;
  meta_descricao: string;
  link_url: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

function isMissingTableError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("post_plus_carousel_items") &&
    (normalized.includes("could not find the table") || normalized.includes("does not exist"))
  );
}

function dbToPostPlusCarouselItem(data: DbPostPlusCarouselItem): PostPlusCarouselItem {
  return {
    id: data.id,
    bannerName: data.nome_banner,
    imageUrl: data.imagem_url,
    mobileImageUrl: data.imagem_mobile_url,
    metaDescription: data.meta_descricao,
    targetUrl: data.link_url ?? undefined,
    sortOrder: data.ordem,
    active: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function toDbPayload(item: PostPlusCarouselItemInput) {
  const payload: Record<string, unknown> = {
    nome_banner: item.bannerName,
    imagem_url: item.imageUrl,
    imagem_mobile_url: item.mobileImageUrl,
    meta_descricao: item.metaDescription,
    link_url: item.targetUrl?.trim() ? item.targetUrl.trim() : null,
    ordem: item.sortOrder,
    ativo: item.active,
  };

  if (item.id) {
    payload.id = item.id;
  }

  return payload;
}

export async function fetchPostPlusCarouselItems(
  filters: PostPlusCarouselFilters = {}
): Promise<PostPlusCarouselItem[]> {
  const { activeOnly } = filters;

  let query = supabase
    .from("post_plus_carousel_items")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data as DbPostPlusCarouselItem[]).map(dbToPostPlusCarouselItem);
}

export async function savePostPlusCarouselItem(item: PostPlusCarouselItemInput): Promise<PostPlusCarouselItem> {
  const { data, error } = await supabase
    .from("post_plus_carousel_items")
    .upsert(toDbPayload(item), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela do carrossel Pós+ ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }

  return dbToPostPlusCarouselItem(data as DbPostPlusCarouselItem);
}

export async function setPostPlusCarouselItemActive(id: string, active: boolean): Promise<PostPlusCarouselItem> {
  const { data, error } = await supabase
    .from("post_plus_carousel_items")
    .update({ ativo: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela do carrossel Pós+ ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }

  return dbToPostPlusCarouselItem(data as DbPostPlusCarouselItem);
}

export async function deletePostPlusCarouselItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("post_plus_carousel_items")
    .delete()
    .eq("id", id);

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela do carrossel Pós+ ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }
}
