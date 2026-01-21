import type { Context, Config } from "@netlify/functions";
import { readRestaurants } from "./data_store.ts";

export default async (_req: Request, _context: Context) => {
  try {
    const restaurants = await readRestaurants();
    if (restaurants.length === 0) {
      return new Response("No restaurants found.", {
        status: 404,
      });
    }

    const responseBody = JSON.stringify(restaurants, null, 2);
    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(`Error with request: ${error}`, {
      status: 500,
    })
  }
}

export const config: Config = {
  method: "GET",
  path: "/api/restaurants.json",
  preferStatic: true
};
