export type VideoChapter = {
  time: string;
  label: string;
};

export type VideoRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  watchDescription?: string;
  classBreakdown: VideoChapter[];
  price: number;
  level: string;
  videoUrl: string;
  previewUrl: string;
  imageUrl: string;
  isActive: boolean;
};
