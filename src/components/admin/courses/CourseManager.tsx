import { useEffect, useState } from "react";
import type { Course } from "@/types/course";
import CourseList from "./CourseList";
import CourseForm from "./CourseForm";
import PostPlusCarouselManager from "./PostPlusCarouselManager";
import HomeLaunchBannersManager from "./HomeLaunchBannersManager";
import TechnicalToTechnologistManager from "./TechnicalToTechnologistManager";
import SegundaGraduacaoManager from "./SegundaGraduacaoManager";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = "list" | "form";
type CourseSection = "courses" | "technical-to-technologist" | "second-graduation" | "post-plus-carousel" | "home-launch-banners";

type Props = {
  createSignal?: number;
  allowedSections?: readonly CourseSection[];
  canEditCourses?: boolean;
};

export default function CourseManager({ createSignal, allowedSections, canEditCourses = true }: Props) {
  const [section, setSection] = useState<CourseSection>("courses");
  const [view, setView] = useState<View>("list");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  function isAllowed(s: CourseSection) {
    return !allowedSections || allowedSections.includes(s);
  }

  function handleSectionChange(value: string) {
    const next = value as CourseSection;
    if (isAllowed(next)) setSection(next);
  }

  useEffect(() => {
    if (createSignal && createSignal > 0) {
      setSection("courses");
      setEditingCourse(null);
      setView("form");
    }
  }, [createSignal]);

  function handleCreate() {
    if (!canEditCourses) return;
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

  function renderTabs() {
    return (
      <Tabs value={section} onValueChange={handleSectionChange}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="technical-to-technologist">Téc. → Tecnólogo</TabsTrigger>
          {isAllowed("second-graduation") && <TabsTrigger value="second-graduation">2ª Graduação</TabsTrigger>}
          {isAllowed("post-plus-carousel") && <TabsTrigger value="post-plus-carousel">Carrossel Pós+</TabsTrigger>}
          {isAllowed("home-launch-banners") && <TabsTrigger value="home-launch-banners">Lançamentos Home</TabsTrigger>}
        </TabsList>
      </Tabs>
    );
  }

  if (section === "post-plus-carousel") {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <PostPlusCarouselManager />
      </div>
    );
  }

  if (section === "home-launch-banners") {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <HomeLaunchBannersManager />
      </div>
    );
  }

  if (section === "technical-to-technologist") {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <TechnicalToTechnologistManager />
      </div>
    );
  }

  if (section === "second-graduation") {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <SegundaGraduacaoManager />
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <CourseForm
          course={editingCourse}
          onCancel={backToList}
          onSaved={backToList}
          readOnly={!canEditCourses}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderTabs()}

      <CourseList
        onCreate={handleCreate}
        onEdit={handleEdit}
        canEditCourses={canEditCourses}
      />
    </div>
  );
}
