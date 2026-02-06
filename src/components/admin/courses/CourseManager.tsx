import { useEffect, useState } from "react";
import type { Course } from "@/types/course";
import CourseList from "./CourseList";
import CourseForm from "./CourseForm";

type View = "list" | "form";

type Props = {
  createSignal?: number;
};

export default function CourseManager({ createSignal }: Props) {
  const [view, setView] = useState<View>("list");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (createSignal && createSignal > 0) {
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

  if (view === "form") {
    return (
      <CourseForm
        course={editingCourse}
        onCancel={backToList}
        onSaved={backToList}
      />
    );
  }

  return (
    <CourseList
      onCreate={handleCreate}
      onEdit={handleEdit}
    />
  );
}
