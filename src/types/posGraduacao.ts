export type PostGraduateCourse = {
  id: string;
  name: string;
  url: string;
  image_url: string;
  duration_hours: string;
  old_price: string;
  current_price: string;
  installment_price: string;
  level: string;
};

export type PostGraduateApiResponse = {
  updated_at: string;
  total_pages: number;
  total_courses: number;
  courses: PostGraduateCourse[];
};
