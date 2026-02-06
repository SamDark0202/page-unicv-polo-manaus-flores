import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { seedCourses, type SeedCourse } from "./courseSeedData";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.env.DRY_RUN === "1";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.");
}

const authKey = supabaseServiceRoleKey || supabaseAnonKey;
if (!supabaseServiceRoleKey) {
  console.warn("[courses migration] SUPABASE_SERVICE_ROLE_KEY not provided. Using anon key; RLS must allow inserts.");
}

const supabase = createClient(supabaseUrl, authKey);

type DbPayload = {
  modalidade: SeedCourse["modality"];
  nome_curso: string;
  duracao: string;
  texto_preview: string;
  sobre_curso: string;
  mercado_trabalho: string;
  matriz_curricular: { title: string; items: string[] }[];
  requisitos: string;
  ativo: boolean;
};

function toPayload(course: SeedCourse): DbPayload {
  return {
    modalidade: course.modality,
    nome_curso: course.name,
    duracao: course.duration,
    texto_preview: course.preview,
    sobre_curso: `O curso de ${course.name} oferece ${course.preview.toLowerCase()}. Atualize este texto no painel administrativo para incluir detalhes completos.`,
    mercado_trabalho: `Descreva no painel as principais áreas de atuação para ${course.name} e oportunidades regionais.`,
    matriz_curricular: [
      {
        title: "Matriz Curricular",
        items: [
          "Atualize esta seção com as disciplinas oficiais do curso.",
        ],
      },
    ],
    requisitos: "Ensino médio completo e documentação pessoal. Personalize os requisitos específicos pelo painel.",
    ativo: true,
  };
}

async function upsertCourse(course: SeedCourse) {
  const payload = toPayload(course);

  if (dryRun) {
    console.log(`[DRY-RUN] ${course.name}`);
    return;
  }

  const { error } = await supabase
    .from("courses")
    .upsert(payload, { onConflict: "modalidade, nome_curso" });

  if (error) {
    throw new Error(error.message);
  }
}

async function run() {
  console.log(`Migrando ${seedCourses.length} cursos para o Supabase. Dry run: ${dryRun}`);

  for (const course of seedCourses) {
    try {
      await upsertCourse(course);
      console.log(`✔ ${course.name}`);
    } catch (err) {
      console.error(`✖ ${course.name}:`, (err as Error).message);
    }
  }

  console.log("Concluído.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
