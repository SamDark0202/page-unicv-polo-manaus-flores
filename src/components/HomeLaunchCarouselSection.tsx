import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useHomeLaunchBannersQuery } from "@/hooks/useHomeLaunchBanners";
import { useCoursesQuery } from "@/hooks/useCourses";
import CourseDetailDialog from "@/components/CourseDetailDialog";
import { trackCardClick } from "@/lib/tracker";
import type { Course } from "@/types/course";
import { Sparkles } from "lucide-react";

export default function HomeLaunchCarouselSection() {
  const { data: banners = [] } = useHomeLaunchBannersQuery({ activeOnly: true });
  const { data: courses = [] } = useCoursesQuery({ activeOnly: true });

  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

    setSelectedCourse(course);
    setDialogOpen(true);
  }

  if (sortedBanners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-5 px-5 py-2.5 text-base font-bold border-2 shadow-sm bg-background">
            <Sparkles className="h-5 w-5 mr-2" /> Lançamentos UniCV
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">Oportunidades que podem acelerar sua carreira</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
            className="w-full"
            opts={{ loop: sortedBanners.length > 1, align: "start" }}
          >
            <CarouselContent>
              {sortedBanners.map((banner) => {
                const linkedCourse = coursesById.get(banner.courseId);

                return (
                  <CarouselItem key={banner.id} className="basis-full sm:basis-1/2 lg:basis-1/4">
                    <div className="h-full rounded-2xl border bg-card p-2 shadow-soft hover:shadow-elevated transition-shadow duration-300">
                      <button
                        type="button"
                        onClick={() => handleBannerClick(banner.id, banner.bannerName, banner.courseId)}
                        className="w-full text-left"
                      >
                        <div className="rounded-xl overflow-hidden border">
                          <img
                            src={banner.imageUrl}
                            alt={banner.bannerName}
                            loading="lazy"
                            className="w-full aspect-[3/4] object-cover"
                          />
                        </div>
                        <div className="pt-3 space-y-1">
                          <p className="text-sm font-semibold line-clamp-2">{banner.bannerName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {linkedCourse?.preview ?? "Pré-visualização do curso"}
                          </p>
                          <p className="text-xs font-medium text-foreground/80">
                            Duração: {linkedCourse?.duration ?? "Não informada"}
                          </p>
                        </div>
                      </button>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      <CourseDetailDialog
        open={dialogOpen}
        course={selectedCourse}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedCourse(null);
          }
        }}
      />
    </section>
  );
}
