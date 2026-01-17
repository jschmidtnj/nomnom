
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: string;
  rating: number;
  priceLevel: string;
  description: string;
  distance?: number; // In meters or kilometers
  mapsUri?: string;
  imageUrl?: string;
}

export enum SortOption {
  DISTANCE = 'Distance',
  RATING = 'Rating',
  PRICE = 'Price'
}

export interface GeminiGroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}
