import type { Course, CourseFilters, CourseInput, CourseModality } from "@/types/course";
import { supabase } from "./supabaseClient";

export type DbCourse = {
  id: string;
  modalidade: CourseModality;
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
  return {
    id: data.id,
    modality: data.modalidade,
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
  const payload: Record<string, unknown> = {
    modalidade: course.modality,
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
  let query = supabase
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
  const { data, error } = await supabase
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

export async function saveCourse(course: CourseInput): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .upsert(toDbPayload(course), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return dbToCourse(data as DbCourse);
}

export async function setCourseActive(id: string, active: boolean): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .update({ ativo: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return dbToCourse(data as DbCourse);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
