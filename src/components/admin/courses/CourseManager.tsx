import { useEffect, useState } from "react";
import type { Course } from "@/types/course";
import CourseList from "./CourseList";
import CourseForm from "./CourseForm";
import PostPlusCarouselManager from "./PostPlusCarouselManager";
import HomeLaunchBannersManager from "./HomeLaunchBannersManager";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = "list" | "form";
type CourseSection = "courses" | "post-plus-carousel" | "home-launch-banners";

type Props = {
  createSignal?: number;
};

export default function CourseManager({ createSignal }: Props) {
  const [section, setSection] = useState<CourseSection>("courses");
  const [view, setView] = useState<View>("list");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (createSignal && createSignal > 0) {
      setSection("courses");
      setEditingCourse(null);
      setView("form");
    }
  }, [createSignal]);

  function handleCreate() {
    setEditingCourse(null);
    setView("form");
  }

  function handleEdit(course: Course) {
    setEditingCourse(course);
    setView("form");
  }

  function backToList() {
    setEditingCourse(null);
    setView("list");
  }

  if (section === "post-plus-carousel") {
    return (
      <div className="space-y-6">
        <Tabs value={section} onValueChange={(value) => setSection(value as CourseSection)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="post-plus-carousel">Carrossel Pós+</TabsTrigger>
            <TabsTrigger value="home-launch-banners">Lançamentos Home</TabsTrigger>
          </TabsList>
        </Tabs>
        <PostPlusCarouselManager />
      </div>
    );
  }

  if (section === "home-launch-banners") {
    return (
      <div className="space-y-6">
        <Tabs value={section} onValueChange={(value) => setSection(value as CourseSection)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="post-plus-carousel">Carrossel Pós+</TabsTrigger>
            <TabsTrigger value="home-launch-banners">Lançamentos Home</TabsTrigger>
          </TabsList>
        </Tabs>
        <HomeLaunchBannersManager />
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        <Tabs value={section} onValueChange={(value) => setSection(value as CourseSection)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="post-plus-carousel">Carrossel Pós+</TabsTrigger>
            <TabsTrigger value="home-launch-banners">Lançamentos Home</TabsTrigger>
          </TabsList>
        </Tabs>
        <CourseForm
          course={editingCourse}
          onCancel={backToList}
          onSaved={backToList}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={section} onValueChange={(value) => setSection(value as CourseSection)}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="post-plus-carousel">Carrossel Pós+</TabsTrigger>
          <TabsTrigger value="home-launch-banners">Lançamentos Home</TabsTrigger>
        </TabsList>
      </Tabs>

      <CourseList
        onCreate={handleCreate}
        onEdit={handleEdit}
      />
    </div>
  );
}
