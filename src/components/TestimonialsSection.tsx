import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Quote } from "lucide-react";

import depoimento1 from "@/assets/videos/Depoimento unicv 01 - 01.mp4";
import depoimento1b from "@/assets/videos/Depoimento unicv 01 - 02.mp4";
import depoimento2 from "@/assets/videos/Depoimento 2.mp4";
import depoimento3 from "@/assets/videos/Depoimento 3.mp4";
import depoimento4 from "@/assets/videos/depoimento 4.mp4";

type TestimonialVideo = {
  id: string;
  studentName: string;
  highlight: string;
  videoSrc: string;
};

const testimonialVideos: TestimonialVideo[] = [
  {
    id: "depoimento-1",
    studentName: "Aluna UniCV",
    highlight: "Transformação profissional com apoio real da instituição.",
    videoSrc: depoimento1,
  },
  {
    id: "depoimento-1b",
    studentName: "Aluno UniCV",
    highlight: "Mudança de trajetória com formação alinhada ao mercado atual.",
    videoSrc: depoimento1b,
  },
  {
    id: "depoimento-2",
    studentName: "Aluna UniCV",
    highlight: "Evolução na carreira com ensino prático e aplicável.",
    videoSrc: depoimento2,
  },
  {
    id: "depoimento-3",
    studentName: "Aluna UniCV",
    highlight: "Conquista de novas oportunidades após a formação.",
    videoSrc: depoimento3,
  },
  {
    id: "depoimento-4",
    studentName: "Aluna UniCV",
    highlight: "Confiança para avançar e alcançar novos objetivos.",
    videoSrc: depoimento4,
  },
];

export default function TestimonialsSection() {
  const [activatedVideos, setActivatedVideos] = useState<Record<string, boolean>>({});
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  function activateVideo(videoId: string) {
    setActivatedVideos((prev) => ({ ...prev, [videoId]: true }));

    window.requestAnimationFrame(() => {
      const element = videoRefs.current.get(videoId);
      if (!element) return;

      element.muted = false;
      element.volume = 1;
      element
        .play()
        .catch(() => {
          // fallback silencioso caso o browser bloqueie autoplay
        });
    });
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
                      <video
                        ref={(node) => {
                          if (node) {
                            videoRefs.current.set(item.id, node);
                          } else {
                            videoRefs.current.delete(item.id);
                          }
                        }}
                        className="h-full w-full object-contain bg-black"
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        preload="metadata"
                        playsInline
                        autoPlay
                        muted={false}
                        onContextMenu={(event) => event.preventDefault()}
                      >
                        <source src={item.videoSrc} type="video/mp4" />
                        Seu navegador não suporta vídeo.
                      </video>
                    ) : (
                      <button
                        type="button"
                        onClick={() => activateVideo(item.id)}
                        className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/30 to-black/65 text-white flex flex-col items-center justify-center gap-3 p-4"
                        aria-label={`Reproduzir depoimento de ${item.studentName}`}
                      >
                        <PlayCircle className="h-14 w-14" />
                        <p className="text-sm font-semibold">Assistir depoimento</p>
                        <p className="text-xs text-white/80">Carrega apenas ao clicar</p>
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
