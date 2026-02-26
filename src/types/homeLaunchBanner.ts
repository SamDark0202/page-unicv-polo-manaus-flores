export type HomeLaunchBannerBase = {
  bannerName: string;
  imageUrl: string;
  courseId: string;
  sortOrder: number;
  active: boolean;
};

export type HomeLaunchBannerInput = HomeLaunchBannerBase & {
  id?: string;
};

export type HomeLaunchBanner = HomeLaunchBannerBase & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type HomeLaunchBannerFilters = {
  activeOnly?: boolean;
};
