import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCourseBySlugQuery } from "@/hooks/useCourses";
import { buildCoursePath, COURSE_MODALITY_LABEL } from "@/lib/courseRoute";
import { trackWhatsAppClick } from "@/lib/tracker";
import type { CourseModality } from "@/types/course";
import { Clock3, GraduationCap } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";

const WHATSAPP_NUMBER = "559220201260";

const VALID_MODALITIES: CourseModality[] = ["bacharelado", "licenciatura", "tecnologo"];

function isCourseModality(value: string | undefined): value is CourseModality {
  return !!value && VALID_MODALITIES.includes(value as CourseModality);
}

function splitAbout(value: string) {
  const parts = value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { intro: "", body: value };
  }

  const [intro, ...rest] = parts;
  return {
    intro,
    body: rest.join("\n\n"),
  };
}

export default function CourseDetails() {
  const { modality, slug } = useParams();
  const validModality = isCourseModality(modality) ? modality : undefined;
  const safeSlug = (slug || "").trim();

  const { data: course, isLoading, error } = useCourseBySlugQuery({
    slug: safeSlug,
    modality: validModality,
    activeOnly: true,
  });

  const fetchError = error instanceof Error ? error.message : null;

  if (!validModality) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Curso nao encontrado</h1>
          <p className="mt-4 text-muted-foreground">A modalidade informada na URL e invalida.</p>
          <Button asChild className="mt-8">
            <Link to="/">Voltar para a pagina inicial</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Carregando detalhes do curso...
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Curso nao encontrado</h1>
          <p className="mt-4 text-muted-foreground">
            {fetchError || "Este curso nao esta disponivel no momento ou foi removido."}
          </p>
          <Button asChild className="mt-8">
            <Link to={`/${validModality}`}>Ver lista de cursos</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const intro = splitAbout(course.about);
  const canonicalPath = buildCoursePath(course);
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;
  const seoDescription = (course.preview || course.about || "").slice(0, 160);

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Ola! Tenho interesse no curso ${course.name} (${COURSE_MODALITY_LABEL[course.modality]}). Pode me enviar mais detalhes?`
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${course.name} | ${COURSE_MODALITY_LABEL[course.modality]} | Unicive Polo Flores`}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={course.name} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <Header />

      <main className="container mx-auto px-4 py-12 lg:py-16">
        <article className="mx-auto max-w-[1200px] space-y-8">
          <header className="rounded-3xl border bg-card p-5 shadow-soft lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,580px)] lg:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                    {COURSE_MODALITY_LABEL[course.modality]}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold flex items-start gap-3">
                  <GraduationCap className="mt-1 h-7 w-7 text-primary" />
                  <span>{course.name}</span>
                </h1>
                <p className="text-lg text-foreground/80">{course.preview}</p>
              </div>

              {course.imageUrl && (
                <div className="mx-auto w-full max-w-[580px] overflow-hidden rounded-2xl border-4 border-emerald-500/80 bg-muted/30 lg:mx-0 lg:justify-self-end">
                  <img
                    src={course.imageUrl}
                    alt={course.name}
                    className="aspect-[116/77] w-full object-cover object-center lg:h-[385px] lg:w-[580px]"
                    loading="eager"
                  />
                </div>
              )}
            </div>
          </header>

          {intro.intro && (
            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-muted-foreground">Introducao</h2>
              <p className="text-base leading-relaxed">{intro.intro}</p>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Sobre o curso</h2>
            <p className="leading-relaxed whitespace-pre-line">{intro.body || course.about}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Mercado de trabalho</h2>
            <p className="leading-relaxed whitespace-pre-line">{course.jobMarket}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Matriz curricular</h2>
            {course.curriculum.length > 0 ? (
              <Accordion type="single" collapsible className="rounded-xl border">
                <AccordionItem value="curriculum">
                  <AccordionTrigger className="text-base text-left">Ver disciplinas</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {course.curriculum.map((item, index) => (
                        <li key={`${course.id}-curriculum-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <p className="text-sm text-muted-foreground">Atualize a matriz curricular para este curso.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Requisitos</h2>
            <p className="leading-relaxed whitespace-pre-line">{course.requirements}</p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => {
                trackWhatsAppClick("course_page", { course: course.name });
                window.open(whatsappLink, "_blank");
              }}
            >
              Falar com um consultor
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/${course.modality}`}>Voltar para a lista</Link>
            </Button>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
