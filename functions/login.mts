import type { Context, Config } from "@netlify/functions";
import { checkCredentials, createJwt } from "./src/auth.ts";

const usernameJsonDataKey = "username";
const passwordJsonDataKey = "password";

export default async (req: Request, _context: Context) => {
  try {
    const jsonData = await req.json();
    if (!(usernameJsonDataKey in jsonData)) {
      throw new Error("No username found in request");
    }
    if (!(passwordJsonDataKey in jsonData)) {
      throw new Error("No password found in request");
    }
    const username: string = jsonData[usernameJsonDataKey];
    const password: string = jsonData[passwordJsonDataKey];

    if (!checkCredentials(username, password)) {
      return new Response("Invalid credentials.", {
        status: 401,
      });
    }

    const jwt = createJwt(username);
    const responseBody = JSON.stringify({ token: jwt }, null, 2);
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
  method: "POST",
  path: "/api/login",
  preferStatic: true
};
