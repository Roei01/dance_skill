export type VideoChapter = {
  time: string;
  label: string;
};

export type VideoCardRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  level: string;
  imageUrl: string;
  isActive: boolean;
};

export type VideoRecord = VideoCardRecord & {
  watchDescription?: string;
  classBreakdown: VideoChapter[];
  videoUrl: string;
  previewUrl: string;
};
