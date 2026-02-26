export type PostPlusCarouselItemBase = {
  bannerName: string;
  imageUrl: string;
  mobileImageUrl: string;
  metaDescription: string;
  targetUrl?: string;
  sortOrder: number;
  active: boolean;
};

export type PostPlusCarouselItemInput = PostPlusCarouselItemBase & {
  id?: string;
};

export type PostPlusCarouselItem = PostPlusCarouselItemBase & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PostPlusCarouselFilters = {
  activeOnly?: boolean;
};
