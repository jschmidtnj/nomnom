import type { Context, Config } from "@netlify/functions";
import { CheerioAPI, load as htmlLoad } from "cheerio";
import { RestaurantItem, readPlaces, readRestaurants, writePlaces, writeRestaurants } from "./src/data_store.ts";
import { getJwt, validateJwt } from "./src/auth.ts";

const restaurantJsonDataKey = "data";

const placesApiKey = Netlify.env.get("PLACES_API_KEY");

// Fetches place data from Google Places API using the provided docId.
const fetchPlaceData = async (docId: string): Promise<Record<string, any>> => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?cid=${docId}&key=${placesApiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch place data: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.result) {
    return new Error('Cannot find any places data.');
  }

  return data.result;
}

// Gets the place data from cache or fetches it if not present.
const getOrFetchPlaceData = async (docId: string, placesData: Record<string, any>): Promise<Record<string, any>> => {
  if (docId in placesData) {
    return placesData[docId];
  }

  try {
    placesData[docId] = await fetchPlaceData(docId);
    return placesData[docId];
  } catch (error) {
    console.error('Error fetching places data:', error);
  }

  return {};
}

// Extracts restaurant data from the provided HTML content.
const extractNewRestaurants = async (htmlContent: CheerioAPI, placesData: Record<string, any>): Promise<RestaurantItem[]> => {
  let result: RestaurantItem[] = [];

  htmlContent('a').each((_, element) => {
    const href = htmlContent(element).attr('href') || '';
    if (!href.startsWith('https://www.google.com/search')) {
      return;
    }

    const nameMatch = href.match(/q=([^&]+)/);
    if (!nameMatch) {
      console.error('no name match!')
      return;
    }

    const name = decodeURIComponent(nameMatch[1]);
    const docidMatch = href.match(/ludocid=(\d+)/);
    if (!docidMatch) {
      console.error('no doc id match!')
      return;
    }
    const docid = docidMatch[1];
    const mapsUrl = `https://maps.google.com/?cid=${docid}`;

    const ratingText = (htmlContent(element).find('[aria-label*="Rated "]').attr('aria-label') || '').trim();
    console.log('ratingText: ', ratingText);
    const ratingMatch = ratingText.match(/Rated (\d+(\.\d+)?) out of 5/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    const imageElement = htmlContent(element).find('img').filter((_, img) => {
      const src = htmlContent(img).attr('src') || '';
      return src.startsWith('https://lh3.googleusercontent.com');
    }).first();
    const imageUrl = imageElement.attr('src') || '';

    if (docid && name && mapsUrl && imageUrl) {
      result.push({
        docid,
        placeId: 'unknown',
        name,
        address: 'unknown',
        lat: 0.0,
        lng: 0.0,
        cuisine: 'unknown',
        rating,
        priceLevel: 'unknown',
        description: 'unknown',
        mapsUrl,
        imageUrl
      });
    }
  });

  result = await Promise.all(result.map(async (restaurant) => {
    const placeData = await getOrFetchPlaceData(restaurant.docid, placesData);

    restaurant.placeId = placeData.place_id;
    restaurant.address = placeData.formatted_address || 'Address not available';
    restaurant.lat = placeData.geometry?.location?.lat || 0;
    restaurant.lng = placeData.geometry?.location?.lng || 0;
    restaurant.description = placeData.editorial_summary?.overview || 'No description available';
    restaurant.priceLevel = placeData.price_level ? '$'.repeat(placeData.price_level) : 'N/A';
    restaurant.cuisine = placeData.types ? placeData.types.join(', ') : 'N/A';

    return restaurant;
  }));

  return result.filter((currItem, i, self) =>
    i === self.findIndex((otherItem) => otherItem.docid === currItem.docid)
  );
}

// Deduplicates restaurants based on their Maps URL.
const deduplicateRestaurants = (existing: RestaurantItem[], extracted: RestaurantItem[]): RestaurantItem[] => {
  const existingSet = new Set(existing.map(r => r.docid));

  return extracted.filter(restaurant => !existingSet.has(restaurant.docid));
}

export default async (req: Request, _context: Context) => {
  try {
    const jwt = getJwt(req);
    if (!jwt) {
      return new Response("Unauthorized: Invalid / no JWT provided.", {
        status: 401,
      });
    }
    const username = validateJwt(jwt);
    console.log('username: ', username);

    const jsonData = await req.json();
    if (!(restaurantJsonDataKey in jsonData)) {
      throw new Error("No restaurant data found in request");
    }
    const resturantDataStr: string = jsonData[restaurantJsonDataKey];
    const restaurantHtml = htmlLoad(resturantDataStr);

    const placesData = await readPlaces();
    let newRestaurants = await extractNewRestaurants(restaurantHtml, placesData);
    await writePlaces(placesData);

    if (newRestaurants.length === 0) {
      throw new Error("No restaurants found in the provided data");
    }

    const existingRestaurants = await readRestaurants();
    newRestaurants = deduplicateRestaurants(existingRestaurants, newRestaurants);
    if (newRestaurants.length === 0) {
      throw new Error("No new restaurants found in the provided data");
    }

    await writeRestaurants(existingRestaurants, newRestaurants);

    return new Response("Saved restaurants.");
  } catch (error) {
    return new Response(`Error with request: ${error}`, {
      status: 500,
    })
  }
}

export const config: Config = {
  method: "POST",
  path: "/api/maps_upload",
  preferStatic: true
};
