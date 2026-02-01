import type { Context, Config } from "@netlify/functions";
import { writeRestaurants } from "./src/data_store.ts";
import { getJwt, validateJwt } from "./src/auth.ts";

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

    await writeRestaurants([], []);

    return new Response("Deleted restaurants.");
  } catch (error) {
    return new Response(`Error with request: ${error}`, {
      status: 500,
    })
  }
}

export const config: Config = {
  method: "DELETE",
  path: "/api/delete_restaurants",
  preferStatic: true
};
