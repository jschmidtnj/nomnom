import type { Context, Config } from "@netlify/functions";
import { CheerioAPI, load as htmlLoad } from "cheerio";
import { RestaurantItem, readRestaurants, writeRestaurants } from "./src/data_store.ts";
import { getJwt, validateJwt } from "./src/auth.ts";

const restaurantJsonDataKey = "data";

// Extracts restaurant data from the provided HTML content.
const extractNewRestaurants = (htmlContent: CheerioAPI): RestaurantItem[] => {
  const result: RestaurantItem[] = [];

  // TODO(joshua) - use CID here - https://stackoverflow.com/a/49374036 to get info about the place.

  htmlContent('a').each((_, element) => {
    const href = htmlContent(element).attr('href') || '';
    if (!href.startsWith('https://www.google.com/search')) {
      return;
    }
    // TODO(joshua) - make this the correct maps URL.
    const mapsUrl = href;
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

    const ratingText = (htmlContent(element).find('[aria-label*="Rated "]').attr('aria-label') || '').trim();
    console.log('ratingText: ', ratingText);
    const ratingMatch = ratingText.match(/Rated (\d+(\.\d+)?) out of 5/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    // TODO(joshua) - description is broken, need to fix.
    const descriptionText = htmlContent(element).find('div:contains("&nbsp;")').next().text().trim();
    console.log('descriptionText:', descriptionText);
    const numDollarSigns = descriptionText.split('$').length - 1;
    const priceLevel = '$'.repeat(numDollarSigns);
    const description = descriptionText.replaceAll('&nbsp;', '').replaceAll('·', '').replaceAll('$', '').trim();
    const cuisine = description.split(',')[0] || '';

    const imageElement = htmlContent(element).find('img').filter((_, img) => {
      const src = htmlContent(img).attr('src') || '';
      return src.startsWith('https://lh3.googleusercontent.com');
    }).first();
    const imageUrl = imageElement.attr('src') || '';
    console.log('imageUrl: ', imageUrl);

    // TODO(joshua) - add the correct address etc.
    const address = 'Address not available';
    const lat = 40.0;
    const lng = -74.0;

    if (docid && name && mapsUrl && imageUrl) {
      result.push({
        docid,
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
