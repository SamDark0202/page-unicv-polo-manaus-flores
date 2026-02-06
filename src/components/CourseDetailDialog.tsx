import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Course, CourseModality } from "@/types/course";
import { Clock3, GraduationCap } from "lucide-react";

const MODALITY_LABEL: Record<CourseModality, string> = {
  bacharelado: "Bacharelado",
  licenciatura: "Licenciatura",
  tecnologo: "Tecnologo",
};

const WHATSAPP_NUMBER = "559220201260";

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

type Props = {
  open: boolean;
  course: Course | null;
  onOpenChange: (open: boolean) => void;
};

export default function CourseDetailDialog({ course, open, onOpenChange }: Props) {
  const intro = course ? splitAbout(course.about) : { intro: "", body: "" };

  const whatsappUrl = course
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Olá! Tenho interesse no curso ${course.name} (${MODALITY_LABEL[course.modality]}). Pode me enviar mais detalhes?`
      )}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] scroll-smooth">
        {course && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                  {MODALITY_LABEL[course.modality]}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 mr-1" />
                  {course.duration}
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                <GraduationCap className="h-7 w-7 text-primary" />
                <span>{course.name}</span>
              </DialogTitle>
              <DialogDescription className="text-base text-foreground/80">
                {course.preview}
              </DialogDescription>
            </DialogHeader>

            {intro.intro && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground">Introdução</h3>
                <p className="text-base leading-relaxed">{intro.intro}</p>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Sobre o curso</h3>
              <p className="leading-relaxed whitespace-pre-line">{intro.body || course.about}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Mercado de Trabalho</h3>
              <p className="leading-relaxed whitespace-pre-line">{course.jobMarket}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Matriz Curricular</h3>
              {course.curriculum.length > 0 ? (
                <Accordion type="single" collapsible className="rounded-xl border">
                  <AccordionItem value="curriculum">
                    <AccordionTrigger className="text-base text-left">
                      Ver disciplinas
                    </AccordionTrigger>
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
              <h3 className="text-lg font-semibold">Requisitos</h3>
              <p className="leading-relaxed whitespace-pre-line">{course.requirements}</p>
            </section>

            <DialogFooter className="mt-6">
              <Button asChild className="w-full md:w-auto">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    import("@/lib/tracker").then(({ trackWhatsAppClick }) =>
                      trackWhatsAppClick("course_dialog", { course: course?.name })
                    );
                  }}
                >
                  Falar com um consultor
                </a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
