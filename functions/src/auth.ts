import jsonwebtoken from "jsonwebtoken";
import { timingSafeEqual } from "crypto";

const adminUsername = Netlify.env.get("ADMIN_USERNAME");
const adminPassword = Netlify.env.get("ADMIN_PASSWORD");
const jwtSecret = Netlify.env.get("JWT_SECRET");

const bearerTokenPrefix = "Bearer ";

interface User {
  username: string;
  password: string;
}

interface JwtPayload {
  username: string;
  iat: number;
  exp: number;
}

// Returns a list of users from environment variables.
const getUsers: () => User[] = () => {
  if (!adminUsername || !adminPassword) {
    throw new Error("Admin credentials are not set in environment variables");
  }

  return [
    {
      username: adminUsername,
      password: adminPassword,
    },
  ];
}

// Compares two strings, timing-safe.
const safeCompare = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a, 'utf16le');
  const bufferB = Buffer.from(b, 'utf16le');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

// Checks if the provided credentials match any user.
export const checkCredentials = (username: string, password: string): boolean => {
  const users = getUsers();

  for (const user of users) {
    if (safeCompare(user.username, username) && safeCompare(user.password, password)) {
      return true;
    }
  }
  return false;
}

// Creates a JWT for the given username.
export const createJwt = (username: string): string => {
  if (!jwtSecret) {
    throw new Error("JWT secret is not set in environment variables");
  }

  const token = jsonwebtoken.sign({ username }, jwtSecret, { expiresIn: "2h" });
  return token;
}

// Gets the JWT token from the Authorization header of the request.
export const getJwt = (req: Request): string => {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith(bearerTokenPrefix)) {
    return '';
  }

  return authHeader.substring(bearerTokenPrefix.length);
}

// Validates the provided JWT and returns the username if valid.
export const validateJwt = (token: string): string => {
  if (!jwtSecret) {
    throw new Error("JWT secret is not set in environment variables");
  }

  if (!jsonwebtoken.verify(token, jwtSecret)) {
    throw new Error("Invalid JWT token");
  }

  const decoded = jsonwebtoken.decode(token) as JwtPayload | null;
  if (!decoded || !decoded.username) {
    throw new Error("Invalid JWT token payload");
  }

  return decoded.username;
}
