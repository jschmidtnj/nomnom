import type { Context, Config } from "@netlify/functions";
import { CheerioAPI, load as htmlLoad } from "cheerio";
import { RestaurantItem, readRestaurants, writeRestaurants } from "./src/data_store.ts";
import { getJwt, validateJwt } from "./src/auth.ts";

const restaurantJsonDataKey = "data";

// Extracts restaurant data from the provided HTML content.
const extractNewRestaurants = (htmlContent: CheerioAPI): RestaurantItem[] => {
  const result: RestaurantItem[] = [];

  htmlContent('div.restaurant-card').each((_, element) => {
    const name = htmlContent(element).find('h2.restaurant-name').text().trim();
    const address = htmlContent(element).find('p.restaurant-address').text().trim();
    const lat = parseFloat(htmlContent(element).find('meta[itemprop="latitude"]').attr('content') || '0');
    const lng = parseFloat(htmlContent(element).find('meta[itemprop="longitude"]').attr('content') || '0');
    const cuisine = htmlContent(element).find('span.cuisine-type').text().trim();
    const rating = parseFloat(htmlContent(element).find('span.rating-value').text().trim());
    const priceLevel = htmlContent(element).find('span.price-level').text().trim();
    const description = htmlContent(element).find('p.restaurant-description').text().trim();
    const mapsUrl = htmlContent(element).find('a.maps-link').attr('href') || '';
    const imageUrl = htmlContent(element).find('img.restaurant-image').attr('src') || '';

    if (name && address && lat && lng && cuisine && rating && priceLevel && description && mapsUrl && imageUrl) {
      result.push({
        name,
        address,
        lat,
        lng,
        cuisine,
        rating,
        priceLevel,
        description,
        mapsUrl,
        imageUrl
      });
    }
  });

  return result;
}

// Deduplicates restaurants based on their Maps URL.
const deduplicateRestaurants = (existing: RestaurantItem[], extracted: RestaurantItem[]): RestaurantItem[] => {
  const existingSet = new Set(existing.map(r => r.mapsUrl));

  return extracted.filter(restaurant => !existingSet.has(restaurant.mapsUrl));
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

    let newRestaurants = extractNewRestaurants(restaurantHtml);
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
