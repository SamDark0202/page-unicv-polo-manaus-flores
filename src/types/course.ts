export type CourseModality = "bacharelado" | "licenciatura" | "tecnologo";

export type CourseDeliveryMode = "ead" | "semipresencial";

export type CourseBase = {
  modality: CourseModality;
  deliveryMode: CourseDeliveryMode;
  name: string;
  duration: string;
  preview: string;
  about: string;
  jobMarket: string;
  curriculum: string[];
  requirements: string;
  active: boolean;
};

export type CourseInput = CourseBase & {
  id?: string;
};

export type Course = CourseBase & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseFilters = {
  modality?: CourseModality;
  activeOnly?: boolean;
};
