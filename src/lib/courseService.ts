import type { Course, CourseDeliveryMode, CourseFilters, CourseInput, CourseModality } from "@/types/course";
import { adminSupabase, supabase } from "./supabaseClient";
import { slugify } from "@/utils/slugify";

export type DbCourse = {
  id: string;
  modalidade: CourseModality;
  modalidade_entrega: CourseDeliveryMode | null;
  slug: string | null;
  imagem_url: string | null;
  nome_curso: string;
  duracao: string;
  texto_preview: string;
  sobre_curso: string;
  mercado_trabalho: string;
  matriz_curricular: unknown;
  requisitos: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

function parseCurriculum(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    // Accept array of strings or legacy array of sections
    const first = value[0];
    if (typeof first === "string" || first === undefined) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }

    if (first && typeof first === "object" && "items" in (first as any)) {
      return (value as any[])
        .flatMap((section) => {
          const items = Array.isArray(section.items)
            ? section.items
            : typeof section.items === "string"
              ? section.items.split(/\r?\n/)
              : [];
          return items;
        })
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function dbToCourse(data: DbCourse): Course {
  const fallbackSlug = slugify(data.nome_curso);

  return {
    id: data.id,
    modality: data.modalidade,
    deliveryMode: data.modalidade_entrega ?? "ead",
    slug: data.slug && data.slug.trim() ? data.slug.trim() : fallbackSlug,
    imageUrl: data.imagem_url?.trim() ?? "",
    name: data.nome_curso,
    duration: data.duracao,
    preview: data.texto_preview,
    about: data.sobre_curso,
    jobMarket: data.mercado_trabalho,
    curriculum: parseCurriculum(data.matriz_curricular),
    requirements: data.requisitos,
    active: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function toDbPayload(course: CourseInput) {
  const safeSlug = slugify((course.slug || "").trim() || course.name);

  const payload: Record<string, unknown> = {
    modalidade: course.modality,
    modalidade_entrega: course.deliveryMode,
    slug: safeSlug,
    imagem_url: course.imageUrl?.trim() || null,
    nome_curso: course.name,
    duracao: course.duration,
    texto_preview: course.preview,
    sobre_curso: course.about,
    mercado_trabalho: course.jobMarket,
    matriz_curricular: course.curriculum,
    requisitos: course.requirements,
    ativo: course.active,
  };

  if (course.id) {
    payload.id = course.id;
  }

  return payload;
}

export async function fetchCourses(filters: CourseFilters = {}): Promise<Course[]> {
  const { modality, activeOnly } = filters;
  const client = activeOnly ? supabase : adminSupabase;

  let query = client
    .from("courses")
    .select("*")
    .order("nome_curso", { ascending: true });

  if (modality) {
    query = query.eq("modalidade", modality);
  }

  if (activeOnly) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbCourse[]).map(dbToCourse);
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await adminSupabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return dbToCourse(data as DbCourse);
}

type FetchBySlugParams = {
  slug: string;
  modality?: CourseModality;
  activeOnly?: boolean;
};

export async function fetchCourseBySlug(params: FetchBySlugParams): Promise<Course | null> {
  const slug = slugify(params.slug);
  if (!slug) return null;

  let query = supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .limit(1);

  if (params.modality) {
    query = query.eq("modalidade", params.modality);
  }

  if (params.activeOnly) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    const missingSlugColumn =
      error.code === "42703" ||
      /column\s+courses\.slug\s+does not exist/i.test(error.message || "");

    if (!missingSlugColumn) {
      throw new Error(error.message);
    }

    let fallbackQuery = supabase
      .from("courses")
      .select("*")
      .order("nome_curso", { ascending: true });

    if (params.modality) {
      fallbackQuery = fallbackQuery.eq("modalidade", params.modality);
    }

    if (params.activeOnly) {
      fallbackQuery = fallbackQuery.eq("ativo", true);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    const match = (fallbackData as DbCourse[]).find((course) => slugify(course.nome_curso) === slug);
    return match ? dbToCourse(match) : null;
  }

  if (!data) {
    return null;
  }

  return dbToCourse(data as DbCourse);
}

export async function saveCourse(course: CourseInput): Promise<Course> {
  const { data, error } = await adminSupabase
    .from("courses")
    .upsert(toDbPayload(course), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42501") {
      throw new Error("Sessao sem permissao para salvar curso. Faca login novamente no painel.");
    }
    throw new Error(error.message);
  }

  return dbToCourse(data as DbCourse);
}

export async function setCourseActive(id: string, active: boolean): Promise<Course> {
  const { data, error } = await adminSupabase
    .from("courses")
    .update({ ativo: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42501") {
      throw new Error("Sessao sem permissao para atualizar curso. Faca login novamente no painel.");
    }
    throw new Error(error.message);
  }

  return dbToCourse(data as DbCourse);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await adminSupabase.from("courses").delete().eq("id", id);
  if (error) {
    if (error.code === "42501") {
      throw new Error("Sessao sem permissao para excluir curso. Faca login novamente no painel.");
    }
    throw new Error(error.message);
  }
}
