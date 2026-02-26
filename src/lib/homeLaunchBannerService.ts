import type {
  HomeLaunchBanner,
  HomeLaunchBannerFilters,
  HomeLaunchBannerInput,
} from "@/types/homeLaunchBanner";
import { supabase } from "./supabaseClient";

type DbHomeLaunchBanner = {
  id: string;
  nome_banner: string;
  imagem_url: string;
  course_id: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

function isMissingTableError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("home_launch_banners") &&
    (normalized.includes("could not find the table") || normalized.includes("does not exist"))
  );
}

function dbToHomeLaunchBanner(data: DbHomeLaunchBanner): HomeLaunchBanner {
  return {
    id: data.id,
    bannerName: data.nome_banner,
    imageUrl: data.imagem_url,
    courseId: data.course_id,
    sortOrder: data.ordem,
    active: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function toDbPayload(item: HomeLaunchBannerInput) {
  const payload: Record<string, unknown> = {
    nome_banner: item.bannerName,
    imagem_url: item.imageUrl,
    course_id: item.courseId,
    ordem: item.sortOrder,
    ativo: item.active,
  };

  if (item.id) {
    payload.id = item.id;
  }

  return payload;
}

export async function fetchHomeLaunchBanners(
  filters: HomeLaunchBannerFilters = {}
): Promise<HomeLaunchBanner[]> {
  const { activeOnly } = filters;

  let query = supabase
    .from("home_launch_banners")
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

  return (data as DbHomeLaunchBanner[]).map(dbToHomeLaunchBanner);
}

export async function saveHomeLaunchBanner(item: HomeLaunchBannerInput): Promise<HomeLaunchBanner> {
  const { data, error } = await supabase
    .from("home_launch_banners")
    .upsert(toDbPayload(item), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela de banners de lançamentos da Home ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }

  return dbToHomeLaunchBanner(data as DbHomeLaunchBanner);
}

export async function setHomeLaunchBannerActive(id: string, active: boolean): Promise<HomeLaunchBanner> {
  const { data, error } = await supabase
    .from("home_launch_banners")
    .update({ ativo: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela de banners de lançamentos da Home ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }

  return dbToHomeLaunchBanner(data as DbHomeLaunchBanner);
}

export async function deleteHomeLaunchBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from("home_launch_banners")
    .delete()
    .eq("id", id);

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Tabela de banners de lançamentos da Home ainda não foi criada no Supabase.");
    }
    throw new Error(error.message);
  }
}
