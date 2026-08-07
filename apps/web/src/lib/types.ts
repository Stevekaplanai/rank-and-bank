export type ScoreBreakdown = {
  location: number;
  amenities: number;
  views: number;
  value: number;
  noise: number;
};

export type SeedComment = {
  user: string;
  text: string;
  tokens: number;
};

export type Building = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  ryans_rank: number;
  ryans_score: number;
  score_breakdown: ScoreBreakdown;
  review_excerpt: string;
  photos: string[];
  seed_comments: SeedComment[];
};

export type BuildingWithMarket = Building & {
  priceSol: number;
  supply: number;
  marketCapSol: number;
  graduated: boolean;
  communityRank: number;
};
