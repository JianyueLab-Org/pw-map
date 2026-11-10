import { createHash, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Requires `Authorization: Bearer <ADMIN_TOKEN>`. Rejects all requests when ADMIN_TOKEN is unset. */
export const requireAdmin = (event: H3Event) => {
  const expected = process.env.ADMIN_TOKEN ?? "";
  const header = getHeader(event, "authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (
    !expected ||
    !provided ||
    !timingSafeEqual(digest(provided), digest(expected))
  ) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
};
