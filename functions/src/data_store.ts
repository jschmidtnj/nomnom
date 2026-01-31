import { getStore } from "@netlify/blobs";

const restaurantStoreName = "restaurant_data";
const restaurantDataKey = "restaurants_list.json";

const restaurantStore = getStore(restaurantStoreName);

// Restaurant item structure.
export interface RestaurantItem {
  docid: string;
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
  const restaurantsStr = await restaurantStore.get(restaurantDataKey, { type: 'text' });
  if (!restaurantsStr) {
    return [];
  }
  const parsedRestaurants = JSON.parse(restaurantsStr);

  const restaurants: RestaurantItem[] = [];
  for (const restaurant of parsedRestaurants as RestaurantItem[]) {
    if (!restaurant.name || !restaurant.address || !restaurant.lat || !restaurant.lng ||
      !restaurant.cuisine || !restaurant.rating || !restaurant.priceLevel ||
      !restaurant.description || !restaurant.mapsUrl || !restaurant.imageUrl) {
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

  await restaurantStore.set(restaurantDataKey, restaurantsStr, { metadata: { updatedAt: new Date().toISOString() } });
}
