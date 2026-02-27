import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Quote } from "lucide-react";

type TestimonialVideo = {
  id: string;
  studentName: string;
  highlight: string;
  youtubeId: string;
};

const testimonialVideos: TestimonialVideo[] = [
  {
    id: "depoimento-1",
    studentName: "Aluna UniCV",
    highlight: "Transformação profissional com apoio real da instituição.",
    youtubeId: "SqWQJKLTD1k",
  },
  {
    id: "depoimento-1b",
    studentName: "Aluno UniCV",
    highlight: "Mudança de trajetória com formação alinhada ao mercado atual.",
    youtubeId: "wS6CsL-HFG0",
  },
  {
    id: "depoimento-2",
    studentName: "Aluna UniCV",
    highlight: "Evolução na carreira com ensino prático e aplicável.",
    youtubeId: "Rgr85G-JSt4",
  },
  {
    id: "depoimento-3",
    studentName: "Aluna UniCV",
    highlight: "Conquista de novas oportunidades após a formação.",
    youtubeId: "a7-DWQzSBqU",
  },
  {
    id: "depoimento-4",
    studentName: "Aluna UniCV",
    highlight: "Confiança para avançar e alcançar novos objetivos.",
    youtubeId: "9kQyvG8tbvE",
  },
];

export default function TestimonialsSection() {
  const [activatedVideos, setActivatedVideos] = useState<Record<string, boolean>>({});

  function activateVideo(videoId: string) {
    setActivatedVideos((prev) => ({ ...prev, [videoId]: true }));
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-semibold">
            <Quote className="h-4 w-4 mr-2" /> Histórias Reais UniCV
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Resultados que inspiram novas conquistas
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Veja depoimentos autênticos de quem decidiu agir e hoje colhe crescimento profissional, segurança e novas oportunidades.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
          {testimonialVideos.map((item) => {
            const isActive = Boolean(activatedVideos[item.id]);

            return (
              <Card key={item.id} className="overflow-hidden border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {isActive ? (
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&rel=0`}
                        title={`Depoimento de ${item.studentName}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => activateVideo(item.id)}
                        className="absolute inset-0 w-full h-full text-white flex flex-col items-center justify-center gap-3 p-4"
                        aria-label={`Reproduzir depoimento de ${item.studentName}`}
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <PlayCircle className="h-14 w-14" />
                        <p className="text-sm font-semibold">Assistir depoimento</p>
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-sm font-semibold">{item.studentName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.highlight}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button size="lg" asChild>
            <a href="#contato">Quero viver minha próxima conquista</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
