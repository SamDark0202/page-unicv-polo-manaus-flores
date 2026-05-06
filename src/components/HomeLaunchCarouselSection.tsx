import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useHomeLaunchBannersQuery } from "@/hooks/useHomeLaunchBanners";
import { useCoursesQuery } from "@/hooks/useCourses";
import { trackCardClick } from "@/lib/tracker";
import { toSupabaseRenderImageUrl } from "@/lib/supabaseImage";
import type { Course } from "@/types/course";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { buildCoursePath } from "@/lib/courseRoute";

export default function HomeLaunchCarouselSection() {
  const { data: banners = [] } = useHomeLaunchBannersQuery({ activeOnly: true });
  const { data: courses = [] } = useCoursesQuery({ activeOnly: true });

  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)),
    [banners]
  );

  const coursesById = useMemo(() => {
    const map = new Map<string, Course>();
    for (const course of courses) {
      map.set(course.id, course);
    }
    return map;
  }, [courses]);

  useEffect(() => {
    if (!api || isPaused || sortedBanners.length <= 1) return;

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [api, isPaused, sortedBanners.length]);

  function handleBannerClick(bannerId: string, bannerName: string, courseId: string) {
    const course = coursesById.get(courseId) ?? null;
    if (!course) return;

    trackCardClick(bannerName, {
      source: "home_launch_banner",
      banner_id: bannerId,
      banner_name: bannerName,
      course_id: courseId,
      course_name: course.name,
    });
  }

  if (sortedBanners.length === 0) {
    return null;
  }

  return (
    <section className="py-10 lg:py-14 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-bold border-2 shadow-sm bg-background">
            <Sparkles className="h-4 w-4 mr-2" /> Lançamentos Unicive
          </Badge>
          <h2 className="text-2xl lg:text-4xl font-bold mb-3">Oportunidades que podem acelerar sua carreira</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Descubra formações recém-chegadas com alto potencial de crescimento profissional e escolha agora o próximo passo da sua evolução.
          </p>
        </div>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="relative"
        >
          <Carousel
            setApi={setApi}
            className="w-full max-w-6xl mx-auto"
            opts={{ loop: sortedBanners.length > 1, align: "start" }}
          >
            <CarouselContent>
              {sortedBanners.map((banner) => {
                const linkedCourse = coursesById.get(banner.courseId);

                return (
                  <CarouselItem key={banner.id} className="basis-[88%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="h-full max-w-[320px] mx-auto rounded-xl border bg-card p-1.5 shadow-soft hover:shadow-elevated transition-shadow duration-300">
                      <Link
                        to={linkedCourse ? buildCoursePath(linkedCourse) : "#"}
                        onClick={() => handleBannerClick(banner.id, banner.bannerName, banner.courseId)}
                        className="w-full text-left"
                      >
                        <div className="rounded-lg overflow-hidden border">
                          <img
                            src={toSupabaseRenderImageUrl(banner.imageUrl, {
                              width: 640,
                              quality: 65,
                              format: "webp",
                              resize: "cover",
                            })}
                            alt={banner.bannerName}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-[4/5] object-cover"
                          />
                        </div>
                        <div className="pt-2.5 space-y-1">
                          <p className="text-sm font-semibold line-clamp-2">{banner.bannerName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {linkedCourse?.preview ?? "Pré-visualização do curso"}
                          </p>
                          <p className="text-xs font-medium text-foreground/80">
                            Duração: {linkedCourse?.duration ?? "Não informada"}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
