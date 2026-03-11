import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CourseFilters, CourseInput } from "@/types/course";
import { deleteCourse, fetchCourses, saveCourse, setCourseActive } from "@/lib/courseService";
import { DEFAULT_BASE_DELAY_MS, DEFAULT_MAX_RETRIES, getRetryDelay, shouldRetryHttpLikeError } from "@/lib/retry";

const baseKey = ["courses"] as const;

type TogglePayload = {
  id: string;
  active: boolean;
};

type DeletePayload = string;

function buildKey(filters?: CourseFilters) {
  return [
    ...baseKey,
    filters?.modality ?? "all",
    (filters?.activeOnly ?? "any").toString(),
  ];
}

export function useCoursesQuery(filters?: CourseFilters) {
  const queryKey = useMemo(() => buildKey(filters), [filters]);

  return useQuery({
    queryKey,
    queryFn: () => fetchCourses(filters),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => failureCount < DEFAULT_MAX_RETRIES && shouldRetryHttpLikeError(error),
    retryDelay: (attemptIndex) => getRetryDelay(DEFAULT_BASE_DELAY_MS, attemptIndex),
  });
}

export function useCourseMutations() {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: baseKey });
  }

  const upsert = useMutation({
    mutationFn: (payload: CourseInput) => saveCourse(payload),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: TogglePayload) => setCourseActive(id, active),
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: (id: DeletePayload) => deleteCourse(id),
    onSuccess: invalidate,
  });

  return { upsert, toggleActive, hardDelete };
}
