import type { Course, CourseModality } from "@/types/course";
import { slugify } from "@/utils/slugify";

export const COURSE_MODALITY_LABEL: Record<CourseModality, string> = {
  bacharelado: "Bacharelado",
  licenciatura: "Licenciatura",
  tecnologo: "Tecnologo",
};

export function buildCoursePath(course: Pick<Course, "modality" | "slug" | "name">) {
  const safeSlug = slugify((course.slug || "").trim() || course.name);
  return `/cursos/${course.modality}/${safeSlug}`;
}
