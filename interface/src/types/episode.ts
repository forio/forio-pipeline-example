export type EpisodeCreateInView = {
  name: string;
  runLimit?: number;
  draft?: boolean;
  category?: string;
};

export type EpisodeReadOutView = {
  lastUpdated: string;
  runLimit: number;
  created: string;
  draft: boolean;
  name: string;
  episodeKey: string;
  category: string;
};
