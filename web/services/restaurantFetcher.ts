
import { Restaurant, Coordinates } from "../types";

export const fetchRecommendedRestaurants = async (_coords: Coordinates): Promise<{ restaurants: Restaurant[], rawText: string }> => {
  try {
    const response = await fetch('/api/restaurants.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
    }
    
    const data: Omit<Restaurant, 'id' | 'distance'>[] = await response.json();

    const restaurants: Restaurant[] = data.map((res, index) => ({
      ...res,
      id: `static-res-${index}`
    }));

    return { 
      restaurants, 
      rawText: "This is a recoomended list of places to eat!" 
    };
  } catch (error) {
    console.error("Error fetching recommended restaurants:", error);

    return {
      restaurants: [],
      rawText: "Failed to load recommendations."
    };
  }
};
