import { getStore } from "@netlify/blobs";

const restaurantStoreName = "restaurant_data";
const restaurantDataKey = "restaurants_list.json";
const placesStoreName = "places_data";
const placesDataKey = "places.json";

// Restaurant item structure.
export interface RestaurantItem {
  docid: string;
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: string;
  rating: number;
  priceLevel: string;
  description: string;
  mapsUrl: string;
  imageUrl: string;
};

// Gets the current list of restaurants from the blob store.
export const readRestaurants = async (): Promise<RestaurantItem[]> => {
  const restaurantsStr = await getStore(restaurantStoreName).get(restaurantDataKey, { type: 'text' });
  if (!restaurantsStr) {
    return [];
  }
  const parsedRestaurants = JSON.parse(restaurantsStr);

  const restaurants: RestaurantItem[] = [];
  for (const restaurant of parsedRestaurants as RestaurantItem[]) {
    if (!restaurant.name || !restaurant.lat || !restaurant.lng || !restaurant.mapsUrl || !restaurant.imageUrl) {
      continue;
    }
    restaurants.push(restaurant);
  }

  return restaurants;
}

// Writes the updated list of restaurants back to the blob store.
export const writeRestaurants = async (existing: RestaurantItem[], extracted: RestaurantItem[]): Promise<void> => {
  const restaurants = [...extracted, ...existing];
  const restaurantsStr = JSON.stringify(restaurants, null, 2);

  await getStore(restaurantStoreName).set(restaurantDataKey, restaurantsStr, { metadata: { updatedAt: new Date().toISOString() } });
}

// Reads the list of places data from blob store.
export const readPlaces = async (): Promise<Record<string, any>> => {
  const placesStr = await getStore(placesStoreName).get(placesDataKey, { type: 'text' });
  if (!placesStr) {
    return [];
  }

  return JSON.parse(placesStr);
}

// Writes the places data to blob store.
export const writePlaces = async (places: Record<string, any>): Promise<void> => {
  const placesStr = JSON.stringify(places, null, 2);

  await getStore(placesStoreName).set(placesDataKey, placesStr, { metadata: { updatedAt: new Date().toISOString() } });
}
